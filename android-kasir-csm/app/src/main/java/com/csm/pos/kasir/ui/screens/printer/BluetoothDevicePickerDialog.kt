package com.csm.pos.kasir.ui.screens.printer

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import com.csm.pos.kasir.bluetooth.BluetoothDeviceInfo
import com.csm.pos.kasir.bluetooth.BluetoothPrinterManager
import com.csm.pos.kasir.ui.theme.*

@Composable
fun BluetoothDevicePickerDialog(
    printerManager: BluetoothPrinterManager,
    selectedAddress: String? = null,
    onDeviceSelected: (macAddress: String, name: String) -> Unit,
    onTestPrint: ((macAddress: String) -> Unit)? = null,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var pairedDevices by remember { mutableStateOf<List<BluetoothDeviceInfo>>(emptyList()) }
    var hasPermission by remember {
        mutableStateOf(
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
            } else {
                true
            }
        )
    }

    val refreshDevices = {
        pairedDevices = printerManager.getPairedDevices()
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val connectGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions[Manifest.permission.BLUETOOTH_CONNECT] == true
        } else {
            true
        }
        hasPermission = connectGranted
        if (connectGranted) {
            refreshDevices()
        }
    }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !hasPermission) {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.BLUETOOTH_CONNECT,
                    Manifest.permission.BLUETOOTH_SCAN
                )
            )
        } else {
            refreshDevices()
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 520.dp)
                .fillMaxWidth(0.92f)
                .fillMaxHeight(0.88f)
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White)
                .padding(20.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Print, contentDescription = null, tint = Orange500)
                        Text("Pilih Printer Bluetooth", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Slate900)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { refreshDevices() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Segarkan", tint = Slate600)
                        }
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Slate500)
                        }
                    }
                }

                Text(
                    text = "Pastikan printer thermal mini Anda sudah menyala dan di-pairing di menu Bluetooth HP.",
                    fontSize = 12.sp,
                    color = Slate500,
                    modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
                )

                if (!hasPermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Rose50)
                            .border(1.dp, Rose200, RoundedCornerShape(14.dp))
                            .padding(14.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Izin Bluetooth Diperlukan untuk mendeteksi printer pada Android 12+",
                            fontSize = 12.sp,
                            color = Rose600,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                        Button(
                            onClick = {
                                permissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.BLUETOOTH_CONNECT,
                                        Manifest.permission.BLUETOOTH_SCAN
                                    )
                                )
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Rose600),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Berikan Izin Bluetooth", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                } else if (pairedDevices.isEmpty()) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Slate50)
                            .border(1.dp, Slate200, RoundedCornerShape(14.dp))
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(Icons.Default.BluetoothDisabled, contentDescription = null, tint = Slate400, modifier = Modifier.size(36.dp))
                        Text(
                            text = "Belum ada printer yang ter-pairing.\nSilakan pairing printer di Pengaturan Bluetooth HP terlebih dahulu.",
                            fontSize = 12.sp,
                            color = Slate500,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                        OutlinedButton(
                            onClick = {
                                try {
                                    context.startActivity(Intent(Settings.ACTION_BLUETOOTH_SETTINGS))
                                } catch (e: Exception) {
                                    // fallback
                                }
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.SettingsBluetooth, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Buka Bluetooth HP", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f, fill = false),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(pairedDevices) { device ->
                            val isCurrentSelected = selectedAddress == device.address

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(if (isCurrentSelected) Orange50 else Slate50)
                                    .border(
                                        width = if (isCurrentSelected) 1.5.dp else 1.dp,
                                        color = if (isCurrentSelected) Orange500 else Slate200,
                                        shape = RoundedCornerShape(14.dp)
                                    )
                                    .clickable { onDeviceSelected(device.address, device.name) }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Bluetooth,
                                        contentDescription = null,
                                        tint = if (isCurrentSelected) Orange500 else Slate600
                                    )
                                    Column {
                                        Text(device.name, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate800)
                                        Text(device.address, fontSize = 11.sp, color = Slate400)
                                    }
                                }

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    if (onTestPrint != null) {
                                        OutlinedButton(
                                            onClick = { onTestPrint(device.address) },
                                            modifier = Modifier.height(34.dp),
                                            shape = RoundedCornerShape(8.dp),
                                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                        ) {
                                            Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(14.dp), tint = Slate700)
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Tes Cetak", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                                        }
                                    }

                                    if (isCurrentSelected) {
                                        Icon(Icons.Default.CheckCircle, contentDescription = "Terhubung", tint = Emerald600, modifier = Modifier.size(20.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
