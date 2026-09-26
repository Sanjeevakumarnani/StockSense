import { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Shield, Check, Key, Loader2, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/api';
import type { User } from '../types';

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();

  // Initial loading state
  const [initialLoading, setInitialLoading] = useState(false);

  // Profile Details Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Update Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user data on mount / sync with AuthContext
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Sync latest user profile from API on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setInitialLoading(true);
        const res = await apiFetch<{ user: User }>('/users/me');
        if (res.user) {
          updateUser(res.user);
          setName(res.user.name);
          setEmail(res.user.email);
        }
      } catch (err) {
        console.error('Failed to load profile from API:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Validation helpers
  const isValidEmail = (e: string) => /^[^@]+@[^@]+\.[^@]+$/.test(e.trim());
  const isProfileChanged = user ? (name.trim() !== user.name || email.trim().toLowerCase() !== user.email.toLowerCase()) : false;
  const isProfileValid = name.trim().length > 0 && isValidEmail(email);

  const isPasswordMinLength = newPassword.length >= 8;
  const isPasswordMatching = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordFormValid = currentPassword.length > 0 && isPasswordMinLength && isPasswordMatching;

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Full Name cannot be empty.' });
      return;
    }

    if (!isValidEmail(email)) {
      setProfileMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setProfileSubmitting(true);
    try {
      const res = await apiFetch<{ message: string; user: User }>('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() })
      });

      updateUser(res.user);
      setProfileMsg({ type: 'success', text: res.message || 'Profile updated successfully!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.message || 'Failed to update profile.' });
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Current password is required.' });
      return;
    }

    if (!isPasswordMinLength) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (!isPasswordMatching) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });

      setPasswordMsg({ type: 'success', text: res.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err?.message || 'Failed to update password.' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (initialLoading && !user) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 font-['Inter']">
      {/* 1. Header Card (Read-only Avatar & Summary Header - updates live) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-200 flex-shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user?.name}</h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
              <Mail size={13} className="text-slate-400" /> {user?.email}
            </p>
          </div>
        </div>

        <div>
          <span className="uppercase font-bold text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 inline-flex items-center gap-1.5">
            <Shield size={14} /> Role: {user?.role || 'Staff'}
          </span>
        </div>
      </div>

      {/* 2. Account Profile Details Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserIcon size={18} className="text-blue-600" /> Account Profile Details
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Editable personal info</span>
        </div>

        {profileMsg && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {profileMsg.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Sam Manager"
                value={name}
                disabled={profileSubmitting}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                required
                type="email"
                placeholder="user@example.com"
                value={email}
                disabled={profileSubmitting}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {!isValidEmail(email) && email.length > 0 && (
                <p className="text-[11px] text-red-500 mt-1">Please enter a valid email address.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              {isProfileChanged ? 'You have unsaved changes.' : 'No changes made.'}
            </p>

            <button
              type="submit"
              disabled={!isProfileChanged || !isProfileValid || profileSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              {profileSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Security & Password Update Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock size={18} className="text-blue-600" /> Security & Password Update
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">Verified password change</span>
        </div>

        {passwordMsg && (
          <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {passwordMsg.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Current Password</label>
            <input
              required
              type="password"
              placeholder="Enter your current password"
              value={currentPassword}
              disabled={passwordSubmitting}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password</label>
              <input
                required
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                disabled={passwordSubmitting}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {newPassword.length > 0 && !isPasswordMinLength && (
                <p className="text-[11px] text-red-500 mt-1">Password must be at least 8 characters.</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                required
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                disabled={passwordSubmitting}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              {confirmPassword.length > 0 && !isPasswordMatching && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={!isPasswordFormValid || passwordSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              {passwordSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
