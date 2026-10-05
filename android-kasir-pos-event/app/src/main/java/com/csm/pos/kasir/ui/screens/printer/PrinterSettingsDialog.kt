package com.csm.pos.kasir.ui.screens.printer

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.csm.pos.kasir.data.local.entity.DeviceConfigEntity
import com.csm.pos.kasir.ui.theme.*

@Composable
fun PrinterSettingsDialog(
    config: DeviceConfigEntity?,
    isPrinting: Boolean = false,
    onSaveSettings: (paperWidth: String, autoPrint: Boolean, printCopies: Int, showCustomerName: Boolean, showItemNotes: Boolean) -> Unit,
    onChangePrinterClick: () -> Unit,
    onTestPrintClick: () -> Unit,
    onDismiss: () -> Unit
) {
    var paperWidth by remember(config) { mutableStateOf(config?.paperWidth ?: "58mm") }
    var autoPrint by remember(config) { mutableStateOf(config?.autoPrint ?: false) }
    var printCopies by remember(config) { mutableStateOf(config?.printCopies ?: 1) }
    var showCustomerName by remember(config) { mutableStateOf(config?.showCustomerName ?: true) }
    var showItemNotes by remember(config) { mutableStateOf(config?.showItemNotes ?: true) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 540.dp)
                .fillMaxWidth(0.92f)
                .fillMaxHeight(0.92f)
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White)
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Orange50),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Print, contentDescription = null, tint = Orange600, modifier = Modifier.size(20.dp))
                        }
                        Column {
                            Text("Pengaturan Printer & Struk", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Slate900)
                            Text("Konfigurasi cetak struk kasir & dapur", fontSize = 11.sp, color = Slate500)
                        }
                    }

                    IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Slate500)
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Slate100)

                // Body (Scrollable with weight 1f to fill remaining vertical space nicely)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // 1. Device Info & Connect
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Perangkat Printer Bluetooth", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate700)

                        val hasPrinter = !config?.printerMacAddress.isNullOrBlank()

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(if (hasPrinter) Orange50.copy(alpha = 0.5f) else Slate50)
                                .border(1.dp, if (hasPrinter) Orange200 else Slate200, RoundedCornerShape(14.dp))
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
                                    imageVector = if (hasPrinter) Icons.Default.BluetoothConnected else Icons.Default.BluetoothDisabled,
                                    contentDescription = null,
                                    tint = if (hasPrinter) Emerald600 else Slate400,
                                    modifier = Modifier.size(22.dp)
                                )
                                Column {
                                    Text(
                                        text = config?.printerName ?: "Belum Terhubung",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = if (hasPrinter) Slate900 else Slate500
                                    )
                                    Text(
                                        text = config?.printerMacAddress ?: "Pilih printer Bluetooth kasir Anda",
                                        fontSize = 11.sp,
                                        color = Slate400
                                    )
                                }
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                if (hasPrinter) {
                                    OutlinedButton(
                                        onClick = onTestPrintClick,
                                        modifier = Modifier.height(34.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                                        enabled = !isPrinting
                                    ) {
                                        if (isPrinting) {
                                            CircularProgressIndicator(modifier = Modifier.size(14.dp), color = Orange500, strokeWidth = 2.dp)
                                        } else {
                                            Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(14.dp), tint = Slate700)
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text("Tes", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate700)
                                        }
                                    }
                                }

                                Button(
                                    onClick = onChangePrinterClick,
                                    modifier = Modifier.height(34.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = if (hasPrinter) Slate800 else Orange500),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp)
                                ) {
                                    Text(if (hasPrinter) "Ganti" else "Pilih", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // 2. Lebar Kertas (Paper Width: 58mm vs 80mm)
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Lebar Kertas Thermal", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate700)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            PaperWidthOption(
                                label = "58mm",
                                subtitle = "32 Kolom (Mini Thermal)",
                                isSelected = paperWidth == "58mm",
                                onClick = { paperWidth = "58mm" },
                                modifier = Modifier.weight(1f)
                            )
                            PaperWidthOption(
                                label = "80mm",
                                subtitle = "48 Kolom (Thermal Lebar)",
                                isSelected = paperWidth == "80mm",
                                onClick = { paperWidth = "80mm" },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // 3. Jumlah Salinan Cetak (Print Copies: 1 vs 2)
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Jumlah Salinan Cetak", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate700)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            PrintCopiesOption(
                                label = "1 Salinan",
                                subtitle = "Hanya Struk Pelanggan",
                                isSelected = printCopies == 1,
                                onClick = { printCopies = 1 },
                                modifier = Modifier.weight(1f)
                            )
                            PrintCopiesOption(
                                label = "2 Salinan",
                                subtitle = "Pelanggan + Checker Dapur",
                                isSelected = printCopies == 2,
                                onClick = { printCopies = 2 },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // 4. Auto Print Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Slate50)
                            .border(1.dp, Slate200, RoundedCornerShape(14.dp))
                            .clickable { autoPrint = !autoPrint }
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                            Text("Otomatis Cetak Struk (Auto-Print)", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate800)
                            Text(
                                "Struk langsung dicetak otomatis begitu checkout pembayaran selesai.",
                                fontSize = 11.sp,
                                color = Slate500
                            )
                        }
                        Switch(
                            checked = autoPrint,
                            onCheckedChange = { autoPrint = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = Orange500,
                                uncheckedThumbColor = Slate400,
                                uncheckedTrackColor = Slate200
                            )
                        )
                    }

                    // 5. Opsi Rincian Struk
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Slate50)
                            .border(1.dp, Slate200, RoundedCornerShape(14.dp))
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("Rincian Informasi Struk", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Slate700)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showCustomerName = !showCustomerName },
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Tampilkan Nama Pelanggan", fontSize = 12.sp, color = Slate800)
                            Checkbox(
                                checked = showCustomerName,
                                onCheckedChange = { showCustomerName = it },
                                colors = CheckboxDefaults.colors(checkedColor = Orange500)
                            )
                        }

                        HorizontalDivider(color = Slate200)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showItemNotes = !showItemNotes },
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Tampilkan Catatan Khusus Item", fontSize = 12.sp, color = Slate800)
                            Checkbox(
                                checked = showItemNotes,
                                onCheckedChange = { showItemNotes = it },
                                colors = CheckboxDefaults.colors(checkedColor = Orange500)
                            )
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Slate100)

                // Footer Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Batal", fontWeight = FontWeight.SemiBold, color = Slate600)
                    }

                    Button(
                        onClick = {
                            onSaveSettings(paperWidth, autoPrint, printCopies, showCustomerName, showItemNotes)
                        },
                        modifier = Modifier
                            .weight(1.5f)
                            .height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Orange500)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Simpan Pengaturan", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun PaperWidthOption(
    label: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .defaultMinSize(minHeight = 58.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isSelected) Orange50 else Slate50)
            .border(
                width = if (isSelected) 1.5.dp else 1.dp,
                color = if (isSelected) Orange500 else Slate200,
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { onClick() }
            .padding(10.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = if (isSelected) Orange600 else Slate800
                )
                if (isSelected) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Orange500, modifier = Modifier.size(16.dp))
                }
            }
            Text(text = subtitle, fontSize = 10.sp, color = Slate500)
        }
    }
}

@Composable
private fun PrintCopiesOption(
    label: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .defaultMinSize(minHeight = 58.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(if (isSelected) Orange50 else Slate50)
            .border(
                width = if (isSelected) 1.5.dp else 1.dp,
                color = if (isSelected) Orange500 else Slate200,
                shape = RoundedCornerShape(12.dp)
            )
            .clickable { onClick() }
            .padding(10.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = label,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = if (isSelected) Orange600 else Slate800
                )
                if (isSelected) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Orange500, modifier = Modifier.size(16.dp))
                }
            }
            Text(text = subtitle, fontSize = 10.sp, color = Slate500)
        }
    }
}
