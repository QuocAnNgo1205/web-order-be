import { Router } from 'express';
import mongoose from 'mongoose';
import Food from './food.model.js';

const router = Router();

router.get('/', listFoods);
router.get('/:id', getFoodById);
router.post('/', createFood);
router.patch('/:id', updateFood);
router.delete('/:id', deleteFood);

async function listFoods(req, res, next) {
  try {
    const foods = await Food.find().sort({ createdAt: -1 });
    res.json(foods);
  } catch (err) { next(err); }
}

async function getFoodById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const food = await Food.findById(id);
    if (!food) return res.status(404).json({ error: 'Food not found' });
    res.json(food);
  } catch (err) { next(err); }
}

async function createFood(req, res, next) {
  try {
    const { name, price, description, image } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ error: 'name and price are required' });
    }
    const food = await Food.create({ name, price, description, image });
    res.status(201).json(food);
  } catch (err) { next(err); }
}

async function updateFood(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const food = await Food.findByIdAndUpdate(id, req.body, { new: true });
    if (!food) return res.status(404).json({ error: 'Food not found' });
    res.json(food);
  } catch (err) { next(err); }
}

async function deleteFood(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const food = await Food.findByIdAndDelete(id);
    if (!food) return res.status(404).json({ error: 'Food not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
}

export default router;
