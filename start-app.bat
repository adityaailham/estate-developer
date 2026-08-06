@echo off
color 0A
echo ==============================================
echo        ESTATE DEVELOPER - STARTUP SCRIPT       
echo ==============================================
echo.
echo Menjalankan Server Next.js...
echo Mohon tunggu, browser akan terbuka otomatis...
echo.

:: Buka alamat localhost di default browser
start http://localhost:3000

:: Jalankan aplikasi menggunakan npm
npm run dev

pause
