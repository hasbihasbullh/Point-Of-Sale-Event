/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { kdsEvents } from '../utils/events';

const router = Router();

// API 1.1: SSE Endpoint for Global System Auto-Updates
router.get('/sys-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const onUpdate = () => {
    res.write(`data: update\n\n`);
  };

  // Keep-alive heartbeat interval (25 detik) mencegah timeout router/proxy/Starlink
  const heartbeat = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 25000);

  kdsEvents.on('sys_update', onUpdate);

  req.on('close', () => {
    clearInterval(heartbeat);
    kdsEvents.off('sys_update', onUpdate);
  });
});

// API 9.6: SSE Endpoint for KDS Auto-Updates per Booth
router.get('/kds-stream/:booth_id', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const { booth_id } = req.params;

  const onUpdate = (targetBoothId: string) => {
    if (targetBoothId === booth_id) {
      res.write(`data: update\n\n`);
    }
  };

  const heartbeat = setInterval(() => {
    res.write(`: keep-alive\n\n`);
  }, 25000);

  kdsEvents.on('kds_update', onUpdate);

  req.on('close', () => {
    clearInterval(heartbeat);
    kdsEvents.off('kds_update', onUpdate);
  });
});

export default router;
