import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ReceiptsPage from './pages/ReceiptsPage';
import DeliveriesPage from './pages/DeliveriesPage';
import TransfersPage from './pages/TransfersPage';
import AdjustmentsPage from './pages/AdjustmentsPage';
import LedgerPage from './pages/LedgerPage';

import CategoriesPage from './pages/CategoriesPage';
import WarehousesPage from './pages/WarehousesPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

// Simple wrapper to protect routes
function ProtectedRoute({ children, requireManager }: { children: React.ReactNode, requireManager?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Loading StockSense...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireManager && user.role !== 'manager') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

// Redirect logged in users away from auth pages
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <AuthRoute>
          <LoginPage />
        </AuthRoute>
      } />
      
      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<DashboardPage />} />
        
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/adjustments" element={<AdjustmentsPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        
        <Route path="/categories" element={
          <ProtectedRoute requireManager>
            <CategoriesPage />
          </ProtectedRoute>
        } />
        <Route path="/warehouses" element={
          <ProtectedRoute requireManager>
            <WarehousesPage />
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
