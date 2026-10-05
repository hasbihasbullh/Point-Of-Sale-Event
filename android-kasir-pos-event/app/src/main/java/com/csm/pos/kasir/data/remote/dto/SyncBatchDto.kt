package com.csm.pos.kasir.data.remote.dto

import com.google.gson.annotations.SerializedName

data class SyncBatchRequest(
    @SerializedName("orders") val orders: List<ApiOrderDto>
)

data class ApiOrderDto(
    @SerializedName("id") val id: String,
    @SerializedName("booth_id") val boothId: String,
    @SerializedName("booth_kode") val boothKode: String? = null,
    @SerializedName("booth_nama") val boothNama: String? = null,
    @SerializedName("sumber") val sumber: String? = "KASIR_MOBILE",
    @SerializedName("metode_bayar") val metodeBayar: String? = "CASH",
    @SerializedName("nama_pelanggan") val namaPelanggan: String? = null,
    @SerializedName("total") val total: Double = 0.0,
    @SerializedName("diskon") val diskon: Double = 0.0,
    @SerializedName("uang_bayar") val uangBayar: Double? = null,
    @SerializedName("kembalian") val kembalian: Double? = null,
    @SerializedName("no_referensi") val noReferensi: String? = null,
    @SerializedName("nomor_order") val nomorOrder: String? = null,
    @SerializedName("status") val status: String? = "SELESAI",
    @SerializedName("alasan_void") val alasanVoid: String? = null,
    @SerializedName("created_at") val createdAt: String? = null,
    @SerializedName("items") val items: List<ApiOrderItemDto>? = null
)

data class VoidOrderRequest(
    @SerializedName("alasan_void") val alasanVoid: String? = null
)

data class ApiOrderItemDto(
    @SerializedName("id") val id: String? = null,
    @SerializedName("order_id") val orderId: String? = null,
    @SerializedName("menu_item_id") val menuItemId: String? = null,
    @SerializedName("master_menu_id") val masterMenuId: String? = null,
    @SerializedName("nama_item") val namaItem: String? = null,
    @SerializedName("harga") val harga: Double = 0.0,
    @SerializedName("qty") val qty: Int = 1,
    @SerializedName("catatan") val catatan: String? = null
)

data class SyncBatchResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("syncedOrderIds") val syncedOrderIds: List<String>? = null,
    @SerializedName("count") val count: Int? = 0,
    @SerializedName("message") val message: String? = null
)
