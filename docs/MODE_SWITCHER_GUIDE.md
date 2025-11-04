# 🔀 Development Mode Switcher - Visueller Überblick

## 🎯 Zwei Modi verfügbar

```
┌─────────────────────────────────────────────────────────────────┐
│                     🖥️  DEVELOPMENT MODE                         │
│                   (Lokales NestJS Backend)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (Angular)          Backend (NestJS)                   │
│  http://localhost:4201  →    http://localhost:3001/api          │
│                                    ↓                             │
│                              PostgreSQL                          │
│                              localhost:5433                      │
│                                                                  │
│  Starten:                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Terminal 1:                                              │  │
│  │ cd apps/backend && pnpm start:dev                        │  │
│  │                                                           │  │
│  │ Terminal 2:                                              │  │
│  │ cd apps/frontend && pnpm dev                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ✅ Vorteile:                                                    │
│  • Alle Endpoints verfügbar                                     │
│  • Hot-Reload für Backend & Frontend                            │
│  • Debugging mit Breakpoints                                    │
│  • Swagger Docs: /api/docs                                      │
│  • Lokale Datenbank (keine Production-Auswirkung)               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     ☁️  WORKER MODE                              │
│                  (Cloudflare Worker API)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (Angular)                                             │
│  http://localhost:4201                                          │
│           ↓                                                      │
│  Cloudflare Worker API                                          │
│  https://budget-tracker-worker.adem-dokur.workers.dev/api       │
│           ↓                                                      │
│  Neon PostgreSQL (Production)                                   │
│  ep-holy-cake-agz4x04m.c-2.eu-central-1.aws.neon.tech          │
│                                                                  │
│  Starten:                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ cd apps/frontend && pnpm dev:worker                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ✅ Vorteile:                                                    │
│  • Kein lokales Backend nötig                                   │
│  • Test gegen echte Production API                              │
│  • Schneller Start                                              │
│  • Edge Computing (global schnell)                              │
│                                                                  │
│  ⚠️  Achtung:                                                    │
│  • Nur ausgewählte Endpoints                                    │
│  • Änderungen wirken auf Production!                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Command Cheat Sheet

```bash
# ════════════════════════════════════════════════════════════════
# FRONTEND COMMANDS
# ════════════════════════════════════════════════════════════════

# Lokales Backend (Development)
pnpm dev                    # Mit local NestJS API
pnpm start                  # Alias für dev

# Production Worker API
pnpm dev:worker             # Mit Cloudflare Worker API
pnpm start:worker           # Alias für dev:worker

# Production Build
pnpm build:prod             # Build für Deployment

# ════════════════════════════════════════════════════════════════
# BACKEND COMMANDS
# ════════════════════════════════════════════════════════════════

# Server starten
pnpm start:dev              # Development mit Hot-Reload

# Datenbank umschalten
pnpm env:status             # Aktueller Status
pnpm env:local              # → Lokale PostgreSQL
pnpm env:neon               # → Neon Production

# Datenbank Management
pnpm prisma migrate dev     # Neue Migration erstellen
pnpm prisma:studio          # DB Browser öffnen
pnpm db:seed                # Testdaten einfügen

# ════════════════════════════════════════════════════════════════
# DOCKER COMMANDS
# ════════════════════════════════════════════════════════════════

docker compose up -d        # Datenbank starten
docker compose down         # Datenbank stoppen
docker compose ps           # Status prüfen
```

## 🔄 Workflow-Beispiele

### Szenario 1: Neues Feature entwickeln

```bash
# 1. Lokales Setup
docker compose up -d
cd apps/backend && pnpm start:dev     # Terminal 1
cd apps/frontend && pnpm dev          # Terminal 2

# 2. Feature implementieren
# - Backend: Controller/Service in apps/backend/src/
# - Frontend: Component in apps/frontend/src/app/

# 3. Testen
# http://localhost:4201

# 4. Worker-Endpoint hinzufügen
# apps/worker/src/index.ts

# 5. Gegen Worker testen
# Strg+C im Frontend-Terminal
pnpm dev:worker

# 6. Deployen
git add .
git commit -m "feat: new feature"
git push origin main
```

### Szenario 2: Schnelle UI-Änderung

```bash
# Kein Backend nötig!
cd apps/frontend
pnpm dev:worker

# UI ändern in src/app/
# Sofort testen gegen Production API
```

### Szenario 3: Bug reproduzieren

```bash
# 1. Reproduzieren gegen Production
cd apps/frontend
pnpm dev:worker

# 2. Bug gefunden? → Lokales Debugging
# Strg+C
cd ../backend && pnpm start:dev       # Terminal 1
cd ../frontend && pnpm dev            # Terminal 2

# 3. Debug mit Breakpoints
# 4. Fix implementieren
# 5. Testen
# 6. Deployen
```

## 🎨 Environment Files im Detail

### Development (Standard)

```typescript
// apps/frontend/src/environments/environment.development.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3001/api', // ← Lokales Backend
};
```

**Verwendet von:**

- `pnpm dev`
- `pnpm start`
- `ng serve` (default)

### Worker Testing

```typescript
// apps/frontend/src/environments/environment.worker.ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://budget-tracker-worker.adem-dokur.workers.dev/api', // ← Worker
};
```

**Verwendet von:**

- `pnpm dev:worker`
- `pnpm start:worker`
- `ng serve --configuration worker`

### Production

```typescript
// apps/frontend/src/environments/environment.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://budget-tracker-worker.adem-dokur.workers.dev/api', // ← Worker
};
```

**Verwendet von:**

- `pnpm build:prod`
- `ng build --configuration production`
- GitHub Actions CD Pipeline

## 🚦 Status-Checks

### Frontend läuft?

```bash
curl http://localhost:4201
# Sollte HTML zurückgeben
```

### Backend läuft?

```bash
curl http://localhost:3001/api/health
# {"status":"ok",...}
```

### Worker erreichbar?

```bash
curl https://budget-tracker-worker.adem-dokur.workers.dev/api/health
# {"status":"ok",...}
```

### Datenbank verbunden?

```bash
cd apps/backend
pnpm env:status
# 📡 Currently using: NEON (Production)
# oder
# 💻 Currently using: LOCAL (Development)
```

## 📝 Konfiguration ändern

### Neues Environment hinzufügen

1. **Environment-File erstellen:**

```typescript
// apps/frontend/src/environments/environment.staging.ts
export const environment = {
  production: false,
  apiBaseUrl: 'https://staging-worker.example.com/api',
};
```

2. **angular.json erweitern:**

```json
"configurations": {
  "staging": {
    "fileReplacements": [{
      "replace": "src/environments/environment.development.ts",
      "with": "src/environments/environment.staging.ts"
    }]
  }
}
```

3. **Script hinzufügen:**

```json
// apps/frontend/package.json
"scripts": {
  "dev:staging": "ng serve --configuration staging"
}
```

## 🔍 Debugging-Tipps

### Chrome DevTools

- Frontend: F12 → Network Tab → Prüfe API-Calls
- Console: `console.log` aus Frontend-Code
- Sources: Breakpoints in TypeScript-Files

### VS Code Debugging

```json
// .vscode/launch.json
{
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach NestJS",
      "port": 9229
    }
  ]
}
```

Dann: `pnpm start:debug` statt `pnpm start:dev`

### Prisma Studio

```bash
cd apps/backend
pnpm prisma:studio
# Öffnet http://localhost:5555
# Visueller DB-Browser
```

## 📚 Weitere Ressourcen

- [DEVELOPMENT_MODES.md](./DEVELOPMENT_MODES.md) - Ausführliche Dokumentation
- [QUICK_START.md](../QUICK_START.md) - Schnellstart-Anleitung
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System-Architektur
- [SWITCH_DATABASE.md](./SWITCH_DATABASE.md) - Datenbank wechseln
