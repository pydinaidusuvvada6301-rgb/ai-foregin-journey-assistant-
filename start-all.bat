@echo off
title VisaVoyage AI - Full Stack Launcher
cd /d "%~dp0"
echo ============================================================
echo   Starting Full Stack VisaVoyage AI Application
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ============================================================
npm run dev
pause
