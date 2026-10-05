package com.csm.pos.kasir.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "booths")
data class BoothEntity(
    @PrimaryKey val id: String,
    val kode: String,
    val nama: String,
    val aktif: Boolean = true,
    val kiosk: Boolean = false,
    val kdsActive: Boolean = true,
    val qrisImagePath: String? = null,
    val kategoriList: String? = "Makanan,Minuman,Cemilan",
    val payCashActive: Boolean = true,
    val payQrisActive: Boolean = true,
    val payEdcActive: Boolean = true,
    val voucherActive: Boolean = true,
    val voucherNominal: Int = 5000
)
