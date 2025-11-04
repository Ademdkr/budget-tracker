# 🔄 Zwischen lokaler Entwicklung und Production wechseln

Diese Anleitung erklärt, wie du zwischen lokalem Backend und Cloudflare Worker API wechseln kannst.

## 📋 Übersicht

Das Projekt unterstützt drei Environment-Modi:

| Modus           | Environment File             | API Backend                                                | Verwendung                    |
| --------------- | ---------------------------- | ---------------------------------------------------------- | ----------------------------- |
| **Development** | `environment.development.ts` | `http://localhost:3001/api`                                | Lokale Entwicklung mit NestJS |
| **Worker**      | `environment.worker.ts`      | `https://budget-tracker-worker.adem-dokur.workers.dev/api` | Test gegen Production Worker  |
| **Production**  | `environment.ts`             | `https://budget-tracker-worker.adem-dokur.workers.dev/api` | Production Build              |

## 🚀 Verwendung

### 1. Lokale Entwicklung (mit NestJS Backend)

**Benötigt:**

- Lokales Backend läuft auf Port 3001
- Lokale PostgreSQL Datenbank

```bash
# Backend starten (Terminal 1)
cd apps/backend
pnpm env:local              # Zu lokaler DB wechseln
pnpm start:dev              # Backend starten auf http://localhost:3001

# Frontend starten (Terminal 2)
cd apps/frontend
pnpm dev                    # oder: pnpm start
```

**Vorteile:**

- ✅ Volle Backend-Funktionalität (NestJS mit Prisma)
- ✅ Hot-Reload für Backend und Frontend
- ✅ Debugging möglich
- ✅ Schnelle Iteration

### 2. Test gegen Production Worker

**Verwendung:**

```bash
cd apps/frontend
pnpm dev:worker            # oder: pnpm start:worker
```

**Vorteile:**

- ✅ Testet gegen echte Production API
- ✅ Kein lokales Backend nötig
- ✅ Verwendet Neon Production Database
- ⚠️ Änderungen wirken sich auf Production aus!

### 3. Production Build

```bash
cd apps/frontend
pnpm build:prod
```

Deployment erfolgt automatisch via GitHub Actions.

## 📁 Environment Files

### `environment.development.ts` (Default für `pnpm dev`)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3001/api', // Lokales NestJS Backend
};
```

### `environment.worker.ts` (Für `pnpm dev:worker`)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://budget-tracker-worker.adem-dokur.workers.dev/api', // Production Worker
};
```

### `environment.ts` (Production)

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://budget-tracker-worker.adem-dokur.workers.dev/api', // Production Worker
};
```

## 🔧 Backend-Umgebung wechseln

### Datenbank umschalten

```bash
cd apps/backend

# Status prüfen
pnpm env:status

# Zu lokaler Datenbank wechseln
pnpm env:local

# Zu Neon Production DB wechseln
pnpm env:neon
```

Siehe [SWITCH_DATABASE.md](./SWITCH_DATABASE.md) für Details.

## 📊 Feature-Vergleich

### Lokales NestJS Backend

**Vorteile:**

- ✅ Alle Endpoints verfügbar
- ✅ Prisma Client mit typsicheren Queries
- ✅ Guards, Interceptors, Pipes
- ✅ Swagger Documentation (`/api/docs`)
- ✅ Hot-Reload
- ✅ Full Stack Debugging

**Endpoints:**

```
GET    /api/health
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/users

GET    /api/accounts
POST   /api/accounts
GET    /api/accounts/:id
PATCH  /api/accounts/:id
DELETE /api/accounts/:id

GET    /api/categories
POST   /api/categories
GET    /api/categories/:id
PATCH  /api/categories/:id
DELETE /api/categories/:id

GET    /api/budgets
GET    /api/budgets/with-stats
POST   /api/budgets
GET    /api/budgets/:id
PATCH  /api/budgets/:id
DELETE /api/budgets/:id

GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PATCH  /api/transactions/:id
DELETE /api/transactions/:id
POST   /api/transactions/import
```

### Cloudflare Worker API

**Vorteile:**

- ✅ Edge Computing (schnell weltweit)
- ✅ Serverless (keine Server-Wartung)
- ✅ Production-Ready
- ✅ Auto-Scaling

**Limitierungen:**

- ⚠️ Nur ausgewählte Endpoints implementiert
- ⚠️ Kein Hot-Reload
- ⚠️ Limitierte CPU-Zeit (10ms-50ms)

**Aktuell verfügbare Endpoints:**

```
GET    /api/health
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/users

GET    /api/budgets
POST   /api/budgets
PATCH  /api/budgets/:id
DELETE /api/budgets/:id
```

**TODO:** Weitere Endpoints zum Worker hinzufügen (siehe unten)

## 🎯 Workflow-Empfehlungen

### Neue Features entwickeln

1. Lokales Backend verwenden (`pnpm dev`)
2. Feature im NestJS Backend implementieren
3. Frontend-Integration testen
4. Wenn fertig: Worker-Endpoints hinzufügen
5. Test mit `pnpm dev:worker`
6. Commit & Push → Automatisches Deployment

### Schnelle Frontend-Änderungen

1. Worker verwenden (`pnpm dev:worker`)
2. Keine Backend-Änderungen nötig
3. Direkt gegen Production API testen

### Bug-Fixing

1. Reproduzieren mit `pnpm dev:worker`
2. Lokales Backend starten für Debugging
3. Fix implementieren
4. Worker aktualisieren wenn nötig

## 🛠️ Worker-Endpoints erweitern

Um weitere Endpoints zum Worker hinzuzufügen:

### 1. Endpoint im Worker hinzufügen

```typescript
// apps/worker/src/index.ts

// Accounts Endpoint
app.get('/api/accounts', async (c) => {
  try {
    const accounts = await sql`
      SELECT * FROM "Account" ORDER BY created_at DESC
    `;
    return c.json(accounts);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to fetch accounts' }, 500);
  }
});
```

### 2. Testen

```bash
# Lokal testen (wenn Worker lokal läuft)
curl http://localhost:8787/api/accounts

# Production testen
curl https://budget-tracker-worker.adem-dokur.workers.dev/api/accounts
```

### 3. Deployment

```bash
git add apps/worker/src/index.ts
git commit -m "feat: add accounts endpoint to Worker"
git push origin main
# GitHub Actions deployed automatisch
```

## 🐛 Troubleshooting

### "Failed to fetch" Fehler

**Problem:** Frontend kann Backend nicht erreichen

**Lösung für lokales Backend:**

```bash
# Prüfe ob Backend läuft
curl http://localhost:3001/api/health

# Backend starten falls nicht läuft
cd apps/backend
pnpm start:dev
```

**Lösung für Worker:**

```bash
# Prüfe Worker
curl https://budget-tracker-worker.adem-dokur.workers.dev/api/health

# Neu deployen falls Problem
git push origin main
```

### CORS Fehler

**Problem:** Browser blockiert Request wegen CORS

**Lösung für lokales Backend:**
Prüfe `apps/backend/src/main.ts` - CORS sollte für `http://localhost:4201` erlaubt sein.

**Lösung für Worker:**
Prüfe `apps/worker/src/index.ts` - CORS sollte für `http://localhost:4201` erlaubt sein.

### Environment wird nicht gewechselt

**Problem:** Änderungen in environment.\*.ts werden nicht übernommen

**Lösung:**

```bash
# Frontend neu starten
# Strg+C zum Beenden
pnpm dev          # oder pnpm dev:worker
```

## 📚 Siehe auch

- [Architecture Overview](./ARCHITECTURE.md)
- [Database Switching Guide](./SWITCH_DATABASE.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
