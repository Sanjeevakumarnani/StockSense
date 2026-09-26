import { useState, useEffect } from 'react';
import { Database, Filter, ArrowRightLeft, ArrowDownRight, ArrowUpRight, Search } from 'lucide-react';
import { apiFetch } from '../services/api';
import type { LedgerEntry } from '../types';

export default function LedgerPage() {
  const [data, setData] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<LedgerEntry[]>('/ledger');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const getOperationIcon = (type: string) => {
    if (type === 'receipt') return <ArrowDownRight size={16} className="text-emerald-600" />;
    if (type === 'delivery') return <ArrowUpRight size={16} className="text-rose-600" />;
    if (type === 'transfer') return <ArrowRightLeft size={16} className="text-blue-600" />;
    return <ArrowRightLeft size={16} className="text-amber-600" />;
  };

  const getOperationColor = (type: string) => {
    if (type === 'receipt') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (type === 'delivery') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (type === 'transfer') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Stock Ledger</h2>
          <p className="text-sm text-slate-500 mt-1">Immutable audit trail of all inventory movements</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by product..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Filter size={18} className="text-slate-500" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Operation</th>
                <th className="px-6 py-4 font-semibold">Location (Src → Dest)</th>
                <th className="px-6 py-4 font-semibold text-right">Delta</th>
                <th className="px-6 py-4 font-semibold text-right">Updated Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center animate-pulse">
                      <Database size={32} className="mb-2 opacity-50" />
                      Loading ledger...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <Database size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-900">No entries found</p>
                  </td>
                </tr>
              ) : (
                data.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {entry.product_name || `Product #${entry.product_id}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold uppercase tracking-wider ${getOperationColor(entry.operation_type)}`}>
                        {getOperationIcon(entry.operation_type)}
                        {entry.operation_type}
                        <span className="opacity-50 text-[10px]">#{entry.reference_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        {entry.source_location_name ? <span>{entry.source_location_name}</span> : <span className="text-slate-400">—</span>}
                        <ArrowRightLeft size={14} className="text-slate-300" />
                        {entry.destination_location_name ? <span>{entry.destination_location_name}</span> : <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${entry.quantity > 0 ? 'text-emerald-600' : entry.quantity < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-900 font-medium">
                      {entry.updated_stock}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
