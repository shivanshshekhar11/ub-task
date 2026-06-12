import { beforeEach, describe, expect, it } from 'vitest';
import { store } from '../../src/store/InMemoryStore';
import { CartService } from '../../src/services/CartService';
import { AppError } from '../../src/errors/AppError';

describe('CartService', () => {
  let cartService: CartService;

  beforeEach(() => {
    // Reset all state before each test — store.seed() is idempotent
    store.seed();
    cartService = new CartService();
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('creates a new cart when the cartId does not exist', () => {
      const cart = cartService.addItem('cart-new', 'prod-1', 1);
      expect(cart.id).toBe('cart-new');
      expect(cart.items).toHaveLength(1);
    });

    it('adds the correct product data to the cart item', () => {
      const cart = cartService.addItem('cart-1', 'prod-1', 2);
      const item = cart.items[0];
      expect(item.productId).toBe('prod-1');
      expect(item.productName).toBe('Term Life Insurance');
      expect(item.unitPrice).toBe(299.99);
      expect(item.quantity).toBe(2);
    });

    it('increments quantity when the same product is added again', () => {
      cartService.addItem('cart-1', 'prod-1', 2);
      cartService.addItem('cart-1', 'prod-1', 3);
      const cart = cartService.getCart('cart-1');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('adds multiple distinct products as separate cart items', () => {
      cartService.addItem('cart-1', 'prod-1', 1);
      cartService.addItem('cart-1', 'prod-2', 2);
      const cart = cartService.getCart('cart-1');
      expect(cart.items).toHaveLength(2);
    });

    it('throws 404 when the product does not exist', () => {
      expect(() => cartService.addItem('cart-1', 'non-existent', 1)).toThrowError(AppError);
      expect(() => cartService.addItem('cart-1', 'non-existent', 1)).toThrow('not found');
    });

    it('throws 400 when quantity is zero or negative', () => {
      expect(() => cartService.addItem('cart-1', 'prod-1', 0)).toThrowError(AppError);
      expect(() => cartService.addItem('cart-1', 'prod-1', -1)).toThrowError(AppError);
    });
  });

  // ── getCart ────────────────────────────────────────────────────────────────

  describe('getCart', () => {
    it('returns the cart when it exists', () => {
      cartService.addItem('cart-1', 'prod-1', 1);
      const cart = cartService.getCart('cart-1');
      expect(cart.id).toBe('cart-1');
    });

    it('throws 404 when cart does not exist', () => {
      const err = (() => {
        try {
          cartService.getCart('ghost-cart');
        } catch (e) {
          return e;
        }
      })();
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(404);
    });
  });

  // ── removeItem ─────────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('removes an item from the cart', () => {
      cartService.addItem('cart-1', 'prod-1', 2);
      cartService.addItem('cart-1', 'prod-2', 1);
      cartService.removeItem('cart-1', 'prod-1');
      const cart = cartService.getCart('cart-1');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe('prod-2');
    });

    it('throws 404 when the item is not in the cart', () => {
      cartService.addItem('cart-1', 'prod-1', 1);
      expect(() => cartService.removeItem('cart-1', 'prod-2')).toThrowError(AppError);
    });
  });

  // ── updateItemQuantity ─────────────────────────────────────────────────────

  describe('updateItemQuantity', () => {
    it('updates the quantity of an existing item', () => {
      cartService.addItem('cart-1', 'prod-1', 2);
      cartService.updateItemQuantity('cart-1', 'prod-1', 5);
      const cart = cartService.getCart('cart-1');
      expect(cart.items[0].quantity).toBe(5);
    });

    it('removes the item when quantity is set to 0', () => {
      cartService.addItem('cart-1', 'prod-1', 2);
      cartService.updateItemQuantity('cart-1', 'prod-1', 0);
      const cart = cartService.getCart('cart-1');
      expect(cart.items).toHaveLength(0);
    });
  });

  // ── clearCart ──────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('empties all items from the cart', () => {
      cartService.addItem('cart-1', 'prod-1', 1);
      cartService.addItem('cart-1', 'prod-2', 2);
      cartService.clearCart('cart-1');
      const cart = cartService.getCart('cart-1');
      expect(cart.items).toHaveLength(0);
    });
  });
});
