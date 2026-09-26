import { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Package, ChevronLeft, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { apiFetch } from '../services/api';

type Product = {
  id: number;
  name: string;
  sku: string;
  category_id: number | null;
  unit_of_measure: string;
  reorder_threshold: number;
};

type PaginatedResponse = {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
};

export default function ProductsPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        ...(search ? { search } : {})
      });
      const res = await apiFetch<PaginatedResponse>(`/products?${query.toString()}`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // reset to first page on search
  };

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Catalog</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your inventory items and SKUs</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md transition-all active:scale-95">
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={handleSearch}
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
                <th className="px-6 py-4 font-semibold w-12"></th>
                <th className="px-6 py-4 font-semibold">Product Info</th>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold">Unit</th>
                <th className="px-6 py-4 font-semibold">Reorder Threshold</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center animate-pulse">
                      <Package size={32} className="mb-2 opacity-50" />
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <Package size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-900">No products found</p>
                    <p className="text-sm mt-1">Try adjusting your search terms.</p>
                  </td>
                </tr>
              ) : (
                data?.items.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <Package size={20} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Category ID: {product.category_id || 'Uncategorized'}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{product.sku}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {product.unit_of_measure.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${product.reorder_threshold > 0 ? 'bg-amber-400' : 'bg-slate-300'}`} />
                        <span>{product.reorder_threshold}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit3 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.pages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-sm">
            <div className="text-slate-500">
              Showing <span className="font-medium text-slate-900">{((data.page - 1) * data.per_page) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(data.page * data.per_page, data.total)}</span> of <span className="font-medium text-slate-900">{data.total}</span> results
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={data.page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="px-4 font-medium text-slate-700">
                Page {data.page} of {data.pages}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={data.page === data.pages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
