package com.csm.pos.kasir.data.repository

import android.content.Context
import android.util.Log
import com.csm.pos.kasir.data.local.AppDatabase
import com.csm.pos.kasir.data.local.ImageStorageManager
import com.csm.pos.kasir.data.local.entity.BoothEntity
import com.csm.pos.kasir.data.local.entity.MenuItemEntity
import com.csm.pos.kasir.data.remote.ApiClient
import com.csm.pos.kasir.data.remote.dto.ApiOrderDto
import com.csm.pos.kasir.data.remote.dto.ApiOrderItemDto
import com.csm.pos.kasir.data.remote.dto.SyncBatchRequest

class SyncRepository(
    private val db: AppDatabase,
    private val context: Context? = null
) {

    suspend fun fetchAndCacheMasterData(serverBaseUrl: String): Result<Pair<Int, Int>> {
        return try {
            val api = ApiClient.getService(serverBaseUrl)
            val response = api.getMasterData()

            if (response.isSuccessful && response.body() != null) {
                val data = response.body()!!

                val boothEntities = data.booths.map { b ->
                    val localQrisPath = context?.let { ctx ->
                        ImageStorageManager.downloadAndSaveImage(
                            context = ctx,
                            rawUrlOrBase64 = b.qrisImagePath,
                            serverBaseUrl = serverBaseUrl,
                            prefix = "qris",
                            itemId = b.id
                        )
                    } ?: b.qrisImagePath

                    BoothEntity(
                        id = b.id,
                        kode = b.kode,
                        nama = b.nama,
                        aktif = b.aktif ?: true,
                        kiosk = b.kiosk ?: false,
                        kdsActive = b.kdsActive ?: true,
                        qrisImagePath = localQrisPath,
                        kategoriList = b.kategoriList ?: "Makanan,Minuman,Cemilan",
                        payCashActive = b.payCashActive ?: true,
                        payQrisActive = b.payQrisActive ?: true,
                        payEdcActive = b.payEdcActive ?: true,
                        voucherActive = b.voucherActive ?: true,
                        voucherNominal = b.voucherNominal ?: 5000
                    )
                }

                val menuEntities = data.menuItems.map { m ->
                    val localFotoPath = context?.let { ctx ->
                        ImageStorageManager.downloadAndSaveImage(
                            context = ctx,
                            rawUrlOrBase64 = m.foto,
                            serverBaseUrl = serverBaseUrl,
                            prefix = "menu",
                            itemId = m.id
                        )
                    } ?: m.foto

                    MenuItemEntity(
                        id = m.id,
                        boothId = m.boothId,
                        nama = m.nama,
                        harga = m.harga,
                        kategori = m.kategori,
                        foto = localFotoPath,
                        deskripsi = m.deskripsi,
                        tersedia = m.tersedia ?: true,
                        stok = m.stok
                    )
                }

                db.boothDao().insertAll(boothEntities)
                db.menuItemDao().insertAll(menuEntities)

                // Simpan pengaturan event dinamis
                data.eventSetting?.let { ev ->
                    val eventEntity = com.csm.pos.kasir.data.local.entity.EventSettingEntity(
                        id = ev.id ?: "default",
                        namaEvent = ev.namaEvent ?: "",
                        tanggalEvent = ev.tanggalEvent ?: "",
                        areaLokasi = ev.areaLokasi ?: "",
                        konektivitas = ev.konektivitas ?: "",
                        clientMerchant = ev.clientMerchant ?: "",
                        footerStruk = ev.footerStruk ?: ""
                    )
                    db.eventSettingDao().insertOrUpdate(eventEntity)
                }

                // Garbage Collection: Hapus file gambar disk lokal yang sudah tidak lagi dipakai
                context?.let { ctx ->
                    val activePaths = (boothEntities.mapNotNull { it.qrisImagePath } + menuEntities.mapNotNull { it.foto }).toSet()
                    ImageStorageManager.pruneOrphanImages(ctx, activePaths)
                }

                Result.success(Pair(boothEntities.size, menuEntities.size))
            } else {
                Result.failure(Exception("Server returned HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e("SyncRepository", "Gagal mengunduh master data", e)
            Result.failure(e)
        }
    }

    suspend fun syncPendingOrders(serverBaseUrl: String, boothId: String): Result<Int> {
        return try {
            val pending = db.orderDao().getPendingOrdersByBooth(boothId)
            if (pending.isEmpty()) {
                return Result.success(0)
            }

            val api = ApiClient.getService(serverBaseUrl)

            val payloadOrders = pending.map { p ->
                ApiOrderDto(
                    id = p.order.id,
                    boothId = p.order.boothId,
                    sumber = p.order.sumber,
                    metodeBayar = p.order.metodeBayar,
                    namaPelanggan = p.order.namaPelanggan,
                    total = p.order.total,
                    diskon = p.order.diskon,
                    uangBayar = p.order.uangBayar,
                    kembalian = p.order.kembalian,
                    noReferensi = p.order.noReferensi,
                    nomorOrder = p.order.nomorOrder,
                    status = p.order.status,
                    alasanVoid = p.order.alasanVoid,
                    createdAt = p.order.createdAt,
                    items = p.items.map { i ->
                        ApiOrderItemDto(
                            id = i.id,
                            menuItemId = i.menuItemId,
                            namaItem = i.namaItem,
                            harga = i.harga,
                            qty = i.qty,
                            catatan = i.catatan
                        )
                    }
                )
            }

            val response = api.syncBatchOrders(SyncBatchRequest(orders = payloadOrders))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success && !body.syncedOrderIds.isNullOrEmpty()) {
                    db.orderDao().markOrdersAsSynced(body.syncedOrderIds)
                    Result.success(body.syncedOrderIds.size)
                } else {
                    Result.success(0)
                }
            } else {
                Result.failure(Exception("Server returned HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e("SyncRepository", "Gagal sync pending orders", e)
            Result.failure(e)
        }
    }

    suspend fun fetchAndCacheBoothOrders(
        serverBaseUrl: String,
        boothId: String,
        date: String? = null
    ): Result<Int> {
        return try {
            val api = ApiClient.getService(serverBaseUrl)
            val response = api.getBoothOrders(boothId, date)
            if (response.isSuccessful && response.body() != null) {
                val serverOrders = response.body()!!
                val booth = db.boothDao().getBoothById(boothId)
                val fallbackBoothKode = booth?.kode ?: "POS"
                val fallbackBoothNama = booth?.nama ?: "Stan"

                val orderEntities = mutableListOf<com.csm.pos.kasir.data.local.entity.OrderEntity>()
                val itemEntities = mutableListOf<com.csm.pos.kasir.data.local.entity.OrderItemEntity>()

                for (ord in serverOrders) {
                    val localOrder = db.orderDao().getOrderById(ord.id)
                    val isLocalPendingVoid = (localOrder?.status == "VOID" && !localOrder.isSynced)

                    val finalStatus = if (isLocalPendingVoid) "VOID" else (ord.status ?: "SELESAI")
                    val finalIsSynced = if (isLocalPendingVoid) false else true
                    val bKode = ord.boothKode ?: fallbackBoothKode
                    val bNama = ord.boothNama ?: fallbackBoothNama

                    val finalAlasanVoid = ord.alasanVoid ?: localOrder?.alasanVoid

                    orderEntities.add(
                        com.csm.pos.kasir.data.local.entity.OrderEntity(
                            id = ord.id,
                            boothId = ord.boothId,
                            boothKode = bKode,
                            boothNama = bNama,
                            nomorOrder = ord.nomorOrder ?: "ORD-${ord.id.takeLast(4)}",
                            namaPelanggan = ord.namaPelanggan,
                            metodeBayar = ord.metodeBayar ?: "CASH",
                            status = finalStatus,
                            alasanVoid = finalAlasanVoid,
                            sumber = ord.sumber ?: "KASIR_MOBILE",
                            total = ord.total,
                            diskon = ord.diskon,
                            uangBayar = ord.uangBayar,
                            kembalian = ord.kembalian,
                            noReferensi = ord.noReferensi,
                            createdAt = ord.createdAt ?: "",
                            isSynced = finalIsSynced
                        )
                    )

                    val itemsList = ord.items ?: emptyList()
                    for ((idx, item) in itemsList.withIndex()) {
                        val finalItemId = item.id ?: "item_${ord.id}_$idx"
                        val finalMenuItemId = item.masterMenuId ?: item.menuItemId ?: "menu_${ord.id}_$idx"
                        val finalNamaItem = item.namaItem ?: "Item Menu"

                        itemEntities.add(
                            com.csm.pos.kasir.data.local.entity.OrderItemEntity(
                                id = finalItemId,
                                orderId = ord.id,
                                menuItemId = finalMenuItemId,
                                namaItem = finalNamaItem,
                                harga = item.harga,
                                qty = if (item.qty > 0) item.qty else 1,
                                catatan = item.catatan
                            )
                        )
                    }
                }

                if (orderEntities.isNotEmpty()) {
                    db.orderDao().insertBatchOrdersWithItems(orderEntities, itemEntities)
                }

                Result.success(orderEntities.size)
            } else {
                Result.failure(Exception("Server returned HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e("SyncRepository", "Gagal fetch & cache booth orders: ${e.localizedMessage}", e)
            Result.failure(e)
        }
    }

    suspend fun voidOrder(serverBaseUrl: String, orderId: String, alasanVoid: String? = null): Result<Boolean> {
        return try {
            // 1. Get order items before voiding to restore local stock
            val orderWithItems = db.orderDao().getOrderWithItemsById(orderId)

            // 2. Mark local Room database as VOID with reason and isSynced = 0 (queued for upload)
            db.orderDao().markOrderAsVoid(orderId, alasanVoid)

            // 3. Restore local stock immediately if stock is limited
            if (orderWithItems != null) {
                for (item in orderWithItems.items) {
                    val menuItem = db.menuItemDao().getMenuItemById(item.menuItemId)
                    if (menuItem != null && menuItem.stok != null) {
                        val restoredStock = menuItem.stok + item.qty
                        db.menuItemDao().updateStock(menuItem.id, restoredStock, true)
                    }
                }
            }

            // 4. If online, attempt immediate push to server
            if (serverBaseUrl.isNotBlank()) {
                try {
                    val api = ApiClient.getService(serverBaseUrl)
                    val response = api.voidOrder(
                        orderId = orderId,
                        request = com.csm.pos.kasir.data.remote.dto.VoidOrderRequest(alasanVoid = alasanVoid)
                    )
                    if (response.isSuccessful) {
                        // Mark as synced if online push succeeded
                        db.orderDao().markOrdersAsSynced(listOf(orderId))
                    }
                } catch (netErr: Exception) {
                    Log.w("SyncRepository", "Offline void: server unreachable now, queued for sync: ${netErr.message}")
                    // Remains isSynced = 0, will be synced automatically when online
                }
            }
            Result.success(true)
        } catch (e: Exception) {
            Log.e("SyncRepository", "Error voiding order $orderId locally", e)
            Result.failure(e)
        }
    }
}
