/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, AlertCircle, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import { EventSetting, UserProfile } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface AdminLoginPageProps {
  eventSetting: EventSetting | null;
  onLoginSuccess: (token: string, user?: UserProfile) => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  eventSetting,
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Detect Caps Lock on keydown / keyup
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('pos_admin_token', data.token);
        onLoginSuccess(data.token, data.user);
      } else {
        setLoginError(data.message || 'Username atau password salah');
      }
    } catch (err) {
      setLoginError('Koneksi ke server gagal. Pastikan server lokal berjalan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/25 to-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900 relative overflow-hidden select-none">
      {/* Subtle Ambient Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-2xl rounded-3xl p-8 max-w-md w-full relative z-10 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon & Brand */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mb-3 text-white shadow-lg shadow-orange-500/20 mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Admin Executive Panel</h2>
          <p className="text-xs text-slate-500 mt-1">{eventSetting?.nama_event || 'POS Management System'}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {loginError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="font-semibold">{loginError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 font-mono text-sm h-11"
              required
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Password
              </label>
              {isCapsLockOn && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Caps Lock Aktif
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={handleKeyUp}
                placeholder="••••••••"
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 pr-10 h-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-500/25 h-11 text-sm mt-3 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memverifikasi...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <KeyRound className="h-4 w-4" />
                Masuk ke Admin Dashboard
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onNavigateHome}
            className="w-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs mt-1 rounded-xl h-10 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Kembali ke Landing Hub
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
