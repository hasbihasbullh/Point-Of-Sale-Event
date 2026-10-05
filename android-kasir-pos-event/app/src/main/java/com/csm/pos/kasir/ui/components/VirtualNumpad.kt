package com.csm.pos.kasir.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Backspace
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.csm.pos.kasir.ui.theme.*
import com.csm.pos.kasir.util.SoundHapticHelper

@Composable
fun VirtualNumpad(
    onNumberClick: (String) -> Unit,
    onClearClick: () -> Unit,
    onBackspaceClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val keys = listOf(
        listOf("1", "2", "3"),
        listOf("4", "5", "6"),
        listOf("7", "8", "9"),
        listOf("C", "0", "DEL")
    )

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        keys.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { key ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(
                                when (key) {
                                    "C" -> Rose50
                                    "DEL" -> Slate100
                                    else -> Color.White
                                }
                            )
                            .border(
                                width = 1.dp,
                                color = when (key) {
                                    "C" -> Color(0xFFFECDD3)
                                    else -> Slate200
                                },
                                shape = RoundedCornerShape(14.dp)
                            )
                            .clickable {
                                SoundHapticHelper.triggerVibrate(context, 25L)
                                when (key) {
                                    "C" -> onClearClick()
                                    "DEL" -> onBackspaceClick()
                                    else -> onNumberClick(key)
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        if (key == "DEL") {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Backspace,
                                contentDescription = "Hapus",
                                tint = Slate600,
                                modifier = Modifier.size(20.dp)
                            )
                        } else {
                            Text(
                                text = key,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = when (key) {
                                    "C" -> Rose600
                                    else -> Slate800
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
