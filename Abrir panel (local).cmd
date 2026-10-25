@echo off
chcp 65001 >nul
title La Boutique Cat y Dog - Abrir panel local
cd /d "%~dp0"

rem Si el servidor ya esta andando, no lo volvemos a levantar
curl -s -o NUL http://127.0.0.1:8080/ && goto abrir

echo Levantando el servidor local (Node.js)...
start "Servidor - La Boutique (dejar abierto)" /min cmd /c "set NO_OPEN=1&& node tools\serve.js . 8080"

set /a intentos=0

:esperar
ping -n 2 127.0.0.1 >nul
curl -s -o NUL http://127.0.0.1:8080/ && goto abrir
set /a intentos+=1
if %intentos% lss 12 goto esperar

echo.
echo No se pudo levantar el servidor.
echo Fijate que Node.js este instalado (https://nodejs.org) y volve a intentar.
pause
exit /b 1

:abrir
start "" "http://localhost:8080/admin/editor.html"
echo.
echo Panel abierto en el navegador.
echo Para ver la web: http://localhost:8080/
echo (Deja abierta la ventanita "Servidor - La Boutique" mientras lo usas.)
ping -n 6 127.0.0.1 >nul
exit /b 0
