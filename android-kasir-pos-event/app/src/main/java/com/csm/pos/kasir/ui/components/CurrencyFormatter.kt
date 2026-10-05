package com.csm.pos.kasir.ui.components

import java.text.NumberFormat
import java.util.Locale

object CurrencyFormatter {
    fun formatIDR(amount: Double): String {
        val format = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
        format.maximumFractionDigits = 0
        return format.format(amount).replace("Rp", "Rp ").trim()
    }
}
