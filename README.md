# Pet Spa & Shop - Website Full Stack HTML/CSS/JS

Website Pet Spa & Shop hiện đại, gồm trang khách hàng và trang quản trị (Admin). Sử dụng HTML5 (Semantic), CSS3 (Variables, Flexbox/Grid), JavaScript ES6+ (Vanilla). Dữ liệu mô phỏng bằng **localStorage** (sẵn sàng thay bằng API).

## Cấu trúc thư mục

```
/
├── index.html          # Trang chủ
├── services.html       # Dịch vụ
├── booking.html        # Đặt lịch (form 4 bước)
├── shop.html           # Cửa hàng (filter, search)
├── product-detail.html # Chi tiết sản phẩm
├── cart.html           # Giỏ hàng
├── checkout.html       # Thanh toán
├── login.html          # Đăng nhập / Đăng ký
├── user.html           # Tài khoản (hồ sơ, thú cưng, đơn hàng, lịch hẹn...)
├── about.html          # Về chúng tôi & Quy trình (đã gộp process)
├── process.html        # Redirect → about.html#quy-trinh
├── contact.html        # Liên hệ (form + map)
├── admin.html          # Admin Dashboard
├── css/
│   ├── reset.css
│   ├── variables.css    # Design system (màu, font, spacing)
│   ├── base.css
│   ├── components.css   # Header, Footer, Card, Carousel, Accordion...
│   └── pages/          # CSS từng trang
├── js/
│   ├── data.js         # Mock data (services, products, team, faqs...)
│   ├── common.js       # Cart badge, sticky header, mobile menu
│   ├── home.js         # Trang chủ (typing, carousel, countdown, FAQ...)
│   ├── services.js
│   ├── booking.js      # Form đặt lịch 4 bước, validate, lưu localStorage
│   ├── shop.js         # Filter, search, add to cart
│   ├── product-detail.js
│   ├── cart.js         # Giỏ hàng (tăng/giảm/xóa, localStorage)
│   ├── checkout.js     # Form thanh toán, lưu đơn hàng
│   ├── auth.js         # Login/Register, admin@petspa.vn / admin123
│   ├── user.js         # Dashboard tài khoản (hồ sơ, thú cưng, đơn hàng, lịch hẹn...)
│   ├── contact.js
│   └── auth.js         # Login/Register
└── images/             # (có thể thêm ảnh local)
```

## Chạy dự án

- Mở trực tiếp file `index.html` bằng trình duyệt (file://), hoặc
- Chạy local server (VD: `npx serve .` hoặc Live Server trong VS Code) để tránh lỗi CORS khi load ảnh/script.

## Design System

- **Primary:** Teal `#0D9488`
- **Secondary:** Kem/be `#F5F5DC`
- **Accent:** Teal `#20B2AA`
- **Font:** Quicksand, Poppins, Nunito (Google Fonts)
- **Responsive:** Mobile-first, breakpoints 576px, 768px, 992px

## Trang khách hàng

| Trang | Nội dung chính |
|-------|----------------|
| **Trang chủ** | Hero (typing), About teaser (Before/After), Why Choose Us, Dịch vụ carousel, Quy trình 4 bước, Promo countdown, Best Sellers, Gallery, Team, Testimonials, FAQ accordion, Brands marquee |
| **Dịch vụ** | Danh sách gói dịch vụ, bảng giá, nút Đặt lịch |
| **Đặt lịch** | Form 4 bước: Dịch vụ & Pet → Ngày giờ → Thông tin chủ nuôi → Xác nhận. Validate, lưu vào `petspa_bookings` |
| **Cửa hàng** | Danh sách sản phẩm, filter danh mục/giá, search, thêm vào giỏ |
| **Chi tiết SP** | Ảnh, mô tả, số lượng, Thêm vào giỏ, Sản phẩm liên quan |
| **Giỏ hàng** | Danh sách, tăng/giảm/xóa, tạm tính |
| **Thanh toán** | Form địa chỉ, COD/Chuyển khoản, lưu đơn vào `petspa_orders`, xóa giỏ |
| **Đăng nhập/Đăng ký** | Form chuyển tab, lưu user vào `petspa_users`, admin: admin@petspa.vn / admin123 → vào admin.html |
| **Tài khoản (user.html)** | Hồ sơ cá nhân, thú cưng, đơn hàng, lịch hẹn, địa chỉ, đổi mật khẩu, Đăng xuất |
| **About, Contact** | Nội dung tĩnh, form liên hệ (alert success) |

## Admin (admin/)

- **Đăng nhập:** Dùng tài khoản admin (admin@petspa.vn / admin123) tại login.html, sau đó vào admin/index.html.
- **Cấu trúc:** admin/index.html (Tổng quan), admin/pages/products.html, orders.html, services.html, customers.html, appointments.html.
- **Dashboard:** Chỉ số nhanh, biểu đồ, sản phẩm bán chạy, lịch hẹn hôm nay, đơn hàng gần đây.
- **Sản phẩm:** Thêm/Lưu vào `petspa_products` (hiển thị trên Shop/Cửa hàng).
- **Lịch hẹn:** Tạo lịch lưu vào `petspa_bookings` (đồng bộ với trang Đặt lịch).

## localStorage keys

| Key | Mô tả |
|-----|--------|
| `petspa_cart` | Giỏ hàng [{ id, name, price, image, quantity }] |
| `petspa_bookings` | Lịch đặt spa (form booking) |
| `petspa_orders` | Đơn hàng (sau checkout) |
| `petspa_users` | User đăng ký (auth) |
| `petspa_current_user` | User đang đăng nhập |
| `petspa_products` | Sản phẩm (admin CRUD, override data.js) |

## Ghi chú kỹ thuật

- Không dùng framework CSS (Bootstrap); CSS tự viết, BEM-style.
- Có thể bổ sung Swiper/Flatpickr nếu cần; hiện tại carousel/date đã tự code.
- Cấu trúc JS tách file theo trang, sẵn sàng thay localStorage bằng fetch API khi có backend.
