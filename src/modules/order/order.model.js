import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    quantity: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    table: { type: Number, required: true },
    items: { type: [OrderItemSchema], default: [] },
    status: {
      type: String,
      enum: ['open', 'preparing', 'served', 'paid', 'cancelled'],
      default: 'open',
    },
    subtotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Order', OrderSchema);
