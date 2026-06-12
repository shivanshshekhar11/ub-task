import { Router } from 'express';
import { store } from '../store/InMemoryStore';

export const productsRouter = Router();

productsRouter.get('/', (_req, res) => {
  const products = Array.from(store.products.values());
  res.json(products);
});

productsRouter.get('/:id', (req, res) => {
  const product = store.products.get(req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found', statusCode: 404 });
    return;
  }
  res.json(product);
});
