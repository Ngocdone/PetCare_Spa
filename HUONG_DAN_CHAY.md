# Hướng dẫn chạy PetCare Spa — React + Node + MySQL

- **SPA:** `frontend/` (Vite + React).  
- **API:** `backend/` (Express, thêm các endpoint tương thích bản cũ trong `routes/legacy*.js`).  
- **Ảnh tĩnh:** thư mục `img/` ở gốc project (dev: Vite phục vụ `/img/...`; production: backend cũng mount `/img`).

## 1. Database (MySQL)

1. Mở phpMyAdmin hoặc MySQL client.  
2. Import file **`database/petcare_spa_vi.sql`** (tạo DB `petcare_spa`, bảng tiếng Việt: `san_pham`, `nguoi_dung`, `dich_vu_spa`, …) — **đúng schema mà API Node đang dùng**.  
3. Mặc định có tài khoản admin: `admin@petspa.vn` / `admin123` (xem file SQL).  
4. Nếu database **đã tạo từ bản SQL cũ** (cột `anh_chinh` dạng `img/...jpg` nhưng chưa có file trong `img/`), chạy thêm **`database/patch_product_images_remote.sql`** trong phpMyAdmin để gán ảnh mẫu qua URL.

**Cấu hình kết nối:** tạo `backend/.env` từ `backend/.env.example` và chỉnh `DB_USER`, `DB_PASSWORD`, `DB_NAME` (mặc định `DB_NAME=petcare_spa`).

## 2. Backend (Express + mysql2)

Từ thư mục gốc project:

```bash
npm run start:api
```

Hoặc: `cd backend` → `npm start` (nếu script trong `backend/package.json` chạy `node index.js`).

API: **http://localhost:3001** (mặc định; đổi `PORT` trong `backend/.env`).

- `GET /products`, `/services`, `/team` (và bản REST: `/api/products`, `/api/services`, `/api/team`)  
- `GET /health`  
- Quản trị: `GET /api/admin/data`, CRUD danh mục `GET|POST|PATCH|DELETE /api/categories` (`backend/routes/categories.js`; alias `/api/admin/categories`)  
- Auth & đơn JSON: `POST /api/login`, `/api/register`, `GET /api/me`, `POST /api/orders`, `POST /api/bookings`, …  
- Endpoint tương thích URL cũ: xem `routes/legacyRoutes.js` và các module `legacy*.js` nếu cần.  

**Sau khi sửa file trong `backend/`:** cần **khởi động lại** process API (Node không tự nạp lại code). Tiện hơn: từ gốc project chạy `npm run dev:api` (Node `--watch`), hoặc trong `backend/` chạy `npm run dev`.

**SPA đã build:** nếu đã có `frontend/dist`, mở **http://localhost:3001/webSPA/PetCare_Spa/** (cùng process với API).

## 3. Frontend (React + Vite) — dev

```bash
cd frontend
npm install
npm run dev
```

Mặc định **http://localhost:5173**. Vite proxy chuyển `/api`, `/products`, … → **http://127.0.0.1:3001** (cần chạy backend trước, nếu không sẽ lỗi proxy).

**Quản trị:** đăng nhập user có `vai_tro = admin` → `/admin` (React).

### Biến môi trường (tùy chọn)

Trong `frontend/.env` (copy từ `frontend/.env.example` nếu có):

- `VITE_API_BASE` — khi build production, URL gốc API (vd. `http://localhost:3001`) nếu không dùng cùng origin.  
- `VITE_BASE` / `VITE_API_PROXY_TARGET` — xem `frontend/vite.config.js`.

Build:

```bash
cd frontend
npm run build
```

Sau build, để Apache/XAMPP phục vụ đúng file mới: **copy toàn bộ nội dung `frontend/dist/`** vào thư mục site (vd. `htdocs/webSPA/PetCare_Spa/`) — repo này thường giữ bản copy đó ở **gốc project** (`index.html` + `assets/` + favicon).

## 4. Apache (XAMPP) + API Node

- File **`.htaccess`** ở gốc: fallback về `index.html` cho SPA.  
- Request API (`/products`, `/api/...`) cần **reverse proxy** tới Node `:3001`, hoặc mở trực tiếp **http://localhost:3001/...** khi dev.

## 5. Mapping từ project cũ (tham khảo)

| Trước | Sau |
|--------|-----|
| `get_data.php` (cũ) | `GET /products` (JSON) hoặc REST `/api/products` |
| Trang HTML tĩnh | `frontend/src/pages/*.jsx` |
| `admin/` HTML | `/admin` trong React |

Giỏ hàng: `localStorage` key `petspa_cart`.

---

## 6. Thanh toán VNPay (sandbox) — hướng dẫn chi tiết

### 6.1. Tổng quan luồng

1. Khách chọn **VNPay** ở bước thanh toán → frontend gọi API tạo đơn / lấy link thanh toán.
2. Trình duyệt **chuyển sang** trang sandbox VNPay (`VNP_URL`).
3. Khách nhập thẻ / OTP trên VNPay (sandbox dùng thẻ/OTP test theo tài liệu VNPay).
4. Sau khi xong, VNPay **redirect trình duyệt** về **`VNP_RETURN_URL`** — đây phải là URL **backend Node** (Express), **không** phải URL React.
5. Backend **kiểm tra chữ ký** (`vnp_SecureHash`), cập nhật đơn nếu thành công, rồi **redirect 302** sang trang React:  
   `FRONTEND_URL` + `/payment/vnpay-return?status=...&orderId=...`
6. (Tuỳ chọn) VNPay có thể gọi **IPN** tới server bạn nếu đã đăng ký URL IPN — route: `GET /api/payment/vnpay/ipn`.

**Hai cổng cần nhớ khi dev:**

| Dịch vụ | Cổng mặc định | Vai trò |
|--------|----------------|---------|
| API Node (`backend/`) | **3001** | Nhận `VNP_RETURN_URL`, ký/verify, redirect về React. |
| Vite (`frontend/`) | **5173** | SPA — phải **đang chạy** khi bạn quay lại sau thanh toán. |

Nếu sau thanh toán trình duyệt báo **từ chối kết nối** (`ERR_CONNECTION_REFUSED`): gần như luôn là **chưa bật `npm run dev`** ở frontend, hoặc **`FRONTEND_URL`** trỏ sai cổng (ví dụ còn 3000 trong khi Vite chạy 5173).

### 6.2. Chuẩn bị trước khi cấu hình

- Có **tài khoản sandbox / email** từ VNPay với **Mã website (TMN)** và **Chuỗi bí mật băm** (`HashSecret`).
- MySQL đã import schema (mục 1), backend kết nối DB được (`GET /health`).
- Đã copy `backend/.env.example` → `backend/.env` và điền DB.

### 6.3. Cấu hình `backend/.env` cho VNPay

Tạo hoặc chỉnh các dòng sau (không có khoảng trắng thừa đầu dòng, không để dấu ngoặc kép trừ khi giá trị có ký tự đặc biệt):

```env
# Cổng API — giữ 3001 để khớp proxy Vite
PORT=3001

VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_TMN_CODE=<Mã website từ email VNPay>
VNP_HASH_SECRET=<Chuỗi bí mật từ email VNPay — không chia sẻ công khai>

# URL backend mà VNPay redirect về (trình duyệt). Phải khớp đăng ký trên portal sandbox.
VNP_RETURN_URL=http://127.0.0.1:3001/api/payment/vnpay/return

# URL gốc SPA (không có / cuối). Sau xử lý return, Express redirect user về đây.
FRONTEND_URL=http://127.0.0.1:5173
```

**Giải thích từng biến:**

- **`VNP_URL`**: Địa chỉ form thanh toán sandbox (thường đúng như ví dụ trên).
- **`VNP_TMN_CODE`**: Terminal ID (mã website) — sai thì giao dịch không đúng merchant test.
- **`VNP_HASH_SECRET`**: Dùng để tạo `vnp_SecureHash` khi tạo link và khi verify callback. Sai một ký tự → lỗi **“Sai chữ ký” (code 70)** trên trang VNPay.
- **`VNP_RETURN_URL`**: Phải **trùng ký tự** với URL bạn khai trên **cổng VNPay** (Return URL). Khác `http`/`https`, `localhost`/`127.0.0.1`, hoặc cổng → VNPay có thể từ chối hoặc redirect lỗi.
- **`FRONTEND_URL`**: Chỉ là “nhà” của React; backend nối thêm path `/payment/vnpay-return`. Nếu bạn đổi cổng Vite, **đổi `FRONTEND_URL` cho khớp** và **khởi động lại API**.

**Sau mỗi lần sửa `.env`:** dừng process Node (Ctrl+C) và chạy lại `npm start` / `npm run dev` trong `backend/`. Node không tự đọc lại file env.

### 6.4. Cấu hình trên portal / email VNPay (sandbox)

- Đăng ký **Return URL** = đúng `VNP_RETURN_URL` trong `.env` (ví dụ `http://127.0.0.1:3001/api/payment/vnpay/return`).
- Nếu portal bắt nhập IPN URL và bạn chưa expose server ra internet, có thể bỏ qua IPN lúc dev local, hoặc dùng tunnel (ngrok, …) — tùy chính sách sandbox.

### 6.5. Thứ tự chạy khi test thanh toán

1. Bật **MySQL** (XAMPP hoặc dịch vụ MySQL).
2. Terminal 1 — **Backend:**  
   `cd backend` → `npm install` (lần đầu) → `npm start` hoặc `npm run dev`  
   Kiểm tra: trình duyệt mở `http://127.0.0.1:3001/health` → JSON `ok: true`.
3. Terminal 2 — **Frontend:**  
   `cd frontend` → `npm install` (lần đầu) → `npm run dev`  
   Mở shop tại **http://127.0.0.1:5173** (hoặc URL Vite in ra).
4. Thực hiện đặt hàng, chọn **VNPay**, làm theo sandbox (OTP test nếu có).

**Lưu ý:** Trong lúc test, **đừng tắt** hai terminal trên cho đến khi đã quay lại trang “kết quả thanh toán” trên React.

### 6.6. Kiểm tra nhanh sau khi khởi động API

Trong console Node thường có dòng gợi ý URL redirect về frontend (sau VNPay). Nếu thấy sai cổng so với Vite → sửa `FRONTEND_URL` và restart API.

### 6.7. Lỗi thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|------------|-------------------------|------------|
| Trang VNPay: **Sai chữ ký** (code 70) | `VNP_HASH_SECRET` sai; hoặc TMN sai; hoặc (đã sửa trong code) chuỗi ký không đúng chuẩn. | Đối chiếu lại secret/TMN từ email; restart API; đảm bảo không copy thừa khoảng trắng/xuống dòng. |
| **`ERR_CONNECTION_REFUSED`** tại `127.0.0.1:5173` | (1) Vite chưa chạy. (2) Trên Windows, Vite chỉ nghe `localhost`/`::1` còn redirect dùng `127.0.0.1`. | (1) `cd frontend && npm run dev`. (2) Dùng `vite.config.js` với `server.host: '127.0.0.1'` (đã có trong repo) rồi restart Vite; hoặc mở shop bằng `http://localhost:5173` cho đồng bộ. |
| **`ERR_CONNECTION_REFUSED`** tại `127.0.0.1:3000` (hoặc cổng khác) | `FRONTEND_URL` trỏ cổng không có dev server. | Sửa `FRONTEND_URL` = đúng cổng Vite (mặc định 5173), restart API. |
| Redirect về React nhưng **trắng / 404** | Sai path. App đăng ký route `/payment/vnpay-return` (và alias `vnpay_return`). | Mở đúng URL backend redirect (xem `backend/routes/vnpay.js`). |
| Proxy 502 khi gọi `/api` từ Vite | Backend không chạy hoặc sai `VITE_API_PROXY_TARGET`. | Chạy API cổng 3001; kiểm tra `frontend/.env` nếu đã đổi cổng API. |

### 6.8. Bảo mật

- **Không** commit `VNP_HASH_SECRET` lên Git; không gửi secret lên chat/email công khai.
- Production: dùng URL HTTPS, secret riêng production, cập nhật `VNP_URL` / TMN theo môi trường thật.
