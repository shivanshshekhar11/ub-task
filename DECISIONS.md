# Design Decisions

These are the meaningful choices I made while building this, and the reasoning behind them. I'm documenting them partly because the spec asked for it, and partly because I think these decisions are genuinely interesting and worth defending.

---

## Decision: TypeScript on Both Sides

**Context:** The task said "use whatever stack you're comfortable with." I had full freedom to pick Python, Go, plain JavaScript — anything. The question was whether that freedom was really the point of the question.

**Options Considered:**
- Plain JavaScript — zero friction, no compiler, fastest to write
- Python + FastAPI — excellent ergonomics, rich ecosystem, great for APIs
- TypeScript — more setup, but strong typing across the full stack

**Choice:** TypeScript everywhere (Node.js + Express on the backend, Next.js on the frontend)

**Why:** The job description says they "primarily work with TypeScript/Node.js." Choosing Python when the team lives in TypeScript would signal a mismatch before the interview even starts. But beyond the optics — TypeScript's type system genuinely shapes how I think about the domain. When I define `Cart`, `Order`, and `DiscountCode` as interfaces, those types become the spec. The compiler catches the inevitable moment when I refactor something and forget to update a caller. For a project with a shared data contract between frontend and backend (which this became), TypeScript paid for itself immediately.

---

## Decision: Service Layer, Not Fat Route Handlers

**Context:** The API has real business logic — discount windows, cart state, order sequencing. I could have put all of that directly in Express route handlers, which is the path of least resistance.

**Options Considered:**
- Fat handlers — all logic lives in `router.post('/checkout', (req, res) => { ... lots of code ... })`
- Thin handlers + service layer — handlers parse the request and delegate; services own the logic

**Choice:** Separate service classes (`CartService`, `DiscountService`, `OrderService`, `StatsService`)

**Why:** Route handlers are hard to test. To test a fat handler you need to mock Express's req/res objects, which is friction that makes people skip writing tests. With a service layer, I can call `discountService.generateCode()` directly in a test with no HTTP machinery involved. That's why all 48 tests run in under a second — they're just function calls. The handler itself becomes so thin it rarely needs a test of its own. This also means the service layer could be extracted into a microservice later without touching the business logic at all.

---

## Decision: Singleton Store with an Idempotent Seed

**Context:** The spec said an in-memory store is fine. I needed to decide how that store would be structured and how tests would share (and isolate) it.

**Options Considered:**
- Module-level global variables — simple, but no clean reset mechanism
- Singleton class — encapsulated, resettable, importable as a single instance
- Dependency injection — most testable, but significant added complexity for this scope

**Choice:** `InMemoryStore` class exported as a single `store` instance

**Why:** The singleton gives all services access to the same state object, which is what you want when everything runs in one process. More importantly, it has a `seed()` method that clears everything and re-seeds the same product catalog every time it's called. Tests call `store.seed()` in `beforeEach`, which gives hermetic isolation without spawning new processes or mocking module boundaries. The same `seed()` powers the "Reset & Seed" button in the admin dashboard — so the demo reset and test isolation share the same mechanism. That kind of consistency across contexts feels right. If I ever needed to swap to a real database, only `InMemoryStore` would change; the services wouldn't know the difference.

---

## Decision: Admin-Only, Pre-Order Discount Code Generation

**Context:** This was the trickiest design decision. The spec says two things: "every Nth order gets a coupon code" and "the admin can generate a discount code if the condition is satisfied." Those two statements can be read in different ways.

**Options Considered:**
- Auto-generation after checkout — the Nth order triggers code creation automatically; customer can use it on a future order
- Admin-only, pre-order — admin generates the code in the window before the Nth order; customer uses it *on* the Nth order

**Choice:** Admin-only, pre-order window. The window for code `c` is open when `orderCounter ∈ [c*N − 1, c*N)`.

**Why:** Re-reading the spec: "a discount code can be generated for every Nth order from the admin endpoint **before** that order is placed." The word "before" is the key. Auto-generation after checkout technically satisfies "every Nth order earns a code" — but the customer who placed the Nth order can't use that code on the very order that earned it. They'd have to come back for a future order. That's a materially worse user experience, and I don't think it's what the spec intended.

The window model resolves this cleanly. After order #4 is placed (for N=5), the admin can generate the code. The customer placing order #5 can use it at checkout. The code is created *for* that order, not after it. The admin gets detailed error messages about where they are in the window cycle — "too early, window opens after order #4" or "too late, window closed at order #5, next opens after order #9" — so they know exactly when to act.

---

## Decision: Single-Use Discount Codes

**Context:** The spec didn't say anything explicit about whether codes could be reused. I had to make a call.

**Options Considered:**
- Single-use — code is marked as used after the first checkout; any subsequent attempt returns 400
- Multi-use — any customer can apply the same code any number of times

**Choice:** Single-use, with an audit trail (`isUsed`, `usedByOrderId`, `usedAt`)

**Why:** The whole point of this discount system is that a specific customer earned a reward for being the Nth order. A multi-use code turns that into a general promotion — anyone who finds out the code string gets the discount, forever. That's not a loyalty reward, that's a leak. Single-use is the standard for exactly this reason; Stripe Coupons, Shopify discount codes, airline miles redemptions all work this way. The audit trail (`usedByOrderId`) means an admin can look at any code and see exactly which order consumed it — useful for debugging and for future business analytics.

---

## Decision: Zod for Validation Across the Stack

**Context:** I needed request body validation for the cart and checkout endpoints. The backend needed to reject bad inputs cleanly; the frontend needed to catch them before wasting a network round-trip.

**Options Considered:**
- Manual validation — `if (!req.body.productId) return res.status(400)...` — verbose and easy to forget edge cases
- Joi — battle-tested but JavaScript-first; type inference requires extra configuration
- class-validator — decorator-based, needs `reflect-metadata`, feels heavy for this
- Zod — TypeScript-native: the schema *is* the type via `z.infer<>`

**Choice:** Zod, with schemas defined once in `@ub-task/shared-types` and used by both the backend middleware and frontend API client

**Why:** The backend `validate` middleware calls `schema.safeParse(req.body)` and returns 400 on failure. The frontend's `api.ts` calls the same schema's `safeParse` before every `fetch()` — same rules, same error messages, no round-trip on bad input. The discount code input in the cart sidebar validates in real-time as you type using `checkoutSchema.shape.discountCode.safeParse`. If I later tighten a validation rule (say, add a length limit to the discount code), I change it in one place and both layers update automatically. This is the pattern that tRPC popularised, and it's genuinely useful.

---

## Decision: Next.js App Router for the Frontend

**Context:** The spec said "frontend is a plus." I could have shipped a Postman collection and called it done, or built a minimal HTML page, or gone all-in on a proper React app.

**Options Considered:**
- No frontend — just a Postman collection; saves time, focuses backend quality
- Plain HTML + fetch — quick, zero dependencies, but no component reuse or type safety
- React + Vite — lightweight SPA, good DX
- Next.js App Router — full framework, SSR capable, current industry standard

**Choice:** Next.js with App Router, **Tailwind v4**, lucide-react for icons

**Why:** A working frontend demonstrates the end-to-end flow in a way that Postman can't — the reviewer can see the cart sidebar open, the discount code field light up red when invalid input is typed, the admin dashboard update in real-time after generating a code. That's more compelling than a JSON response in Postman. I chose Next.js because it's what I'd use in a real project at this company's scale, and App Router with file-based routing is the current best practice.

Tailwind v4 over vanilla CSS for two reasons. First, utility classes co-located with components are faster to read and modify than hunting across `.module.css` files — especially for a reviewer scanning the code. Second, Tailwind v4's CSS-first configuration (`@import "tailwindcss"`, `@theme {}` blocks) eliminates the `tailwind.config.js` file entirely and has first-class Turbopack support in Next.js 16. The design tokens (colors, radius, shadows) live in one `@theme` block in `globals.css` and Tailwind generates corresponding utilities automatically.

Lucide React replaces emoji throughout — every icon is a clean, consistent SVG, tree-shaken at build time, typed via `LucideIcon`. Category icons (Heart, Activity, Car, House, Plane, Briefcase) communicate meaning visually without relying on OS-specific emoji rendering.

---

## Decision: Shared Types, Validators, and OpenAPI Schemas — One Package, One Definition

**Context:** Both the backend and frontend needed the same type definitions — `Product`, `Cart`, `Order`, `DiscountCode`, and the Zod schemas for request bodies. Without a shared source, I'd be maintaining two copies that could silently drift apart. The further question was: how far to take the sharing.

**Options Considered:**
- Duplicate declarations — copy types into `backend/src/domain/types.ts` and `frontend/src/types/index.ts`; simple but high drift risk
- Shared package with hand-written interfaces + separate Zod schemas — less drift than duplication, but still two definitions per type
- Shared package where Zod schemas *are* the types — one definition serves TypeScript, validation, and OpenAPI docs simultaneously

**Choice:** `packages/shared-types` as an npm workspace package, where every domain type is a Zod schema first and a TypeScript type second (via `z.infer<>`)

**Why:** The package has three files with distinct responsibilities. `validators.ts` calls `extendZodWithOpenApi(z)` once and defines the request body schemas (`addItemSchema`, `updateItemSchema`, `checkoutSchema`) — used by the backend's `validate` middleware and by the frontend's API client for pre-flight checks before every fetch. `schemas.ts` defines Zod schemas for every domain type (`ProductSchema`, `CartSchema`, `OrderSchema`, `DiscountCodeSchema`, etc.) with `.openapi()` annotations baked in. `index.ts` re-exports everything and derives the TypeScript types with `z.infer<typeof XxxSchema>`.

The consequence is that there is exactly one definition per type in the entire monorepo. When `DiscountCodeSchema` gains a new field, three things update automatically: the TypeScript type used by the frontend, the runtime validation on the backend, and the OpenAPI schema rendered by Scalar. There is no separate schema file to maintain, no JSDoc YAML to keep in sync, no hand-maintained interface to update alongside. The backend's `openapi.ts` imports these schemas directly and registers route paths against them — it contains zero schema definitions of its own.

One nuance worth documenting: the shared package uses `ISODateString = string` for all date fields, because that's what travels over the wire. The backend service layer keeps real `Date` objects internally for arithmetic and comparisons. `StatsService` maps those to `.toISOString()` strings explicitly before returning, so the TypeScript types are honest end-to-end — no silent reliance on `JSON.stringify` to paper over a type mismatch.

---

## Decision: Full OpenAPI Documentation via Scalar + zod-to-openapi

**Context:** I had already decided to document the API. The question was *how*. The traditional approach — `swagger-jsdoc` with YAML blocks in JSDoc comments — works but has a fundamental problem: the documentation and the code that implements it live in completely different places, and there's no compiler to tell you when they've drifted apart.

**Options Considered:**
- `swagger-jsdoc` + Swagger UI — YAML-in-comments, widely used, but verbose and drift-prone
- Manual OpenAPI YAML file — single source but hand-maintained, no TypeScript integration
- `zod-to-openapi` + Scalar — generates the spec from the existing Zod schemas, rendered by Scalar UI

**Choice:** `@asteasolutions/zod-to-openapi` to generate the spec, `@scalar/express-api-reference` to render it

**Why:** We already have Zod schemas in `@ub-task/shared-types` for validation. With `zod-to-openapi`, those same schemas become the OpenAPI spec — you add `.openapi({ example: ... })` annotations once, register routes in a typed `OpenAPIRegistry`, and call `generateSpec()` to get a complete OpenAPI 3.0 document. No YAML, no JSDoc comments, no separate schema file that can drift. If a schema changes, the documentation updates automatically because they're the same thing.

Scalar renders the spec with a significantly better UI than Swagger UI — it's closer to what you'd see on Stripe or Linear's API docs: a clean sidebar, dark theme, one-click request examples with "Try it out" that actually works. It mounts as a single Express middleware and requires no configuration beyond pointing it at the spec object. The purple theme matches the app's accent color, which is a small but deliberate touch.
