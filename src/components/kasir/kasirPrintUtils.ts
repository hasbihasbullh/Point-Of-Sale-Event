/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Booth, Order, EventSetting } from '../../types';
import { TopMenuItem, PrinterSettings } from './kasirTypes';

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  paperWidth: '58mm',
  autoPrint: true,
  printCopies: 1,
  showCustomerName: true,
  showItemNotes: true,
};

export const getPrinterSettings = (): PrinterSettings => {
  if (typeof window === 'undefined') return DEFAULT_PRINTER_SETTINGS;
  try {
    const raw = localStorage.getItem('csm_pos_printer_settings');
    if (!raw) return DEFAULT_PRINTER_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PRINTER_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_PRINTER_SETTINGS;
  }
};

export const savePrinterSettings = (settings: PrinterSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('csm_pos_printer_settings', JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save printer settings:', err);
  }
};

export const formatIDR = (num: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
};

export const wrapText = (text: string, maxCols: number, indent: string = ''): string[] => {
  if (!text || !text.trim()) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const lineLimit = lines.length === 0 ? maxCols : maxCols - indent.length;
    if (!currentLine) {
      if (word.length <= lineLimit) {
        currentLine = word;
      } else {
        let remaining = word;
        while (remaining.length > lineLimit) {
          const chunk = remaining.slice(0, lineLimit);
          lines.push(lines.length === 0 ? chunk : indent + chunk);
          remaining = remaining.slice(lineLimit);
        }
        currentLine = remaining;
      }
    } else if (currentLine.length + 1 + word.length <= lineLimit) {
      currentLine += ' ' + word;
    } else {
      lines.push(lines.length === 0 ? currentLine : indent + currentLine);
      currentLine = '';
      const nextLimit = maxCols - indent.length;
      if (word.length <= nextLimit) {
        currentLine = word;
      } else {
        let remaining = word;
        while (remaining.length > nextLimit) {
          const chunk = remaining.slice(0, nextLimit);
          lines.push(indent + chunk);
          remaining = remaining.slice(nextLimit);
        }
        currentLine = remaining;
      }
    }
  }
  if (currentLine) {
    lines.push(lines.length === 0 ? currentLine : indent + currentLine);
  }
  return lines;
};

export const formatTwoColumns = (left: string, right: string, maxCols: number): string => {
  const spacesNeeded = maxCols - left.length - right.length;
  if (spacesNeeded >= 0) {
    return left + ' '.repeat(spacesNeeded) + right + '\n';
  } else {
    const leftLines = wrapText(left, maxCols);
    if (leftLines.length === 0) {
      const pad = Math.max(0, maxCols - right.length);
      return ' '.repeat(pad) + right + '\n';
    }
    let res = '';
    for (let i = 0; i < leftLines.length - 1; i++) {
      res += leftLines[i] + '\n';
    }
    const lastLine = leftLines[leftLines.length - 1];
    const remSpaces = maxCols - lastLine.length - right.length;
    if (remSpaces >= 0) {
      res += lastLine + ' '.repeat(remSpaces) + right + '\n';
    } else {
      res += lastLine + '\n';
      const pad = Math.max(0, maxCols - right.length);
      res += ' '.repeat(pad) + right + '\n';
    }
    return res;
  }
};

export const generateRawBTReceipt = (
  order: Order,
  booth?: Booth,
  eventSetting?: EventSetting,
  settings?: PrinterSettings,
  isKitchenCopy: boolean = false
): string => {
  const currentSettings = settings || getPrinterSettings();
  const maxCols = currentSettings.paperWidth === '80mm' ? 44 : 32;

  const center = (str: string) => {
    const lines = wrapText(str, maxCols);
    return lines
      .map((l) => {
        const pad = Math.max(0, Math.floor((maxCols - l.length) / 2));
        return ' '.repeat(pad) + l;
      })
      .join('\n') + '\n';
  };
  const leftRight = (left: string, right: string) => formatTwoColumns(left, right, maxCols);

  let text = '';
  const isVoid = order.status === 'VOID';

  if (isVoid) {
    text += '='.repeat(maxCols) + '\n';
    text += center('*** TRANSAKSI DIBATALKAN ***');
    text += center('***       ( V O I D )        ***');
    if (order.alasan_void) {
      text += center(`Alasan: ${order.alasan_void}`);
    }
    text += '='.repeat(maxCols) + '\n';
  } else if (isKitchenCopy) {
    text += '='.repeat(maxCols) + '\n';
    text += center('*** STRUK DAPUR / CHECKER ***');
    text += '='.repeat(maxCols) + '\n';
  } else {
    text += center(eventSetting?.nama_event || 'POINT OF SALE EVENT');
  }

  text += center(order.booth_nama || booth?.nama || 'Booth');
  const subInfo = [eventSetting?.client_merchant, eventSetting?.area_lokasi].filter(Boolean).join(' • ');
  if (subInfo) text += center(subInfo);
  text += '-'.repeat(maxCols) + '\n';
  text += center('NOMOR ORDER');
  text += center(order.nomor_order);
  if (currentSettings.showCustomerName !== false && order.nama_pelanggan && String(order.nama_pelanggan).trim()) {
    text += center(`[ ${String(order.nama_pelanggan).trim().toUpperCase()} ]`);
  }
  if (isVoid) {
    text += center('>>> STATUS: VOID / BATAL <<<');
    if (order.alasan_void) {
      text += center(`Alasan: ${order.alasan_void}`);
    }
  }
  text += '-'.repeat(maxCols) + '\n';
  text += leftRight(
    'Waktu',
    new Date(order.created_at).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  );
  text += leftRight('Kasir', `POS [${booth?.kode || 'POS'}]`);
  text += leftRight('Metode', order.metode_bayar);
  text += '-'.repeat(maxCols) + '\n';

  // --- DAFTAR ITEM (2-Line POS Professional Format) ---
  order.items.forEach((item) => {
    // Baris 1: Nama Menu Lengkap (Word-Wrap cerdas)
    const nameLines = wrapText(item.nama_item, maxCols);
    nameLines.forEach((l) => {
      text += l + '\n';
    });

    // Baris 2: Qty x @Harga dan Total Item
    const qtyPrice = `${item.qty}x @${formatIDR(item.harga).replace('Rp', '').trim()}`;
    const itemTotal = formatIDR(item.harga * item.qty);
    text += leftRight(qtyPrice, itemTotal);

    // Baris 3: Catatan Khusus Item
    if (currentSettings.showItemNotes !== false && item.catatan && item.catatan.trim()) {
      const noteLines = wrapText(`*Catatan: ${item.catatan.trim()}`, maxCols, '  ');
      noteLines.forEach((l) => {
        text += l + '\n';
      });
    }
  });

  text += '-'.repeat(maxCols) + '\n';
  text += leftRight('Subtotal', formatIDR(order.total + (order.diskon || 0)));
  if (order.diskon && order.diskon > 0) {
    const vVal = booth?.voucher_nominal ?? 5000;
    text += leftRight(`Voucher (${order.diskon / vVal}x)`, `- ${formatIDR(order.diskon)}`);
  }
  text += leftRight(isVoid ? 'TOTAL (BATAL)' : 'TOTAL', formatIDR(order.total));

  if (order.metode_bayar === 'CASH') {
    text += leftRight('Tunai', formatIDR(order.uang_bayar || 0));
    text += leftRight('Kembali', formatIDR(order.kembalian || 0));
  }

  text += '-'.repeat(maxCols) + '\n';
  if (!isKitchenCopy) {
    if (eventSetting?.footer_struk && eventSetting.footer_struk.trim()) {
      eventSetting.footer_struk.split('\n').forEach((line) => {
        if (line.trim()) text += center(line.trim());
      });
    } else {
      text += center('TERIMA KASIH ATAS KUNJUNGAN ANDA');
      text += center('Simpan struk ini sebagai bukti');
    }
  } else {
    text += center('*** HARAP SEGERA DISIAPKAN ***');
  }
  text += '\n\n';
  return text;
};

export const generateTestPrintText = (
  booth?: Booth,
  eventSetting?: EventSetting,
  settings?: PrinterSettings
): string => {
  const currentSettings = settings || getPrinterSettings();
  const maxCols = currentSettings.paperWidth === '80mm' ? 44 : 32;

  const center = (str: string) => {
    const pad = Math.max(0, Math.floor((maxCols - str.length) / 2));
    return ' '.repeat(pad) + str + '\n';
  };
  const leftRight = (left: string, right: string) => {
    const pad = Math.max(0, maxCols - left.length - right.length);
    return left + ' '.repeat(pad) + right + '\n';
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  let text = '='.repeat(maxCols) + '\n';
  text += center(eventSetting?.nama_event || 'POINT OF SALE EVENT');
  text += center('*** TEST PRINT THERMAL ***');
  text += '='.repeat(maxCols) + '\n';
  text += leftRight('Tanggal', `${dateStr} ${timeStr}`);
  text += leftRight('Terminal', `POS [${booth?.kode || 'B01'}]`);
  text += leftRight('Stan', booth?.nama || 'Kasir Stan');
  text += leftRight('Lebar Kertas', `${currentSettings.paperWidth} (${maxCols} Kolom)`);
  text += leftRight('Auto-Print', currentSettings.autoPrint ? 'AKTIF' : 'NON-AKTIF');
  text += leftRight('Rangkap Struk', `${currentSettings.printCopies} Copy`);
  text += '-'.repeat(maxCols) + '\n';
  text += center('UJI COBA ALIGNMENT & KARAKTER');
  text += leftRight('Teks Kiri', 'Teks Kanan');
  text += center('*** TEKS TENGAH BOLD ***');
  text += '0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ\n';
  text += '-'.repeat(maxCols) + '\n';
  text += center('STATUS PRINTER: OK & SIAP PAKAI');
  text += center('SISTEM POS BERFUNGSI NORMAL');
  text += '='.repeat(maxCols) + '\n';
  text += '\n\n';
  return text;
};

export const handleTestPrintReceipt = (
  booth?: Booth,
  eventSetting?: EventSetting,
  settings?: PrinterSettings
) => {
  const currentSettings = settings || getPrinterSettings();
  const isAndroid = /android/i.test(navigator.userAgent || navigator.vendor || (window as any).opera);

  if (isAndroid) {
    const textToPrint = generateTestPrintText(booth, eventSetting, currentSettings);
    const encodedData = encodeURIComponent(textToPrint);
    window.location.href = `intent:${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
  } else {
    const maxCols = currentSettings.paperWidth === '80mm' ? 44 : 32;
    const printWidth = currentSettings.paperWidth === '80mm' ? '72mm' : '46mm';
    const is80 = currentSettings.paperWidth === '80mm';

    const testLines = generateTestPrintText(booth, eventSetting, currentSettings)
      .split('\n')
      .map((line) => `<div style="white-space: pre; font-family: monospace;">${line || '&nbsp;'}</div>`)
      .join('');

    const htmlPayload = `
      <html>
        <head>
          <title>Test Print Thermal</title>
          <style>
            @page { margin: 0 !important; size: auto !important; }
            *, *::before, *::after { box-sizing: border-box !important; }
            html, body {
              width: ${printWidth} !important;
              max-width: ${printWidth} !important;
              margin: 0 !important;
              padding: ${is80 ? '3mm' : '1.5mm'} !important;
              color: #000 !important;
              background: #fff !important;
              font-family: 'Courier New', Courier, monospace !important;
              font-size: ${is80 ? '11.5px' : '10.5px'} !important;
              line-height: 1.25 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%;">
            ${testLines}
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument?.write(htmlPayload);
    iframe.contentDocument?.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  }
};

export const handlePrintReceipt = (
  completedOrder: Order,
  booth?: Booth,
  eventSetting?: EventSetting,
  settings?: PrinterSettings
) => {
  const currentSettings = settings || getPrinterSettings();
  const isAndroid = /android/i.test(navigator.userAgent || navigator.vendor || (window as any).opera);

  if (isAndroid && completedOrder) {
    let textToPrint = generateRawBTReceipt(completedOrder, booth, eventSetting, currentSettings, false);
    if (currentSettings.printCopies === 2) {
      textToPrint += '\n' + generateRawBTReceipt(completedOrder, booth, eventSetting, currentSettings, true);
    }
    const encodedData = encodeURIComponent(textToPrint);
    window.location.href = `intent:${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
  } else {
    const printContents = document.getElementById('print-invoice-area')?.innerHTML;
    if (!printContents) return;

    const is80 = currentSettings.paperWidth === '80mm';
    const printWidth = is80 ? '72mm' : '46mm';

    const htmlPayload = `
      <html>
        <head>
          <title>Print Receipt</title>
          ${document.head.innerHTML}
          <style>
            @page {
              margin: 0 !important;
              size: auto !important;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
            }
            html, body {
              width: ${printWidth} !important;
              max-width: ${printWidth} !important;
              min-width: ${printWidth} !important;
              margin: 0 !important;
              padding: ${is80 ? '2mm 3mm 2mm 2mm' : '1mm 2mm 1mm 1mm'} !important;
              color: #000 !important;
              background: #fff !important;
              font-family: 'Courier New', Courier, monospace, monospace !important;
              font-size: ${is80 ? '11.5px' : '10.5px'} !important;
              line-height: 1.25 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #print-invoice-area {
              width: 100% !important;
              max-width: ${printWidth} !important;
              margin: 0 !important;
              padding: 0 !important;
              font-size: ${is80 ? '11.5px' : '10.5px'} !important;
            }
            .receipt-header-title { font-size: ${is80 ? '14px' : '12px'} !important; font-weight: bold !important; }
            .receipt-order-no { font-size: ${is80 ? '18px' : '16px'} !important; font-weight: 900 !important; }
            .receipt-customer-name { font-size: ${is80 ? '13px' : '11px'} !important; font-weight: bold !important; }
            .receipt-meta { font-size: ${is80 ? '10.5px' : '9.5px'} !important; }
            .receipt-item-title { font-size: ${is80 ? '11.5px' : '10.5px'} !important; font-weight: bold !important; }
            .receipt-item-note { font-size: ${is80 ? '10px' : '9px'} !important; font-style: italic !important; }
            .receipt-subtotal { font-size: ${is80 ? '11px' : '10px'} !important; }
            .receipt-total { font-size: ${is80 ? '13.5px' : '12px'} !important; font-weight: 900 !important; }
            .receipt-footer { font-size: ${is80 ? '10px' : '9px'} !important; }
          </style>
        </head>
        <body style="width: ${printWidth}; max-width: ${printWidth}; margin: 0; padding: ${is80 ? '2mm 3mm 2mm 2mm' : '1mm 2mm 1mm 1mm'};">
          <div id="print-invoice-area" style="width: 100%; max-width: ${printWidth};">
            ${printContents}
            ${
              currentSettings.printCopies === 2
                ? `<div style="page-break-before: always; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">
                    <div style="text-align: center; font-weight: bold; margin-bottom: 5px; font-size: ${is80 ? '12px' : '11px'};">*** STRUK DAPUR / CHECKER ***</div>
                    ${printContents}
                  </div>`
                : ''
            }
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    iframe.contentDocument?.write(htmlPayload);
    iframe.contentDocument?.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  }
};

export const generateZReportReceipt = (
  reportData: any,
  currentBooth: Booth,
  effectiveReportDate: string,
  topMenuItems: TopMenuItem[],
  eventSetting?: EventSetting
): string => {
  if (!reportData || !currentBooth) return '';
  const center = (str: string) => {
    const pad = Math.max(0, Math.floor((32 - str.length) / 2));
    return ' '.repeat(pad) + str + '\n';
  };
  const leftRight = (left: string, right: string) => {
    const pad = Math.max(0, 32 - left.length - right.length);
    return left + ' '.repeat(pad) + right + '\n';
  };

  const isCashActive = currentBooth.pay_cash_active !== false;
  const isQrisActive = currentBooth.pay_qris_active !== false;
  const isEdcActive = currentBooth.pay_edc_active !== false;

  let text = center(eventSetting?.nama_event || 'POINT OF SALE EVENT');
  text += center(`[${currentBooth.kode}] ${currentBooth.nama}`);
  const subInfo = [eventSetting?.client_merchant, eventSetting?.area_lokasi].filter(Boolean).join(' - ');
  if (subInfo) text += center(subInfo);
  text += '='.repeat(32) + '\n';
  text += center('LAPORAN PENUTUPAN SHIFT');
  text += center('(Z-REPORT)');
  text += '-'.repeat(32) + '\n';
  text += `Tanggal  : ${effectiveReportDate}\n`;
  text += `Waktu    : ${new Date().toLocaleTimeString('id-ID')}\n`;
  text += `Terminal : POS Terminal [${currentBooth.kode}]\n`;
  text += '-'.repeat(32) + '\n';
  text += leftRight('Total Transaksi', `${reportData.transactions_count || 0} Struk`);
  text += leftRight('Total Porsi', `${reportData.items_sold_count || 0} Porsi`);
  if (reportData.reservasi_count && reportData.reservasi_count > 0) {
    text += leftRight('Pesanan Reservasi', `${reportData.reservasi_count} Order (${formatIDR(reportData.reservasi_total || 0)})`);
  }
  text += leftRight('Total Diskon', formatIDR(reportData.total_diskon || 0));
  text += leftRight('OMZET BERSIH', formatIDR(reportData.revenue_total || 0));
  text += '-'.repeat(32) + '\n';
  text += center('RINCIAN SETORAN & KAS:');
  let payNum = 1;
  if (isCashActive) {
    text += leftRight(`${payNum++}. Tunai (Cash In)`, formatIDR(reportData.payment_stats?.CASH || 0));
  }
  if (isQrisActive) {
    text += leftRight(`${payNum++}. QRIS Non-Tunai`, formatIDR(reportData.payment_stats?.QRIS || 0));
  }
  if (isEdcActive) {
    text += leftRight(`${payNum++}. Mesin EDC`, formatIDR(reportData.payment_stats?.EDC || 0));
  }
  if (!isCashActive && !isQrisActive && !isEdcActive) {
    text += center('(Tidak ada metode pembayaran aktif)');
  }
  text += '-'.repeat(32) + '\n';
  text += center('AUDIT VOID:');
  text += leftRight('Transaksi Void', `${reportData.voided_count || 0} Struk`);
  text += leftRight('Nominal Void', formatIDR(reportData.voided_total || 0));
  text += '-'.repeat(32) + '\n';
  if (topMenuItems.length > 0) {
    text += center('MENU TERLARIS:');
    topMenuItems.forEach((item, idx) => {
      text += `${idx + 1}. ${item.nama}\n`;
      text += leftRight(`   ${item.qty} pcs`, formatIDR(item.total_revenue));
    });
    text += '-'.repeat(32) + '\n';
  }
  text += '\n';
  text += center('Tanda Tangan Kasir:');
  text += '\n\n\n';
  text += center('(.......................)');
  text += '\n\n';
  return text;
};

export const handlePrintZReport = (
  reportData: any,
  currentBooth: Booth,
  effectiveReportDate: string,
  topMenuItems: TopMenuItem[],
  eventSetting?: EventSetting
) => {
  if (!reportData || !currentBooth) return;
  const isAndroid = /android/i.test(navigator.userAgent || navigator.vendor || (window as any).opera);
  if (isAndroid) {
    const textToPrint = generateZReportReceipt(reportData, currentBooth, effectiveReportDate, topMenuItems, eventSetting);
    const encodedData = encodeURIComponent(textToPrint);
    window.location.href = `intent:${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
  } else {
    const isCashActive = currentBooth.pay_cash_active !== false;
    const isQrisActive = currentBooth.pay_qris_active !== false;
    const isEdcActive = currentBooth.pay_edc_active !== false;
    let payHtmlNum = 1;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Z-Report - ${currentBooth.nama}</title>
            <style>
              @page { size: 58mm auto; margin: 0; }
              body { font-family: monospace; font-size: 12px; margin: 8px; line-height: 1.3; color: #000; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .row { display: flex; justify-content: space-between; }
              .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
              .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
            </style>
          </head>
          <body>
            <div class="center bold" style="font-size: 14px;">${eventSetting?.nama_event || 'POINT OF SALE EVENT'}</div>
            <div class="center bold">[${currentBooth.kode}] ${currentBooth.nama}</div>
            <div class="center" style="font-size: 10px;">${[eventSetting?.client_merchant, eventSetting?.area_lokasi].filter(Boolean).join(' - ')}</div>
            <div class="double-divider"></div>
            <div class="center bold">LAPORAN PENUTUPAN SHIFT</div>
            <div class="center bold">(Z-REPORT)</div>
            <div class="divider"></div>
            <div class="row"><span>Tanggal:</span><span>${effectiveReportDate}</span></div>
            <div class="row"><span>Waktu:</span><span>${new Date().toLocaleTimeString('id-ID')}</span></div>
            <div class="row"><span>Terminal:</span><span>KASIR POS [${currentBooth.kode}]</span></div>
            <div class="divider"></div>
            <div class="row"><span>Total Transaksi:</span><span class="bold">${reportData.transactions_count || 0} Struk</span></div>
            <div class="row"><span>Total Porsi:</span><span class="bold">${reportData.items_sold_count || 0} Porsi</span></div>
            ${reportData.reservasi_count && reportData.reservasi_count > 0 ? `
              <div class="row"><span>Pesanan Reservasi:</span><span class="bold">${reportData.reservasi_count} Order (${formatIDR(reportData.reservasi_total || 0)})</span></div>
            ` : ''}
            <div class="row"><span>Total Diskon:</span><span>${formatIDR(reportData.total_diskon || 0)}</span></div>
            <div class="row bold" style="font-size: 13px; margin-top: 4px;"><span>OMZET BERSIH:</span><span>${formatIDR(reportData.revenue_total || 0)}</span></div>
            <div class="divider"></div>
            <div class="center bold" style="margin-bottom: 4px;">RINCIAN KAS & SETORAN:</div>
            ${isCashActive ? `<div class="row bold"><span>${payHtmlNum++}. Tunai (Cash In):</span><span>${formatIDR(reportData.payment_stats?.CASH || 0)}</span></div>` : ''}
            ${isQrisActive ? `<div class="row"><span>${payHtmlNum++}. QRIS Non-Tunai:</span><span>${formatIDR(reportData.payment_stats?.QRIS || 0)}</span></div>` : ''}
            ${isEdcActive ? `<div class="row"><span>${payHtmlNum++}. Mesin EDC:</span><span>${formatIDR(reportData.payment_stats?.EDC || 0)}</span></div>` : ''}
            ${!isCashActive && !isQrisActive && !isEdcActive ? `<div class="center" style="font-size: 11px;">(Tidak ada metode pembayaran aktif)</div>` : ''}
            <div class="divider"></div>
            <div class="center bold">AUDIT VOID:</div>
            <div class="row"><span>Transaksi Void:</span><span>${reportData.voided_count || 0} Struk</span></div>
            <div class="row"><span>Nominal Void:</span><span>${formatIDR(reportData.voided_total || 0)}</span></div>
            <div class="divider"></div>
            ${topMenuItems.length > 0 ? `
              <div class="center bold" style="margin-bottom: 4px;">MENU TERLARIS:</div>
              ${topMenuItems.map((item, i) => `
                <div style="margin-bottom: 3px;">
                  <div>${i + 1}. ${item.nama}</div>
                  <div class="row" style="font-size: 11px; padding-left: 8px;"><span>${item.qty} pcs</span><span>${formatIDR(item.total_revenue)}</span></div>
                </div>
              `).join('')}
              <div class="divider"></div>
            ` : ''}
            <div style="margin-top: 16px; text-align: center;">
              <div>Tanda Tangan Kasir:</div>
              <div style="height: 40px;"></div>
              <div>(.......................)</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  }
};

export const generateWhatsAppReportText = (
  reportData: any,
  currentBooth: Booth,
  effectiveReportDate: string,
  topMenuItems: TopMenuItem[],
  eventSetting?: EventSetting
): string => {
  if (!reportData || !currentBooth) return '';
  const topMenuText = topMenuItems.length > 0
    ? topMenuItems.map((item, i) => `   ${i + 1}. ${item.nama} (${item.qty} pcs - ${formatIDR(item.total_revenue)})`).join('\n')
    : '   (Belum ada data)';

  const isCashActive = currentBooth.pay_cash_active !== false;
  const isQrisActive = currentBooth.pay_qris_active !== false;
  const isEdcActive = currentBooth.pay_edc_active !== false;

  const payLines: string[] = [];
  if (isCashActive) payLines.push(`   - Tunai (Cash In): *${formatIDR(reportData.payment_stats?.CASH || 0)}*`);
  if (isQrisActive) payLines.push(`   - QRIS Non-Tunai: *${formatIDR(reportData.payment_stats?.QRIS || 0)}*`);
  if (isEdcActive) payLines.push(`   - Mesin EDC: *${formatIDR(reportData.payment_stats?.EDC || 0)}*`);
  const payBlockText = payLines.length > 0 ? payLines.join('\n') : '   - (Tidak ada metode pembayaran aktif)';

  const reservasiLine = reportData.reservasi_count && reportData.reservasi_count > 0
    ? `*Pesanan Reservasi:* ${reportData.reservasi_count} Order (${formatIDR(reportData.reservasi_total || 0)})\n`
    : '';

  return `*LAPORAN PENUTUPAN SHIFT (Z-REPORT)*\n` +
    `*Booth:* [${currentBooth.kode}] ${currentBooth.nama}\n` +
    `*Event:* ${eventSetting?.nama_event || 'POS Event'}\n` +
    `*Tanggal:* ${effectiveReportDate}\n` +
    `*Waktu:* ${new Date().toLocaleTimeString('id-ID')}\n` +
    `----------------------------------------\n` +
    `*Omzet Bersih:* ${formatIDR(reportData.revenue_total || 0)}\n` +
    `*Total Transaksi:* ${reportData.transactions_count || 0} Struk\n` +
    `*Item Terjual:* ${reportData.items_sold_count || 0} Porsi\n` +
    reservasiLine +
    `*Total Diskon:* ${formatIDR(reportData.total_diskon || 0)}\n` +
    `----------------------------------------\n` +
    `*SETORAN & KAS:*\n` +
    `${payBlockText}\n` +
    `----------------------------------------\n` +
    `*Audit VOID:* ${reportData.voided_count || 0} Transaksi (${formatIDR(reportData.voided_total || 0)})\n` +
    `----------------------------------------\n` +
    `*Menu Terlaris:*\n${topMenuText}\n` +
    `----------------------------------------\n` +
    `_Laporan dikirim otomatis dari Terminal Kasir POS_`;
};
