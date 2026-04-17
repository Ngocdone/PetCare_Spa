# Pet Spa & Shop (PetCare_Spa)

Ứng dụng **React (Vite) + Express + MySQL**: giao diện khách và quản trị trong SPA, API Node tương thích endpoint PHP cũ.

## Chạy nhanh

1. Import **`database/petcare_spa_vi.sql`** vào MySQL.  
2. `backend/.env` — copy từ `backend/.env.example`, chỉnh `DB_*`.  
3. Terminal gốc project: `npm run start:api` → API + (nếu có build) SPA tại `http://localhost:3000/webSPA/PetCare_Spa/`.  
4. Dev SPA: `cd frontend && npm run dev` → `http://localhost:5173`.

Chi tiết: **[HUONG_DAN_CHAY.md](HUONG_DAN_CHAY.md)**.

## Cấu trúc chính

| Thư mục | Nội dung |
|---------|----------|
| `frontend/` | React SPA |
| `backend/` | Express API |
| `database/` | `petcare_spa_vi.sql` |
| `img/` | Ảnh tĩnh |
| `index.html`, `assets/` | Bản build production (đồng bộ từ `frontend/dist` khi deploy qua Apache) |
admin@petspa.vn
admin123