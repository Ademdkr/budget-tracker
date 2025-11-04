# 🏗️ Budget Tracker - Architektur Übersicht

Vollständig deployte Cloud-Native Architektur mit Cloudflare und Neon PostgreSQL.

## 📐 System-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                        BENUTZER                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE PAGES                           │
│  🌐 Frontend (Angular 18)                                    │
│  📍 https://budget-tracker-frontend.pages.dev                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  • Single Page Application (SPA)                             │
│  • Angular Signals & Reactive Forms                          │
│  • Chart.js für Visualisierungen                            │
│  • Tailwind CSS für Styling                                  │
│  • Automatisches Deployment via GitHub Actions              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS / API Calls
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               CLOUDFLARE WORKERS                             │
│  ⚡ Worker API (Hono Framework)                              │
│  📍 https://budget-tracker-worker.adem-dokur.workers.dev     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  • Serverless Edge Computing                                 │
│  • Hono REST API Framework                                   │
│  • CORS-Middleware für Frontend                              │
│  • Neon PostgreSQL Connection                                │
│  • Environment Variables via Secrets                         │
│  • Automatisches Deployment via GitHub Actions              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ SQL Queries (@neondatabase/serverless)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 NEON POSTGRESQL                              │
│  🗄️ Production Database                                      │
│  📍 ep-holy-cake-agz4x04m.c-2.eu-central-1.aws.neon.tech    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  • PostgreSQL 16                                             │
│  • Serverless, auto-scaling                                  │
│  • Prisma Schema Management                                  │
│  • 5 Migrationen deployed                                    │
│  • Connection Pooling (Pooler + Direct)                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Deployment Pipeline

```
┌──────────────┐
│ Git Push     │
│ (main)       │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              GITHUB ACTIONS CI/CD                        │
│  ⚙️ .github/workflows/cd.yml                             │
└──────────────────────────────────────────────────────────┘
       │
       ├─────────────────────────────────────────────────┐
       │                     │                           │
       ▼                     ▼                           ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Deploy DB   │    │ Deploy Frontend │    │ Deploy Worker   │
│ Migrations  │    │ to Pages        │    │ to Workers      │
│             │    │                 │    │                 │
│ • Generate  │    │ • pnpm install  │    │ • pnpm install  │
│   Prisma    │    │ • Angular build │    │ • Set DB Secret │
│ • Deploy    │    │ • wrangler      │    │ • wrangler      │
│   Migrations│    │   pages deploy  │    │   deploy        │
└─────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Datenbank Schema

### Tabellen

```
User (Benutzer)
├── id (BigInt, PK)
├── name (String)
├── surname (String)
├── email (String, unique)
├── password (String)
└── created_at (DateTime)

Account (Konten)
├── id (BigInt, PK)
├── user_id (BigInt, FK → User)
├── name (String)
├── type (Enum: CHECKING, SAVINGS, CREDIT_CARD, CASH, INVESTMENT)
├── initial_balance (Decimal)
├── note (String?)
├── is_active (Boolean)
├── created_at (DateTime)
└── updated_at (DateTime)

Category (Kategorien)
├── id (BigInt, PK)
├── account_id (BigInt, FK → Account)
├── name (String)
├── description (String?)
├── transaction_type (Enum: INCOME, EXPENSE)
├── emoji (String)
├── color (String)
├── is_active (Boolean)
├── created_at (DateTime)
└── updated_at (DateTime)

Budget (Budgets)
├── id (BigInt, PK)
├── category_id (BigInt, FK → Category)
├── total_amount (Decimal)
├── month (Integer)
├── year (Integer)
├── created_at (DateTime)
└── updated_at (DateTime)

Transaction (Transaktionen)
├── id (BigInt, PK)
├── account_id (BigInt, FK → Account)
├── category_id (BigInt?, FK → Category)
├── amount (Decimal)
├── note (String?)
├── date (Date)
├── created_at (DateTime)
└── updated_at (DateTime)
```

## 🔐 Secrets & Environment Variables

### GitHub Secrets (in Repository Settings)

```bash
CLOUDFLARE_API_TOKEN=<your-cloudflare-api-token>
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
DATABASE_URL=postgresql://neondb_owner:***@ep-holy-cake-agz4x04m-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
DIRECT_DATABASE_URL=postgresql://neondb_owner:***@ep-holy-cake-agz4x04m.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### Worker Secrets (via CD Pipeline)

Der Worker erhält das `DATABASE_URL` Secret automatisch während des Deployments:

```bash
# Wird in CD-Pipeline ausgeführt:
pnpm wrangler secret put DATABASE_URL
```

### Frontend Environment

```typescript
// apps/frontend/src/environments/environment.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://budget-tracker-worker.adem-dokur.workers.dev/api',
};
```

## 🚀 Deployment URLs

### Live Application

- **Frontend**: https://budget-tracker-frontend.pages.dev
- **API**: https://budget-tracker-worker.adem-dokur.workers.dev
- **API Health**: https://budget-tracker-worker.adem-dokur.workers.dev/api/health

### Preview Deployments

Jeder Commit auf `main` erstellt automatisch:

- Neue Frontend-Preview: `https://<commit-hash>.budget-tracker-frontend.pages.dev`
- Production Worker Deployment (nur eine Version aktiv)

## 📡 API Endpoints

### Health Check

```bash
GET /api/health
# Response: {"status":"ok","service":"Budget Tracker API","ts":"2025-11-04T...","environment":"production"}
```

### Budgets

```bash
# Alle Budgets abrufen
GET /api/budgets
# Response: [{ id, category_id, total_amount, created_at, updated_at, month, year }, ...]

# Budget erstellen
POST /api/budgets
# Body: { "name": "Lebensmittel Budget" }

# Budget aktualisieren
PATCH /api/budgets/:id
# Body: { "name": "Updated Name" }

# Budget löschen
DELETE /api/budgets/:id
```

## 🔧 Lokale Entwicklung

### Voraussetzungen

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose (für lokale DB)

### Setup

```bash
# 1. Repository klonen
git clone https://github.com/Ademdkr/budget-tracker.git
cd budget-tracker

# 2. Dependencies installieren
pnpm install

# 3. Datenbank starten (Docker)
docker compose up -d

# 4. Backend starten (lokale Entwicklung)
cd apps/backend
pnpm env:local  # Zu lokaler DB wechseln
pnpm prisma migrate dev
pnpm db:seed
pnpm start:dev  # Läuft auf http://localhost:3001

# 5. Frontend starten
cd ../frontend
pnpm start  # Läuft auf http://localhost:4201

# 6. Worker lokal testen
cd ../worker
pnpm dev  # Läuft auf http://localhost:8787
```

### Zwischen Datenbanken wechseln

```bash
cd apps/backend

# Status prüfen
pnpm env:status

# Zu lokaler DB wechseln
pnpm env:local

# Zu Neon Production DB wechseln (für Tests)
pnpm env:neon
```

Siehe [SWITCH_DATABASE.md](./SWITCH_DATABASE.md) für Details.

## 🧪 Testing

### Unit & Integration Tests

```bash
# Backend Tests
cd apps/backend
pnpm test

# Frontend Tests
cd apps/frontend
pnpm test

# E2E Tests
cd apps/backend
pnpm test:e2e
```

### Manuelles Testing

```bash
# Worker Health Check
curl https://budget-tracker-worker.adem-dokur.workers.dev/api/health

# Budgets abrufen
curl https://budget-tracker-worker.adem-dokur.workers.dev/api/budgets

# Budget erstellen
curl -X POST https://budget-tracker-worker.adem-dokur.workers.dev/api/budgets \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Budget"}'
```

## 📈 Monitoring & Logs

### Cloudflare Dashboard

- **Workers**: https://dash.cloudflare.com → Workers & Pages → budget-tracker-worker
  - Real-time Logs
  - Metrics (Requests, CPU Time, Errors)
  - Secrets Management

- **Pages**: https://dash.cloudflare.com → Workers & Pages → budget-tracker-frontend
  - Deployment History
  - Build Logs
  - Custom Domains

### Neon Dashboard

- **Database**: https://console.neon.tech
  - Connection Pooling Stats
  - Query Performance
  - Database Size
  - Backups

### GitHub Actions

```bash
# Workflow-Status prüfen
gh run list --workflow=cd.yml

# Letzten Run anzeigen
gh run view --log
```

## 🔒 Sicherheit

### CORS Policy

Der Worker erlaubt nur Requests von:

- `https://budget-tracker-frontend.pages.dev`
- `http://localhost:4201` (Entwicklung)

### Secrets Management

- Alle Secrets werden in GitHub Secrets gespeichert
- Worker erhält DATABASE_URL via Cloudflare Secrets
- Keine Secrets im Code oder .env committet

### PostgreSQL Connection

- SSL/TLS enforced (`sslmode=require`)
- Connection Pooling für Performance
- Row Level Security (RLS) könnte noch implementiert werden

## 📚 Weitere Dokumentation

- [Environment Setup](./ENVIRONMENT_SETUP.md) - Umgebungsvariablen & Secrets
- [Neon Database Setup](./NEON_DATABASE_SETUP.md) - Neon PostgreSQL Configuration
- [Switch Database](./SWITCH_DATABASE.md) - Zwischen lokaler & Neon DB wechseln
- [Deployment Guide](./DEPLOYMENT.md) - Manual Deployment Schritte
- [Setup Guide](./SETUP.md) - Komplette Setup-Anleitung

## 🎯 Nächste Schritte

### Empfohlene Verbesserungen

1. **Authentication & Authorization**
   - JWT Tokens implementieren
   - User Login/Registration im Frontend
   - Protected Routes

2. **Weitere API Endpoints**
   - `/api/accounts` - Konto-Management
   - `/api/categories` - Kategorien-Verwaltung
   - `/api/transactions` - Transaktionen CRUD

3. **Performance Optimierung**
   - Caching mit Cloudflare KV
   - Hyperdrive für DB-Connection Pooling
   - Service Worker für Offline-Funktionalität

4. **Monitoring & Alerts**
   - Sentry für Error Tracking
   - Grafana für Metriken
   - Uptime Monitoring

5. **Testing**
   - E2E Tests mit Playwright
   - API Integration Tests
   - Load Testing mit k6

## 🤝 Beitragen

Pull Requests sind willkommen! Siehe [CONTRIBUTING.md](../CONTRIBUTING.md).

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](../LICENSE).
