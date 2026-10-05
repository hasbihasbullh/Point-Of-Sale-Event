package com.csm.pos.kasir.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.util.UUID

data class BluetoothDeviceInfo(
    val name: String,
    val address: String
)

class BluetoothPrinterManager(private val context: Context) {
    private val sppUuid: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB") // Standard SerialPortProfile
    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()

    fun isBluetoothAvailable(): Boolean = bluetoothAdapter != null

    fun isBluetoothEnabled(): Boolean = bluetoothAdapter?.isEnabled == true

    @SuppressLint("MissingPermission")
    fun getPairedDevices(): List<BluetoothDeviceInfo> {
        if (!isBluetoothEnabled()) return emptyList()
        return try {
            bluetoothAdapter?.bondedDevices?.map { device ->
                BluetoothDeviceInfo(
                    name = device.name ?: "Unknown Device",
                    address = device.address
                )
            } ?: emptyList()
        } catch (e: Exception) {
            Log.e("BluetoothPrinter", "Error getting bonded devices", e)
            emptyList()
        }
    }

    @SuppressLint("MissingPermission")
    suspend fun printBytes(macAddress: String, data: ByteArray): Result<Boolean> {
        return withContext(Dispatchers.IO) {
            var socket: BluetoothSocket? = null
            var outputStream: OutputStream? = null

            try {
                if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
                    return@withContext Result.failure(Exception("Bluetooth tidak aktif! Silakan nyalakan Bluetooth."))
                }

                val device: BluetoothDevice = try {
                    bluetoothAdapter.getRemoteDevice(macAddress)
                } catch (e: Exception) {
                    return@withContext Result.failure(Exception("Alamat MAC printer ($macAddress) tidak valid."))
                }

                bluetoothAdapter.cancelDiscovery()

                // Connect with 4-second timeout to fail-fast if printer is powered off or out of range
                kotlinx.coroutines.withTimeout(4000L) {
                    socket = device.createRfcommSocketToServiceRecord(sppUuid)
                    socket?.connect()
                }

                outputStream = socket?.outputStream
                if (outputStream == null) {
                    return@withContext Result.failure(Exception("Gagal membuka aliran data printer."))
                }

                outputStream.write(data)
                outputStream.flush()

                // Memberi sedikit jeda agar printer selesai menerima buffer sebelum socket close
                Thread.sleep(400)

                Result.success(true)
            } catch (e: kotlinx.coroutines.TimeoutCancellationException) {
                Log.e("BluetoothPrinter", "Koneksi printer Bluetooth timeout", e)
                Result.failure(Exception("Koneksi printer timeout (Pastikan printer menyala & dalam jangkauan)"))
            } catch (e: Exception) {
                Log.e("BluetoothPrinter", "Gagal mencetak struk", e)
                Result.failure(Exception(e.message ?: "Gagal terhubung ke printer Bluetooth"))
            } finally {
                try {
                    outputStream?.close()
                    socket?.close()
                } catch (ignored: Exception) {}
            }
        }
    }
}
