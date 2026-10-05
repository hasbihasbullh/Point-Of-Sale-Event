package com.csm.pos.kasir.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.csm.pos.kasir.data.local.dao.BoothDao
import com.csm.pos.kasir.data.local.dao.DeviceConfigDao
import com.csm.pos.kasir.data.local.dao.EventSettingDao
import com.csm.pos.kasir.data.local.dao.MenuItemDao
import com.csm.pos.kasir.data.local.dao.OrderDao
import com.csm.pos.kasir.data.local.entity.BoothEntity
import com.csm.pos.kasir.data.local.entity.DeviceConfigEntity
import com.csm.pos.kasir.data.local.entity.EventSettingEntity
import com.csm.pos.kasir.data.local.entity.MenuItemEntity
import com.csm.pos.kasir.data.local.entity.OrderEntity
import com.csm.pos.kasir.data.local.entity.OrderItemEntity

@Database(
    entities = [
        BoothEntity::class,
        MenuItemEntity::class,
        OrderEntity::class,
        OrderItemEntity::class,
        DeviceConfigEntity::class,
        EventSettingEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun boothDao(): BoothDao
    abstract fun menuItemDao(): MenuItemDao
    abstract fun orderDao(): OrderDao
    abstract fun deviceConfigDao(): DeviceConfigDao
    abstract fun eventSettingDao(): EventSettingDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "pos_event_offline.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
