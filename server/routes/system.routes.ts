/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';
import { optimizeAndSaveImage } from '../utils/image';
import { kdsEvents } from '../utils/events';
import { getOrCreateEventSetting, resolveMenuItemsFromBoothMenus } from '../services/systemService';

const router = Router();

// API 1: Get full system data (for synchronization / initialization)
router.get('/data', async (req, res) => {
  try {
    const booths = await prisma.booth.findMany({
      orderBy: { kode: 'asc' },
    });
    const masterMenus = await prisma.masterMenu.findMany({
      orderBy: [{ kategori: 'asc' }, { nama: 'asc' }],
    });
    const boothMenus = await prisma.boothMenu.findMany({
      include: { masterMenu: true },
    });
    const eventSetting = await getOrCreateEventSetting();
    const menuItems = resolveMenuItemsFromBoothMenus(masterMenus, boothMenus);

    res.json({
      booths,
      masterMenus,
      boothMenus,
      menuItems,
      eventSetting,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 1.0: Get / Update Event Settings
router.get('/event-settings', async (req, res) => {
  try {
    const eventSetting = await getOrCreateEventSetting();
    res.json(eventSetting);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/event-settings', authenticateJWT, async (req, res) => {
  try {
    const {
      nama_event,
      tanggal_event,
      area_lokasi,
      konektivitas,
      client_merchant,
      footer_struk,
      voucher_active,
      voucher_nominal,
      kiosk_banner,
    } = req.body;

    const updated = await prisma.eventSetting.upsert({
      where: { id: 'default' },
      update: {
        nama_event: typeof nama_event === 'string' ? nama_event : '',
        tanggal_event: typeof tanggal_event === 'string' ? tanggal_event : '',
        area_lokasi: typeof area_lokasi === 'string' ? area_lokasi : '',
        konektivitas: typeof konektivitas === 'string' ? konektivitas : '',
        client_merchant: typeof client_merchant === 'string' ? client_merchant : '',
        footer_struk: typeof footer_struk === 'string' ? footer_struk : '',
        voucher_active: voucher_active !== undefined ? Boolean(voucher_active) : undefined,
        voucher_nominal: voucher_nominal !== undefined ? Number(voucher_nominal) : undefined,
        kiosk_banner: typeof kiosk_banner === 'string' ? kiosk_banner : '',
      },
      create: {
        id: 'default',
        nama_event: typeof nama_event === 'string' ? nama_event : '',
        tanggal_event: typeof tanggal_event === 'string' ? tanggal_event : '',
        area_lokasi: typeof area_lokasi === 'string' ? area_lokasi : '',
        konektivitas: typeof konektivitas === 'string' ? konektivitas : '',
        client_merchant: typeof client_merchant === 'string' ? client_merchant : '',
        footer_struk: typeof footer_struk === 'string' ? footer_struk : '',
        voucher_active: voucher_active !== undefined ? Boolean(voucher_active) : true,
        voucher_nominal: voucher_nominal !== undefined ? Number(voucher_nominal) : 5000,
        kiosk_banner: typeof kiosk_banner === 'string' ? kiosk_banner : '',
      },
    });

    kdsEvents.emit('sys_update');
    res.json({ success: true, eventSetting: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 1.5: File Upload dengan Kompresi Otomatis WebP
router.post('/upload', authenticateJWT, uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
    }
    const rawType = req.query.type as string;
    const uploadType = (rawType === 'qris' || rawType === 'kiosk_banner' ? rawType : 'menu') as
      | 'menu'
      | 'qris'
      | 'kiosk_banner';
    const fileUrl = await optimizeAndSaveImage(req.file.buffer, uploadType);
    res.json({ url: fileUrl });
  } catch (err: any) {
    console.error('Error saat mengompresi gambar:', err);
    res.status(500).json({ error: 'Gagal memproses dan mengompres gambar' });
  }
});

export default router;
