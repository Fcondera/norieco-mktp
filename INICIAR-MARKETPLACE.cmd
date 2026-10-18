@echo off
title NoriEco - Marketplace
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22.12 ou mais recente para iniciar o projeto.
  pause
  exit /b 1
)
if not exist node_modules call npm.cmd ci
if errorlevel 1 (
  pause
  exit /b 1
)
echo Abra http://127.0.0.1:5174 no navegador.
call npm.cmd run dev
pause
