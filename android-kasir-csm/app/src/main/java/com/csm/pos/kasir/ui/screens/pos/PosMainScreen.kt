package com.csm.pos.kasir.ui.screens.pos

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.csm.pos.kasir.ui.components.CategoryPills
import com.csm.pos.kasir.ui.components.CurrencyFormatter
import com.csm.pos.kasir.ui.components.FoodItemCard
import com.csm.pos.kasir.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PosMainScreen(
    viewModel: PosViewModel,
    onNavigateToReport: () -> Unit,
    onNavigateToSetup: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    // Ambil daftar kategori unik
    val categories = remember(state.menuItems) {
        listOf("Semua") + state.menuItems.map { it.kategori }.distinct()
    }

    val layoutDirection = LocalLayoutDirection.current
    val statusBarTop = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val cutoutInsets = WindowInsets.displayCutout.asPaddingValues()
    val navBarInsets = WindowInsets.navigationBars.asPaddingValues()

    // Inset pengaman agar tidak pernah bertabrakan dengan status bar / kamera punch hole / nav bar landscape
    val topSafePadding = if (statusBarTop > 0.dp) statusBarTop + 6.dp else 26.dp
    val startSafePadding = maxOf(
        cutoutInsets.calculateStartPadding(layoutDirection),
        navBarInsets.calculateStartPadding(layoutDirection),
        16.dp
    )
    val endSafePadding = maxOf(
        cutoutInsets.calculateEndPadding(layoutDirection),
        navBarInsets.calculateEndPadding(layoutDirection),
        16.dp
    )

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val isTablet = maxWidth >= 600.dp

        Scaffold(
            topBar = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate900)
                        .padding(
                            start = startSafePadding,
                            end = endSafePadding,
                            top = topSafePadding,
                            bottom = 10.dp
                        )
                ) {
                    // Top Row: Stan Badge, Status Sync, & Actions
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .defaultMinSize(minHeight = 44.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // KIRI: Stan & Event Info
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.weight(1f, fill = false)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Orange500.copy(alpha = 0.15f))
                                    .border(1.dp, Orange500.copy(alpha = 0.3f), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Storefront,
                                    contentDescription = null,
                                    tint = Orange500,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Column(verticalArrangement = Arrangement.Center) {
                                Text(
                                    text = state.currentBooth?.nama ?: "Kasir Stan",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White,
                                    fontSize = 14.sp,
                                    maxLines = 1
                                )
                                Text(
                                    text = state.eventSetting?.namaEvent?.ifBlank { "Point of Sale" } ?: "Point of Sale",
                                    color = Slate400,
                                    fontSize = 11.sp,
                                    maxLines = 1
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        // KANAN: Status Sync & Gugus Tombol Aksi
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Pending Sync Badge / Sync Action
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (state.pendingOrdersCount > 0) Color(0xFF451A03) else Slate800)
                                    .border(1.dp, if (state.pendingOrdersCount > 0) Orange500 else Slate700, RoundedCornerShape(10.dp))
                                    .clickable { viewModel.syncPendingOrdersNow() }
                                    .padding(horizontal = 9.dp, vertical = 7.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(5.dp)
                                ) {
                                    if (state.isSyncing) {
                                        CircularProgressIndicator(modifier = Modifier.size(12.dp), color = Orange500, strokeWidth = 2.dp)
                                    } else {
                                        Icon(
                                            imageVector = if (state.pendingOrdersCount > 0) Icons.Default.CloudUpload else Icons.Default.CloudDone,
                                            contentDescription = null,
                                            tint = if (state.pendingOrdersCount > 0) Orange500 else Emerald500,
                                            modifier = Modifier.size(13.dp)
                                        )
                                    }
                                    Text(
                                        text = if (state.pendingOrdersCount > 0) "${state.pendingOrdersCount} Sync" else "Online",
                                        color = if (state.pendingOrdersCount > 0) Orange200 else Emerald500,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            // Pemisah Visual Halus
                            Box(
                                modifier = Modifier
                                    .height(20.dp)
                                    .width(1.dp)
                                    .background(Slate700.copy(alpha = 0.6f))
                            )

                            // Tombol Riwayat Pesanan Hari Ini
                            PosTopBarButton(
                                icon = Icons.AutoMirrored.Filled.ReceiptLong,
                                contentDescription = "Riwayat Pesanan",
                                tint = Color.White,
                                onClick = { viewModel.openRecentOrdersDialog() }
                            )

                            // Tombol Laporan
                            PosTopBarButton(
                                icon = Icons.Default.Assessment,
                                contentDescription = "Laporan",
                                tint = Color.White,
                                onClick = onNavigateToReport
                            )

                            // Tombol Pengaturan Printer & Struk
                            PosTopBarButton(
                                icon = Icons.Default.Print,
                                contentDescription = "Pengaturan Printer",
                                tint = if (state.deviceConfig?.printerMacAddress != null) Emerald400 else Slate400,
                                hasIndicator = state.deviceConfig?.printerMacAddress != null,
                                indicatorColor = Emerald500,
                                onClick = { viewModel.openPrinterSettingsDialog() }
                            )

                            // Tombol Pengaturan / Setup Terminal
                            PosTopBarButton(
                                icon = Icons.Default.Settings,
                                contentDescription = "Pengaturan",
                                tint = Slate300,
                                onClick = onNavigateToSetup
                            )
                        }
                    }

                    // Sync Message Toast Banner (if any)
                    if (state.syncMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Orange500.copy(alpha = 0.2f))
                                .padding(8.dp)
                        ) {
                            Text(state.syncMessage!!, color = Orange200, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            },
            bottomBar = {
                // Floating Cart Bar (Hanya tampil di Smartphone saat ada item)
                if (!isTablet && state.cart.isNotEmpty()) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(start = 16.dp, end = 16.dp, bottom = 12.dp),
                        shape = RoundedCornerShape(16.dp),
                        shadowElevation = 8.dp,
                        color = Color.Transparent
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(Slate900)
                                .clickable { viewModel.openCartSheet() }
                                .padding(horizontal = 16.dp, vertical = 14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(CircleShape)
                                        .background(Orange500),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "${state.totalCartItemsCount}",
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        fontSize = 13.sp
                                    )
                                }

                                Column {
                                    Text("Lihat Keranjang", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(
                                        text = if (state.totalDiscount > 0) "Diskon -${CurrencyFormatter.formatIDR(state.totalDiscount)}" else "Tekan untuk bayar",
                                        color = if (state.totalDiscount > 0) Emerald500 else Slate400,
                                        fontSize = 11.sp
                                    )
                                }
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(
                                    text = CurrencyFormatter.formatIDR(state.totalAmount),
                                    color = Orange500,
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 16.sp
                                )
                                Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Orange500)
                            }
                        }
                    }
                }
            },
            containerColor = Slate50
        ) { padding ->
            if (isTablet) {
                // --- TABLET / LANDSCAPE MODE: SPLIT SCREEN (Persis seperti Web Kasir) ---
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Left Column (Katalog Menu 65%)
                    Column(
                        modifier = Modifier
                            .weight(0.66f)
                            .fillMaxHeight()
                    ) {
                        Spacer(modifier = Modifier.height(12.dp))

                        // Category Horizontal Tabs (Tampil hanya jika stan memiliki 2 kategori atau lebih)
                        if (categories.size > 2) {
                            CategoryPills(
                                categories = categories,
                                selectedCategory = state.selectedCategory,
                                onCategorySelected = { viewModel.onCategorySelected(it) }
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                        }

                        // Product Grid Adaptif (3-4 Kolom)
                        if (state.filteredMenuItems.isEmpty()) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Icon(Icons.Default.SearchOff, contentDescription = null, tint = Slate300, modifier = Modifier.size(48.dp))
                                    Text("Tidak ada menu ditemukan", color = Slate400, fontSize = 14.sp)
                                }
                            }
                        } else {
                            LazyVerticalGrid(
                                columns = GridCells.Adaptive(minSize = 150.dp),
                                modifier = Modifier.fillMaxSize(),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp),
                                contentPadding = PaddingValues(bottom = 16.dp)
                            ) {
                                items(state.filteredMenuItems) { menuItem ->
                                    val cartItem = state.cart.find { it.menuItem.id == menuItem.id }
                                    FoodItemCard(
                                        menuItem = menuItem,
                                        cartQty = cartItem?.qty ?: 0,
                                        onAddToCart = { viewModel.addToCart(menuItem) }
                                    )
                                }
                            }
                        }
                    }

                    // Right Column: Panel Keranjang Order Permanen (34%)
                    CartSidebarPanel(
                        viewModel = viewModel,
                        onProceedToPayment = { viewModel.openPaymentDialog() },
                        modifier = Modifier
                            .weight(0.34f)
                            .fillMaxHeight()
                    )
                }
            } else {
                // --- SMARTPHONE MODE: SINGLE COLUMN (Compact 2 Kolom) ---
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(horizontal = 16.dp)
                ) {
                    Spacer(modifier = Modifier.height(12.dp))

                    // Category Horizontal Tabs (Tampil hanya jika stan memiliki 2 kategori atau lebih)
                    if (categories.size > 2) {
                        CategoryPills(
                            categories = categories,
                            selectedCategory = state.selectedCategory,
                            onCategorySelected = { viewModel.onCategorySelected(it) }
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                    }

                    // Product Grid (2 Kolom)
                    if (state.filteredMenuItems.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Icon(Icons.Default.SearchOff, contentDescription = null, tint = Slate300, modifier = Modifier.size(48.dp))
                                Text("Tidak ada menu ditemukan", color = Slate400, fontSize = 14.sp)
                            }
                        }
                    } else {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            modifier = Modifier.fillMaxSize(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            contentPadding = PaddingValues(bottom = if (state.cart.isNotEmpty()) 80.dp else 16.dp)
                        ) {
                            items(state.filteredMenuItems) { menuItem ->
                                val cartItem = state.cart.find { it.menuItem.id == menuItem.id }
                                FoodItemCard(
                                    menuItem = menuItem,
                                    cartQty = cartItem?.qty ?: 0,
                                    onAddToCart = { viewModel.addToCart(menuItem) }
                                )
                            }
                        }
                    }
                }
            }
        }

        // Cart Modal Bottom Sheet (Hanya untuk Smartphone Mode)
        if (!isTablet && state.isCartSheetOpen) {
            CartBottomSheet(
                viewModel = viewModel,
                onProceedToPayment = { viewModel.openPaymentDialog() }
            )
        }

        // Payment Dialog
        if (state.isPaymentDialogOpen) {
            PaymentDialog(viewModel = viewModel)
        }

        // Receipt Dialog
        if (state.isReceiptDialogOpen) {
            ReceiptDialog(viewModel = viewModel)
        }

        // Recent Orders Dialog
        if (state.isRecentOrdersDialogOpen) {
            RecentOrdersDialog(viewModel = viewModel)
        }
    }
}

@Composable
private fun PosTopBarButton(
    icon: ImageVector,
    contentDescription: String,
    tint: Color = Slate300,
    hasIndicator: Boolean = false,
    indicatorColor: Color = Emerald500,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(Slate800)
            .border(1.dp, Slate700, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = tint,
            modifier = Modifier.size(18.dp)
        )
        if (hasIndicator) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(4.dp)
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(indicatorColor)
            )
        }
    }
}

