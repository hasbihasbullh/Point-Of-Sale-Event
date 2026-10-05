package com.csm.pos.kasir.ui.screens.pos

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.csm.pos.kasir.ui.components.CurrencyFormatter
import com.csm.pos.kasir.ui.theme.*

@Composable
fun CartSidebarPanel(
    viewModel: PosViewModel,
    onProceedToPayment: () -> Unit,
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    var showClearConfirmDialog by remember { mutableStateOf(false) }

    if (showClearConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showClearConfirmDialog = false },
            title = { Text("Kosongkan Keranjang?", fontWeight = FontWeight.Bold, fontSize = 16.sp) },
            text = { Text("Semua item pesanan yang sudah dimasukkan akan dihapus dari keranjang.", fontSize = 13.sp, color = Slate600) },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.clearCart()
                        showClearConfirmDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Rose600),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Ya, Kosongkan", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showClearConfirmDialog = false },
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Batal")
                }
            }
        )
    }

    Card(
        modifier = modifier
            .fillMaxHeight()
            .padding(vertical = 12.dp, horizontal = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Header: Keranjang Order
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = null, tint = Orange500, modifier = Modifier.size(20.dp))
                    Text("Keranjang Order", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Slate900)
                    if (state.totalCartItemsCount > 0) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Orange50)
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text("${state.totalCartItemsCount} Item", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Orange600)
                        }
                    }
                }

                if (state.cart.isNotEmpty()) {
                    TextButton(
                        onClick = { showClearConfirmDialog = true },
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text("Kosongkan", color = Rose600, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp), color = Slate100)

            if (state.cart.isEmpty()) {
                // Empty State (Persis seperti Web Kasir)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(horizontal = 24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ShoppingCart,
                            contentDescription = null,
                            tint = Slate300,
                            modifier = Modifier.size(48.dp)
                        )
                        Text(
                            text = "Keranjang belanja masih kosong.\nSilakan pilih menu di samping.",
                            fontSize = 13.sp,
                            color = Slate400,
                            textAlign = TextAlign.Center,
                            lineHeight = 18.sp
                        )
                    }
                }
            } else {
                // Items List
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(state.cart) { item ->
                        var showNotesInput by remember { mutableStateOf(!item.catatan.isNullOrBlank()) }

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(Slate50)
                                .border(1.dp, Slate200, RoundedCornerShape(14.dp))
                                .padding(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(item.menuItem.nama, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate800, maxLines = 2)
                                    Text(CurrencyFormatter.formatIDR(item.menuItem.harga), fontSize = 12.sp, color = Slate500)
                                }

                                // Stepper Qty
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(Color.White)
                                            .border(1.dp, Slate200, CircleShape)
                                            .clickable { viewModel.updateCartQty(item.menuItem.id, item.qty - 1) },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = if (item.qty == 1) Icons.Default.Delete else Icons.Default.Remove,
                                            contentDescription = "Kurang",
                                            tint = if (item.qty == 1) Rose600 else Slate700,
                                            modifier = Modifier.size(14.dp)
                                        )
                                    }

                                    Text("${item.qty}", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate900)

                                    Box(
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(CircleShape)
                                            .background(Orange500)
                                            .clickable { viewModel.updateCartQty(item.menuItem.id, item.qty + 1) },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Default.Add, contentDescription = "Tambah", tint = Color.White, modifier = Modifier.size(14.dp))
                                    }
                                }
                            }

                            // Catatan Khusus
                            if (showNotesInput) {
                                Spacer(modifier = Modifier.height(6.dp))
                                OutlinedTextField(
                                    value = item.catatan ?: "",
                                    onValueChange = { viewModel.updateCartNotes(item.menuItem.id, it) },
                                    placeholder = { Text("Contoh: Pedas, Dingin...", fontSize = 11.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 11.sp),
                                    shape = RoundedCornerShape(8.dp),
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Slate900,
                                        unfocusedTextColor = Slate900,
                                        focusedBorderColor = Orange500,
                                        unfocusedBorderColor = Slate300,
                                        focusedPlaceholderColor = Slate400,
                                        unfocusedPlaceholderColor = Slate400,
                                        focusedContainerColor = Color.White,
                                        unfocusedContainerColor = Color.White
                                    )
                                )
                            } else {
                                Text(
                                    text = "+ Tambah Catatan",
                                    color = Orange600,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier
                                        .clickable { showNotesInput = true }
                                        .padding(top = 4.dp)
                                )
                            }
                        }
                    }
                }

                // Voucher Diskon Event (Hanya tampil jika stan mengaktifkan voucher)
                if (state.currentBooth?.voucherActive != false) {
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Orange50)
                            .border(1.dp, Orange200, RoundedCornerShape(12.dp))
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.ConfirmationNumber, contentDescription = null, tint = Orange600, modifier = Modifier.size(18.dp))
                            Column {
                                Text("Voucher Event", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Orange700)
                                Text("-${CurrencyFormatter.formatIDR(state.voucherNominal.toDouble())}/kupon", fontSize = 10.sp, color = Slate500)
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            IconButton(
                                onClick = { viewModel.setVoucherCount(state.voucherCount - 1) },
                                modifier = Modifier.size(24.dp),
                                enabled = state.voucherCount > 0
                            ) {
                                Icon(Icons.Default.RemoveCircle, contentDescription = null, tint = if (state.voucherCount > 0) Orange600 else Slate300)
                            }
                            Text("${state.voucherCount}", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Orange700)
                            IconButton(
                                onClick = { viewModel.setVoucherCount(state.voucherCount + 1) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.AddCircle, contentDescription = null, tint = Orange600)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Total Calculation Breakdown
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Subtotal", color = Slate500, fontSize = 12.sp)
                        Text(CurrencyFormatter.formatIDR(state.subtotal), fontWeight = FontWeight.SemiBold, color = Slate800, fontSize = 12.sp)
                    }
                    if (state.totalDiscount > 0) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Diskon Voucher (${state.voucherCount}x)", color = Emerald600, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("-${CurrencyFormatter.formatIDR(state.totalDiscount)}", color = Emerald600, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = Slate200)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("TOTAL TAGIHAN", fontWeight = FontWeight.ExtraBold, color = Slate900, fontSize = 14.sp)
                        Text(CurrencyFormatter.formatIDR(state.totalAmount), fontWeight = FontWeight.ExtraBold, color = Orange600, fontSize = 16.sp)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = onProceedToPayment,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Orange500)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("Lanjut ke Pembayaran", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}
