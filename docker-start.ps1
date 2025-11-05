#!/usr/bin/env pwsh
# Budget Tracker - Docker Start Script (PowerShell)
# Startet die gesamte Anwendung mit Docker Compose

Write-Host "🐳 Budget Tracker - Docker Start" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob Docker läuft
Write-Host "Prüfe Docker Installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker gefunden: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker ist nicht installiert oder läuft nicht!" -ForegroundColor Red
    Write-Host "Bitte installiere Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Prüfe ob docker-compose.yml existiert
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "✗ docker-compose.yml nicht gefunden!" -ForegroundColor Red
    Write-Host "Stelle sicher, dass du im Projekt-Root-Verzeichnis bist." -ForegroundColor Yellow
    exit 1
}

Write-Host "Starte Docker Compose Services..." -ForegroundColor Yellow
Write-Host ""

# Docker Compose starten
docker compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Services erfolgreich gestartet!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Verfügbare Services:" -ForegroundColor Cyan
    Write-Host "  - Frontend:  http://localhost:4201" -ForegroundColor White
    Write-Host "  - Backend:   http://localhost:3001" -ForegroundColor White
    Write-Host "  - API Docs:  http://localhost:3001/api/docs" -ForegroundColor White
    Write-Host "  - Database:  localhost:5434 (postgres:postgres)" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Nützliche Befehle:" -ForegroundColor Cyan
    Write-Host "  docker compose logs -f          # Logs verfolgen" -ForegroundColor Gray
    Write-Host "  docker compose logs -f backend  # Nur Backend Logs" -ForegroundColor Gray
    Write-Host "  docker compose ps               # Status anzeigen" -ForegroundColor Gray
    Write-Host "  docker compose down             # Services stoppen" -ForegroundColor Gray
    Write-Host "  docker compose down -v          # Stoppen + Volumes löschen" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏳ Warte auf Service-Start (ca. 30-60 Sekunden)..." -ForegroundColor Yellow
    Write-Host ""
    
    # Zeige Logs für 10 Sekunden
    Start-Sleep -Seconds 3
    Write-Host "📋 Aktuelle Logs (STRG+C zum Beenden):" -ForegroundColor Cyan
    docker compose logs -f
} else {
    Write-Host ""
    Write-Host "✗ Fehler beim Starten der Services!" -ForegroundColor Red
    Write-Host "Prüfe die Logs mit: docker compose logs" -ForegroundColor Yellow
    exit 1
}
