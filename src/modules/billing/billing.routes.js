// src/modules/billing/billing.routes.js
import { Router } from 'express';
import Order from '../order/order.model.js';

const router = Router();
const UNPAID = ['open', 'preparing', 'served'];

/* =======================
   Routes (list first)
   ======================= */
router.get('/table/:table', getUnpaidBillForTable);
router.post('/table/:table/pay', payBillForTable);

/* =======================
   Handlers (defined below)
   ======================= */
async function getUnpaidBillForTable(req, res, next) {
  try {
    const table = Number(req.params.table);
    if (!Number.isInteger(table) || table <= 0) {
      return res.status(400).json({ error: 'Invalid table number' });
    }

    // Lấy tất cả order chưa thanh toán của bàn
    const orders = await Order
      .find({ table, status: { $in: UNPAID } })
      .populate('items.food'); // để FE dễ render tên món, giá

    // Tổng bill dựa trên subtotal đã tính khi tạo/thêm món
    const total = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);

    res.json({
      table,
      unpaidOrderCount: orders.length,
      currency: 'VND',
      total,
      orders,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

async function payBillForTable(req, res, next) {
  try {
    const table = Number(req.params.table);
    if (!Number.isInteger(table) || table <= 0) {
      return res.status(400).json({ error: 'Invalid table number' });
    }

    // Lấy tất cả order chưa thanh toán
    const orders = await Order.find({ table, status: { $in: UNPAID } });
    if (orders.length === 0) {
      return res.json({
        table,
        paidCount: 0,
        total: 0,
        orderIds: [],
        message: 'No unpaid orders for this table',
      });
    }

    const orderIds = orders.map(o => o._id);
    const total = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);

    // Đổi trạng thái tất cả sang paid
    await Order.updateMany({ _id: { $in: orderIds } }, { $set: { status: 'paid' } });

    res.json({
      table,
      paidCount: orders.length,
      currency: 'VND',
      total,
      orderIds,
      message: 'All unpaid orders are now paid',
      paidAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export default router;
