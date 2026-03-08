// Mock data for Pet Spa & Shop
export const DATA = {
  services: [
    {
      id: 's1',
      name: 'Cắt tỉa lông',
      slug: 'cat-tia-long',
      description: 'Cắt tỉa chuyên nghiệp theo từng giống chó/mèo, tạo kiểu đẹp mắt.',
      priceDog: 150000,
      priceCat: 120000,
      duration: 60,
      image: '/img/cat-tia-long.jpg',
      featured: true,
      category: 'grooming',
      petType: 'both'
    },
    {
      id: 's2',
      name: 'Tắm & Vệ sinh',
      slug: 'tam-ve-sinh',
      description: 'Tắm sạch với sữa tắm chuyên dụng, vệ sinh tai, cắt móng.',
      priceDog: 120000,
      priceCat: 100000,
      duration: 45,
      image: '/img/tam-ve-sinh.jpg',
      featured: true,
      category: 'bath',
      petType: 'both'
    },
    {
      id: 's3',
      name: 'Spa toàn diện',
      slug: 'spa-toan-dien',
      description: 'Gói spa cao cấp: tắm, massage, đắp mặt nạ, cắt tỉa.',
      priceDog: 350000,
      priceCat: 280000,
      duration: 120,
      image: '/img/spa-toan-dien.jpg',
      featured: true,
      category: 'spa',
      petType: 'both'
    },
    {
      id: 's4',
      name: 'Khách sạn thú cưng',
      slug: 'khach-san-thu-cung',
      description: 'Giữ thú cưng an toàn, có camera 24/7, chơi và ăn uống đầy đủ.',
      priceDog: 200000,
      priceCat: 180000,
      duration: 24,
      unit: 'ngày',
      image: '/img/khach-san-thu-cung.jpg',
      featured: true,
      category: 'hotel',
      petType: 'both'
    },
    {
      id: 's5',
      name: 'Vệ sinh răng miệng',
      slug: 've-sinh-rang-mieng',
      description: 'Lấy cao răng, đánh bóng, kiểm tra sức khỏe răng miệng.',
      priceDog: 180000,
      priceCat: 150000,
      duration: 30,
      image: '/img/ve-sinh-rang-mieng.jpg',
      featured: false,
      category: 'care',
      petType: 'both'
    }
  ],

  products: [
    {
      id: 'p1',
      name: 'Sữa tắm chó mèo Organic',
      slug: 'sua-tam-organic',
      price: 89000,
      oldPrice: 120000,
      category: 'cham-soc',
      petType: 'both',
      image: '/img/sua-tam-organic.jpg',
      rating: 4.8,
      bestSeller: true,
      description: 'Sữa tắm organic dịu nhẹ, không gây kích ứng da.'
    },
    {
      id: 'p2',
      name: 'Thức ăn hạt Premium cho chó',
      slug: 'thuc-an-hat-premium-cho',
      price: 250000,
      category: 'thuc-an',
      petType: 'cho',
      image: '/img/thuc-an-hat-premium-cho.jpg',
      rating: 4.9,
      bestSeller: true,
      description: 'Cân bằng dinh dưỡng, da lông bóng mượt.'
    },
    {
      id: 'p3',
      name: 'Dây dắt da cao cấp',
      slug: 'day-dat-da-cao-cap',
      price: 150000,
      category: 'phu-kien',
      petType: 'cho',
      image: '/img/day-dat-da-cao-cap.jpg',
      rating: 4.7,
      bestSeller: true,
      description: 'Da thật, bền đẹp, nhiều màu.'
    },
    {
      id: 'p4',
      name: 'Đồ chơi gặm xương cao su',
      slug: 'do-choi-gam-xuong',
      price: 65000,
      category: 'do-choi',
      petType: 'cho',
      image: '/img/do-choi-gam-xuong.jpg',
      rating: 4.6,
      bestSeller: true,
      description: 'An toàn, giúp vệ sinh răng.'
    },
    {
      id: 'p5',
      name: 'Bàn chải lông mềm',
      slug: 'ban-chai-long-mem',
      price: 45000,
      category: 'cham-soc',
      petType: 'both',
      image: '/img/ban-chai-long-mem.jpg',
      rating: 4.5,
      bestSeller: false,
      description: 'Chải lông mượt, không đau da.'
    },
    {
      id: 'p6',
      name: 'Thức ăn hạt cho mèo',
      slug: 'thuc-an-hat-cho-meo',
      price: 180000,
      category: 'thuc-an',
      petType: 'meo',
      image: '/img/thuc-an-hat-cho-meo.jpg',
      rating: 4.8,
      bestSeller: true,
      description: 'Công thức cho mèo trưởng thành.'
    },
    {
      id: 'p7',
      name: 'Vòng cổ đeo chuông',
      slug: 'vong-co-deo-chuong',
      price: 55000,
      category: 'phu-kien',
      petType: 'both',
      image: '/img/vong-co-deo-chuong.jpg',
      rating: 4.4,
      bestSeller: false,
      description: 'Nhẹ, đẹp, chuông inox.'
    },
    {
      id: 'p8',
      name: 'Cầu lông có catnip',
      slug: 'cau-long-catnip',
      price: 35000,
      category: 'do-choi',
      petType: 'meo',
      image: '/img/cau-long-catnip.jpg',
      rating: 4.7,
      bestSeller: true,
      description: 'Mèo mê tít với catnip.'
    },
    {
      id: 'p9',
      name: 'Túi vận chuyển thú cưng',
      slug: 'tui-van-chuyen-thu-cung',
      price: 320000,
      oldPrice: 380000,
      category: 'phu-kien',
      petType: 'both',
      image: '/img/tui-van-chuyen-thu-cung.jpg',
      rating: 4.8,
      bestSeller: true,
      description: 'Túi thoáng khí, an toàn khi di chuyển.'
    },
    {
      id: 'p10',
      name: 'Pate thịt gà cho mèo',
      slug: 'pate-thit-ga-cho-meo',
      price: 28000,
      category: 'thuc-an',
      petType: 'meo',
      image: '/img/pate-thit-ga-cho-meo.jpg',
      rating: 4.9,
      bestSeller: true,
      description: 'Pate mềm, giàu đạm, mèo thích mê.'
    },
    {
      id: 'p11',
      name: 'Bát ăn inox chống trượt',
      slug: 'bat-an-inox-chong-truot',
      price: 75000,
      category: 'phu-kien',
      petType: 'both',
      image: '/img/bat-an-inox-chong-truot.jpg',
      rating: 4.7,
      bestSeller: false,
      description: 'Bát inox bền, đáy cao su chống trượt.'
    },
    {
      id: 'p12',
      name: 'Snack sấy khô cho chó',
      slug: 'snack-say-kho-cho-cho',
      price: 55000,
      oldPrice: 65000,
      category: 'thuc-an',
      petType: 'cho',
      image: '/img/snack-say-kho-cho-cho.jpg',
      rating: 4.8,
      bestSeller: true,
      description: 'Snack thịt bò sấy, thơm ngon.'
    }
  ],

  productCategories: [
    { id: 'all', name: 'Tất cả', icon: 'fa-layer-group' },
    { id: 'cho', name: 'Chó', icon: 'fa-dog' },
    { id: 'meo', name: 'Mèo', icon: 'fa-cat' },
    { id: 'thuc-an', name: 'Thức ăn', icon: 'fa-bowl-food' },
    { id: 'cham-soc', name: 'Chăm sóc', icon: 'fa-spa' },
    { id: 'phu-kien', name: 'Phụ kiện', icon: 'fa-bag-shopping' },
    { id: 'do-choi', name: 'Đồ chơi', icon: 'fa-baseball-ball' }
  ],

  team: [
    { id: 't1', name: 'Nguyễn Ngọc Đô', role: 'Senior Groomer', experience: '8 năm', image: '/img/nnd.jpg' },
    { id: 't2', name: 'Nguyễn Ngọc Thiện', role: 'Spa Specialist', experience: '6 năm', image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300' },
    { id: 't3', name: 'Phạm Võ Thành Hưng', role: 'Pet Stylist', experience: '5 năm', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' }
  ],

  testimonials: [
    { id: 'rev1', author: 'Chị Mai Anh', pet: 'Bé Cún', petImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200', text: 'Spa xong bé nhà mình thơm, lông mượt. Nhân viên rất nhiệt tình!', rating: 5 },
    { id: 'rev2', author: 'Anh Hoàng', pet: 'Mèo Tôm', petImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200', text: 'Lần đầu đưa Tôm đi spa, bé hợp tác lắm. Sẽ quay lại.', rating: 5 },
    { id: 'rev3', author: 'Chị Linh', pet: 'Milu', petImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=200', text: 'Gói spa toàn diện đáng đồng tiền. Milu về nhà vui lắm.', rating: 5 }
  ],

  faqs: [
    { id: 'f1', q: 'Đặt lịch có cần đặt cọc không?', a: 'Bạn không cần đặt cọc. Chỉ thanh toán khi hoàn thành dịch vụ.' },
    { id: 'f2', q: 'Có đưa đón thú cưng không?', a: 'Có. Chúng tôi hỗ trợ đưa đón trong bán kính 5km với phí nhỏ.' },
    { id: 'f3', q: 'Thú cưng có được xem camera không?', a: 'Có. Bạn có thể xem trực tiếp qua app khi bé đang làm dịch vụ.' },
    { id: 'f4', q: 'Có dịch vụ cho mèo không?', a: 'Có. Chúng tôi có gói riêng cho mèo với không gian yên tĩnh.' }
  ],

  brands: ['Royal Canin', 'Pedigree', 'Whiskas', 'Hills', 'Organic Pet', 'PetSafe'],

  gallery: [
    { id: 'g1', src: '/img/sau-tam.jpg', title: 'Sau tắm', category: 'after' },
    { id: 'g2', src: '/img/cat-tia.jpg', title: 'Cắt tỉa', category: 'grooming' },
    { id: 'g3', src: '/img/spa.jpg', title: 'Spa', category: 'spa' },
    { id: 'g4', src: '/img/meo.jpg', title: 'Mèo', category: 'cat' },
    { id: 'g5', src: '/img/vui-ve.jpg', title: 'Vui vẻ', category: 'happy' },
    { id: 'g6', src: '/img/cham-soc.jpg', title: 'Chăm sóc', category: 'care' }
  ],

  adminUser: { email: 'admin@petspa.vn', password: 'admin123', role: 'admin' }
}

// Helper function to get image URL
export function getProductImageSrc(src) {
  if (!src || typeof src !== 'string') return src || ''
  const t = src.trim()
  if (/^https?:\/\//i.test(t) || t.indexOf('/') === 0) return t
  if (t.indexOf('/') === -1) return 'img/' + t
  return t
}

// Format price to VND
export function formatPrice(n) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

// Render stars rating
export function renderStars(rating) {
  const r = Math.min(5, Math.max(0, parseFloat(rating) || 0))
  let html = ''
  for (let i = 1; i <= 5; i++) {
    if (r >= i) html += '<i class="fas fa-star card__star card__star--full"></i>'
    else if (r >= i - 0.5) html += '<i class="fas fa-star-half-alt card__star card__star--half"></i>'
    else html += '<i class="far fa-star card__star card__star--empty"></i>'
  }
  return html
}

export default DATA
