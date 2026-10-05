# 🎪 Festival Point of Sale (POS) & Event Management Ecosystem

A high-performance, offline-resilient Point of Sale (POS), Self-Service Kiosk, Kitchen Display System (KDS), and Back-Office Analytics platform designed for high-density food festivals, pop-up markets, and multi-tenant culinary events.

The system is architected to operate seamlessly in both online networked environments and constrained, offline local-area networks (LAN/Starlink) with bidirectional synchronization between mobile cashier hardware, web terminals, and the central database server.

---

## 🏗️ System Architecture

```
                                ┌─────────────────────────────────────────┐
                                │       Executive Admin Dashboard         │
                                │  - Real-Time Analytics & Revenue Charts │
                                │  - Booth & Menu Inventory Management    │
                                │  - Master Category & Sequence Ordering │
                                │  - Multi-Node Fleet Consolidation       │
                                │  - Dynamic Event Settings & Branding    │
                                └────────────────────┬────────────────────┘
                                                     │
                                                     ▼
┌────────────────────────┐             ┌─────────────────────────┐             ┌────────────────────────┐
│   Self-Service Kiosk   │             │   Modular Backend API   │             │  Kitchen Display (KDS) │
│ - Touch-Screen Catalog │ ──────────► │     Express + TypeScript│ ──────────► │ - Real-Time SSE Stream │
│ - Multi-Channel Pay    │             │  - MySQL & Prisma ORM   │             │ - Web Audio Bell Chime │
│ - Supervisor PIN Guard │             │  - Layered Clean Arch   │             │ - Cook Order Lifecycle │
│ - Thermal ESC/POS      │             │  - Sharp WebP Optimizer │             │ - Overdue Heat Alerts  │
└────────────────────────┘             └────────────▲────────────┘             └────────────────────────┘
                                                    │
                      ┌─────────────────────────────┴─────────────────────────────┐
                      │                                                           │
                      ▼                                                           ▼
       ┌─────────────────────────────┐                             ┌─────────────────────────────┐
       │     Web POS (Cashier)       │                             │ Native Android Mobile POS   │
       │ - Desktop / Tablet View     │                             │ - Kotlin + Jetpack Compose  │
       │ - Instant Offline IndexedDB │                             │ - Offline-First SQLite/Room │
       │ - Bluetooth / Web Thermal   │                             │ - ESC/POS Bluetooth Print   │
       │ - Fast Cart & Search Engine │                             │ - Shift Z-Report & Audit    │
       └─────────────────────────────┘                             └─────────────────────────────┘
```

---

## ✨ Core Modules & Capabilities

### 1. 🛒 Web Point of Sale (Cashier Terminal)

- **Fast Touch Interface**: Optimized category filtering, quick quantity adjustments, search autocomplete, and cart drawer.
- **Multi-Payment Support**: Handles Cash (with change calculation), static QRIS, and EDC bank trace ID recording.
- **Voucher Discount Engine**: Configurable voucher nominals per booth with automated subtotal deductions.
- **Fail-Safe Checkout**: Two-step confirmation window prevents duplicate submissions during rush hours.
- **Dual Printing Engine**: Native browser thermal printing (58mm/80mm) and direct Android RawBT Bluetooth intent dispatch.

### 2. 📱 Android Native Mobile POS

- **Offline-First Architecture**: Powered by Android Room (SQLite). Transactions process in ~300ms regardless of internet status.
- **Device-to-Booth Binding**: Locks each handheld terminal to its assigned booth code with automated queue numbering (`A01-0001`).
- **Bluetooth ESC/POS Direct Print**: Connects directly to mobile thermal belt printers via Bluetooth SPP.
- **Booth Shift Reports (Z-Report)**: Summarizes cash on hand, non-cash totals, best-selling items, and supports instant thermal printing or sharing via WhatsApp.
- **Hardened Data Privacy**: Masked HTTP logs in release builds to protect customer transaction privacy.

### 3. 🍳 Kitchen Display System (KDS)

- **Zero-Latency Dispatch**: Orders from Kiosk, Web POS, and Mobile POS appear instantly on the kitchen display via Server-Sent Events (SSE).
- **Audio Feedback**: Synthesizes custom two-tone bell chimes using the Web Audio API when new orders arrive.
- **Order Lifecycle Tracking**: Move tickets through `BARU` (New) $\rightarrow$ `DIPROSES` (Cooking) $\rightarrow$ `SELESAI` (Ready).
- **Overdue Heat Alerts**: Visual warnings when prep time exceeds 8 or 15 minutes.

### 4. 🖥️ Self-Service Kiosk

- **Customer-Facing Self-Ordering**: Visual catalog with high-resolution food assets, category tabs, and real-time out-of-stock badges.
- **Supervisor PIN Modal Guard**: Sensitive actions (opening/closing stall, emergency menu disabling, and order corrections) are protected by a 4-digit Supervisor PIN.
- **Queue Slip Generation**: Prints queue receipts with thermal layout and barcode/order numbers.

### 5. 📊 Executive Analytics & Admin Panel

- **Real-Time Revenue Monitoring**: Tracks gross revenue, net turnover, claimed vouchers, and hourly transaction velocity.
- **Master Category Management**: Dedicated category CRUD with icon pickers, badge colors, and drag-and-drop sequence reordering.
- **VOID Transaction Audit Logging**: Complete transparency into cancelled orders. VOID orders appear with audit badges and strikethroughs while keeping financial turnover 100% accurate.
- **Dynamic Event Branding (`EventSetting`)**: Configure festival name, venue location, connectivity type, sponsor branding, and thermal receipt footers with instant live propagation across all connected terminals.
- **Multi-Node Fleet Consolidation**: Remote transaction pulling across independent kiosk laptops and offline JSON export/import reconciliation.
- **Excel Data Exporter (`.xlsx`)**: Generates structured reports covering summary metrics, booth breakdowns, top menus, and raw audit transactions.

---

## 🛠️ Technology Stack

| Layer                    | Technology                                                                    |
| :----------------------- | :---------------------------------------------------------------------------- |
| **Backend Runtime**      | Node.js (v20+ LTS)                                                            |
| **Architecture Pattern** | Clean Layered Architecture (Config, Middlewares, Services, Routes, Utils)     |
| **Server Framework**     | Express.js, TypeScript                                                        |
| **Database & ORM**       | MySQL 8.0, Prisma ORM                                                         |
| **Image Optimization**   | Sharp (Automated WebP conversion & dimension constraints)                     |
| **Real-Time Engine**     | Server-Sent Events (SSE), Node.js EventEmitter (Max Listeners: 100)           |
| **Frontend Framework**   | React 19, TypeScript, Vite                                                    |
| **Styling & Icons**      | Tailwind CSS v4, Lucide React, Modern UI tokens                               |
| **Client Database**      | IndexedDB (Dexie.js / Native Wrapper)                                         |
| **Data Export**          | SheetJS (XLSX)                                                                |
| **Mobile App**           | Native Android (Kotlin, Jetpack Compose, Room SQLite, Retrofit 2, Coroutines) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ LTS recommended)
- **MySQL Server**: v8.0 or higher (e.g., Laragon, XAMPP, or standalone MySQL)
- **Package Manager**: `npm` (comes with Node.js)

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd csm
npm install
```

### 2. Environment Configuration

Copy the template configuration file to create `.env`:

```bash
# Windows (PowerShell / CMD)
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

Ensure your database credentials and secret keys in `.env` match your local setup:

```env
DATABASE_URL="mysql://root:@localhost:3306/pos_system"
JWT_SECRET="pos_system_jwt_secret_key_super_secure_csm_2026"
PORT=3000
NODE_ENV=development
SUPERVISOR_PIN="8888"
SYNC_SECRET="csm_fleet_sync_pass_2026"
```

### 3. Initialize Database Schema

Run Prisma migrations and generate the client:

```bash
npx prisma db push
npx prisma generate
```

_(Optional) Seed default event configuration:_

```bash
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.eventSetting.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default', nama_event: 'Food Festival 2026', tanggal_event: '2026', area_lokasi: 'Main Venue', konektivitas: 'Local POS LAN', client_merchant: 'Festival Organizer', footer_struk: 'Thank you for your order!\nPlease keep this receipt.' } }).then(() => console.log('Seeded successfully')).finally(() => p.\$disconnect());"
```

### 4. Run Development Server

```bash
npm run dev
```

The server will boot on `http://localhost:3000` (or your local LAN IP address `http://192.168.x.x:3000`).

### 5. Build for Production

```bash
npm run build
npm run start
```

This builds the optimized React frontend and bundles the modular backend into `dist/server.cjs` via `esbuild`.

---

## 📡 REST API Reference

### 1. Authentication & Admin (`/api/admin`)

| Method | Endpoint                     |  Auth  | Description                                  |
| :----- | :--------------------------- | :----: | :------------------------------------------- |
| `POST` | `/api/admin/login`           | Public | Admin login & JWT token issuance             |
| `GET`  | `/api/admin/profile`         |  JWT   | Retrieve current admin profile               |
| `PUT`  | `/api/admin/profile`         |  JWT   | Update admin full name, username, and avatar |
| `PUT`  | `/api/admin/change-password` |  JWT   | Update admin password with bcrypt hashing    |

### 2. Master Categories (`/api/categories`)

| Method   | Endpoint                  |  Auth  | Description                                        |
| :------- | :------------------------ | :----: | :------------------------------------------------- |
| `GET`    | `/api/categories`         | Public | List all categories with real-time menu counts     |
| `POST`   | `/api/categories`         |  JWT   | Create a new master category                       |
| `PUT`    | `/api/categories/:id`     |  JWT   | Update category name, color badge, and icon        |
| `DELETE` | `/api/categories/:id`     |  JWT   | Delete category (blocked if still linked to menus) |
| `POST`   | `/api/categories/reorder` |  JWT   | Bulk update category display order                 |

### 3. Master Menus (`/api/master-menus`)

| Method   | Endpoint                |  Auth  | Description                                           |
| :------- | :---------------------- | :----: | :---------------------------------------------------- |
| `GET`    | `/api/master-menus`     | Public | List all global master menus                          |
| `POST`   | `/api/master-menus`     |  JWT   | Create a master menu and auto-assign to active booths |
| `PUT`    | `/api/master-menus/:id` |  JWT   | Update menu price, categories, image, and KDS flag    |
| `DELETE` | `/api/master-menus/:id` |  JWT   | Delete menu and cascade cleanup (blocked if ordered)  |

### 4. Booths & Menu Assignments (`/api/booths`)

| Method   | Endpoint                               |  Auth  | Description                                      |
| :------- | :------------------------------------- | :----: | :----------------------------------------------- |
| `GET`    | `/api/booths`                          | Public | List all festival booths & payment settings      |
| `POST`   | `/api/booths`                          |  JWT   | Register new booth and auto-link master menus    |
| `PUT`    | `/api/booths/:id`                      |  JWT   | Update booth settings, QRIS, and payment toggles |
| `DELETE` | `/api/booths/:id`                      |  JWT   | Delete booth and cascade booth menus             |
| `GET`    | `/api/booths/:booth_id/menus`          | Public | Get menu roster specific to a booth              |
| `POST`   | `/api/booths/:booth_id/assign-menus`   |  JWT   | Bulk assign/override menus for a booth           |
| `PUT`    | `/api/booths/:booth_id/menus/:menu_id` |  JWT   | Override individual price/stock/availability     |
| `GET`    | `/api/booths/:booth_id/orders`         | Public | List transaction history for a booth             |

### 5. Orders & Kitchen Lifecycle (`/api/orders`)

| Method | Endpoint                       |   Auth    | Description                                                            |
| :----- | :----------------------------- | :-------: | :--------------------------------------------------------------------- |
| `POST` | `/api/orders`                  |  Public   | Create new order (with server-side price validation & stock decrement) |
| `POST` | `/api/orders/sync-batch`       |  Public   | Batch upload offline orders from Android/Web clients                   |
| `GET`  | `/api/orders/today/:booth_id`  |  Public   | Fetch today's transactions for cashier terminal                        |
| `GET`  | `/api/orders/active/:booth_id` |  Public   | Fetch active pending orders for KDS polling                            |
| `PUT`  | `/api/orders/:id/status`       |  Public   | Update order preparation status (`BARU`, `DIPROSES`, `SELESAI`)        |
| `PUT`  | `/api/orders/:id/void`         | PIN / JWT | Cancel order, audit log reason, and restore stock to booth             |

### 6. Real-Time Streaming & System (`/api`)

| Method | Endpoint                    |  Auth  | Description                                                 |
| :----- | :-------------------------- | :----: | :---------------------------------------------------------- |
| `GET`  | `/api/data`                 | Public | Master sync bundle (booths, menus, event settings)          |
| `GET`  | `/api/event-settings`       | Public | Retrieve active festival metadata                           |
| `PUT`  | `/api/event-settings`       |  JWT   | Update festival branding, location, voucher, receipt footer |
| `POST` | `/api/upload`               |  JWT   | Upload image with auto Sharp WebP compression               |
| `GET`  | `/api/sys-stream`           | Public | SSE stream for system configuration & menu updates          |
| `GET`  | `/api/kds-stream/:booth_id` | Public | SSE stream for instant kitchen display notifications        |
| `GET`  | `/api/reports/summary`      | Public | Financial KPI summary, hourly timeline, top menus           |

### 7. Multi-Node Fleet Consolidation (`/api/consolidate`)

| Method | Endpoint                       | Auth | Description                                            |
| :----- | :----------------------------- | :--: | :----------------------------------------------------- |
| `POST` | `/api/consolidate/ping-node`   | JWT  | Check latency & reachability of a remote Kiosk IP      |
| `POST` | `/api/consolidate/pull`        | JWT  | Pull and reconcile transactions from remote node       |
| `POST` | `/api/consolidate/export-json` | JWT  | Export local transactions to a JSON backup file        |
| `POST` | `/api/consolidate/import-json` | JWT  | Import and reconcile JSON transactions into central DB |

---

## 🔄 Offline-First Synchronization Protocol

```
                        OFFLINE-FIRST SYNC LIFECYCLE

  [ Cashier Checkout ]
         │
         ▼
  [ Local Database (Room / IndexedDB) ] ──► Transaction committed locally (~300ms)
         │                                  Stock decremented locally
         ▼
  [ Network Check ]
    ├── Online  ──► Non-blocking background push to POST /api/orders/sync-batch
    └── Offline ──► Queued locally (isSynced = 0)
                          │
                          ▼
                    [ Reconnection Event ]
                    Background worker batch pushes pending queue
                    Server resolves conflicts & restores stock if order is VOID
```

- **Conflict Prevention**: Unique order sequence IDs (`{booth_kode}-{YYYYMMDD}-{sequence}`) prevent collision across devices.
- **Stale Overwrite Protection**: If an order was marked as `VOID` while offline, downstream pull operations will not overwrite the local `VOID` status with obsolete server data.

---

## 📁 Project Directory Structure

```
csm/
├── android-kasir-pos-event/       # Native Android Kotlin application
│   ├── app/                 # Jetpack Compose UI, Room SQLite, Retrofit 2
│   └── README.md            # Android-specific build and setup guide
├── prisma/
│   └── schema.prisma        # Database schema definitions
├── public/                  # Static assets and receipt uploads
├── server/                  # Clean Layered Modular Backend
│   ├── config/              # Centralized environment & Prisma singleton
│   │   ├── env.ts           # Fail-fast environment variable guard
│   │   └── prisma.ts        # Prisma client instance & lifecycle
│   ├── middlewares/         # Express auth, PIN verification & multer
│   │   ├── auth.middleware.ts
│   │   └── upload.middleware.ts
│   ├── routes/              # Modular Express Route Handlers
│   │   ├── auth.routes.ts
│   │   ├── booth.routes.ts
│   │   ├── category.routes.ts
│   │   ├── consolidate.routes.ts
│   │   ├── menu.routes.ts
│   │   ├── order.routes.ts
│   │   ├── report.routes.ts
│   │   ├── stream.routes.ts
│   │   └── system.routes.ts
│   ├── services/            # Business Logic Layer
│   │   ├── consolidateService.ts
│   │   ├── orderService.ts
│   │   ├── reportService.ts
│   │   └── systemService.ts
│   ├── utils/               # Helper Utilities
│   │   ├── events.ts        # SSE EventEmitter hub
│   │   ├── image.ts         # Sharp WebP image processing
│   │   └── time.ts          # WIB timezone helpers
│   └── index.ts             # Express Bootstrap & Vite SPA integration
├── src/                     # React Frontend Application
│   ├── components/
│   │   ├── AdminPanel.tsx   # Back-office dashboard & reports
│   │   ├── KasirPanel.tsx   # Web POS terminal
│   │   ├── KasirMobilePanel.tsx # Mobile Web POS (PWA)
│   │   ├── KdsPanel.tsx     # Kitchen Display System
│   │   ├── KioskPanel.tsx   # Self-Service Kiosk
│   │   └── LandingHub.tsx   # Module navigation gateway
│   ├── services/
│   │   └── offlineDb.ts     # Client-side IndexedDB persistence
│   ├── App.tsx              # Root router and state distributor
│   ├── main.tsx             # React mount entry
│   └── types.ts             # TypeScript data contracts
├── package.json
└── vite.config.ts
```

---

## 📜 License

This project is licensed under the Apache-2.0 License.
