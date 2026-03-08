const { pool } = require('./config/db');

const services = [
  { name: 'Cắt tỉa lông', slug: 'cat-tia-long', description: 'Cắt tỉa chuyên nghiệp theo từng giống chó/mèo.', price_dog: 150000, price_cat: 120000, duration: 60, image: 'img/cat-tia-long.jpg', featured: 1, category: 'grooming', pet_type: 'both' },
  { name: 'Tắm & Vệ sinh', slug: 'tam-ve-sinh', description: 'Tắm sạch với sữa tắm chuyên dụng.', price_dog: 120000, price_cat: 100000, duration: 45, image: 'img/tam-ve-sinh.jpg', featured: 1, category: 'bath', pet_type: 'both' },
  { name: 'Spa toàn diện', slug: 'spa-toan-dien', description: 'Gói spa cao cấp.', price_dog: 350000, price_cat: 280000, duration: 120, image: 'img/spa-toan-dien.jpg', featured: 1, category: 'spa', pet_type: 'both' },
  { name: 'Khách sạn thú cưng', slug: 'khach-san-thu-cung', description: 'Giữ thú cưng an toàn.', price_dog: 200000, price_cat: 180000, duration: 24, unit: 'ngày', image: 'img/khach-san-thu-cung.jpg', featured: 1, category: 'hotel', pet_type: 'both' },
  { name: 'Vệ sinh răng miệng', slug: 've-sinh-rang-mieng', description: 'Lấy cao răng, đánh bóng.', price_dog: 180000, price_cat: 150000, duration: 30, image: 'img/ve-sinh-rang-mieng.jpg', featured: 0, category: 'care', pet_type: 'both' }
];

const products = [
  { name: 'Sữa tắm chó mèo Organic', slug: 'sua-tam-organic', price: 89000, old_price: 120000, category: 'cham-soc', pet_type: 'both', image: 'img/sua-tam-organic.jpg', rating: 4.8, best_seller: 1, description: 'Sữa tắm organic dịu nhẹ.' },
  { name: 'Thức ăn hạt Premium cho chó', slug: 'thuc-an-hat-premium-cho', price: 250000, category: 'thuc-an', pet_type: 'cho', image: 'img/thuc-an-hat-premium-cho.jpg', rating: 4.9, best_seller: 1, description: 'Cân bằng dinh dưỡng.' },
  { name: 'Dây dắt da cao cấp', slug: 'day-dat-da-cao-cap', price: 150000, category: 'phu-kien', pet_type: 'cho', image: 'img/day-dat-da-cao-cap.jpg', rating: 4.7, best_seller: 1, description: 'Da thật, bền đẹp.' },
  { name: 'Đồ chơi gặm xương cao su', slug: 'do-choi-gam-xuong', price: 65000, category: 'do-choi', pet_type: 'cho', image: 'img/do-choi-gam-xuong.jpg', rating: 4.6, best_seller: 1, description: 'An toàn, giúp vệ sinh răng.' },
  { name: 'Bàn chải lông mềm', slug: 'ban-chai-long-mem', price: 45000, category: 'cham-soc', pet_type: 'both', image: 'img/ban-chai-long-mem.jpg', rating: 4.5, best_seller: 0, description: 'Chải lông mượt.' },
  { name: 'Thức ăn hạt cho mèo', slug: 'thuc-an-hat-cho-meo', price: 180000, category: 'thuc-an', pet_type: 'meo', image: 'img/thuc-an-hat-cho-meo.jpg', rating: 4.8, best_seller: 1, description: 'Công thức cho mèo trưởng thành.' },
  { name: 'Vòng cổ đeo chuông', slug: 'vong-co-deo-chuong', price: 55000, category: 'phu-kien', pet_type: 'both', image: 'img/vong-co-deo-chuong.jpg', rating: 4.4, best_seller: 0, description: 'Nhẹ, đẹp.' },
  { name: 'Cầu lông có catnip', slug: 'cau-long-catnip', price: 35000, category: 'do-choi', pet_type: 'meo', image: 'img/cau-long-catnip.jpg', rating: 4.7, best_seller: 1, description: 'Mèo mê tít.' },
  { name: 'Túi vận chuyển thú cưng', slug: 'tui-van-chuyen-thu-cung', price: 320000, old_price: 380000, category: 'phu-kien', pet_type: 'both', image: 'img/tui-van-chuyen-thu-cung.jpg', rating: 4.8, best_seller: 1, description: 'Túi thoáng khí.' },
  { name: 'Pate thịt gà cho mèo', slug: 'pate-thit-ga-cho-meo', price: 28000, category: 'thuc-an', pet_type: 'meo', image: 'img/pate-thit-ga-cho-meo.jpg', rating: 4.9, best_seller: 1, description: 'Pate mềm, giàu đạm.' }
];

const categories = [
  { id_str: 'thuc-an', name: 'Thức ăn', slug: 'thuc-an', category_order: 1 },
  { id_str: 'cham-soc', name: 'Chăm sóc', slug: 'cham-soc', category_order: 2 },
  { id_str: 'phu-kien', name: 'Phụ kiện', slug: 'phu-kien', category_order: 3 },
  { id_str: 'do-choi', name: 'Đồ chơi', slug: 'do-choi', category_order: 4 },
  { id_str: 'dich-vu', name: 'Dịch vụ', slug: 'dich-vu', category_order: 5 }
];

const gallery = [
  { src: 'img/sau-tam.jpg', title: 'Sau tắm', category: 'after' },
  { src: 'img/cat-tia-long.jpg', title: 'Cắt tỉa', category: 'grooming' },
  { src: 'img/spa-toan-dien.jpg', title: 'Spa', category: 'spa' },
  { src: 'img/meo.jpg', title: 'Mèo', category: 'cat' },
  { src: 'img/vui-ve.jpg', title: 'Vui vẻ', category: 'happy' },
  { src: 'img/cham-soc.jpg', title: 'Chăm sóc', category: 'care' }
];

const team = [
  { name: 'Nguyễn Minh Tuấn', role: 'Senior Groomer', experience: '8 năm', image: 'img/chuyen-gia-lanh-nghe.jpg', team_order: 1 },
  { name: 'Trần Thị Hương', role: 'Spa Specialist', experience: '6 năm', image: 'img/chuyen-gia-lanh-nghe.jpg', team_order: 2 },
  { name: 'Lê Văn Đức', role: 'Pet Stylist', experience: '5 năm', image: 'img/chuyen-gia-lanh-nghe.jpg', team_order: 3 }
];

const testimonials = [
  { author: 'Chị Mai Anh', pet: 'Bé Cún', pet_image: 'img/cho.jpg', text: 'Spa xong bé nhà mình thơm, lông mượt. Nhân viên rất nhiệt tình!', rating: 5, testimonial_order: 1 },
  { author: 'Anh Hoàng', pet: 'Mèo Tôm', pet_image: 'img/meo.jpg', text: 'Lần đầu đưa Tôm đi spa, bé hợp tác lắm. Sẽ quay lại.', rating: 5, testimonial_order: 2 },
  { author: 'Chị Linh', pet: 'Milu', pet_image: 'img/cho.jpg', text: 'Gói spa toàn diện đáng đồng tiền. Milu về nhà vui lắm.', rating: 5, testimonial_order: 3 }
];

const faqs = [
  { q: 'Đặt lịch có cần đặt cọc không?', a: 'Bạn không cần đặt cọc. Chỉ thanh toán khi hoàn thành dịch vụ.', faq_order: 1 },
  { q: 'Có đưa đón thú cưng không?', a: 'Có. Chúng tôi hỗ trợ đưa đón trong bán kính 5km với phí nhỏ.', faq_order: 2 },
  { q: 'Thú cưng có được xem camera không?', a: 'Có. Bạn có thể xem trực tiếp qua app khi bé đang làm dịch vụ.', faq_order: 3 },
  { q: 'Có dịch vụ cho mèo không?', a: 'Có. Chúng tôi có gói riêng cho mèo với không gian yên tĩnh.', faq_order: 4 }
];

const brands = [
  { name: 'Royal Canin', brand_order: 1 },
  { name: 'Pedigree', brand_order: 2 },
  { name: 'Whiskas', brand_order: 3 },
  { name: 'Hills', brand_order: 4 },
  { name: 'Organic Pet', brand_order: 5 },
  { name: 'PetSafe', brand_order: 6 }
];

async function seed() {
  try {
    // Clear existing data
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM services');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM categories');
    await pool.query('DELETE FROM gallery');
    await pool.query('DELETE FROM team');
    await pool.query('DELETE FROM testimonials');
    await pool.query('DELETE FROM faqs');
    await pool.query('DELETE FROM brands');
    
    console.log('Cleared existing data');

    // Insert services
    for (const s of services) {
      await pool.query(
        'INSERT INTO services (name, slug, description, price_dog, price_cat, duration, unit, image, featured, category, pet_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [s.name, s.slug, s.description, s.price_dog, s.price_cat, s.duration, s.unit || 'phút', s.image, s.featured, s.category, s.pet_type]
      );
    }
    console.log('✓ Seeded ' + services.length + ' services');

    // Insert products
    for (const p of products) {
      await pool.query(
        'INSERT INTO products (name, slug, price, old_price, category, pet_type, image, rating, best_seller, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.name, p.slug, p.price, p.old_price || null, p.category, p.pet_type, p.image, p.rating, p.best_seller, p.description]
      );
    }
    console.log('✓ Seeded ' + products.length + ' products');

    // Insert categories
    for (const c of categories) {
      await pool.query(
        'INSERT INTO categories (id_str, name, slug, category_order) VALUES (?, ?, ?, ?)',
        [c.id_str, c.name, c.slug, c.category_order]
      );
    }
    console.log('✓ Seeded ' + categories.length + ' categories');

    // Insert gallery
    for (const g of gallery) {
      await pool.query(
        'INSERT INTO gallery (src, title, category) VALUES (?, ?, ?)',
        [g.src, g.title, g.category]
      );
    }
    console.log('✓ Seeded ' + gallery.length + ' gallery images');

    // Insert team
    for (const t of team) {
      await pool.query(
        'INSERT INTO team (name, role, experience, image, team_order) VALUES (?, ?, ?, ?, ?)',
        [t.name, t.role, t.experience, t.image, t.team_order]
      );
    }
    console.log('✓ Seeded ' + team.length + ' team members');

    // Insert testimonials
    for (const t of testimonials) {
      await pool.query(
        'INSERT INTO testimonials (author, pet, pet_image, text, rating, testimonial_order) VALUES (?, ?, ?, ?, ?, ?)',
        [t.author, t.pet, t.pet_image, t.text, t.rating, t.testimonial_order]
      );
    }
    console.log('✓ Seeded ' + testimonials.length + ' testimonials');

    // Insert FAQs
    for (const f of faqs) {
      await pool.query(
        'INSERT INTO faqs (q, a, faq_order) VALUES (?, ?, ?)',
        [f.q, f.a, f.faq_order]
      );
    }
    console.log('✓ Seeded ' + faqs.length + ' FAQs');

    // Insert brands
    for (const b of brands) {
      await pool.query(
        'INSERT INTO brands (name, brand_order) VALUES (?, ?)',
        [b.name, b.brand_order]
      );
    }
    console.log('✓ Seeded ' + brands.length + ' brands');

    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seed();

