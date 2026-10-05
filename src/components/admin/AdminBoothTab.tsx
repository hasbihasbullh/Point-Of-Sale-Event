/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Booth, MasterMenu, BoothMenu, MasterCategory, EventSetting } from '../../types';
import { formatIDR } from './adminTypes';
import { getFoodImage } from '../../foodImages';
import {
  Search,
  Plus,
  CheckSquare,
  Coins,
  QrCode,
  CreditCard,
  Ticket,
  Edit3,
  X,
  Check,
  Monitor,
  ChefHat,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface AdminBoothTabProps {
  booths: Booth[];
  masterMenus: MasterMenu[];
  boothMenus: BoothMenu[];
  categories: MasterCategory[];
  eventForm: EventSetting;
  onRefreshData: () => Promise<void>;
  checkAuth: (res: Response) => boolean;
  handleUploadImage: (file: File, folder: string) => Promise<string | null>;
}

export const AdminBoothTab: React.FC<AdminBoothTabProps> = ({
  booths,
  masterMenus,
  boothMenus,
  categories,
  eventForm,
  onRefreshData,
  checkAuth,
  handleUploadImage,
}) => {
  const [boothSearchQuery, setBoothSearchQuery] = useState('');

  // Modal Dialog states for Booth
  const [isBoothModalOpen, setIsBoothModalOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState<Partial<Booth> | null>(null);

  // Modal Dialog states for Booth Menu Assignment
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetBoothForAssign, setTargetBoothForAssign] = useState<Booth | null>(null);
  const [assignSelectedMasterIds, setAssignSelectedMasterIds] = useState<Set<string>>(new Set());
  const [assignCustomPrices, setAssignCustomPrices] = useState<Record<string, number>>({});
  const [assignCustomStocks, setAssignCustomStocks] = useState<Record<string, number | null>>({});
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignCategoryFilter, setAssignCategoryFilter] = useState('Semua');
  const [isSavingAssign, setIsSavingAssign] = useState(false);

  // Master categories list for filters
  const masterCategories = useMemo(() => {
    const sortedDbCategories = [...categories]
      .sort((a, b) => (a.urutan ?? 999) - (b.urutan ?? 999))
      .map((c) => c.nama.trim())
      .filter(Boolean);

    const menuCategories = new Set<string>();
    masterMenus.forEach((m) => {
      if (m.kategori) {
        m.kategori
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
          .forEach((c) => menuCategories.add(c));
      }
    });

    const merged = ['Semua', ...sortedDbCategories];
    menuCategories.forEach((cat) => {
      if (!merged.some((m) => m.toLowerCase() === cat.toLowerCase())) {
        merged.push(cat);
      }
    });

    return merged;
  }, [categories, masterMenus]);

  // Filtered Booths
  const filteredBooths = useMemo(() => {
    return booths.filter(
      (b) =>
        b.nama.toLowerCase().includes(boothSearchQuery.toLowerCase()) ||
        b.kode.toLowerCase().includes(boothSearchQuery.toLowerCase())
    );
  }, [booths, boothSearchQuery]);

  // ==========================================
  // BOOTH ACTIONS
  // ==========================================
  const handleSaveBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooth) return;

    try {
      const isNew = !editingBooth.id;
      const url = isNew ? '/api/booths' : `/api/booths/${editingBooth.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify(editingBooth),
      });

      if (!checkAuth(res)) return;
      if (res.ok) {
        await onRefreshData();
        setIsBoothModalOpen(false);
        setEditingBooth(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan booth');
      }
    } catch (e) {
      alert('Koneksi server terputus');
    }
  };

  const toggleBoothActive = async (booth: Booth) => {
    try {
      const res = await fetch(`/api/booths/${booth.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify({ aktif: !booth.aktif }),
      });
      if (!checkAuth(res)) return;
      if (res.ok) await onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBoothPayment = async (
    booth: Booth,
    field: 'pay_cash_active' | 'pay_qris_active' | 'pay_edc_active'
  ) => {
    const currentValue = booth[field] !== false;
    try {
      const res = await fetch(`/api/booths/${booth.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      if (!checkAuth(res)) return;
      if (res.ok) await onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBoothVoucher = async (booth: Booth) => {
    const currentValue = booth.voucher_active !== false;
    try {
      const res = await fetch(`/api/booths/${booth.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify({ voucher_active: !currentValue }),
      });
      if (!checkAuth(res)) return;
      if (res.ok) await onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBoothKiosk = async (booth: Booth) => {
    try {
      const res = await fetch(`/api/booths/${booth.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify({ kiosk: !booth.kiosk }),
      });
      if (!checkAuth(res)) return;
      if (res.ok) await onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBoothKds = async (booth: Booth) => {
    const currentValue = booth.kds_active !== false;
    try {
      const res = await fetch(`/api/booths/${booth.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify({ kds_active: !currentValue }),
      });
      if (!checkAuth(res)) return;
      if (res.ok) await onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBooth = async (id: string) => {
    if (
      !confirm(
        'PENTING: Apakah Anda yakin ingin menghapus booth ini beserta seluruh relasinya secara PERMANEN? Master Menu tetap aman.'
      )
    )
      return;
    try {
      const res = await fetch(`/api/booths/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}` },
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        await onRefreshData();
      } else {
        const err = await res.json();
        alert(`Gagal menghapus booth: ${err.error || 'Kesalahan server'}`);
      }
    } catch (e) {
      alert('Koneksi terputus saat menghapus booth');
    }
  };

  // ==========================================
  // BOOTH MENU ASSIGNMENT MODAL ACTIONS
  // ==========================================
  const handleOpenAssignModal = (booth: Booth) => {
    setTargetBoothForAssign(booth);
    const assigned = boothMenus.filter((bm) => bm.booth_id === booth.id);
    const selectedIds = new Set(assigned.map((bm) => bm.master_menu_id));
    const prices: Record<string, number> = {};
    const stocks: Record<string, number | null> = {};

    assigned.forEach((bm) => {
      prices[bm.master_menu_id] = bm.harga;
      stocks[bm.master_menu_id] = bm.stok ?? null;
    });

    setAssignSelectedMasterIds(selectedIds);
    setAssignCustomPrices(prices);
    setAssignCustomStocks(stocks);
    setAssignSearchQuery('');
    setAssignCategoryFilter('Semua');
    setIsAssignModalOpen(true);
  };

  const toggleAssignSelect = (masterId: string, defaultPrice: number) => {
    const next = new Set(assignSelectedMasterIds);
    if (next.has(masterId)) {
      next.delete(masterId);
    } else {
      next.add(masterId);
      if (assignCustomPrices[masterId] === undefined) {
        setAssignCustomPrices((prev) => ({ ...prev, [masterId]: defaultPrice }));
      }
    }
    setAssignSelectedMasterIds(next);
  };

  const handleSelectAllAssign = () => {
    const next = new Set<string>();
    const nextPrices = { ...assignCustomPrices };
    masterMenus.forEach((m) => {
      next.add(m.id);
      if (nextPrices[m.id] === undefined) {
        nextPrices[m.id] = m.harga_default;
      }
    });
    setAssignSelectedMasterIds(next);
    setAssignCustomPrices(nextPrices);
  };

  const handleDeselectAllAssign = () => {
    setAssignSelectedMasterIds(new Set());
  };

  const handleSaveAssignMenus = async () => {
    if (!targetBoothForAssign) return;
    setIsSavingAssign(true);
    try {
      const menuAssignments = Array.from(assignSelectedMasterIds).map((mId, idx) => {
        const master = masterMenus.find((m) => m.id === mId);
        return {
          master_menu_id: mId,
          harga: assignCustomPrices[mId] !== undefined ? assignCustomPrices[mId] : master?.harga_default || 0,
          stok: assignCustomStocks[mId] !== undefined ? assignCustomStocks[mId] : null,
          tersedia: true,
          urutan: idx,
        };
      });

      const res = await fetch(`/api/booths/${targetBoothForAssign.id}/assign-menus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify({ menuAssignments }),
      });

      if (!checkAuth(res)) return;
      if (res.ok) {
        await onRefreshData();
        setIsAssignModalOpen(false);
        setTargetBoothForAssign(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan penugasan menu');
      }
    } catch (err) {
      alert('Koneksi server terputus');
    } finally {
      setIsSavingAssign(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Stan Penjual (Booth)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola stan festival dan gunakan tombol <b>"Kelola Menu Stan"</b> untuk memilih produk master yang dijual di stan tersebut.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode / nama stan..."
              value={boothSearchQuery}
              onChange={(e) => setBoothSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs w-56 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-xs"
            />
          </div>

          <Button
            onClick={() => {
              setEditingBooth({
                kode: '',
                nama: '',
                aktif: true,
                kiosk: false,
                kds_active: true,
                pay_cash_active: true,
                pay_qris_active: true,
                pay_edc_active: true,
                voucher_active: true,
                voucher_nominal: eventForm.voucher_nominal || 5000,
              });
              setIsBoothModalOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Stan Baru</span>
          </Button>
        </div>
      </div>

      {/* Booths Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Kode & Nama Stan</th>
                <th className="py-3 px-4">Menu Ter-Assign</th>
                <th className="py-3 px-4 text-center">Metode Bayar</th>
                <th className="py-3 px-4 text-center">Voucher Promo</th>
                <th className="py-3 px-4 text-center">Kiosk Mandiri</th>
                <th className="py-3 px-4 text-center">Layar Dapur (KDS)</th>
                <th className="py-3 px-4 text-center">Status Stan</th>
                <th className="py-3 px-4 text-right">Aksi & Pengaturan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBooths.map((b) => {
                const assignedCount = boothMenus.filter((bm) => bm.booth_id === b.id).length;
                const isCash = b.pay_cash_active !== false;
                const isQris = b.pay_qris_active !== false;
                const isEdc = b.pay_edc_active !== false;
                const isVoucher = b.voucher_active !== false;
                const vNominal = b.voucher_nominal || 5000;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded-lg font-black text-xs">
                          {b.kode}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{b.nama}</p>
                          <p className="text-[11px] text-slate-400 font-medium">Stan Penjualan</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleOpenAssignModal(b)}
                        className="bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 border border-slate-200 hover:border-orange-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                      >
                        <CheckSquare className="h-3.5 w-3.5 text-orange-500" />
                        <span>{assignedCount} Menu Dicentang</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          onClick={() => toggleBoothPayment(b, 'pay_cash_active')}
                          title={`Klik untuk ${isCash ? 'nonaktifkan' : 'aktifkan'} Cash`}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                            isCash
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60 hover:opacity-100'
                          }`}
                        >
                          <Coins className="h-2.5 w-2.5" />
                          <span>Cash</span>
                        </button>

                        <button
                          onClick={() => toggleBoothPayment(b, 'pay_qris_active')}
                          title={`Klik untuk ${isQris ? 'nonaktifkan' : 'aktifkan'} QRIS`}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                            isQris
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60 hover:opacity-100'
                          }`}
                        >
                          <QrCode className="h-2.5 w-2.5" />
                          <span>QRIS</span>
                        </button>

                        <button
                          onClick={() => toggleBoothPayment(b, 'pay_edc_active')}
                          title={`Klik untuk ${isEdc ? 'nonaktifkan' : 'aktifkan'} EDC/Transfer`}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                            isEdc
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60 hover:opacity-100'
                          }`}
                        >
                          <CreditCard className="h-2.5 w-2.5" />
                          <span>EDC</span>
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleBoothVoucher(b)}
                        title={`Klik untuk ${isVoucher ? 'nonaktifkan' : 'aktifkan'} voucher di stan ini`}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                          isVoucher
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-2xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Ticket className={`h-3 w-3 ${isVoucher ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span>{isVoucher ? formatIDR(vNominal) : 'Nonaktif'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleBoothKiosk(b)}
                        title={`Klik untuk ${b.kiosk ? 'nonaktifkan' : 'aktifkan'} Kiosk Mandiri`}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                          b.kiosk
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-2xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Monitor className="h-3 w-3" />
                        <span>{b.kiosk ? 'Kiosk ON' : 'OFF'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleBoothKds(b)}
                        title={`Klik untuk ${b.kds_active !== false ? 'nonaktifkan' : 'aktifkan'} Layar Dapur (KDS)`}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                          b.kds_active !== false
                            ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 shadow-2xs'
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60 hover:opacity-100'
                        }`}
                      >
                        <ChefHat className="h-3 w-3" />
                        <span>{b.kds_active !== false ? 'KDS Aktif' : 'OFF'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleBoothActive(b)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          b.aktif
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {b.aktif ? 'Buka (Aktif)' : 'Tutup'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingBooth(b);
                            setIsBoothModalOpen(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg text-xs cursor-pointer"
                          title="Edit Booth"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooth(b.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg text-xs cursor-pointer"
                          title="Hapus Booth"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: EDIT / CREATE BOOTH                                     */}
      {/* ============================================================== */}
      <Dialog open={isBoothModalOpen} onOpenChange={setIsBoothModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingBooth?.id ? 'Edit Stan (Booth)' : 'Tambah Stan Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Konfigurasikan identitas stan, kode kasir, dan metode pembayaran aktif.
            </DialogDescription>
          </DialogHeader>

          {editingBooth && (
            <form onSubmit={handleSaveBooth} className="space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Kode Stan</label>
                  <Input
                    value={editingBooth.kode || ''}
                    onChange={(e) => setEditingBooth({ ...editingBooth, kode: e.target.value.toUpperCase() })}
                    placeholder="B01"
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono uppercase focus:bg-white"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Stan</label>
                  <Input
                    value={editingBooth.nama || ''}
                    onChange={(e) => setEditingBooth({ ...editingBooth, nama: e.target.value })}
                    placeholder="Stan Bakso Solo"
                    className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* QRIS Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Foto QRIS Stan (Statis)
                </label>
                <div className="flex items-center gap-3">
                  {editingBooth.qris_image_path && (
                    <img
                      src={editingBooth.qris_image_path}
                      alt="QRIS Preview"
                      className="w-12 h-12 rounded-lg object-contain bg-white p-1 border border-slate-200"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleUploadImage(file, 'qris');
                        if (url) setEditingBooth({ ...editingBooth, qris_image_path: url });
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              {/* Fitur Operasional */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Fitur Operasional Stan
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200 hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={editingBooth.kiosk ?? false}
                      onChange={(e) => setEditingBooth({ ...editingBooth, kiosk: e.target.checked })}
                      className="rounded bg-white border-slate-300 text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-slate-700 font-medium">Kiosk Mandiri</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200 hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={editingBooth.kds_active ?? true}
                      onChange={(e) => setEditingBooth({ ...editingBooth, kds_active: e.target.checked })}
                      className="rounded bg-white border-slate-300 text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-slate-700 font-medium">Layar Dapur (KDS)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200 hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={editingBooth.aktif ?? true}
                      onChange={(e) => setEditingBooth({ ...editingBooth, aktif: e.target.checked })}
                      className="rounded bg-white border-slate-300 text-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-slate-700 font-medium">Stan Buka</span>
                  </label>
                </div>
              </div>

              {/* Metode Pembayaran Aktif */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Metode Pembayaran Kasir & Kiosk
                  </label>
                  <span className="text-[10px] text-slate-400">Centang metode yang diterima stan</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editingBooth.pay_cash_active !== false
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editingBooth.pay_cash_active !== false}
                      onChange={(e) => setEditingBooth({ ...editingBooth, pay_cash_active: e.target.checked })}
                      className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 font-bold">
                      <Coins className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Tunai (Cash)</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editingBooth.pay_qris_active !== false
                        ? 'bg-purple-50 border-purple-300 text-purple-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editingBooth.pay_qris_active !== false}
                      onChange={(e) => setEditingBooth({ ...editingBooth, pay_qris_active: e.target.checked })}
                      className="rounded bg-white border-slate-300 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 font-bold">
                      <QrCode className="h-3.5 w-3.5 text-purple-600" />
                      <span>QRIS Statis</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      editingBooth.pay_edc_active !== false
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editingBooth.pay_edc_active !== false}
                      onChange={(e) => setEditingBooth({ ...editingBooth, pay_edc_active: e.target.checked })}
                      className="rounded bg-white border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5 font-bold">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                      <span>EDC / Kartu</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Pengaturan Voucher Stan */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between bg-amber-50/60 border border-amber-200/80 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Izinkan Voucher Promo di Stan Ini</p>
                      <p className="text-[10px] text-amber-700/80">
                        Jika aktif, kasir dan kiosk stan ini dapat menerima potongan voucher festival.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingBooth.voucher_active !== false}
                      onChange={(e) => setEditingBooth({ ...editingBooth, voucher_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {editingBooth.voucher_active !== false && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-orange-500" />
                      <span>Nominal Diskon Voucher per Lembar (Rp)</span>
                    </label>
                    <Input
                      type="number"
                      value={editingBooth.voucher_nominal !== undefined ? editingBooth.voucher_nominal : 5000}
                      onChange={(e) => setEditingBooth({ ...editingBooth, voucher_nominal: Number(e.target.value) })}
                      placeholder="5000"
                      className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono text-xs focus:bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Nominal potongan tiap kali kasir menekan tombol voucher (+).
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsBoothModalOpen(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Stan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: BOOTH MENU MULTI-SELECT CHECKLIST ASSIGNMENT            */}
      {/* ============================================================== */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-2xl rounded-3xl max-h-[90vh] flex flex-col shadow-2xl">
          <DialogHeader className="shrink-0">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white font-mono font-black text-xs px-2 py-0.5 rounded shadow-xs">
                {targetBoothForAssign?.kode}
              </span>
              <DialogTitle className="text-base font-bold text-slate-900">
                Kelola Menu Stan: {targetBoothForAssign?.nama}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Centang produk master yang dijual di stan ini. Anda dapat menyesuaikan harga khusus dan kuota stok stan jika diperlukan.
            </DialogDescription>
          </DialogHeader>

          <div className="shrink-0 space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Cari menu master..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs w-48 focus:outline-none focus:bg-white"
                />
                <Select value={assignCategoryFilter} onValueChange={setAssignCategoryFilter}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white min-w-[120px]">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[140px]">
                    {masterCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllAssign}
                  className="text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-colors cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllAssign}
                  className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                >
                  Batalkan Semua
                </button>
              </div>
            </div>
          </div>

          {/* Checklist Items Scroll Container */}
          <ScrollArea className="flex-1 max-h-[50vh] py-2 pr-1">
            <div className="space-y-2 divide-y divide-slate-100 pr-1">
              {masterMenus
                .filter((m) => {
                  const q = assignSearchQuery.toLowerCase().trim();
                  const menuCats = (m.kategori || '')
                    .split(',')
                    .map((c) => c.trim().toLowerCase())
                    .filter(Boolean);
                  const matchesSearch =
                    !q || m.nama.toLowerCase().includes(q) || (m.kategori && m.kategori.toLowerCase().includes(q));
                  const matchesCat =
                    assignCategoryFilter === 'Semua' || menuCats.includes(assignCategoryFilter.toLowerCase());
                  return matchesSearch && matchesCat;
                })
                .map((m) => {
                  const isChecked = assignSelectedMasterIds.has(m.id);
                  const currentPrice =
                    assignCustomPrices[m.id] !== undefined ? assignCustomPrices[m.id] : m.harga_default;
                  const currentStock = assignCustomStocks[m.id] !== undefined ? assignCustomStocks[m.id] : '';

                  return (
                    <div
                      key={m.id}
                      className={`pt-2.5 pb-2 px-3 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-orange-50/70 border border-orange-300'
                          : 'bg-slate-50/60 hover:bg-slate-100/80 border border-slate-200/80'
                      }`}
                    >
                      <div
                        onClick={() => toggleAssignSelect(m.id, m.harga_default)}
                        className="flex items-center gap-3 cursor-pointer flex-1 select-none"
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-orange-500 text-white'
                              : 'border border-slate-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>

                        <img
                          src={m.foto || getFoodImage(m.kategori, m.nama)}
                          alt={m.nama}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                        />

                        <div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {(m.kategori || 'Umum')
                              .split(',')
                              .map((c) => c.trim())
                              .filter(Boolean)
                              .map((catName, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="text-[10px] uppercase font-bold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded"
                                >
                                  {catName}
                                </span>
                              ))}
                          </div>
                          <p className="font-bold text-slate-800 text-xs mt-0.5">{m.nama}</p>
                          <p className="text-[10.5px] text-slate-400">Harga Standar: {formatIDR(m.harga_default)}</p>
                        </div>
                      </div>

                      {/* Price & Stock Overrides (Only active when checked) */}
                      {isChecked && (
                        <div className="flex items-center gap-3 shrink-0 pl-8 md:pl-0">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Harga Stan (IDR)
                            </label>
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) =>
                                setAssignCustomPrices({ ...assignCustomPrices, [m.id]: Number(e.target.value) })
                              }
                              className="bg-white border border-slate-200 text-emerald-600 font-black rounded-lg px-2 py-1 text-xs w-28 text-right font-mono focus:ring-1 focus:ring-orange-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase">
                              Stok (Opsional)
                            </label>
                            <input
                              type="number"
                              placeholder="Unlimited"
                              value={currentStock ?? ''}
                              onChange={(e) =>
                                setAssignCustomStocks({
                                  ...assignCustomStocks,
                                  [m.id]: e.target.value === '' ? null : Number(e.target.value),
                                })
                              }
                              className="bg-white border border-slate-200 text-slate-900 font-bold rounded-lg px-2 py-1 text-xs w-20 text-right font-mono focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </ScrollArea>

          <DialogFooter className="shrink-0 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">
              Terpilih: <b className="text-orange-600">{assignSelectedMasterIds.size} Menu</b>
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveAssignMenus}
                disabled={isSavingAssign}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl px-5 shadow-xs cursor-pointer"
              >
                {isSavingAssign ? 'Menyimpan...' : 'Terapkan Menu ke Stan'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
