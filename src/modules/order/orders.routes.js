// src/modules/order/orders.routes.js
import { Router } from 'express';
import mongoose from 'mongoose';
import Order from './order.model.js';
import Food from '../food/food.model.js';

const router = Router();

router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrderById);
router.patch('/:id/add-items', addItemsToOrder);
router.patch('/:id/status', setOrderStatus);

async function computeSubtotal(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const ids = items.map(i => i.food);
  const foods = await Food.find({ _id: { $in: ids } }, { _id: 1, price: 1 });
  const priceMap = new Map(foods.map(f => [String(f._id), f.price]));
  return items.reduce((sum, it) => {
    const price = priceMap.get(String(it.food));
    if (price == null) {
      const err = new Error('Invalid food id'); err.status = 400; throw err;
    }
    return sum + it.quantity * price;
  }, 0);
}

/* =======================
   Handlers (defined below)
   ======================= */
async function createOrder(req, res, next) {
  try {
    const { table, items } = req.body;
    if (!table || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'table and non-empty items[] are required' });
    }
    // validate ObjectIds
    if (items.some(i => !mongoose.isValidObjectId(i.food))) {
      return res.status(400).json({ error: 'Invalid food id in items' });
    }
    const subtotal = await computeSubtotal(items);
    const order = await Order.create({ table, items, subtotal, status: 'open' });
    res.status(201).json(order);
  } catch (err) { next(err); }
}

async function listOrders(req, res, next) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('items.food');
    res.json(orders);
  } catch (err) { next(err); }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const order = await Order.findById(id).populate('items.food');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
}

async function addItemsToOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { items } = req.body;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items[] required' });
    }
    if (items.some(i => !mongoose.isValidObjectId(i.food))) {
      return res.status(400).json({ error: 'Invalid food id in items' });
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['open', 'preparing', 'served'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot add items to a closed order' });
    }
    order.items.push(...items);
    order.subtotal = await computeSubtotal(order.items);
    await order.save();
    res.json(order);
  } catch (err) { next(err); }
}

async function setOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['open', 'preparing', 'served', 'paid', 'cancelled'];
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
}

export default router;
