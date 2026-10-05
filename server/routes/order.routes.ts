/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { prisma } from '../config/prisma';
import { getWibDateString } from '../utils/time';
import { isAuthorizedWithPinOrJWT } from '../middlewares/auth.middleware';
import {
  createOrderService,
  syncBatchOrdersService,
  voidOrderService,
  updateOrderStatusService,
} from '../services/orderService';

const router = Router();

// API 8: Create Order (Kasir & Kiosk)
router.post('/', async (req, res) => {
  try {
    const newOrder = await createOrderService(req.body);
    res.status(201).json(newOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 8.5: Batch Sync Orders from Kasir Mobile (Offline-First)
router.post('/sync-batch', async (req, res) => {
  try {
    const result = await syncBatchOrdersService(req.body.orders);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 1.2: Get today's orders for a specific booth
router.get('/today/:booth_id', async (req, res) => {
  try {
    const { booth_id } = req.params;
    const todayStr = getWibDateString();
    const todayOrders = await prisma.order.findMany({
      where: {
        booth_id: booth_id,
        created_at: { startsWith: todayStr },
      },
      include: { items: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(todayOrders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 9.5: Get Active Orders for KDS Polling
router.get('/active/:booth_id', async (req, res) => {
  try {
    const { booth_id } = req.params;
    const todayStr = getWibDateString();
    const activeOrders = await prisma.order.findMany({
      where: {
        booth_id: booth_id,
        created_at: { startsWith: todayStr },
      },
      include: { items: true },
      orderBy: { created_at: 'asc' },
    });

    // Filter out non-KDS items and only return orders that have KDS items
    const filteredOrders = activeOrders
      .map((ord) => {
        const kdsItems = ord.items.filter((it: any) => it.kds_display !== false);
        return {
          ...ord,
          items: kdsItems,
        };
      })
      .filter((ord) => ord.items.length > 0);

    res.json(filteredOrders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 9: Update Order Status (Kitchen / KDS click "SELESAI")
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateOrderStatusService(id, status);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 9.2: Void Order (Membatalkan Transaksi & Kembalikan Stok ke BoothMenu) - Protected
router.put('/:id/void', async (req, res) => {
  try {
    const { id } = req.params;
    const { alasan_void } = req.body || {};

    if (!isAuthorizedWithPinOrJWT(req)) {
      return res.status(403).json({
        error: 'Akses ditolak: PIN Supervisor atau Token Admin diperlukan untuk membatalkan pesanan (VOID)',
      });
    }

    const voidedOrder = await voidOrderService(id, alasan_void);
    res.json(voidedOrder);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
