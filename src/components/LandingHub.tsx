/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Booth, EventSetting } from '../types';
import { LayoutDashboard, Store, Monitor, HelpCircle, ArrowRight, Utensils, Coffee, Leaf, ChefHat, Smartphone } from 'lucide-react';

interface LandingHubProps {
  booths: Booth[];
  eventSetting?: EventSetting;
  onNavigate: (route: { type: 'hub' | 'admin' | 'admin-login' | 'kasir' | 'kasir-mobile' | 'kiosk' | 'kds'; id?: string; redirectTab?: string }) => void;
}

export default function LandingHub({ booths, eventSetting, onNavigate }: LandingHubProps) {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else {
      alert("Browser Anda tidak mendukung instalasi otomatis, atau aplikasi ini sudah terinstal.\n\n[iOS / Safari]: Ketuk tombol 'Share' (Bagikan) lalu pilih 'Add to Home Screen'.\n[Chrome / Android]: Buka menu titik tiga (Opsi) lalu pilih 'Install App' atau 'Add to Home Screen'.");
    }
  };

  // Map booth code to a representative icon or illustration
  const getBoothIcon = (kode: string) => {
    switch (kode.toUpperCase()) {
      case 'B01':
      case 'A01': return <Utensils className="h-6 w-6 text-red-500" />;
      case 'B02':
      case 'A03': return <ChefHat className="h-6 w-6 text-orange-500" />;
      case 'B03':
      case 'A04': return <Leaf className="h-6 w-6 text-green-500" />;
      case 'B04':
      case 'A05': return <Store className="h-6 w-6 text-amber-500" />;
      case 'B05':
      case 'A08': return <Utensils className="h-6 w-6 text-rose-600" />;
      case 'B06':
      case 'A09': return <ChefHat className="h-6 w-6 text-blue-500" />;
      case 'B07':
      case 'A10': return <Coffee className="h-6 w-6 text-sky-500" />;
      default: return <Store className="h-6 w-6 text-gray-500" />;
    }
  };

  const eventName = eventSetting?.nama_event?.trim() || 'Point of Sale';
  const eventDate = eventSetting?.tanggal_event?.trim() || '-';
  const eventLocation = eventSetting?.area_lokasi?.trim() || '-';
  const eventConnectivity = eventSetting?.konektivitas?.trim() || 'POS Network';
  const eventMerchant = eventSetting?.client_merchant?.trim() || 'Festival Partner';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 py-12 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-white font-black px-3 py-1 rounded shadow-sm text-xs tracking-wider">
                  POS SYSTEM
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight mt-2 text-slate-800">{eventName}</h1>
              <p className="text-slate-500 mt-2 max-w-xl text-sm leading-relaxed">
                Sistem Kasir (POS) Terintegrasi, Mandiri (Kiosk), & Layar Dapur (KDS) untuk Event {eventMerchant}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const hasToken = typeof window !== 'undefined' && !!sessionStorage.getItem('pos_admin_token');
                  if (hasToken) {
                    onNavigate({ type: 'admin' });
                  } else {
                    onNavigate({ type: 'admin-login', redirectTab: 'dashboard' });
                  }
                }}
                id="btn-goto-admin"
                className="bg-orange-500 hover:bg-orange-600 text-white transition-all font-bold rounded-xl px-5 py-3 flex items-center gap-2 shadow-md border border-orange-500"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Admin Panel</span>
              </button>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100 text-xs md:text-sm text-slate-600">
            <div>
              <span className="block text-slate-400 font-medium text-[11px] uppercase tracking-wider">Tanggal Event</span>
              <p className="font-bold text-slate-800 mt-1">{eventDate}</p>
            </div>
            <div>
              <span className="block text-slate-400 font-medium text-[11px] uppercase tracking-wider">Area Lokasi</span>
              <p className="font-bold text-slate-800 mt-1">{eventLocation}</p>
            </div>
            <div>
              <span className="block text-slate-400 font-medium text-[11px] uppercase tracking-wider">Konektivitas</span>
              <p className="font-bold text-slate-800 mt-1">{eventConnectivity}</p>
            </div>
            <div>
              <span className="block text-slate-400 font-medium text-[11px] uppercase tracking-wider">Client / Merchant</span>
              <p className="font-bold text-slate-800 mt-1">{eventMerchant}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-10">
        {/* Roles Grid */}
        <h2 className="text-xl font-bold tracking-tight text-slate-800 mb-6">Pilih Peran Kerja per Booth</h2>

        <div>
          {/* Quick Kasir Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Booth Operator Terminal</h3>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Akses Kasir POS, Layar Self-Service Kiosk atau Kitchen Display System (KDS) untuk masing-masing stan penjual.
              </p>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs uppercase font-semibold text-slate-400 border-b border-slate-100">
                    <th className="py-2 px-3">Booth / Stan</th>
                    <th className="py-2 px-3 text-center">POS Kasir (Kasir)</th>
                    <th className="py-2 px-3 text-center">Self-Service (Kiosk)</th>
                    <th className="py-2 px-3 text-center">Display Dapur (KDS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {booths.filter(b => b.aktif).map((booth) => (
                    <tr key={booth.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 p-2 rounded-xl shrink-0">
                            {getBoothIcon(booth.kode)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs md:text-sm font-mono mr-1">
                              [{booth.kode}]
                            </span>
                            <span className="font-semibold text-slate-700 text-xs md:text-sm">
                              {booth.nama}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <button
                            onClick={() => onNavigate({ type: 'kasir', id: booth.kode })}
                            id={`btn-kasir-${booth.kode}`}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 font-medium text-xs rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1 w-full justify-center"
                          >
                            <Utensils className="h-3 w-3" />
                            <span>Kasir POS</span>
                          </button>
                          <button
                            onClick={() => onNavigate({ type: 'kasir-mobile', id: booth.kode })}
                            id={`btn-kasir-mobile-${booth.kode}`}
                            className="bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors border border-orange-200 font-medium text-xs rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1 w-full justify-center font-bold"
                          >
                            <Smartphone className="h-3 w-3 text-orange-500" />
                            <span>Kasir HP</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {booth.kiosk ? (
                          <button
                            onClick={() => onNavigate({ type: 'kiosk', id: booth.kode })}
                            id={`btn-kiosk-${booth.kode}`}
                            className="bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200 font-medium text-xs rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1"
                          >
                            <Monitor className="h-3 w-3" />
                            <span>Kiosk</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Offline</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {booth.kds_active !== false ? (
                          <button
                            onClick={() => onNavigate({ type: 'kds', id: booth.kode })}
                            id={`btn-kds-${booth.kode}`}
                            className="bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors border border-sky-200 font-medium text-xs rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1"
                          >
                            <ChefHat className="h-3 w-3" />
                            <span>KDS Board</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">Offline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
