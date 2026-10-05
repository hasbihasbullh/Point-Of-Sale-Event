package com.csm.pos.kasir.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Fastfood
import androidx.compose.material.icons.filled.LocalDrink
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.csm.pos.kasir.data.local.ImageStorageManager
import com.csm.pos.kasir.data.local.entity.MenuItemEntity
import com.csm.pos.kasir.ui.theme.*
import com.csm.pos.kasir.util.SoundHapticHelper

@Composable
fun FoodItemCard(
    menuItem: MenuItemEntity,
    cartQty: Int,
    onAddToCart: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val isOutOfStock = !menuItem.tersedia || (menuItem.stok != null && menuItem.stok <= 0)
    val imageModel = remember(menuItem.foto) { ImageStorageManager.getImageModel(menuItem.foto) }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(Color.White)
            .border(
                width = if (cartQty > 0) 1.5.dp else 1.dp,
                color = if (cartQty > 0) Orange500 else Slate200,
                shape = RoundedCornerShape(18.dp)
            )
            .clickable(enabled = !isOutOfStock) {
                SoundHapticHelper.triggerVibrate(context)
                onAddToCart()
            }
            .padding(10.dp)
    ) {
        Column {
            // Square 1:1 Image / Placeholder Area
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        when (menuItem.kategori) {
                            "Minuman" -> Sky50
                            "Cemilan" -> Color(0xFFFDF4FF)
                            else -> Orange50
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (imageModel != null) {
                    AsyncImage(
                        model = imageModel,
                        contentDescription = menuItem.nama,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Icon(
                        imageVector = when (menuItem.kategori) {
                            "Minuman" -> Icons.Default.LocalDrink
                            "Cemilan" -> Icons.Default.Fastfood
                            else -> Icons.Default.Restaurant
                        },
                        contentDescription = null,
                        tint = when (menuItem.kategori) {
                            "Minuman" -> Sky500
                            "Cemilan" -> Color(0xFFA21CAF)
                            else -> Orange500
                        },
                        modifier = Modifier.size(44.dp)
                    )
                }

                // Stock Badge Top Right (if exists)
                if (menuItem.stok != null && !isOutOfStock) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(6.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (menuItem.stok <= 5) Color(0xFFFEF3C7) else Orange100)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = if (menuItem.stok <= 5) "Sisa ${menuItem.stok}!" else "Stok: ${menuItem.stok}",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (menuItem.stok <= 5) Color(0xFFB45309) else Orange700
                        )
                    }
                }

                // Out of stock overlay
                if (isOutOfStock) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.45f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Rose600)
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("STOK HABIS", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Text Info & Price
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = menuItem.nama,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = if (isOutOfStock) Slate400 else Slate900,
                    maxLines = 2,
                    minLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    lineHeight = 17.sp
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = CurrencyFormatter.formatIDR(menuItem.harga),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 13.sp,
                        color = if (isOutOfStock) Slate400 else Orange600
                    )

                    // Add Button / Counter Badge
                    if (cartQty > 0) {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(Orange500),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$cartQty",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .clip(CircleShape)
                                .background(if (isOutOfStock) Slate100 else Orange50),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Tambah",
                                tint = if (isOutOfStock) Slate400 else Orange500,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
