/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

export const uploadDir = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export function deleteLocalImage(imageUrl: string | null | undefined): void {
  if (imageUrl && imageUrl.startsWith('/uploads/')) {
    const filename = path.basename(imageUrl);
    const filepath = path.join(uploadDir, filename);
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (err) {
        console.error('Gagal menghapus file lokal:', filepath, err);
      }
    }
  }
}

export async function optimizeAndSaveImage(
  buffer: Buffer,
  type: 'menu' | 'qris' | 'kiosk_banner' = 'menu'
): Promise<string> {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `img-${type}-${uniqueSuffix}.webp`;
  const targetPath = path.join(uploadDir, filename);

  const maxWidth = type === 'kiosk_banner' ? 1920 : type === 'qris' ? 800 : 600;
  const quality = type === 'kiosk_banner' ? 85 : type === 'qris' ? 85 : 80;

  await sharp(buffer)
    .rotate() // Auto-orient berdasarkan EXIF orientation
    .resize({
      width: maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toFile(targetPath);

  return `/uploads/${filename}`;
}
