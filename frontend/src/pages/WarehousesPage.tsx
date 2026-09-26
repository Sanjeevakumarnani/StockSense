import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  Edit2,
  Layers,
  MapPin,
  Plus,
  Boxes,
  Trash2,
  X,
  Search,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../services/api';

interface LocationItem {
  id: number;
  warehouse_id: number;
  name: string;
  type: string;
  product_count?: number;
  total_quantity?: number;
}

interface WarehouseItem {
  id: number;
  name: string;
  address: string | null;
  location_count?: number;
  product_count?: number;
  total_quantity?: number;
  locations: LocationItem[];
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedWhIds, setExpandedWhIds] = useState<number[]>([]);

  // Warehouse Modal State
  const [whModal, setWhModal] = useState<{ open: boolean; mode: 'create' | 'edit'; whId?: number; name: string; address: string }>({
    open: false,
    mode: 'create',
    name: '',
    address: ''
  });

  // Location Modal State
  const [locModal, setLocModal] = useState<{ open: boolean; mode: 'create' | 'edit'; whId?: number; locId?: number; name: string; type: string }>({
    open: false,
    mode: 'create',
    name: '',
    type: 'storage'
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<WarehouseItem[]>('/warehouses');
      setWarehouses(res);
      // Auto-expand first warehouse if available
      if (res.length > 0 && expandedWhIds.length === 0) {
        setExpandedWhIds([res[0].id]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedWhIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Submit Warehouse (Create / Edit)
  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      if (whModal.mode === 'create') {
        await apiFetch('/warehouses', {
          method: 'POST',
          body: JSON.stringify({ name: whModal.name, address: whModal.address })
        });
      } else if (whModal.whId) {
        await apiFetch(`/warehouses/${whModal.whId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: whModal.name, address: whModal.address })
        });
      }
      setWhModal({ open: false, mode: 'create', name: '', address: '' });
      fetchWarehouses();
    } catch (err: any) {
      setActionError(err?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Warehouse
  const handleDeleteWarehouse = async (wh: WarehouseItem) => {
    if (!confirm(`Are you sure you want to delete warehouse "${wh.name}"?`)) return;
    setActionError(null);
    try {
      await apiFetch(`/warehouses/${wh.id}`, { method: 'DELETE' });
      fetchWarehouses();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete warehouse');
    }
  };

  // Submit Location (Create / Edit)
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      if (locModal.mode === 'create' && locModal.whId) {
        await apiFetch(`/warehouses/${locModal.whId}/locations`, {
          method: 'POST',
          body: JSON.stringify({ name: locModal.name, type: locModal.type })
        });
      } else if (locModal.locId) {
        await apiFetch(`/locations/${locModal.locId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: locModal.name, type: locModal.type })
        });
      }
      setLocModal({ open: false, mode: 'create', name: '', type: 'storage' });
      fetchWarehouses();
    } catch (err: any) {
      setActionError(err?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Location
  const handleDeleteLocation = async (loc: LocationItem) => {
    if (!confirm(`Are you sure you want to delete location "${loc.name}"?`)) return;
    setActionError(null);
    try {
      await apiFetch(`/locations/${loc.id}`, { method: 'DELETE' });
      fetchWarehouses();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete location');
    }
  };

  const filteredWarehouses = warehouses.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.address && w.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="text-blue-600 w-7 h-7" /> Warehouse Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage physical facilities, racks, bays, and internal storage zones.
          </p>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setWhModal({ open: true, mode: 'create', name: '', address: '' });
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search warehouse by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
          <span>Total Warehouses: <strong className="text-slate-900">{warehouses.length}</strong></span>
          <span>Total Locations: <strong className="text-slate-900">{warehouses.reduce((acc, w) => acc + (w.locations?.length || 0), 0)}</strong></span>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-6 bg-slate-100 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchWarehouses} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <Building2 size={48} className="mx-auto text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">No Warehouses Found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {search ? 'No warehouse matches your search query.' : 'No warehouses configured yet. Add your first warehouse to start organizing inventory.'}
          </p>
          <button
            onClick={() => setWhModal({ open: true, mode: 'create', name: '', address: '' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={16} /> Add First Warehouse
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWarehouses.map((wh) => {
            const isExpanded = expandedWhIds.includes(wh.id);
            return (
              <div key={wh.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
                {/* Warehouse Row Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition cursor-pointer" onClick={() => toggleExpand(wh.id)}>
                  <div className="flex items-start gap-3.5">
                    <button className="mt-1 text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {wh.name}
                      </h3>
                      {wh.address ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={13} className="text-slate-400" /> {wh.address}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic mt-0.5">No address specified</p>
                      )}
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
                      {wh.locations?.length || 0} locations
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                      {wh.product_count || 0} products stored ({wh.total_quantity || 0} units)
                    </span>

                    <button
                      onClick={() => {
                        setActionError(null);
                        setLocModal({ open: true, mode: 'create', whId: wh.id, name: '', type: 'storage' });
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Plus size={14} /> Location
                    </button>

                    <button
                      onClick={() => {
                        setActionError(null);
                        setWhModal({ open: true, mode: 'edit', whId: wh.id, name: wh.name, address: wh.address || '' });
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Warehouse"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteWarehouse(wh)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Warehouse"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expandable Locations List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers size={14} className="text-blue-600" /> Internal Locations inside {wh.name}
                        </span>
                      </div>

                      {(!wh.locations || wh.locations.length === 0) ? (
                        <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                          No internal locations defined yet. Click <strong>"+ Location"</strong> above to add storage zones or racks.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {wh.locations.map((loc) => (
                            <div key={loc.id} className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{loc.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    {loc.type}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {loc.product_count || 0} items ({loc.total_quantity || 0} units)
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setActionError(null);
                                    setLocModal({ open: true, mode: 'edit', whId: wh.id, locId: loc.id, name: loc.name, type: loc.type });
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLocation(loc)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Warehouse Modal */}
      {whModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {whModal.mode === 'create' ? 'Add Warehouse' : 'Edit Warehouse'}
              </h3>
              <button onClick={() => setWhModal({ ...whModal, open: false })} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWarehouseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Main Hub, West Annex"
                  value={whModal.name}
                  onChange={(e) => setWhModal({ ...whModal, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address / Location Info</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 123 Industrial Parkway, Zone B"
                  value={whModal.address}
                  onChange={(e) => setWhModal({ ...whModal, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWhModal({ ...whModal, open: false })}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  {submitting ? 'Saving...' : whModal.mode === 'create' ? 'Create Warehouse' : 'Update Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {locModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {locModal.mode === 'create' ? 'Add Internal Location' : 'Edit Location'}
              </h3>
              <button onClick={() => setLocModal({ ...locModal, open: false })} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Name / Code</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. A1-Racks, Receiving Dock 2"
                  value={locModal.name}
                  onChange={(e) => setLocModal({ ...locModal, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Type</label>
                <select
                  value={locModal.type}
                  onChange={(e) => setLocModal({ ...locModal, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="storage">Storage Zone / Racks</option>
                  <option value="receiving">Receiving Dock</option>
                  <option value="shipping">Shipping Bay</option>
                  <option value="production">Production Area</option>
                  <option value="scrap">Scrap / Quarantine</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLocModal({ ...locModal, open: false })}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  {submitting ? 'Saving...' : locModal.mode === 'create' ? 'Add Location' : 'Update Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
