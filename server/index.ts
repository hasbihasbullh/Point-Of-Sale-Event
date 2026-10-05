/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PORT } from './config/env';
import { prisma } from './config/prisma';
import { uploadDir } from './utils/image';
import { ensureAdminUser } from './services/systemService';

// Route Imports
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import menuRoutes from './routes/menu.routes';
import boothRoutes from './routes/booth.routes';
import orderRoutes from './routes/order.routes';
import reportRoutes from './routes/report.routes';
import streamRoutes from './routes/stream.routes';
import consolidateRoutes from './routes/consolidate.routes';
import systemRoutes from './routes/system.routes';

async function startServer() {
  const app = express();

  // Pasang Middleware CORS untuk akses fleksibel multi-device di LAN / Wi-Fi event
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  app.use(express.json({ limit: '15mb' }));

  // Expose public files statically dengan caching header 7 hari untuk performa tinggi
  app.use('/uploads', express.static(uploadDir, { maxAge: '7d', immutable: true }));
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Pasang API Routers
  app.use('/api/admin', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/master-menus', menuRoutes);
  app.use('/api/booths', boothRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/consolidate', consolidateRoutes);
  app.use('/api', systemRoutes);
  app.use('/api', streamRoutes);

  // Vite Middleware Setup (Development SPA vs Production Dist)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Inisialisasi Akun Admin Default jika database masih kosong
  await ensureAdminUser();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`POS Multi-device Server running on http://localhost:${PORT}`);
  });
}

// Ensure Prisma disconnects safely when server shuts down
const gracefulShutdown = async () => {
  console.log('Server shutting down, disconnecting database...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer();
