@echo off
title Hapus Log Transaksi - Point of Sale Event System
cd /d "%~dp0"
cls

echo ====================================================================
echo             MENGOSONGKAN LOG TRANSAKSI / PESANAN
echo ====================================================================
echo.
echo PERINGATAN: Tindakan ini akan menghapus semua riwayat pesanan (Orders),
echo item pesanan (OrderItems), dan mereset antrean transaksi dari database!
echo.
set /p confirm="Apakah Anda yakin ingin menghapus data transaksi? (Y/N): "
if /i "%confirm%" neq "Y" (
    echo.
    echo Pembatalan dilakukan. Data transaksi tidak diubah.
    goto end
)

echo.
echo Menghubungkan ke database dan membersihkan data...
call npx tsx prisma/clear_orders.ts

if %errorlevel% equ 0 (
    echo.
    echo ====================================================================
    echo Berhasil! Semua data riwayat pesanan dan antrean telah dibersihkan.
    echo ====================================================================
) else (
    echo.
    echo --------------------------------------------------------------------
    echo [ERROR] Gagal membersihkan database!
    echo Pastikan MySQL di Laragon sudah aktif dan berjalan.
    echo --------------------------------------------------------------------
)

:end
echo.
pause
