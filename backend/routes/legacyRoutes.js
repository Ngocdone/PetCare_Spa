/**
 * Route tương thích URL cũ (một số *.php trùng handler với REST — xem từng file).
 * Đã gỡ bản trùng hoàn toàn với REST: legacyProducts, legacyServicesTeam, legacyAdmin, legacyCategoriesAdmin
 * (dùng /api/products, /api/services, /api/team, /api/admin/*, /api/categories).
 *
 * Luồng: legacyCors → thú cưng → đăng nhập → đơn → đặt lịch → đánh giá.
 */
const express = require('express');
const legacyCors = require('./legacyMiddleware');
const petsRouter = require('./legacyPets');
const authRouter = require('./legacyAuth');
const ordersRouter = require('./legacyOrders');
const bookingRouter = require('./legacyBooking');
const reviewsRouter = require('./legacyReviews');

const router = express.Router();

router.use(legacyCors);
router.use(petsRouter);
router.use(authRouter);
router.use(ordersRouter);
router.use(bookingRouter);
router.use(reviewsRouter);

module.exports = router;
