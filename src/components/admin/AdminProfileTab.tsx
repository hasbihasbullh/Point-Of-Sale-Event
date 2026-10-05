/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Save,
  Clock,
  Calendar,
  Lock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserProfile } from './adminTypes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface AdminProfileTabProps {
  userProfile: UserProfile | null;
  onProfileUpdated: (updatedUser: UserProfile, newToken?: string) => void;
  handleUploadImage: (file: File, type?: 'menu' | 'qris') => Promise<string | null>;
}

export const AdminProfileTab: React.FC<AdminProfileTabProps> = ({
  userProfile,
  onProfileUpdated,
  handleUploadImage,
}) => {
  // Profile Edit State
  const [namaLengkap, setNamaLengkap] = useState(userProfile?.nama_lengkap || 'Administrator');
  const [username, setUsername] = useState(userProfile?.username || 'admin');
  const [fotoAvatar, setFotoAvatar] = useState<string | null>(userProfile?.foto_avatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password Edit State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Keep state in sync if userProfile changes
  React.useEffect(() => {
    if (userProfile) {
      setNamaLengkap(userProfile.nama_lengkap || 'Administrator');
      setUsername(userProfile.username || 'admin');
      setFotoAvatar(userProfile.foto_avatar || null);
    }
  }, [userProfile]);

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Ukuran foto maksimal 5 MB' });
      return;
    }

    setIsUploading(true);
    setProfileMsg(null);
    try {
      const url = await handleUploadImage(file, 'menu');
      if (url) {
        setFotoAvatar(url);
        setProfileMsg({ type: 'success', text: 'Foto profil berhasil diunggah. Klik Simpan Profil untuk menerapkan.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Gagal mengunggah foto profil' });
    } finally {
      setIsUploading(false);
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setProfileMsg({ type: 'error', text: 'Username wajib diisi' });
      return;
    }

    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      const token = sessionStorage.getItem('pos_admin_token');
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama_lengkap: namaLengkap.trim(),
          username: username.trim(),
          foto_avatar: fotoAvatar,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMsg({ type: 'success', text: data.message || 'Profil berhasil diperbarui!' });
        if (data.token) {
          sessionStorage.setItem('pos_admin_token', data.token);
        }
        onProfileUpdated(data.user, data.token);
      } else {
        setProfileMsg({ type: 'error', text: data.message || 'Gagal menyimpan profil' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: 'Terjadi kesalahan koneksi server' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!oldPassword) {
      setPassMsg({ type: 'error', text: 'Kata sandi saat ini wajib diisi' });
      return;
    }

    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok' });
      return;
    }

    setIsSavingPass(true);
    try {
      const token = sessionStorage.getItem('pos_admin_token');
      const res = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPassMsg({ type: 'success', text: data.message });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (data.user) {
          onProfileUpdated(data.user);
        }
      } else {
        setPassMsg({ type: 'error', text: data.message || 'Gagal mengganti kata sandi' });
      }
    } catch (err: any) {
      setPassMsg({ type: 'error', text: 'Terjadi kesalahan koneksi server' });
    } finally {
      setIsSavingPass(false);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200', textCol: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Lemah', color: 'bg-rose-500', textCol: 'text-rose-600' };
    if (score <= 3) return { score: 2, label: 'Sedang', color: 'bg-amber-500', textCol: 'text-amber-600' };
    return { score: 3, label: 'Sangat Kuat', color: 'bg-emerald-500', textCol: 'text-emerald-600' };
  };

  const passStrength = getPasswordStrength(newPassword);

  const initials = (namaLengkap || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 shadow-xs">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Profil & Keamanan Akun</h1>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-bold uppercase text-[10px]">
                {userProfile?.role || 'ADMIN'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Kelola identitas akun admin, foto profil WebP, dan perbarui kata sandi sistem
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {userProfile?.is_default_password ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 gap-1.5 py-1 px-2.5 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Kata Sandi Bawaan Aktif
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 gap-1.5 py-1 px-2.5 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Akun Terlindungi
            </Badge>
          )}
        </div>
      </div>

      {/* Two-Column Responsive Grid with shadcn/ui Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* CARD 1: PROFIL & IDENTITAS PENGGUNA                       */}
        {/* ========================================================= */}
        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col justify-between">
          <form onSubmit={handleSaveProfile} className="flex flex-col h-full justify-between">
            <div>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Identitas Pengguna</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Informasi publik dan username yang digunakan saat login
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-5">
                {profileMsg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
                      profileMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {profileMsg.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white">
                      {fotoAvatar ? (
                        <img
                          src={fotoAvatar}
                          alt="Avatar Admin"
                          className="w-full h-full object-cover"
                          onError={() => setFotoAvatar(null)}
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute inset-0 bg-black/40 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                      title="Ganti Foto Profil"
                    >
                      <Camera className="h-5 w-5 mb-0.5" />
                      <span>Ubah</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </div>

                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-sm font-bold text-slate-800">Foto Profil Admin</span>
                      {fotoAvatar && (
                        <button
                          type="button"
                          onClick={() => setFotoAvatar(null)}
                          className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer underline"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Format JPG, PNG, atau WebP. Foto otomatis dikonversi dan disimpan ke server lokal.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-xs font-bold rounded-xl h-8 text-slate-700 cursor-pointer mt-1"
                    >
                      <Camera className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
                      {isUploading ? 'Mengunggah...' : 'Pilih Foto Baru'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Nama Lengkap / Tampilan
                    </label>
                    <Input
                      type="text"
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      placeholder="Administrator Utama"
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white h-10"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Username Login
                    </label>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white font-mono text-sm h-10"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Username digunakan saat autentikasi di halaman login.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Metadata Akun */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Login Terakhir:</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {userProfile?.last_login ? new Date(userProfile.last_login).toLocaleString('id-ID') : 'Sesi Ini'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Terdaftar Sejak:</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString('id-ID') : 'Sistem Aktif'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </div>

            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingProfile || isUploading}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold px-5 h-10 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* ========================================================= */}
        {/* CARD 2: KEAMANAN & GANTI KATA SANDI                      */}
        {/* ========================================================= */}
        <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden flex flex-col justify-between">
          <form onSubmit={handleChangePassword} className="flex flex-col h-full justify-between">
            <div>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">Keamanan & Kata Sandi</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Perbarui kata sandi akun untuk menjaga keamanan akses dashboard
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-5">
                {passMsg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
                      passMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {passMsg.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    <span>{passMsg.text}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Kata Sandi Lama */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Kata Sandi Saat Ini
                    </label>
                    <div className="relative">
                      <Input
                        type={showOldPass ? 'text' : 'password'}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Masukkan kata sandi saat ini"
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl pr-10 focus:bg-white h-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass(!showOldPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showOldPass ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Kata Sandi Baru */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl pr-10 focus:bg-white h-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showNewPass ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password Strength Gauge */}
                    {newPassword && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Kekuatan Kata Sandi:</span>
                          <span className={`font-bold ${passStrength.textCol}`}>{passStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              passStrength.score >= 1 ? passStrength.color : 'bg-slate-200'
                            } ${passStrength.score >= 1 ? 'w-1/3' : 'w-0'}`}
                          />
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              passStrength.score >= 2 ? passStrength.color : 'bg-slate-200'
                            } ${passStrength.score >= 2 ? 'w-1/3' : 'w-0'}`}
                          />
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              passStrength.score >= 3 ? passStrength.color : 'bg-slate-200'
                            } ${passStrength.score >= 3 ? 'w-1/3' : 'w-0'}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Konfirmasi Kata Sandi Baru */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Ulangi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang kata sandi baru"
                        className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl pr-10 focus:bg-white h-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title={showConfirmPass ? 'Sembunyikan' : 'Lihat'}
                      >
                        {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        Kata sandi konfirmasi tidak cocok
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Info Petunjuk Keamanan */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Shield className="h-3.5 w-3.5 text-orange-500" />
                    <span>Rekomendasi Keamanan:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 pl-1">
                    <li>Gunakan kombinasi huruf besar, huruf kecil, dan angka.</li>
                    <li>Hindari kata sandi yang mudah ditebak seperti tanggal lahir.</li>
                    <li>Setelah disimpan, enkripsi bcrypt langsung mengamankan akun Anda.</li>
                  </ul>
                </div>
              </CardContent>
            </div>

            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSavingPass || !oldPassword || !newPassword || newPassword !== confirmPassword}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold px-5 h-10 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <Lock className="h-4 w-4 mr-1.5" />
                {isSavingPass ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfileTab;
