'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Cart, Order } from '@/types';
import * as api from '@/lib/api';

interface CartContextType {
  cartId: string;
  cart: Cart | null;
  lastOrder: Order | null;
  isLoading: boolean;
  isOpen: boolean;
  view: 'cart' | 'checkout' | 'confirmation';
  openCart: () => void;
  closeCart: () => void;
  setView: (v: 'cart' | 'checkout' | 'confirmation') => void;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  placeOrder: (discountCode?: string) => Promise<Order>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

function getOrCreateCartId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('ub_cart_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('ub_cart_id', id);
  }
  return id;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartId, setCartId] = useState('');
  const [cart, setCart] = useState<Cart | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'cart' | 'checkout' | 'confirmation'>('cart');

  // Initialise cart ID from localStorage on mount
  useEffect(() => {
    const id = getOrCreateCartId();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartId(id);
    // Try to fetch existing cart
    api.getCart(id).then(setCart).catch(() => null);
  }, []);

  const openCart = useCallback(() => {
    setIsOpen(true);
    setView('cart');
  }, []);

  const closeCart = useCallback(() => {
    setIsOpen(false);
    // Reset to cart view after animation settles
    setTimeout(() => setView('cart'), 300);
  }, []);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      setIsLoading(true);
      try {
        const updated = await api.addToCart(cartId, productId, quantity);
        setCart(updated);
        openCart();
      } finally {
        setIsLoading(false);
      }
    },
    [cartId, openCart],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setIsLoading(true);
      try {
        const updated = await api.removeCartItem(cartId, productId);
        setCart(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [cartId],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      setIsLoading(true);
      try {
        const updated = await api.updateCartItem(cartId, productId, quantity);
        setCart(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [cartId],
  );

  const placeOrder = useCallback(
    async (discountCode?: string): Promise<Order> => {
      setIsLoading(true);
      try {
        const res = await api.checkout(cartId, discountCode);
        setLastOrder(res.order);
        setCart(null); // cart is cleared on backend
        // Generate a new cart ID for the next session
        const newId = crypto.randomUUID();
        localStorage.setItem('ub_cart_id', newId);
        setCartId(newId);
        setView('confirmation');
        return res.order;
      } finally {
        setIsLoading(false);
      }
    },
    [cartId],
  );

  const totalItems = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cartId,
        cart,
        lastOrder,
        isLoading,
        isOpen,
        view,
        openCart,
        closeCart,
        setView,
        addItem,
        removeItem,
        updateQuantity,
        placeOrder,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
