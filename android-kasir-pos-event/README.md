# 📱 Mobile Cashier POS - Native Android Application

A fast, lightweight, and offline-first mobile cashier application built natively for Android using Kotlin and Jetpack Compose. Designed specifically for food festival stalls, pop-up merchants, and roaming cashiers operating under unstable or absent network connectivity.

---

## 🚀 Key Highlights & Architecture

- **100% Offline-First (Room SQLite)**: Full checkout, order queuing, and inventory rollback capabilities even when disconnected from the central server.
- **Hardware-Enforced Booth Locking**: Binds the handheld device to a specific stall/booth identity (e.g., `[A01] Wings Station`) with automated daily ticket numbering (`A01-0001`, `A01-0002`).
- **Direct ESC/POS Bluetooth Thermal Printing**: Native printer discovery and thermal printing for standard 58mm and 80mm mobile belt printers.
- **Booth Shift Reports (Z-Report)**: Instant calculation of daily gross turnover, cash-in-drawer audit, non-cash payment summaries (QRIS & EDC), top 5 selling items, and thermal report printouts.
- **Hardened Data Privacy**: Automatic masking of HTTP logging in release builds (`HttpLoggingInterceptor.Level.NONE`) to prevent customer transaction data leakage in Android Logcat.
- **Non-Destructive Database Protection**: Room database configured with strict migration safeguards to prevent accidental data loss during application updates.
- **Smart Background & Manual Sync**: Real-time non-blocking order push (~300ms) with automated background sync and manual downstream catalog refresh.

---

## 🏛️ Android Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Jetpack Compose UI                   │
│  - PosScreen (Menu Catalog, Cart Drawer, Checkout)    │
│  - BoothReportScreen (Z-Report, Cash Audit, Top Menu) │
│  - SetupBoothScreen (Server Pairing, Booth Lock)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 MVVM ViewModels                        │
│  - PosViewModel, BoothReportViewModel, SetupViewModel  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Repository Layer                    │
│  - PosRepository (Cart, Transactions, Local Stock)     │
│  - SyncRepository (Batch Push, Conflict Resolution)    │
│  - ReportRepository (Z-Report Aggregate Metrics)       │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────┐ ┌────────────────────────┐
│     Room Database (SQLite)  │ │   Retrofit 2 HTTP API  │
│  - OrderDao, MenuItemDao    │ │  - Master Data DTO     │
│  - BoothDao, EventConfigDao │ │  - SyncBatch API       │
└─────────────────────────────┘ └────────────────────────┘
```

---

## 🛠️ Setup & Build Instructions

### Prerequisites

- **Android Studio**: Ladybug (2024.2+) or newer
- **JDK**: Java 17 or Java 21
- **Target SDK**: Android 14 (API 34)
- **Minimum SDK**: Android 8.0 Oreo (API 26)

### 1. Open Project in Android Studio

1. Launch **Android Studio**.
2. Select **Open** and navigate to:
   ```
   c:\laragon\www\csm\android-kasir-pos-event
   ```
3. Allow Gradle to download dependencies and sync the project.

### 2. Run on Physical Device (USB Debugging)

1. On your Android phone, enable **Developer Options** and turn on **USB Debugging**.
2. Connect the phone to your computer via USB.
3. Select your device from the target device dropdown in Android Studio and click **Run 'app' (▶️)**.

### 3. Build Production / Distribution APK

To generate a standalone `.apk` for installing directly on cashier smartphones:

```bash
# On Windows PowerShell / Command Prompt (from android-kasir-pos-event/ directory)
.\gradlew assembleDebug

# Output APK path:
# app/build/outputs/apk/debug/app-debug.apk
```

---

## 📋 On-Site Cashier Standard Operating Procedure (SOP)

### Phase 1: Device Configuration & Server Pairing

1. Connect the Android phone to the local POS Wi-Fi network (or festival LAN).
2. Launch the **POS Kasir** app.
3. In the initial setup screen, enter the local server address (e.g., `http://192.168.1.100:3000`).
4. Tap **Download & Sync Data** to fetch the active booth roster and master menu items.
5. Select the designated booth (e.g., `[A01] Wings Station`) and tap **Lock Device**.

### Phase 2: Bluetooth Printer Setup

1. Turn on your portable thermal belt printer (58mm or 80mm).
2. Pair the printer with your Android device via standard Android Bluetooth settings.
3. In the POS app, tap the **Bluetooth Icon** in the top-right corner and select your paired thermal printer.

### Phase 3: Processing Orders

1. Tap menu cards to add items to the cart. Adjust quantities or add notes directly.
2. Tap the floating **Cart Drawer** at the bottom.
3. Select the payment method:
   - **CASH**: Enter cash received to see exact change calculation.
   - **QRIS**: Customer scans static QRIS; verify success on mobile screen.
   - **EDC**: Enter bank trace ID from the physical EDC machine.
4. Tap **Process Payment** (double-tap confirmation prevents accidental submissions).
5. The receipt prints automatically via Bluetooth.

### Phase 4: Voiding / Cancelling a Transaction

1. Tap **Recent Orders** from the top bar.
2. Locate the transaction and tap **Void Order**.
3. Confirm the cancellation: the item stocks are immediately returned to local inventory, and the status updates to `VOID` locally and synchronizes to the server.

### Phase 5: Shift Closing & Cash Settlement (Z-Report)

1. Tap the **Report Icon** on the top bar.
2. Review the **Cash on Hand** total for cash drawer balancing.
3. Tap **Print Z-Report** to produce a thermal summary slip.
4. Hand over the cash and the physical Z-Report slip to the event finance administrator.

---

## 📦 Key Libraries & Technologies

- **Jetpack Compose**: Declarative UI toolkit with Material 3 components.
- **Room Persistence Library**: Offline SQLite database with reactive `Flow` queries and safe migrations.
- **Retrofit 2 & OkHttp3**: HTTP client for background REST API communication with release-mode logcat protection.
- **Kotlin Coroutines & Flow**: Asynchronous concurrency and reactive state streams.
- **WorkManager**: Periodic and constraint-based background data synchronization.
- **Android Bluetooth SPP**: Native ESC/POS byte stream transmission for 58mm/80mm mobile printers.

---

## 📜 License

Licensed under the Apache-2.0 License.
