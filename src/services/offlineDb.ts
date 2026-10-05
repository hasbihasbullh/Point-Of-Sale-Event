/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { Table } from 'dexie';
import { Booth, MasterMenu, BoothMenu, MenuItem, Order } from '../types';

export interface OfflineOrderRecord {
  id: string;
  booth_id: string;
  synced: boolean;
  created_at: string;
  orderData: Order;
}

export class PosOfflineDatabase extends Dexie {
  booths!: Table<Booth, string>;
  masterMenus!: Table<MasterMenu, string>;
  boothMenus!: Table<BoothMenu, string>;
  menuItems!: Table<MenuItem, string>;
  offlineOrders!: Table<OfflineOrderRecord, string>;

  constructor() {
    super('PosEventOfflineDb');
    this.version(2).stores({
      booths: 'id, kode',
      masterMenus: 'id, kategori, aktif',
      boothMenus: 'id, booth_id, master_menu_id',
      menuItems: 'id, booth_id, kategori',
      offlineOrders: 'id, booth_id, synced, created_at'
    });
  }
}

export const offlineDb = new PosOfflineDatabase();

// --- HELPER FUNCTIONS FOR OFFLINE CACHING & SYNC ---

export async function convertImageUrlToBase64(url: string): Promise<string> {
  if (!url || url.startsWith('data:image/')) return url;
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return url;
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return url;
  }
}

export async function cacheMasterData(
  booths: Booth[],
  masterMenus: MasterMenu[],
  boothMenus: BoothMenu[] = [],
  resolvedMenuItems: MenuItem[] = []
) {
  try {
    // Process masterMenus & booths images to Base64 Data URIs for 100% offline rendering
    const processedMasterMenus = await Promise.all(
      masterMenus.map(async (item) => {
        if (item.foto && !item.foto.startsWith('data:image/')) {
          const base64Foto = await convertImageUrlToBase64(item.foto);
          return { ...item, foto: base64Foto };
        }
        return item;
      })
    );

    const processedBooths = await Promise.all(
      booths.map(async (booth) => {
        if (booth.qris_image_path && !booth.qris_image_path.startsWith('data:image/')) {
          const base64Qris = await convertImageUrlToBase64(booth.qris_image_path);
          return { ...booth, qris_image_path: base64Qris };
        }
        return booth;
      })
    );

    // Build resolved menu items for fast offline lookup per booth
    let processedResolved = resolvedMenuItems;
    if (!processedResolved || processedResolved.length === 0) {
      processedResolved = [];
      for (const bm of boothMenus) {
        const master = processedMasterMenus.find(m => m.id === bm.master_menu_id);
        if (master && bm.tersedia) {
          processedResolved.push({
            id: master.id,
            booth_id: bm.booth_id,
            booth_menu_id: bm.id,
            master_menu_id: master.id,
            nama: master.nama,
            harga: bm.harga || master.harga_default,
            harga_default: master.harga_default,
            kategori: master.kategori,
            foto: master.foto,
            deskripsi: master.deskripsi,
            tersedia: bm.tersedia,
            stok: bm.stok
          });
        }
      }
    }

    await offlineDb.transaction('rw', [
      offlineDb.booths,
      offlineDb.masterMenus,
      offlineDb.boothMenus,
      offlineDb.menuItems
    ], async () => {
      if (processedBooths && processedBooths.length > 0) {
        await offlineDb.booths.clear();
        await offlineDb.booths.bulkPut(processedBooths);
      }
      if (processedMasterMenus && processedMasterMenus.length > 0) {
        await offlineDb.masterMenus.clear();
        await offlineDb.masterMenus.bulkPut(processedMasterMenus);
      }
      if (boothMenus && boothMenus.length > 0) {
        await offlineDb.boothMenus.clear();
        await offlineDb.boothMenus.bulkPut(boothMenus);
      }
      if (processedResolved && processedResolved.length > 0) {
        await offlineDb.menuItems.clear();
        await offlineDb.menuItems.bulkPut(processedResolved);
      }
    });
  } catch (err) {
    console.error('Gagal memperbarui cache offline IndexedDB:', err);
  }
}

export async function getCachedBooths(): Promise<Booth[]> {
  try {
    return await offlineDb.booths.toArray();
  } catch (err) {
    return [];
  }
}

export async function getCachedMasterMenus(): Promise<MasterMenu[]> {
  try {
    return await offlineDb.masterMenus.toArray();
  } catch (err) {
    return [];
  }
}

export async function getCachedBoothMenus(boothId?: string): Promise<BoothMenu[]> {
  try {
    if (boothId) {
      return await offlineDb.boothMenus.where('booth_id').equals(boothId).toArray();
    }
    return await offlineDb.boothMenus.toArray();
  } catch (err) {
    return [];
  }
}

export async function getCachedMenuItems(boothId?: string): Promise<MenuItem[]> {
  try {
    if (boothId) {
      return await offlineDb.menuItems.where('booth_id').equals(boothId).toArray();
    }
    return await offlineDb.menuItems.toArray();
  } catch (err) {
    return [];
  }
}

export async function saveOfflineOrder(order: Order, synced: boolean = false) {
  try {
    await offlineDb.offlineOrders.put({
      id: order.id,
      booth_id: order.booth_id,
      synced,
      created_at: order.created_at,
      orderData: order
    });
  } catch (err) {
    console.error('Gagal menyimpan pesanan di IndexedDB:', err);
  }
}

export async function getNextLocalSequenceNumber(boothId: string, boothKode: string): Promise<string> {
  try {
    const todayStr = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).split(' ')[0];
    const allRecords = await offlineDb.offlineOrders.where('booth_id').equals(boothId).toArray();
    const todayOrders = allRecords.filter(r => r.created_at.startsWith(todayStr));
    const nextSeq = todayOrders.length + 1;
    const seqStr = String(nextSeq).padStart(4, '0');
    return `${boothKode}-${seqStr}`;
  } catch (err) {
    return `${boothKode}-0001`;
  }
}

export async function getPendingOrdersCount(boothId?: string): Promise<number> {
  try {
    const pending = await getPendingOrders(boothId);
    return pending.length;
  } catch (err) {
    return 0;
  }
}

export async function getPendingOrders(boothId?: string): Promise<OfflineOrderRecord[]> {
  try {
    const all = await offlineDb.offlineOrders.toArray();
    return all.filter(r => !r.synced && (!boothId || r.booth_id === boothId));
  } catch (err) {
    return [];
  }
}

export async function getOfflineOrdersHistory(boothId: string): Promise<Order[]> {
  try {
    const records = await offlineDb.offlineOrders.where('booth_id').equals(boothId).toArray();
    return records
      .map(r => r.orderData)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    return [];
  }
}

export async function syncPendingOrdersToServer(boothId?: string): Promise<{ success: boolean; syncedCount: number; message?: string }> {
  try {
    const pendingRecords = await getPendingOrders(boothId);
    if (pendingRecords.length === 0) {
      return { success: true, syncedCount: 0, message: 'Semua transaksi sudah tersinkronisasi.' };
    }

    const payloadOrders = pendingRecords.map(r => r.orderData);

    const res = await fetch('/api/orders/sync-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders: payloadOrders })
    });

    if (!res.ok) {
      throw new Error(`Server error HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.syncedOrderIds)) {
      await offlineDb.transaction('rw', offlineDb.offlineOrders, async () => {
        for (const syncedId of data.syncedOrderIds) {
          const rec = await offlineDb.offlineOrders.get(syncedId);
          if (rec) {
            rec.synced = true;
            await offlineDb.offlineOrders.put(rec);
          }
        }
      });
      return { success: true, syncedCount: data.syncedOrderIds.length };
    }
    return { success: false, syncedCount: 0, message: data.message || 'Gagal sinkronisasi data' };
  } catch (err: any) {
    console.error('Error saat melakukan sync pending orders:', err);
    return { success: false, syncedCount: 0, message: err.message || 'Server tidak dapat dijangkau (Offline)' };
  }
}
