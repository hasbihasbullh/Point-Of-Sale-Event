/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Printer, Check, X, FileText, Settings2, Sliders, PlayCircle } from 'lucide-react';
import { KioskPrinterSettings } from './kioskTypes';

interface KioskPrinterSettingsModalProps {
  isOpen: boolean;
  settings: KioskPrinterSettings;
  onSave: (settings: KioskPrinterSettings) => void;
  onClose: () => void;
  onTestPrint: (settings: KioskPrinterSettings) => void;
}

export const KioskPrinterSettingsModal: React.FC<KioskPrinterSettingsModalProps> = ({
  isOpen,
  settings,
  onSave,
  onClose,
  onTestPrint,
}) => {
  const [localSettings, setLocalSettings] = useState<KioskPrinterSettings>(settings);
  const [isTestPrinted, setIsTestPrinted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setIsTestPrinted(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleRunTestPrint = () => {
    onTestPrint(localSettings);
    setIsTestPrinted(true);
    setTimeout(() => setIsTestPrinted(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print-modal">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-5 text-slate-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 leading-tight">Pengaturan Struk Kiosk</h3>
              <p className="text-[11px] font-semibold text-slate-400">Konfigurasi printer thermal mesin kiosk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Paper Width Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-orange-500" />
              Ukuran Kertas Thermal
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, paperWidth: '58mm' })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  localSettings.paperWidth === '58mm'
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-sm text-slate-800">58 mm</span>
                  {localSettings.paperWidth === '58mm' && (
                    <span className="h-4 w-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Printer portabel / Bluetooth (32 kolom)</p>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, paperWidth: '80mm' })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  localSettings.paperWidth === '80mm'
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-sm text-slate-800">80 mm</span>
                  {localSettings.paperWidth === '80mm' && (
                    <span className="h-4 w-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Printer meja / Built-in Kiosk (44 kolom)</p>
              </button>
            </div>
          </div>

          {/* Print Copies Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-orange-500" />
              Jumlah Rangkap Cetak
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, printCopies: 1 })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  localSettings.printCopies === 1
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="font-bold text-xs text-slate-800">1 Rangkap</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Struk Pelanggan saja</p>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, printCopies: 2 })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  localSettings.printCopies === 2
                    ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                }`}
              >
                <div className="font-bold text-xs text-slate-800">2 Rangkap</div>
                <p className="text-[10px] text-slate-500 mt-0.5">Pelanggan + Salinan Dapur</p>
              </button>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5 text-orange-500" />
              Opsi Otomatisasi & Informasi
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/60 cursor-pointer transition-colors">
              <div>
                <div className="font-bold text-xs text-slate-800">Cetak Otomatis (Auto-Print)</div>
                <p className="text-[11px] text-slate-500">Kirim perintah cetak langsung sesaat setelah bayar</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoPrint}
                onChange={(e) => setLocalSettings({ ...localSettings, autoPrint: e.target.checked })}
                className="h-5 w-5 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/60 cursor-pointer transition-colors">
              <div>
                <div className="font-bold text-xs text-slate-800">Tampilkan Nama Pelanggan</div>
                <p className="text-[11px] text-slate-500">Cetak baris nama pelanggan di bagian atas struk</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.showCustomerName}
                onChange={(e) => setLocalSettings({ ...localSettings, showCustomerName: e.target.checked })}
                className="h-5 w-5 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50/60 cursor-pointer transition-colors">
              <div>
                <div className="font-bold text-xs text-slate-800">Tampilkan Catatan Item</div>
                <p className="text-[11px] text-slate-500">Cetak catatan pesanan per menu (pedas, less ice, dll)</p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.showItemNotes}
                onChange={(e) => setLocalSettings({ ...localSettings, showItemNotes: e.target.checked })}
                className="h-5 w-5 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
              />
            </label>
          </div>

          {/* Test Print Section */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-slate-800">Uji Driver Printer Kiosk</div>
              <p className="text-[11px] text-slate-500">Cetak struk tester untuk validasi alignment & koneksi</p>
            </div>
            <button
              type="button"
              onClick={handleRunTestPrint}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                isTestPrinted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
              }`}
            >
              {isTestPrinted ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Terkirim!
                </>
              ) : (
                <>
                  <PlayCircle className="h-3.5 w-3.5 text-orange-600" /> Test Print
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
