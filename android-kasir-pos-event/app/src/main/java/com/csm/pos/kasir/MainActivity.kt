package com.csm.pos.kasir

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.core.view.WindowCompat
import com.csm.pos.kasir.bluetooth.BluetoothPrinterManager
import com.csm.pos.kasir.data.repository.PosRepository
import com.csm.pos.kasir.data.repository.ReportRepository
import com.csm.pos.kasir.data.repository.SyncRepository
import com.csm.pos.kasir.ui.screens.pos.PosMainScreen
import com.csm.pos.kasir.ui.screens.pos.PosViewModel
import com.csm.pos.kasir.ui.screens.printer.BluetoothDevicePickerDialog
import com.csm.pos.kasir.ui.screens.printer.PrinterSettingsDialog
import com.csm.pos.kasir.ui.screens.report.BoothReportScreen
import com.csm.pos.kasir.ui.screens.report.BoothReportViewModel
import com.csm.pos.kasir.ui.screens.setup.SetupBoothScreen
import com.csm.pos.kasir.ui.screens.setup.SetupViewModel
import com.csm.pos.kasir.ui.theme.Orange500
import com.csm.pos.kasir.ui.theme.PosAppTheme
import com.csm.pos.kasir.ui.theme.Slate950

enum class Screen {
    SETUP,
    POS,
    REPORT
}

class MainActivity : ComponentActivity() {

    private val printerManager by lazy { BluetoothPrinterManager(applicationContext) }

    private val setupViewModel: SetupViewModel by viewModels {
        val app = application as PosApplication
        val db = app.database
        val posRepo = PosRepository(db)
        val syncRepo = SyncRepository(db, applicationContext)
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                @Suppress("UNCHECKED_CAST")
                return SetupViewModel(posRepo, syncRepo) as T
            }
        }
    }

    private val posViewModel: PosViewModel by viewModels {
        val app = application as PosApplication
        val db = app.database
        val posRepo = PosRepository(db)
        val syncRepo = SyncRepository(db, applicationContext)
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                @Suppress("UNCHECKED_CAST")
                return PosViewModel(posRepo, syncRepo, printerManager) as T
            }
        }
    }

    private val reportViewModel: BoothReportViewModel by viewModels {
        val app = application as PosApplication
        val db = app.database
        val posRepo = PosRepository(db)
        val reportRepo = ReportRepository(db)
        val syncRepo = SyncRepository(db, applicationContext)
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                @Suppress("UNCHECKED_CAST")
                return BoothReportViewModel(reportRepo, posRepo, syncRepo, printerManager) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
            window.isStatusBarContrastEnforced = false
        }
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT

        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        insetsController.isAppearanceLightStatusBars = false
        insetsController.isAppearanceLightNavigationBars = false

        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        setContent {
            PosAppTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    var currentScreen by rememberSaveable { mutableStateOf(Screen.POS) }
                    var hasInitialNavigated by rememberSaveable { mutableStateOf(false) }

                    val setupState by setupViewModel.uiState.collectAsState()
                    val posState by posViewModel.uiState.collectAsState()

                    // Navigasi awal saat aplikasi baru dibuka (Cold Start)
                    LaunchedEffect(setupState.isConfigLoaded, setupState.isBoothLocked) {
                        if (setupState.isConfigLoaded && !hasInitialNavigated) {
                            hasInitialNavigated = true
                            currentScreen = if (setupState.isBoothLocked) Screen.POS else Screen.SETUP
                        }
                    }

                    if (!setupState.isConfigLoaded) {
                        // Layar Loading Awal saat memeriksa SQLite Room lokal
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Slate950),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = Orange500)
                        }
                    } else {
                        when (currentScreen) {
                            Screen.SETUP -> {
                                SetupBoothScreen(
                                    viewModel = setupViewModel,
                                    onBoothLockedSuccess = {
                                        currentScreen = Screen.POS
                                    },
                                    onNavigateBack = {
                                        currentScreen = Screen.POS
                                    }
                                )
                            }
                            Screen.POS -> {
                                PosMainScreen(
                                    viewModel = posViewModel,
                                    onNavigateToReport = {
                                        reportViewModel.loadReport()
                                        currentScreen = Screen.REPORT
                                    },
                                    onNavigateToSetup = {
                                        setupViewModel.reloadConfig()
                                        currentScreen = Screen.SETUP
                                    }
                                )
                            }
                            Screen.REPORT -> {
                                BoothReportScreen(
                                    viewModel = reportViewModel,
                                    onNavigateBack = {
                                        currentScreen = Screen.POS
                                    }
                                )
                            }
                        }

                        // Global Printer Settings Dialog
                        if (posState.isPrinterSettingsOpen) {
                            PrinterSettingsDialog(
                                config = posState.deviceConfig,
                                isPrinting = posState.isPrinting,
                                onSaveSettings = { paperWidth, autoPrint, printCopies, showCust, showNotes ->
                                    posViewModel.savePrinterSettings(paperWidth, autoPrint, printCopies, showCust, showNotes)
                                },
                                onChangePrinterClick = {
                                    posViewModel.openBluetoothPicker()
                                },
                                onTestPrintClick = {
                                    posState.deviceConfig?.printerMacAddress?.let { mac ->
                                        posViewModel.testPrint(mac)
                                    }
                                },
                                onDismiss = { posViewModel.closePrinterSettingsDialog() }
                            )
                        }

                        // Global Bluetooth Printer Picker Dialog
                        if (posState.isBluetoothPickerOpen) {
                            BluetoothDevicePickerDialog(
                                printerManager = printerManager,
                                selectedAddress = posState.deviceConfig?.printerMacAddress,
                                onDeviceSelected = { mac, name ->
                                    posViewModel.onPrinterSelected(mac, name)
                                },
                                onTestPrint = { mac ->
                                    posViewModel.testPrint(mac)
                                },
                                onDismiss = { posViewModel.closeBluetoothPicker() }
                            )
                        }
                    }
                }
            }
        }
    }
}
