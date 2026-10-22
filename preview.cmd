@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   No se encontro Node.js.
  echo   Instalalo desde https://nodejs.org y volve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)
node "%~dp0tools\serve.js" "%~dp0." 8080
pause
