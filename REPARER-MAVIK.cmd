@echo off
setlocal
title Reparation MAVIK GCOS
cd /d "%~dp0"

echo =====================================================
echo       REPARATION MAVIK GCOS
echo =====================================================
echo 1/4 - Verification de Git...
git --version >nul 2>&1
if errorlevel 1 goto GIT_ERROR

echo 2/4 - Recuperation de la derniere version...
git fetch origin main
if errorlevel 1 goto NETWORK_ERROR
git pull --ff-only origin main
if errorlevel 1 goto PULL_ERROR

echo 3/4 - Verification des fichiers principaux...
node --check server\server.js
if errorlevel 1 goto CODE_ERROR
node --check server\jarvis.js
if errorlevel 1 goto CODE_ERROR
node --check server\updater.js
if errorlevel 1 goto CODE_ERROR
node --check server\diagnostics.js
if errorlevel 1 goto CODE_ERROR

echo 4/4 - Reparation terminee.
echo MAVIK va maintenant redemarrer.
timeout /t 2 /nobreak >nul
call "%~dp0DEMARRER-MAVIK.cmd"
goto END

:GIT_ERROR
echo.
echo ERREUR : Git pour Windows est absent ou inaccessible.
echo Installez Git pour Windows puis relancez ce fichier.
goto PAUSE_END

:NETWORK_ERROR
echo.
echo ERREUR : impossible de joindre GitHub.
echo Verifiez Internet, puis relancez REPARER-MAVIK.cmd.
goto PAUSE_END

:PULL_ERROR
echo.
echo ERREUR : la mise a jour ne peut pas etre appliquee automatiquement.
echo Ne supprimez aucun fichier. Conservez ce message pour la future hotline MAVIK.
goto PAUSE_END

:CODE_ERROR
echo.
echo ERREUR : un fichier MAVIK est incomplet.
echo Relancez ce fichier lorsque la connexion Internet est stable.
goto PAUSE_END

:PAUSE_END
pause
:END
endlocal
