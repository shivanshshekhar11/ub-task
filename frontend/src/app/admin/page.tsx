'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, LayoutDashboard, Store, RefreshCw,
  Leaf, Zap, Loader2, TrendingUp, ShoppingBag,
  Tag, BadgePercent, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { DiscountCode, DiscountStatus, StoreStats } from '@/types';
import * as api from '@/lib/api';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-[--radius-lg] border p-5 transition-all',
        accent
          ? 'border-[--color-accent]/30 bg-[--color-accent-light]'
          : 'border-[--color-border] bg-[--color-bg-elevated] hover:border-[--color-border-bright]',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted]">
          {label}
        </p>
        <div
          className={[
            'flex h-7 w-7 items-center justify-center rounded-lg',
            accent ? 'bg-[--color-accent]/20' : 'bg-[--color-bg-hover]',
          ].join(' ')}
        >
          <Icon
            className="h-3.5 w-3.5"
            style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
          />
        </div>
      </div>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: accent ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-[--color-text-muted]">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [status, setStatus] = useState<DiscountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [genResult, setGenResult] = useState<DiscountCode | null>(null);
  const [genError, setGenError] = useState('');
  const [seedMsg, setSeedMsg] = useState('');
  const [seedOk, setSeedOk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([api.getStats(), api.getDiscountStatus()]);
      setStats(s);
      setStatus(st);
    } catch {
      // backend might not be running
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError('');
    setGenResult(null);
    try {
      const res = await api.generateDiscountCode();
      setGenResult(res.code);
      await load();
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await api.seedStore();
      setSeedMsg(res.message);
      setSeedOk(true);
      await load();
    } catch {
      setSeedMsg('Seed failed. Is the backend running?');
      setSeedOk(false);
    } finally {
      setSeeding(false);
    }
  };

  const windowStatusText = () => {
    if (!status) return '';
    if (status.eligible) {
      return `Window open — generate the code now, before order #${status.windowClosesAfterOrder} is placed.`;
    }
    if (status.totalOrders < status.windowOpensAfterOrder) {
      return `Window opens after order #${status.windowOpensAfterOrder} is placed (${status.totalOrders} so far).`;
    }
    const nextWindow = status.windowClosesAfterOrder + status.discountInterval - 1;
    return `Window closed — order #${status.windowClosesAfterOrder} was placed without a code. Next window opens after order #${nextWindow}.`;
  };

  return (
    <div className="flex min-h-dvh bg-[--color-bg-base]">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[--color-border] bg-[--color-bg-surface] p-5 lg:flex">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2.5 font-semibold text-[--color-text-primary] transition-opacity hover:opacity-80"
        >
          <ShieldCheck className="h-5 w-5 text-[--color-accent]" strokeWidth={2.5} />
          <span className="text-base tracking-tight">Uniblox Store</span>
        </Link>

        <nav className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[--color-text-secondary] transition-colors hover:bg-[--color-bg-elevated] hover:text-[--color-text-primary]"
          >
            <Store className="h-4 w-4" /> Shop
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
          >
            <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[--color-text-primary]">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-[--color-text-secondary]">
              Store analytics and discount management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="seed-btn"
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 rounded-lg border border-[--color-border] bg-[--color-bg-elevated] px-3 py-2 text-sm font-medium text-[--color-text-secondary] transition-all hover:border-[--color-border-bright] hover:text-[--color-text-primary] disabled:opacity-50"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Leaf className="h-3.5 w-3.5" />}
              Reset & Seed
            </button>
            <button
              id="refresh-btn"
              onClick={load}
              disabled={loading}
              title="Refresh stats"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[--color-border] bg-[--color-bg-elevated] text-[--color-text-secondary] transition-all hover:border-[--color-border-bright] hover:text-[--color-text-primary] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Seed message */}
        {seedMsg && (
          <div
            className={[
              'mb-6 flex items-center gap-3 rounded-[--radius-md] border px-4 py-3 text-sm',
              seedOk
                ? 'border-[--color-success]/20 bg-[--color-success-light] text-[--color-success]'
                : 'border-[--color-error]/20 bg-[--color-error-light] text-[--color-error]',
            ].join(' ')}
          >
            {seedOk ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {seedMsg}
          </div>
        )}

        {loading && !stats ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[--color-accent]" />
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={ShoppingBag} label="Total Orders" value={stats?.totalOrders ?? 0} />
              <StatCard icon={TrendingUp} label="Total Revenue" value={`$${(stats?.totalRevenue ?? 0).toFixed(2)}`} accent />
              <StatCard icon={Store} label="Items Purchased" value={stats?.totalItemsPurchased ?? 0} />
              <StatCard
                icon={BadgePercent}
                label="Discount Savings"
                value={`$${(stats?.totalDiscountAmount ?? 0).toFixed(2)}`}
                sub={`${stats?.usedDiscountCodes ?? 0} code${stats?.usedDiscountCodes !== 1 ? 's' : ''} used`}
              />
            </div>

            {/* Discount generator */}
            <div className="mb-6 rounded-[--radius-lg] border border-[--color-border] bg-[--color-bg-elevated] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <h2 className="text-base font-semibold text-[--color-text-primary]">
                    Discount Code Generator
                  </h2>
                  <p
                    className={[
                      'mt-1.5 text-sm',
                      status?.eligible ? 'text-[--color-success]' : 'text-[--color-text-secondary]',
                    ].join(' ')}
                  >
                    {windowStatusText()}{' '}
                    <span className="text-[--color-text-muted]">
                      (every {status?.discountInterval ?? 5}th order earns {status?.discountPercent ?? 10}% off)
                    </span>
                  </p>
                </div>
                <button
                  id="generate-discount-btn"
                  onClick={handleGenerate}
                  disabled={generating || !status?.eligible}
                  title={!status?.eligible ? 'Condition not yet met' : 'Generate a discount code'}
                  className={[
                    'flex items-center gap-2 rounded-[--radius-md] px-5 py-2.5 text-sm font-semibold transition-all',
                    status?.eligible
                      ? 'text-white hover:-translate-y-0.5 hover:shadow-[--shadow-glow] disabled:opacity-50'
                      : 'border border-[--color-border] text-[--color-text-muted] cursor-not-allowed',
                  ].join(' ')}
                  style={status?.eligible ? { background: 'linear-gradient(135deg, #7c6ffc, #9c4fff)' } : {}}
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Generate Code</>
                  )}
                </button>
              </div>

              {genResult && (
                <div className="mt-4 flex items-center gap-4 rounded-[--radius-md] border border-[--color-success]/20 bg-[--color-success-light] px-5 py-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[--color-success]" />
                  <div>
                    <p className="font-mono text-lg font-bold tracking-widest text-[--color-success]">
                      {genResult.code}
                    </p>
                    <p className="mt-0.5 text-xs text-[--color-success]/70">
                      {genResult.discountPercent}% off — share this with the customer placing the next order.
                    </p>
                  </div>
                </div>
              )}

              {genError && (
                <div className="mt-4 flex items-center gap-3 rounded-[--radius-md] border border-[--color-error]/20 bg-[--color-error-light] px-4 py-3 text-sm text-[--color-error]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {genError}
                </div>
              )}
            </div>

            {/* Discount codes table */}
            <div className="rounded-[--radius-lg] border border-[--color-border] bg-[--color-bg-elevated]">
              <div className="flex items-center justify-between border-b border-[--color-border] px-6 py-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-[--color-text-primary]">
                  <Tag className="h-4 w-4 text-[--color-text-muted]" />
                  Discount Codes
                  <span className="rounded-full bg-[--color-bg-hover] px-2 py-0.5 text-xs text-[--color-text-secondary]">
                    {stats?.totalDiscountCodes ?? 0}
                  </span>
                </h2>
              </div>

              {(stats?.discountCodes?.length ?? 0) === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Tag className="h-8 w-8 text-[--color-text-muted]" />
                  <p className="text-sm text-[--color-text-secondary]">No codes generated yet.</p>
                  <p className="text-xs text-[--color-text-muted]">
                    Place {status?.discountInterval ?? 5} orders to open the generation window.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[--color-border] text-left text-xs font-semibold uppercase tracking-wider text-[--color-text-muted]">
                        <th className="px-6 py-3">Code</th>
                        <th className="px-6 py-3">Discount</th>
                        <th className="px-6 py-3">Milestone</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Used By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[--color-border]">
                      {stats?.discountCodes.map((code) => (
                        <tr key={code.code} className="transition-colors hover:bg-[--color-bg-hover]">
                          <td className="px-6 py-4">
                            <code className="rounded bg-[--color-bg-base] px-2 py-0.5 font-mono text-xs tracking-wider text-[--color-accent]">
                              {code.code}
                            </code>
                          </td>
                          <td className="px-6 py-4 font-semibold text-[--color-text-primary]">
                            {code.discountPercent}%
                          </td>
                          <td className="px-6 py-4 text-[--color-text-secondary]">
                            #{code.generatedForMilestone}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                              style={
                                code.isUsed
                                  ? { background: 'rgba(248,113,113,0.12)', color: 'var(--color-error)' }
                                  : { background: 'rgba(34,211,160,0.12)', color: 'var(--color-success)' }
                              }
                            >
                              {code.isUsed ? 'Used' : 'Available'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-[--color-text-muted]">
                            {code.usedByOrderId ? `${code.usedByOrderId.slice(0, 8)}…` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
