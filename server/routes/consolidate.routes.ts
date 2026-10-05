/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { prisma } from '../config/prisma';
import { SYNC_SECRET } from '../config/env';
import { getWibTimestampString } from '../utils/time';
import { kdsEvents } from '../utils/events';
import { authenticateJWT, isAuthorizedWithSyncSecretOrJWT } from '../middlewares/auth.middleware';
import { getOrCreateEventSetting } from '../services/systemService';
import { processConsolidatedOrders } from '../services/consolidateService';

const router = Router();

// API 8.7: Export all transactions & metadata (Consolidation) - Protected
router.get('/export', async (req, res) => {
  try {
    if (!isAuthorizedWithSyncSecretOrJWT(req)) {
      return res.status(401).json({
        error: 'Akses ditolak: Autentikasi Admin atau Sync Secret Key diperlukan',
      });
    }

    const booths = await prisma.booth.findMany();
    const masterMenus = await prisma.masterMenu.findMany();
    const boothMenus = await prisma.boothMenu.findMany();
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
    const eventSetting = await getOrCreateEventSetting();

    res.json({
      success: true,
      exportTimestamp: getWibTimestampString(),
      eventSetting,
      booths,
      masterMenus,
      boothMenus,
      ordersCount: orders.length,
      orders,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 8.8: Pull & Consolidate from Remote Kiosk Server via IP/URL
router.post('/pull', authenticateJWT, async (req, res) => {
  try {
    let { targetUrl } = req.body;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: 'URL Server Kiosk target wajib diisi' });
    }

    targetUrl = targetUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `http://${targetUrl}`;
    }
    targetUrl = targetUrl.replace(/\/+$/, '');

    const exportEndpoint = `${targetUrl}/api/consolidate/export`;
    console.log(`Menarik data konsolidasi dari: ${exportEndpoint}...`);

    const response = await fetch(exportEndpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-sync-secret': SYNC_SECRET,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Server Kiosk target merespons error HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const remoteData: any = await response.json();
    if (!remoteData || !Array.isArray(remoteData.orders)) {
      return res.status(400).json({ error: 'Format data transaksi dari server target tidak valid' });
    }

    const summary = await processConsolidatedOrders(remoteData);

    res.json({
      success: true,
      message: `Berhasil menarik ${summary.addedCount} transaksi baru dari ${targetUrl}`,
      targetUrl,
      summary,
    });
  } catch (err: any) {
    console.error('Error saat menarik data konsolidasi:', err);
    res.status(500).json({
      error: `Gagal terhubung ke Server Kiosk target (${err.message}). Pastikan IP benar dan Kiosk terhubung ke Wi-Fi yang sama.`,
    });
  }
});

// API 8.9: Import JSON file backup directly
router.post('/import-json', authenticateJWT, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.orders)) {
      return res.status(400).json({
        error: 'Format file JSON tidak valid. Pastikan file berisi daftar transaksi yang diexport dari POS.',
      });
    }

    const summary = await processConsolidatedOrders(payload);

    res.json({
      success: true,
      message: `Berhasil mengimpor ${summary.addedCount} transaksi baru dari file JSON`,
      summary,
    });
  } catch (err: any) {
    console.error('Error saat mengimpor JSON transaksi:', err);
    res.status(500).json({ error: `Gagal mengimpor data transaksi: ${err.message}` });
  }
});

// API 8.10: Ping / Health Check Remote Kiosk Node
router.post('/ping', authenticateJWT, async (req, res) => {
  try {
    let { targetUrl } = req.body;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: 'URL target wajib diisi' });
    }
    targetUrl = targetUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `http://${targetUrl}`;
    }
    targetUrl = targetUrl.replace(/\/+$/, '');

    const startTime = Date.now();
    const response = await fetch(`${targetUrl}/api/consolidate/export`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'x-sync-secret': SYNC_SECRET,
      },
      signal: AbortSignal.timeout(6000),
    });
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return res.json({
        online: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        latency,
      });
    }

    const remoteData: any = await response.json();
    res.json({
      online: true,
      latency,
      targetUrl,
      ordersCount: remoteData.ordersCount || (remoteData.orders ? remoteData.orders.length : 0),
      eventSetting: remoteData.eventSetting,
      exportTimestamp: remoteData.exportTimestamp,
    });
  } catch (err: any) {
    res.json({
      online: false,
      error: err.message || 'Tidak dapat terhubung',
      latency: null,
    });
  }
});

// API 8.11: Pull Batch from Multiple Remote Kiosks
router.post('/pull-batch', authenticateJWT, async (req, res) => {
  try {
    const { targetUrls } = req.body;
    if (!Array.isArray(targetUrls) || targetUrls.length === 0) {
      return res.status(400).json({ error: 'Daftar URL Kiosk target wajib diisi' });
    }

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalVoidUpdated = 0;
    let totalRevenueAdded = 0;
    const results: any[] = [];

    for (let rawUrl of targetUrls) {
      let targetUrl = String(rawUrl).trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = `http://${targetUrl}`;
      }
      targetUrl = targetUrl.replace(/\/+$/, '');

      try {
        const exportEndpoint = `${targetUrl}/api/consolidate/export`;
        const response = await fetch(exportEndpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'x-sync-secret': SYNC_SECRET,
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          results.push({
            targetUrl,
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          });
          continue;
        }

        const remoteData: any = await response.json();
        if (!remoteData || !Array.isArray(remoteData.orders)) {
          results.push({
            targetUrl,
            success: false,
            error: 'Format data transaksi tidak valid',
          });
          continue;
        }

        const summary = await processConsolidatedOrders(remoteData);
        totalAdded += summary.addedCount;
        totalSkipped += summary.skippedCount;
        totalVoidUpdated += summary.voidUpdatedCount;
        totalRevenueAdded += summary.revenueAdded;

        results.push({
          targetUrl,
          success: true,
          summary,
        });
      } catch (err: any) {
        results.push({
          targetUrl,
          success: false,
          error: err.message || 'Koneksi gagal',
        });
      }
    }

    res.json({
      success: true,
      totalAdded,
      totalSkipped,
      totalVoidUpdated,
      totalRevenueAdded,
      results,
      message: `Konsolidasi selesai: +${totalAdded} transaksi baru, +${totalVoidUpdated} VOID, +Rp ${totalRevenueAdded.toLocaleString('id-ID')}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 8.12: Push Master Data & Settings to Remote Kiosk Node
router.post('/push-master', authenticateJWT, async (req, res) => {
  try {
    let { targetUrl } = req.body;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: 'URL Server Kiosk target wajib diisi' });
    }
    targetUrl = targetUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `http://${targetUrl}`;
    }
    targetUrl = targetUrl.replace(/\/+$/, '');

    const booths = await prisma.booth.findMany();
    const masterMenus = await prisma.masterMenu.findMany();
    const boothMenus = await prisma.boothMenu.findMany();
    const eventSetting = await getOrCreateEventSetting();

    const pushEndpoint = `${targetUrl}/api/consolidate/receive-master`;
    const response = await fetch(pushEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': SYNC_SECRET,
      },
      body: JSON.stringify({ booths, masterMenus, boothMenus, eventSetting }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Kiosk target merespons error HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const data: any = await response.json();
    res.json({
      success: true,
      message: data.message || `Berhasil mendistribusikan master data ke ${targetUrl}`,
      targetUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: `Gagal push master data ke Kiosk: ${err.message}` });
  }
});

// API 8.13: Receive Master Data (Endpoint pada Kiosk yang menerima push dari Server Master)
router.post('/receive-master', async (req, res) => {
  try {
    if (!isAuthorizedWithSyncSecretOrJWT(req)) {
      return res.status(401).json({
        error: 'Akses ditolak: Sync Secret Key atau Token Admin diperlukan',
      });
    }

    const { booths, masterMenus, boothMenus, eventSetting } = req.body;

    if (eventSetting) {
      await prisma.eventSetting.upsert({
        where: { id: eventSetting.id || 'default' },
        update: {
          nama_event: eventSetting.nama_event,
          tanggal_event: eventSetting.tanggal_event,
          area_lokasi: eventSetting.area_lokasi,
          konektivitas: eventSetting.konektivitas,
          client_merchant: eventSetting.client_merchant,
          footer_struk: eventSetting.footer_struk,
          voucher_active: eventSetting.voucher_active !== undefined ? Boolean(eventSetting.voucher_active) : true,
          voucher_nominal: Number(eventSetting.voucher_nominal) || 5000,
        },
        create: {
          id: eventSetting.id || 'default',
          nama_event: eventSetting.nama_event,
          tanggal_event: eventSetting.tanggal_event,
          area_lokasi: eventSetting.area_lokasi,
          konektivitas: eventSetting.konektivitas,
          client_merchant: eventSetting.client_merchant,
          footer_struk: eventSetting.footer_struk,
          voucher_active: eventSetting.voucher_active !== undefined ? Boolean(eventSetting.voucher_active) : true,
          voucher_nominal: Number(eventSetting.voucher_nominal) || 5000,
        },
      });
    }

    if (Array.isArray(booths)) {
      for (const b of booths) {
        await prisma.booth.upsert({
          where: { id: b.id },
          update: {
            kode: b.kode,
            nama: b.nama,
            aktif: b.aktif ?? true,
            kiosk: b.kiosk ?? true,
            kds_active: b.kds_active ?? true,
            qris_image_path: b.qris_image_path,
            kategori_list: b.kategori_list,
            pay_cash_active: b.pay_cash_active ?? true,
            pay_qris_active: b.pay_qris_active ?? true,
            pay_edc_active: b.pay_edc_active ?? true,
            voucher_active: b.voucher_active !== undefined ? Boolean(b.voucher_active) : true,
            voucher_nominal: Number(b.voucher_nominal) || 5000,
          },
          create: {
            id: b.id,
            kode: b.kode,
            nama: b.nama,
            aktif: b.aktif ?? true,
            kiosk: b.kiosk ?? true,
            kds_active: b.kds_active ?? true,
            qris_image_path: b.qris_image_path,
            kategori_list: b.kategori_list,
            pay_cash_active: b.pay_cash_active ?? true,
            pay_qris_active: b.pay_qris_active ?? true,
            pay_edc_active: b.pay_edc_active ?? true,
            voucher_active: b.voucher_active !== undefined ? Boolean(b.voucher_active) : true,
            voucher_nominal: Number(b.voucher_nominal) || 5000,
          },
        });
      }
    }

    if (Array.isArray(masterMenus)) {
      for (const m of masterMenus) {
        await prisma.masterMenu.upsert({
          where: { id: m.id },
          update: {
            nama: m.nama,
            harga_default: Number(m.harga_default || m.harga || 0),
            kategori: m.kategori || 'Makanan',
            foto: m.foto,
            deskripsi: m.deskripsi,
            kds_display: m.kds_display ?? true,
            aktif: m.aktif ?? true,
          },
          create: {
            id: m.id,
            nama: m.nama,
            harga_default: Number(m.harga_default || m.harga || 0),
            kategori: m.kategori || 'Makanan',
            foto: m.foto,
            deskripsi: m.deskripsi,
            kds_display: m.kds_display ?? true,
            aktif: m.aktif ?? true,
          },
        });
      }
    }

    if (Array.isArray(boothMenus)) {
      for (const bm of boothMenus) {
        await prisma.boothMenu.upsert({
          where: {
            booth_id_master_menu_id: {
              booth_id: bm.booth_id,
              master_menu_id: bm.master_menu_id,
            },
          },
          update: {
            harga: Number(bm.harga) || 0,
            stok: bm.stok !== null && bm.stok !== undefined ? Number(bm.stok) : null,
            tersedia: bm.tersedia ?? true,
            urutan: Number(bm.urutan) || 0,
            kds_display: bm.kds_display !== undefined ? bm.kds_display : null,
          },
          create: {
            id: bm.id || `bm_${bm.booth_id}_${bm.master_menu_id}`,
            booth_id: bm.booth_id,
            master_menu_id: bm.master_menu_id,
            harga: Number(bm.harga) || 0,
            stok: bm.stok !== null && bm.stok !== undefined ? Number(bm.stok) : null,
            tersedia: bm.tersedia ?? true,
            urutan: Number(bm.urutan) || 0,
          },
        });
      }
    }

    kdsEvents.emit('sys_update');
    res.json({ success: true, message: 'Master data berhasil diperbarui dari Server Pusat' });
  } catch (err: any) {
    console.error('Error receive-master:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
