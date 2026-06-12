'use client';

import { useState } from 'react';
import {
  X, ShoppingCart, Minus, Plus, Trash2,
  ArrowRight, ArrowLeft, CheckCircle2, Loader2, Info, Tag,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { checkoutSchema } from '@/types';
import type { Order } from '@/types';

// ── Cart view ─────────────────────────────────────────────────────────────────

function CartView() {
  const { cart, removeItem, updateQuantity, isLoading, setView } = useCart();
  const subtotal = cart?.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) ?? 0;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[--color-border] bg-[--color-bg-elevated]">
          <ShoppingCart className="h-7 w-7 text-[--color-text-muted]" />
        </div>
        <div>
          <p className="font-semibold text-[--color-text-secondary]">Your cart is empty</p>
          <p className="mt-1 text-sm text-[--color-text-muted]">
            Add insurance products to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {cart.items.map((item) => (
          <div
            key={item.productId}
            className="rounded-[--radius-md] border border-[--color-border] bg-[--color-bg-elevated] p-4 transition-colors hover:border-[--color-border-bright]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-snug text-[--color-text-primary]">
                {item.productName}
              </p>
              <p className="shrink-0 text-sm font-bold text-[--color-accent]">
                ${item.unitPrice.toFixed(2)}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              {/* Qty control */}
              <div className="flex items-center overflow-hidden rounded-lg border border-[--color-border] bg-[--color-bg-base]">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  disabled={isLoading}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center text-[--color-text-secondary] transition-colors hover:bg-[--color-bg-elevated] hover:text-[--color-text-primary] disabled:opacity-40"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-[--color-text-primary]">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={isLoading}
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center text-[--color-text-secondary] transition-colors hover:bg-[--color-bg-elevated] hover:text-[--color-text-primary] disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.productId)}
                disabled={isLoading}
                aria-label={`Remove ${item.productName}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[--color-border] text-[--color-text-muted] transition-all hover:border-transparent hover:bg-[--color-error-light] hover:text-[--color-error] disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-[--color-border] p-5 space-y-3">
        <div className="flex items-center justify-between text-sm text-[--color-text-secondary]">
          <span>Subtotal</span>
          <span className="text-lg font-bold text-[--color-text-primary]">
            ${subtotal.toFixed(2)}
          </span>
        </div>
        <button
          id="proceed-checkout-btn"
          onClick={() => setView('checkout')}
          className="flex w-full items-center justify-center gap-2 rounded-[--radius-md] py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[--shadow-glow]"
          style={{ background: 'linear-gradient(135deg, #7c6ffc, #9c4fff)' }}
        >
          Proceed to Checkout
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

// ── Checkout view ─────────────────────────────────────────────────────────────

function CheckoutView({ onBack }: { onBack: () => void }) {
  const { cart, placeOrder, isLoading } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [error, setError] = useState('');

  const subtotal = cart?.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) ?? 0;

  const handleCodeChange = (value: string) => {
    setDiscountCode(value.toUpperCase());
    if (!value.trim()) { setCodeError(''); return; }
    const result = checkoutSchema.shape.discountCode.safeParse(value.trim());
    setCodeError(result.success ? '' : (result.error.errors[0]?.message ?? ''));
  };

  const handleCheckout = async () => {
    setError('');
    if (codeError) return;
    try {
      await placeOrder(discountCode.trim() || undefined);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Order summary */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted]">
            Order Summary
          </p>
          <div className="rounded-[--radius-md] border border-[--color-border] bg-[--color-bg-elevated] divide-y divide-[--color-border]">
            {cart?.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[--color-text-secondary]">
                  {item.productName} <span className="text-[--color-text-muted]">× {item.quantity}</span>
                </span>
                <span className="font-semibold text-[--color-text-primary]">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Discount code */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[--color-text-muted]">
            <Tag className="h-3 w-3" />
            Discount Code
          </p>
          <input
            id="discount-code-input"
            type="text"
            placeholder="e.g. SAVE10-XXXXXXXX"
            value={discountCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            aria-describedby={codeError ? 'code-error' : undefined}
            aria-invalid={!!codeError}
            className={[
              'w-full rounded-[--radius-sm] border bg-[--color-bg-base] px-3 py-2.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted]',
              'transition-all outline-none font-mono tracking-wider',
              codeError
                ? 'border-[--color-error] ring-2 ring-[--color-error]/20 focus:ring-[--color-error]/30'
                : 'border-[--color-border] focus:border-[--color-accent] focus:ring-2 focus:ring-[--color-accent]/20',
            ].join(' ')}
          />
          {codeError && (
            <p id="code-error" role="alert" className="flex items-center gap-1.5 text-xs text-[--color-error]">
              <Info className="h-3 w-3 shrink-0" />
              {codeError}
            </p>
          )}
          <p className="text-xs text-[--color-text-muted]">
            Leave blank to skip. Codes are single-use.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-[--radius-sm] border border-[--color-error]/20 bg-[--color-error-light] px-4 py-3 text-sm text-[--color-error]">
            {error}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[--color-border] p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[--color-text-secondary]">Total</span>
          <span className="text-lg font-bold text-[--color-text-primary]">${subtotal.toFixed(2)}</span>
        </div>
        <button
          id="place-order-btn"
          onClick={handleCheckout}
          disabled={isLoading || !!codeError}
          title={codeError || undefined}
          className="flex w-full items-center justify-center gap-2 rounded-[--radius-md] py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[--shadow-glow] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #7c6ffc, #9c4fff)' }}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order…</>
          ) : 'Place Order'}
        </button>
        <button
          onClick={onBack}
          className="flex w-full items-center justify-center gap-2 rounded-[--radius-md] py-2.5 text-sm text-[--color-text-secondary] transition-colors hover:text-[--color-text-primary]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Cart
        </button>
      </div>
    </>
  );
}

// ── Confirmation view ─────────────────────────────────────────────────────────

function ConfirmationView({ order }: { order: Order }) {
  const { closeCart } = useCart();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: 'rgba(34,211,160,0.12)',
          animation: 'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <CheckCircle2 className="h-8 w-8 text-[--color-success]" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-[--color-success]">Order Placed</h3>
        <p className="mt-1 text-sm text-[--color-text-secondary]">Order #{order.orderNumber}</p>
      </div>

      <div className="w-full rounded-[--radius-md] border border-[--color-border] bg-[--color-bg-elevated] divide-y divide-[--color-border] text-left">
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-[--color-text-secondary]">Subtotal</span>
          <span className="font-semibold text-[--color-text-primary]">${order.subtotal.toFixed(2)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between px-4 py-3 text-sm">
            <span className="text-[--color-success]">
              Discount <span className="font-mono text-xs">({order.discountCode})</span>
            </span>
            <span className="font-semibold text-[--color-success]">−${order.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between px-4 py-3 text-sm font-bold">
          <span className="text-[--color-text-primary]">Total Charged</span>
          <span className="text-[--color-text-primary]">${order.total.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-xs text-[--color-text-muted]">
        Check the Admin panel to see if you earned a discount code for the next order.
      </p>

      <button
        id="continue-shopping-btn"
        onClick={closeCart}
        className="w-full rounded-[--radius-md] py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[--shadow-glow]"
        style={{ background: 'linear-gradient(135deg, #7c6ffc, #9c4fff)' }}
      >
        Continue Shopping
      </button>
    </div>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export default function CartSidebar() {
  const { isOpen, closeCart, view, setView, lastOrder } = useCart();

  const titles: Record<string, string> = {
    cart: 'Your Cart',
    checkout: 'Checkout',
    confirmation: 'Order Confirmed',
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease' }}
          onClick={closeCart}
        />
      )}

      <aside
        role="complementary"
        aria-label="Shopping cart"
        className={[
          'fixed right-0 top-0 z-50 flex h-dvh w-[420px] max-w-full flex-col',
          'border-l border-[--color-border] bg-[--color-bg-surface] shadow-[--shadow-lg]',
          'transition-transform duration-300 ease-[--ease-ui]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[--color-border] px-5 py-4">
          <h2 className="text-base font-semibold text-[--color-text-primary]">{titles[view]}</h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[--color-text-muted] transition-colors hover:bg-[--color-bg-elevated] hover:text-[--color-text-primary]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {view === 'cart' && <CartView />}
          {view === 'checkout' && <CheckoutView onBack={() => setView('cart')} />}
          {view === 'confirmation' && lastOrder && <ConfirmationView order={lastOrder} />}
        </div>
      </aside>
    </>
  );
}
