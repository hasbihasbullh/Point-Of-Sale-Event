package com.csm.pos.kasir.data.local.dao

import androidx.room.*
import com.csm.pos.kasir.data.local.entity.DeviceConfigEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DeviceConfigDao {
    @Query("SELECT * FROM device_config WHERE id = 1 LIMIT 1")
    fun getConfigFlow(): Flow<DeviceConfigEntity?>

    @Query("SELECT * FROM device_config WHERE id = 1 LIMIT 1")
    suspend fun getConfig(): DeviceConfigEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(config: DeviceConfigEntity)

    @Query("UPDATE device_config SET assignedBoothId = :boothId, assignedBoothKode = :boothKode, assignedBoothNama = :boothNama WHERE id = 1")
    suspend fun lockBooth(boothId: String, boothKode: String, boothNama: String)

    @Query("UPDATE device_config SET serverBaseUrl = :url WHERE id = 1")
    suspend fun updateServerUrl(url: String)

    @Query("UPDATE device_config SET printerMacAddress = :mac, printerName = :name WHERE id = 1")
    suspend fun updatePrinter(mac: String?, name: String?)
}
