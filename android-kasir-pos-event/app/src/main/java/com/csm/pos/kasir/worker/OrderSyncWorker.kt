package com.csm.pos.kasir.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.csm.pos.kasir.data.local.AppDatabase
import com.csm.pos.kasir.data.repository.SyncRepository

class OrderSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val db = AppDatabase.getDatabase(applicationContext)
        val config = db.deviceConfigDao().getConfig() ?: return Result.success()

        val boothId = config.assignedBoothId ?: return Result.success()
        val serverUrl = config.serverBaseUrl

        Log.d("OrderSyncWorker", "Memulai background sync untuk booth $boothId ke $serverUrl...")

        val syncRepo = SyncRepository(db)
        val result = syncRepo.syncPendingOrders(serverUrl, boothId)

        return if (result.isSuccess) {
            val count = result.getOrDefault(0)
            Log.d("OrderSyncWorker", "Background sync sukses! $count pesanan terkirim.")
            Result.success()
        } else {
            Log.w("OrderSyncWorker", "Background sync gagal, akan dicoba lagi nanti.", result.exceptionOrNull())
            Result.retry()
        }
    }
}
