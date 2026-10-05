package com.csm.pos.kasir.data.repository

import com.csm.pos.kasir.data.local.AppDatabase
import com.csm.pos.kasir.domain.model.BoothReport
import com.csm.pos.kasir.domain.model.TopMenuItemReport
import java.text.SimpleDateFormat
import java.util.*

class ReportRepository(private val db: AppDatabase) {

    suspend fun getBoothDailyReport(boothId: String, datePrefix: String? = null): BoothReport {
        val effectiveDate = datePrefix ?: SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val booth = db.boothDao().getBoothById(boothId)
        val allOrdersWithItems = db.orderDao().getTodayOrdersForBooth(boothId, effectiveDate)
        val validOrdersWithItems = allOrdersWithItems.filter { it.order.status != "VOID" }
        val voidedOrders = allOrdersWithItems.filter { it.order.status == "VOID" }
        val voidedCount = voidedOrders.size
        val voidedTotalAmount = voidedOrders.sumOf { it.order.total }

        var totalRevenue = 0.0
        var totalDiskon = 0.0
        var totalItemsSold = 0
        var cashTotal = 0.0
        var qrisTotal = 0.0
        var edcTotal = 0.0

        val itemSalesMap = mutableMapOf<String, TopMenuItemReport>()

        for (ord in validOrdersWithItems) {
            totalRevenue += ord.order.total
            totalDiskon += ord.order.diskon

            when (ord.order.metodeBayar?.uppercase() ?: "CASH") {
                "CASH" -> cashTotal += ord.order.total
                "QRIS" -> qrisTotal += ord.order.total
                "EDC" -> edcTotal += ord.order.total
            }

            for (item in ord.items) {
                totalItemsSold += item.qty
                val itemName = item.namaItem ?: "Item"
                val existing = itemSalesMap[itemName]
                if (existing == null) {
                    itemSalesMap[itemName] = TopMenuItemReport(
                        nama = itemName,
                        kategori = "Menu",
                        harga = item.harga,
                        qty = item.qty,
                        totalRevenue = item.harga * item.qty
                    )
                } else {
                    itemSalesMap[itemName] = existing.copy(
                        qty = existing.qty + item.qty,
                        totalRevenue = existing.totalRevenue + (item.harga * item.qty)
                    )
                }
            }
        }

        val pendingCount = db.orderDao().getPendingOrdersCount(boothId)
        val sortedTopItems = itemSalesMap.values.sortedByDescending { it.qty }

        // Kalkulasi Transaksi Reservasi
        val reservasiOrders = validOrdersWithItems.filter {
            it.order.namaPelanggan?.contains("reservasi", ignoreCase = true) == true
        }
        val reservasiCount = reservasiOrders.size
        val reservasiTotalAmount = reservasiOrders.sumOf { it.order.total }

        return BoothReport(
            dateString = effectiveDate,
            boothKode = booth?.kode ?: "-",
            boothNama = booth?.nama ?: "Stan",
            totalRevenue = totalRevenue,
            totalDiskon = totalDiskon,
            totalTransactions = validOrdersWithItems.size,
            totalItemsSold = totalItemsSold,
            cashTotal = cashTotal,
            qrisTotal = qrisTotal,
            edcTotal = edcTotal,
            pendingSyncCount = pendingCount,
            voidedTransactionsCount = voidedCount,
            totalVoidedAmount = voidedTotalAmount,
            reservasiCount = reservasiCount,
            reservasiTotalAmount = reservasiTotalAmount,
            topItems = sortedTopItems,
            isCashActive = booth?.payCashActive ?: true,
            isQrisActive = booth?.payQrisActive ?: true,
            isEdcActive = booth?.payEdcActive ?: true
        )
    }
}
