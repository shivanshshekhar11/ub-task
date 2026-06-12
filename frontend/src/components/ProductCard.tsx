'use client';

import { useState } from 'react';
import { Heart, Activity, Car, House, Plane, Briefcase, Plus, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';

const CATEGORY_META: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  Life:     { icon: Heart,     color: '#7c6ffc', bg: 'rgba(124,111,252,0.12)' },
  Health:   { icon: Activity,  color: '#22d3a0', bg: 'rgba(34,211,160,0.12)' },
  Auto:     { icon: Car,       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  Home:     { icon: House,     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  Travel:   { icon: Plane,     color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  Business: { icon: Briefcase, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

const FALLBACK = { icon: Briefcase, color: '#7c6ffc', bg: 'rgba(124,111,252,0.12)' };

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, isLoading } = useCart();
  const [adding, setAdding] = useState(false);
  const meta = CATEGORY_META[product.category] ?? FALLBACK;
  const Icon = meta.icon;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addItem(product.id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      id={`product-${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[--radius-lg] border border-[--color-border] bg-[--color-bg-surface] transition-all duration-200 hover:border-[--color-border-bright] hover:shadow-[--shadow-md] hover:-translate-y-0.5"
    >
      {/* Accent top strip */}
      <div
        className="h-0.5 w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }}
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header row: icon + badge */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[--radius-sm]"
            style={{ background: meta.bg }}
          >
            <Icon className="h-4 w-4" style={{ color: meta.color }} strokeWidth={2} />
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ background: meta.bg, color: meta.color }}
          >
            {product.category}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2">
          <h3 className="text-sm font-semibold leading-snug text-[--color-text-primary]">
            {product.name}
          </h3>
          <p className="text-xs leading-relaxed text-[--color-text-secondary]">
            {product.description}
          </p>
        </div>

        {/* Footer: price + CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs font-medium text-[--color-text-muted]">$</span>
            <span className="text-xl font-bold tabular-nums text-[--color-text-primary]">
              {product.price.toFixed(2)}
            </span>
            <span className="ml-1 text-xs text-[--color-text-muted]">/yr</span>
          </div>

          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAdd}
            disabled={isLoading || adding}
            aria-label={`Add ${product.name} to cart`}
            className="flex items-center gap-1.5 rounded-[--radius-sm] px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${meta.color}, #9c4fff)`,
              boxShadow: `0 2px 12px rgba(124,111,252,0.25)`,
            }}
          >
            {adding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            )}
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
