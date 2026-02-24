require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Service = require('./models/Service');
const Category = require('./models/Category');
const Gallery = require('./models/Gallery');
const Team = require('./models/Team');
const Testimonial = require('./models/Testimonial');
const Faq = require('./models/Faq');
const Brand = require('./models/Brand');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petspa';

const services = [
  { name: 'Cắt tỉa lông', slug: 'cat-tia-long', description: 'Cắt tỉa chuyên nghiệp theo từng giống chó/mèo.', priceDog: 150000, priceCat: 120000, duration: 60, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600', featured: true, category: 'grooming', petType: 'both' },
  { name: 'Tắm & Vệ sinh', slug: 'tam-ve-sinh', description: 'Tắm sạch với sữa tắm chuyên dụng.', priceDog: 120000, priceCat: 100000, duration: 45, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600', featured: true, category: 'bath', petType: 'both' },
  { name: 'Spa toàn diện', slug: 'spa-toan-dien', description: 'Gói spa cao cấp.', priceDog: 350000, priceCat: 280000, duration: 120, image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600', featured: true, category: 'spa', petType: 'both' },
  { name: 'Khách sạn thú cưng', slug: 'khach-san-thu-cung', description: 'Giữ thú cưng an toàn.', priceDog: 200000, priceCat: 180000, duration: 24, unit: 'ngày', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600', featured: true, category: 'hotel', petType: 'both' },
  { name: 'Vệ sinh răng miệng', slug: 've-sinh-rang-mieng', description: 'Lấy cao răng, đánh bóng.', priceDog: 180000, priceCat: 150000, duration: 30, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600', featured: false, category: 'care', petType: 'both' }
];

const products = [
  { name: 'Sữa tắm chó mèo Organic', slug: 'sua-tam-organic', price: 89000, oldPrice: 120000, category: 'cham-soc', petType: 'both', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400', rating: 4.8, bestSeller: true, description: 'Sữa tắm organic dịu nhẹ.' },
  { name: 'Thức ăn hạt Premium cho chó', slug: 'thuc-an-hat-premium-cho', price: 250000, category: 'thuc-an', petType: 'cho', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400', rating: 4.9, bestSeller: true, description: 'Cân bằng dinh dưỡng.' },
  { name: 'Dây dắt da cao cấp', slug: 'day-dat-da-cao-cap', price: 150000, category: 'phu-kien', petType: 'cho', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', rating: 4.7, bestSeller: true, description: 'Da thật, bền đẹp.' },
  { name: 'Đồ chơi gặm xương cao su', slug: 'do-choi-gam-xuong', price: 65000, category: 'do-choi', petType: 'cho', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400', rating: 4.6, bestSeller: true, description: 'An toàn, giúp vệ sinh răng.' },
  { name: 'Bàn chải lông mềm', slug: 'ban-chai-long-mem', price: 45000, category: 'cham-soc', petType: 'both', image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447?w=400', rating: 4.5, bestSeller: false, description: 'Chải lông mượt.' },
  { name: 'Thức ăn hạt cho mèo', slug: 'thuc-an-hat-cho-meo', price: 180000, category: 'thuc-an', petType: 'meo', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', rating: 4.8, bestSeller: true, description: 'Công thức cho mèo trưởng thành.' },
  { name: 'Vòng cổ đeo chuông', slug: 'vong-co-deo-chuong', price: 55000, category: 'phu-kien', petType: 'both', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400', rating: 4.4, bestSeller: false, description: 'Nhẹ, đẹp.' },
  { name: 'Cầu lông có catnip', slug: 'cau-long-catnip', price: 35000, category: 'do-choi', petType: 'meo', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', rating: 4.7, bestSeller: true, description: 'Mèo mê tít.' },
  { name: 'Túi vận chuyển thú cưng', slug: 'tui-van-chuyen-thu-cung', price: 320000, oldPrice: 380000, category: 'phu-kien', petType: 'both', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', rating: 4.8, bestSeller: true, description: 'Túi thoáng khí.' },
  { name: 'Pate thịt gà cho mèo', slug: 'pate-thit-ga-cho-meo', price: 28000, category: 'thuc-an', petType: 'meo', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400', rating: 4.9, bestSeller: true, description: 'Pate mềm, giàu đạm.' }
];

const categories = [
  { id: 'thuc-an', name: 'Thức ăn', slug: 'thuc-an', order: 1 },
  { id: 'cham-soc', name: 'Chăm sóc', slug: 'cham-soc', order: 2 },
  { id: 'phu-kien', name: 'Phụ kiện', slug: 'phu-kien', order: 3 },
  { id: 'do-choi', name: 'Đồ chơi', slug: 'do-choi', order: 4 },
  { id: 'dich-vu', name: 'Dịch vụ', slug: 'dich-vu', order: 5 }
];

const gallery = [
  { src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', title: 'Sau tắm', category: 'after' },
  { src: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400', title: 'Cắt tỉa', category: 'grooming' },
  { src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400', title: 'Spa', category: 'spa' },
  { src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400', title: 'Mèo', category: 'cat' },
  { src: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400', title: 'Vui vẻ', category: 'happy' },
  { src: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400', title: 'Chăm sóc', category: 'care' }
];

const team = [
  { name: 'Nguyễn Minh Tuấn', role: 'Senior Groomer', experience: '8 năm', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300', order: 1 },
  { name: 'Trần Thị Hương', role: 'Spa Specialist', experience: '6 năm', image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300', order: 2 },
  { name: 'Lê Văn Đức', role: 'Pet Stylist', experience: '5 năm', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', order: 3 }
];

const testimonials = [
  { author: 'Chị Mai Anh', pet: 'Bé Cún', petImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200', text: 'Spa xong bé nhà mình thơm, lông mượt. Nhân viên rất nhiệt tình!', rating: 5, order: 1 },
  { author: 'Anh Hoàng', pet: 'Mèo Tôm', petImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200', text: 'Lần đầu đưa Tôm đi spa, bé hợp tác lắm. Sẽ quay lại.', rating: 5, order: 2 },
  { author: 'Chị Linh', pet: 'Milu', petImage: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447?w=200', text: 'Gói spa toàn diện đáng đồng tiền. Milu về nhà vui lắm.', rating: 5, order: 3 }
];

const faqs = [
  { q: 'Đặt lịch có cần đặt cọc không?', a: 'Bạn không cần đặt cọc. Chỉ thanh toán khi hoàn thành dịch vụ.', order: 1 },
  { q: 'Có đưa đón thú cưng không?', a: 'Có. Chúng tôi hỗ trợ đưa đón trong bán kính 5km với phí nhỏ.', order: 2 },
  { q: 'Thú cưng có được xem camera không?', a: 'Có. Bạn có thể xem trực tiếp qua app khi bé đang làm dịch vụ.', order: 3 },
  { q: 'Có dịch vụ cho mèo không?', a: 'Có. Chúng tôi có gói riêng cho mèo với không gian yên tĩnh.', order: 4 }
];

const brands = [
  { name: 'Royal Canin', order: 1 },
  { name: 'Pedigree', order: 2 },
  { name: 'Whiskas', order: 3 },
  { name: 'Hills', order: 4 },
  { name: 'Organic Pet', order: 5 },
  { name: 'PetSafe', order: 6 }
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Đã kết nối MongoDB');

  await Product.deleteMany({});
  await Service.deleteMany({});
  await Category.deleteMany({});
  await Gallery.deleteMany({});
  await Team.deleteMany({});
  await Testimonial.deleteMany({});
  await Faq.deleteMany({});
  await Brand.deleteMany({});

  const adminExists = await User.findOne({ email: 'admin@petspa.vn' });
  if (!adminExists) {
    const admin = new User({ name: 'Admin', email: 'admin@petspa.vn', phone: '', password: 'admin123', role: 'admin' });
    await admin.save();
    console.log('Đã tạo admin: admin@petspa.vn / admin123');
  }

  await Product.insertMany(products);
  console.log('Đã seed ' + products.length + ' sản phẩm');
  await Service.insertMany(services);
  console.log('Đã seed ' + services.length + ' dịch vụ');
  await Category.insertMany(categories);
  console.log('Đã seed ' + categories.length + ' danh mục');
  await Gallery.insertMany(gallery);
  console.log('Đã seed ' + gallery.length + ' ảnh gallery');
  await Team.insertMany(team);
  console.log('Đã seed ' + team.length + ' thành viên đội ngũ');
  await Testimonial.insertMany(testimonials);
  console.log('Đã seed ' + testimonials.length + ' đánh giá');
  await Faq.insertMany(faqs);
  console.log('Đã seed ' + faqs.length + ' FAQ');
  await Brand.insertMany(brands);
  console.log('Đã seed ' + brands.length + ' thương hiệu');

  await mongoose.disconnect();
  console.log('Seed hoàn tất!');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
