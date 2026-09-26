import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Edit2,
  FolderTree,
  Plus,
  Search,
  Trash2,
  X,
  Boxes,
  RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../services/api';

interface CategoryItem {
  id: number;
  name: string;
  description: string | null;
  product_count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; catId?: number; name: string; description: string }>({
    open: false,
    mode: 'create',
    name: '',
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<CategoryItem[]>('/categories');
      setCategories(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      if (modal.mode === 'create') {
        await apiFetch('/categories', {
          method: 'POST',
          body: JSON.stringify({ name: modal.name, description: modal.description })
        });
      } else if (modal.catId) {
        await apiFetch(`/categories/${modal.catId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: modal.name, description: modal.description })
        });
      }
      setModal({ open: false, mode: 'create', name: '', description: '' });
      fetchCategories();
    } catch (err: any) {
      setActionError(err?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    setActionError(null);
    try {
      await apiFetch(`/categories/${cat.id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderTree className="text-blue-600 w-7 h-7" /> Category Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Organize products into distinct operational classifications for search and dashboard analytics.
          </p>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setModal({ open: true, mode: 'create', name: '', description: '' });
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus size={16} /> Add Category
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

      {/* Search & Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search category by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total Categories: <strong className="text-slate-900">{categories.length}</strong>
        </div>
      </div>

      {/* Table / Cards Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-700 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchCategories} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <FolderTree size={48} className="mx-auto text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">No Categories Found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {search ? 'No category matches your search query.' : 'No categories created yet. Create your first category to start organizing products.'}
          </p>
          <button
            onClick={() => setModal({ open: true, mode: 'create', name: '', description: '' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={16} /> Add First Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Category Name</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6 text-center">Assigned Products</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCategories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <FolderTree size={16} />
                    </div>
                    <span>{c.name}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {c.description || <span className="text-slate-400 italic">No description</span>}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
                      <Boxes size={13} className="text-slate-500" /> {c.product_count || 0} products
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => {
                        setActionError(null);
                        setModal({ open: true, mode: 'edit', catId: c.id, name: c.name, description: c.description || '' });
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Category"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {modal.mode === 'create' ? 'Add Category' : 'Edit Category'}
              </h3>
              <button onClick={() => setModal({ ...modal, open: false })} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Electronics, Raw Materials"
                  value={modal.name}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. All electronic hardware and computer components"
                  value={modal.description}
                  onChange={(e) => setModal({ ...modal, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModal({ ...modal, open: false })}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  {submitting ? 'Saving...' : modal.mode === 'create' ? 'Create Category' : 'Update Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
