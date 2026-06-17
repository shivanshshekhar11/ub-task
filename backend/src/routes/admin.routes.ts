import { Router } from 'express';
import { discountService } from '../services/DiscountService.ts';
import { statsService } from '../services/StatsService.ts';
import { config } from '../config/index.ts';
import { store } from '../store/InMemoryStore.ts';

export const adminRouter = Router();

adminRouter.get('/stats', (_req, res) => {
  const stats = statsService.getStats();
  res.json(stats);
});

adminRouter.post('/discount/generate', (_req, res, next) => {
  try {
    const code = discountService.generateCode();
    res.status(201).json({ message: 'Discount code generated successfully', code });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/discount/status', (_req, res) => {
  const eligible = discountService.shouldGenerateDiscount();
  const c = store.discountMilestonesGenerated + 1;
  const N = config.DISCOUNT_ORDER_INTERVAL;
  const windowOpensAfterOrder = c * N - 1;
  const windowClosesAfterOrder = c * N;

  res.json({
    eligible,
    totalOrders: store.orderCounter,
    milestonesGenerated: store.discountMilestonesGenerated,
    windowOpensAfterOrder,
    windowClosesAfterOrder,
    discountInterval: N,
    discountPercent: config.DISCOUNT_PERCENT,
  });
});
