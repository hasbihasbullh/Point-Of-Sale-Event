/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { prisma } from '../config/prisma';
import { getWibDateString } from '../utils/time';
import { ReportSummary, Order } from '../../src/types';

export interface ReportQueryParams {
  rawDateParam?: string;
  startDateParam?: string;
  endDateParam?: string;
  filterBooth?: string;
}

export async function generateReportSummary(params: ReportQueryParams): Promise<ReportSummary> {
  const { rawDateParam, startDateParam, endDateParam, filterBooth } = params;

  let isAllDates = false;
  let startDate: string | null = null;
  let endDate: string | null = null;

  if (rawDateParam === 'ALL' || startDateParam === 'ALL' || endDateParam === 'ALL') {
    isAllDates = true;
  } else if (startDateParam && endDateParam) {
    startDate = startDateParam.trim();
    endDate = endDateParam.trim();
  } else if (startDateParam) {
    startDate = startDateParam.trim();
    endDate = startDateParam.trim();
  } else if (rawDateParam && rawDateParam.trim() !== '') {
    startDate = rawDateParam.trim();
    endDate = rawDateParam.trim();
  } else {
    const today = getWibDateString();
    startDate = today;
    endDate = today;
  }

  const isSingleDay = !isAllDates && startDate && endDate && startDate === endDate;

  const baseWhereClause: any = {};
  if (!isAllDates && startDate && endDate) {
    if (isSingleDay) {
      baseWhereClause.created_at = { startsWith: startDate };
    } else {
      baseWhereClause.created_at = {
        gte: `${startDate}T00:00:00`,
        lte: `${endDate}T23:59:59.999Z`,
      };
    }
  }
  if (filterBooth) {
    baseWhereClause.booth_id = filterBooth;
  }

  const booths = await prisma.booth.findMany();

  const allOrders = await prisma.order.findMany({
    where: baseWhereClause,
    include: { items: true },
    orderBy: { created_at: 'desc' },
  });

  const completed = allOrders.filter((o) => o.status !== 'VOID');
  const voidedOrders = allOrders.filter((o) => o.status === 'VOID');
  const voided_count = voidedOrders.length;
  const voided_total = voidedOrders.reduce((sum, o) => sum + o.total, 0);

  const timelineOrders = completed;

  let revenue_total = 0;
  let items_sold_count = 0;
  let total_diskon = 0;
  let reservasi_count = 0;
  let reservasi_total = 0;

  const boothMap: {
    [key: string]: {
      id: string;
      kode: string;
      nama: string;
      revenue: number;
      count: number;
      diskon: number;
      qty_items: number;
      payment_cash: number;
      payment_qris: number;
      payment_edc: number;
      reservasi_count: number;
      reservasi_total: number;
    };
  } = {};
  booths.forEach((b) => {
    boothMap[b.id] = {
      id: b.id,
      kode: b.kode,
      nama: b.nama,
      revenue: 0,
      count: 0,
      diskon: 0,
      qty_items: 0,
      payment_cash: 0,
      payment_qris: 0,
      payment_edc: 0,
      reservasi_count: 0,
      reservasi_total: 0,
    };
  });

  const payment_stats = { CASH: 0, QRIS: 0, EDC: 0 };
  const category_stats: Record<string, number> = {};
  const menu_sales: Record<string, { qty: number; booth: string; kategori: string; harga: number; total_revenue: number }> = {};
  const timelineMap: { [key: string]: { revenue: number; count: number } } = {};

  if (isSingleDay) {
    for (let i = 8; i <= 23; i++) {
      const hr = String(i).padStart(2, '0') + ':00';
      timelineMap[hr] = { revenue: 0, count: 0 };
    }
  }

  timelineOrders.forEach((ord) => {
    let key = '';
    if (isSingleDay) {
      key = ord.created_at.substring(11, 13) + ':00';
    } else {
      key = ord.created_at.split('T')[0];
    }
    if (!timelineMap[key]) timelineMap[key] = { revenue: 0, count: 0 };
    timelineMap[key].revenue += ord.total;
    timelineMap[key].count += 1;
  });

  const masterMenus = await prisma.masterMenu.findMany();

  completed.forEach((ord) => {
    revenue_total += ord.total;
    total_diskon += ord.diskon || 0;

    const isReservasi = /reservasi/i.test(ord.nama_pelanggan || '');
    if (isReservasi) {
      reservasi_count += 1;
      reservasi_total += ord.total;
    }

    if (boothMap[ord.booth_id]) {
      boothMap[ord.booth_id].revenue += ord.total;
      boothMap[ord.booth_id].count += 1;
      boothMap[ord.booth_id].diskon += ord.diskon || 0;
      if (isReservasi) {
        boothMap[ord.booth_id].reservasi_count += 1;
        boothMap[ord.booth_id].reservasi_total += ord.total;
      }

      if (ord.metode_bayar === 'CASH') boothMap[ord.booth_id].payment_cash += ord.total;
      if (ord.metode_bayar === 'QRIS') boothMap[ord.booth_id].payment_qris += ord.total;
      if (ord.metode_bayar === 'EDC') boothMap[ord.booth_id].payment_edc += ord.total;
    } else {
      boothMap[ord.booth_id] = {
        id: ord.booth_id,
        kode: ord.booth_kode,
        nama: ord.booth_nama,
        revenue: ord.total,
        count: 1,
        diskon: ord.diskon || 0,
        qty_items: 0,
        payment_cash: ord.metode_bayar === 'CASH' ? ord.total : 0,
        payment_qris: ord.metode_bayar === 'QRIS' ? ord.total : 0,
        payment_edc: ord.metode_bayar === 'EDC' ? ord.total : 0,
        reservasi_count: isReservasi ? 1 : 0,
        reservasi_total: isReservasi ? ord.total : 0,
      };
    }

    if (ord.metode_bayar in payment_stats) {
      (payment_stats as any)[ord.metode_bayar] += ord.total;
    }

    ord.items.forEach((item) => {
      items_sold_count += item.qty;

      const masterRef = masterMenus.find((m) => m.id === item.master_menu_id);
      const catString = masterRef ? masterRef.kategori : 'Makanan';
      const menuName = item.nama_item || (masterRef ? masterRef.nama : 'Menu');

      if (boothMap[ord.booth_id]) {
        boothMap[ord.booth_id].qty_items += item.qty;
      }

      const catList = (catString || 'Makanan')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      catList.forEach((cat) => {
        if (!category_stats[cat]) category_stats[cat] = 0;
        category_stats[cat] += item.qty;
      });

      const primaryCat = catList[0] || 'Makanan';
      const menuKey = `${ord.booth_nama}::${menuName}`;
      if (!menu_sales[menuKey]) {
        menu_sales[menuKey] = {
          qty: 0,
          booth: ord.booth_nama,
          kategori: primaryCat,
          harga: item.harga,
          total_revenue: 0,
        };
      }
      menu_sales[menuKey].qty += item.qty;
      menu_sales[menuKey].total_revenue += item.qty * item.harga;
    });
  });

  const booth_stats = Object.values(boothMap).map((b) => ({
    booth_id: b.id,
    booth_kode: b.kode,
    booth_nama: b.nama,
    revenue: b.revenue,
    sales_count: b.count,
    diskon: b.diskon,
    qty_items: b.qty_items,
    payment_cash: b.payment_cash,
    payment_qris: b.payment_qris,
    payment_edc: b.payment_edc,
    reservasi_count: b.reservasi_count,
    reservasi_total: b.reservasi_total,
  }));

  const timeline_stats = Object.keys(timelineMap)
    .sort()
    .map((key) => {
      let label = key;
      if (!isSingleDay) {
        const parts = key.split('-');
        if (parts.length === 3) {
          label = `${parts[2]}/${parts[1]}`;
        }
      }
      return {
        tanggal: label,
        revenue: timelineMap[key].revenue,
        count: timelineMap[key].count,
      };
    });

  const top_menus = Object.keys(menu_sales)
    .map((key) => ({
      name: key.split('::')[1],
      booth: menu_sales[key].booth,
      kategori: menu_sales[key].kategori,
      harga: menu_sales[key].harga,
      qty: menu_sales[key].qty,
      total_revenue: menu_sales[key].total_revenue,
    }))
    .sort((a, b) => b.qty - a.qty);

  const summary: ReportSummary = {
    revenue_total,
    total_diskon,
    transactions_count: completed.length,
    items_sold_count,
    voided_count,
    voided_total,
    reservasi_count,
    reservasi_total,
    booth_stats,
    payment_stats,
    category_stats: category_stats,
    timeline_stats,
    top_menus,
    menu_sales,
    raw_orders: allOrders as unknown as Order[],
  };

  return summary;
}
