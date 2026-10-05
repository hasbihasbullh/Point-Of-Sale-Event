/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { prisma } from '../config/prisma';
import { getWibDateString, getWibTimestampString } from '../utils/time';
import { kdsEvents } from '../utils/events';

export interface CreateOrderPayload {
  booth_id: string;
  sumber?: string;
  metode_bayar?: string;
  total?: number;
  diskon?: number;
  items: Array<{
    master_menu_id?: string;
    menu_item_id?: string;
    nama_item?: string;
    harga?: number;
    qty: number | string;
    catatan?: string | null;
    kds_display?: boolean | null;
  }>;
  uang_bayar?: number | null;
  kembalian?: number | null;
  no_referensi?: string | null;
  nama_pelanggan?: string | null;
}

export async function createOrderService(payload: CreateOrderPayload) {
  const {
    booth_id,
    sumber,
    metode_bayar,
    diskon,
    items,
    uang_bayar,
    kembalian,
    no_referensi,
    nama_pelanggan,
  } = payload;

  if (!booth_id || !Array.isArray(items) || items.length === 0) {
    throw new Error('Data pesanan tidak valid atau daftar menu kosong');
  }

  const booth = await prisma.booth.findUnique({ where: { id: booth_id } });
  if (!booth) {
    throw new Error('Booth tidak ditemukan');
  }

  // Generate sequence number for today
  const todayString = getWibDateString();
  const sequenceId = `seq_${booth_id}_${todayString}`;

  const newOrder = await prisma.$transaction(async (tx) => {
    const seq = await tx.sequence.upsert({
      where: { id: sequenceId },
      update: { value: { increment: 1 } },
      create: { id: sequenceId, value: 1 },
    });

    const seqStr = String(seq.value).padStart(4, '0');
    const transactionOrderNo = `${booth.kode}-${seqStr}`;
    const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const orderItemsToCreate: any[] = [];
    let calculatedSubtotal = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const i = items[idx];
      const masterMenuId = i.master_menu_id || i.menu_item_id;
      const qty = Math.max(1, parseInt(String(i.qty), 10) || 1);

      // Check BoothMenu & MasterMenu from Database
      const boothMenu: any = await tx.boothMenu.findUnique({
        where: {
          booth_id_master_menu_id: {
            booth_id,
            master_menu_id: masterMenuId!,
          },
        },
        include: { masterMenu: true },
      });

      let officialPrice = 0;
      let itemName = i.nama_item || 'Item Menu';
      let itemKdsDisplay = true;

      if (boothMenu && boothMenu.masterMenu) {
        itemName = boothMenu.masterMenu.nama;
        officialPrice =
          boothMenu.harga !== undefined && boothMenu.harga !== null
            ? Number(boothMenu.harga)
            : Number(boothMenu.masterMenu.harga_default);

        itemKdsDisplay =
          i.kds_display !== undefined && i.kds_display !== null
            ? Boolean(i.kds_display)
            : boothMenu.kds_display !== null && boothMenu.kds_display !== undefined
            ? Boolean(boothMenu.kds_display)
            : boothMenu.masterMenu.kds_display !== undefined
            ? Boolean(boothMenu.masterMenu.kds_display)
            : true;

        // Check and decrement stock in BoothMenu if limited
        if (boothMenu.stok !== null && boothMenu.stok !== undefined) {
          if (boothMenu.stok < qty) {
            throw new Error(`Stok menu "${boothMenu.masterMenu.nama}" tidak mencukupi! Tersisa: ${boothMenu.stok}`);
          }

          const updatedCount = await tx.boothMenu.updateMany({
            where: {
              booth_id,
              master_menu_id: masterMenuId!,
              stok: { gte: qty },
            },
            data: {
              stok: { decrement: qty },
            },
          });

          if (updatedCount.count === 0) {
            throw new Error(`Stok menu "${boothMenu.masterMenu.nama}" telah habis/berubah! Silakan coba lagi.`);
          }

          // If stock hits 0, auto set tersedia to false for this booth
          const checkBoothMenu = await tx.boothMenu.findUnique({
            where: { booth_id_master_menu_id: { booth_id, master_menu_id: masterMenuId! } },
          });
          if (checkBoothMenu && checkBoothMenu.stok === 0) {
            await tx.boothMenu.update({
              where: { booth_id_master_menu_id: { booth_id, master_menu_id: masterMenuId! } },
              data: { tersedia: false },
            });
          }
        }
      } else {
        // Fallback to MasterMenu direct lookup
        const master = await tx.masterMenu.findUnique({ where: { id: masterMenuId! } });
        if (master) {
          itemName = master.nama;
          officialPrice = Number(master.harga_default);
          itemKdsDisplay = master.kds_display !== undefined ? Boolean(master.kds_display) : true;
        } else {
          officialPrice = Math.max(0, Number(i.harga) || 0);
        }
      }

      calculatedSubtotal += officialPrice * qty;

      orderItemsToCreate.push({
        id: `item_${orderId}_${idx}`,
        master_menu_id: masterMenuId,
        nama_item: itemName,
        harga: officialPrice,
        qty: qty,
        catatan: i.catatan ? String(i.catatan).slice(0, 255) : null,
        kds_display: itemKdsDisplay,
      });
    }

    const discountInput = Math.max(0, Number(diskon) || 0);
    const finalCalculatedTotal = Math.max(0, calculatedSubtotal - discountInput);
    const hasKdsItems = orderItemsToCreate.some((it) => it.kds_display !== false);

    return await tx.order.create({
      data: {
        id: orderId,
        booth_id: booth.id,
        booth_kode: booth.kode,
        booth_nama: booth.nama,
        nomor_order: transactionOrderNo,
        sumber: sumber || 'KASIR',
        metode_bayar: metode_bayar || 'CASH',
        nama_pelanggan: nama_pelanggan ? String(nama_pelanggan).trim().slice(0, 100) : null,
        total: finalCalculatedTotal,
        diskon: discountInput,
        uang_bayar: uang_bayar !== undefined && uang_bayar !== null ? Math.max(0, Number(uang_bayar)) : null,
        kembalian: kembalian !== undefined && kembalian !== null ? Math.max(0, Number(kembalian)) : null,
        no_referensi: no_referensi ? String(no_referensi).trim().slice(0, 100) : null,
        status: booth.kds_active && hasKdsItems ? 'BARU' : 'SELESAI',
        created_at: getWibTimestampString(),
        items: {
          create: orderItemsToCreate,
        },
      },
      include: { items: true },
    });
  });

  // Notify KDS only if order has KDS items
  if (booth.kds_active && newOrder.items.some((it: any) => it.kds_display !== false)) {
    kdsEvents.emit('kds_update', booth.id);
  }
  kdsEvents.emit('sys_update');

  return newOrder;
}

export async function syncBatchOrdersService(orders: any[]) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return { success: true, syncedOrderIds: [], count: 0, message: 'Tidak ada order untuk disinkronkan' };
  }

  const syncedOrderIds: string[] = [];
  const boothsToNotify = new Set<string>();

  for (const rawOrder of orders) {
    try {
      const {
        id: localOrderId,
        booth_id,
        sumber = 'KASIR_MOBILE',
        metode_bayar,
        total,
        diskon = 0,
        items,
        uang_bayar,
        kembalian,
        no_referensi,
        nama_pelanggan,
        created_at: offlineCreatedAt,
      } = rawOrder;

      const booth = await prisma.booth.findUnique({ where: { id: booth_id } });
      if (!booth) continue;

      // Check if order already exists in DB (avoid duplicate sync or apply VOID update)
      const existing = await prisma.order.findUnique({ where: { id: localOrderId } });
      if (existing) {
        // If the mobile app voided this existing order while offline:
        if (rawOrder.status === 'VOID' && existing.status !== 'VOID') {
          await prisma.$transaction(async (tx) => {
            const existingItems = await tx.orderItem.findMany({ where: { order_id: localOrderId } });
            for (const item of existingItems) {
              if (item.master_menu_id) {
                const bm = await tx.boothMenu.findUnique({
                  where: { booth_id_master_menu_id: { booth_id, master_menu_id: item.master_menu_id } },
                });
                if (bm && bm.stok !== null && bm.stok !== undefined) {
                  await tx.boothMenu.update({
                    where: { booth_id_master_menu_id: { booth_id, master_menu_id: item.master_menu_id } },
                    data: { stok: bm.stok + item.qty, tersedia: true },
                  });
                }
              }
            }
            await tx.order.update({
              where: { id: localOrderId },
              data: { status: 'VOID', alasan_void: rawOrder.alasan_void || 'Dibatalkan Offline' },
            });
          });
          boothsToNotify.add(booth.id);
        }
        syncedOrderIds.push(localOrderId);
        continue;
      }

      const isOrderVoid = rawOrder.status === 'VOID';
      const todayString = getWibDateString();
      const sequenceId = `seq_${booth_id}_${todayString}`;

      await prisma.$transaction(async (tx) => {
        let transactionOrderNo = rawOrder.nomor_order;
        if (!transactionOrderNo) {
          const seq = await tx.sequence.upsert({
            where: { id: sequenceId },
            update: { value: { increment: 1 } },
            create: { id: sequenceId, value: 1 },
          });
          const seqStr = String(seq.value).padStart(4, '0');
          transactionOrderNo = `${booth.kode}-${seqStr}`;
        }

        const orderItemsToCreate: any[] = [];
        if (Array.isArray(items)) {
          for (let idx = 0; idx < items.length; idx++) {
            const i = items[idx];
            const masterMenuId = i.master_menu_id || i.menu_item_id;

            // Decrement stock only if order is not voided
            if (!isOrderVoid && masterMenuId) {
              const boothMenu = await tx.boothMenu.findUnique({
                where: { booth_id_master_menu_id: { booth_id, master_menu_id: masterMenuId } },
              });
              if (boothMenu && boothMenu.stok !== null && boothMenu.stok !== undefined) {
                const newStock = Math.max(0, boothMenu.stok - Number(i.qty));
                await tx.boothMenu.update({
                  where: { booth_id_master_menu_id: { booth_id, master_menu_id: masterMenuId } },
                  data: {
                    stok: newStock,
                    tersedia: newStock > 0,
                  },
                });
              }
            }

            orderItemsToCreate.push({
              id: i.id || `item_${localOrderId}_${idx}`,
              master_menu_id: masterMenuId || null,
              nama_item: i.nama_item || 'Item Menu',
              harga: Number(i.harga) || 0,
              qty: Number(i.qty) || 1,
              catatan: i.catatan || null,
              kds_display: i.kds_display !== undefined ? Boolean(i.kds_display) : true,
            });
          }
        }

        await tx.order.create({
          data: {
            id: localOrderId,
            booth_id: booth.id,
            booth_kode: booth.kode,
            booth_nama: booth.nama,
            nomor_order: transactionOrderNo,
            sumber: sumber,
            metode_bayar: metode_bayar || 'CASH',
            nama_pelanggan: nama_pelanggan ? String(nama_pelanggan).trim() : null,
            total: Number(total) || 0,
            diskon: Number(diskon) || 0,
            uang_bayar: uang_bayar !== undefined ? Number(uang_bayar) : null,
            kembalian: kembalian !== undefined ? Number(kembalian) : null,
            no_referensi: no_referensi || null,
            status: isOrderVoid ? 'VOID' : booth.kds_active ? 'BARU' : 'SELESAI',
            alasan_void: isOrderVoid ? rawOrder.alasan_void || 'Dibatalkan Offline' : null,
            created_at: offlineCreatedAt || getWibTimestampString(),
            items: {
              create: orderItemsToCreate,
            },
          },
        });
      });

      syncedOrderIds.push(localOrderId);
      boothsToNotify.add(booth.id);
    } catch (singleOrderErr) {
      console.error(`Gagal sinkronisasi order ${rawOrder?.id}:`, singleOrderErr);
    }
  }

  boothsToNotify.forEach((bId) => kdsEvents.emit('kds_update', bId));
  kdsEvents.emit('sys_update');

  return {
    success: true,
    syncedOrderIds,
    count: syncedOrderIds.length,
    message: `Berhasil menyinkronkan ${syncedOrderIds.length} transaksi offline`,
  };
}

export async function voidOrderService(orderId: string, alasanVoid?: string | null) {
  const voidedOrder = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new Error('Order tidak ditemukan');
    if (order.status === 'VOID') throw new Error('Order ini sudah dibatalkan sebelumnya');

    // Restore stok ke BoothMenu
    for (const item of order.items) {
      if (item.master_menu_id) {
        const bm = await tx.boothMenu.findUnique({
          where: {
            booth_id_master_menu_id: {
              booth_id: order.booth_id,
              master_menu_id: item.master_menu_id,
            },
          },
        });
        if (bm && bm.stok !== null && bm.stok !== undefined) {
          const newStock = bm.stok + item.qty;
          await tx.boothMenu.update({
            where: {
              booth_id_master_menu_id: {
                booth_id: order.booth_id,
                master_menu_id: item.master_menu_id,
              },
            },
            data: { stok: newStock, tersedia: true },
          });
        }
      }
    }

    // Update status to VOID with alasan_void
    return await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'VOID',
        alasan_void: alasanVoid ? String(alasanVoid).trim() : null,
      },
    });
  });

  kdsEvents.emit('kds_update', voidedOrder.booth_id);
  kdsEvents.emit('sys_update');

  return voidedOrder;
}

export async function updateOrderStatusService(orderId: string, status: string) {
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  kdsEvents.emit('kds_update', updatedOrder.booth_id);
  kdsEvents.emit('sys_update');

  return updatedOrder;
}
