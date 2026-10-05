package com.csm.pos.kasir.data.local.dao

import androidx.room.*
import com.csm.pos.kasir.data.local.entity.OrderEntity
import com.csm.pos.kasir.data.local.entity.OrderItemEntity
import kotlinx.coroutines.flow.Flow

data class OrderWithItems(
    @Embedded val order: OrderEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "orderId"
    )
    val items: List<OrderItemEntity>
)

@Dao
interface OrderDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: OrderEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrders(orders: List<OrderEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrderItems(items: List<OrderItemEntity>)

    @Transaction
    suspend fun insertOrderWithItems(order: OrderEntity, items: List<OrderItemEntity>) {
        insertOrder(order)
        insertOrderItems(items)
    }

    @Transaction
    suspend fun insertBatchOrdersWithItems(orders: List<OrderEntity>, items: List<OrderItemEntity>) {
        insertOrders(orders)
        insertOrderItems(items)
    }

    @Transaction
    @Query("SELECT * FROM orders WHERE boothId = :boothId ORDER BY createdAt DESC")
    fun getOrdersByBoothFlow(boothId: String): Flow<List<OrderWithItems>>

    @Transaction
    @Query("SELECT * FROM orders WHERE boothId = :boothId AND createdAt LIKE :datePrefix || '%' ORDER BY createdAt DESC")
    fun getTodayOrdersByBoothFlow(boothId: String, datePrefix: String): Flow<List<OrderWithItems>>

    @Transaction
    @Query("SELECT * FROM orders WHERE boothId = :boothId ORDER BY createdAt DESC")
    suspend fun getOrdersByBooth(boothId: String): List<OrderWithItems>

    @Transaction
    @Query("SELECT * FROM orders WHERE isSynced = 0 AND boothId = :boothId ORDER BY createdAt ASC")
    suspend fun getPendingOrdersByBooth(boothId: String): List<OrderWithItems>

    @Query("SELECT COUNT(*) FROM orders WHERE isSynced = 0 AND boothId = :boothId")
    fun getPendingOrdersCountFlow(boothId: String): Flow<Int>

    @Query("SELECT COUNT(*) FROM orders WHERE isSynced = 0 AND boothId = :boothId")
    suspend fun getPendingOrdersCount(boothId: String): Int

    @Query("UPDATE orders SET isSynced = 1 WHERE id IN (:orderIds)")
    suspend fun markOrdersAsSynced(orderIds: List<String>)

    @Query("SELECT COUNT(*) FROM orders WHERE boothId = :boothId AND createdAt LIKE :datePrefix || '%'")
    suspend fun getTodayOrderCountForBooth(boothId: String, datePrefix: String): Int

    @Transaction
    @Query("SELECT * FROM orders WHERE boothId = :boothId AND createdAt LIKE :datePrefix || '%' ORDER BY createdAt DESC")
    suspend fun getTodayOrdersForBooth(boothId: String, datePrefix: String): List<OrderWithItems>

    @Query("SELECT * FROM orders WHERE id = :orderId LIMIT 1")
    suspend fun getOrderById(orderId: String): OrderEntity?

    @Transaction
    @Query("SELECT * FROM orders WHERE id = :orderId LIMIT 1")
    suspend fun getOrderWithItemsById(orderId: String): OrderWithItems?

    @Query("UPDATE orders SET status = 'VOID', alasanVoid = :alasanVoid, isSynced = 0 WHERE id = :orderId")
    suspend fun markOrderAsVoid(orderId: String, alasanVoid: String? = null)
}
