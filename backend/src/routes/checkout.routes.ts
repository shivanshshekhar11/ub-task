import { Router } from 'express';
import { checkoutSchema } from '@ub-task/shared-types';
import { validate } from '../middleware/validate.ts';
import { orderService } from '../services/OrderService.ts';

export const checkoutRouter = Router();

checkoutRouter.post('/', validate(checkoutSchema), (req, res, next) => {
  try {
    const { cartId, discountCode } = req.body;
    // Treat empty string as "no code"
    const code = discountCode?.trim() || undefined;
    const order = orderService.checkout(cartId, code);
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    next(err);
  }
});
