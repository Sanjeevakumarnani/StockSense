import { useState } from 'react';
import { Settings, Save, Shield, Bell, Database, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    autoAlerts: true,
    reorderEmailNotify: true,
    ledgerPageSize: '25',
    defaultWarehouse: 'Main Hub',
    systemTheme: 'light'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="text-blue-600 w-7 h-7" /> System Settings & Preferences
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure StockSense global inventory parameters, notification preferences, and system defaults.
          </p>
        </div>

        {saved && (
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
            <Check size={14} /> Saved Successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Inventory Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Bell size={18} className="text-blue-600" /> Notifications & Low Stock Alerts
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Automatic Low-Stock Warnings</span>
                <span className="text-slate-500">Flag products automatically when quantity falls below reorder thresholds.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAlerts}
                onChange={(e) => setSettings({ ...settings, autoAlerts: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Manager Reorder Email Digest</span>
                <span className="text-slate-500">Receive daily summary of pending receipts and out-of-stock items.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.reorderEmailNotify}
                onChange={(e) => setSettings({ ...settings, reorderEmailNotify: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Card 2: Operational Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Database size={18} className="text-blue-600" /> Operational Defaults
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ledger Table Page Size</label>
              <select
                value={settings.ledgerPageSize}
                onChange={(e) => setSettings({ ...settings, ledgerPageSize: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="15">15 rows</option>
                <option value="25">25 rows</option>
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Warehouse Scope</label>
              <select
                value={settings.defaultWarehouse}
                onChange={(e) => setSettings({ ...settings, defaultWarehouse: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Main Hub">Main Hub (Primary Storage)</option>
                <option value="All Warehouses">All Warehouses (Global)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 3: Security Policy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <Shield size={18} className="text-blue-600" /> Access & Security Policy
          </div>

          <div className="p-4 bg-slate-50 rounded-xl text-xs space-y-2 text-slate-600">
            <p>
              Current User Session: <strong className="text-slate-900">{user?.name} ({user?.email})</strong>
            </p>
            <p>
              Role Policy: <span className="uppercase font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{user?.role}</span> — {user?.role === 'manager' ? 'Full administrative access to products, warehouses, categories, and inventory transactions.' : 'Standard staff access to log receipts, deliveries, and transfers.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Save size={16} /> Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
