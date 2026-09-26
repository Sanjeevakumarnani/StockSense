import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, Boxes, MapPin, RefreshCw, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api';

interface AlertItem {
  product_id: number;
  product_name: string;
  product_sku: string;
  location_id: number;
  location_name: string;
  quantity: number;
  reorder_threshold: number;
  alert_type: 'low_stock' | 'out_of_stock';
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<AlertItem[]>('/alerts');
      setAlerts(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const outOfStockCount = alerts.filter((a) => a.alert_type === 'out_of_stock').length;
  const lowStockCount = alerts.filter((a) => a.alert_type === 'low_stock').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="text-amber-500 w-7 h-7" /> Inventory Low Stock Alerts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Automated reorder notifications for items at or below safety stock thresholds.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh Alerts
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock Items</span>
            <div className="text-3xl font-extrabold text-red-600 mt-1">{outOfStockCount}</div>
            <p className="text-xs text-slate-400 mt-0.5">Quantity is 0 or negative</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warnings</span>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">{lowStockCount}</div>
            <p className="text-xs text-slate-400 mt-0.5">Quantity &lt;= reorder threshold</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Bell size={22} />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchAlerts} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <Boxes size={48} className="mx-auto text-emerald-400" />
          <h3 className="text-lg font-bold text-slate-800">All Stock Levels Healthy!</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            No items are currently below their reorder thresholds across any warehouse location.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Stock Alerts ({alerts.length})
          </div>
          <div className="divide-y divide-slate-100">
            {alerts.map((a, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${a.alert_type === 'out_of_stock' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{a.product_name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{a.product_sku}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={13} className="text-slate-400" /> Location: <span className="font-semibold text-slate-700">{a.location_name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <div className={`text-sm font-extrabold ${a.alert_type === 'out_of_stock' ? 'text-red-600' : 'text-amber-600'}`}>
                      {a.quantity} pcs
                    </div>
                    <p className="text-[10px] text-slate-400">Reorder Threshold: {a.reorder_threshold} pcs</p>
                  </div>

                  <Link
                    to="/receipts"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                  >
                    <ShoppingCart size={13} /> Reorder
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
