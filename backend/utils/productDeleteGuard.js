/**
 * Kiểm tra trước khi DELETE san_pham: chặn nếu còn dòng chi_tiet_don_hang hoặc danh_gia_san_pham.
 * Trả về string lý do hoặc null nếu được phép xóa.
 */
async function getProductDeleteBlockReason(pool, maSanPham) {
  const id = String(maSanPham || '').trim().slice(0, 20)
  if (!id) return 'Thiếu mã sản phẩm.'

  const [[row]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM chi_tiet_don_hang WHERE ma_san_pham = ?) AS order_lines`,
    [id]
  )
  const orderLines = Number(row?.order_lines) || 0
  if (orderLines > 0) {
    return `Không thể xóa: sản phẩm đã xuất hiện trong ${orderLines} dòng đơn hàng. Hãy chuyển trạng thái sang «Ngừng bán» thay vì xóa.`
  }

  try {
    const [[rv]] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM danh_gia_san_pham WHERE ma_san_pham = ?) AS reviews`,
      [id]
    )
    const reviews = Number(rv?.reviews) || 0
    if (reviews > 0) {
      return `Không thể xóa: còn ${reviews} đánh giá gắn với sản phẩm này.`
    }
  } catch {
    /* bảng đánh giá có thể chưa tồn tại trên DB cũ */
  }
  return null
}

module.exports = { getProductDeleteBlockReason }
