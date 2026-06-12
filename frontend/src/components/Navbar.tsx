'use client';

import Link from 'next/link';
import { ShieldCheck, ShoppingCart, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { totalItems, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-[--color-border] bg-[--color-bg-surface]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-[--color-text-primary] transition-opacity hover:opacity-80"
        >
          <ShieldCheck className="h-5 w-5 text-[--color-accent]" strokeWidth={2.5} />
          <span className="text-base tracking-tight">Uniblox Store</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[--color-text-secondary] transition-colors hover:bg-[--color-bg-elevated] hover:text-[--color-text-primary]"
          >
            Shop
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[--color-text-secondary] transition-colors hover:bg-[--color-bg-elevated] hover:text-[--color-text-primary]"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Admin
          </Link>
        </nav>

        {/* Cart button */}
        <button
          id="cart-button"
          onClick={openCart}
          aria-label="Open cart"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border] bg-[--color-bg-elevated] text-[--color-text-secondary] transition-all hover:border-[--color-border-bright] hover:text-[--color-text-primary]"
        >
          <ShoppingCart className="h-4 w-4" />
          {totalItems > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[--color-accent] text-[10px] font-bold text-white">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
