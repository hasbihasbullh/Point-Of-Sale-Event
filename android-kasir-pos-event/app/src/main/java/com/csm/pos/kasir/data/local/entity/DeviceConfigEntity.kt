package com.csm.pos.kasir.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "device_config")
data class DeviceConfigEntity(
    @PrimaryKey val id: Int = 1,
    val serverBaseUrl: String = "http://192.168.1.100:3000",
    val assignedBoothId: String? = null,
    val assignedBoothKode: String? = null,
    val assignedBoothNama: String? = null,
    val supervisorPin: String = "1234",
    val activeCashierName: String = "Kasir 1",
    val printerMacAddress: String? = null,
    val printerName: String? = null,
    val paperWidth: String = "58mm",
    val autoPrint: Boolean = false,
    val printCopies: Int = 1,
    val showCustomerName: Boolean = true,
    val showItemNotes: Boolean = true
)
