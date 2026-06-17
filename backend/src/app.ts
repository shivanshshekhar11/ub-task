import express from 'express';
import cors from 'cors';
import { apiReference } from '@scalar/express-api-reference';

import { errorHandler } from './middleware/errorHandler.ts';
import { productsRouter } from './routes/products.routes.ts';
import { cartRouter } from './routes/cart.routes.ts';
import { checkoutRouter } from './routes/checkout.routes.ts';
import { adminRouter } from './routes/admin.routes.ts';
import { seedRouter } from './routes/seed.routes.ts';
import { generateSpec } from './swagger/openapi.ts';

// ── App ──────────────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }),
);
app.use(express.json());

// ── API Documentation (Scalar) ────────────────────────────────────────────────
// generateSpec() builds the OpenAPI 3.0 document from the zod-to-openapi
// registry in src/swagger/openapi.ts — no YAML, no JSDoc comments.
app.use(
  '/api-docs',
  apiReference({
    spec: { content: generateSpec() },
    theme: 'purple',
  }),
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/admin', adminRouter);
app.use('/api/seed', seedRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/', (_req, res) => res.json({ message: 'Hello from Uniblox Store API' }));

// ── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

export { app };
