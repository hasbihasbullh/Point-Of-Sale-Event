import React, { useState } from 'react';
import { EventSetting } from '../../types';
import {
  Settings,
  CheckCircle,
  Calendar,
  Building2,
  Radio,
  Store,
  Printer,
  SlidersHorizontal,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Trash2,
  Monitor,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface AdminEventsTabProps {
  eventForm: EventSetting;
  setEventForm: React.Dispatch<React.SetStateAction<EventSetting>>;
  onRefreshData: () => Promise<void>;
  checkAuth: (res: Response) => boolean;
  handleUploadImage?: (file: File, type?: 'menu' | 'qris' | 'kiosk_banner') => Promise<string | null>;
}

export const AdminEventsTab: React.FC<AdminEventsTabProps> = ({
  eventForm,
  setEventForm,
  onRefreshData,
  checkAuth,
  handleUploadImage,
}) => {
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [eventSaveSuccess, setEventSaveSuccess] = useState(false);
  const [receiptPreviewWidth, setReceiptPreviewWidth] = useState<'58mm' | '80mm'>('58mm');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [kioskPreviewOrientation, setKioskPreviewOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // ==========================================
  // KIOSK BANNER ACTIONS
  // ==========================================
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!handleUploadImage) {
      alert('Fungsi upload gambar tidak tersedia.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Ukuran file banner maksimal 15MB.');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const url = await handleUploadImage(file, 'kiosk_banner');
      if (url) {
        setEventForm((prev) => ({ ...prev, kiosk_banner: url }));
      }
    } catch (err) {
      alert('Gagal mengupload banner Kiosk');
    } finally {
      setIsUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleResetBanner = () => {
    setEventForm((prev) => ({ ...prev, kiosk_banner: '' }));
  };

  // ==========================================
  // EVENT SETTINGS ACTIONS
  // ==========================================
  const handleSaveEventSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEvent(true);
    setEventSaveSuccess(false);
    try {
      const res = await fetch('/api/event-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify(eventForm),
      });

      if (!checkAuth(res)) return;
      if (res.ok) {
        await onRefreshData();
        setEventSaveSuccess(true);
        setTimeout(() => setEventSaveSuccess(false), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan konfigurasi event');
      }
    } catch (err) {
      alert('Koneksi server terputus saat menyimpan event');
    } finally {
      setIsSavingEvent(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Input Pengaturan Event (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-500 p-2.5 rounded-2xl text-white shadow-xs">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Konfigurasi Event & Footer Struk</h2>
              <p className="text-xs text-slate-500">
                Informasi ini otomatis ter-update ke seluruh Kasir, Kiosk, dan Struk Thermal.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveEventSettings} className="space-y-4">
            {eventSaveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Pengaturan event berhasil diperbarui dan disiarkan ke seluruh terminal!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nama Festival / Event
              </label>
              <Input
                value={eventForm.nama_event}
                onChange={(e) => setEventForm({ ...eventForm, nama_event: e.target.value })}
                placeholder="Contoh: Festival Kuliner Bandung 2026"
                className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ditampilkan sebagai judul utama POS, Landing Hub, dan Header Struk Thermal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Tanggal Event</span>
                </label>
                <Input
                  value={eventForm.tanggal_event}
                  onChange={(e) => setEventForm({ ...eventForm, tanggal_event: e.target.value })}
                  placeholder="Contoh: 23 - 26 Juli 2026"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Area / Lokasi Venue</span>
                </label>
                <Input
                  value={eventForm.area_lokasi}
                  onChange={(e) => setEventForm({ ...eventForm, area_lokasi: e.target.value })}
                  placeholder="Contoh: Lapangan Gasibu"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-sky-500" />
                  <span>Konektivitas Jaringan</span>
                </label>
                <Input
                  value={eventForm.konektivitas}
                  onChange={(e) => setEventForm({ ...eventForm, konektivitas: e.target.value })}
                  placeholder="Contoh: Starlink POS Lokal"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-amber-500" />
                  <span>Client / Merchant Utama</span>
                </label>
                <Input
                  value={eventForm.client_merchant}
                  onChange={(e) => setEventForm({ ...eventForm, client_merchant: e.target.value })}
                  placeholder="Contoh: Kuliner Nusantara EO"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                <Printer className="h-3.5 w-3.5 text-purple-500" />
                <span>Pesan Footer Struk Kasir Thermal (ESC/POS)</span>
              </label>
              <textarea
                value={eventForm.footer_struk}
                onChange={(e) => setEventForm({ ...eventForm, footer_struk: e.target.value })}
                rows={3}
                placeholder="Terima kasih atas pesanan Anda!&#10;Simpan struk ini sebagai bukti transaksi."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 text-xs focus:ring-1 focus:ring-orange-500 focus:bg-white leading-relaxed font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Pesan penutup di bagian bawah struk kertas kasir (mendukung multi-baris).
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSavingEvent}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl mt-3 shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{isSavingEvent ? 'Menyimpan Pengaturan...' : 'Simpan & Siarkan Konfigurasi Event'}</span>
            </Button>
          </form>
        </div>

        {/* Right Column: Live Thermal Receipt Preview (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Preview Struk Thermal</h3>
            </div>

            {/* Width Toggle: 58mm / 80mm */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setReceiptPreviewWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  receiptPreviewWidth === '58mm'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setReceiptPreviewWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  receiptPreviewWidth === '80mm'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                80mm
              </button>
            </div>
          </div>

          {/* Thermal Paper Container */}
          <div className="w-full flex justify-center py-2">
            <div
              className={`bg-white border border-slate-200 rounded-2xl shadow-xl font-mono text-slate-800 transition-all overflow-hidden ${
                receiptPreviewWidth === '58mm' ? 'max-w-[280px] w-full text-[11px]' : 'max-w-[360px] w-full text-xs'
              }`}
            >
              {/* Top Serrated Jagged Paper Edge */}
              <div className="w-full h-2 bg-slate-100/80 overflow-hidden flex items-end">
                <svg
                  className="w-full h-2 text-white fill-current"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
                  <polygon points="0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10" />
                </svg>
              </div>

              <div className="p-4 space-y-0 leading-tight">
                {/* Header toko & event */}
                <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                  <h3 className="font-black text-sm uppercase leading-none text-slate-900">
                    {eventForm.nama_event.trim() || 'FESTIVAL POS SYSTEM'}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-800">STAN [B01] - DAPUR NUSANTARA</p>
                  <p className="text-[9px] text-slate-500">
                    {[eventForm.client_merchant.trim(), eventForm.area_lokasi.trim()].filter(Boolean).join(' • ') ||
                      'Main Venue'}
                  </p>
                </div>

                {/* Center Hero Block: Nomor Order & Pelanggan / Meja */}
                <div className="py-2 border-b border-dashed border-slate-300 text-center space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
                    Nomor Order
                  </span>
                  <div className="text-base font-black tracking-wider text-slate-900 leading-none">#0042</div>
                  <div className="text-[12px] font-black uppercase tracking-wide text-slate-900 mt-0.5">
                    [ MEJA 04 / RUDI ]
                  </div>
                </div>

                {/* Meta details */}
                <div className="space-y-0.5 py-1.5 border-b border-dashed border-slate-300 text-[10px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>
                      {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}, 14:30 WIB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir / Sumber:</span>
                    <span className="font-bold text-slate-800">POS [B01]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-bold text-slate-800">QRIS</span>
                  </div>
                </div>

                {/* Items rows */}
                <div className="py-2 border-b border-dashed border-slate-300 space-y-1.5 text-slate-800">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold">Bakso Urat Super</span>
                      <span>Rp 40.000</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pl-1">
                      <span>2 pcs x Rp 20.000</span>
                    </div>
                    <div className="text-[9.5px] text-slate-500 pl-2 italic break-words leading-tight">
                      *Catatan: Kuah pedas sedang
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold">Es Teh Manis Jumbo</span>
                      <span>Rp 12.000</span>
                    </div>
                    <div className="text-[10px] text-slate-500 pl-1">
                      <span>2 pcs x Rp 6.000</span>
                    </div>
                  </div>
                </div>

                {/* Totals row block */}
                <div className="py-2 space-y-0.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp 52.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPN (0%):</span>
                    <span>Rp 0</span>
                  </div>
                  <div className="flex justify-between font-black border-t border-dotted border-slate-300 pt-1 text-[13px] text-slate-900">
                    <span>TOTAL:</span>
                    <span>Rp 52.000</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-mono text-[10px] pt-1">
                    <span>Ref ID:</span>
                    <span>NMID-9384729103847</span>
                  </div>
                </div>

                {/* Receipt Thermal Footer slogan */}
                <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-0.5 select-none whitespace-pre-line text-[10px] text-slate-600 font-medium">
                  {eventForm.footer_struk.trim()
                    ? eventForm.footer_struk
                    : 'TERIMA KASIH ATAS KUNJUNGAN ANDA\nOrder Terkirim Otomatis ke Layar Dapur KDS'}
                </div>
              </div>

              {/* Bottom Serrated Jagged Paper Edge */}
              <div className="w-full h-2 bg-slate-100/80 overflow-hidden flex items-start">
                <svg
                  className="w-full h-2 text-white fill-current"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
                  <polygon points="0,0 5,10 10,0 15,10 20,0 25,10 30,0 35,10 40,0 45,10 50,0 55,10 60,0 65,10 70,0 75,10 80,0 85,10 90,0 95,10 100,0" />
                </svg>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Preview menyesuaikan secara real-time saat Anda mengetik data pada formulir di sebelah kiri.
          </p>
        </div>
      </div>

      {/* Kiosk Welcome Screen Banner Management Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-2xl text-white shadow-xs">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Banner Layar Selamat Datang Kiosk (Welcome Screen)
                </h2>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Kiosk Mandiri
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gambar background yang tampil di seluruh layar Kiosk sebelum pelanggan menyentuh untuk memesan.
              </p>
            </div>
          </div>

          {/* Reset / Actions */}
          {eventForm.kiosk_banner && (
            <button
              type="button"
              onClick={handleResetBanner}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset ke Gambar Bawaan</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-center">
          {/* Left side: Upload area & instructions (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Upload Banner Kustom</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Mendukung rasio <strong>16:9 Landscape</strong> (contoh: 1920x1080 px) atau <strong>9:16 Standing Portrait</strong> (contoh: 1080x1920 px). Gambar otomatis dikompresi ke WebP HD.
                  </p>
                </div>
              </div>

              {/* Upload Trigger Box */}
              <div className="relative">
                <input
                  type="file"
                  id="kiosk-banner-input"
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  className="hidden"
                  disabled={isUploadingBanner}
                />
                <label
                  htmlFor="kiosk-banner-input"
                  className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                    isUploadingBanner
                      ? 'border-orange-300 bg-orange-50/50 cursor-wait'
                      : 'border-slate-300 hover:border-orange-500 hover:bg-orange-50/30 bg-white'
                  }`}
                >
                  {isUploadingBanner ? (
                    <div className="flex flex-col items-center gap-2 text-orange-600">
                      <RefreshCw className="h-7 w-7 animate-spin" />
                      <span className="text-xs font-bold">Mengompres & Mengupload Banner...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600 text-center">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-500 group-hover:text-orange-600">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {eventForm.kiosk_banner ? 'Ganti Gambar Banner' : 'Pilih / Drag File Gambar Banner'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Maksimal ukuran file 15MB
                        </span>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* Status Information */}
              <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                <span>Status Banner:</span>
                {eventForm.kiosk_banner ? (
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Kustom Aktif
                  </span>
                ) : (
                  <span className="font-bold text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-md">
                    Gambar Bawaan (Default)
                  </span>
                )}
              </div>
            </div>

            {/* Save Button */}
            <Button
              type="button"
              onClick={handleSaveEventSettings}
              disabled={isSavingEvent || isUploadingBanner}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{isSavingEvent ? 'Menyimpan Pengaturan...' : 'Simpan Perubahan Banner'}</span>
            </Button>
          </div>

          {/* Right side: Live Miniature Kiosk Welcome Screen Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Live Preview Layar Kiosk
                </span>

                {/* Orientation Toggle: Landscape / Portrait */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setKioskPreviewOrientation('landscape')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      kioskPreviewOrientation === 'landscape'
                        ? 'bg-white text-orange-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Monitor className="h-3 w-3" />
                    <span>Landscape (16:9)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setKioskPreviewOrientation('portrait')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      kioskPreviewOrientation === 'portrait'
                        ? 'bg-white text-orange-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="h-3 w-3" />
                    <span>Standing Portrait (9:16)</span>
                  </button>
                </div>
              </div>

              {/* Realistic Miniature Kiosk Screen Container */}
              <div className="w-full flex justify-center py-3 min-h-[300px] items-center bg-slate-100/70 rounded-2xl border border-slate-200/80 p-4 transition-all">
                <div
                  className={`rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl relative select-none bg-slate-900 group transition-all duration-300 ${
                    kioskPreviewOrientation === 'portrait'
                      ? 'w-[200px] sm:w-[220px] aspect-[9/16]'
                      : 'w-full aspect-video max-w-full'
                  }`}
                >
                  {/* Background Image / Ambient Gradient Fallback */}
                  {eventForm.kiosk_banner?.trim() ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-500 group-hover:scale-105"
                        style={{
                          backgroundImage: `url('${eventForm.kiosk_banner.trim()}')`,
                        }}
                      />
                      <div className="absolute inset-0 bg-black/15" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/70 overflow-hidden">
                      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
                      <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-amber-500/15 rounded-full blur-2xl" />
                      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                    </div>
                  )}

                  {/* Mini CTA Mockup */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                    <div className="bg-white/90 backdrop-blur-md border border-white/60 px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl shadow-xl flex flex-col items-center gap-0.5 animate-pulse text-center">
                      <span className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                        <span className="text-orange-500">Order</span> Now
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        Sentuh Layar untuk Memulai
                      </span>
                    </div>
                  </div>

                  {/* Kiosk Bezel Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                    {kioskPreviewOrientation === 'portrait' ? '9:16 STANDING TOTEM' : '16:9 LANDSCAPE SCREEN'}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Gunakan toggle di atas untuk memastikan posisi gambar pas di layar horizontal maupun mesin Standing Kiosk vertikal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
