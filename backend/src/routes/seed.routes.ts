import { Router } from 'express';
import { store } from '../store/InMemoryStore.ts';

export const seedRouter = Router();

seedRouter.post('/', (_req, res) => {
  store.seed();
  const products = Array.from(store.products.values());
  res.json({
    message: 'Store has been reset and seeded successfully',
    products,
  });
});
