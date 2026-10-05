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

// API 3: Get All Master Menus
router.get('/', async (req, res) => {
  try {
    const menus = await prisma.masterMenu.findMany({
      orderBy: [{ kategori: 'asc' }, { nama: 'asc' }],
    });
    res.json(menus);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 4: Create Master Menu
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { id, nama, harga_default, kategori, foto, deskripsi, kds_display, aktif } = req.body;
    const menuId = id || `m_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newMenu = await prisma.masterMenu.create({
      data: {
        id: menuId,
        nama,
        harga_default: Number(harga_default) || 0,
        kategori: kategori || 'Makanan',
        foto: foto || null,
        deskripsi: deskripsi || null,
        kds_display: kds_display !== undefined ? Boolean(kds_display) : true,
        aktif: aktif !== undefined ? Boolean(aktif) : true,
      },
    });

    // Auto-assign menu baru ke semua stan yang aktif
    const activeBooths = await prisma.booth.findMany({ where: { aktif: true } });
    if (activeBooths.length > 0) {
      await prisma.$transaction(
        activeBooths.map((b) =>
          prisma.boothMenu.upsert({
            where: { booth_id_master_menu_id: { booth_id: b.id, master_menu_id: newMenu.id } },
            update: {},
            create: {
              id: `bm_${b.id}_${newMenu.id}`,
              booth_id: b.id,
              master_menu_id: newMenu.id,
              harga: newMenu.harga_default,
              tersedia: true,
              urutan: 0,
            },
          })
        )
      );
    }

    kdsEvents.emit('sys_update');
    res.status(201).json(newMenu);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 5: Update Master Menu
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, harga_default, kategori, foto, deskripsi, kds_display, aktif } = req.body;

    const existingMenu = await prisma.masterMenu.findUnique({ where: { id } });
    if (!existingMenu) {
      return res.status(404).json({ error: 'Master Menu tidak ditemukan' });
    }

    if (foto && existingMenu.foto && foto !== existingMenu.foto) {
      deleteLocalImage(existingMenu.foto);
    }

    const updated = await prisma.masterMenu.update({
      where: { id },
      data: {
        nama: nama !== undefined ? nama : existingMenu.nama,
        harga_default: harga_default !== undefined ? Number(harga_default) : existingMenu.harga_default,
        kategori: kategori !== undefined ? kategori : existingMenu.kategori,
        foto: foto !== undefined ? foto : existingMenu.foto,
        deskripsi: deskripsi !== undefined ? deskripsi : existingMenu.deskripsi,
        kds_display: kds_display !== undefined ? Boolean(kds_display) : existingMenu.kds_display,
        aktif: aktif !== undefined ? Boolean(aktif) : existingMenu.aktif,
      },
    });

    kdsEvents.emit('sys_update');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 6: Delete Master Menu
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const existingMenu = await prisma.masterMenu.findUnique({ where: { id } });
    if (!existingMenu) {
      return res.status(404).json({ error: 'Master menu tidak ditemukan' });
    }

    deleteLocalImage(existingMenu.foto);

    await prisma.$transaction([
      prisma.boothMenu.deleteMany({ where: { master_menu_id: id } }),
      prisma.masterMenu.delete({ where: { id } }),
    ]);

    kdsEvents.emit('sys_update');
    res.json({ success: true, message: 'Master Menu dan relasi booth berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
