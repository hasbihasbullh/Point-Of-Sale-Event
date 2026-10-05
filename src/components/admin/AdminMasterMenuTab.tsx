/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MasterMenu, MasterCategory, Booth, BoothMenu } from '../../types';
import { getCategoryColorStyle, formatIDR, CATEGORY_COLORS } from './adminTypes';
import { getFoodImage } from '../../foodImages';
import {
  Search,
  Tag,
  Plus,
  ChefHat,
  Edit3,
  X,
  Check,
  Palette,
  Trash2,
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

interface AdminMasterMenuTabProps {
  masterMenus: MasterMenu[];
  booths: Booth[];
  boothMenus: BoothMenu[];
  categories: MasterCategory[];
  onRefreshData: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  checkAuth: (res: Response) => boolean;
  handleUploadImage: (file: File, folder: string) => Promise<string | null>;
}

export const AdminMasterMenuTab: React.FC<AdminMasterMenuTabProps> = ({
  masterMenus,
  booths,
  boothMenus,
  categories,
  onRefreshData,
  fetchCategories,
  checkAuth,
  handleUploadImage,
}) => {
  const [masterMenuSearchQuery, setMasterMenuSearchQuery] = useState('');
  const [masterMenuCategoryFilter, setMasterMenuCategoryFilter] = useState('Semua');

  // Modal Dialog states for Master Menu
  const [isMasterMenuModalOpen, setIsMasterMenuModalOpen] = useState(false);
  const [editingMasterMenu, setEditingMasterMenu] = useState<Partial<MasterMenu> | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Modal Dialog & Management states for Master Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<MasterCategory> | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Category map by name
  const categoryMapByName = useMemo(() => {
    const map = new Map<string, MasterCategory>();
    categories.forEach((cat) => {
      map.set(cat.nama.toLowerCase(), cat);
    });
    return map;
  }, [categories]);

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

  // All available category tags
  const allAvailableCategoryTags = useMemo(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.nama && c.nama.trim()) set.add(c.nama.trim());
    });
    masterMenus.forEach((m) => {
      if (m.kategori) {
        m.kategori
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
          .forEach((c) => set.add(c));
      }
    });
    return Array.from(set);
  }, [categories, masterMenus]);

  // Filtered Master Menus
  const filteredMasterMenus = useMemo(() => {
    return masterMenus.filter((m) => {
      const matchSearch =
        m.nama.toLowerCase().includes(masterMenuSearchQuery.toLowerCase()) ||
        (m.kategori && m.kategori.toLowerCase().includes(masterMenuSearchQuery.toLowerCase()));

      const matchCat =
        masterMenuCategoryFilter === 'Semua' ||
        (m.kategori &&
          m.kategori
            .split(',')
            .map((c) => c.trim().toLowerCase())
            .includes(masterMenuCategoryFilter.toLowerCase()));

      return matchSearch && matchCat;
    });
  }, [masterMenus, masterMenuSearchQuery, masterMenuCategoryFilter]);

  // ==========================================
  // MASTER CATEGORY ACTIONS
  // ==========================================
  const handleSaveCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingCategory || !editingCategory.nama || !editingCategory.nama.trim()) {
      alert('Nama kategori wajib diisi');
      return;
    }

    setIsSavingCategory(true);
    try {
      const isNew = !editingCategory.id;
      const url = isNew ? '/api/categories' : `/api/categories/${editingCategory.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify(editingCategory),
      });

      if (!checkAuth(res)) return;
      if (res.ok) {
        await fetchCategories();
        await onRefreshData();
        setEditingCategory(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan kategori');
      }
    } catch (err) {
      alert('Koneksi server terganggu');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: MasterCategory) => {
    const confirmMsg =
      cat.menu_count && cat.menu_count > 0
        ? `Kategori "${cat.nama}" saat ini digunakan oleh ${cat.menu_count} menu. Yakin ingin menghapus kategori ini?`
        : `Yakin ingin menghapus kategori "${cat.nama}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
      });

      if (!checkAuth(res)) return;
      if (res.ok) {
        await fetchCategories();
        await onRefreshData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus kategori');
      }
    } catch (err) {
      alert('Koneksi server terganggu');
    }
  };

  // ==========================================
  // MASTER MENU ACTIONS
  // ==========================================
  const getCurrentMenuCategoryList = (): string[] => {
    if (!editingMasterMenu?.kategori) return [];
    return editingMasterMenu.kategori
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  };

  const handleToggleMenuCategory = (catName: string) => {
    if (!editingMasterMenu) return;
    const cleanCat = catName.trim();
    if (!cleanCat) return;

    const currentList = getCurrentMenuCategoryList();
    let updatedList: string[];

    if (currentList.some((c) => c.toLowerCase() === cleanCat.toLowerCase())) {
      updatedList = currentList.filter((c) => c.toLowerCase() !== cleanCat.toLowerCase());
    } else {
      updatedList = [...currentList, cleanCat];
    }

    const updatedCategoryString = updatedList.join(', ');
    const isDrink = updatedList.some((c) => c.toLowerCase().includes('minuman'));

    setEditingMasterMenu({
      ...editingMasterMenu,
      kategori: updatedCategoryString,
      kds_display: isDrink ? false : editingMasterMenu.kds_display !== undefined ? editingMasterMenu.kds_display : true,
    });
  };

  const handleAddNewCategoryTag = async () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed || !editingMasterMenu) return;

    // Check if category exists in database, if not create it
    const existing = categories.find((c) => c.nama.toLowerCase() === trimmed.toLowerCase());
    if (!existing) {
      try {
        const token = sessionStorage.getItem('pos_admin_token');
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nama: trimmed }),
        });
        if (res.ok) {
          await fetchCategories();
        }
      } catch (err) {
        console.error('Error auto-creating category:', err);
      }
    }

    const currentList = getCurrentMenuCategoryList();
    if (!currentList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updatedList = [...currentList, trimmed];
      const updatedCategoryString = updatedList.join(', ');
      const isDrink = updatedList.some((c) => c.toLowerCase().includes('minuman'));

      setEditingMasterMenu({
        ...editingMasterMenu,
        kategori: updatedCategoryString,
        kds_display: isDrink ? false : editingMasterMenu.kds_display !== undefined ? editingMasterMenu.kds_display : true,
      });
    }
    setNewCategoryInput('');
  };

  const handleSaveMasterMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMasterMenu) return;

    if (!editingMasterMenu.kategori || !editingMasterMenu.kategori.trim()) {
      alert('Pilih atau tambahkan minimal 1 kategori untuk produk menu ini.');
      return;
    }

    try {
      const isNew = !editingMasterMenu.id;
      const url = isNew ? '/api/master-menus' : `/api/master-menus/${editingMasterMenu.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify(editingMasterMenu),
      });

      if (!checkAuth(res)) return;
      if (res.ok) {
        await onRefreshData();
        setIsMasterMenuModalOpen(false);
        setEditingMasterMenu(null);
        setNewCategoryInput('');
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan Master Menu');
      }
    } catch (e) {
      alert('Koneksi server terputus');
    }
  };

  const handleDeleteMasterMenu = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk Master Menu ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/master-menus/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}` },
      });
      if (!checkAuth(res)) return;
      if (res.ok) {
        await onRefreshData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus menu');
      }
    } catch (e) {
      alert('Koneksi server terputus');
    }
  };

  const toggleMasterMenuAktif = async (m: MasterMenu) => {
    try {
      const res = await fetch(`/api/master-menus/${m.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('pos_admin_token')}`,
        },
        body: JSON.stringify({ aktif: !m.aktif }),
      });
      if (!checkAuth(res)) return;
      if (res.ok) await onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Katalog Master Menu Pusat</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh menu makanan, minuman, dan cemilan yang tersimpan di sistem. Menu ini dapat digunakan di stan event manapun.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama menu / kategori..."
              value={masterMenuSearchQuery}
              onChange={(e) => setMasterMenuSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 rounded-xl pl-9 pr-3 py-2 text-xs w-52 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-xs"
            />
          </div>

          <Button
            onClick={() => {
              setIsCategoryModalOpen(true);
            }}
            variant="outline"
            className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold text-xs rounded-xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Tag className="h-3.5 w-3.5 text-orange-500" />
            <span>Kelola Kategori ({categories.length})</span>
          </Button>

          <Button
            onClick={() => {
              setEditingMasterMenu({
                nama: '',
                harga_default: 20000,
                kategori: '',
                deskripsi: '',
                kds_display: true,
                aktif: true,
              });
              setNewCategoryInput('');
              setIsMasterMenuModalOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Master Menu</span>
          </Button>
        </div>
      </div>

      {/* Category Filter Pills with Sort Order & Colors */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {masterCategories.map((cat) => {
          const isSelected = masterMenuCategoryFilter === cat;
          const catObj = categoryMapByName.get(cat.toLowerCase());
          const cStyle = getCategoryColorStyle(catObj?.warna);

          return (
            <button
              key={cat}
              onClick={() => setMasterMenuCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat !== 'Semua' && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? '#ffffff' : cStyle.hex }}
                />
              )}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Master Menu Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMasterMenus.map((m) => {
          const assignedBooths = boothMenus
            .filter((bm) => bm.master_menu_id === m.id)
            .map((bm) => booths.find((b) => b.id === bm.booth_id))
            .filter(Boolean);

          return (
            <div
              key={m.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-orange-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start gap-3">
                  <img
                    src={m.foto || getFoodImage(m.kategori, m.nama)}
                    alt={m.nama}
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap mb-1">
                      {(m.kategori || 'Umum')
                        .split(',')
                        .map((c) => c.trim())
                        .filter(Boolean)
                        .map((catName, cIdx) => {
                          const catObj = categoryMapByName.get(catName.toLowerCase());
                          const cStyle = getCategoryColorStyle(catObj?.warna);
                          return (
                            <span
                              key={cIdx}
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}
                            >
                              {catName}
                            </span>
                          );
                        })}
                      {m.kds_display !== false ? (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <ChefHat className="h-2.5 w-2.5" />
                          <span>KDS Dapur</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <span>Kasir / Non-KDS</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{m.nama}</h4>
                    <p className="font-black text-emerald-600 text-sm mt-0.5">{formatIDR(m.harga_default)}</p>
                  </div>
                </div>

                {m.deskripsi && (
                  <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">{m.deskripsi}</p>
                )}

                {/* Selling in Booths Badge */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dijual di Stan:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedBooths.length > 0 ? (
                      assignedBooths.map((b) => (
                        <span
                          key={b?.id}
                          className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200"
                        >
                          {b?.kode}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Belum di-assign ke stan manapun</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => toggleMasterMenuAktif(m)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.aktif
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {m.aktif ? 'Katalog Aktif' : 'Nonaktif'}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingMasterMenu(m);
                      setIsMasterMenuModalOpen(true);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1.5 rounded-lg text-xs cursor-pointer"
                    title="Edit Produk"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMasterMenu(m.id)}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg text-xs cursor-pointer"
                    title="Hapus Produk"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT MASTER MENU                                  */}
      {/* ============================================================== */}
      <Dialog open={isMasterMenuModalOpen} onOpenChange={setIsMasterMenuModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {editingMasterMenu?.id ? 'Edit Master Menu' : 'Tambah Produk Master Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Produk ini akan disimpan ke katalog master dan dapat dicentang ke stan mana saja.
            </DialogDescription>
          </DialogHeader>

          {editingMasterMenu && (
            <form onSubmit={handleSaveMasterMenu} className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Produk
                </label>
                <Input
                  value={editingMasterMenu.nama || ''}
                  onChange={(e) => setEditingMasterMenu({ ...editingMasterMenu, nama: e.target.value })}
                  placeholder="Contoh: Es Teh Manis Jumbo"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:bg-white"
                  required
                />
              </div>

              {/* Custom Multi-Category Tag Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Kategori Menu (Bisa Pilih Lebih Dari 1)
                  </label>
                  <span className="text-[10.5px] text-slate-400">
                    {getCurrentMenuCategoryList().length} kategori terpilih
                  </span>
                </div>

                {/* Active Selected Tags Display */}
                <div className="min-h-[44px] p-2 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-1.5">
                  {getCurrentMenuCategoryList().length === 0 ? (
                    <span className="text-xs text-slate-400 italic px-1">
                      Belum ada kategori dipilih. Klik chip di bawah atau ketik kategori baru.
                    </span>
                  ) : (
                    getCurrentMenuCategoryList().map((cat) => {
                      const catObj = categoryMapByName.get(cat.toLowerCase());
                      const cStyle = getCategoryColorStyle(catObj?.warna);
                      return (
                        <span
                          key={cat}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl shadow-xs border ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cStyle.hex }} />
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleMenuCategory(cat)}
                            className="hover:opacity-75 rounded-full p-0.5 ml-0.5 cursor-pointer"
                            title={`Hapus kategori ${cat}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>

                {/* Input Tambah Kategori Baru Mandiri */}
                <div className="flex gap-2 mt-2">
                  <Input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategoryTag();
                      }
                    }}
                    placeholder="+ Ketik kategori baru (misal: Dimsum, Kopi, Best Seller)..."
                    className="bg-white border-slate-200 text-slate-900 rounded-xl text-xs focus:bg-white"
                  />
                  <Button
                    type="button"
                    onClick={handleAddNewCategoryTag}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl px-3.5 shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah</span>
                  </Button>
                </div>

                {/* Rekomendasi Chip Kategori yang Tersedia di Sistem */}
                {allAvailableCategoryTags.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Pilihan Kategori yang Sudah Ada di Sistem:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-[10px] text-orange-600 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Tag className="h-3 w-3" />
                        <span>Kelola Master</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allAvailableCategoryTags.map((cat) => {
                        const isSelected = getCurrentMenuCategoryList().some(
                          (c) => c.toLowerCase() === cat.toLowerCase()
                        );
                        const catObj = categoryMapByName.get(cat.toLowerCase());
                        const cStyle = getCategoryColorStyle(catObj?.warna);

                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleToggleMenuCategory(cat)}
                            className={`px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isSelected
                                ? `${cStyle.bg} ${cStyle.text} ${cStyle.border} font-bold shadow-xs ring-1 ring-current`
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cStyle.hex }} />
                            <span>{cat}</span>
                            {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Harga Standar (Default)
                </label>
                <Input
                  type="number"
                  value={editingMasterMenu.harga_default || ''}
                  onChange={(e) =>
                    setEditingMasterMenu({ ...editingMasterMenu, harga_default: Number(e.target.value) })
                  }
                  placeholder="20000"
                  className="bg-slate-50 border-slate-200 text-slate-900 rounded-xl font-mono focus:bg-white"
                  required
                />
              </div>

              {/* KDS Kitchen Routing Toggle */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-3 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl border ${
                      editingMasterMenu.kds_display !== false
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                  >
                    <ChefHat className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Tampilkan di Layar Dapur (KDS)</p>
                    <p className="text-[10.5px] text-slate-500">
                      {editingMasterMenu.kds_display !== false
                        ? 'Menu dikirim ke tablet KDS untuk dimasak koki'
                        : 'Menu disiapkan langsung di kasir / stasiun depan (tidak masuk KDS)'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMasterMenu.kds_display !== false}
                    onChange={(e) => setEditingMasterMenu({ ...editingMasterMenu, kds_display: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Foto Menu (Auto WebP)
                </label>
                <div className="flex items-center gap-3">
                  {editingMasterMenu.foto && (
                    <img
                      src={editingMasterMenu.foto}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleUploadImage(file, 'menu');
                        if (url) setEditingMasterMenu({ ...editingMasterMenu, foto: url });
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  value={editingMasterMenu.deskripsi || ''}
                  onChange={(e) => setEditingMasterMenu({ ...editingMasterMenu, deskripsi: e.target.value })}
                  rows={2}
                  placeholder="Rasa nikmat, porsi pas..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 text-xs focus:bg-white"
                />
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsMasterMenuModalOpen(false)}
                  className="text-slate-500 hover:text-slate-800 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Master Menu
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* MODAL: KELOLA MASTER KATEGORI (Category Management)            */}
      {/* ============================================================== */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="h-5 w-5 text-orange-500" />
              <span>Manajemen Master Kategori</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Atur daftar kategori produk dan warna badge identitas menu untuk katalog dan laporan.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 max-h-[65vh] my-2 pr-1">
            <div className="space-y-4 pr-1">
              {/* Form Tambah / Edit Kategori */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {editingCategory?.id ? 'Edit Kategori Terpilih' : '+ Tambah Kategori Baru'}
                  </span>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Kategori</label>
                  <Input
                    value={editingCategory?.nama || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, nama: e.target.value })}
                    placeholder="Contoh: Best Seller, Dimsum, Minuman Dingin..."
                    className="w-full bg-white border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                </div>

                {/* Pilihan Warna Badge */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-orange-500" />
                    <span>Warna Identitas / Badge Kategori</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(CATEGORY_COLORS).map((colorKey) => {
                      const c = CATEGORY_COLORS[colorKey];
                      const isSelected = (editingCategory?.warna || 'orange') === colorKey;
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setEditingCategory({ ...editingCategory, warna: colorKey })}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? `${c.bg} ${c.text} ${c.border} ring-2 ring-orange-400 ring-offset-1 shadow-xs`
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                          <span>{c.name}</span>
                          {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    onClick={() => handleSaveCategory()}
                    disabled={isSavingCategory || !editingCategory?.nama?.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl px-4 py-1.5 flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isSavingCategory ? (
                      <span>Menyimpan...</span>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{editingCategory?.id ? 'Perbarui Kategori' : 'Tambah Kategori'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Daftar Master Kategori Aktif */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  <span>Daftar Kategori Terdaftar ({categories.length})</span>
                </div>

                {categories.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Belum ada kategori terdaftar. Gunakan form di atas untuk menambahkan kategori pertama Anda.
                  </div>
                ) : (
                  categories.map((cat) => {
                    const colorStyle = getCategoryColorStyle(cat.warna);

                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Category Tag with color */}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: colorStyle.hex }}
                            />
                            <span>{cat.nama}</span>
                          </span>

                          {/* Menu Count */}
                          <span className="text-[10.5px] text-slate-400">{cat.menu_count || 0} menu terkait</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory({
                                id: cat.id,
                                nama: cat.nama,
                                warna: cat.warna || 'orange',
                                aktif: cat.aktif !== false,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Kategori"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="shrink-0 mt-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
              }}
              className="text-slate-600 text-xs rounded-xl cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
