@echo off
title VisaVoyage AI - Backend Server (Port 5000)
cd /d "%~dp0backend"
echo ============================================================
echo   Starting VisaVoyage AI Backend Server (Express + GenAI)
echo   Target: http://localhost:5000
echo ============================================================
npm run dev
pause
