package com.csm.pos.kasir.ui.screens.report

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.csm.pos.kasir.domain.model.BoothReport
import com.csm.pos.kasir.domain.model.TopMenuItemReport
import com.csm.pos.kasir.ui.components.CurrencyFormatter
import com.csm.pos.kasir.ui.theme.*

import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BoothReportScreen(
    viewModel: BoothReportViewModel,
    onNavigateBack: () -> Unit
) {
    BackHandler(onBack = onNavigateBack)

    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val report = state.report

    // --- MATERIAL 3 DATE PICKER DIALOG ---
    if (state.isDatePickerOpen) {
        val initialMillis = remember(state.selectedDate) {
            try {
                val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
                val date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(state.selectedDate)
                if (date != null) cal.time = date
                cal.timeInMillis
            } catch (e: Exception) {
                System.currentTimeMillis()
            }
        }
        val datePickerState = rememberDatePickerState(initialSelectedDateMillis = initialMillis)

        DatePickerDialog(
            onDismissRequest = { viewModel.closeDatePicker() },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
                        cal.timeInMillis = millis
                        val formatted = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(cal.time)
                        viewModel.selectDate(formatted)
                    }
                }) {
                    Text("Pilih Tanggal", fontWeight = FontWeight.Bold, color = Orange600)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.closeDatePicker() }) {
                    Text("Batal")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Laporan Penjualan Stan", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                        Text(
                            text = if (report != null) "Stan: ${report.boothNama}" else "Rekap Shift",
                            fontSize = 12.sp,
                            color = Slate400
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadReport() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Muat Ulang", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Slate900,
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Slate50
    ) { padding ->
        if (state.isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Orange500)
            }
        } else if (report == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text("Tidak ada data laporan untuk stan ini.", color = Slate500)
            }
        } else {
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                val isTablet = maxWidth >= 600.dp

                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.TopCenter
                ) {
                    if (isTablet) {
                        // --- TABLET / LANDSCAPE: EXECUTIVE ANALYTICS DASHBOARD ---
                        LazyColumn(
                            modifier = Modifier
                                .widthIn(max = 1040.dp)
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            // Row 1: Filter Tanggal & Downstream Sync
                            item {
                                DateFilterBanner(
                                    state = state,
                                    viewModel = viewModel
                                )
                            }

                            // Row 2: Omzet KPI Card (Full Width)
                            item {
                                RevenueKpiCard(report = report, isToday = state.isToday)
                            }

                            // Row 3: Kartu Metode Bayar Dinamis (Hanya metode aktif: Cash | QRIS | EDC)
                            item {
                                val activeCount = listOf(report.isCashActive, report.isQrisActive, report.isEdcActive).count { it }
                                Text("Rincian Pembayaran Masuk", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Slate800)
                                Spacer(modifier = Modifier.height(8.dp))
                                if (activeCount > 0) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        if (report.isCashActive) {
                                            PaymentMethodCard(
                                                title = "Uang Tunai (Cash)",
                                                amount = report.cashTotal,
                                                icon = Icons.Default.Payments,
                                                tintColor = Orange600,
                                                bgColor = Orange50,
                                                modifier = Modifier.weight(1f)
                                            )
                                        }
                                        if (report.isQrisActive) {
                                            PaymentMethodCard(
                                                title = "QRIS Statis",
                                                amount = report.qrisTotal,
                                                icon = Icons.Default.QrCode,
                                                tintColor = Sky600,
                                                bgColor = Sky50,
                                                modifier = Modifier.weight(1f)
                                            )
                                        }
                                        if (report.isEdcActive) {
                                            PaymentMethodCard(
                                                title = "Mesin EDC",
                                                amount = report.edcTotal,
                                                icon = Icons.Default.CreditCard,
                                                tintColor = Color(0xFF9333EA),
                                                bgColor = Color(0xFFF3E8FF),
                                                modifier = Modifier.weight(1f)
                                            )
                                        }
                                    }
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color.White)
                                            .border(1.dp, Slate200, RoundedCornerShape(12.dp))
                                            .padding(16.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("Tidak ada metode pembayaran aktif untuk stan ini.", color = Slate400, fontSize = 12.sp)
                                    }
                                }
                            }

                            // Row 4: 2 Kolom Seimbang (Kiri: Top Menu Terlaris, Kanan: Shift Actions)
                            item {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                                    verticalAlignment = Alignment.Top
                                ) {
                                    // Kolom Kiri: Top Selling Items
                                    Box(modifier = Modifier.weight(1.1f)) {
                                        TopItemsCard(topItems = report.topItems)
                                    }

                                    // Kolom Kanan: Actions & Summary
                                    Box(modifier = Modifier.weight(0.9f)) {
                                        ShiftActionsCard(
                                            report = report,
                                            onPrintClosing = { viewModel.printClosingReport() },
                                            onShareWhatsApp = { viewModel.shareReportViaWhatsApp(context) }
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        // --- SMARTPHONE MODE: SINGLE VERTICAL LIST ---
                        LazyColumn(
                            modifier = Modifier
                                .widthIn(max = 540.dp)
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            item {
                                DateFilterBanner(
                                    state = state,
                                    viewModel = viewModel
                                )
                            }

                            item {
                                RevenueKpiCard(report = report, isToday = state.isToday)
                            }

                            item {
                                val activeCount = listOf(report.isCashActive, report.isQrisActive, report.isEdcActive).count { it }
                                Text("Rincian Pembayaran Masuk", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Slate800)
                                Spacer(modifier = Modifier.height(6.dp))
                                if (activeCount > 0) {
                                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                        if (report.isCashActive) {
                                            PaymentMethodCard(
                                                title = "Uang Tunai (Cash)",
                                                amount = report.cashTotal,
                                                icon = Icons.Default.Payments,
                                                tintColor = Orange600,
                                                bgColor = Orange50,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                        }
                                        if (report.isQrisActive) {
                                            PaymentMethodCard(
                                                title = "QRIS Statis",
                                                amount = report.qrisTotal,
                                                icon = Icons.Default.QrCode,
                                                tintColor = Sky600,
                                                bgColor = Sky50,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                        }
                                        if (report.isEdcActive) {
                                            PaymentMethodCard(
                                                title = "Mesin EDC",
                                                amount = report.edcTotal,
                                                icon = Icons.Default.CreditCard,
                                                tintColor = Color(0xFF9333EA),
                                                bgColor = Color(0xFFF3E8FF),
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                        }
                                    }
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color.White)
                                            .border(1.dp, Slate200, RoundedCornerShape(12.dp))
                                            .padding(14.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("Tidak ada metode pembayaran aktif untuk stan ini.", color = Slate400, fontSize = 12.sp)
                                    }
                                }
                            }

                            if (report.topItems.isNotEmpty()) {
                                item {
                                    TopItemsCard(topItems = report.topItems)
                                }
                            }

                            item {
                                ShiftActionsCard(
                                    report = report,
                                    onPrintClosing = { viewModel.printClosingReport() },
                                    onShareWhatsApp = { viewModel.shareReportViaWhatsApp(context) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Filter Tanggal Interaktif & Status Sinkronisasi Server
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateFilterBanner(
    state: BoothReportUiState,
    viewModel: BoothReportViewModel
) {
    val report = state.report
    val formattedDisplayDate = remember(state.selectedDate) {
        try {
            val parsed = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(state.selectedDate)
            if (parsed != null) {
                SimpleDateFormat("EEEE, dd MMMM yyyy", Locale("id", "ID")).format(parsed)
            } else {
                state.selectedDate
            }
        } catch (e: Exception) {
            state.selectedDate
        }
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Row 1: Header Tanggal Terpilih & Status Sync Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Default.CalendarMonth, contentDescription = null, tint = Orange600, modifier = Modifier.size(18.dp))
                    Text(
                        text = formattedDisplayDate,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = Slate800
                    )
                }

                if (report != null) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (report.pendingSyncCount == 0) Emerald50 else Color(0xFFFFFBEB))
                            .border(1.dp, if (report.pendingSyncCount == 0) Emerald500 else Color(0xFFF59E0B), RoundedCornerShape(8.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = if (report.pendingSyncCount == 0) "100% Tersinkron" else "${report.pendingSyncCount} Tertunda",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (report.pendingSyncCount == 0) Emerald600 else Color(0xFFD97706)
                        )
                    }
                }
            }

            // Row 2: Quick Filter Chips & Sync Downstream Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Chip Hari Ini
                FilterChip(
                    selected = state.isToday,
                    onClick = { viewModel.selectToday() },
                    label = { Text("Hari Ini", fontSize = 12.sp, fontWeight = if (state.isToday) FontWeight.Bold else FontWeight.Medium) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Orange500,
                        selectedLabelColor = Color.White
                    )
                )

                // Chip Kemarin
                FilterChip(
                    selected = state.isYesterday,
                    onClick = { viewModel.selectYesterday() },
                    label = { Text("Kemarin", fontSize = 12.sp, fontWeight = if (state.isYesterday) FontWeight.Bold else FontWeight.Medium) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Orange500,
                        selectedLabelColor = Color.White
                    )
                )

                // Tombol Kalender
                ElevatedButton(
                    onClick = { viewModel.openDatePicker() },
                    colors = ButtonDefaults.elevatedButtonColors(
                        containerColor = if (!state.isToday && !state.isYesterday) Orange500 else Slate100,
                        contentColor = if (!state.isToday && !state.isYesterday) Color.White else Slate800
                    ),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                    modifier = Modifier.height(34.dp)
                ) {
                    Icon(Icons.Default.Event, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (!state.isToday && !state.isYesterday) state.selectedDate else "Kalender",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.weight(1f))

                // Tombol & Menu Tarik Data Server
                var isSyncMenuOpen by remember { mutableStateOf(false) }

                Box {
                    IconButton(
                        onClick = { isSyncMenuOpen = true },
                        enabled = !state.isSyncingServer,
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(Slate100)
                            .border(1.dp, Slate300, RoundedCornerShape(10.dp))
                            .size(34.dp)
                    ) {
                        if (state.isSyncingServer) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Orange600)
                        } else {
                            Icon(Icons.Default.CloudDownload, contentDescription = "Tarik Data Server", tint = Slate700, modifier = Modifier.size(18.dp))
                        }
                    }

                    DropdownMenu(
                        expanded = isSyncMenuOpen,
                        onDismissRequest = { isSyncMenuOpen = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Tarik Data Tanggal Ini (${state.selectedDate})", fontSize = 12.sp) },
                            leadingIcon = { Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp)) },
                            onClick = {
                                isSyncMenuOpen = false
                                viewModel.fetchServerOrdersForCurrentDate()
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Tarik Semua Tanggal (Seluruh Riwayat Stan)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Orange600) },
                            leadingIcon = { Icon(Icons.Default.CloudDownload, contentDescription = null, tint = Orange600, modifier = Modifier.size(16.dp)) },
                            onClick = {
                                isSyncMenuOpen = false
                                viewModel.fetchServerOrdersForAllDates()
                            }
                        )
                    }
                }
            }

            // Pesan Hasil Sinkronisasi Server
            if (!state.syncServerMessage.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (state.syncServerMessage!!.contains("Sukses")) Emerald50 else Color(0xFFFEF2F2))
                        .border(1.dp, if (state.syncServerMessage!!.contains("Sukses")) Emerald500 else Color(0xFFEF4444), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = state.syncServerMessage!!,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (state.syncServerMessage!!.contains("Sukses")) Emerald700 else Color(0xFFB91C1C)
                    )
                }
            }
        }
    }
}

/**
 * Card Omzet KPI Utama
 */
@Composable
private fun RevenueKpiCard(report: BoothReport, isToday: Boolean) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Slate900),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (isToday) "TOTAL OMZET HARI INI" else "TOTAL OMZET (${report.dateString})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Orange500
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Slate800)
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text("${report.totalTransactions} Transaksi", fontSize = 11.sp, color = Color.White, fontWeight = FontWeight.SemiBold)
                }
            }

            Text(
                text = CurrencyFormatter.formatIDR(report.totalRevenue),
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )

            HorizontalDivider(color = Slate800)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Menu Terjual", fontSize = 11.sp, color = Slate400)
                    Text("${report.totalItemsSold} Porsi/Cup", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 13.sp)
                }
                if (report.totalDiskon > 0) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Total Diskon Voucher", fontSize = 11.sp, color = Emerald500)
                        Text("-${CurrencyFormatter.formatIDR(report.totalDiskon)}", fontWeight = FontWeight.Bold, color = Emerald500, fontSize = 13.sp)
                    }
                }
            }

            // Baris Rekapitulasi Reservasi (Jika Ada)
            if (report.reservasiCount > 0) {
                HorizontalDivider(color = Slate800)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.BookmarkBorder, contentDescription = null, tint = Orange400, modifier = Modifier.size(14.dp))
                        Text(
                            text = "${report.reservasiCount} Pesanan Reservasi",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Orange300
                        )
                    }
                    Text(
                        text = CurrencyFormatter.formatIDR(report.reservasiTotalAmount),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            if (report.voidedTransactionsCount > 0) {
                HorizontalDivider(color = Slate800)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.Cancel, contentDescription = null, tint = Color(0xFFF87171), modifier = Modifier.size(14.dp))
                        Text(
                            text = "${report.voidedTransactionsCount} Transaksi Dibatalkan (VOID)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFFF87171)
                        )
                    }
                    Text(
                        text = "-${CurrencyFormatter.formatIDR(report.totalVoidedAmount)}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFCA5A5)
                    )
                }
            }
        }
    }
}

/**
 * Card Rincian Metode Pembayaran
 */
@Composable
private fun PaymentMethodCard(
    title: String,
    amount: Double,
    icon: ImageVector,
    tintColor: Color,
    bgColor: Color,
    subtitle: String? = null,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .border(1.dp, Slate200, RoundedCornerShape(16.dp))
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(bgColor),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = tintColor, modifier = Modifier.size(18.dp))
            }
            Column {
                Text(title, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate900)
                if (!subtitle.isNullOrBlank()) {
                    Text(subtitle, fontSize = 10.sp, color = Slate500)
                }
            }
        }

        Text(
            text = CurrencyFormatter.formatIDR(amount),
            fontWeight = FontWeight.ExtraBold,
            fontSize = 14.sp,
            color = tintColor
        )
    }
}

/**
 * Card Menu Terlaris Hari Ini
 */
@Composable
private fun TopItemsCard(topItems: List<TopMenuItemReport>, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(Orange50),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.EmojiEvents, contentDescription = null, tint = Orange600, modifier = Modifier.size(16.dp))
                }
                Text("Menu Terlaris Hari Ini", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Slate800)
            }

            if (topItems.isEmpty()) {
                Text("Belum ada penjualan menu hari ini.", color = Slate400, fontSize = 12.sp, modifier = Modifier.padding(vertical = 12.dp))
            } else {
                topItems.forEachIndexed { idx, item ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(22.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (idx) {
                                            0 -> Orange500
                                            1 -> Slate300
                                            2 -> Color(0xFFD97706)
                                            else -> Slate200
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${idx + 1}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = if (idx == 0 || idx == 2) Color.White else Slate700
                                )
                            }
                            Text(item.nama, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Slate800)
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("${item.qty}x", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Orange600)
                            Text(CurrencyFormatter.formatIDR(item.totalRevenue), fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate900)
                        }
                    }
                    if (idx < topItems.size - 1) {
                        HorizontalDivider(color = Slate100)
                    }
                }
            }
        }
    }
}

/**
 * Card Aksi & Kontrol Closing Shift
 */
@Composable
private fun ShiftActionsCard(
    report: BoothReport,
    onPrintClosing: () -> Unit,
    onShareWhatsApp: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(Slate100),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.AssignmentTurnedIn, contentDescription = null, tint = Slate700, modifier = Modifier.size(16.dp))
                }
                Text("Aksi Rekap & Validasi Shift", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Slate800)
            }

            Text(
                text = "Cetak struk penutupan kasir atau kirim ringkasan omzet langsung ke supervisor stan.",
                fontSize = 12.sp,
                color = Slate500
            )

            Spacer(modifier = Modifier.height(4.dp))

            Button(
                onClick = onPrintClosing,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Slate900)
            ) {
                Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Cetak Struk Rekap Shift (Z-Report)", fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }

            OutlinedButton(
                onClick = onShareWhatsApp,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Emerald600),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Emerald600)
            ) {
                Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Bagikan Rekap ke WhatsApp Supervisor", fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
    }
}
