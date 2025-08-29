import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import foodsRoutes from './modules/food/foods.routes.js';
import ordersRoutes from './modules/order/orders.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB connection error:', err); process.exit(1); });

app.get('/', (req, res) => res.send('API is running...'));

// Mount routes
app.use('/api/foods', foodsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/billing', billingRoutes);


// 404 + error handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
