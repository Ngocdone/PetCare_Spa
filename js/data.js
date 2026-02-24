/**
 * Pet Spa & Shop - Mock Data
 * Dữ liệu mẫu cho products, services, users. Có thể thay bằng API sau.
 */

const DATA = {
  // Dịch vụ Spa - priceDog/priceCat: giá theo loại thú cưng (petType: both|cho|meo)
  services: [
    {
      id: 's1',
      name: 'Cắt tỉa lông',
      slug: 'cat-tia-long',
      description: 'Cắt tỉa chuyên nghiệp theo từng giống chó/mèo, tạo kiểu đẹp mắt.',
      priceDog: 150000,
      priceCat: 120000,
      duration: 60,
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600',
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
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
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
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600',
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
      image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600',
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
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
      featured: false,
      category: 'care',
      petType: 'both'
    }
  ],

  // Sản phẩm Shop
  products: [
    {
      id: 'p1',
      name: 'Sữa tắm chó mèo Organic',
      slug: 'sua-tam-organic',
      price: 89000,
      oldPrice: 120000,
      category: 'cham-soc',
      petType: 'both',
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
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
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
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
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
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
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
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
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
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
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
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
      image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400',
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
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
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
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
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
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
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
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
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
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
      rating: 4.8,
      bestSeller: true,
      description: 'Snack thịt bò sấy, thơm ngon.'
    },
    {
      id: 'p13',
      name: 'Lược chải lông mèo',
      slug: 'luoc-chai-long-meo',
      price: 42000,
      category: 'cham-soc',
      petType: 'meo',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      rating: 4.5,
      bestSeller: false,
      description: 'Lược thép không gỉ, nhẹ tay.'
    },
    {
      id: 'p14',
      name: 'Balo đựng đồ khi dắt chó',
      slug: 'balo-dung-do-khi-dat-cho',
      price: 125000,
      category: 'phu-kien',
      petType: 'cho',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      rating: 4.6,
      bestSeller: false,
      description: 'Balo nhỏ gọn, nhiều ngăn.'
    },
    {
      id: 'p15',
      name: 'Thức ăn hạt cho chó con',
      slug: 'thuc-an-hat-cho-cho-con',
      price: 195000,
      category: 'thuc-an',
      petType: 'cho',
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400',
      rating: 4.9,
      bestSeller: true,
      description: 'Công thức dinh dưỡng cho chó 2-12 tháng.'
    },
    {
      id: 'p16',
      name: 'Xịt khử mùi lông thú cưng',
      slug: 'xit-khu-mui-long-thu-cung',
      price: 68000,
      category: 'cham-soc',
      petType: 'both',
      image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400',
      rating: 4.6,
      bestSeller: false,
      description: 'Khử mùi nhanh, an toàn không cồn.'
    },
    {
      id: 'p17',
      name: 'Bóng tennis cho chó',
      slug: 'bong-tennis-cho-cho',
      price: 25000,
      category: 'do-choi',
      petType: 'cho',
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
      rating: 4.7,
      bestSeller: true,
      description: 'Bóng cao su bền, dễ cầm ném.'
    },
    {
      id: 'p18',
      name: 'Sữa bột cho mèo con',
      slug: 'sua-bot-cho-meo-con',
      price: 89000,
      oldPrice: 105000,
      category: 'thuc-an',
      petType: 'meo',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      rating: 4.8,
      bestSeller: true,
      description: 'Thay thế sữa mẹ, giàu dinh dưỡng.'
    },
    {
      id: 'p19',
      name: 'Vòng cổ LED an toàn đêm',
      slug: 'vong-co-led-an-toan-dem',
      price: 95000,
      category: 'phu-kien',
      petType: 'both',
      image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      rating: 4.7,
      bestSeller: false,
      description: 'Đèn LED sáng, pin lâu, chống nước.'
    },
    {
      id: 'p20',
      name: 'Cần câu mồi có lông vũ',
      slug: 'can-cau-moi-co-long-vu',
      price: 45000,
      category: 'do-choi',
      petType: 'meo',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      rating: 4.8,
      bestSeller: true,
      description: 'Mèo thích đuổi bắt, vận động vui.'
    }
  ],

  // Danh mục sản phẩm - Phân loại Chó/Mèo + loại sản phẩm (Thức ăn, Phụ kiện...)
  productCategories: [
    { id: 'all', name: 'Tất cả', icon: 'fa-layer-group', desc: 'Xem toàn bộ sản phẩm', petType: null, category: null },
    { id: 'cho', name: 'Chó', icon: 'fa-dog', desc: 'Tất cả sản phẩm cho chó', petType: 'cho', category: null, isParent: true },
    { id: 'cho-thuc-an', name: 'Thức ăn / Hạt', icon: 'fa-bowl-food', desc: 'Hạt khô, pate, snack cho chó', petType: 'cho', category: 'thuc-an', parent: 'cho' },
    { id: 'cho-cham-soc', name: 'Chăm sóc', icon: 'fa-spa', desc: 'Sữa tắm, dầu gội, vệ sinh cho chó', petType: 'cho', category: 'cham-soc', parent: 'cho' },
    { id: 'cho-phu-kien', name: 'Phụ kiện', icon: 'fa-bag-shopping', desc: 'Vòng cổ, dây xích, giường cho chó', petType: 'cho', category: 'phu-kien', parent: 'cho' },
    { id: 'cho-do-choi', name: 'Đồ chơi', icon: 'fa-baseball-ball', desc: 'Đồ chơi vận động cho chó', petType: 'cho', category: 'do-choi', parent: 'cho' },
    { id: 'meo', name: 'Mèo', icon: 'fa-cat', desc: 'Tất cả sản phẩm cho mèo', petType: 'meo', category: null, isParent: true },
    { id: 'meo-thuc-an', name: 'Thức ăn / Hạt', icon: 'fa-bowl-food', desc: 'Hạt khô, pate, snack cho mèo', petType: 'meo', category: 'thuc-an', parent: 'meo' },
    { id: 'meo-cham-soc', name: 'Chăm sóc', icon: 'fa-spa', desc: 'Sữa tắm, dầu gội, vệ sinh cho mèo', petType: 'meo', category: 'cham-soc', parent: 'meo' },
    { id: 'meo-phu-kien', name: 'Phụ kiện', icon: 'fa-bag-shopping', desc: 'Vòng cổ, cát vệ sinh cho mèo', petType: 'meo', category: 'phu-kien', parent: 'meo' },
    { id: 'meo-do-choi', name: 'Đồ chơi', icon: 'fa-baseball-ball', desc: 'Cần câu, cầu lông cho mèo', petType: 'meo', category: 'do-choi', parent: 'meo' }
  ],

  // Team (Groomers)
  team: [
    { id: 't1', name: 'Nguyễn Minh Tuấn', role: 'Senior Groomer', experience: '8 năm', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300' },
    { id: 't2', name: 'Trần Thị Hương', role: 'Spa Specialist', experience: '6 năm', image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300' },
    { id: 't3', name: 'Lê Văn Đức', role: 'Pet Stylist', experience: '5 năm', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300' }
  ],

  // Testimonials
  testimonials: [
    { id: 'rev1', author: 'Chị Mai Anh', pet: 'Bé Cún', petImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200', text: 'Spa xong bé nhà mình thơm, lông mượt. Nhân viên rất nhiệt tình!', rating: 5 },
    { id: 'rev2', author: 'Anh Hoàng', pet: 'Mèo Tôm', petImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200', text: 'Lần đầu đưa Tôm đi spa, bé hợp tác lắm. Sẽ quay lại.', rating: 5 },
    { id: 'rev3', author: 'Chị Linh', pet: 'Milu', petImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=200', text: 'Gói spa toàn diện đáng đồng tiền. Milu về nhà vui lắm.', rating: 5 }
  ],

  // FAQ
  faqs: [
    { id: 'f1', q: 'Đặt lịch có cần đặt cọc không?', a: 'Bạn không cần đặt cọc. Chỉ thanh toán khi hoàn thành dịch vụ.' },
    { id: 'f2', q: 'Có đưa đón thú cưng không?', a: 'Có. Chúng tôi hỗ trợ đưa đón trong bán kính 5km với phí nhỏ.' },
    { id: 'f3', q: 'Thú cưng có được xem camera không?', a: 'Có. Bạn có thể xem trực tiếp qua app khi bé đang làm dịch vụ.' },
    { id: 'f4', q: 'Có dịch vụ cho mèo không?', a: 'Có. Chúng tôi có gói riêng cho mèo với không gian yên tĩnh.' }
  ],

  // Brands / Partners (logo text hoặc placeholder)
  brands: ['Royal Canin', 'Pedigree', 'Whiskas', 'Hills', 'Organic Pet', 'PetSafe'],

  // Gallery images (before/after, thú cưng)
  gallery: [
    { id: 'g1', src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', title: 'Sau tắm', category: 'after' },
    { id: 'g2', src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400', title: 'Cắt tỉa', category: 'grooming' },
    { id: 'g3', src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400', title: 'Spa', category: 'spa' },
    { id: 'g4', src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', title: 'Mèo', category: 'cat' },
    { id: 'g5', src: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400', title: 'Vui vẻ', category: 'happy' },
    { id: 'g6', src: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400', title: 'Chăm sóc', category: 'care' }
  ],

  // Admin mặc định (để đăng nhập admin)
  adminUser: { email: 'admin@petspa.vn', password: 'admin123', role: 'admin' }
};

// Export cho module hoặc global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DATA;
} else {
  window.DATA = DATA;
  // Đồng bộ dịch vụ từ admin (localStorage) nếu có
  try {
    var saved = localStorage.getItem('petspa_services');
    if (saved) DATA.services = JSON.parse(saved);
  } catch (e) {}
  // Đồng bộ gallery (Khoảnh khắc đáng yêu) từ admin nếu có
  try {
    var gal = localStorage.getItem('petspa_gallery');
    if (gal) DATA.gallery = JSON.parse(gal);
  } catch (e) {}
}
