import { Cart, DiscountCode, Order, Product } from '../domain/types';

// ─── Seed Data ────────────────────────────────────────────────────────────────
// Insurance-themed products — a nod to Uniblox's domain.
// The seed is intentionally idempotent: calling seed() always produces
// the same deterministic state regardless of prior operations.

const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Term Life Insurance',
    description: 'Comprehensive life coverage for 20 years with guaranteed premiums',
    price: 299.99,
    category: 'Life',
  },
  {
    id: 'prod-2',
    name: 'Health Shield Basic',
    description: 'Essential health coverage for individuals with zero deductibles',
    price: 149.99,
    category: 'Health',
  },
  {
    id: 'prod-3',
    name: 'Auto Complete Coverage',
    description: 'Full comprehensive auto insurance — collision, liability & more',
    price: 199.99,
    category: 'Auto',
  },
  {
    id: 'prod-4',
    name: 'Home Guardian Pro',
    description: 'Complete home and property protection against all natural events',
    price: 249.99,
    category: 'Home',
  },
  {
    id: 'prod-5',
    name: 'Travel Safe Bundle',
    description: 'International travel coverage with 24/7 medical evacuation',
    price: 79.99,
    category: 'Travel',
  },
  {
    id: 'prod-6',
    name: 'Business Starter Pack',
    description: 'Small business general liability and property coverage',
    price: 399.99,
    category: 'Business',
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * InMemoryStore is the single source of truth for all application state.
 *
 * Design decisions:
 * - Singleton pattern: one shared instance across all services, avoiding
 *   inconsistency from multiple instances.
 * - Exposed as a named export (`store`) so services import the instance
 *   directly. Tests call `store.seed()` in `beforeEach` to reset state.
 * - No database: per spec, an in-memory store is sufficient. The
 *   service-layer abstraction would make swapping to a real DB trivial.
 */
class InMemoryStore {
  products: Map<string, Product> = new Map();
  carts: Map<string, Cart> = new Map();
  orders: Order[] = [];
  discountCodes: Map<string, DiscountCode> = new Map();

  /** Total number of successfully placed orders */
  orderCounter: number = 0;

  /**
   * How many discount code milestones have already been fulfilled.
   * Used to prevent double-generation for the same nth-order milestone.
   */
  discountMilestonesGenerated: number = 0;

  constructor() {
    this.seed();
  }

  /**
   * Resets ALL state and re-seeds the fixed product catalog.
   * Idempotent: produces the same deterministic state on every call.
   */
  seed(): void {
    this.products.clear();
    this.carts.clear();
    this.orders = [];
    this.discountCodes.clear();
    this.orderCounter = 0;
    this.discountMilestonesGenerated = 0;

    SEED_PRODUCTS.forEach((p) => this.products.set(p.id, p));
  }
}

/** Singleton store instance shared by all services */
export const store = new InMemoryStore();
