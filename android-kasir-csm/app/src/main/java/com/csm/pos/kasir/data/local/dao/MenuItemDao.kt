package com.csm.pos.kasir.data.local.dao

import androidx.room.*
import com.csm.pos.kasir.data.local.entity.MenuItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MenuItemDao {
    @Query("SELECT * FROM menu_items WHERE boothId = :boothId ORDER BY kategori ASC, nama ASC")
    fun getMenuItemsByBoothFlow(boothId: String): Flow<List<MenuItemEntity>>

    @Query("SELECT * FROM menu_items WHERE boothId = :boothId ORDER BY kategori ASC, nama ASC")
    suspend fun getMenuItemsByBooth(boothId: String): List<MenuItemEntity>

    @Query("SELECT * FROM menu_items WHERE id = :id LIMIT 1")
    suspend fun getMenuItemById(id: String): MenuItemEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(menuItems: List<MenuItemEntity>)

    @Query("UPDATE menu_items SET stok = :newStock, tersedia = :tersedia WHERE id = :id")
    suspend fun updateStock(id: String, newStock: Int?, tersedia: Boolean)

    @Query("DELETE FROM menu_items WHERE boothId = :boothId")
    suspend fun deleteByBooth(boothId: String)

    @Query("DELETE FROM menu_items")
    suspend fun deleteAll()
}
