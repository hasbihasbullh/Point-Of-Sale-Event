/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { JWT_SECRET } from '../config/env';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth.middleware';

const router = Router();

// API 2: Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Update last_login timestamp
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      const token = jwt.sign(
        { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          nama_lengkap: updatedUser.nama_lengkap || 'Administrator',
          foto_avatar: updatedUser.foto_avatar || null,
          role: updatedUser.role,
          is_default_password: updatedUser.is_default_password,
          last_login: updatedUser.last_login,
          created_at: updatedUser.created_at,
          updated_at: updatedUser.updated_at,
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Username atau password salah' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 2.1: Get Current Admin Profile
router.get('/profile', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const identifier = req.user?.id ? { id: req.user.id } : { username: req.user?.username };
    const user = await prisma.user.findFirst({ where: identifier });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap || 'Administrator',
        foto_avatar: user.foto_avatar || null,
        role: user.role,
        is_default_password: user.is_default_password,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 2.2: Update Admin Profile
router.put('/profile', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { nama_lengkap, username, foto_avatar } = req.body;
    const identifier = req.user?.id ? { id: req.user.id } : { username: req.user?.username };
    const currentUser = await prisma.user.findFirst({ where: identifier });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const cleanUsername = (username || '').trim();
    if (!cleanUsername) {
      return res.status(400).json({ success: false, message: 'Username tidak boleh kosong' });
    }

    // If changing username, ensure uniqueness
    if (cleanUsername !== currentUser.username) {
      const existing = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (existing && existing.id !== currentUser.id) {
        return res.status(400).json({ success: false, message: 'Username sudah digunakan oleh akun lain' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        nama_lengkap: typeof nama_lengkap === 'string' ? nama_lengkap.trim() : currentUser.nama_lengkap,
        username: cleanUsername,
        foto_avatar: typeof foto_avatar === 'string' ? foto_avatar : foto_avatar === null ? null : currentUser.foto_avatar,
      },
    });

    // Sign new token if username changed
    let token: string | undefined = undefined;
    if (cleanUsername !== currentUser.username) {
      token = jwt.sign(
        { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
    }

    res.json({
      success: true,
      message: 'Profil admin berhasil diperbarui',
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        nama_lengkap: updatedUser.nama_lengkap,
        foto_avatar: updatedUser.foto_avatar,
        role: updatedUser.role,
        is_default_password: updatedUser.is_default_password,
        last_login: updatedUser.last_login,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API 2.3: Change Admin Password
router.put('/change-password', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { old_password, new_password } = req.body;
    const identifier = req.user?.id ? { id: req.user.id } : { username: req.user?.username };
    const user = await prisma.user.findFirst({ where: identifier });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (!old_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Kata sandi lama dan baru wajib diisi' });
    }

    const isOldMatch = await bcrypt.compare(old_password, user.password);
    if (!isOldMatch) {
      return res.status(400).json({ success: false, message: 'Kata sandi lama tidak sesuai' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    const isDefault = new_password === 'admin123';

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        is_default_password: isDefault,
      },
    });

    res.json({
      success: true,
      message: 'Kata sandi berhasil diubah! Keamanan akun Anda kini lebih terlindungi.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        nama_lengkap: updatedUser.nama_lengkap,
        foto_avatar: updatedUser.foto_avatar,
        role: updatedUser.role,
        is_default_password: updatedUser.is_default_password,
        last_login: updatedUser.last_login,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
