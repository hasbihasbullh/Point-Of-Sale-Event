package com.csm.pos.kasir.data.repository

import com.csm.pos.kasir.data.local.AppDatabase
import com.csm.pos.kasir.data.local.dao.OrderWithItems
import com.csm.pos.kasir.data.local.entity.BoothEntity
import com.csm.pos.kasir.data.local.entity.DeviceConfigEntity
import com.csm.pos.kasir.data.local.entity.MenuItemEntity
import com.csm.pos.kasir.data.local.entity.OrderEntity
import com.csm.pos.kasir.data.local.entity.OrderItemEntity
import com.csm.pos.kasir.domain.model.CartItem
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.*

class PosRepository(private val db: AppDatabase) {

    fun getEventSettingFlow(): Flow<com.csm.pos.kasir.data.local.entity.EventSettingEntity?> =
        db.eventSettingDao().getEventSettingFlow()

    suspend fun getEventSetting(): com.csm.pos.kasir.data.local.entity.EventSettingEntity? =
        db.eventSettingDao().getEventSetting()

    fun getDeviceConfigFlow(): Flow<DeviceConfigEntity?> = db.deviceConfigDao().getConfigFlow()

    suspend fun getDeviceConfig(): DeviceConfigEntity? = db.deviceConfigDao().getConfig()

    suspend fun saveDeviceConfig(config: DeviceConfigEntity) = db.deviceConfigDao().insertOrUpdate(config.copy(id = 1))

    suspend fun lockBooth(boothId: String, boothKode: String, boothNama: String) {
        val currentConfig = db.deviceConfigDao().getConfig() ?: DeviceConfigEntity(id = 1)
        db.deviceConfigDao().insertOrUpdate(
            currentConfig.copy(
                id = 1,
                assignedBoothId = boothId,
                assignedBoothKode = boothKode,
                assignedBoothNama = boothNama
            )
        )
    }

    suspend fun unlockBooth() {
        val currentConfig = db.deviceConfigDao().getConfig() ?: DeviceConfigEntity(id = 1)
        db.deviceConfigDao().insertOrUpdate(
            currentConfig.copy(
                id = 1,
                assignedBoothId = null,
                assignedBoothKode = null,
                assignedBoothNama = null
            )
        )
    }

    fun getMenuItemsFlow(boothId: String): Flow<List<MenuItemEntity>> =
        db.menuItemDao().getMenuItemsByBoothFlow(boothId)

    suspend fun getBooth(boothId: String): BoothEntity? = db.boothDao().getBoothById(boothId)

    suspend fun getAllBooths(): List<BoothEntity> = db.boothDao().getAllBooths()

    fun getOrdersFlow(boothId: String): Flow<List<OrderWithItems>> =
        db.orderDao().getOrdersByBoothFlow(boothId)

    fun getTodayOrdersFlow(boothId: String, datePrefix: String? = null): Flow<List<OrderWithItems>> {
        val prefix = datePrefix ?: SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        return db.orderDao().getTodayOrdersByBoothFlow(boothId, prefix)
    }

    fun getPendingOrdersCountFlow(boothId: String): Flow<Int> =
        db.orderDao().getPendingOrdersCountFlow(boothId)

    suspend fun getPendingOrdersCount(boothId: String): Int =
        db.orderDao().getPendingOrdersCount(boothId)

    suspend fun generateNextOrderNumber(boothId: String, boothKode: String): String {
        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val count = db.orderDao().getTodayOrderCountForBooth(boothId, todayStr)
        val nextSeq = count + 1
        val seqPadded = String.format("%04d", nextSeq)
        return "$boothKode-$seqPadded"
    }

    suspend fun createOrder(
        booth: BoothEntity,
        cartItems: List<CartItem>,
        metodeBayar: String,
        total: Double,
        diskon: Double,
        uangBayar: Double?,
        kembalian: Double?,
        noReferensi: String?,
        namaPelanggan: String?
    ): OrderWithItems {
        val orderId = "ord_${System.currentTimeMillis()}_${(100..999).random()}"
        val transactionNo = generateNextOrderNumber(booth.id, booth.kode)
        val nowIso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).format(Date())

        val orderEntity = OrderEntity(
            id = orderId,
            boothId = booth.id,
            boothKode = booth.kode,
            boothNama = booth.nama,
            nomorOrder = transactionNo,
            sumber = "KASIR_MOBILE",
            metodeBayar = metodeBayar,
            namaPelanggan = namaPelanggan,
            total = total,
            diskon = diskon,
            uangBayar = uangBayar,
            kembalian = kembalian,
            noReferensi = noReferensi,
            status = "SELESAI",
            createdAt = nowIso,
            isSynced = false
        )

        val orderItemEntities = cartItems.mapIndexed { idx, c ->
            OrderItemEntity(
                id = "item_${orderId}_$idx",
                orderId = orderId,
                menuItemId = c.menuItem.id,
                namaItem = c.menuItem.nama,
                harga = c.menuItem.harga,
                qty = c.qty,
                catatan = c.catatan
            )
        }

        // Simpan atomik ke Room
        db.orderDao().insertOrderWithItems(orderEntity, orderItemEntities)

        // Update stok menu lokal jika menu memiliki stok terbatas
        for (c in cartItems) {
            if (c.menuItem.stok != null) {
                val newStock = maxOf(0, c.menuItem.stok - c.qty)
                db.menuItemDao().updateStock(c.menuItem.id, newStock, newStock > 0)
            }
        }

        return OrderWithItems(order = orderEntity, items = orderItemEntities)
    }

    suspend fun voidOrder(orderId: String, alasanVoid: String? = null) {
        val orderWithItems = db.orderDao().getOrderWithItemsById(orderId)
        db.orderDao().markOrderAsVoid(orderId, alasanVoid)

        // Restore local stock if limited stock menu
        if (orderWithItems != null) {
            for (item in orderWithItems.items) {
                val menuItem = db.menuItemDao().getMenuItemById(item.menuItemId)
                if (menuItem != null && menuItem.stok != null) {
                    val restoredStock = menuItem.stok + item.qty
                    db.menuItemDao().updateStock(menuItem.id, restoredStock, true)
                }
            }
        }
    }
}
