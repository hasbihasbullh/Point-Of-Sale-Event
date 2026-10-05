package com.csm.pos.kasir.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "menu_items",
    indices = [Index("boothId"), Index("kategori")]
)
data class MenuItemEntity(
    @PrimaryKey val id: String,
    val boothId: String,
    val nama: String,
    val harga: Double,
    val kategori: String,
    val foto: String? = null,
    val deskripsi: String? = null,
    val tersedia: Boolean = true,
    val stok: Int? = null
)
