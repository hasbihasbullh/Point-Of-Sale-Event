package com.csm.pos.kasir.ui.screens.pos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.csm.pos.kasir.bluetooth.BluetoothPrinterManager
import com.csm.pos.kasir.bluetooth.EscPosBuilder
import com.csm.pos.kasir.data.local.dao.OrderWithItems
import com.csm.pos.kasir.data.local.entity.BoothEntity
import com.csm.pos.kasir.data.local.entity.DeviceConfigEntity
import com.csm.pos.kasir.data.local.entity.MenuItemEntity
import com.csm.pos.kasir.data.repository.PosRepository
import com.csm.pos.kasir.data.repository.SyncRepository
import com.csm.pos.kasir.domain.model.CartItem
import com.csm.pos.kasir.domain.model.PaymentMethod
import com.csm.pos.kasir.util.SoundHapticHelper
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class PosUiState(
    val currentBooth: BoothEntity? = null,
    val deviceConfig: DeviceConfigEntity? = null,
    val eventSetting: com.csm.pos.kasir.data.local.entity.EventSettingEntity? = null,
    val menuItems: List<MenuItemEntity> = emptyList(),
    val filteredMenuItems: List<MenuItemEntity> = emptyList(),
    val selectedCategory: String = "Semua",
    val searchQuery: String = "",
    val cart: List<CartItem> = emptyList(),
    val voucherCount: Int = 0,
    val pendingOrdersCount: Int = 0,
    val isSyncing: Boolean = false,
    val syncMessage: String? = null,

    // Dialog States
    val isCartSheetOpen: Boolean = false,
    val isPaymentDialogOpen: Boolean = false,
    val isReceiptDialogOpen: Boolean = false,
    val isRecentOrdersDialogOpen: Boolean = false,
    val isBluetoothPickerOpen: Boolean = false,
    val isPrinterSettingsOpen: Boolean = false,

    // Recent Orders
    val recentOrders: List<OrderWithItems> = emptyList(),
    val recentOrdersSearchQuery: String = "",
    val showOnlyTodayOrders: Boolean = true,
    val filteredRecentOrders: List<OrderWithItems> = emptyList(),

    // Payment Form
    val paymentMethod: PaymentMethod = PaymentMethod.CASH,
    val cashReceivedInput: String = "",
    val edcBank: String = "BCA",
    val noReferensiInput: String = "",
    val customerNameInput: String = "",
    val isConfirmingCheckout: Boolean = false,

    // Last completed order for printing
    val completedOrder: OrderWithItems? = null,
    val isPrinting: Boolean = false
) {
    val subtotal: Double
        get() = cart.sumOf { it.subtotal }

    val voucherNominal: Int
        get() = currentBooth?.voucherNominal ?: 5000

    val totalDiscount: Double
        get() = (voucherCount * voucherNominal).toDouble()

    val totalAmount: Double
        get() = maxOf(0.0, subtotal - totalDiscount)

    val cashReceivedAmount: Double
        get() = cashReceivedInput.toDoubleOrNull() ?: 0.0

    val cashChangeAmount: Double
        get() = if (cashReceivedAmount >= totalAmount) cashReceivedAmount - totalAmount else 0.0

    val totalCartItemsCount: Int
        get() = cart.sumOf { it.qty }
}

class PosViewModel(
    private val posRepo: PosRepository,
    private val syncRepo: SyncRepository,
    private val printerManager: BluetoothPrinterManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(PosUiState())
    val uiState: StateFlow<PosUiState> = _uiState.asStateFlow()

    private var confirmationTimerJob: Job? = null
    private var ordersJob: Job? = null
    private var autoSyncJob: Job? = null

    init {
        loadPosData()
    }

    private fun loadPosData() {
        // Observe Event Settings
        viewModelScope.launch {
            posRepo.getEventSettingFlow().collect { setting ->
                _uiState.value = _uiState.value.copy(eventSetting = setting)
            }
        }

        viewModelScope.launch {
            posRepo.getDeviceConfigFlow().collect { config ->
                _uiState.value = _uiState.value.copy(deviceConfig = config)
                config?.assignedBoothId?.let { boothId ->
                    val booth = posRepo.getBooth(boothId)
                    _uiState.value = _uiState.value.copy(currentBooth = booth)

                    // Listen Menu Items
                    launch {
                        posRepo.getMenuItemsFlow(boothId).collect { items ->
                            _uiState.value = _uiState.value.copy(menuItems = items)
                            applyFilter()
                        }
                    }

                    // Listen Recent Orders (Strictly Today by default)
                    observeOrders(boothId)

                    // Listen Pending Sync Count
                    launch {
                        posRepo.getPendingOrdersCountFlow(boothId).collect { count ->
                            _uiState.value = _uiState.value.copy(pendingOrdersCount = count)
                        }
                    }

                    // Start Continuous Background Heartbeat Auto-Sync (Every 30s)
                    startAutoSyncPoller(config.serverBaseUrl, boothId)
                }
            }
        }
    }

    private fun startAutoSyncPoller(serverBaseUrl: String, boothId: String) {
        autoSyncJob?.cancel()
        if (serverBaseUrl.isBlank() || boothId.isBlank()) return

        autoSyncJob = viewModelScope.launch {
            // 1. Initial immediate background sync on startup / entering POS
            performSilentBackgroundSync(serverBaseUrl, boothId)

            // 2. Periodic heartbeat sync every 30 seconds
            while (true) {
                delay(30_000)
                performSilentBackgroundSync(serverBaseUrl, boothId)
            }
        }
    }

    private suspend fun performSilentBackgroundSync(serverBaseUrl: String, boothId: String) {
        try {
            // Upload any pending offline transactions
            val pendingCount = posRepo.getPendingOrdersCount(boothId)
            if (pendingCount > 0) {
                syncRepo.syncPendingOrders(serverBaseUrl, boothId)
            }

            // Fetch today's orders & sync statuses
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            syncRepo.fetchAndCacheBoothOrders(serverBaseUrl, boothId, todayStr)

            // Refresh Master Menu, Prices, Availability, Vouchers & Event Settings
            syncRepo.fetchAndCacheMasterData(serverBaseUrl)
        } catch (e: Exception) {
            // Resilient silent catch: keep UI smooth if network is flaky
        }
    }

    private fun observeOrders(boothId: String) {
        ordersJob?.cancel()
        ordersJob = viewModelScope.launch {
            val flow = if (_uiState.value.showOnlyTodayOrders) {
                val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                posRepo.getTodayOrdersFlow(boothId, todayStr)
            } else {
                posRepo.getOrdersFlow(boothId)
            }
            flow.collect { orders ->
                _uiState.value = _uiState.value.copy(recentOrders = orders)
                applyRecentOrdersFilter()
            }
        }
    }

    fun onCategorySelected(category: String) {
        _uiState.value = _uiState.value.copy(selectedCategory = category)
        applyFilter()
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        applyFilter()
    }

    private fun applyFilter() {
        val all = _uiState.value.menuItems
        val cat = _uiState.value.selectedCategory
        val query = _uiState.value.searchQuery.trim().lowercase()

        val filtered = all.filter { item ->
            val matchCat = cat == "Semua" || item.kategori.equals(cat, ignoreCase = true)
            val matchQuery = query.isEmpty() || item.nama.lowercase().contains(query)
            matchCat && matchQuery
        }
        _uiState.value = _uiState.value.copy(filteredMenuItems = filtered)
    }

    fun addToCart(menuItem: MenuItemEntity) {
        val currentCart = _uiState.value.cart.toMutableList()
        val index = currentCart.indexOfFirst { it.menuItem.id == menuItem.id }

        if (index >= 0) {
            currentCart[index] = currentCart[index].copy(qty = currentCart[index].qty + 1)
        } else {
            currentCart.add(CartItem(menuItem = menuItem, qty = 1))
        }
        _uiState.value = _uiState.value.copy(cart = currentCart)
    }

    fun updateCartQty(menuItemId: String, newQty: Int) {
        val currentCart = _uiState.value.cart.toMutableList()
        val index = currentCart.indexOfFirst { it.menuItem.id == menuItemId }

        if (index >= 0) {
            if (newQty <= 0) {
                currentCart.removeAt(index)
            } else {
                currentCart[index] = currentCart[index].copy(qty = newQty)
            }
            _uiState.value = _uiState.value.copy(
                cart = currentCart,
                isCartSheetOpen = currentCart.isNotEmpty()
            )
        }
    }

    fun updateCartNotes(menuItemId: String, notes: String) {
        val currentCart = _uiState.value.cart.toMutableList()
        val index = currentCart.indexOfFirst { it.menuItem.id == menuItemId }
        if (index >= 0) {
            currentCart[index] = currentCart[index].copy(catatan = notes)
            _uiState.value = _uiState.value.copy(cart = currentCart)
        }
    }

    fun clearCart() {
        _uiState.value = _uiState.value.copy(
            cart = emptyList(),
            voucherCount = 0,
            isCartSheetOpen = false
        )
    }

    fun setVoucherCount(count: Int) {
        _uiState.value = _uiState.value.copy(voucherCount = maxOf(0, count))
    }

    fun openCartSheet() {
        _uiState.value = _uiState.value.copy(isCartSheetOpen = true)
    }

    fun closeCartSheet() {
        _uiState.value = _uiState.value.copy(isCartSheetOpen = false)
    }

    fun openPaymentDialog() {
        if (_uiState.value.cart.isEmpty()) return
        val booth = _uiState.value.currentBooth
        val defaultMethod = when {
            booth?.payCashActive != false -> PaymentMethod.CASH
            booth?.payQrisActive != false -> PaymentMethod.QRIS
            booth?.payEdcActive != false -> PaymentMethod.EDC
            else -> PaymentMethod.CASH
        }
        _uiState.value = _uiState.value.copy(
            isCartSheetOpen = false,
            isPaymentDialogOpen = true,
            isConfirmingCheckout = false,
            paymentMethod = defaultMethod,
            cashReceivedInput = "",
            customerNameInput = "",
            noReferensiInput = ""
        )
    }

    fun closePaymentDialog() {
        _uiState.value = _uiState.value.copy(
            isPaymentDialogOpen = false,
            isConfirmingCheckout = false
        )
        confirmationTimerJob?.cancel()
    }

    fun setPaymentMethod(method: PaymentMethod) {
        _uiState.value = _uiState.value.copy(paymentMethod = method)
    }

    fun onNumpadClick(key: String) {
        val current = _uiState.value.cashReceivedInput
        _uiState.value = _uiState.value.copy(cashReceivedInput = current + key)
    }

    fun onNumpadClear() {
        _uiState.value = _uiState.value.copy(cashReceivedInput = "")
    }

    fun onNumpadBackspace() {
        val current = _uiState.value.cashReceivedInput
        if (current.isNotEmpty()) {
            _uiState.value = _uiState.value.copy(cashReceivedInput = current.dropLast(1))
        }
    }

    fun onQuickCashSelected(amount: Double) {
        _uiState.value = _uiState.value.copy(cashReceivedInput = amount.toLong().toString())
    }

    fun onEdcBankChanged(bank: String) {
        _uiState.value = _uiState.value.copy(edcBank = bank)
    }

    fun onNoReferensiChanged(ref: String) {
        _uiState.value = _uiState.value.copy(noReferensiInput = ref)
    }

    fun onCustomerNameChanged(name: String) {
        _uiState.value = _uiState.value.copy(customerNameInput = name)
    }

    fun handleConfirmCheckoutClick() {
        val state = _uiState.value
        if (state.cart.isEmpty() || state.currentBooth == null) return

        // Validasi Cash
        if (state.paymentMethod == PaymentMethod.CASH && state.cashReceivedAmount < state.totalAmount) {
            return
        }

        if (state.isConfirmingCheckout) {
            // Double click confirmed -> Process Order!
            confirmationTimerJob?.cancel()
            _uiState.value = _uiState.value.copy(isConfirmingCheckout = false)
            processCheckout()
        } else {
            // First click -> Arm 3 second confirmation
            _uiState.value = _uiState.value.copy(isConfirmingCheckout = true)
            confirmationTimerJob?.cancel()
            confirmationTimerJob = viewModelScope.launch {
                delay(3000)
                _uiState.value = _uiState.value.copy(isConfirmingCheckout = false)
            }
        }
    }

    private fun processCheckout() {
        val state = _uiState.value
        val booth = state.currentBooth ?: return

        viewModelScope.launch {
            val orderWithItems = posRepo.createOrder(
                booth = booth,
                cartItems = state.cart,
                metodeBayar = state.paymentMethod.name,
                total = state.totalAmount,
                diskon = state.totalDiscount,
                uangBayar = if (state.paymentMethod == PaymentMethod.CASH) state.cashReceivedAmount else null,
                kembalian = if (state.paymentMethod == PaymentMethod.CASH) state.cashChangeAmount else null,
                noReferensi = if (state.paymentMethod == PaymentMethod.EDC) "${state.edcBank}: ${state.noReferensiInput}" else state.noReferensiInput.ifBlank { null },
                namaPelanggan = state.customerNameInput.ifBlank { null }
            )

            // Play success beep confirmation
            SoundHapticHelper.playBeepSuccess()

            // Reset cart & close payment dialog, open receipt
            _uiState.value = _uiState.value.copy(
                cart = emptyList(),
                voucherCount = 0,
                isPaymentDialogOpen = false,
                completedOrder = orderWithItems,
                isReceiptDialogOpen = true
            )

            // Auto-Print Struk jika fitur diaktifkan dan printer terhubung
            val config = _uiState.value.deviceConfig
            if (config?.autoPrint == true && !config.printerMacAddress.isNullOrBlank()) {
                launch {
                    printReceipt(config.printerMacAddress, orderWithItems)
                }
            }

            // Opportunistic Real-Time Auto-Push to Server (Non-blocking background push)
            launch {
                if (config != null && config.serverBaseUrl.isNotBlank()) {
                    try {
                        syncRepo.syncPendingOrders(config.serverBaseUrl, booth.id)
                    } catch (netErr: Exception) {
                        // Offline mode: silently queued in SQLite Room, no popup error
                    }
                }
            }
        }
    }

    fun printReceipt(macAddress: String, orderWithItems: OrderWithItems) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPrinting = true)
            val config = _uiState.value.deviceConfig
            val paperWidth = config?.paperWidth ?: "58mm"
            val is80mm = paperWidth.equals("80mm", ignoreCase = true)
            val printCopies = config?.printCopies ?: 1
            val showCust = config?.showCustomerName ?: true
            val showNotes = config?.showItemNotes ?: true
            val eventSetting = posRepo.getEventSetting()

            // Salinan 1: Struk Pelanggan
            val builder1 = EscPosBuilder(is80mm = is80mm)
            val bytes1 = builder1.buildTransactionReceipt(
                orderWithItems = orderWithItems,
                eventSetting = eventSetting,
                isKitchenCopy = false,
                showCustomerName = showCust,
                showItemNotes = showNotes
            )
            printerManager.printBytes(macAddress, bytes1)

            // Salinan 2: Struk Dapur / Checker (Jika konfigurasi 2 salinan)
            if (printCopies >= 2) {
                delay(800)
                val builder2 = EscPosBuilder(is80mm = is80mm)
                val bytes2 = builder2.buildTransactionReceipt(
                    orderWithItems = orderWithItems,
                    eventSetting = eventSetting,
                    isKitchenCopy = true,
                    showCustomerName = showCust,
                    showItemNotes = showNotes
                )
                printerManager.printBytes(macAddress, bytes2)
            }

            _uiState.value = _uiState.value.copy(isPrinting = false)
        }
    }

    fun testPrint(macAddress: String) {
        val booth = _uiState.value.currentBooth
        val config = _uiState.value.deviceConfig
        val paperWidth = config?.paperWidth ?: "58mm"
        val is80mm = paperWidth.equals("80mm", ignoreCase = true)
        val autoPrint = config?.autoPrint ?: false
        val printCopies = config?.printCopies ?: 1

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPrinting = true)
            val eventSetting = posRepo.getEventSetting()
            val bytes = EscPosBuilder(is80mm = is80mm).buildTestSlip(
                boothKode = booth?.kode ?: "POS",
                boothNama = booth?.nama ?: "Kasir Mobile",
                eventSetting = eventSetting,
                paperWidth = paperWidth,
                autoPrint = autoPrint,
                printCopies = printCopies
            )
            printerManager.printBytes(macAddress, bytes)
            _uiState.value = _uiState.value.copy(isPrinting = false)
        }
    }

    fun openPrinterSettingsDialog() {
        _uiState.value = _uiState.value.copy(isPrinterSettingsOpen = true)
    }

    fun closePrinterSettingsDialog() {
        _uiState.value = _uiState.value.copy(isPrinterSettingsOpen = false)
    }

    fun savePrinterSettings(
        paperWidth: String,
        autoPrint: Boolean,
        printCopies: Int,
        showCustomerName: Boolean,
        showItemNotes: Boolean
    ) {
        viewModelScope.launch {
            val currentConfig = posRepo.getDeviceConfig() ?: DeviceConfigEntity()
            val updatedConfig = currentConfig.copy(
                paperWidth = paperWidth,
                autoPrint = autoPrint,
                printCopies = printCopies,
                showCustomerName = showCustomerName,
                showItemNotes = showItemNotes
            )
            posRepo.saveDeviceConfig(updatedConfig)
            _uiState.value = _uiState.value.copy(
                deviceConfig = updatedConfig,
                isPrinterSettingsOpen = false
            )
        }
    }

    fun closeReceiptDialog() {
        _uiState.value = _uiState.value.copy(isReceiptDialogOpen = false, completedOrder = null)
    }

    fun syncPendingOrdersNow() {
        val config = _uiState.value.deviceConfig ?: return
        val booth = _uiState.value.currentBooth ?: return

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSyncing = true, syncMessage = null)

            // 1. Upload all pending orders (including offline VOID)
            val result = syncRepo.syncPendingOrders(config.serverBaseUrl, booth.id)

            // 2. Refresh today's orders & status
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            syncRepo.fetchAndCacheBoothOrders(config.serverBaseUrl, booth.id, todayStr)

            // 3. Refresh Master Menu, Prices, Availability & Event Settings
            val masterResult = syncRepo.fetchAndCacheMasterData(config.serverBaseUrl)

            if (result.isSuccess || masterResult.isSuccess) {
                val count = result.getOrDefault(0)
                _uiState.value = _uiState.value.copy(
                    isSyncing = false,
                    syncMessage = if (count > 0) {
                        "Sukses menyinkronkan $count pesanan & memperbarui menu!"
                    } else {
                        "Semua data transaksi & menu berhasil disinkronkan."
                    }
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isSyncing = false,
                    syncMessage = "Gagal terhubung ke server (Mode Offline Aktif)."
                )
            }
            delay(4000)
            _uiState.value = _uiState.value.copy(syncMessage = null)
        }
    }

    fun voidOrder(orderId: String, reason: String? = null) {
        val config = _uiState.value.deviceConfig ?: return
        viewModelScope.launch {
            syncRepo.voidOrder(config.serverBaseUrl, orderId, reason)
            applyRecentOrdersFilter()
        }
    }

    fun openBluetoothPicker() {
        _uiState.value = _uiState.value.copy(isBluetoothPickerOpen = true)
    }

    fun closeBluetoothPicker() {
        _uiState.value = _uiState.value.copy(isBluetoothPickerOpen = false)
    }

    fun onPrinterSelected(mac: String, name: String) {
        viewModelScope.launch {
            val currentConfig = posRepo.getDeviceConfig() ?: DeviceConfigEntity()
            posRepo.saveDeviceConfig(currentConfig.copy(printerMacAddress = mac, printerName = name))
            _uiState.value = _uiState.value.copy(isBluetoothPickerOpen = false)
        }
    }

    fun openRecentOrdersDialog() {
        _uiState.value = _uiState.value.copy(isRecentOrdersDialogOpen = true)
        applyRecentOrdersFilter()
    }

    fun closeRecentOrdersDialog() {
        _uiState.value = _uiState.value.copy(isRecentOrdersDialogOpen = false)
    }

    fun onRecentOrdersSearchChanged(query: String) {
        _uiState.value = _uiState.value.copy(recentOrdersSearchQuery = query)
        applyRecentOrdersFilter()
    }

    fun setShowOnlyTodayOrders(onlyToday: Boolean) {
        _uiState.value = _uiState.value.copy(showOnlyTodayOrders = onlyToday)
        _uiState.value.currentBooth?.id?.let { boothId ->
            observeOrders(boothId)
        }
    }

    private fun applyRecentOrdersFilter() {
        val all = _uiState.value.recentOrders
        val query = _uiState.value.recentOrdersSearchQuery.trim().lowercase()
        val filtered = if (query.isEmpty()) {
            all
        } else {
            all.filter {
                it.order.nomorOrder.lowercase().contains(query) ||
                (it.order.namaPelanggan?.lowercase()?.contains(query) == true) ||
                it.order.metodeBayar.lowercase().contains(query) ||
                it.order.status.lowercase().contains(query) ||
                it.items.any { item -> item.namaItem.lowercase().contains(query) } ||
                ((query.contains("voucher") || query.contains("diskon") || query.contains("potongan")) && it.order.diskon > 0)
            }
        }
        _uiState.value = _uiState.value.copy(filteredRecentOrders = filtered)
    }
}
