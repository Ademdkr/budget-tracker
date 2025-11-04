# 🚀 Quick Start - Budget Tracker

## Option 1: Lokale Entwicklung (Empfohlen für Development)

### Voraussetzungen

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

### Setup in 3 Schritten

```bash
# 1. Repository klonen & Dependencies installieren
git clone https://github.com/Ademdkr/budget-tracker.git
cd budget-tracker
pnpm install

# 2. Datenbank starten
docker compose up -d

# 3. Backend & Frontend starten
# Terminal 1 - Backend
cd apps/backend
pnpm start:dev

# Terminal 2 - Frontend
cd apps/frontend
pnpm dev
```

**Fertig!** 🎉

- Frontend: http://localhost:4201
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Option 2: Production Worker testen (Kein lokales Backend nötig)

```bash
# 1. Repository klonen & Dependencies installieren
git clone https://github.com/Ademdkr/budget-tracker.git
cd budget-tracker
pnpm install

# 2. Frontend gegen Production Worker starten
cd apps/frontend
pnpm dev:worker
```

**Fertig!** 🎉

- Frontend: http://localhost:4201
- Backend: https://budget-tracker-worker.adem-dokur.workers.dev/api

## Test-Benutzer

Einloggen mit:

- **E-Mail:** example@example.com
- **Passwort:** password (beliebig)

Weitere Benutzer:

- example2@example.com
- example3@example.com

## Nächste Schritte

📚 **Dokumentation:**

- [Development Modes](./docs/DEVELOPMENT_MODES.md) - Zwischen local/production wechseln
- [Architecture](./docs/ARCHITECTURE.md) - System-Übersicht
- [Database Switching](./docs/SWITCH_DATABASE.md) - DB-Umgebungen wechseln

🔧 **Entwicklung:**

```bash
# Neue Features entwickeln
pnpm dev                    # Lokales Backend

# Gegen Production testen
pnpm dev:worker             # Production Worker

# Datenbank wechseln
cd apps/backend
pnpm env:status             # Status prüfen
pnpm env:local              # Zu lokal wechseln
pnpm env:neon               # Zu Neon wechseln
```

🚀 **Deployment:**

```bash
git push origin main        # Automatisches Deployment via GitHub Actions
```

## Troubleshooting

### Backend startet nicht

```bash
# Prüfe ob Datenbank läuft
docker compose ps

# Starte Datenbank neu
docker compose up -d

# Migrationen anwenden
cd apps/backend
pnpm prisma migrate dev
```

### Frontend kann Backend nicht erreichen

```bash
# Prüfe Backend
curl http://localhost:3001/api/health

# Prüfe Worker (wenn dev:worker)
curl https://budget-tracker-worker.adem-dokur.workers.dev/api/health
```

### "Failed to fetch" beim Login

→ Siehe [Development Modes](./docs/DEVELOPMENT_MODES.md) für Lösungen
