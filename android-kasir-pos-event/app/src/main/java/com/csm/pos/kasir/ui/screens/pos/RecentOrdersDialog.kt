package com.csm.pos.kasir.ui.screens.pos

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.csm.pos.kasir.ui.components.CurrencyFormatter
import com.csm.pos.kasir.ui.theme.*

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecentOrdersDialog(
    viewModel: PosViewModel
) {
    val state by viewModel.uiState.collectAsState()
    var orderToVoid by remember { mutableStateOf<com.csm.pos.kasir.data.local.dao.OrderWithItems?>(null) }
    var selectedReasonPreset by remember { mutableStateOf("Salah Input Menu") }
    var customReasonText by remember { mutableStateOf("") }
    val reasonPresets = remember {
        listOf("Salah Input Menu", "Pelanggan Membatalkan", "Salah Metode Pembayaran", "Pesanan Ganda", "Lainnya...")
    }

    val todayFormatted = remember {
        try {
            val sdf = SimpleDateFormat("dd MMMM yyyy", Locale("id", "ID"))
            sdf.format(Date())
        } catch (e: Exception) {
            "Hari Ini"
        }
    }

    // --- DIALOG KONFIRMASI VOID DENGAN ALASAN ---
    if (orderToVoid != null) {
        val finalReason = if (selectedReasonPreset == "Lainnya...") {
            customReasonText.trim().ifEmpty { "Lainnya" }
        } else {
            selectedReasonPreset
        }

        AlertDialog(
            onDismissRequest = { 
                orderToVoid = null 
                selectedReasonPreset = "Salah Input Menu"
                customReasonText = ""
            },
            icon = { Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(32.dp)) },
            title = { Text("Batalkan Transaksi (VOID)?", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Pesanan ${orderToVoid!!.order.nomorOrder} sebesar ${CurrencyFormatter.formatIDR(orderToVoid!!.order.total)} akan dibatalkan (VOID) dan status akan dicatat sebagai batal di database server.",
                        fontSize = 12.sp,
                        color = Slate600
                    )

                    Text(
                        text = "Pilih Alasan Pembatalan:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate800
                    )

                    // Preset Chips Flow
                    @OptIn(ExperimentalLayoutApi::class)
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        reasonPresets.forEach { preset ->
                            val isSelected = selectedReasonPreset == preset
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedReasonPreset = preset },
                                label = { Text(preset, fontSize = 11.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFFDC2626),
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }

                    if (selectedReasonPreset == "Lainnya...") {
                        OutlinedTextField(
                            value = customReasonText,
                            onValueChange = { customReasonText = it },
                            placeholder = { Text("Tuliskan alasan spesifik...", fontSize = 12.sp, color = Slate400) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Slate900,
                                unfocusedTextColor = Slate900,
                                focusedBorderColor = Color(0xFFDC2626),
                                unfocusedBorderColor = Slate300,
                                focusedPlaceholderColor = Slate400,
                                unfocusedPlaceholderColor = Slate400,
                                focusedContainerColor = Color.White,
                                unfocusedContainerColor = Slate50
                            )
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val id = orderToVoid!!.order.id
                        viewModel.voidOrder(id, finalReason)
                        orderToVoid = null
                        selectedReasonPreset = "Salah Input Menu"
                        customReasonText = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) {
                    Text("Ya, Batalkan Pesanan", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { 
                    orderToVoid = null 
                    selectedReasonPreset = "Salah Input Menu"
                    customReasonText = ""
                }) {
                    Text("Batal")
                }
            }
        )
    }

    Dialog(
        onDismissRequest = { viewModel.closeRecentOrdersDialog() },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 600.dp)
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
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.ReceiptLong, contentDescription = null, tint = Orange500)
                        Column {
                            val voucherOrderCount = remember(state.recentOrders) {
                                state.recentOrders.count { it.order.diskon > 0 && !it.order.status.equals("VOID", ignoreCase = true) }
                            }
                            Text(
                                text = if (state.showOnlyTodayOrders) "Riwayat Pesanan Hari Ini" else "Semua Riwayat Transaksi",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Slate900
                            )
                            Text(
                                text = buildString {
                                    append("Stan: ${state.currentBooth?.nama ?: "Kasir Stan"} • ${state.recentOrders.size} Transaksi")
                                    if (voucherOrderCount > 0) {
                                        append(" ($voucherOrderCount pakai voucher)")
                                    }
                                },
                                fontSize = 11.sp,
                                color = Slate500
                            )
                        }
                    }

                    IconButton(onClick = { viewModel.closeRecentOrdersDialog() }) {
                        Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Slate500)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Filter Scope Row (Hari Ini vs Semua)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    FilterChip(
                        selected = state.showOnlyTodayOrders,
                        onClick = { viewModel.setShowOnlyTodayOrders(true) },
                        label = { Text("Hari Ini ($todayFormatted)", fontSize = 11.sp, fontWeight = if (state.showOnlyTodayOrders) FontWeight.Bold else FontWeight.Medium) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Orange500,
                            selectedLabelColor = Color.White
                        )
                    )

                    FilterChip(
                        selected = !state.showOnlyTodayOrders,
                        onClick = { viewModel.setShowOnlyTodayOrders(false) },
                        label = { Text("Semua Transaksi", fontSize = 11.sp, fontWeight = if (!state.showOnlyTodayOrders) FontWeight.Bold else FontWeight.Medium) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Slate800,
                            selectedLabelColor = Color.White
                        )
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Search Bar
                OutlinedTextField(
                    value = state.recentOrdersSearchQuery,
                    onValueChange = { viewModel.onRecentOrdersSearchChanged(it) },
                    placeholder = { Text("Cari nomor order / pelanggan / menu / VOID...", fontSize = 12.sp, color = Slate400) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Slate400, modifier = Modifier.size(18.dp)) },
                    trailingIcon = {
                        if (state.recentOrdersSearchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.onRecentOrdersSearchChanged("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Hapus", tint = Slate400, modifier = Modifier.size(16.dp))
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Slate900,
                        unfocusedTextColor = Slate900,
                        focusedBorderColor = Orange500,
                        unfocusedBorderColor = Slate300,
                        focusedPlaceholderColor = Slate400,
                        unfocusedPlaceholderColor = Slate400,
                        focusedContainerColor = Slate50,
                        unfocusedContainerColor = Slate50
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                if (state.filteredRecentOrders.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Slate50),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Receipt, contentDescription = null, tint = Slate300, modifier = Modifier.size(48.dp))
                            Text(
                                text = if (state.recentOrdersSearchQuery.isEmpty()) "Belum ada transaksi hari ini." else "Tidak ada transaksi yang cocok.",
                                fontSize = 13.sp,
                                color = Slate400
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(state.filteredRecentOrders) { orderWithItems ->
                            val order = orderWithItems.order
                            val items = orderWithItems.items
                            val isVoid = order.status.equals("VOID", ignoreCase = true)

                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(if (isVoid) Color(0xFFFFF1F2) else Slate50)
                                    .border(1.dp, if (isVoid) Color(0xFFFECDD3) else Slate200, RoundedCornerShape(16.dp))
                                    .padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Top row: Nomor Order, Status VOID, & Metode Bayar
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        Text(
                                            text = order.nomorOrder,
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 15.sp,
                                            color = if (isVoid) Color(0xFF991B1B) else Slate900,
                                            textDecoration = if (isVoid) TextDecoration.LineThrough else TextDecoration.None
                                        )

                                        if (isVoid) {
                                            // VOID Badge
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(Color(0xFFFEE2E2))
                                                    .border(1.dp, Color(0xFFEF4444), RoundedCornerShape(6.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Text(
                                                    text = "BATAL (VOID)",
                                                    fontSize = 10.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = Color(0xFFDC2626)
                                                )
                                            }
                                        }

                                        // Payment Badge
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(
                                                    when (order.metodeBayar) {
                                                        "CASH" -> Emerald50
                                                        "QRIS" -> Color(0xFFFAF5FF)
                                                        else -> Color(0xFFEEF2FF)
                                                    }
                                                )
                                                .border(
                                                    1.dp,
                                                    when (order.metodeBayar) {
                                                        "CASH" -> Emerald500
                                                        "QRIS" -> Color(0xFFA855F7)
                                                        else -> Color(0xFF6366F1)
                                                    },
                                                    RoundedCornerShape(6.dp)
                                                )
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = order.metodeBayar,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = when (order.metodeBayar) {
                                                    "CASH" -> Emerald600
                                                    "QRIS" -> Color(0xFF7E22CE)
                                                    else -> Color(0xFF4338CA)
                                                }
                                            )
                                        }

                                        // Voucher Badge
                                        if (order.diskon > 0) {
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(Emerald50)
                                                    .border(1.dp, Emerald500, RoundedCornerShape(6.dp))
                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                                                ) {
                                                    Icon(Icons.Default.ConfirmationNumber, contentDescription = null, tint = Emerald600, modifier = Modifier.size(10.dp))
                                                    Text(
                                                        text = "Voucher -${CurrencyFormatter.formatIDR(order.diskon)}",
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = Emerald700
                                                    )
                                                }
                                            }
                                        }
                                    }

                                    Text(
                                        text = order.createdAt.replace("T", " ").takeLast(8),
                                        fontSize = 11.sp,
                                        color = Slate500
                                    )
                                }

                                // Customer name (if any)
                                if (!order.namaPelanggan.isNullOrBlank()) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(Icons.Default.Person, contentDescription = null, tint = Slate400, modifier = Modifier.size(14.dp))
                                        Text("Pelanggan: ${order.namaPelanggan}", fontSize = 12.sp, color = Slate700, fontWeight = FontWeight.SemiBold)
                                    }
                                }

                                // Void Reason Banner (if VOID and has reason)
                                if (isVoid && !order.alasanVoid.isNullOrBlank()) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(Color(0xFFFFE4E6))
                                            .padding(horizontal = 8.dp, vertical = 4.dp)
                                    ) {
                                        Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFFE11D48), modifier = Modifier.size(13.dp))
                                        Text(
                                            text = "Alasan Batal: ${order.alasanVoid}",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color(0xFF9F1239)
                                        )
                                    }
                                }

                                // Items summary
                                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                    items.forEach { itm ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text(
                                                text = "${itm.qty}x ${itm.namaItem}",
                                                fontSize = 12.sp,
                                                color = if (isVoid) Slate400 else Slate600,
                                                textDecoration = if (isVoid) TextDecoration.LineThrough else TextDecoration.None
                                            )
                                            Text(
                                                text = CurrencyFormatter.formatIDR(itm.harga * itm.qty),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = if (isVoid) Slate400 else Slate700,
                                                textDecoration = if (isVoid) TextDecoration.LineThrough else TextDecoration.None
                                            )
                                        }
                                    }
                                }

                                HorizontalDivider(color = if (isVoid) Color(0xFFFECDD3) else Slate200, thickness = 1.dp)

                                // Bottom Row: Total & Action Buttons
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = if (isVoid) "TOTAL (DIBATALKAN)" else "TOTAL TAGIHAN",
                                            fontSize = 10.sp,
                                            color = if (isVoid) Color(0xFFDC2626) else Slate400,
                                            fontWeight = FontWeight.Bold
                                        )
                                        if (order.diskon > 0) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                Text(
                                                    text = CurrencyFormatter.formatIDR(order.total + order.diskon),
                                                    fontSize = 11.sp,
                                                    color = Slate400,
                                                    textDecoration = TextDecoration.LineThrough
                                                )
                                                Text(
                                                    text = "(-${CurrencyFormatter.formatIDR(order.diskon)})",
                                                    fontSize = 10.sp,
                                                    color = Emerald600,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                Text(
                                                    text = CurrencyFormatter.formatIDR(order.total),
                                                    fontSize = 15.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = if (isVoid) Color(0xFFDC2626) else Orange600,
                                                    textDecoration = if (isVoid) TextDecoration.LineThrough else TextDecoration.None
                                                )
                                            }
                                        } else {
                                            Text(
                                                text = CurrencyFormatter.formatIDR(order.total),
                                                fontSize = 15.sp,
                                                fontWeight = FontWeight.ExtraBold,
                                                color = if (isVoid) Color(0xFFDC2626) else Orange600,
                                                textDecoration = if (isVoid) TextDecoration.LineThrough else TextDecoration.None
                                            )
                                        }
                                    }

                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                        // Tombol Void (hanya jika order belum void)
                                        if (!isVoid) {
                                            OutlinedButton(
                                                onClick = { orderToVoid = orderWithItems },
                                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626)),
                                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFCA5A5)),
                                                shape = RoundedCornerShape(10.dp),
                                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                                modifier = Modifier.height(34.dp)
                                            ) {
                                                Icon(Icons.Default.DeleteOutline, contentDescription = null, modifier = Modifier.size(14.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Void", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }

                                        // Tombol Cetak Struk
                                        Button(
                                            onClick = {
                                                state.deviceConfig?.printerMacAddress?.let { mac ->
                                                    viewModel.printReceipt(mac, orderWithItems)
                                                } ?: viewModel.openBluetoothPicker()
                                            },
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = if (isVoid) Slate700 else Slate900
                                            ),
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                            modifier = Modifier.height(34.dp)
                                        ) {
                                            Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(14.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = if (isVoid) "Struk Void" else "Cetak Struk",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold
                                            )
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
}
