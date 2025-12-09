'use client';

import GodownStockReport from '@/components/GodownStockReport';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-indigo-700">Dashboard</h1>
      <GodownStockReport />
    </div>
  );
}
