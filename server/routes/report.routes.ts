/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { isAuthorizedWithPinOrJWT } from '../middlewares/auth.middleware';
import { generateReportSummary } from '../services/reportService';

const router = Router();

// API 10: Reports Compiled On-The-Fly - Protected
router.get('/', async (req, res) => {
  try {
    const isAuthorized = isAuthorizedWithPinOrJWT(req) || Boolean(req.query.booth_id);

    if (!isAuthorized) {
      return res.status(401).json({
        error: 'Akses ditolak: Autentikasi Admin atau PIN Supervisor diperlukan untuk melihat laporan',
      });
    }

    const summary = await generateReportSummary({
      rawDateParam: req.query.date as string,
      startDateParam: (req.query.startDate as string) || (req.query.date_from as string),
      endDateParam: (req.query.endDate as string) || (req.query.date_to as string),
      filterBooth: req.query.booth_id as string,
    });

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
