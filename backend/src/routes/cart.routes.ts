import { Router } from 'express';
import { addItemSchema, updateItemSchema } from '@ub-task/shared-types';
import { validate } from '../middleware/validate.ts';
import { cartService } from '../services/CartService.ts';

export const cartRouter = Router();

cartRouter.get('/:cartId', (req, res, next) => {
  try {
    const cart = cartService.getCart(req.params.cartId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

cartRouter.post('/:cartId/items', validate(addItemSchema), (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = cartService.addItem(req.params.cartId, productId, quantity);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

cartRouter.patch('/:cartId/items/:productId', validate(updateItemSchema), (req, res, next) => {
  try {
    const cart = cartService.updateItemQuantity(
      req.params.cartId,
      req.params.productId,
      req.body.quantity,
    );
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

cartRouter.delete('/:cartId/items/:productId', (req, res, next) => {
  try {
    const cart = cartService.removeItem(req.params.cartId, req.params.productId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});
