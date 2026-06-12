import { Cart, CartItem } from '../domain/types';
import { AppError } from '../errors/AppError';
import { store } from '../store/InMemoryStore';

/**
 * CartService — handles all cart mutation and retrieval logic.
 *
 * Carts are lazily created: the first call to addItem with a new cartId
 * creates the cart implicitly. This avoids a separate "create cart" endpoint
 * and lets the frontend generate its own UUID-based cart ID (stored in localStorage),
 * reducing round-trips.
 */
export class CartService {
  /** Retrieves an existing cart or creates a new one for the given ID */
  getOrCreateCart(cartId: string): Cart {
    if (!store.carts.has(cartId)) {
      const cart: Cart = {
        id: cartId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.carts.set(cartId, cart);
    }
    return store.carts.get(cartId)!;
  }

  /** Retrieves a cart — throws 404 if it doesn't exist */
  getCart(cartId: string): Cart {
    const cart = store.carts.get(cartId);
    if (!cart) {
      throw new AppError(404, `Cart '${cartId}' not found`);
    }
    return cart;
  }

  /**
   * Adds a product to the cart. If the product is already in the cart,
   * its quantity is incremented rather than creating a duplicate entry.
   */
  addItem(cartId: string, productId: string, quantity: number): Cart {
    if (quantity <= 0) {
      throw new AppError(400, 'Quantity must be a positive integer');
    }

    const product = store.products.get(productId);
    if (!product) {
      throw new AppError(404, `Product '${productId}' not found`);
    }

    const cart = this.getOrCreateCart(cartId);
    const existing = cart.items.find((i) => i.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      const item: CartItem = {
        productId,
        productName: product.name,
        unitPrice: product.price,
        quantity,
      };
      cart.items.push(item);
    }

    cart.updatedAt = new Date();
    return cart;
  }

  /** Updates the quantity of an existing cart item. Removes it if quantity reaches 0. */
  updateItemQuantity(cartId: string, productId: string, quantity: number): Cart {
    const cart = this.getCart(cartId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) {
      throw new AppError(404, `Item '${productId}' not found in cart`);
    }

    if (quantity <= 0) {
      return this.removeItem(cartId, productId);
    }

    item.quantity = quantity;
    cart.updatedAt = new Date();
    return cart;
  }

  /** Removes a product from the cart entirely */
  removeItem(cartId: string, productId: string): Cart {
    const cart = this.getCart(cartId);
    const index = cart.items.findIndex((i) => i.productId === productId);
    if (index === -1) {
      throw new AppError(404, `Item '${productId}' not found in cart`);
    }

    cart.items.splice(index, 1);
    cart.updatedAt = new Date();
    return cart;
  }

  /** Empties the cart after a successful checkout */
  clearCart(cartId: string): void {
    const cart = store.carts.get(cartId);
    if (cart) {
      cart.items = [];
      cart.updatedAt = new Date();
    }
  }
}

export const cartService = new CartService();
