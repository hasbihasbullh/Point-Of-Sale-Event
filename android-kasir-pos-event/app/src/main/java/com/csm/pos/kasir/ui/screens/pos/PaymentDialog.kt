package com.csm.pos.kasir.ui.screens.pos

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import com.csm.pos.kasir.data.local.ImageStorageManager
import com.csm.pos.kasir.domain.model.PaymentMethod
import com.csm.pos.kasir.ui.components.CurrencyFormatter
import com.csm.pos.kasir.ui.components.VirtualNumpad
import com.csm.pos.kasir.ui.theme.*

@Composable
fun PaymentDialog(
    viewModel: PosViewModel
) {
    val state by viewModel.uiState.collectAsState()
    var isQrisZoomOpen by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = { viewModel.closePaymentDialog() },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 560.dp)
                .fillMaxWidth(0.92f)
                .fillMaxHeight(0.92f)
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White)
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Pembayaran Transaksi", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Slate900)
                        Text("Stan ${state.currentBooth?.nama ?: ""}", fontSize = 12.sp, color = Slate500)
                    }

                    IconButton(onClick = { viewModel.closePaymentDialog() }) {
                        Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Slate500)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Tagihan Box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Orange50)
                        .border(1.dp, Orange200, RoundedCornerShape(16.dp))
                        .padding(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("TOTAL TAGIHAN", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Orange700)
                            Text(CurrencyFormatter.formatIDR(state.totalAmount), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Orange600)
                        }

                        if (state.totalDiscount > 0) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Emerald50)
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text("Hemat ${CurrencyFormatter.formatIDR(state.totalDiscount)}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Emerald600)
                            }
                        }
                    }
                }

                // Compact Voucher Selector in Payment Dialog (Hanya jika stan mengaktifkan voucher)
                if (state.currentBooth?.voucherActive != false) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Emerald50.copy(alpha = 0.7f))
                            .border(1.dp, Emerald200, RoundedCornerShape(12.dp))
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.ConfirmationNumber, contentDescription = null, tint = Emerald600, modifier = Modifier.size(16.dp))
                            Column {
                                Text("Voucher Diskon", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Emerald800)
                                Text("-${CurrencyFormatter.formatIDR(state.voucherNominal.toDouble())}/kupon", fontSize = 10.sp, color = Emerald600)
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            IconButton(
                                onClick = { viewModel.setVoucherCount(state.voucherCount - 1) },
                                modifier = Modifier.size(24.dp),
                                enabled = state.voucherCount > 0
                            ) {
                                Icon(Icons.Default.RemoveCircle, contentDescription = null, tint = if (state.voucherCount > 0) Emerald600 else Slate300)
                            }
                            Text("${state.voucherCount}", fontWeight = FontWeight.ExtraBold, fontSize = 13.sp, color = Emerald800)
                            IconButton(
                                onClick = { viewModel.setVoucherCount(state.voucherCount + 1) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.AddCircle, contentDescription = null, tint = Emerald600)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Payment Method Selector Tabs (Hanya menampilkan metode yang diaktifkan di Admin)
                val availableMethods = remember(state.currentBooth) {
                    val booth = state.currentBooth
                    val list = mutableListOf<Triple<PaymentMethod, String, androidx.compose.ui.graphics.vector.ImageVector>>()
                    if (booth?.payCashActive != false) {
                        list.add(Triple(PaymentMethod.CASH, "TUNAI", Icons.Default.Payments))
                    }
                    if (booth?.payQrisActive != false) {
                        list.add(Triple(PaymentMethod.QRIS, "QRIS", Icons.Default.QrCode))
                    }
                    if (booth?.payEdcActive != false) {
                        list.add(Triple(PaymentMethod.EDC, "EDC", Icons.Default.CreditCard))
                    }
                    if (list.isEmpty()) {
                        list.add(Triple(PaymentMethod.CASH, "TUNAI", Icons.Default.Payments))
                    }
                    list
                }

                // Pastikan jika metode yang terpilih saat ini dinonaktifkan, otomatis alihkan ke metode aktif pertama
                LaunchedEffect(availableMethods) {
                    if (availableMethods.none { it.first == state.paymentMethod }) {
                        viewModel.setPaymentMethod(availableMethods.first().first)
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    availableMethods.forEach { (method, label, icon) ->
                        val isSelected = state.paymentMethod == method
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) Slate900 else Slate100)
                                .clickable { viewModel.setPaymentMethod(method) }
                                .padding(horizontal = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = null,
                                    tint = if (isSelected) Orange500 else Slate600,
                                    modifier = Modifier.size(18.dp)
                                )
                                Text(
                                    text = label,
                                    color = if (isSelected) Color.White else Slate700,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Header Nama Pelanggan & Tombol Pintas Reservasi (Persis seperti Kasir Web)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Nama Pelanggan / No. Meja (Opsional)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate600
                    )

                    val isReservasi = state.customerNameInput.contains("reservasi", ignoreCase = true)
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isReservasi) Orange500 else Slate100)
                            .border(1.dp, if (isReservasi) Orange500 else Slate200, RoundedCornerShape(8.dp))
                            .clickable {
                                val trimmed = state.customerNameInput.trim()
                                if (trimmed.isEmpty()) {
                                    viewModel.onCustomerNameChanged("Reservasi")
                                } else if (trimmed.startsWith("reservasi", ignoreCase = true)) {
                                    val cleaned = trimmed.replace(Regex("(?i)^reservasi\\s*[-–:]*\\s*"), "")
                                    viewModel.onCustomerNameChanged(cleaned)
                                } else {
                                    viewModel.onCustomerNameChanged("Reservasi - $trimmed")
                                }
                            }
                            .padding(horizontal = 8.dp, vertical = 3.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Reservasi",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isReservasi) Color.White else Slate700
                        )
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                OutlinedTextField(
                    value = state.customerNameInput,
                    onValueChange = { viewModel.onCustomerNameChanged(it) },
                    placeholder = { Text("Contoh: Budi / Meja 12...", fontSize = 12.sp) },
                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = Slate400, modifier = Modifier.size(18.dp)) },
                    trailingIcon = {
                        if (state.customerNameInput.isNotEmpty()) {
                            IconButton(onClick = { viewModel.onCustomerNameChanged("") }) {
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

                Spacer(modifier = Modifier.height(14.dp))

                // Payment Form Content
                when (state.paymentMethod) {
                    PaymentMethod.CASH -> {
                        // Quick Cash Buttons
                        val quickAmounts = listOf(
                            state.totalAmount,
                            10000.0,
                            20000.0,
                            50000.0,
                            100000.0
                        ).distinct().filter { it >= state.totalAmount }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            quickAmounts.take(4).forEach { amt ->
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (state.cashReceivedAmount == amt) Orange500 else Slate100)
                                        .clickable { viewModel.onQuickCashSelected(amt) }
                                        .padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = if (amt == state.totalAmount) "Uang Pas" else CurrencyFormatter.formatIDR(amt).replace("Rp ", ""),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (state.cashReceivedAmount == amt) Color.White else Slate700
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Input Box & Kembalian
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Tunai Diterima", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Slate500)
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Slate50)
                                        .border(1.dp, Slate200, RoundedCornerShape(12.dp))
                                        .padding(horizontal = 12.dp),
                                    contentAlignment = Alignment.CenterStart
                                ) {
                                    Text(
                                        text = if (state.cashReceivedInput.isEmpty()) "Rp 0" else CurrencyFormatter.formatIDR(state.cashReceivedAmount),
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 16.sp,
                                        color = Slate900
                                    )
                                }
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text("Kembalian", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Slate500)
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (state.cashChangeAmount > 0) Emerald50 else Slate50)
                                        .border(1.dp, if (state.cashChangeAmount > 0) Emerald500 else Slate200, RoundedCornerShape(12.dp))
                                        .padding(horizontal = 12.dp),
                                    contentAlignment = Alignment.CenterStart
                                ) {
                                    Text(
                                        text = CurrencyFormatter.formatIDR(state.cashChangeAmount),
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 16.sp,
                                        color = if (state.cashChangeAmount > 0) Emerald600 else Slate600
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        VirtualNumpad(
                            onNumberClick = { viewModel.onNumpadClick(it) },
                            onClearClick = { viewModel.onNumpadClear() },
                            onBackspaceClick = { viewModel.onNumpadBackspace() }
                        )
                    }

                    PaymentMethod.QRIS -> {
                        val qrisModel = remember(state.currentBooth?.qrisImagePath) {
                            ImageStorageManager.getImageModel(state.currentBooth?.qrisImagePath)
                        }

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(Slate50)
                                .border(1.dp, Slate200, RoundedCornerShape(16.dp))
                                .padding(16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (qrisModel != null) {
                                    Box(
                                        modifier = Modifier
                                            .size(160.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color.White)
                                            .border(1.5.dp, Orange500, RoundedCornerShape(12.dp))
                                            .clickable { isQrisZoomOpen = true }
                                            .padding(8.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        AsyncImage(
                                            model = qrisModel,
                                            contentDescription = "QRIS ${state.currentBooth?.nama}",
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Fit
                                        )
                                    }

                                    Text(
                                        text = "QRIS ${state.currentBooth?.nama ?: "Stan"}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = Slate900
                                    )

                                    Row(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(Orange50)
                                            .clickable { isQrisZoomOpen = true }
                                            .padding(horizontal = 10.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                                    ) {
                                        Icon(Icons.Default.ZoomIn, contentDescription = null, tint = Orange600, modifier = Modifier.size(16.dp))
                                        Text("Ketuk untuk Perbesar Layar", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Orange600)
                                    }
                                } else {
                                    Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = Orange500, modifier = Modifier.size(56.dp))
                                    Text("QRIS ${state.currentBooth?.nama ?: "Stan"}", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Slate800)
                                    Text(
                                        text = "Gambar QRIS belum diunggah dari Admin Panel. Silakan gunakan QRIS fisik di meja stan.",
                                        fontSize = 11.sp,
                                        color = Slate500,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                    )
                                }
                            }
                        }
                    }

                    PaymentMethod.EDC -> {
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("Pilih Bank Mesin EDC", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate800)

                            val banks = listOf("BCA", "Mandiri", "BRI", "BNI")
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                banks.forEach { bank ->
                                    val isBankSelected = state.edcBank == bank
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .clip(RoundedCornerShape(10.dp))
                                            .background(if (isBankSelected) Orange500 else Slate100)
                                            .clickable { viewModel.onEdcBankChanged(bank) }
                                            .padding(vertical = 10.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(bank, fontWeight = FontWeight.Bold, color = if (isBankSelected) Color.White else Slate700, fontSize = 12.sp)
                                    }
                                }
                            }

                            OutlinedTextField(
                                value = state.noReferensiInput,
                                onValueChange = { viewModel.onNoReferensiChanged(it) },
                                label = { Text("Nomor Approval / Trace No EDC") },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Tombol Checkout dengan Konfirmasi Ganda 3-Detik
                val isCashValid = state.paymentMethod != PaymentMethod.CASH || state.cashReceivedAmount >= state.totalAmount

                Button(
                    onClick = { viewModel.handleConfirmCheckoutClick() },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (state.isConfirmingCheckout) Emerald600 else Orange500
                    ),
                    enabled = isCashValid
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = if (state.isConfirmingCheckout) Icons.Default.Check else Icons.Default.Payment,
                            contentDescription = null
                        )
                        Text(
                            text = if (state.isConfirmingCheckout) "KLIK SEKALI LAGI UNTUK MEMPROSES!" else "PROSES BAYAR & CETAK STRUK",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }

    // Modal Zoom QRIS Fullscreen
    if (isQrisZoomOpen) {
        val qrisZoomModel = ImageStorageManager.getImageModel(state.currentBooth?.qrisImagePath)
        Dialog(onDismissRequest = { isQrisZoomOpen = false }) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.95f)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .padding(20.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Scan QRIS Pembayaran",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 16.sp,
                                color = Slate900
                            )
                            Text(
                                text = "Stan ${state.currentBooth?.nama ?: ""}",
                                fontSize = 12.sp,
                                color = Slate500
                            )
                        }

                        IconButton(onClick = { isQrisZoomOpen = false }) {
                            Icon(Icons.Default.Close, contentDescription = "Tutup", tint = Slate500)
                        }
                    }

                    // Total Tagihan Banner
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Orange50)
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "TOTAL: ${CurrencyFormatter.formatIDR(state.totalAmount)}",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = Orange600
                        )
                    }

                    // QRIS Big Image Box
                    Box(
                        modifier = Modifier
                            .size(280.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White)
                            .border(2.dp, Orange500, RoundedCornerShape(16.dp))
                            .padding(10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (qrisZoomModel != null) {
                            AsyncImage(
                                model = qrisZoomModel,
                                contentDescription = "QRIS Fullscreen",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Fit
                            )
                        }
                    }

                    Text(
                        text = "Tunjukkan barcode ini ke pelanggan untuk di-scan via BCA, GoPay, OVO, Dana, ShopeePay, dll.",
                        fontSize = 11.sp,
                        color = Slate500,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )

                    Button(
                        onClick = { isQrisZoomOpen = false },
                        modifier = Modifier.fillMaxWidth().height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Slate900)
                    ) {
                        Text("Kembali ke Pembayaran", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}
