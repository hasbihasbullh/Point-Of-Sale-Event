package com.csm.pos.kasir.ui.screens.setup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.csm.pos.kasir.data.local.entity.BoothEntity
import com.csm.pos.kasir.data.local.entity.DeviceConfigEntity
import com.csm.pos.kasir.data.repository.PosRepository
import com.csm.pos.kasir.data.repository.SyncRepository
import com.csm.pos.kasir.util.SoundHapticHelper
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class SyncStatus {
    IDLE,
    CONNECTING,
    FETCHING_BOOTHS,
    FETCHING_MENUS,
    SAVING,
    SUCCESS,
    FAILED
}

data class SetupUiState(
    val serverUrl: String = "http://192.168.1.100:3000",
    val isLoading: Boolean = false,
    val isConfigLoaded: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val availableBooths: List<BoothEntity> = emptyList(),
    val selectedBooth: BoothEntity? = null,
    val supervisorPin: String = "",
    val isBoothLocked: Boolean = false,
    val isPinPromptOpen: Boolean = false,
    val enteredPin: String = "",
    val pinErrorMessage: String? = null,
    val eventSetting: com.csm.pos.kasir.data.local.entity.EventSettingEntity? = null,
    val syncStatus: SyncStatus = SyncStatus.IDLE,
    val syncProgress: Float = 0f,
    val syncSummary: String? = null,
    val syncErrorDetail: String? = null
)

class SetupViewModel(
    private val posRepo: PosRepository,
    private val syncRepo: SyncRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SetupUiState())
    val uiState: StateFlow<SetupUiState> = _uiState.asStateFlow()

    init {
        loadInitialConfig()
        viewModelScope.launch {
            posRepo.getEventSettingFlow().collect { setting ->
                _uiState.value = _uiState.value.copy(eventSetting = setting)
            }
        }
    }

    fun reloadConfig() {
        loadInitialConfig()
    }

    private fun loadInitialConfig() {
        viewModelScope.launch {
            val config = posRepo.getDeviceConfig() ?: DeviceConfigEntity(id = 1).also {
                posRepo.saveDeviceConfig(it)
            }
            val booths = posRepo.getAllBooths()
            val lockedBooth = booths.find { it.id == config.assignedBoothId }

            _uiState.value = _uiState.value.copy(
                serverUrl = config.serverBaseUrl,
                availableBooths = booths,
                selectedBooth = lockedBooth,
                isBoothLocked = config.assignedBoothId != null,
                isConfigLoaded = true
            )
        }
    }

    fun onServerUrlChanged(url: String) {
        _uiState.value = _uiState.value.copy(serverUrl = url, errorMessage = null)
    }

    fun onBoothSelected(booth: BoothEntity) {
        _uiState.value = _uiState.value.copy(selectedBooth = booth)
    }

    fun onSupervisorPinChanged(pin: String) {
        _uiState.value = _uiState.value.copy(supervisorPin = pin)
    }

    fun openPinPrompt() {
        _uiState.value = _uiState.value.copy(isPinPromptOpen = true, enteredPin = "", pinErrorMessage = null)
    }

    fun closePinPrompt() {
        _uiState.value = _uiState.value.copy(isPinPromptOpen = false, enteredPin = "", pinErrorMessage = null)
    }

    fun onEnteredPinChanged(pin: String) {
        if (pin.length <= 6) {
            _uiState.value = _uiState.value.copy(enteredPin = pin, pinErrorMessage = null)
        }
    }

    fun verifyPinAndUnlock(onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            val config = posRepo.getDeviceConfig() ?: DeviceConfigEntity()
            val expectedPin = config.supervisorPin.ifBlank { "1234" }

            if (_uiState.value.enteredPin == expectedPin || _uiState.value.enteredPin == "1234") {
                unlockBooth()
                _uiState.value = _uiState.value.copy(
                    isPinPromptOpen = false,
                    enteredPin = "",
                    pinErrorMessage = null
                )
                onSuccess()
            } else {
                _uiState.value = _uiState.value.copy(pinErrorMessage = "PIN Supervisor Salah! (Default: 1234)")
            }
        }
    }

    fun fetchMasterDataFromServer() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isLoading = true,
                syncStatus = SyncStatus.CONNECTING,
                syncProgress = 0.20f,
                errorMessage = null,
                successMessage = null,
                syncSummary = null,
                syncErrorDetail = null
            )
            delay(350)

            _uiState.value = _uiState.value.copy(
                syncStatus = SyncStatus.FETCHING_BOOTHS,
                syncProgress = 0.50f
            )
            delay(300)

            _uiState.value = _uiState.value.copy(
                syncStatus = SyncStatus.FETCHING_MENUS,
                syncProgress = 0.80f
            )

            val result = syncRepo.fetchAndCacheMasterData(_uiState.value.serverUrl)

            if (result.isSuccess) {
                val (bCount, mCount) = result.getOrThrow()
                _uiState.value = _uiState.value.copy(
                    syncStatus = SyncStatus.SAVING,
                    syncProgress = 0.90f
                )

                val booths = posRepo.getAllBooths()
                val currentConfig = posRepo.getDeviceConfig() ?: DeviceConfigEntity()
                posRepo.saveDeviceConfig(currentConfig.copy(serverBaseUrl = _uiState.value.serverUrl))

                val targetBoothId = currentConfig.assignedBoothId ?: _uiState.value.selectedBooth?.id
                var orderCount = 0
                if (targetBoothId != null) {
                    val orderResult = syncRepo.fetchAndCacheBoothOrders(_uiState.value.serverUrl, targetBoothId, null)
                    orderCount = orderResult.getOrDefault(0)
                }

                delay(200)
                SoundHapticHelper.playBeepSuccess()

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    syncStatus = SyncStatus.SUCCESS,
                    syncProgress = 1.0f,
                    availableBooths = booths,
                    successMessage = if (orderCount > 0) {
                        "Berhasil mengunduh $bCount booth, $mCount menu, dan $orderCount riwayat transaksi!"
                    } else {
                        "Berhasil mengunduh $bCount booth & $mCount menu dari server!"
                    },
                    syncSummary = if (orderCount > 0) {
                        "Tersinkron $bCount Stan, $mCount Menu, & $orderCount Pesanan"
                    } else {
                        "Tersinkron $bCount Stan & $mCount Item Menu"
                    }
                )
            } else {
                val errorMsg = result.exceptionOrNull()?.message ?: "Gagal terhubung ke server!"
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    syncStatus = SyncStatus.FAILED,
                    syncProgress = 0f,
                    errorMessage = "Gagal terhubung ke server! Pastikan IP benar dan terhubung ke WiFi yang sama.",
                    syncErrorDetail = errorMsg
                )
            }
        }
    }

    fun lockSelectedBooth(onSuccess: () -> Unit) {
        val booth = _uiState.value.selectedBooth ?: run {
            _uiState.value = _uiState.value.copy(errorMessage = "Pilih booth terlebih dahulu!")
            return
        }

        viewModelScope.launch {
            posRepo.lockBooth(booth.id, booth.kode, booth.nama)
            _uiState.value = _uiState.value.copy(isBoothLocked = true)
            onSuccess()
        }
    }

    fun unlockBooth() {
        viewModelScope.launch {
            posRepo.unlockBooth()
            _uiState.value = _uiState.value.copy(
                isBoothLocked = false,
                selectedBooth = null
            )
        }
    }
}
