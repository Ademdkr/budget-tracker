#!/bin/bash
# Budget Tracker - Docker Stop Script (Bash)
# Stoppt alle Docker Compose Services

set -e

echo "🛑 Budget Tracker - Docker Stop"
echo "================================"
echo ""

# Parameter für Volume-Löschung
VOLUMES=false
if [ "$1" == "--volumes" ] || [ "$1" == "-v" ]; then
    VOLUMES=true
fi

if [ "$VOLUMES" = true ]; then
    echo "⚠️  Stoppe Services und lösche Volumes (Datenbank wird gelöscht)..."
    docker compose down -v
else
    echo "Stoppe Services (Datenbank bleibt erhalten)..."
    docker compose down
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Services erfolgreich gestoppt!"
    echo ""
    if [ "$VOLUMES" = false ]; then
        echo "💡 Tipp: Verwende './docker-stop.sh --volumes' um auch die Datenbank zu löschen"
    fi
else
    echo ""
    echo "✗ Fehler beim Stoppen der Services!"
    exit 1
fi
