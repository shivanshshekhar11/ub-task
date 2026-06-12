# Uniblox Store

A full-stack e-commerce store with cart management, checkout, and an nth-order discount/coupon system — built as part of a take-home assignment.

**Backend:** TypeScript · Node.js · Express · Zod · Vitest  
**Frontend:** Next.js (App Router) · Tailwind v4 · lucide-react  
**Docs:** Scalar API Reference at `/api-docs` (generated from Zod schemas via `zod-to-openapi`)

---

## Features

- Browse an insurance product catalog with category filtering
- Add items to a persistent cart, update quantities, remove items
- Checkout with an optional discount code — see a live order summary
- **Discount system** — admin generates a code in the window before the Nth order; customer uses it at checkout
- Admin dashboard with real-time revenue, order counts, and discount code tracking
- Full Scalar API docs with interactive "Try it out" for every endpoint (generated from Zod schemas — no YAML)
- 48 unit tests covering all business logic edge cases

---

## Prerequisites

- **Node.js 18+** and **npm 9+**

---

## Setup

### 1. Install all dependencies (one command from the root)

```bash
cd ub-task
npm install
```

> This installs dependencies for the root workspace, the backend, the frontend, and the shared `@ub-task/shared-types` package in one shot.

---

### 2. Configure environment variables

```bash
# Backend — copy the example and adjust if needed (defaults work out of the box)
cp backend/.env.example backend/.env

# Frontend — copy the example (points to the backend at localhost:3001)
cp frontend/.env.example frontend/.env.local
```

---

### 3. Start the backend

```bash
cd backend
npm run dev
```

The server starts at **http://localhost:3001**  
Scalar API docs at **http://localhost:3001/api-docs**

---

### 4. Start the frontend (separate terminal)

```bash
cd frontend
npm run dev
```

The app opens at **http://localhost:3000**

> Both processes must run simultaneously — the frontend calls the backend API directly from the browser.

---

## Running Tests

```bash
cd backend
npm test
```

Expected output: **48 tests across 3 suites — all passing** (~1 second)

```bash
# With coverage report
npm run test:coverage
```

---

## Configuration

The backend reads these environment variables at startup. Invalid values cause a **fail-fast exit with a clear message** — the server will not start silently broken.

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `DISCOUNT_ORDER_INTERVAL` | `5` | Every Nth order opens a discount code generation window |
| `DISCOUNT_PERCENT` | `10` | Discount % applied by generated codes (must be 1–100) |

**Quick tip for testing the discount flow** — set a lower interval so you don't have to place 5 orders:

```bash
# Windows PowerShell
$env:DISCOUNT_ORDER_INTERVAL=2; npm run dev

# macOS / Linux
DISCOUNT_ORDER_INTERVAL=2 npm run dev
```

---

## How the Discount System Works

The spec says "every Nth order gets a coupon code." The key word is *before* — the admin generates the code in the window before the Nth order is placed, so the customer placing that order can actually use it on their checkout.

```
For N=5:

  Orders 1–3 placed  →  too early, window not open
  Order 4 placed     →  ✅ window opens — admin can generate code now
  Order 5 not yet    →  admin generates SAVE10-XXXXXXXX
  Customer places order 5 with code → gets 10% off
  Window closes, next window opens before order 10
```

**Generation is admin-only** — there is no auto-generation on checkout. This matches the spec: *"the admin can generate a discount code if the condition is satisfied."*

**To test the full flow:**
1. Start with `DISCOUNT_ORDER_INTERVAL=2`
2. Place 1 order from the shop
3. Go to the Admin panel — the window is now open
4. Click "Generate Code" — copy the code
5. Place a second order and paste the code at checkout
6. Admin stats will show the discount was applied

---

## API Reference

Full interactive docs at **http://localhost:3001/api-docs** (Scalar — all endpoints have request bodies, response schemas, and error examples). The spec is generated programmatically from the Zod schemas in `@ub-task/shared-types` — no YAML, no JSDoc comments.

### Customer

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/cart/:cartId` | Get cart contents |
| `POST` | `/api/cart/:cartId/items` | Add item to cart |
| `PATCH` | `/api/cart/:cartId/items/:productId` | Update item quantity (0 = remove) |
| `DELETE` | `/api/cart/:cartId/items/:productId` | Remove item from cart |
| `POST` | `/api/checkout` | Place order with optional discount code |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Revenue, orders, discount code usage |
| `GET` | `/api/admin/discount/status` | Is the generation window currently open? |
| `POST` | `/api/admin/discount/generate` | Generate a code (400 if window not open) |

### Utility

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/seed` | Reset all state and re-seed products (idempotent) |
| `GET` | `/health` | Health check |

---

## Project Structure

```
ub-task/
├── packages/
│   └── shared-types/         # @ub-task/shared-types — single source of truth
│       ├── index.ts           # Re-exports + inferred TypeScript types (z.infer<>)
│       ├── schemas.ts         # Domain Zod schemas with .openapi() annotations
│       └── validators.ts      # Request validation schemas (AddItem, UpdateItem, Checkout)
│
├── backend/                   # TypeScript + Express API
│   ├── src/
│   │   ├── config/            # N, X env config + fail-fast validator
│   │   ├── domain/types.ts    # Backend type overrides (Date vs ISODateString)
│   │   ├── errors/AppError.ts # Typed HTTP errors
│   │   ├── middleware/        # errorHandler, validate (uses shared Zod schemas)
│   │   ├── services/          # CartService, DiscountService, OrderService, StatsService
│   │   ├── routes/            # products, cart, checkout, admin, seed
│   │   ├── swagger/openapi.ts # OpenAPI registry + route definitions (imports from shared-types)
│   │   ├── app.ts             # Express setup + Scalar
│   │   └── server.ts          # Entry point + fail-fast startup validation
│   └── tests/unit/            # 48 Vitest unit tests
│
├── frontend/                  # Next.js App Router
│   └── src/
│       ├── app/               # Pages: / (shop), /admin (dashboard)
│       ├── components/        # Navbar, ProductCard, CartSidebar (with checkout flow)
│       ├── context/           # CartContext — cart state + API actions
│       ├── lib/api.ts         # Typed fetch client with Zod pre-flight validation
│       └── types/             # Re-exports from @ub-task/shared-types
│
├── docs/
│   └── postman_collection.json  # Importable Postman collection (all endpoints)
│
├── DECISIONS.md               # 9 architectural decisions with context and trade-offs
└── README.md
```

---

## Postman Collection

If you prefer Postman over Scalar, import `docs/postman_collection.json`. It has pre-configured requests for every endpoint including the discount flow end-to-end.
