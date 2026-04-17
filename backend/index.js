/**
 * Điểm vào API Express (chỉ JSON + static /img). Frontend React/Vite chạy cổng khác.
 *
 * Luồng: loadEnv → cors+json → static ảnh → mount router (VNPay, categories, products,
 * services, team, admin, legacy) → alias /products|/services|/team → /health & / → 404 JSON → test DB → listen.
 */
const fs = require('fs');
const path = require('path');

/** Nạp .env từ nhiều vị trí (override sau cùng thắng) — tránh lỗi khi chạy `node backend/index.js` từ thư mục gốc project. */
function loadEnvFiles() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend', '.env'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '.env.local'),
  ];
  const seen = new Set();
  for (const file of candidates) {
    const key = path.resolve(file);
    if (seen.has(key)) continue;
    seen.add(key);
    if (fs.existsSync(file)) {
      require('dotenv').config({ path: file, override: true });
    }
  }
}
loadEnvFiles();

// --- Ứng dụng HTTP ---
const express = require('express');
const cors = require('cors');
const { testConnection, ensureNguoiDungDiaChiColumn } = require('./config/db');
const productsRouter = require('./routes/products');
const servicesRouter = require('./routes/services');
const teamRouter = require('./routes/team');
const adminRouter = require('./routes/admin');
const legacyRoutes = require('./routes/legacyRoutes');
const categoriesRouter = require('./routes/categories');
const vnpayRouter = require('./routes/vnpay');
const { isVnpayConfigured } = require('./utils/vnpay');
const googleLoginRouter = require('./routes/loginGoogle');

const app = express();
const PORT = process.env.PORT || 3001;

const imgPublicPath = path.join(__dirname, '..', 'img');

function resolveCorsOrigin() {
  const raw = String(process.env.CORS_ORIGIN || '').trim();
  if (!raw) return true;
  if (raw === '*') {
    // credentials:true không thể đi với wildcard theo chuẩn CORS.
    // Trả về origin của request để browser chấp nhận cookie/session.
    return (origin, cb) => cb(null, origin || true);
  }
  const allowed = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked origin: ${origin}`));
  };
}

app.use(
  cors({
    origin: resolveCorsOrigin(),
    credentials: true,
  })
);
app.use(express.json());

/** Ảnh sản phẩm (file tĩnh), không phải SPA */
app.use('/img', express.static(imgPublicPath));

app.use(vnpayRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/team', teamRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', googleLoginRouter);
app.use(legacyRoutes);

app.use('/products', productsRouter);
app.use('/services', servicesRouter);
app.use('/team', teamRouter);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'petcare-api',
    vnpayConfigured: isVnpayConfigured(),
  });
});

/** Gốc API — chỉ JSON, không HTML */
app.get('/', (_req, res) => {
  res.json({
    service: 'PetCare API',
    port: PORT,
    hint: 'Frontend React chạy riêng (vd. Vite :5173).',
    examples: {
      products: 'GET /api/products',
      categories: 'GET /api/categories',
      ordersCreate: 'POST /api/orders',
      health: 'GET /health',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

;(async function start() {
  await testConnection();
  await ensureNguoiDungDiaChiColumn();

  app.listen(PORT, () => {
    console.log(`API only — http://localhost:${PORT}/`);
    console.log('  GET /api/products | /api/categories | /api/services | /api/team | /health');
    console.log('  POST /api/orders | /api/login | … (xem routes/legacy*.js)');
    const fe = String(process.env.FRONTEND_URL || '').trim().replace(/\/$/, '') || 'http://127.0.0.1:5173';
    console.log(`  Sau thanh toán VNPay, redirect về: ${fe}/payment/vnpay-return (cần Vite dev đang chạy)`);
    if (isVnpayConfigured()) {
      const tmn = String(process.env.VNP_TMN_CODE || '').trim();
      console.log(`  VNPay: đã cấu hình (TMN=${tmn})`);
    } else {
      console.warn(
        '  VNPay: CHƯA cấu hình — thêm VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL vào backend/.env rồi khởi động lại.'
      );
    }
  });
})();

const authRoutes = require("./routes/loginGoogle");

app.use("/api/auth", authRoutes);