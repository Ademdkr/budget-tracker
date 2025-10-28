# Projekt Setup - Budget Tracker

Diese Anleitung hilft dabei, das Budget-Tracker-Projekt nach dem Klonen korrekt einzurichten.

## Voraussetzungen

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose (für lokale Datenbank)

## Schritt-für-Schritt Setup

### 1. Repository klonen

```bash
git clone https://github.com/Ademdkr/budget-tracker.git
cd budget-tracker
```

### 2. Dependencies installieren

```bash
pnpm install
```

### 3. Environment-Dateien konfigurieren

#### 3.1 Haupt-Environment (optional)

```bash
cp .env.example .env
```

Diese Datei enthält globale Konfigurationen und ist optional.

#### 3.2 Backend-Environment (erforderlich)

```bash
cp apps/backend/.env.example apps/backend/.env
```

**Wichtig**: Die Backend .env-Datei muss korrekt konfiguriert werden:

```bash
# apps/backend/.env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/budget-tracker?schema=public&sslmode=disable
DIRECT_DATABASE_URL=
PORT_API=3001
CORS_ORIGIN=http://localhost:4201
```

#### 3.3 Worker-Environment (optional)

```bash
cp apps/worker/.env.example apps/worker/.env
```

### 4. Datenbank starten

```bash
# PostgreSQL mit Docker Compose starten
pnpm run db:up

# Überprüfen ob die Datenbank läuft
docker ps
```

### 5. Prisma-Datenbank initialisieren

```bash
# Prisma Client generieren
pnpm run gen:prisma

# Datenbank-Schema anwenden
cd apps/backend
pnpm exec prisma migrate dev --name init

# Optional: Beispieldaten einfügen
pnpm run db:seed
```

### 6. Anwendung starten

```bash
# Beide Services starten (Frontend + Backend)
pnpm run dev

# Oder einzeln:
# Frontend: pnpm run dev:web
# Backend: pnpm run dev:api
```

### 7. URLs überprüfen

Nach dem Start sollten folgende URLs verfügbar sein:

- **Frontend**: http://localhost:4201
- **Backend API**: http://localhost:3001/api
- **API Dokumentation**: http://localhost:3001/api/docs
- **Prisma Studio** (optional): `pnpm run db:studio`

## Häufige Probleme und Lösungen

### Problem: "Config validation error: DATABASE_URL is required"

**Lösung**:

1. Stelle sicher, dass `apps/backend/.env` existiert
2. Überprüfe, dass Docker läuft: `docker ps`
3. Starte die Datenbank: `pnpm run db:up`

### Problem: Frontend lädt dauerhaft

**Lösung**:

1. Überprüfe, dass Backend auf Port 3001 läuft
2. Checke die Proxy-Konfiguration in `apps/frontend/proxy.conf.json`
3. Verwende Test-Login: Email: `test@example.com`, Passwort: `password`

### Problem: Port-Konflikte

**Lösung**:

- Frontend läuft auf Port 4201 (nicht 4200)
- Backend läuft auf Port 3001 (nicht 3000)
- Datenbank läuft auf Port 5433 (nicht 5432)

### Problem: Prisma Client Fehler

**Lösung**:

```bash
# Prisma Client neu generieren
pnpm run gen:prisma

# Wenn immer noch Fehler:
cd apps/backend
pnpm exec prisma generate
```

## Development-Workflow

### Nach git pull

```bash
# Dependencies aktualisieren
pnpm install

# Prisma Client neu generieren (falls Schema geändert)
pnpm run gen:prisma

# Neue Migrationen anwenden
cd apps/backend
pnpm exec prisma migrate dev
```

### Datenbank zurücksetzen

```bash
# Alle Daten löschen und neu aufsetzen
pnpm run db:reset
```

### Tests ausführen

```bash
# Alle Tests
pnpm run test

# Nur Frontend Tests
pnpm --filter @budget-tracker/frontend test

# Nur Backend Tests
pnpm --filter @budget-tracker/backend test
```

## Produktions-Build

```bash
# Frontend Build
pnpm run build:web

# Backend Build
pnpm run build:api

# Alles bauen
pnpm run build
```

## Umgebungsvariablen Übersicht

### Haupt .env (optional)

- `APP_NAME`: Name der Anwendung
- `APP_SLUG`: URL-freundlicher Name
- `NODE_ENV`: Umgebung (development/production)

### Backend .env (erforderlich)

- `DATABASE_URL`: PostgreSQL-Verbindungsstring
- `PORT_API`: Backend-Port (Standard: 3001)
- `CORS_ORIGIN`: Erlaubte Frontend-URLs

### Frontend

Verwendet Environment-Dateien in `src/environments/`:

- `environment.ts`: Produktion
- `environment.development.ts`: Entwicklung

## Git-Workflow

**Wichtig**: Die .env-Dateien werden nicht in Git committed!

```bash
# Status prüfen (sollte keine .env-Dateien zeigen)
git status

# Nur getrackte Dateien committen
git add .
git commit -m "feat: neue Funktion"
git push
```

Bei Problemen mit der Konfiguration nach dem Klonen, überprüfe immer zuerst die .env-Dateien und folge dieser Anleitung Schritt für Schritt.
