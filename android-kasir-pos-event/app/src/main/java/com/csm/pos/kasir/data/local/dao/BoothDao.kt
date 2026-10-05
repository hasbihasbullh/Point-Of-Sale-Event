package com.csm.pos.kasir.data.local.dao

import androidx.room.*
import com.csm.pos.kasir.data.local.entity.BoothEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BoothDao {
    @Query("SELECT * FROM booths ORDER BY kode ASC")
    fun getAllBoothsFlow(): Flow<List<BoothEntity>>

    @Query("SELECT * FROM booths ORDER BY kode ASC")
    suspend fun getAllBooths(): List<BoothEntity>

    @Query("SELECT * FROM booths WHERE id = :id LIMIT 1")
    suspend fun getBoothById(id: String): BoothEntity?

    @Query("SELECT * FROM booths WHERE kode = :kode LIMIT 1")
    suspend fun getBoothByKode(kode: String): BoothEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(booths: List<BoothEntity>)

    @Query("DELETE FROM booths")
    suspend fun deleteAll()
}
