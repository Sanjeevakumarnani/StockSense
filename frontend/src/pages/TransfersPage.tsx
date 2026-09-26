import { useState, useEffect } from 'react';
import { ArrowRightLeft, Plus, Search, Filter, CheckCircle2, Clock } from 'lucide-react';
import { apiFetch } from '../services/api';
import type { Transfer } from '../types';
import toast from 'react-hot-toast';

export default function TransfersPage() {
  const [data, setData] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Transfer[]>('/transfers');
      setData(res);
    } catch (err) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const validateTransfer = async (id: number) => {
    try {
      await apiFetch(`/transfers/${id}/validate`, { method: 'POST' });
      toast.success('Transfer validated successfully!');
      fetchTransfers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Validation failed');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Internal Transfers</h2>
          <p className="text-sm text-slate-500 mt-1">Move stock between locations</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md transition-all active:scale-95">
          <Plus size={18} />
          Create Transfer
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search transfers..."
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
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Destination</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center animate-pulse">
                      <ArrowRightLeft size={32} className="mb-2 opacity-50" />
                      Loading transfers...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <ArrowRightLeft size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-900">No transfers found</p>
                  </td>
                </tr>
              ) : (
                data.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                      TRN-{transfer.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(transfer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {transfer.source_location_name || `Loc #${transfer.source_location_id}`}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {transfer.destination_location_name || `Loc #${transfer.destination_location_id}`}
                    </td>
                    <td className="px-6 py-4">
                      {transfer.status === 'done' ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                          <CheckCircle2 size={14} />
                          Validated
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold uppercase tracking-wider">
                          <Clock size={14} />
                          Draft
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {transfer.status === 'draft' && (
                        <button 
                          onClick={() => validateTransfer(transfer.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          Validate
                        </button>
                      )}
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
