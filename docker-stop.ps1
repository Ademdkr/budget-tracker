#!/usr/bin/env pwsh
# Budget Tracker - Docker Stop Script (PowerShell)
# Stoppt alle Docker Compose Services

Write-Host "🛑 Budget Tracker - Docker Stop" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Parameter für Volume-Löschung
param(
    [switch]$Volumes = $false
)

if ($Volumes) {
    Write-Host "⚠️  Stoppe Services und lösche Volumes (Datenbank wird gelöscht)..." -ForegroundColor Yellow
    docker compose down -v
} else {
    Write-Host "Stoppe Services (Datenbank bleibt erhalten)..." -ForegroundColor Yellow
    docker compose down
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Services erfolgreich gestoppt!" -ForegroundColor Green
    Write-Host ""
    if (-not $Volumes) {
        Write-Host "💡 Tipp: Verwende './docker-stop.ps1 -Volumes' um auch die Datenbank zu löschen" -ForegroundColor Gray
    }
} else {
    Write-Host ""
    Write-Host "✗ Fehler beim Stoppen der Services!" -ForegroundColor Red
    exit 1
}
