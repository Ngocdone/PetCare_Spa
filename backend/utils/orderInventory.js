/**
 * Trừ tồn kho theo chi tiết đơn hàng (gọi trong transaction đã mở).
 * Luồng: đọc chi_tiet_don_hang FOR UPDATE → với từng SP: khóa san_pham, kiểm tra tồn → UPDATE so_luong_ton.
 */
async function deductInventoryForOrder(conn, orderId) {
  const [items] = await conn.query(
    `SELECT ma_san_pham, ten_san_pham, so_luong FROM chi_tiet_don_hang WHERE id_don_hang = ? FOR UPDATE`,
    [orderId]
  );
  for (const item of items) {
    const productId = item.ma_san_pham;
    const productName = item.ten_san_pham;
    const quantity = Math.max(1, Math.round(Number(item.so_luong) || 1));
    const [stockRows] = await conn.query(
      `SELECT ten, so_luong_ton FROM san_pham WHERE ma_san_pham = ? FOR UPDATE`,
      [productId]
    );
    if (!stockRows.length) {
      throw new Error(`Sản phẩm "${productName}" không tồn tại.`);
    }
    const stockNum = Number(stockRows[0].so_luong_ton);
    const displayName =
      String(stockRows[0].ten || '').trim() || productName || productId;
    if (!Number.isFinite(stockNum) || stockNum < quantity) {
      throw new Error(
        `Sản phẩm "${displayName}" chỉ còn ${Number.isFinite(stockNum) ? stockNum : 0} trong kho.`
      );
    }
    await conn.query(`UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE ma_san_pham = ?`, [
      quantity,
      productId,
    ]);
  }
}

module.exports = { deductInventoryForOrder };
