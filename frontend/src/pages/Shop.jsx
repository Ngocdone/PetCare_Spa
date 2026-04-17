/**
 * Trang cửa hàng: tải sản phẩm + danh mục, lọc theo pet/category, lưới ProductCard.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api/products.js'
import { fetchAdminCategories } from '../api/adminApi.js'
import ProductCard from '../components/ProductCard.jsx'

const PER_PAGE = 9

const PRICE_OPTIONS = [
  { id: 'all', label: 'Tất cả giá' },
  { id: '0-100000', label: 'Dưới 100.000₫' },
  { id: '100000-200000', label: '100.000 - 200.000₫' },
  { id: '200000-500000', label: '200.000 - 500.000₫' },
  { id: '500000-', label: 'Trên 500.000₫' },
]

function categoryLabel(slug) {
  const map = {
    'thuc-an': 'Thức ăn',
    'thuc-an-cho': 'Thức ăn chó',
    'thuc-an-meo': 'Thức ăn mèo',
    'phu-kien': 'Phụ kiện',
    'do-choi': 'Đồ chơi',
    'cham-soc': 'Chăm sóc',
    'cham-soc-cho': 'Chăm sóc chó',
    'cham-soc-meo': 'Chăm sóc mèo',
    'tat-ca': 'Tất cả',
  }
  const key = String(slug || '').trim().toLowerCase()
  if (!key) return 'Khác'
  if (map[key]) return map[key]
  return key.replace(/-/g, ' ')
}

function inferParentCategory(id) {
  const key = String(id || '').trim().toLowerCase()
  if (key === 'thc-n-ch') return 'thuc-an'
  return null
}

function normalizeParentForDisplay(parentId) {
  const key = String(parentId || '').trim().toLowerCase()
  if (!key || key === 'tat-ca') return null
  return parentId
}

function normalizeCategoryNameKey(name) {
  return String(name || '')
    .trim()
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Hai mã danh mục gốc cùng tên (vd. thuc-an vs thc-n) → một dòng; map cụm để lọc/đếm vẫn đúng. */
function mergeDuplicateRootNames(list) {
  const all = list
  const rootsByName = new Map()
  for (const row of all) {
    if (row.id === 'all' || row.parentId) continue
    const key = normalizeCategoryNameKey(row.name)
    if (!rootsByName.has(key)) rootsByName.set(key, [])
    rootsByName.get(key).push(row)
  }
  const clusterByMember = new Map()
  const dropIds = new Set()
  const parentIdRewrite = new Map()
  for (const group of rootsByName.values()) {
    if (group.length <= 1) continue
    const childCount = (r) =>
      all.filter(
        (x) => x.id !== 'all' && String(x.parentId) === String(r.id)
      ).length
    const keep = [...group].sort((a, b) => {
      const d = childCount(b) - childCount(a)
      if (d !== 0) return d
      return String(a.id).localeCompare(String(b))
    })[0]
    const members = new Set(group.map((g) => String(g.id)))
    members.forEach((id) => clusterByMember.set(id, members))
    for (const r of group) {
      if (String(r.id) !== String(keep.id)) {
        dropIds.add(String(r.id))
        parentIdRewrite.set(String(r.id), String(keep.id))
      }
    }
  }
  const merged = all
    .filter((row) => !dropIds.has(String(row.id)))
    .map((row) => {
      const pid = row.parentId != null ? String(row.parentId) : ''
      if (pid && parentIdRewrite.has(pid)) {
        return { ...row, parentId: parentIdRewrite.get(pid) }
      }
      return row
    })
  return {
    list: merged,
    clusterByMember,
  }
}

function allDescendantCategoryIdsFromMap(rootId, childrenByParent) {
  const out = []
  const walk = (id) => {
    const kids = childrenByParent.get(id) || []
    kids.forEach((k) => {
      out.push(k)
      walk(k)
    })
  }
  walk(String(rootId))
  return out
}

/** Đã chọn thêm ít nhất một danh mục con (không phải chính sel) trong cây của sel. */
function hasStrictDescendantSelected(sel, catSelSet, childrenByParent) {
  const s = String(sel)
  const desc = new Set(
    allDescendantCategoryIdsFromMap(s, childrenByParent).map(String)
  )
  for (const id of catSelSet) {
    const i = String(id)
    if (i !== s && desc.has(i)) return true
  }
  return false
}

/** Cùng mã danh mục không được xuất hiện hai lần (tránh trùng key React / hai dòng giống nhau). */
function dedupeCategoryRowsById(rows) {
  const m = new Map()
  for (const row of rows) {
    const id = String(row.id)
    if (!m.has(id)) {
      m.set(id, row)
      continue
    }
    const prev = m.get(id)
    if (!row.parentId && prev.parentId) m.set(id, row)
  }
  return Array.from(m.values())
}

function dedupeOrderedCategoryList(rows) {
  const seen = new Set()
  const out = []
  for (const row of rows) {
    const id = String(row.id)
    if (seen.has(id)) continue
    seen.add(id)
    out.push(row)
  }
  return out
}

function matchesPrice(p, rangeId) {
  if (rangeId === 'all') return true
  const parts = rangeId.split('-')
  const min = parts[0] ? parseInt(parts[0].replace(/\D/g, ''), 10) : null
  const max = parts[1] ? parseInt(parts[1].replace(/\D/g, ''), 10) : null
  if (min != null && p.price < min) return false
  if (max != null && max > 0 && p.price > max) return false
  return true
}

function matchesPet(p, selected) {
  if (selected.includes('all') || selected.length === 0) return true
  const pt = p.petType || 'both'
  if (pt === 'both') return true
  return selected.includes(pt)
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(1)
  const [petSel, setPetSel] = useState(['all'])
  const [catSel, setCatSel] = useState(['all'])
  const [priceSel, setPriceSel] = useState(['all'])
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => setProducts([]))
    fetchAdminCategories()
      .then((rows) => setCategories(Array.isArray(rows) ? rows : []))
      .catch(() => setCategories([]))
  }, [])

  const categoryChildrenByParent = useMemo(() => {
    const m = new Map()
    categories.forEach((c) => {
      const id = String(c.id || '').trim()
      const pid = normalizeParentForDisplay(String(c.parentId || '').trim())
      if (!pid) return
      if (!m.has(pid)) m.set(pid, [])
      m.get(pid).push(id)
    })
    return m
  }, [categories])

  const { categoryList, rootClusterByMember } = useMemo(() => {
    const usedIds = new Set(products.map((p) => String(p.category || '').trim()).filter(Boolean))
    const byId = new Map(
      categories.map((c) => [String(c.id || '').trim(), c])
    )
    const list = [{ id: 'all', name: 'Tất cả', parentId: null, isChild: false }]
    usedIds.forEach((id) => {
      const raw = byId.get(id)
      const parentIdRaw = String(raw?.parentId || '').trim()
      const parentId = normalizeParentForDisplay(parentIdRaw) || inferParentCategory(id)
      list.push({
        id,
        name: String(raw?.name || categoryLabel(id)).trim(),
        parentId: parentId || null,
        isChild: Boolean(parentId),
      })
    })
    // Cha không có sản phẩm trực tiếp vẫn phải hiện để cây khớp admin (vd. Thức ăn → Hạt, Pate)
    let missingParent = true
    while (missingParent) {
      missingParent = false
      const have = new Set(list.map((x) => String(x.id)))
      for (const row of list) {
        if (row.id === 'all') continue
        const pid = row.parentId
        if (!pid || have.has(String(pid))) continue
        const raw = byId.get(String(pid))
        const parentIdRaw = String(raw?.parentId || '').trim()
        const pParent =
          normalizeParentForDisplay(parentIdRaw) || inferParentCategory(pid)
        list.push({
          id: String(pid),
          name: String(raw?.name || categoryLabel(pid)).trim(),
          parentId: pParent || null,
          isChild: Boolean(pParent),
        })
        missingParent = true
      }
    }
    const { list: mergedList, clusterByMember } = mergeDuplicateRootNames(list)
    const items = dedupeCategoryRowsById(mergedList.slice(1))
    const parents = items
      .filter((x) => !x.parentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    const children = items
      .filter((x) => x.parentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    const childrenByParent = new Map()
    children.forEach((c) => {
      const key = String(c.parentId || '')
      if (!childrenByParent.has(key)) childrenByParent.set(key, [])
      childrenByParent.get(key).push(c)
    })
    const ordered = []
    parents.forEach((p) => {
      ordered.push(p)
      const subs = childrenByParent.get(String(p.id)) || []
      ordered.push(...subs)
      childrenByParent.delete(String(p.id))
    })
    // fallback nếu có con nhưng cha không có trong danh sách đang dùng
    for (const subs of childrenByParent.values()) ordered.push(...subs)
    return {
      categoryList: dedupeOrderedCategoryList([mergedList[0], ...ordered]),
      rootClusterByMember: clusterByMember,
    }
  }, [products, categories])

  function categoryFilterIdSet(sel) {
    const cluster = rootClusterByMember.get(String(sel))
    const roots = cluster ? [...cluster] : [String(sel)]
    const ids = new Set()
    for (const rid of roots) {
      ids.add(rid)
      for (const d of allDescendantCategoryIdsFromMap(
        rid,
        categoryChildrenByParent
      )) {
        ids.add(d)
      }
    }
    return ids
  }

  /** Mã trên sản phẩm có thể là alias (thuc-an vs thc-n) — mở rộng để khớp lọc. */
  function expandProductCategoryIds(pCat) {
    const k = String(pCat || '').trim()
    const s = new Set([k])
    const cluster = rootClusterByMember.get(k)
    if (cluster) cluster.forEach((id) => s.add(String(id)))
    return s
  }

  /** Gộp mã được phép: nếu đã chọn con thì bỏ qua bộ mở rộng của cha (chỉ lọc theo các mục đã chọn). */
  function allowedCategoryIdsForProducts(catSelArr) {
    const picked = catSelArr.filter((x) => x !== 'all')
    if (picked.length === 0) return null
    const catSelSet = new Set(picked.map((x) => String(x)))
    const out = new Set()
    for (const sel of picked) {
      if (
        hasStrictDescendantSelected(
          sel,
          catSelSet,
          categoryChildrenByParent
        )
      ) {
        continue
      }
      categoryFilterIdSet(sel).forEach((id) => out.add(String(id)))
    }
    return out
  }

  const filtered = useMemo(() => {
    const allowedIds = allowedCategoryIdsForProducts(catSel)
    let r = products.filter((p) => {
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      const matchPet = matchesPet(p, petSel)
      const pCat = String(p.category || '').trim()
      const pVariants = expandProductCategoryIds(pCat)
      const matchCat =
        catSel.includes('all') ||
        catSel.length === 0 ||
        (allowedIds &&
          allowedIds.size > 0 &&
          [...pVariants].some((v) => allowedIds.has(String(v))))
      const matchPrice =
        priceSel.includes('all') ||
        priceSel.some((id) => matchesPrice(p, id))
      return matchSearch && matchPet && matchCat && matchPrice
    })
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') r = [...r].sort((a, b) => b.price - a.price)
    return r
  }, [
    products,
    search,
    sort,
    petSel,
    catSel,
    priceSel,
    categories,
    rootClusterByMember,
    categoryChildrenByParent,
  ])

  useEffect(() => {
    setPage(1)
  }, [filtered.length, search, sort, petSel, catSel, priceSel])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const togglePet = useCallback((id) => {
    if (id === 'all') setPetSel(['all'])
    else {
      setPetSel((prev) => {
        let next = prev.filter((x) => x !== 'all')
        if (next.includes(id)) next = next.filter((x) => x !== id)
        else next = [...next, id]
        if (next.length === 0) return ['all']
        return next
      })
    }
  }, [])

  const toggleCat = useCallback((id) => {
    if (id === 'all') setCatSel(['all'])
    else {
      setCatSel((prev) => {
        let next = prev.filter((x) => x !== 'all')
        if (next.includes(id)) next = next.filter((x) => x !== id)
        else next = [...next, id]
        if (next.length === 0) return ['all']
        return next
      })
    }
  }, [])

  const togglePrice = useCallback((id) => {
    if (id === 'all') setPriceSel(['all'])
    else {
      setPriceSel((prev) => {
        let next = prev.filter((x) => x !== 'all')
        if (next.includes(id)) next = next.filter((x) => x !== id)
        else next = [...next, id]
        if (next.length === 0) return ['all']
        return next
      })
    }
  }, [])

  function countPet(id) {
    if (id === 'all') return products.length
    return products.filter((p) => {
      const pt = p.petType || 'both'
      return pt === id || pt === 'both'
    }).length
  }

  function countCat(catId) {
    if (catId === 'all') {
      if (petSel.includes('all') || petSel.length === 0) return products.length
      return products.filter((p) => matchesPet(p, petSel)).length
    }
    const ids = categoryFilterIdSet(catId)
    return products.filter((p) => {
      const variants = expandProductCategoryIds(String(p.category || '').trim())
      const inCat = [...variants].some((v) => ids.has(v))
      return inCat && matchesPet(p, petSel)
    }).length
  }

  function isChildCategoryRowVisible(c) {
    if (!c.isChild) return true
    const pid = String(c.parentId || '')
    return catSel.includes(pid) || catSel.includes(c.id)
  }

  const filterCount =
    (petSel.includes('all') ? 0 : petSel.length) +
    (catSel.includes('all') ? 0 : catSel.length) +
    (priceSel.includes('all') ? 0 : priceSel.length)

  return (
    <main className="page-main page-main--shop">
      <section className="shop-hero">
        <div className="shop-hero__bg" />
        <div className="container shop-hero__inner">
          <h1 className="shop-hero__title">Thức ăn &amp; Phụ kiện thú cưng</h1>
          <p className="shop-hero__subtitle">
            Sản phẩm chính hãng, giao nhanh. Chăm sóc bé từng bữa ăn.
          </p>
        </div>
      </section>

      <section className="section section--shop">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <ol className="breadcrumb__list">
              <li className="breadcrumb__item">
                <Link to="/" className="breadcrumb__link">
                  Trang chủ
                </Link>
              </li>
              <li className="breadcrumb__item">
                <span className="breadcrumb__current">Cửa hàng</span>
              </li>
            </ol>
          </nav>

          <div className="shop-layout">
            <div className="shop-mobile-filter-bar">
              <div className="shop-mobile-chips" id="shopMobileChips">
                {['all', 'cho', 'meo'].map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`shop-chip${petSel.includes(id) || (id === 'all' && petSel.includes('all')) ? ' active' : ''}`}
                    onClick={() => togglePet(id)}
                  >
                    {id === 'all' ? 'Tất cả' : id === 'cho' ? 'Chó' : 'Mèo'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="shop-filter-btn"
                id="shopFilterBtn"
                onClick={() => setSheetOpen(true)}
              >
                <span>Lọc</span>
                <span className="shop-filter-btn__count" id="shopFilterCount">
                  {filterCount}
                </span>
              </button>
            </div>

            <div
              className="shop-filter-overlay"
              id="shopFilterOverlay"
              aria-hidden={!sheetOpen}
              onClick={() => setSheetOpen(false)}
              style={{ display: sheetOpen ? 'block' : undefined }}
            />
            <div
              className={`shop-filter-sheet${sheetOpen ? ' open' : ''}`}
              id="shopFilterSheet"
              role="dialog"
              aria-hidden={!sheetOpen}
            >
              <div className="shop-filter-sheet__header">
                <h2 className="shop-filter-sheet__title" id="shopFilterTitle">
                  Bộ lọc
                </h2>
                <button
                  type="button"
                  className="shop-filter-sheet__close"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Đóng"
                >
                  Đóng
                </button>
              </div>
              <div className="shop-filter-sheet__body">
                <div className="shop-filter-sheet__section">
                  <h3 className="shop-filter-sheet__label">Loại thú cưng</h3>
                  <div className="shop-filter-sheet__chips">
                    {['all', 'cho', 'meo'].map((id) => (
                      <button
                        key={id}
                        type="button"
                        className={`shop-chip${petSel.includes(id) || (id === 'all' && petSel.includes('all')) ? ' active' : ''}`}
                        onClick={() => togglePet(id)}
                      >
                        {id === 'all' ? 'Tất cả' : id === 'cho' ? 'Chó' : 'Mèo'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="shop-filter-sheet__section">
                  <h3 className="shop-filter-sheet__label">Danh mục</h3>
                  <div className="shop-filter-sheet__chips">
                    {categoryList
                      .filter(isChildCategoryRowVisible)
                      .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`shop-chip${catSel.includes(c.id) || (c.id === 'all' && catSel.includes('all')) ? ' active' : ''}`}
                        onClick={() => toggleCat(c.id)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="shop-filter-sheet__section">
                  <h3 className="shop-filter-sheet__label">Khoảng giá</h3>
                  <div className="shop-filter-sheet__chips">
                    {PRICE_OPTIONS.map((pr) => (
                      <button
                        key={pr.id}
                        type="button"
                        className={`shop-chip${priceSel.includes(pr.id) || (pr.id === 'all' && priceSel.includes('all')) ? ' active' : ''}`}
                        onClick={() => togglePrice(pr.id)}
                      >
                        {pr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shop-filter-sheet__footer">
                <button
                  type="button"
                  className="btn btn--primary shop-filter-sheet__apply"
                  onClick={() => setSheetOpen(false)}
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <aside className="shop-sidebar" id="shopSidebar">
              <div className="shop-sidebar__section">
                <h3 className="shop-sidebar__title">LOẠI THÚ CƯNG</h3>
                <ul className="shop-sidebar__list" id="sidebarPetType">
                  {['all', 'cho', 'meo'].map((id) => {
                    const label =
                      id === 'all' ? 'Tất cả' : id === 'cho' ? 'Chó' : 'Mèo'
                    const n = countPet(id)
                    const active =
                      petSel.includes(id) || (id === 'all' && petSel.includes('all'))
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className={`shop-sidebar__link${active ? ' active' : ''}`}
                          data-pet={id}
                          onClick={() => togglePet(id)}
                        >
                          <span className="shop-sidebar__link-inner shop-sidebar__link-inner--check">
                            <span
                              className={`shop-sidebar__check${active ? ' is-checked' : ''}`}
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                            <span className="shop-sidebar__link-text">
                              {label}
                            </span>
                          </span>
                          {n > 0 ? (
                            <span className="shop-sidebar__count">{n}</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="shop-sidebar__section">
                <h3 className="shop-sidebar__title">DANH MỤC SẢN PHẨM</h3>
                <ul className="shop-sidebar__list" id="sidebarProductCat">
                  {categoryList.filter(isChildCategoryRowVisible).map((c) => {
                    const n = countCat(c.id)
                    const active =
                      catSel.includes(c.id) || (c.id === 'all' && catSel.includes('all'))
                    return (
                      <li
                        key={c.id}
                        className={c.isChild ? 'shop-sidebar__item--child' : ''}
                      >
                        <button
                          type="button"
                          className={`shop-sidebar__link${active ? ' active' : ''}`}
                          data-category={c.id}
                          onClick={() => toggleCat(c.id)}
                        >
                          <span className="shop-sidebar__link-inner shop-sidebar__link-inner--check">
                            <span
                              className={`shop-sidebar__check${active ? ' is-checked' : ''}`}
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                            <span className="shop-sidebar__link-text">
                              {c.isChild ? `↳ ${c.name}` : c.name}
                            </span>
                          </span>
                          {n > 0 ? (
                            <span className="shop-sidebar__count">{n}</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="shop-sidebar__section">
                <h3 className="shop-sidebar__title">GIÁ SẢN PHẨM</h3>
                <ul
                  className="shop-sidebar__list shop-sidebar__list--price"
                  id="sidebarPrice"
                >
                  {PRICE_OPTIONS.map((pr) => (
                    <li key={pr.id}>
                      <button
                        type="button"
                        className={`shop-sidebar__link${priceSel.includes(pr.id) || (pr.id === 'all' && priceSel.includes('all')) ? ' active' : ''}`}
                        data-price={pr.id}
                        onClick={() => togglePrice(pr.id)}
                      >
                        <span className="shop-sidebar__link-inner shop-sidebar__link-inner--check">
                          <span
                            className={`shop-sidebar__check${
                              priceSel.includes(pr.id) ||
                              (pr.id === 'all' && priceSel.includes('all'))
                                ? ' is-checked'
                                : ''
                            }`}
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                          {pr.label}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="shop-main">
              <div className="shop-main__top">
                <div className="shop-search">
                  <input
                    type="search"
                    id="shopSearch"
                    placeholder="Tìm sản phẩm..."
                    className="shop-search__input"
                    autoComplete="off"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="shop-sort">
                  <label htmlFor="shopSort">Sắp xếp:</label>
                  <select
                    id="shopSort"
                    className="shop-sort__select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="default">Mới nhất</option>
                    <option value="price-asc">Giá thấp đến cao</option>
                    <option value="price-desc">Giá cao đến thấp</option>
                  </select>
                </div>
              </div>
              <p className="shop-results" id="shopResults">
                {filtered.length} sản phẩm
                {totalPages > 1
                  ? ` (trang ${page}/${totalPages})`
                  : ''}
              </p>
              <div className="shop-grid" id="shopGrid">
                {slice.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {totalPages > 1 ? (
                <div className="shop-pagination" id="shopPagination">
                  <div className="shop-pagination__inner">
                    <button
                      type="button"
                      className="shop-pagination__btn shop-pagination__prev"
                      disabled={page <= 1}
                      aria-label="Trang trước"
                      onClick={() => setPage((x) => Math.max(1, x - 1))}
                    >
                      ‹
                    </button>
                    <div className="shop-pagination__pages">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (i) => (
                          <button
                            key={i}
                            type="button"
                            className={`shop-pagination__page${i === page ? ' shop-pagination__page--active' : ''}`}
                            onClick={() => setPage(i)}
                          >
                            {i}
                          </button>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      className="shop-pagination__btn shop-pagination__next"
                      disabled={page >= totalPages}
                      aria-label="Trang sau"
                      onClick={() =>
                        setPage((x) => Math.min(totalPages, x + 1))
                      }
                    >
                      ›
                    </button>
                  </div>
                </div>
              ) : null}
              <div
                className={`shop-empty${filtered.length ? '' : ' is-visible'}`}
                id="shopEmpty"
              >
                <p>Không tìm thấy sản phẩm phù hợp.</p>
                <span>Thử đổi từ khóa hoặc bộ lọc.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
