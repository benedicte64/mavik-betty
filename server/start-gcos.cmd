@echo off
setlocal
cd /d "%~dp0"
title GCOS Server - GentleCarE
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js est introuvable.
  echo Installez Node.js LTS puis relancez ce fichier.
  echo.
  pause
  exit /b 1
)
if not exist ".env" (
  echo.
  echo Le fichier server\.env est absent.
  echo Copiez .env.example en .env puis ajoutez le jeton Airtable.
  echo.
  pause
  exit /b 1
)
echo Demarrage du serveur GCOS...
node server.js
if errorlevel 1 (
  echo.
  echo Le serveur GCOS s'est arrete avec une erreur.
  pause
)
endlocal
