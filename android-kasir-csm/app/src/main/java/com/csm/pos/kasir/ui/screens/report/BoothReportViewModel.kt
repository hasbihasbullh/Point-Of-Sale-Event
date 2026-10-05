package com.csm.pos.kasir.ui.screens.report

import android.content.Context
import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.csm.pos.kasir.bluetooth.BluetoothPrinterManager
import com.csm.pos.kasir.bluetooth.EscPosBuilder
import com.csm.pos.kasir.data.local.entity.DeviceConfigEntity
import com.csm.pos.kasir.data.repository.PosRepository
import com.csm.pos.kasir.data.repository.ReportRepository
import com.csm.pos.kasir.data.repository.SyncRepository
import com.csm.pos.kasir.domain.model.BoothReport
import com.csm.pos.kasir.ui.components.CurrencyFormatter
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class BoothReportUiState(
    val isLoading: Boolean = false,
    val report: BoothReport? = null,
    val selectedDate: String = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
    val isDatePickerOpen: Boolean = false,
    val isSyncingServer: Boolean = false,
    val syncServerMessage: String? = null,
    val deviceConfig: DeviceConfigEntity? = null,
    val isClosingDialogOpen: Boolean = false,
    val isPrinting: Boolean = false,
    val printStatusMessage: String? = null
) {
    val todayDate: String
        get() = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

    val yesterdayDate: String
        get() {
            val cal = Calendar.getInstance()
            cal.add(Calendar.DAY_OF_YEAR, -1)
            return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(cal.time)
        }

    val isToday: Boolean
        get() = selectedDate == todayDate

    val isYesterday: Boolean
        get() = selectedDate == yesterdayDate
}

class BoothReportViewModel(
    private val reportRepo: ReportRepository,
    private val posRepo: PosRepository,
    private val syncRepo: SyncRepository,
    private val printerManager: BluetoothPrinterManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(BoothReportUiState())
    val uiState: StateFlow<BoothReportUiState> = _uiState.asStateFlow()

    init {
        loadReport()
    }

    fun loadReport(date: String? = null, autoPullServer: Boolean = true) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val config = posRepo.getDeviceConfig()
            val effectiveDate = date ?: _uiState.value.selectedDate

            config?.assignedBoothId?.let { boothId ->
                // 1. Instantly display local aggregated report from SQLite Room
                val localReport = reportRepo.getBoothDailyReport(boothId, effectiveDate)
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    report = localReport,
                    selectedDate = effectiveDate,
                    deviceConfig = config
                )

                // 2. Silent Auto-Pull from server in background if configured
                if (autoPullServer && config.serverBaseUrl.isNotBlank()) {
                    launch {
                        try {
                            val pullResult = syncRepo.fetchAndCacheBoothOrders(config.serverBaseUrl, boothId, effectiveDate)
                            if (pullResult.isSuccess && pullResult.getOrDefault(0) > 0) {
                                val refreshedReport = reportRepo.getBoothDailyReport(boothId, effectiveDate)
                                _uiState.value = _uiState.value.copy(report = refreshedReport)
                            }
                        } catch (e: Exception) {
                            // Silent offline fallback
                        }
                    }
                }
            } ?: run {
                _uiState.value = _uiState.value.copy(isLoading = false)
            }
        }
    }

    fun selectDate(date: String) {
        _uiState.value = _uiState.value.copy(isDatePickerOpen = false)
        loadReport(date)
    }

    fun selectToday() {
        loadReport(_uiState.value.todayDate)
    }

    fun selectYesterday() {
        loadReport(_uiState.value.yesterdayDate)
    }

    fun openDatePicker() {
        _uiState.value = _uiState.value.copy(isDatePickerOpen = true)
    }

    fun closeDatePicker() {
        _uiState.value = _uiState.value.copy(isDatePickerOpen = false)
    }

    fun fetchServerOrders(forAllDates: Boolean = false) {
        viewModelScope.launch {
            val config = _uiState.value.deviceConfig ?: posRepo.getDeviceConfig()
            if (config == null || config.assignedBoothId.isNullOrBlank()) {
                _uiState.value = _uiState.value.copy(
                    isSyncingServer = false,
                    syncServerMessage = "Stan belum diatur pada perangkat ini."
                )
                delay(3000)
                _uiState.value = _uiState.value.copy(syncServerMessage = null)
                return@launch
            }

            val boothId = config.assignedBoothId
            val dateParam = if (forAllDates) null else _uiState.value.selectedDate

            _uiState.value = _uiState.value.copy(
                isSyncingServer = true,
                syncServerMessage = null,
                deviceConfig = config
            )
            val result = syncRepo.fetchAndCacheBoothOrders(config.serverBaseUrl, boothId, dateParam)
            if (result.isSuccess) {
                val count = result.getOrDefault(0)
                loadReport(_uiState.value.selectedDate)
                _uiState.value = _uiState.value.copy(
                    isSyncingServer = false,
                    syncServerMessage = if (forAllDates) {
                        "Sukses menyinkronkan seluruh riwayat ($count transaksi) dari server!"
                    } else {
                        "Sukses menarik $count transaksi tanggal ${_uiState.value.selectedDate}!"
                    }
                )
            } else {
                val err = result.exceptionOrNull()?.localizedMessage ?: "Offline"
                _uiState.value = _uiState.value.copy(
                    isSyncingServer = false,
                    syncServerMessage = "Gagal menarik data: $err"
                )
            }
            delay(3500)
            _uiState.value = _uiState.value.copy(syncServerMessage = null)
        }
    }

    fun fetchServerOrdersForCurrentDate() {
        fetchServerOrders(forAllDates = false)
    }

    fun fetchServerOrdersForAllDates() {
        fetchServerOrders(forAllDates = true)
    }

    fun openClosingDialog() {
        _uiState.value = _uiState.value.copy(isClosingDialogOpen = true)
    }

    fun closeClosingDialog() {
        _uiState.value = _uiState.value.copy(isClosingDialogOpen = false)
    }

    fun printClosingReport() {
        val report = _uiState.value.report ?: return
        val config = _uiState.value.deviceConfig ?: return
        val mac = config.printerMacAddress ?: run {
            _uiState.value = _uiState.value.copy(printStatusMessage = "Printer Bluetooth belum dipasangkan!")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPrinting = true, printStatusMessage = null)
            val eventSetting = posRepo.getEventSetting()
            val is80mm = config.paperWidth.equals("80mm", ignoreCase = true)
            val bytes = EscPosBuilder(is80mm = is80mm).buildClosingReport(report, config.activeCashierName, eventSetting)
            val result = printerManager.printBytes(mac, bytes)

            _uiState.value = _uiState.value.copy(
                isPrinting = false,
                printStatusMessage = if (result.isSuccess) "Struk Closing berhasil dicetak!" else "Gagal mencetak ke printer."
            )
        }
    }

    fun shareReportViaWhatsApp(context: Context) {
        val report = _uiState.value.report ?: return

        viewModelScope.launch {
            val eventSetting = posRepo.getEventSetting()
            val eventName = eventSetting?.namaEvent?.trim()?.ifBlank { "Point of Sale" } ?: "Point of Sale"
            val eventLocation = eventSetting?.areaLokasi?.trim() ?: ""

            val text = buildString {
                appendLine("*LAPORAN PENUTUPAN SHIFT (Z-REPORT)*")
                if (eventLocation.isNotBlank()) {
                    appendLine("$eventName - $eventLocation")
                } else {
                    appendLine(eventName)
                }
                appendLine("Stan: ${report.boothNama}")
                appendLine("Tanggal: ${report.dateString}")
                appendLine("Kasir: ${_uiState.value.deviceConfig?.activeCashierName ?: "Kasir 1"}")
                appendLine("--------------------------------")
                appendLine("Total Omzet: *${CurrencyFormatter.formatIDR(report.totalRevenue)}*")
                appendLine("Total Transaksi: *${report.totalTransactions} Order*")
                appendLine("Total Item Terjual: *${report.totalItemsSold} Qty*")
                if (report.reservasiCount > 0) {
                    appendLine("Pesanan Reservasi: *${report.reservasiCount} Order* (${CurrencyFormatter.formatIDR(report.reservasiTotalAmount)})")
                }
                if (report.totalDiskon > 0) {
                    appendLine("Total Diskon Voucher: -${CurrencyFormatter.formatIDR(report.totalDiskon)}")
                }
                appendLine("--------------------------------")
                appendLine("*RINCIAN PEMBAYARAN:*")
                if (report.isCashActive) appendLine("• Tunai (Cash): *${CurrencyFormatter.formatIDR(report.cashTotal)}*")
                if (report.isQrisActive) appendLine("• QRIS: *${CurrencyFormatter.formatIDR(report.qrisTotal)}*")
                if (report.isEdcActive) appendLine("• EDC: *${CurrencyFormatter.formatIDR(report.edcTotal)}*")
                if (!report.isCashActive && !report.isQrisActive && !report.isEdcActive) {
                    appendLine("• (Tidak ada metode pembayaran aktif)")
                }
                if (report.topItems.isNotEmpty()) {
                    appendLine("--------------------------------")
                    appendLine("*Menu Terlaris:*")
                    report.topItems.forEachIndexed { i, item ->
                        appendLine("${i + 1}. ${item.nama} (${item.qty} pcs - ${CurrencyFormatter.formatIDR(item.totalRevenue)})")
                    }
                }
                appendLine("--------------------------------")
                appendLine("Status Sync: ${if (report.pendingSyncCount == 0) "100% Tersinkron" else "${report.pendingSyncCount} Tertunda"}")
                appendLine("_Laporan dikirim via Aplikasi Kasir Android_")
            }

            val sendIntent = Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, text)
                type = "text/plain"
            }
            val shareIntent = Intent.createChooser(sendIntent, "Bagikan Laporan Shift")
            context.startActivity(shareIntent)
        }
    }
}
