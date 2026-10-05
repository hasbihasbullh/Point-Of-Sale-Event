package com.csm.pos.kasir.ui.screens.pos

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.csm.pos.kasir.ui.components.CurrencyFormatter
import com.csm.pos.kasir.ui.theme.*

@Composable
fun ReceiptDialog(
    viewModel: PosViewModel
) {
    val state by viewModel.uiState.collectAsState()
    val orderWithItems = state.completedOrder ?: return
    val order = orderWithItems.order
    val items = orderWithItems.items

    val subtotal = items.sumOf { it.harga * it.qty }

    Dialog(
        onDismissRequest = { viewModel.closeReceiptDialog() },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 440.dp)
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.88f)
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White)
                .padding(20.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Success Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(Emerald50)
                        .padding(10.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Sukses",
                        tint = Emerald500,
                        modifier = Modifier.size(36.dp)
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "Transaksi Berhasil!",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 17.sp,
                    color = Slate900
                )
                Text(
                    text = "Struk tersimpan di database lokal",
                    fontSize = 11.sp,
                    color = Slate500
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Modern Paper Receipt Card
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(Slate50)
                        .border(1.dp, Slate200, RoundedCornerShape(14.dp))
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val eventTitle = state.eventSetting?.namaEvent?.ifBlank { "POINT OF SALE" } ?: "POINT OF SALE"
                    val eventLocation = state.eventSetting?.areaLokasi?.trim() ?: ""
                    val eventFooter = state.eventSetting?.footerStruk?.trim() ?: ""

                    // Header Info
                    Text(
                        text = eventTitle.uppercase(),
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = Slate900,
                        textAlign = TextAlign.Center
                    )
                    if (eventLocation.isNotBlank()) {
                        Text(
                            text = eventLocation,
                            fontSize = 11.sp,
                            color = Slate500,
                            textAlign = TextAlign.Center
                        )
                    }
                    Text(
                        text = "Stan: ${order.boothNama}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Slate700,
                        textAlign = TextAlign.Center
                    )

                    HorizontalDivider(color = Slate200, thickness = 1.dp, modifier = Modifier.padding(vertical = 4.dp))

                    // Order Number & Date
                    Text(
                        text = order.nomorOrder,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 22.sp,
                        color = Orange600,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = order.createdAt.replace("T", " "),
                        fontSize = 11.sp,
                        color = Slate500,
                        fontFamily = FontFamily.Monospace
                    )

                    if (!order.namaPelanggan.isNullOrBlank()) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFEFF6FF))
                                .border(1.dp, Color(0xFFBFDBFE), RoundedCornerShape(6.dp))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "Pelanggan / Meja: ${order.namaPelanggan}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1D4ED8)
                            )
                        }
                    }

                    HorizontalDivider(color = Slate200, thickness = 1.dp, modifier = Modifier.padding(vertical = 4.dp))

                    // Item Lines (2-Line POS Standard Format)
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        items.forEach { item ->
                            Column(modifier = Modifier.fillMaxWidth()) {
                                // Line 1: Full Item Name (Never cut off)
                                Text(
                                    text = item.namaItem,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Slate900
                                )
                                // Line 2: Qty x @Price and Item Total
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "${item.qty}x @${CurrencyFormatter.formatIDR(item.harga).replace("Rp ", "")}",
                                        fontSize = 11.sp,
                                        color = Slate600
                                    )
                                    Text(
                                        text = CurrencyFormatter.formatIDR(item.harga * item.qty),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate900,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                // Line 3: Special Notes (if any)
                                if (!item.catatan.isNullOrBlank()) {
                                    Text(
                                        text = "*Catatan: ${item.catatan}",
                                        fontSize = 10.sp,
                                        color = Slate500,
                                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                        modifier = Modifier.padding(start = 4.dp, top = 1.dp)
                                    )
                                }
                            }
                        }
                    }

                    HorizontalDivider(color = Slate200, thickness = 1.dp, modifier = Modifier.padding(vertical = 4.dp))

                    // Pricing Summary
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Subtotal", fontSize = 11.sp, color = Slate600)
                        Text(CurrencyFormatter.formatIDR(subtotal), fontSize = 11.sp, color = Slate700, fontFamily = FontFamily.Monospace)
                    }

                    if (order.diskon > 0) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Diskon Voucher", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Emerald600)
                            Text("-${CurrencyFormatter.formatIDR(order.diskon)}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Emerald600, fontFamily = FontFamily.Monospace)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("TOTAL TAGIHAN", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate900)
                        Text(
                            text = CurrencyFormatter.formatIDR(order.total),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 15.sp,
                            color = Orange600,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    HorizontalDivider(color = Slate200, thickness = 1.dp, modifier = Modifier.padding(vertical = 4.dp))

                    // Payment Method Details
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Metode Pembayaran", fontSize = 11.sp, color = Slate600)
                        Text(order.metodeBayar, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate800)
                    }

                    if (order.metodeBayar == "CASH" && order.uangBayar != null) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Tunai Diterima", fontSize = 11.sp, color = Slate600)
                            Text(CurrencyFormatter.formatIDR(order.uangBayar), fontSize = 11.sp, color = Slate700, fontFamily = FontFamily.Monospace)
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Kembalian", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Slate800)
                            Text(
                                text = CurrencyFormatter.formatIDR(order.kembalian ?: 0.0),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Emerald600,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    if (!order.noReferensi.isNullOrBlank()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("No. Referensi", fontSize = 10.sp, color = Slate500)
                            Text(order.noReferensi, fontSize = 10.sp, color = Slate700, fontFamily = FontFamily.Monospace)
                        }
                    }

                    if (eventFooter.isNotBlank()) {
                        HorizontalDivider(color = Slate200, thickness = 1.dp, modifier = Modifier.padding(vertical = 4.dp))
                        Text(
                            text = eventFooter,
                            fontSize = 10.sp,
                            color = Slate500,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Bottom Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            state.deviceConfig?.printerMacAddress?.let { mac ->
                                viewModel.printReceipt(mac, orderWithItems)
                            } ?: viewModel.openBluetoothPicker()
                        },
                        modifier = Modifier.weight(1f).height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate800)
                    ) {
                        Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Cetak Ulang", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }

                    Button(
                        onClick = { viewModel.closeReceiptDialog() },
                        modifier = Modifier.weight(1f).height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Slate900)
                    ) {
                        Icon(Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Pesanan Baru", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
