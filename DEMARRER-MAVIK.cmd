@echo off
setlocal
title MAVIK GCOS - GentleCarE
cd /d "%~dp0server"

:START
cls
echo =====================================================
echo       MAVIK GCOS - GentleCarE
echo =====================================================
echo Demarrage et surveillance automatique...
echo Ouvrez ensuite : http://localhost:4782/alpha
echo.
node server.js
set "MAVIK_CODE=%ERRORLEVEL%"

if "%MAVIK_CODE%"=="0" goto END
echo.
echo MAVIK s'est arrete de facon inattendue (code %MAVIK_CODE%).
echo Redemarrage automatique dans 3 secondes...
timeout /t 3 /nobreak >nul
goto START

:END
echo MAVIK a ete arrete normalement.
endlocal
