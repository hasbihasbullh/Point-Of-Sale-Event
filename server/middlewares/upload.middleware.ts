/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import multer from 'multer';

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar yang diizinkan!'), false);
    }
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // Max 15MB upload sebelum dikompresi
});
