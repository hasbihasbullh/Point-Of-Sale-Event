/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { deleteLocalImage } from '../utils/image';
import { kdsEvents } from '../utils/events';

const router = Router();

// API 1.3: Get orders for a specific booth (supports optional ?date=YYYY-MM-DD)
router.get('/:booth_id/orders', async (req, res) => {
  try {
    const { booth_id } = req.params;
    const { date } = req.query;

    let targetBoothId = booth_id;
    const foundBooth = await prisma.booth.findFirst({
      where: {
        OR: [{ id: booth_id }, { kode: booth_id }],
      },
    });
    if (foundBooth) {
      targetBoothId = foundBooth.id;
    }

    const whereClause: any = { booth_id: targetBoothId };
    if (date && typeof date === 'string' && date.trim().length > 0 && date !== 'all' && date !== 'undefined' && date !== 'null') {
      whereClause.created_at = { startsWith: date.trim() };
    }
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
    const mappedOrders = orders.map((ord) => ({
      ...ord,
      items: (ord.items || []).map((it) => ({
        ...it,
        menu_item_id: it.master_menu_id || it.id,
      })),
    }));
    res.json(mappedOrders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 7: Get Booth's specific menu configuration
router.get('/:booth_id/menus', async (req, res) => {
  try {
    const { booth_id } = req.params;
    const boothMenus = await prisma.boothMenu.findMany({
      where: { booth_id },
      include: { masterMenu: true },
      orderBy: { urutan: 'asc' },
    });
    res.json(boothMenus);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 7.1: Batch Assign / Update Menus to a Booth
router.post('/:booth_id/assign-menus', authenticateJWT, async (req, res) => {
  try {
    const { booth_id } = req.params;
    const { assignments, menuAssignments, masterMenuIds } = req.body;

    const booth = await prisma.booth.findUnique({ where: { id: booth_id } });
    if (!booth) {
      return res.status(404).json({ error: 'Booth tidak ditemukan' });
    }

    let assignmentsToProcess: Array<{
      master_menu_id: string;
      harga?: number;
      stok?: number | null;
      tersedia?: boolean;
      urutan?: number;
      kds_display?: boolean | null;
    }> = [];

    if (Array.isArray(assignments)) {
      assignmentsToProcess = assignments;
    } else if (Array.isArray(menuAssignments)) {
      assignmentsToProcess = menuAssignments;
    } else if (Array.isArray(masterMenuIds)) {
      assignmentsToProcess = masterMenuIds.map((mId: string, idx: number) => ({
        master_menu_id: mId,
        urutan: idx,
      }));
    } else {
      return res.status(400).json({ error: 'Payload tidak valid: kirim menuAssignments atau masterMenuIds' });
    }

    const selectedMasterIds = new Set(assignmentsToProcess.map((a) => a.master_menu_id));

    await prisma.$transaction(async (tx) => {
      // 1. Hapus assignment yang tidak dicentang lagi
      await tx.boothMenu.deleteMany({
        where: {
          booth_id,
          master_menu_id: { notIn: Array.from(selectedMasterIds) },
        },
      });

      // 2. Upsert assignment yang dicentang
      for (let idx = 0; idx < assignmentsToProcess.length; idx++) {
        const item = assignmentsToProcess[idx];
        const master = await tx.masterMenu.findUnique({ where: { id: item.master_menu_id } });
        if (!master) continue;

        const existingBoothMenu = await tx.boothMenu.findUnique({
          where: {
            booth_id_master_menu_id: {
              booth_id,
              master_menu_id: item.master_menu_id,
            },
          },
        });

        const effectivePrice =
          item.harga !== undefined && item.harga !== null
            ? Number(item.harga)
            : existingBoothMenu?.harga ?? master.harga_default;
        const effectiveStock =
          item.stok !== undefined
            ? item.stok === null || String(item.stok).trim() === ''
              ? null
              : Number(item.stok)
            : existingBoothMenu?.stok ?? null;
        const effectiveTersedia =
          item.tersedia !== undefined ? Boolean(item.tersedia) : existingBoothMenu?.tersedia ?? true;
        const effectiveUrutan =
          item.urutan !== undefined ? Number(item.urutan) : existingBoothMenu?.urutan ?? idx;
        const effectiveKds =
          item.kds_display !== undefined && item.kds_display !== null
            ? Boolean(item.kds_display)
            : existingBoothMenu?.kds_display ?? null;

        await tx.boothMenu.upsert({
          where: {
            booth_id_master_menu_id: {
              booth_id,
              master_menu_id: item.master_menu_id,
            },
          },
          update: {
            harga: effectivePrice,
            stok: effectiveStock,
            tersedia: effectiveTersedia,
            urutan: effectiveUrutan,
            kds_display: effectiveKds,
          },
          create: {
            id: `bm_${booth_id}_${item.master_menu_id}`,
            booth_id,
            master_menu_id: item.master_menu_id,
            harga: effectivePrice,
            stok: effectiveStock,
            tersedia: effectiveTersedia,
            urutan: effectiveUrutan,
            kds_display: effectiveKds,
          },
        });
      }
    });

    kdsEvents.emit('sys_update');
    res.json({ success: true, message: `Menu untuk stan ${booth.nama} berhasil diperbarui` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 7.2: Update Single Booth Menu
router.put('/:booth_id/menus/:master_menu_id', authenticateJWT, async (req, res) => {
  try {
    const { booth_id, master_menu_id } = req.params;
    const { harga, stok, tersedia, kds_display, urutan } = req.body;

    const updated = await prisma.boothMenu.update({
      where: {
        booth_id_master_menu_id: { booth_id, master_menu_id },
      },
      data: {
        harga: harga !== undefined ? Number(harga) : undefined,
        stok: stok !== undefined ? (stok === null ? null : Number(stok)) : undefined,
        tersedia: tersedia !== undefined ? Boolean(tersedia) : undefined,
        kds_display: kds_display !== undefined ? (kds_display === null ? null : Boolean(kds_display)) : undefined,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
      },
    });

    kdsEvents.emit('sys_update');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 7.3: Remove Single Menu from Booth
router.delete('/:booth_id/menus/:master_menu_id', authenticateJWT, async (req, res) => {
  try {
    const { booth_id, master_menu_id } = req.params;
    await prisma.boothMenu.delete({
      where: {
        booth_id_master_menu_id: { booth_id, master_menu_id },
      },
    });

    kdsEvents.emit('sys_update');
    res.json({ success: true, message: 'Menu berhasil dihapus dari booth' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 7.4: Create Booth
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const {
      kode,
      nama,
      aktif,
      kiosk,
      kds_active,
      qris_image_path,
      kategori_list,
      pay_cash_active,
      pay_qris_active,
      pay_edc_active,
      voucher_active,
      voucher_nominal,
    } = req.body;

    const boothId = `b_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newBooth = await prisma.booth.create({
      data: {
        id: boothId,
        kode: (kode || '').trim().toUpperCase(),
        nama: (nama || '').trim(),
        aktif: aktif !== undefined ? Boolean(aktif) : true,
        kiosk: kiosk !== undefined ? Boolean(kiosk) : false,
        kds_active: kds_active !== undefined ? Boolean(kds_active) : true,
        qris_image_path: qris_image_path || null,
        kategori_list: kategori_list || 'Makanan,Minuman,Cemilan',
        pay_cash_active: pay_cash_active !== undefined ? Boolean(pay_cash_active) : true,
        pay_qris_active: pay_qris_active !== undefined ? Boolean(pay_qris_active) : true,
        pay_edc_active: pay_edc_active !== undefined ? Boolean(pay_edc_active) : true,
        voucher_active: voucher_active !== undefined ? Boolean(voucher_active) : true,
        voucher_nominal: voucher_nominal !== undefined ? Number(voucher_nominal) : 5000,
      },
    });

    // Auto assign all active master menus
    const activeMasterMenus = await prisma.masterMenu.findMany({ where: { aktif: true } });
    if (activeMasterMenus.length > 0) {
      await prisma.$transaction(
        activeMasterMenus.map((m) =>
          prisma.boothMenu.create({
            data: {
              id: `bm_${newBooth.id}_${m.id}`,
              booth_id: newBooth.id,
              master_menu_id: m.id,
              harga: m.harga_default,
              tersedia: true,
              urutan: 0,
            },
          })
        )
      );
    }

    kdsEvents.emit('sys_update');
    res.status(201).json(newBooth);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 7.5: Update Booth
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kode,
      nama,
      aktif,
      kiosk,
      kds_active,
      qris_image_path,
      kategori_list,
      pay_cash_active,
      pay_qris_active,
      pay_edc_active,
      voucher_active,
      voucher_nominal,
    } = req.body;

    const existingBooth = await prisma.booth.findUnique({ where: { id } });
    if (!existingBooth) {
      return res.status(404).json({ error: 'Booth tidak ditemukan' });
    }

    if (qris_image_path && existingBooth.qris_image_path && qris_image_path !== existingBooth.qris_image_path) {
      deleteLocalImage(existingBooth.qris_image_path);
    }

    const updated = await prisma.booth.update({
      where: { id },
      data: {
        kode: kode !== undefined ? kode.trim().toUpperCase() : existingBooth.kode,
        nama: nama !== undefined ? nama.trim() : existingBooth.nama,
        aktif: aktif !== undefined ? Boolean(aktif) : existingBooth.aktif,
        kiosk: kiosk !== undefined ? Boolean(kiosk) : existingBooth.kiosk,
        kds_active: kds_active !== undefined ? Boolean(kds_active) : existingBooth.kds_active,
        qris_image_path: qris_image_path !== undefined ? qris_image_path : existingBooth.qris_image_path,
        kategori_list: kategori_list !== undefined ? kategori_list : existingBooth.kategori_list,
        pay_cash_active: pay_cash_active !== undefined ? Boolean(pay_cash_active) : existingBooth.pay_cash_active,
        pay_qris_active: pay_qris_active !== undefined ? Boolean(pay_qris_active) : existingBooth.pay_qris_active,
        pay_edc_active: pay_edc_active !== undefined ? Boolean(pay_edc_active) : existingBooth.pay_edc_active,
        voucher_active: voucher_active !== undefined ? Boolean(voucher_active) : existingBooth.voucher_active,
        voucher_nominal: voucher_nominal !== undefined ? Number(voucher_nominal) : existingBooth.voucher_nominal,
      },
    });

    kdsEvents.emit('sys_update');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 7.6: Delete Booth
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const existingBooth = await prisma.booth.findUnique({ where: { id } });
    if (!existingBooth) {
      return res.status(404).json({ error: 'Booth tidak ditemukan' });
    }
    deleteLocalImage(existingBooth.qris_image_path);

    // Hapus booth beserta relasi BoothMenu dan Orders
    await prisma.$transaction([
      prisma.boothMenu.deleteMany({ where: { booth_id: id } }),
      prisma.orderItem.deleteMany({ where: { order: { booth_id: id } } }),
      prisma.order.deleteMany({ where: { booth_id: id } }),
      prisma.booth.delete({ where: { id } }),
    ]);

    kdsEvents.emit('sys_update');
    res.json({ success: true, message: 'Booth dan seluruh relasi stan berhasil dihapus. Master Menu tetap aman.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
