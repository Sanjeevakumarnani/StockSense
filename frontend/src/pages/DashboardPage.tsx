import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  Clock,
  Filter,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Truck,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { DashboardData, Movement } from '../types';
import { dashboardApi, apiFetch } from '../services/api';

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const itemVariants: any = {
  hidden: { y: 15, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 25 } }
};

interface FilterState {
  documentType: string;
  status: string;
  locationId: string;
  categoryId: string;
}

interface OptionItem {
  id: number;
  name: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    documentType: 'all',
    status: 'all',
    locationId: 'all',
    categoryId: 'all'
  });

  // Dropdown options loaded from API
  const [locations, setLocations] = useState<OptionItem[]>([]);
  const [categories, setCategories] = useState<OptionItem[]>([]);

  // Chart mode toggle
  const [chartView, setChartView] = useState<'daily' | 'top_products'>('daily');

  // Quick Action Modal states
  const [modalType, setModalType] = useState<'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product' | null>(null);
  const [modalForm, setModalForm] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [productsList, setProductsList] = useState<OptionItem[]>([]);
  const [suppliersList, setSuppliersList] = useState<OptionItem[]>([]);

  // Fetch dropdown options once
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [locsRes, catsRes, prodsRes, supsRes] = await Promise.allSettled([
          apiFetch<OptionItem[]>('/locations'),
          apiFetch<OptionItem[]>('/categories'),
          apiFetch<OptionItem[]>('/products'),
          apiFetch<OptionItem[]>('/suppliers')
        ]);
        if (locsRes.status === 'fulfilled') setLocations(locsRes.value);
        if (catsRes.status === 'fulfilled') setCategories(catsRes.value);
        if (prodsRes.status === 'fulfilled') setProductsList(prodsRes.value);
        if (supsRes.status === 'fulfilled') setSuppliersList(supsRes.value);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch Dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getOverview({
        document_type: filters.documentType,
        status: filters.status,
        location_id: filters.locationId,
        category_id: filters.categoryId
      });
      setData(res);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err?.message || 'Failed to load dashboard data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const resetFilters = () => {
    setFilters({
      documentType: 'all',
      status: 'all',
      locationId: 'all',
      categoryId: 'all'
    });
  };

  const isFiltered = filters.documentType !== 'all' || filters.status !== 'all' || filters.locationId !== 'all' || filters.categoryId !== 'all';

  // Modal Handlers
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalType === 'product') {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify({
            name: modalForm.name,
            sku: modalForm.sku,
            category_id: modalForm.category_id ? Number(modalForm.category_id) : null,
            unit_of_measure: modalForm.unit_of_measure || 'pcs',
            reorder_threshold: Number(modalForm.reorder_threshold || 0)
          })
        });
      } else if (modalType === 'receipt') {
        await apiFetch('/receipts', {
          method: 'POST',
          body: JSON.stringify({
            supplier_id: modalForm.supplier_id ? Number(modalForm.supplier_id) : null,
            destination_location_id: Number(modalForm.destination_location_id || locations[0]?.id || 1),
            items: [{ product_id: Number(modalForm.product_id), expected_quantity: Number(modalForm.quantity) }]
          })
        });
      } else if (modalType === 'delivery') {
        await apiFetch('/deliveries', {
          method: 'POST',
          body: JSON.stringify({
            source_location_id: Number(modalForm.source_location_id || locations[0]?.id || 1),
            items: [{ product_id: Number(modalForm.product_id), quantity: Number(modalForm.quantity) }]
          })
        });
      } else if (modalType === 'transfer') {
        await apiFetch('/transfers', {
          method: 'POST',
          body: JSON.stringify({
            source_location_id: Number(modalForm.source_location_id || locations[0]?.id || 1),
            destination_location_id: Number(modalForm.destination_location_id || locations[1]?.id || locations[0]?.id || 1),
            items: [{ product_id: Number(modalForm.product_id), quantity: Number(modalForm.quantity) }]
          })
        });
      } else if (modalType === 'adjustment') {
        await apiFetch('/adjustments', {
          method: 'POST',
          body: JSON.stringify({
            product_id: Number(modalForm.product_id),
            location_id: Number(modalForm.location_id || locations[0]?.id || 1),
            physical_quantity: Number(modalForm.physical_quantity),
            reason: modalForm.reason || 'Manual Adjustment'
          })
        });
      }
      setModalType(null);
      setModalForm({});
      loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Status helper color generator
  const getOpBadge = (op: string) => {
    switch (op.toLowerCase()) {
      case 'receipt':
      case 'receipts':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'delivery':
      case 'deliveries':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'transfer':
      case 'internal':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'adjustment':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Header & Quick Actions */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="text-blue-600 w-7 h-7" /> Inventory Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time stock operations, ledger analytics, and pending inventory transfers.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setModalType('receipt'); setModalForm({}); }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={15} /> New Receipt
          </button>

          <button
            onClick={() => { setModalType('delivery'); setModalForm({}); }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={15} /> New Delivery
          </button>

          <button
            onClick={() => { setModalType('transfer'); setModalForm({}); }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={15} /> New Transfer
          </button>

          <button
            onClick={() => { setModalType('adjustment'); setModalForm({}); }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={15} /> New Adjustment
          </button>

          <button
            onClick={() => { setModalType('product'); setModalForm({}); }}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus size={15} /> Add Product
          </button>
        </div>
      </motion.div>

      {/* Interactive Filters Bar */}
      <motion.div variants={itemVariants} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
          <Filter size={18} className="text-blue-600" />
          <span>Filters:</span>
          {isFiltered && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Active</span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-4xl">
          {/* Document Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Doc Type</label>
            <select
              value={filters.documentType}
              onChange={(e) => handleFilterChange('documentType', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="receipt">Receipts</option>
              <option value="delivery">Deliveries</option>
              <option value="transfer">Internal Transfers</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {/* Location / Warehouse Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Location / Warehouse</label>
            <select
              value={filters.locationId}
              onChange={(e) => handleFilterChange('locationId', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Product Category</label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium underline self-end md:self-center"
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div variants={itemVariants} className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboard}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* 5 KPI Cards Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-8 bg-slate-200 rounded w-1/2" />
            </div>
          ))
        ) : (
          <>
            {/* 1. Total Products in Stock */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products in Stock</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Package size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {data?.kpis.total_products_in_stock ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Distinct items with stock &gt; 0</p>
              </div>
            </div>

            {/* 2. Low Stock / Out of Stock Items */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock / Out of Stock</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${(data?.kpis.low_stock_items ?? 0) > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-3xl font-extrabold tracking-tight ${(data?.kpis.low_stock_items ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {data?.kpis.low_stock_items ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">At or below reorder threshold</p>
              </div>
            </div>

            {/* 3. Pending Receipts */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Receipts</span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <PackageCheck size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {data?.kpis.pending_receipts ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Inbound shipments pending</p>
              </div>
            </div>

            {/* 4. Pending Deliveries */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Deliveries</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Truck size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {data?.kpis.pending_deliveries ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Outbound deliveries pending</p>
              </div>
            </div>

            {/* 5. Scheduled Internal Transfers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Transfers</span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <ArrowRightLeft size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {data?.kpis.scheduled_transfers ?? 0}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">Inter-location transfers</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Main Grid: Stock Movement Overview (Recharts) + Live Ledger Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area: Recharts Stock Movement Overview */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Stock Movement Overview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantities moved into and out of inventory based on validated ledger transactions.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start">
              <button
                onClick={() => setChartView('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all ${chartView === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Stock In vs Out
              </button>
              <button
                onClick={() => setChartView('top_products')}
                className={`px-3 py-1.5 rounded-lg transition-all ${chartView === 'top_products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Top Products
              </button>
            </div>
          </div>

          {/* Summary Line */}
          {data?.summary && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {data.summary.net_units_this_period >= 0 ? (
                <TrendingUp size={16} className="text-emerald-600" />
              ) : (
                <TrendingDown size={16} className="text-red-600" />
              )}
              <span>
                Net volume change: <strong className={data.summary.net_units_this_period >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                  {data.summary.net_units_this_period >= 0 ? `+${data.summary.net_units_this_period}` : data.summary.net_units_this_period} units
                </strong> across current filter scope.
              </span>
            </div>
          )}

          {/* Recharts Container */}
          <div className="h-[320px] w-full pt-2">
            {loading ? (
              <div className="w-full h-full bg-slate-50 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
                Loading movement data...
              </div>
            ) : chartView === 'daily' ? (
              (!data?.chart_data || data.chart_data.length === 0) ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <Boxes size={32} className="text-slate-300" />
                  <p>No stock movement data recorded for selected filters.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#F1F5F9', opacity: 0.6 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs space-y-1.5 min-w-[150px]">
                              <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">{label}</p>
                              {payload.map((entry, i) => (
                                <div key={i} className="flex items-center justify-between gap-3">
                                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                                    {entry.name}:
                                  </span>
                                  <span className="font-bold text-slate-900">{entry.value} units</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                    <Bar dataKey="stock_in" name="Stock In (+)" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="stock_out" name="Stock Out (-)" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              (!data?.top_products || data.top_products.length === 0) ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                  <Boxes size={32} className="text-slate-300" />
                  <p>No product volume data recorded for selected filters.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={data.top_products} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#0F172A', fontSize: 11, fontWeight: 500 }} width={120} />
                    <Tooltip
                      cursor={{ fill: '#F1F5F9', opacity: 0.6 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0];
                          return (
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xl text-xs space-y-1">
                              <p className="font-bold text-slate-900">{item.payload.name}</p>
                              <p className="text-blue-600 font-bold flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                                Movement Volume: {item.value} units
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="volume" name="Movement Volume (Units)" radius={[0, 8, 8, 0]} barSize={26}>
                      {data.top_products.map((_, index) => {
                        const colors = ['#2563EB', '#4F46E5', '#0EA5E9', '#0D9488', '#7C3AED'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </motion.div>

        {/* Right Panel: Recent Stock Movements */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" /> Recent Stock Movements
              </h2>
              <p className="text-xs text-slate-500">Live ledger transaction log</p>
            </div>
            <Link
              to="/ledger"
              className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 group"
            >
              View All <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Feed Content */}
          <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl animate-pulse h-14" />
              ))
            ) : (!data?.recent_movements || data.recent_movements.length === 0) ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
                <Boxes size={28} className="text-slate-300" />
                <p>No recent stock movements match the selected filters.</p>
              </div>
            ) : (
              data.recent_movements.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-100 transition flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{m.product_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getOpBadge(m.operation_type)}`}>
                        {m.operation_type}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(m.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${m.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Ref #{m.reference_id || m.id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Action Modal Dialogs */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 capitalize">
                Create {modalType}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickSubmit} className="space-y-4">
              {modalType === 'product' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ergonomic Office Mouse"
                      value={modalForm.name || ''}
                      onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">SKU</label>
                      <input
                        required
                        type="text"
                        placeholder="OFF-101"
                        value={modalForm.sku || ''}
                        onChange={(e) => setModalForm({ ...modalForm, sku: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Reorder Threshold</label>
                      <input
                        type="number"
                        placeholder="10"
                        value={modalForm.reorder_threshold || ''}
                        onChange={(e) => setModalForm({ ...modalForm, reorder_threshold: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={modalForm.category_id || ''}
                      onChange={(e) => setModalForm({ ...modalForm, category_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {modalType === 'receipt' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
                    <select
                      value={modalForm.supplier_id || ''}
                      onChange={(e) => setModalForm({ ...modalForm, supplier_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliersList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Destination Location</label>
                    <select
                      required
                      value={modalForm.destination_location_id || ''}
                      onChange={(e) => setModalForm({ ...modalForm, destination_location_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Location</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Product</label>
                      <select
                        required
                        value={modalForm.product_id || ''}
                        onChange={(e) => setModalForm({ ...modalForm, product_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Product</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={modalForm.quantity || ''}
                        onChange={(e) => setModalForm({ ...modalForm, quantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Source Location</label>
                    <select
                      required
                      value={modalForm.source_location_id || ''}
                      onChange={(e) => setModalForm({ ...modalForm, source_location_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Location</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Product</label>
                      <select
                        required
                        value={modalForm.product_id || ''}
                        onChange={(e) => setModalForm({ ...modalForm, product_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Product</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={modalForm.quantity || ''}
                        onChange={(e) => setModalForm({ ...modalForm, quantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'transfer' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Source Loc</label>
                      <select
                        required
                        value={modalForm.source_location_id || ''}
                        onChange={(e) => setModalForm({ ...modalForm, source_location_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Source</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Dest Loc</label>
                      <select
                        required
                        value={modalForm.destination_location_id || ''}
                        onChange={(e) => setModalForm({ ...modalForm, destination_location_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Dest</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Product</label>
                      <select
                        required
                        value={modalForm.product_id || ''}
                        onChange={(e) => setModalForm({ ...modalForm, product_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Product</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={modalForm.quantity || ''}
                        onChange={(e) => setModalForm({ ...modalForm, quantity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {modalType === 'adjustment' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Product</label>
                      <select
                        required
                        value={modalForm.product_id || ''}
                        onChange={(e) => setModalForm({ ...modalForm, product_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Product</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                      <select
                        required
                        value={modalForm.location_id || ''}
                        onChange={(e) => setModalForm({ ...modalForm, location_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Location</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Physical Quantity</label>
                    <input
                      required
                      type="number"
                      placeholder="Actual counted stock quantity"
                      value={modalForm.physical_quantity || ''}
                      onChange={(e) => setModalForm({ ...modalForm, physical_quantity: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Annual Count Audit"
                      value={modalForm.reason || ''}
                      onChange={(e) => setModalForm({ ...modalForm, reason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Submit Operation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
