#!/bin/bash
# Budget Tracker - Docker Start Script (Bash)
# Startet die gesamte Anwendung mit Docker Compose

set -e

echo "🐳 Budget Tracker - Docker Start"
echo "================================="
echo ""

# Prüfe ob Docker läuft
echo "Prüfe Docker Installation..."
if ! command -v docker &> /dev/null; then
    echo "✗ Docker ist nicht installiert!"
    echo "Bitte installiere Docker: https://www.docker.com/get-docker"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "✗ Docker läuft nicht!"
    echo "Bitte starte Docker Desktop oder den Docker Daemon."
    exit 1
fi

DOCKER_VERSION=$(docker --version)
echo "✓ Docker gefunden: $DOCKER_VERSION"
echo ""

# Prüfe ob docker-compose.yml existiert
if [ ! -f "docker-compose.yml" ]; then
    echo "✗ docker-compose.yml nicht gefunden!"
    echo "Stelle sicher, dass du im Projekt-Root-Verzeichnis bist."
    exit 1
fi

echo "Starte Docker Compose Services..."
echo ""

# Docker Compose starten
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Services erfolgreich gestartet!"
    echo ""
    echo "📊 Verfügbare Services:"
    echo "  - Frontend:  http://localhost:4201"
    echo "  - Backend:   http://localhost:3001"
    echo "  - API Docs:  http://localhost:3001/api/docs"
    echo "  - Database:  localhost:5434 (postgres:postgres)"
    echo ""
    echo "📝 Nützliche Befehle:"
    echo "  docker compose logs -f          # Logs verfolgen"
    echo "  docker compose logs -f backend  # Nur Backend Logs"
    echo "  docker compose ps               # Status anzeigen"
    echo "  docker compose down             # Services stoppen"
    echo "  docker compose down -v          # Stoppen + Volumes löschen"
    echo ""
    echo "⏳ Warte auf Service-Start (ca. 30-60 Sekunden)..."
    echo ""
    
    # Zeige Logs
    sleep 3
    echo "📋 Aktuelle Logs (STRG+C zum Beenden):"
    docker compose logs -f
else
    echo ""
    echo "✗ Fehler beim Starten der Services!"
    echo "Prüfe die Logs mit: docker compose logs"
    exit 1
fi
