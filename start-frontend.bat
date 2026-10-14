@echo off
title VisaVoyage AI - Frontend Client (Port 3000)
cd /d "%~dp0frontend"
echo ============================================================
echo   Starting VisaVoyage AI Frontend Client (React + Vite)
echo   Target: http://localhost:3000
echo ============================================================
npm run dev
pause
