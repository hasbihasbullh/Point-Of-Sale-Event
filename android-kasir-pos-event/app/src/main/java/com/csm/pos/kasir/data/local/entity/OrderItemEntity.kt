package com.csm.pos.kasir.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "order_items",
    foreignKeys = [
        ForeignKey(
            entity = OrderEntity::class,
            parentColumns = ["id"],
            childColumns = ["orderId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("orderId"), Index("menuItemId")]
)
data class OrderItemEntity(
    @PrimaryKey val id: String,
    val orderId: String,
    val menuItemId: String,
    val namaItem: String,
    val harga: Double,
    val qty: Int,
    val catatan: String? = null
)
