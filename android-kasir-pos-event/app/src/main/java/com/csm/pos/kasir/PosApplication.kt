package com.csm.pos.kasir

import android.app.Application
import androidx.work.*
import com.csm.pos.kasir.data.local.AppDatabase
import com.csm.pos.kasir.worker.OrderSyncWorker
import java.util.concurrent.TimeUnit

class PosApplication : Application() {
    val database: AppDatabase by lazy { AppDatabase.getDatabase(this) }

    override fun onCreate() {
        super.onCreate()
        setupPeriodicBackgroundSync()
    }

    private fun setupPeriodicBackgroundSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val syncRequest = PeriodicWorkRequestBuilder<OrderSyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 1, TimeUnit.MINUTES)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "CsmOrderAutoSyncWork",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }
}
