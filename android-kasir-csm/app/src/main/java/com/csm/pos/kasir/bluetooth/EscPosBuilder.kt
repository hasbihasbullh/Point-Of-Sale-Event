package com.csm.pos.kasir.bluetooth

import com.csm.pos.kasir.data.local.dao.OrderWithItems
import com.csm.pos.kasir.data.local.entity.EventSettingEntity
import com.csm.pos.kasir.domain.model.BoothReport
import java.io.ByteArrayOutputStream
import java.text.NumberFormat
import java.util.Locale

class EscPosBuilder(private val is80mm: Boolean = false) {
    private val output = ByteArrayOutputStream()
    private val maxColumns = if (is80mm) 48 else 32

    private fun formatIDR(amount: Double): String {
        val format = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
        format.maximumFractionDigits = 0
        return format.format(amount).replace("Rp", "Rp ").trim()
    }

    fun initPrinter(): EscPosBuilder {
        output.write(byteArrayOf(0x1B, 0x40)) // ESC @
        return this
    }

    fun alignLeft(): EscPosBuilder {
        output.write(byteArrayOf(0x1B, 0x61, 0x00))
        return this
    }

    fun alignCenter(): EscPosBuilder {
        output.write(byteArrayOf(0x1B, 0x61, 0x01))
        return this
    }

    fun alignRight(): EscPosBuilder {
        output.write(byteArrayOf(0x1B, 0x61, 0x02))
        return this
    }

    fun boldOn(): EscPosBuilder {
        output.write(byteArrayOf(0x1B, 0x45, 0x01))
        return this
    }

    fun boldOff(): EscPosBuilder {
        output.write(byteArrayOf(0x1B, 0x45, 0x00))
        return this
    }

    fun sizeNormal(): EscPosBuilder {
        output.write(byteArrayOf(0x1D, 0x21, 0x00))
        return this
    }

    fun sizeDoubleHeight(): EscPosBuilder {
        output.write(byteArrayOf(0x1D, 0x21, 0x01))
        return this
    }

    fun sizeDouble(): EscPosBuilder {
        output.write(byteArrayOf(0x1D, 0x21, 0x11))
        return this
    }

    fun printLine(text: String = ""): EscPosBuilder {
        output.write(text.toByteArray(charset("GBK")))
        output.write(0x0A) // LF
        return this
    }

    fun printDashedLine(): EscPosBuilder {
        val line = "-".repeat(maxColumns)
        return printLine(line)
    }

    /**
     * Memecah teks panjang berdasarkan kata (spasi) agar tidak terpotong di tengah kata
     */
    fun wrapText(text: String, maxChars: Int = maxColumns, indent: String = ""): List<String> {
        if (text.isBlank()) return emptyList()
        val words = text.trim().split(Regex("\\s+"))
        val lines = mutableListOf<String>()
        var currentLine = StringBuilder()

        for (word in words) {
            val lineLimit = if (lines.isEmpty()) maxChars else maxChars - indent.length
            if (currentLine.isEmpty()) {
                if (word.length <= lineLimit) {
                    currentLine.append(word)
                } else {
                    var remaining = word
                    while (remaining.length > lineLimit) {
                        val chunk = remaining.substring(0, lineLimit)
                        lines.add(if (lines.isEmpty()) chunk else indent + chunk)
                        remaining = remaining.substring(lineLimit)
                    }
                    currentLine.append(remaining)
                }
            } else if (currentLine.length + 1 + word.length <= lineLimit) {
                currentLine.append(" ").append(word)
            } else {
                lines.add(if (lines.isEmpty()) currentLine.toString() else indent + currentLine.toString())
                currentLine = StringBuilder()
                val nextLimit = maxChars - indent.length
                if (word.length <= nextLimit) {
                    currentLine.append(word)
                } else {
                    var remaining = word
                    while (remaining.length > nextLimit) {
                        val chunk = remaining.substring(0, nextLimit)
                        lines.add(indent + chunk)
                        remaining = remaining.substring(nextLimit)
                    }
                    currentLine.append(remaining)
                }
            }
        }
        if (currentLine.isNotEmpty()) {
            lines.add(if (lines.isEmpty()) currentLine.toString() else indent + currentLine.toString())
        }
        return lines
    }

    /**
     * Mencetak teks panjang dengan wrap otomatis
     */
    fun printWrapped(text: String, indent: String = ""): EscPosBuilder {
        val lines = wrapText(text, maxColumns, indent)
        for (line in lines) {
            printLine(line)
        }
        return this
    }

    /**
     * Mencetak dua kolom rata kiri dan rata kanan tanpa memotong teks kiri
     */
    fun printTwoColumns(left: String, right: String): EscPosBuilder {
        val spacesNeeded = maxColumns - left.length - right.length
        if (spacesNeeded >= 0) {
            printLine(left + " ".repeat(spacesNeeded) + right)
        } else {
            val leftLines = wrapText(left, maxColumns)
            if (leftLines.isEmpty()) {
                val pad = maxOf(0, maxColumns - right.length)
                printLine(" ".repeat(pad) + right)
            } else {
                for (i in 0 until leftLines.size - 1) {
                    printLine(leftLines[i])
                }
                val lastLine = leftLines.last()
                val remainingSpaces = maxColumns - lastLine.length - right.length
                if (remainingSpaces >= 0) {
                    printLine(lastLine + " ".repeat(remainingSpaces) + right)
                } else {
                    printLine(lastLine)
                    val pad = maxOf(0, maxColumns - right.length)
                    printLine(" ".repeat(pad) + right)
                }
            }
        }
        return this
    }

    fun feedAndCut(): EscPosBuilder {
        output.write(byteArrayOf(0x0A, 0x0A, 0x0A))
        output.write(byteArrayOf(0x1D, 0x56, 0x42, 0x00)) // GS V B 0 (Cut)
        return this
    }

    fun build(): ByteArray = output.toByteArray()

    // --- STRUK TRANSAKSI KASIR (TRANSACTION RECEIPT) ---
    fun buildTransactionReceipt(
        orderWithItems: OrderWithItems,
        eventSetting: EventSettingEntity? = null,
        isKitchenCopy: Boolean = false,
        showCustomerName: Boolean = true,
        showItemNotes: Boolean = true
    ): ByteArray {
        val order = orderWithItems.order
        val items = orderWithItems.items

        val eventTitle = eventSetting?.namaEvent?.trim()?.ifBlank { "POINT OF SALE" } ?: "POINT OF SALE"
        val isVoid = order.status.equals("VOID", ignoreCase = true)

        initPrinter()

        if (isKitchenCopy) {
            // --- KITCHEN / DAPUR / CHECKER COPY ---
            alignCenter()
            boldOn()
            sizeDouble()
            printLine("*** STRUK DAPUR / CHECKER ***")
            sizeNormal()
            boldOff()
            printLine("Stan: ${order.boothNama}")
            printDashedLine()

            alignCenter()
            boldOn()
            sizeDouble()
            printLine(order.nomorOrder)
            sizeNormal()
            boldOff()
            printLine("Waktu: ${order.createdAt.replace("T", " ")}")
            if (showCustomerName && !order.namaPelanggan.isNullOrBlank()) {
                boldOn()
                printWrapped("Pelanggan: ${order.namaPelanggan.trim()}")
                boldOff()
            }
            if (isVoid) {
                boldOn()
                printLine(">>> STATUS: BATAL / VOID <<<")
                boldOff()
            }
            printDashedLine()

            alignLeft()
            boldOn()
            for (item in items) {
                printWrapped("${item.qty}x ${item.namaItem}")
                if (showItemNotes && !item.catatan.isNullOrBlank()) {
                    boldOff()
                    printWrapped(">> Catatan: ${item.catatan.trim()}", indent = "   ")
                    boldOn()
                }
            }
            boldOff()
            printDashedLine()

            alignCenter()
            printLine("* Harap periksa pesanan sebelum disajikan *")
            feedAndCut()
            return build()
        }

        // --- CUSTOMER COPY ---
        if (isVoid) {
            alignCenter()
            boldOn()
            printLine("================================")
            printLine("*** TRANSAKSI DIBATALKAN ***")
            printLine("***       ( V O I D )        ***")
            printLine("================================")
            boldOff()
        }

        alignCenter()
        boldOn()
        sizeDoubleHeight()
        printWrapped(eventTitle.uppercase())
        sizeNormal()
        boldOff()
        printWrapped("Stan: ${order.boothNama}")
        val subInfo = listOfNotNull(
            eventSetting?.clientMerchant?.trim()?.takeIf { it.isNotBlank() },
            eventSetting?.areaLokasi?.trim()?.takeIf { it.isNotBlank() }
        ).joinToString(" - ")
        if (subInfo.isNotBlank()) {
            printWrapped(subInfo)
        }
        printDashedLine()

        alignCenter()
        boldOn()
        sizeDouble()
        printLine(order.nomorOrder)
        sizeNormal()
        boldOff()
        printLine("Tanggal: ${order.createdAt.replace("T", " ")}")
        if (showCustomerName && !order.namaPelanggan.isNullOrBlank()) {
            boldOn()
            printWrapped("[ ${order.namaPelanggan.trim().uppercase()} ]")
            boldOff()
        }
        if (isVoid) {
            boldOn()
            printLine(">>> STATUS: VOID / BATAL <<<")
            if (!order.alasanVoid.isNullOrBlank()) {
                printWrapped("Alasan: ${order.alasanVoid.trim()}")
            }
            boldOff()
        }
        printDashedLine()

        // --- DAFTAR ITEM (2-Line POS Professional Format) ---
        alignLeft()
        for (item in items) {
            // Baris 1: Nama Menu Lengkap (Utuh dengan Word-Wrap)
            boldOn()
            printWrapped(item.namaItem)
            boldOff()

            // Baris 2: Qty x @Harga di kiri, Subtotal Item di kanan
            val qtyPriceStr = "${item.qty}x @${formatIDR(item.harga).replace("Rp ", "")}"
            val itemTotalStr = formatIDR(item.harga * item.qty)
            printTwoColumns(qtyPriceStr, itemTotalStr)

            // Baris 3: Catatan Khusus Item (jika ada)
            if (showItemNotes && !item.catatan.isNullOrBlank()) {
                printWrapped("*Catatan: ${item.catatan.trim()}", indent = "  ")
            }
        }
        printDashedLine()

        val subtotal = items.sumOf { it.harga * it.qty }
        printTwoColumns("Subtotal", formatIDR(subtotal))
        if (order.diskon > 0) {
            printTwoColumns("Diskon / Voucher", "-${formatIDR(order.diskon)}")
        }
        boldOn()
        printTwoColumns(if (isVoid) "TOTAL (BATAL)" else "TOTAL TAGIHAN", formatIDR(order.total))
        boldOff()

        printDashedLine()
        printTwoColumns("Metode Bayar", order.metodeBayar)
        if (order.metodeBayar == "CASH" && order.uangBayar != null) {
            printTwoColumns("Tunai Diterima", formatIDR(order.uangBayar))
            printTwoColumns("Kembalian", formatIDR(order.kembalian ?: 0.0))
        }
        if (!order.noReferensi.isNullOrBlank()) {
            printTwoColumns("No. Referensi", order.noReferensi)
        }

        printDashedLine()
        alignCenter()
        if (isVoid) {
            boldOn()
            printLine("*** TRANSAKSI INI TELAH VOID ***")
            printLine("Tidak dapat digunakan sebagai bukti.")
            boldOff()
        } else if (eventSetting != null && eventSetting.footerStruk.isNotBlank()) {
            eventSetting.footerStruk.lines().forEach { line ->
                if (line.isNotBlank()) printWrapped(line.trim())
            }
        } else {
            printLine("Terima kasih atas pesanan Anda!")
            printLine("Simpan struk ini sebagai bukti.")
            if (!eventSetting?.clientMerchant.isNullOrBlank()) {
                printWrapped(eventSetting!!.clientMerchant.trim())
            }
        }
        feedAndCut()

        return build()
    }

    // --- STRUK CLOSING SHIFT (Z-REPORT / SHIFT SUMMARY) ---
    fun buildClosingReport(
        report: BoothReport,
        cashierName: String = "Kasir",
        eventSetting: EventSettingEntity? = null
    ): ByteArray {
        val eventTitle = eventSetting?.namaEvent?.trim()?.ifBlank { "POS SYSTEM" } ?: "POS SYSTEM"

        initPrinter()
        alignCenter()
        boldOn()
        sizeDoubleHeight()
        printLine("LAPORAN CLOSING SHIFT")
        sizeNormal()
        boldOff()
        printWrapped(eventTitle)
        printWrapped("Stan: [${report.boothKode}] ${report.boothNama}")
        val subInfo = listOfNotNull(
            eventSetting?.clientMerchant?.trim()?.takeIf { it.isNotBlank() },
            eventSetting?.areaLokasi?.trim()?.takeIf { it.isNotBlank() }
        ).joinToString(" - ")
        if (subInfo.isNotBlank()) {
            printWrapped(subInfo)
        }
        printLine("Tanggal: ${report.dateString}")
        printLine("Kasir: $cashierName")
        printDashedLine()

        alignLeft()
        boldOn()
        printLine("RINGKASAN OMZET PENJUALAN")
        boldOff()
        printTwoColumns("Total Transaksi", "${report.totalTransactions} Pesanan")
        printTwoColumns("Total Menu Terjual", "${report.totalItemsSold} Item")
        if (report.reservasiCount > 0) {
            printTwoColumns("Pesanan Reservasi", "${report.reservasiCount} Order (${formatIDR(report.reservasiTotalAmount)})")
        }
        if (report.totalDiskon > 0) {
            printTwoColumns("Total Diskon Voucher", formatIDR(report.totalDiskon))
        }
        boldOn()
        printTwoColumns("TOTAL OMZET (REVENUE)", formatIDR(report.totalRevenue))
        boldOff()
        if (report.voidedTransactionsCount > 0) {
            printTwoColumns("Transaksi VOID (Batal)", "${report.voidedTransactionsCount} Pesanan (${formatIDR(report.totalVoidedAmount)})")
        }
        printDashedLine()

        boldOn()
        printLine("RINCIAN METODE PEMBAYARAN")
        boldOff()
        if (report.isCashActive) printTwoColumns("UANG TUNAI (CASH)", formatIDR(report.cashTotal))
        if (report.isQrisActive) printTwoColumns("NON-TUNAI (QRIS)", formatIDR(report.qrisTotal))
        if (report.isEdcActive) printTwoColumns("NON-TUNAI (EDC)", formatIDR(report.edcTotal))
        if (!report.isCashActive && !report.isQrisActive && !report.isEdcActive) {
            printLine("(Tidak ada metode pembayaran aktif)")
        }
        printDashedLine()

        if (report.topItems.isNotEmpty()) {
            boldOn()
            printLine("MENU TERLARIS:")
            boldOff()
            for ((idx, item) in report.topItems.withIndex()) {
                boldOn()
                printWrapped("${idx + 1}. ${item.nama}")
                boldOff()
                val qtyLeft = "   ${item.qty} pcs terjual"
                val revRight = formatIDR(item.totalRevenue)
                printTwoColumns(qtyLeft, revRight)
            }
            printDashedLine()
        }

        boldOn()
        printTwoColumns("Status Sync", if (report.pendingSyncCount == 0) "100% TERSINKRON" else "${report.pendingSyncCount} TERTUNDA")
        boldOff()
        printDashedLine()

        alignCenter()
        printLine("Tanda Tangan Kasir / Supervisor")
        printLine("\n\n\n")
        printLine("(_______________________)")
        printLine("Dicetak otomatis via Kasir HP")
        feedAndCut()

        return build()
    }

    // --- SLIP UJI COBA PRINTER (TEST PRINT SLIP) ---
    fun buildTestSlip(
        boothKode: String = "POS",
        boothNama: String = "Kasir Mobile",
        eventSetting: EventSettingEntity? = null,
        paperWidth: String = "58mm",
        autoPrint: Boolean = false,
        printCopies: Int = 1
    ): ByteArray {
        val eventTitle = eventSetting?.namaEvent?.trim()?.ifBlank { "POINT OF SALE" } ?: "POINT OF SALE"
        initPrinter()
        alignCenter()
        boldOn()
        sizeDoubleHeight()
        printWrapped(eventTitle.uppercase())
        sizeNormal()
        boldOff()
        printLine("UJI COBA PRINTER BLUETOOTH")
        printDashedLine()
        printLine("Status: OK & SIAP PAKAI")
        printWrapped("Stan: [$boothKode] $boothNama")
        printLine("Lebar Kertas: $paperWidth (${if (is80mm) "48 kolom" else "32 kolom"})")
        printLine("Auto Print: ${if (autoPrint) "AKTIF (Otomatis)" else "TIDAK AKTIF"}")
        printLine("Salinan: $printCopies Struk ${if (printCopies == 2) "(Pelanggan + Dapur)" else "(Pelanggan)"}")
        printDashedLine()
        printLine("Sistem POS Berfungsi Normal")
        feedAndCut()

        return build()
    }
}

