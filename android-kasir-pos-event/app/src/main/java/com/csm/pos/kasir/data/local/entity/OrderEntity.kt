package com.csm.pos.kasir.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "orders",
    indices = [Index("boothId"), Index("createdAt"), Index("isSynced")]
)
data class OrderEntity(
    @PrimaryKey val id: String,
    val boothId: String,
    val boothKode: String,
    val boothNama: String,
    val nomorOrder: String,
    val sumber: String = "KASIR_MOBILE",
    val metodeBayar: String, // "CASH", "QRIS", "EDC"
    val namaPelanggan: String? = null,
    val total: Double,
    val diskon: Double = 0.0,
    val uangBayar: Double? = null,
    val kembalian: Double? = null,
    val noReferensi: String? = null,
    val status: String = "SELESAI", // "SELESAI", "VOID"
    val alasanVoid: String? = null,
    val createdAt: String, // "YYYY-MM-DDTHH:mm:ss"
    val isSynced: Boolean = false
)
