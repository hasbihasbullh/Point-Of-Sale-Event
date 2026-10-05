package com.csm.pos.kasir.data.local

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

object ImageStorageManager {

    private const val TAG = "ImageStorageManager"
    private const val FOLDER_NAME = "pos_images"

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    /**
     * Mengunduh gambar dari server lokal atau men-decode Base64 dan menyimpannya ke Internal Storage HP.
     * Mengembalikan absolute path file lokal (contoh: /data/user/0/com.csm.pos.kasir/files/pos_images/menu_123.jpg)
     * agar gambar 100% selalu bisa dibuka saat HP kasir offline.
     */
    suspend fun downloadAndSaveImage(
        context: Context,
        rawUrlOrBase64: String?,
        serverBaseUrl: String,
        prefix: String,
        itemId: String
    ): String? = withContext(Dispatchers.IO) {
        if (rawUrlOrBase64.isNullOrBlank()) return@withContext null

        try {
            val storageDir = File(context.filesDir, FOLDER_NAME)
            if (!storageDir.exists()) {
                storageDir.mkdirs()
            }

            // 1. Jika data berupa Base64 (data:image/...)
            if (rawUrlOrBase64.startsWith("data:image")) {
                val base64Data = rawUrlOrBase64.substringAfter("base64,")
                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                val targetFile = File(storageDir, "${prefix}_${itemId}.png")
                
                FileOutputStream(targetFile).use { fos ->
                    fos.write(decodedBytes)
                    fos.flush()
                }
                Log.d(TAG, "Berhasil menyimpan Base64 image ke lokal: ${targetFile.absolutePath}")
                return@withContext targetFile.absolutePath
            }

            // 2. Jika data berupa file path lokal yang sudah ada
            if (rawUrlOrBase64.startsWith("/data/") || rawUrlOrBase64.startsWith("file://")) {
                val cleanPath = rawUrlOrBase64.removePrefix("file://")
                if (File(cleanPath).exists()) {
                    return@withContext cleanPath
                }
            }

            // 3. Jika data berupa URL relatif (/uploads/...) atau Full URL (http://...)
            val cleanBaseUrl = serverBaseUrl.trimEnd('/')
            val fullUrl = when {
                rawUrlOrBase64.startsWith("http://") || rawUrlOrBase64.startsWith("https://") -> rawUrlOrBase64
                rawUrlOrBase64.startsWith("/") -> "$cleanBaseUrl$rawUrlOrBase64"
                else -> "$cleanBaseUrl/$rawUrlOrBase64"
            }

            val fileExt = if (fullUrl.contains(".png", ignoreCase = true)) "png" else "jpg"
            val targetFile = File(storageDir, "${prefix}_${itemId}.$fileExt")

            val request = Request.Builder()
                .url(fullUrl)
                .build()

            val response = httpClient.newCall(request).execute()
            if (response.isSuccessful && response.body != null) {
                response.body!!.byteStream().use { input ->
                    FileOutputStream(targetFile).use { output ->
                        input.copyTo(output)
                        output.flush()
                    }
                }
                Log.d(TAG, "Berhasil mengunduh dan menyimpan gambar: $fullUrl -> ${targetFile.absolutePath}")
                return@withContext targetFile.absolutePath
            } else {
                Log.w(TAG, "Gagal mengunduh gambar dari $fullUrl (HTTP ${response.code})")
                // Jika unduhan gagal tapi format URL valid, kembalikan URL penuh sebagai fallback
                return@withContext fullUrl
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saat download & save image untuk $itemId", e)
            return@withContext rawUrlOrBase64
        }
    }

    /**
     * Menyediakan model yang siap dikonsumsi oleh Coil AsyncImage.
     * Mengutamakan File lokal jika tersedia.
     */
    fun getImageModel(rawPath: String?): Any? {
        if (rawPath.isNullOrBlank()) return null

        // 1. Cek File Lokal
        val cleanPath = rawPath.removePrefix("file://")
        val localFile = File(cleanPath)
        if (localFile.exists()) {
            return localFile
        }

        // 2. Cek Base64
        if (rawPath.startsWith("data:image")) {
            return try {
                val base64Data = rawPath.substringAfter("base64,")
                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            } catch (e: Exception) {
                null
            }
        }

        // 3. Cek Full URL
        if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
            return rawPath
        }

        return null
    }

    /**
     * Membersihkan file gambar lama di disk internal yang sudah tidak lagi dipakai oleh master menu / booth aktif.
     */
    fun pruneOrphanImages(context: Context, activePaths: Set<String>) {
        try {
            val storageDir = File(context.filesDir, FOLDER_NAME)
            if (!storageDir.exists()) return

            val files = storageDir.listFiles() ?: return
            val cleanActiveSet = activePaths.map { it.removePrefix("file://") }.toSet()

            var deletedCount = 0
            for (file in files) {
                if (file.isFile && !cleanActiveSet.contains(file.absolutePath)) {
                    val deleted = file.delete()
                    if (deleted) {
                        deletedCount++
                    }
                }
            }
            if (deletedCount > 0) {
                Log.d(TAG, "Garbage Collection Disk: Berhasil menghapus $deletedCount file gambar lama yang tidak terpakai.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saat membersihkan file gambar disk lama", e)
        }
    }
}
