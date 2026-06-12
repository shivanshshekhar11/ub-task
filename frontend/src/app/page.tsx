'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Product } from '@/types';
import * as api from '@/lib/api';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import CartSidebar from '@/components/CartSidebar';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch(() => setError('Failed to load products. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = filter === 'All' ? products : products.filter((p) => p.category === filter);

  return (
    <>
      <Navbar />
      <CartSidebar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-[--color-border] py-20">
          {/* Background glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/4 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #7c6ffc, #9c4fff)' }}
          />
          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[--color-accent]/30 bg-[--color-accent-light] px-4 py-1.5 text-xs font-semibold text-[--color-accent] mb-6">
              Modern Insurance Marketplace
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-[--color-text-primary] md:text-5xl lg:text-6xl">
              Insurance That
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(90deg, #7c6ffc, #f472b6)' }}
              >
                Fits Your Life
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-md text-base text-[--color-text-secondary]">
              Instant coverage, transparent pricing, and smart rewards.
              Every 5th order earns a discount code.
            </p>
          </div>
        </section>

        {/* Product grid */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          {/* Category filter */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`filter-${cat.toLowerCase()}`}
                onClick={() => setFilter(cat)}
                className={[
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  filter === cat
                    ? 'bg-[--color-accent] text-white shadow-[--shadow-glow]'
                    : 'border border-[--color-border] bg-[--color-bg-elevated] text-[--color-text-secondary] hover:border-[--color-border-bright] hover:text-[--color-text-primary]',
                ].join(' ')}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--color-border] border-t-[--color-accent]" />
              <p className="text-sm text-[--color-text-muted]">Loading products…</p>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-md rounded-[--radius-md] border border-[--color-error]/20 bg-[--color-error-light] px-5 py-4">
              <div className="flex items-center gap-3 text-sm text-[--color-error]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
