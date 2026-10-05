package com.csm.pos.kasir.ui.screens.setup

import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.csm.pos.kasir.data.local.entity.BoothEntity
import com.csm.pos.kasir.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SetupBoothScreen(
    viewModel: SetupViewModel,
    onBoothLockedSuccess: () -> Unit,
    onNavigateBack: (() -> Unit)? = null
) {
    val state by viewModel.uiState.collectAsState()

    if (state.isBoothLocked && onNavigateBack != null) {
        BackHandler(onBack = onNavigateBack)
    }

    // Dialog Input PIN Supervisor untuk Membuka Kunci Stan
    if (state.isPinPromptOpen) {
        AlertDialog(
            onDismissRequest = { viewModel.closePinPrompt() },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Security, contentDescription = null, tint = Orange500)
                    Text("PIN Supervisor", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Masukkan PIN Supervisor untuk membuka kunci stan ${state.selectedBooth?.nama ?: ""} dan mengganti konfigurasi.",
                        fontSize = 13.sp,
                        color = Slate600
                    )
                    OutlinedTextField(
                        value = state.enteredPin,
                        onValueChange = { viewModel.onEnteredPinChanged(it) },
                        label = { Text("PIN Supervisor") },
                        placeholder = { Text("4-digit PIN") },
                        visualTransformation = PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Slate900,
                            unfocusedTextColor = Slate900,
                            focusedBorderColor = Orange500,
                            unfocusedBorderColor = Slate300,
                            focusedLabelColor = Orange600,
                            unfocusedLabelColor = Slate500,
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White
                        )
                    )
                    if (state.pinErrorMessage != null) {
                        Text(
                            text = state.pinErrorMessage!!,
                            color = Rose600,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.verifyPinAndUnlock() },
                    colors = ButtonDefaults.buttonColors(containerColor = Orange500),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Buka Kunci", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { viewModel.closePinPrompt() },
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Batal")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Pengaturan Terminal Kasir", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        val eventSubtitle = buildString {
                            append(state.eventSetting?.namaEvent?.ifBlank { "Point of Sale Ecosystem" } ?: "Point of Sale Ecosystem")
                            if (!state.eventSetting?.areaLokasi.isNullOrBlank()) {
                                append(" • ${state.eventSetting!!.areaLokasi}")
                            }
                        }
                        Text(eventSubtitle, fontSize = 12.sp, color = Slate400)
                    }
                },
                navigationIcon = {
                    if (state.isBoothLocked && onNavigateBack != null) {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Kembali ke Kasir", tint = Color.White)
                        }
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
                    // --- TABLET / LANDSCAPE: 2 KOLOM BERDAMPINGAN ---
                    Row(
                        modifier = Modifier
                            .widthIn(max = 1040.dp)
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Kolom Kiri (44%): Server Connection & Animated Sync Progress
                        Box(modifier = Modifier.weight(0.44f).fillMaxHeight()) {
                            ServerConnectionCard(
                                state = state,
                                viewModel = viewModel,
                                modifier = Modifier.fillMaxSize()
                            )
                        }

                        // Kolom Kanan (56%): Booth Locked State & Booth List
                        Box(modifier = Modifier.weight(0.56f).fillMaxHeight()) {
                            BoothConfigCard(
                                state = state,
                                viewModel = viewModel,
                                onBoothLockedSuccess = onBoothLockedSuccess,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                } else {
                    // --- SMARTPHONE MODE: SINGLE VERTICAL COLUMN ---
                    Column(
                        modifier = Modifier
                            .widthIn(max = 540.dp)
                            .fillMaxSize()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        ServerConnectionCard(
                            state = state,
                            viewModel = viewModel,
                            modifier = Modifier.fillMaxWidth()
                        )

                        BoothConfigCard(
                            state = state,
                            viewModel = viewModel,
                            onBoothLockedSuccess = onBoothLockedSuccess,
                            modifier = Modifier.fillMaxWidth().weight(1f)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Komponen Card 1: Sambungkan ke Server Lokal & Multi-Step Animated Progress
 */
@Composable
private fun ServerConnectionCard(
    state: SetupUiState,
    viewModel: SetupViewModel,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Orange50),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Lan, contentDescription = null, tint = Orange600, modifier = Modifier.size(18.dp))
                }
                Column {
                    Text("1. Sambungkan ke Server Lokal", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Slate900)
                    Text("IP Backend Event (WiFi/LAN Lokal)", fontSize = 11.sp, color = Slate500)
                }
            }

            OutlinedTextField(
                value = state.serverUrl,
                onValueChange = { viewModel.onServerUrlChanged(it) },
                label = { Text("Alamat IP Server") },
                placeholder = { Text("http://192.168.1.100:3000") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Dns, contentDescription = null, tint = Orange500, modifier = Modifier.size(20.dp)) },
                enabled = !state.isLoading,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Slate900,
                    unfocusedTextColor = Slate900,
                    focusedBorderColor = Orange500,
                    unfocusedBorderColor = Slate300,
                    focusedLabelColor = Orange600,
                    unfocusedLabelColor = Slate500,
                    focusedPlaceholderColor = Slate400,
                    unfocusedPlaceholderColor = Slate400,
                    focusedContainerColor = Slate50,
                    unfocusedContainerColor = Slate50
                )
            )

            Button(
                onClick = { viewModel.fetchMasterDataFromServer() },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Orange500),
                enabled = !state.isLoading
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Mengunduh...", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                } else {
                    Icon(Icons.Default.CloudDownload, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Unduh & Sinkron Data Booth / Menu", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }

            // --- MULTI-STEP ANIMATED PROGRESS CARD ---
            AnimatedVisibility(
                visible = state.syncStatus != SyncStatus.IDLE,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            when (state.syncStatus) {
                                SyncStatus.SUCCESS -> Emerald50
                                SyncStatus.FAILED -> Rose50
                                else -> Slate50
                            }
                        )
                        .border(
                            width = 1.dp,
                            color = when (state.syncStatus) {
                                SyncStatus.SUCCESS -> Emerald200
                                SyncStatus.FAILED -> Rose200
                                else -> Slate200
                            },
                            shape = RoundedCornerShape(14.dp)
                        )
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = when (state.syncStatus) {
                                SyncStatus.CONNECTING -> "Menghubungkan ke Server..."
                                SyncStatus.FETCHING_BOOTHS -> "Mengunduh Daftar Stan..."
                                SyncStatus.FETCHING_MENUS -> "Mengunduh Katalog Menu..."
                                SyncStatus.SAVING -> "Menyimpan ke Database HP..."
                                SyncStatus.SUCCESS -> "Sinkronisasi Selesai!"
                                SyncStatus.FAILED -> "Sinkronisasi Gagal"
                                else -> "Sinkronisasi Data"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = when (state.syncStatus) {
                                SyncStatus.SUCCESS -> Emerald700
                                SyncStatus.FAILED -> Rose700
                                else -> Slate800
                            }
                        )

                        Text(
                            text = "${(state.syncProgress * 100).toInt()}%",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 12.sp,
                            color = when (state.syncStatus) {
                                SyncStatus.SUCCESS -> Emerald700
                                SyncStatus.FAILED -> Rose700
                                else -> Orange600
                            }
                        )
                    }

                    LinearProgressIndicator(
                        progress = { state.syncProgress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = when (state.syncStatus) {
                            SyncStatus.SUCCESS -> Emerald600
                            SyncStatus.FAILED -> Rose600
                            else -> Orange500
                        },
                        trackColor = Slate200
                    )

                    // Step Status Items
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        SyncStepItem(label = "1. Koneksi Server Backend", isDone = state.syncProgress >= 0.2f, isFailed = state.syncStatus == SyncStatus.FAILED && state.syncProgress < 0.5f)
                        SyncStepItem(label = "2. Unduh Data Stan / Booth", isDone = state.syncProgress >= 0.5f, isFailed = state.syncStatus == SyncStatus.FAILED && state.syncProgress < 0.8f)
                        SyncStepItem(label = "3. Unduh Katalog Menu & Harga", isDone = state.syncProgress >= 0.8f, isFailed = state.syncStatus == SyncStatus.FAILED && state.syncProgress < 0.95f)
                        SyncStepItem(label = "4. Simpan Database Offline", isDone = state.syncProgress >= 0.95f, isFailed = state.syncStatus == SyncStatus.FAILED && state.syncProgress >= 0.95f)
                    }

                    if (state.syncSummary != null) {
                        Text(
                            text = state.syncSummary!!,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = Emerald700
                        )
                    }

                    if (state.errorMessage != null) {
                        Text(
                            text = state.errorMessage!!,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Rose600
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SyncStepItem(label: String, isDone: Boolean, isFailed: Boolean = false) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(
            imageVector = when {
                isFailed -> Icons.Default.Cancel
                isDone -> Icons.Default.CheckCircle
                else -> Icons.Default.RadioButtonUnchecked
            },
            contentDescription = null,
            tint = when {
                isFailed -> Rose600
                isDone -> Emerald600
                else -> Slate400
            },
            modifier = Modifier.size(14.dp)
        )
        Text(
            text = label,
            fontSize = 11.sp,
            color = when {
                isFailed -> Rose600
                isDone -> Slate800
                else -> Slate400
            },
            fontWeight = if (isDone || isFailed) FontWeight.SemiBold else FontWeight.Normal
        )
    }
}

/**
 * Komponen Card 2: Konfigurasi Booth & Kunci Terminal
 */
@Composable
private fun BoothConfigCard(
    state: SetupUiState,
    viewModel: SetupViewModel,
    onBoothLockedSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f, fill = false)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(Orange50),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Storefront, contentDescription = null, tint = Orange600, modifier = Modifier.size(18.dp))
                    }
                    Column {
                        Text("2. Konfigurasi Booth Terminal", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Slate900)
                        Text("Kunci HP/Tablet ke stan yang bertugas", fontSize = 11.sp, color = Slate500)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (state.isBoothLocked && state.selectedBooth != null) {
                    // --- TAMPILAN STATUS TERKUNCI ---
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Orange50)
                            .border(1.dp, Orange200, RoundedCornerShape(16.dp))
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = Orange600)
                            Text("Perangkat Sedang Terkunci", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Orange700)
                        }

                        Text("Stan Aktif:", fontSize = 11.sp, color = Slate500)
                        Text(
                            text = "[${state.selectedBooth!!.kode}] ${state.selectedBooth!!.nama}",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = Slate900
                        )

                        OutlinedButton(
                            onClick = { viewModel.openPinPrompt() },
                            modifier = Modifier.fillMaxWidth().height(44.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Rose600),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Rose200)
                        ) {
                            Icon(Icons.Default.LockOpen, contentDescription = null, modifier = Modifier.size(16.dp), tint = Rose600)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Buka Kunci / Ganti Booth (Butuh PIN)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                } else if (state.availableBooths.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(160.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Belum ada data booth.\nSilakan unduh data server di sebelah kiri.",
                            color = Slate400,
                            fontSize = 12.sp,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                } else {
                    // --- DAFTAR BOOTH UNTUK DIPILIH ---
                    Text("Pilih salah satu stan festival:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Slate700)
                    Spacer(modifier = Modifier.height(6.dp))

                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 280.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(state.availableBooths) { booth ->
                            val isSelected = state.selectedBooth?.id == booth.id
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (isSelected) Orange50 else Slate50)
                                    .border(
                                        width = if (isSelected) 1.5.dp else 1.dp,
                                        color = if (isSelected) Orange500 else Slate200,
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    .clickable { viewModel.onBoothSelected(booth) }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isSelected) Orange500 else Slate200)
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = booth.kode,
                                            fontWeight = FontWeight.ExtraBold,
                                            color = if (isSelected) Color.White else Slate700,
                                            fontSize = 11.sp
                                        )
                                    }
                                    Text(
                                        text = booth.nama,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate800,
                                        fontSize = 13.sp
                                    )
                                }

                                if (isSelected) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Orange500, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action Button Bawah
            if (state.isBoothLocked && state.selectedBooth != null) {
                Button(
                    onClick = onBoothLockedSuccess,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Orange500)
                ) {
                    Icon(Icons.Default.Storefront, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Buka Layar Kasir POS", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            } else {
                Button(
                    onClick = { viewModel.lockSelectedBooth(onBoothLockedSuccess) },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Slate900,
                        contentColor = Color.White,
                        disabledContainerColor = Slate200,
                        disabledContentColor = Slate500
                    ),
                    enabled = state.selectedBooth != null
                ) {
                    Icon(Icons.Default.Lock, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (state.selectedBooth != null) "Kunci ke [${state.selectedBooth!!.kode}] & Mulai Kasir" else "Pilih Booth Terlebih Dahulu",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}
