package com.csm.pos.kasir.data.local.dao

import androidx.room.*
import com.csm.pos.kasir.data.local.entity.EventSettingEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface EventSettingDao {
    @Query("SELECT * FROM event_settings WHERE id = 'default' LIMIT 1")
    fun getEventSettingFlow(): Flow<EventSettingEntity?>

    @Query("SELECT * FROM event_settings WHERE id = 'default' LIMIT 1")
    suspend fun getEventSetting(): EventSettingEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(setting: EventSettingEntity)
}
