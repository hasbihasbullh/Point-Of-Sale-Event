/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Booth, MasterMenu, BoothMenu, MenuItem, EventSetting } from './types';
import LandingHub from './components/LandingHub';
import AdminPanel from './components/AdminPanel';
import AdminLoginPage from './components/AdminLoginPage';
import KasirPanel from './components/KasirPanel';
import KasirMobilePanel from './components/KasirMobilePanel';
import KioskPanel from './components/KioskPanel';
import KdsPanel from './components/KdsPanel';
import { cacheMasterData } from './services/offlineDb';

interface ActiveRoute {
  type: 'hub' | 'admin' | 'admin-login' | 'kasir' | 'kasir-mobile' | 'kiosk' | 'kds';
  id?: string; // booth code like 'B01', 'B02'
  subTab?: string; // 'dashboard' | 'master-menu' | 'booth' | 'transactions' | 'events' | 'consolidation'
  redirectTab?: string;
}

export default function App() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [masterMenus, setMasterMenus] = useState<MasterMenu[]>([]);
  const [boothMenus, setBoothMenus] = useState<BoothMenu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [eventSetting, setEventSetting] = useState<EventSetting>({
    id: 'default',
    nama_event: '',
    tanggal_event: '',
    area_lokasi: '',
    konektivitas: 'Starlink POS Lokal',
    client_merchant: '',
    footer_struk: 'Terima kasih atas pesanan Anda!\nSimpan struk ini sebagai bukti.',
    kiosk_banner: ''
  });

  const [initialLoading, setInitialLoading] = useState(true);

  // Router route state synchronizing with URL hashes
  const [route, setRoute] = useState<ActiveRoute>(() => {
    return parseHashToRoute();
  });

  // Sync document title dynamically
  useEffect(() => {
    if (eventSetting?.nama_event && eventSetting.nama_event.trim()) {
      document.title = `${eventSetting.nama_event} - POS Terminal`;
    } else {
      document.title = 'Point of Sale Event System';
    }
  }, [eventSetting?.nama_event]);

  // Helper to parse current hash string with Auth Route Guard
  function parseHashToRoute(): ActiveRoute {
    const hash = window.location.hash || '';
    const hasAdminToken = typeof window !== 'undefined' && !!sessionStorage.getItem('pos_admin_token');

    if (hash === '#/admin/login' || hash === '#/login') {
      return { type: 'admin-login' };
    }

    if (hash === '#/admin' || hash.startsWith('#/admin/')) {
      const sub = hash.replace('#/admin/', '').replace('#/admin', '').trim();
      const validTabs = ['dashboard', 'master-menu', 'booth', 'transactions', 'events', 'consolidation', 'profile'];
      const subTab = validTabs.includes(sub) ? sub : 'dashboard';

      // Route Guard: If not logged in, redirect to admin-login and synchronize browser hash
      if (!hasAdminToken) {
        if (window.location.hash !== '#/admin/login') {
          window.location.replace('#/admin/login');
        }
        return { type: 'admin-login', redirectTab: subTab };
      }

      return { type: 'admin', subTab };
    }

    if (hash.startsWith('#/kasir-mobile/')) {
      return { type: 'kasir-mobile', id: hash.replace('#/kasir-mobile/', '').toUpperCase() };
    }
    if (hash.startsWith('#/kasir/')) {
      return { type: 'kasir', id: hash.replace('#/kasir/', '').toUpperCase() };
    }
    if (hash.startsWith('#/kiosk/')) {
      return { type: 'kiosk', id: hash.replace('#/kiosk/', '').toUpperCase() };
    }
    if (hash.startsWith('#/kds/')) {
      return { type: 'kds', id: hash.replace('#/kds/', '').toUpperCase() };
    }
    return { type: 'hub' };
  }

  // Fetch full dataset from API (Sync DB surrogate)
  const refreshFullDataset = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const fullDB = await res.json();
        const bList: Booth[] = fullDB.booths || [];
        const mList: MasterMenu[] = fullDB.masterMenus || [];
        const bmList: BoothMenu[] = fullDB.boothMenus || [];
        const resolvedItems: MenuItem[] = fullDB.menuItems || [];

        setBooths(bList);
        setMasterMenus(mList);
        setBoothMenus(bmList);
        setMenuItems(resolvedItems);

        if (fullDB.eventSetting) {
          setEventSetting(fullDB.eventSetting);
        }

        // Cache to IndexedDB for offline capability
        cacheMasterData(bList, mList, bmList, resolvedItems);
      }
    } catch (err) {
      console.error('Gagal memuat POS data dari server lokal', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    // 1. Fetch initial POS states
    refreshFullDataset();

    // 2. Attach hashchange listener
    const handleHashChange = () => {
      setRoute(parseHashToRoute());
    };
    window.addEventListener('hashchange', handleHashChange);

    // 3. Attach SSE for realtime system updates instead of polling
    const sysEvents = new EventSource('/api/sys-stream');
    sysEvents.onmessage = () => {
      refreshFullDataset();
    };

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      sysEvents.close();
    };
  }, []);

  // Update hash when using internal navigation triggers with Synchronous Route Guard
  const navigateTo = (newRoute: ActiveRoute) => {
    if (newRoute.type === 'hub') {
      window.location.hash = '';
      setRoute(newRoute);
    } else if (newRoute.type === 'admin-login') {
      window.location.hash = '#/admin/login';
      setRoute(newRoute);
    } else if (newRoute.type === 'admin') {
      const hasAdminToken = typeof window !== 'undefined' && !!sessionStorage.getItem('pos_admin_token');
      const sub = newRoute.subTab || 'dashboard';
      if (!hasAdminToken) {
        window.location.hash = '#/admin/login';
        setRoute({ type: 'admin-login', redirectTab: sub });
        return;
      }
      window.location.hash = `#/admin/${sub}`;
      setRoute(newRoute);
    } else if (newRoute.id) {
      window.location.hash = `#/${newRoute.type}/${newRoute.id.toUpperCase()}`;
      setRoute(newRoute);
    } else {
      window.location.hash = `#/${newRoute.type}`;
      setRoute(newRoute);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans relative overflow-hidden text-slate-900">
        {/* Subtle Ambient Background Orbs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-sm w-full animate-in fade-in duration-300">
          {/* Brand Icon with Glow */}
          <div className="relative mb-5">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl blur-md opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl shadow-xl border border-white/80 bg-white flex items-center justify-center overflow-hidden p-3.5">
              <img
                src="/icon.svg"
                alt="POS System"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallback = document.createElement('div');
                    fallback.className =
                      'fallback-icon text-orange-500 flex items-center justify-center font-black text-xl tracking-wider';
                    fallback.innerText = 'POS';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
          </div>

          <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
            {eventSetting.nama_event ? eventSetting.nama_event : 'Memuat Sistem POS...'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 font-medium max-w-xs">
            {eventSetting.client_merchant
              ? `${eventSetting.client_merchant} • Menyiapkan terminal...`
              : 'Menyiapkan terminal & katalog menu...'}
          </p>

          {/* Slim Indeterminate Progress Bar */}
          <div className="w-48 h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-6 relative">
            <div className="w-full h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-sans">

      {/* RENDER ACTIVE MODULE CANVAS PAGE CODES */}
      {route.type === 'hub' && (
        <LandingHub booths={booths} onNavigate={navigateTo} eventSetting={eventSetting} />
      )}

      {route.type === 'admin-login' && (
        <AdminLoginPage
          eventSetting={eventSetting}
          onLoginSuccess={(_token) => {
            const targetSubTab = route.redirectTab || 'dashboard';
            navigateTo({ type: 'admin', subTab: targetSubTab });
          }}
          onNavigateHome={() => navigateTo({ type: 'hub' })}
        />
      )}

      {route.type === 'admin' && (
        <AdminPanel
          booths={booths}
          masterMenus={masterMenus}
          boothMenus={boothMenus}
          menuItems={menuItems}
          eventSetting={eventSetting}
          currentSubTab={route.subTab || 'dashboard'}
          onNavigateSubTab={(tab) => navigateTo({ type: 'admin', subTab: tab })}
          onRefreshData={refreshFullDataset}
          onLogout={() => {
            sessionStorage.removeItem('pos_admin_token');
            navigateTo({ type: 'admin-login' });
          }}
          onNavigateHome={() => navigateTo({ type: 'hub' })}
        />
      )}

      {route.type === 'kasir' && route.id && (
        <KasirPanel
          boothKode={route.id}
          booths={booths}
          menuItems={menuItems.filter(m => m.booth_id === (booths.find(b => b.kode.toUpperCase() === route.id?.toUpperCase())?.id))}
          eventSetting={eventSetting}
          onRefreshData={refreshFullDataset}
          onNavigateHome={() => navigateTo({ type: 'hub' })}
        />
      )}

      {route.type === 'kasir-mobile' && route.id && (
        <KasirMobilePanel
          boothKode={route.id}
          booths={booths}
          masterMenus={masterMenus}
          boothMenus={boothMenus}
          menuItems={menuItems.filter(m => m.booth_id === (booths.find(b => b.kode.toUpperCase() === route.id?.toUpperCase())?.id))}
          eventSetting={eventSetting}
          onRefreshData={refreshFullDataset}
          onNavigateHome={() => navigateTo({ type: 'hub' })}
        />
      )}

      {route.type === 'kiosk' && route.id && (
        <KioskPanel
          boothKode={route.id}
          booths={booths}
          menuItems={menuItems.filter(m => m.booth_id === (booths.find(b => b.kode.toUpperCase() === route.id?.toUpperCase())?.id))}
          eventSetting={eventSetting}
          onRefreshData={refreshFullDataset}
          onNavigateHome={() => navigateTo({ type: 'hub' })}
        />
      )}

      {route.type === 'kds' && route.id && (
        <KdsPanel
          boothKode={route.id}
          booths={booths}
          eventSetting={eventSetting}
          onRefreshData={refreshFullDataset}
          onNavigateHome={() => navigateTo({ type: 'hub' })}
        />
      )}

    </div>
  );
}

