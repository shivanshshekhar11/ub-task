import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard — Uniblox Store',
  description: 'View store analytics and manage discount codes',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
