@echo off
title VisaVoyage AI - Frontend Client (Port 5173)
cd /d "%~dp0frontend"
echo ============================================================
echo   Starting VisaVoyage AI Frontend Client (React + Vite)
echo   Target: http://localhost:5173
echo ============================================================
npm run dev
pause
