/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Memulai pembersihan data transaksi dan antrean...');
  
  // 1. Hapus semua OrderItem
  const deletedItems = await prisma.orderItem.deleteMany({});
  console.log(`✅ Berhasil menghapus ${deletedItems.count} item pesanan (OrderItem).`);

  // 2. Hapus semua Order
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✅ Berhasil menghapus ${deletedOrders.count} data transaksi (Order).`);

  // 3. Reset nomor urut transaksi (Sequence)
  const resetSequences = await prisma.sequence.deleteMany({});
  console.log(`✅ Berhasil mereset ${resetSequences.count} nomor antrean transaksi (Sequence).`);

  console.log('🎉 Pembersihan selesai. Database siap digunakan untuk transaksi baru.');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat membersihkan transaksi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
