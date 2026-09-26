import { useState } from 'react';
import { PackageCheck, Loader2, KeyRound, UserPlus, LogIn, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/api';
import type { User } from '../types';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Login Form
  const [email, setEmail] = useState('manager@example.com');
  const [password, setPassword] = useState('password123');

  // Signup Form
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'manager'>('staff');

  // OTP Reset Form
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await apiFetch<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      login(res.token, res.user);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await apiFetch<{ user: User; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email: signupEmail, password: signupPassword, role }),
      });
      login(res.token, res.user);
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await apiFetch<{ message: string; otp: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email: otpEmail }),
      });
      setOtpSent(true);
      setDemoOtpCode(res.otp);
      setSuccess(`OTP Code generated: ${res.otp}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await apiFetch<{ message: string }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email: otpEmail, otp: otpCode, new_password: newPassword }),
      });
      setSuccess('Password updated successfully! Please sign in with your new password.');
      setMode('login');
      setEmail(otpEmail);
      setPassword(newPassword);
    } catch (err: any) {
      setError(err?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Inter']">

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-xl bg-blue-600 p-3 text-white">
            <PackageCheck size={32} strokeWidth={2} />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
          StockSense
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Inventory Management System
        </p>

        {/* Tab switcher */}
        <div className="mt-6 flex bg-gray-100 p-1 rounded-lg text-sm font-medium text-gray-500">
          <button
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-700'}`}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-700'}`}
          >
            <UserPlus size={14} /> Sign Up
          </button>
          <button
            onClick={() => { setMode('forgot'); setError(''); setSuccess(''); setOtpSent(false); }}
            className={`flex-1 py-2 rounded-md transition-all flex items-center justify-center gap-1.5 ${mode === 'forgot' ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-700'}`}
          >
            <KeyRound size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-8 shadow-sm sm:rounded-xl border border-gray-200">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Mode 1: LOGIN */}
          {mode === 'login' && (
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
              </button>

              <div className="pt-4 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Demo: <code className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-xs">manager@example.com</code> / <code className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-xs">password123</code>
                </p>
              </div>
            </form>
          )}

          {/* Mode 2: SIGNUP */}
          {mode === 'signup' && (
            <form className="space-y-4" onSubmit={handleSignupSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
                <input
                  required
                  type="email"
                  placeholder="john@company.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  placeholder="Create a strong password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'staff' | 'manager')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="staff">Inventory Staff</option>
                  <option value="manager">Warehouse Manager</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Account'}
              </button>
            </form>
          )}

          {/* Mode 3: FORGOT PASSWORD / OTP RESET */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form className="space-y-4" onSubmit={handleRequestOtp}>
                  <p className="text-sm text-gray-500">
                    Enter your email to generate a 6-digit OTP verification code.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <input
                      required
                      type="email"
                      placeholder="manager@example.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Generate OTP Code'}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleVerifyOtp}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification OTP Code</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-center tracking-widest text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      required
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Reset & Update Password'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
