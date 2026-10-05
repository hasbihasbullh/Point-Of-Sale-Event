package com.csm.pos.kasir.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "event_settings")
data class EventSettingEntity(
    @PrimaryKey val id: String = "default",
    val namaEvent: String = "",
    val tanggalEvent: String = "",
    val areaLokasi: String = "",
    val konektivitas: String = "",
    val clientMerchant: String = "",
    val footerStruk: String = ""
)
