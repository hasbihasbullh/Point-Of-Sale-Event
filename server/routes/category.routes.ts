/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { kdsEvents } from '../utils/events';

const router = Router();

// API 2.5: Get All Master Categories
router.get('/', async (req, res) => {
  try {
    let categories = await prisma.category.findMany({
      orderBy: [{ urutan: 'asc' }, { created_at: 'asc' }],
    });

    if (categories.length === 0) {
      const defaultCategories = [
        { nama: 'Makanan', urutan: 1, warna: 'orange', ikon: 'UtensilsCrossed' },
        { nama: 'Minuman', urutan: 2, warna: 'sky', ikon: 'Coffee' },
        { nama: 'Cemilan', urutan: 3, warna: 'amber', ikon: 'Cookie' },
        { nama: 'Paket Hemat', urutan: 4, warna: 'emerald', ikon: 'Sparkles' },
      ];

      for (const cat of defaultCategories) {
        await prisma.category.upsert({
          where: { nama: cat.nama },
          update: {},
          create: {
            nama: cat.nama,
            urutan: cat.urutan,
            warna: cat.warna,
            ikon: cat.ikon,
            aktif: true,
          },
        });
      }

      categories = await prisma.category.findMany({
        orderBy: [{ urutan: 'asc' }, { created_at: 'asc' }],
      });
    }

    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 2.6: Create Master Category
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { nama, urutan, warna, ikon, aktif } = req.body;
    const cleanName = (nama || '').trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Nama kategori wajib diisi' });
    }

    const existing = await prisma.category.findUnique({ where: { nama: cleanName } });
    if (existing) {
      return res.status(400).json({ error: 'Nama kategori sudah digunakan' });
    }

    const maxUrutan = await prisma.category.aggregate({ _max: { urutan: true } });
    const nextUrutan = urutan !== undefined ? Number(urutan) : (maxUrutan._max.urutan || 0) + 1;

    const category = await prisma.category.create({
      data: {
        nama: cleanName,
        urutan: nextUrutan,
        warna: warna || 'slate',
        ikon: ikon || 'Tag',
        aktif: aktif !== undefined ? Boolean(aktif) : true,
      },
    });

    kdsEvents.emit('sys_update');
    res.status(201).json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 2.7: Update Master Category
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, urutan, warna, ikon, aktif } = req.body;

    const currentCat = await prisma.category.findUnique({ where: { id } });
    if (!currentCat) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    const cleanName = typeof nama === 'string' ? nama.trim() : currentCat.nama;
    if (cleanName !== currentCat.nama) {
      const existing = await prisma.category.findUnique({ where: { nama: cleanName } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: 'Nama kategori sudah digunakan oleh kategori lain' });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        nama: cleanName,
        urutan: urutan !== undefined ? Number(urutan) : currentCat.urutan,
        warna: warna !== undefined ? warna : currentCat.warna,
        ikon: ikon !== undefined ? ikon : currentCat.ikon,
        aktif: aktif !== undefined ? Boolean(aktif) : currentCat.aktif,
      },
    });

    if (cleanName !== currentCat.nama) {
      await prisma.masterMenu.updateMany({
        where: { kategori: currentCat.nama },
        data: { kategori: cleanName },
      });
    }

    kdsEvents.emit('sys_update');
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 2.8: Delete Master Category
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    }

    const linkedMenusCount = await prisma.masterMenu.count({
      where: { kategori: category.nama },
    });

    if (linkedMenusCount > 0) {
      return res.status(400).json({
        error: `Kategori "${category.nama}" tidak dapat dihapus karena masih digunakan oleh ${linkedMenusCount} menu.`,
      });
    }

    await prisma.category.delete({ where: { id } });
    kdsEvents.emit('sys_update');
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 2.9: Reorder Categories
router.post('/reorder', authenticateJWT, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Format data urutan tidak valid' });
    }

    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.category.update({
          where: { id },
          data: { urutan: index + 1 },
        })
      )
    );

    kdsEvents.emit('sys_update');
    res.json({ success: true, message: 'Urutan kategori berhasil disimpan' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
