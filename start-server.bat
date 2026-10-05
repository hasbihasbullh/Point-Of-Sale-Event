@echo off
title Point of Sale Event - Server Runtime
cd /d "%~dp0"
cls

echo ====================================================================
echo               POINT OF SALE EVENT - SERVER RUNTIME
echo ====================================================================
echo.

REM 1. Periksa apakah Node.js terpasang
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di komputer ini!
    echo Silakan unduh dan pasang Node.js terlebih dahulu di https://nodejs.org/
    echo --------------------------------------------------------------------
    pause
    exit /b 1
)

REM 2. Periksa folder node_modules
if not exist "node_modules\" (
    echo [1/3] Menginstal dependensi aplikasi: npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal menginstal dependensi! Pastikan koneksi internet aktif.
        pause
        exit /b 1
    )
)

REM 3. Inisialisasi Prisma Client jika belum ada
if not exist "node_modules\.prisma\client\" (
    echo [2/3] Menginisialisasi Prisma ORM Client...
    call npx prisma generate
)

REM 4. Periksa apakah bundle produksi sudah dibuild
if not exist "dist\server.cjs" (
    echo [2/3] Membangun bundle produksi: npm run build...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal melakukan build aplikasi!
        pause
        exit /b 1
    )
)

REM 5. Dapatkan IP Address Lokal IPv4 untuk koneksi Wi-Fi / Starlink Lokal
set "LOCAL_IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "LOCAL_IP=%%a"
)
set "LOCAL_IP=%LOCAL_IP: =%"

echo ====================================================================
echo                        INFORMASI KONEKSI
echo ====================================================================
echo   * Akses Server Ini      : http://localhost:3000
echo   * Akses Tablet/Kiosk/HP : http://%LOCAL_IP%:3000
echo   * Base URL Kasir Android: http://%LOCAL_IP%:3000/
echo ====================================================================
echo.
echo Pastikan Laragon / MySQL sudah aktif di Laragon.
echo Tekan tombol CTRL + C untuk menghentikan server.
echo ====================================================================
echo.

call npm run start

if %errorlevel% neq 0 (
    echo.
    echo --------------------------------------------------------------------
    echo [ERROR] Gagal menjalankan server produksi!
    echo Solusi:
    echo 1. Pastikan Anda sudah mengaktifkan MySQL di Laragon.
    echo 2. Cek apakah ada aplikasi lain yang menggunakan Port 3000.
    echo --------------------------------------------------------------------
    pause
)
