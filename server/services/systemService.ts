/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

export async function getOrCreateEventSetting() {
  try {
    let setting = await prisma.eventSetting.findUnique({
      where: { id: 'default' },
    });
    if (!setting) {
      setting = await prisma.eventSetting.create({
        data: {
          id: 'default',
          nama_event: '',
          tanggal_event: '',
          area_lokasi: '',
          konektivitas: '',
          client_merchant: '',
          footer_struk: '',
          voucher_active: true,
          voucher_nominal: 5000,
          kiosk_banner: '',
        },
      });
    }
    return setting;
  } catch (err) {
    console.error('Error fetching event setting:', err);
    return {
      id: 'default',
      nama_event: '',
      tanggal_event: '',
      area_lokasi: '',
      konektivitas: '',
      client_merchant: '',
      footer_struk: '',
      voucher_active: true,
      voucher_nominal: 5000,
      kiosk_banner: '',
      updated_at: new Date(),
    };
  }
}

export async function ensureAdminUser() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          nama_lengkap: 'Administrator',
          role: 'ADMIN',
          is_default_password: true,
        },
      });
      console.log('✅ Akun Administrator default otomatis dibuat (admin / admin123)');
    }
  } catch (err) {
    console.error('Error initializing admin user:', err);
  }
}

export function resolveMenuItemsFromBoothMenus(masterMenus: any[], boothMenus: any[]): any[] {
  const resolved: any[] = [];
  for (const bm of boothMenus) {
    const master = masterMenus.find((m) => m.id === bm.master_menu_id);
    if (master) {
      resolved.push({
        id: master.id,
        booth_id: bm.booth_id,
        booth_menu_id: bm.id,
        master_menu_id: master.id,
        nama: master.nama,
        harga: bm.harga !== undefined && bm.harga !== null ? bm.harga : master.harga_default,
        harga_default: master.harga_default,
        kategori: master.kategori,
        foto: master.foto,
        deskripsi: master.deskripsi,
        kds_display:
          bm.kds_display !== null && bm.kds_display !== undefined
            ? bm.kds_display
            : master.kds_display !== undefined
            ? master.kds_display
            : true,
        tersedia: bm.tersedia && master.aktif,
        stok: bm.stok,
        urutan: bm.urutan || 0,
      });
    }
  }
  return resolved;
}
