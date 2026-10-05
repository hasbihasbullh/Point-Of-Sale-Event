package com.csm.pos.kasir.domain.model

import com.csm.pos.kasir.data.local.entity.MenuItemEntity

data class CartItem(
    val menuItem: MenuItemEntity,
    var qty: Int,
    var catatan: String? = null
) {
    val subtotal: Double
        get() = menuItem.harga * qty
}

enum class PaymentMethod(val label: String) {
    CASH("CASH"),
    QRIS("QRIS"),
    EDC("EDC")
}

data class BoothReport(
    val dateString: String,
    val boothKode: String,
    val boothNama: String,
    val totalRevenue: Double,
    val totalDiskon: Double,
    val totalTransactions: Int,
    val totalItemsSold: Int,
    val cashTotal: Double,
    val qrisTotal: Double,
    val edcTotal: Double,
    val pendingSyncCount: Int,
    val voidedTransactionsCount: Int = 0,
    val totalVoidedAmount: Double = 0.0,
    val reservasiCount: Int = 0,
    val reservasiTotalAmount: Double = 0.0,
    val topItems: List<TopMenuItemReport>,
    val isCashActive: Boolean = true,
    val isQrisActive: Boolean = true,
    val isEdcActive: Boolean = true
)

data class TopMenuItemReport(
    val nama: String,
    val kategori: String,
    val harga: Double,
    val qty: Int,
    val totalRevenue: Double
)
