/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { prisma } from '../config/prisma';
import { getWibTimestampString } from '../utils/time';
import { kdsEvents } from '../utils/events';

export interface ConsolidatePayload {
  booths?: any[];
  masterMenus?: any[];
  boothMenus?: any[];
  orders: any[];
}

export async function processConsolidatedOrders(payload: ConsolidatePayload) {
  const { booths = [], masterMenus = [], boothMenus = [], orders = [] } = payload;
  let addedCount = 0;
  let skippedCount = 0;
  let voidUpdatedCount = 0;
  let revenueAdded = 0;
  const boothsToNotify = new Set<string>();

  // 1. Ensure Booths exist in DB
  for (const b of booths) {
    const existingBooth = await prisma.booth.findUnique({ where: { id: b.id } });
    if (!existingBooth) {
      await prisma.booth.create({
        data: {
          id: b.id,
          kode: b.kode,
          nama: b.nama,
          aktif: b.aktif ?? true,
          kiosk: b.kiosk ?? false,
          kds_active: b.kds_active ?? true,
          qris_image_path: b.qris_image_path || null,
          kategori_list: b.kategori_list || 'Makanan,Minuman,Cemilan',
          pay_cash_active: b.pay_cash_active ?? true,
          pay_qris_active: b.pay_qris_active ?? true,
          pay_edc_active: b.pay_edc_active ?? true,
          voucher_active: b.voucher_active ?? true,
          voucher_nominal: b.voucher_nominal ?? 5000,
        },
      });
    }
  }

  // 2. Ensure MasterMenus exist in DB
  for (const m of masterMenus) {
    const existingMenu = await prisma.masterMenu.findUnique({ where: { id: m.id } });
    if (!existingMenu) {
      await prisma.masterMenu.create({
        data: {
          id: m.id,
          nama: m.nama,
          harga_default: Number(m.harga_default || m.harga || 0),
          kategori: m.kategori || 'Makanan',
          foto: m.foto || null,
          deskripsi: m.deskripsi || null,
          aktif: m.aktif ?? true,
        },
      });
    }
  }

  // 3. Ensure BoothMenus exist in DB
  for (const bm of boothMenus) {
    const existingBm = await prisma.boothMenu.findUnique({
      where: { booth_id_master_menu_id: { booth_id: bm.booth_id, master_menu_id: bm.master_menu_id } },
    });
    if (!existingBm) {
      const boothExists = await prisma.booth.findUnique({ where: { id: bm.booth_id } });
      const menuExists = await prisma.masterMenu.findUnique({ where: { id: bm.master_menu_id } });
      if (boothExists && menuExists) {
        await prisma.boothMenu.create({
          data: {
            id: bm.id || `bm_${bm.booth_id}_${bm.master_menu_id}`,
            booth_id: bm.booth_id,
            master_menu_id: bm.master_menu_id,
            harga: Number(bm.harga || menuExists.harga_default),
            stok: bm.stok !== undefined && bm.stok !== null ? Number(bm.stok) : null,
            tersedia: bm.tersedia ?? true,
            urutan: Number(bm.urutan || 0),
          },
        });
      }
    }
  }

  // 4. Process Orders & OrderItems with Idempotency
  for (const ord of orders) {
    try {
      const existing = await prisma.order.findUnique({ where: { id: ord.id } });

      if (existing) {
        if (ord.status === 'VOID' && existing.status !== 'VOID') {
          await prisma.order.update({
            where: { id: ord.id },
            data: {
              status: 'VOID',
              alasan_void: ord.alasan_void || (ord as any).alasanVoid || existing.alasan_void,
            },
          });
          voidUpdatedCount++;
          boothsToNotify.add(ord.booth_id);
        } else {
          skippedCount++;
        }
        continue;
      }

      let booth = await prisma.booth.findUnique({ where: { id: ord.booth_id } });
      if (!booth) {
        booth = await prisma.booth.create({
          data: {
            id: ord.booth_id,
            kode: ord.booth_kode || 'BTH',
            nama: ord.booth_nama || 'Booth',
            aktif: true,
          },
        });
      }

      const orderItemsToCreate = [];
      for (let idx = 0; idx < (ord.items || []).length; idx++) {
        const itm = ord.items[idx];
        const masterMenuId = itm.master_menu_id || itm.menu_item_id || `m_cons_${ord.booth_id}`;

        let dbMaster = await prisma.masterMenu.findUnique({ where: { id: masterMenuId } });
        if (!dbMaster) {
          dbMaster = await prisma.masterMenu.create({
            data: {
              id: masterMenuId,
              nama: itm.nama_item || 'Menu Item',
              harga_default: Number(itm.harga || 0),
              kategori: 'Makanan',
              aktif: true,
            },
          });
        }

        orderItemsToCreate.push({
          id: itm.id || `item_${ord.id}_${idx}`,
          master_menu_id: dbMaster.id,
          nama_item: itm.nama_item || dbMaster.nama,
          harga: Number(itm.harga),
          qty: Number(itm.qty) || 1,
          catatan: itm.catatan || null,
        });
      }

      await prisma.order.create({
        data: {
          id: ord.id,
          booth_id: booth.id,
          booth_kode: ord.booth_kode || booth.kode,
          booth_nama: ord.booth_nama || booth.nama,
          nomor_order: ord.nomor_order || `${booth.kode}-CONS`,
          sumber: ord.sumber || 'KIOSK',
          metode_bayar: ord.metode_bayar || 'QRIS',
          nama_pelanggan: ord.nama_pelanggan ? String(ord.nama_pelanggan).trim() : null,
          total: Number(ord.total) || 0,
          diskon: Number(ord.diskon) || 0,
          uang_bayar: ord.uang_bayar !== undefined && ord.uang_bayar !== null ? Number(ord.uang_bayar) : null,
          kembalian: ord.kembalian !== undefined && ord.kembalian !== null ? Number(ord.kembalian) : null,
          no_referensi: ord.no_referensi || null,
          status: ord.status || 'COMPLETED',
          alasan_void: ord.alasan_void || (ord as any).alasanVoid || null,
          created_at: ord.created_at || getWibTimestampString(),
          items: {
            create: orderItemsToCreate,
          },
        },
      });

      addedCount++;
      if (ord.status !== 'VOID') {
        revenueAdded += Number(ord.total) || 0;
      }
      boothsToNotify.add(booth.id);
    } catch (orderErr) {
      console.error(`Gagal menggabungkan order ${ord.id}:`, orderErr);
    }
  }

  boothsToNotify.forEach((bId) => kdsEvents.emit('kds_update', bId));
  kdsEvents.emit('sys_update');

  return {
    addedCount,
    skippedCount,
    voidUpdatedCount,
    revenueAdded,
    totalProcessed: orders.length,
  };
}
