/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, SUPERVISOR_PIN, SYNC_SECRET } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

// Middleware: Verifikasi JWT Token Admin Panel
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: 'Token tidak valid atau telah kedaluwarsa' });
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Akses ditolak: Token autentikasi tidak ditemukan' });
  }
};

// Helper: Cek apakah request memiliki hak akses via JWT Admin atau Supervisor PIN
export const isAuthorizedWithPinOrJWT = (req: Request): boolean => {
  const authHeader = req.headers.authorization;
  const pinHeader = req.headers['x-supervisor-pin'] || req.query.pin || (req.body && req.body.supervisor_pin);

  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, JWT_SECRET);
      return true;
    } catch (e) {
      // Fallback to PIN check
    }
  }

  if (pinHeader && String(pinHeader).trim() === SUPERVISOR_PIN) {
    return true;
  }

  return false;
};

// Helper: Cek apakah request memiliki hak akses via Sync Secret atau JWT Admin
export const isAuthorizedWithSyncSecretOrJWT = (req: Request): boolean => {
  const syncSecret = req.headers['x-sync-secret'];
  const authHeader = req.headers.authorization;

  if (syncSecret && syncSecret === SYNC_SECRET) {
    return true;
  }

  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, JWT_SECRET);
      return true;
    } catch (e) {
      // invalid token
    }
  }

  return false;
};
