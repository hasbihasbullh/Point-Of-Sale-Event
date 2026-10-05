package com.csm.pos.kasir.data.remote.dto

import com.google.gson.annotations.SerializedName

data class MasterDataResponse(
    @SerializedName("booths") val booths: List<ApiBoothDto>,
    @SerializedName("menuItems") val menuItems: List<ApiMenuItemDto>,
    @SerializedName("eventSetting") val eventSetting: ApiEventSettingDto? = null
)

data class ApiEventSettingDto(
    @SerializedName("id") val id: String? = "default",
    @SerializedName("nama_event") val namaEvent: String? = "",
    @SerializedName("tanggal_event") val tanggalEvent: String? = "",
    @SerializedName("area_lokasi") val areaLokasi: String? = "",
    @SerializedName("konektivitas") val konektivitas: String? = "",
    @SerializedName("client_merchant") val clientMerchant: String? = "",
    @SerializedName("footer_struk") val footerStruk: String? = ""
)

data class ApiBoothDto(
    @SerializedName("id") val id: String,
    @SerializedName("kode") val kode: String,
    @SerializedName("nama") val nama: String,
    @SerializedName("aktif") val aktif: Boolean? = true,
    @SerializedName("kiosk") val kiosk: Boolean? = false,
    @SerializedName("kds_active") val kdsActive: Boolean? = true,
    @SerializedName("qris_image_path") val qrisImagePath: String? = null,
    @SerializedName("kategori_list") val kategoriList: String? = null,
    @SerializedName("pay_cash_active") val payCashActive: Boolean? = true,
    @SerializedName("pay_qris_active") val payQrisActive: Boolean? = true,
    @SerializedName("pay_edc_active") val payEdcActive: Boolean? = true,
    @SerializedName("voucher_active") val voucherActive: Boolean? = true,
    @SerializedName("voucher_nominal") val voucherNominal: Int? = 5000
)

data class ApiMenuItemDto(
    @SerializedName("id") val id: String,
    @SerializedName("booth_id") val boothId: String,
    @SerializedName("nama") val nama: String,
    @SerializedName("harga") val harga: Double,
    @SerializedName("kategori") val kategori: String,
    @SerializedName("foto") val foto: String? = null,
    @SerializedName("deskripsi") val deskripsi: String? = null,
    @SerializedName("tersedia") val tersedia: Boolean? = true,
    @SerializedName("stok") val stok: Int? = null
)
