import { useState, useEffect } from 'react';
import { PenTool, Plus, Search, Filter } from 'lucide-react';
import { apiFetch } from '../services/api';
import type { StockAdjustment } from '../types';
import toast from 'react-hot-toast';

export default function AdjustmentsPage() {
  const [data, setData] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<StockAdjustment[]>('/adjustments');
      setData(res);
    } catch (err) {
      toast.error('Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Stock Adjustments</h2>
          <p className="text-sm text-slate-500 mt-1">Correct discrepancies between system and physical counts</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md transition-all active:scale-95">
          <Plus size={18} />
          Create Adjustment
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search adjustments..."
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
                <th className="px-6 py-4 font-semibold w-24">Reference</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold text-right">Sys Qty</th>
                <th className="px-6 py-4 font-semibold text-right">Phys Qty</th>
                <th className="px-6 py-4 font-semibold text-right">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center animate-pulse">
                      <PenTool size={32} className="mb-2 opacity-50" />
                      Loading adjustments...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <PenTool size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-900">No adjustments found</p>
                  </td>
                </tr>
              ) : (
                data.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      ADJ-{adj.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(adj.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {adj.product_name || `Product #${adj.product_id}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {adj.location_name || `Loc #${adj.location_id}`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                      {adj.recorded_quantity}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-900 font-bold">
                      {adj.physical_quantity}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${adj.difference > 0 ? 'text-emerald-600' : adj.difference < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {adj.difference > 0 ? '+' : ''}{adj.difference}
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
