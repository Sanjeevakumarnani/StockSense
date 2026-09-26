import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { PackageCheck, LogOut, LayoutDashboard, Boxes, FileText, ArrowRightLeft, PenTool, Database, Bell, FolderTree, Building2, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Boxes },
    { name: 'Categories', path: '/categories', icon: FolderTree, role: 'manager' },
    { name: 'Warehouses', path: '/warehouses', icon: Building2, role: 'manager' },
    { name: 'Receipts', path: '/receipts', icon: FileText },
    { name: 'Deliveries', path: '/deliveries', icon: FileText },
    { name: 'Transfers', path: '/transfers', icon: ArrowRightLeft },
    { name: 'Adjustments', path: '/adjustments', icon: PenTool },
    { name: 'Ledger', path: '/ledger', icon: Database },
    { name: 'Alerts', path: '/alerts', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Inter'] flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-6 md:flex flex-col z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-200">
            <PackageCheck size={24} />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-900">StockSense</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inventory System</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.filter(item => !item.role || item.role === user?.role).map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={18} className="opacity-70" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-100 mt-auto">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 px-3 py-2 mb-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-semibold text-slate-900 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 truncate capitalize">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 min-h-screen flex flex-col relative">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">
                {location.pathname === '/' ? 'Overview' : location.pathname.split('/')[1]}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.split('/')[1].replace('-', ' ')}
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/alerts')}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="View Low Stock Alerts"
              >
                <Bell size={20} />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="View Settings"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
