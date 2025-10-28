# Deployment Anleitung

Diese Anleitung erklärt, wie du das Template in verschiedenen Umgebungen deployen kannst.

## 📋 Voraussetzungen

### GitHub Secrets konfigurieren

Gehe zu: `Repository → Settings → Secrets and variables → Actions`

#### Erforderliche Secrets

| Secret Name             | Beschreibung                             | Wo zu finden                                                                                                    |
| ----------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | API Token für Cloudflare Pages & Workers | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Edit Cloudflare Workers |
| `CLOUDFLARE_ACCOUNT_ID` | Deine Cloudflare Account ID              | [Cloudflare Dashboard](https://dash.cloudflare.com/) → Account ID rechts in der Sidebar                         |
| `DATABASE_URL`          | PostgreSQL Connection String (Pooled)    | Neon Dashboard → Connection String → Pooled                                                                     |
| `DIRECT_DATABASE_URL`   | Direct Connection für Migrationen        | Neon Dashboard → Connection String → Direct                                                                     |

#### Optional (für Backend Deployment)

| Secret Name      | Beschreibung      | Platform                                                             |
| ---------------- | ----------------- | -------------------------------------------------------------------- |
| `RAILWAY_TOKEN`  | Railway API Token | [Railway](https://railway.app/account/tokens)                        |
| `FLY_API_TOKEN`  | Fly.io API Token  | [Fly.io Dashboard](https://fly.io/user/personal_access_tokens)       |
| `RENDER_API_KEY` | Render API Key    | [Render Dashboard](https://dashboard.render.com/u/settings#api-keys) |

---

## 🌐 Frontend Deployment (Cloudflare Pages)

### 1. Cloudflare Pages Projekt erstellen

1. Gehe zu [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages
2. Klicke auf "Create a project"
3. Wähle "Connect to Git"
4. Wähle dein Repository
5. Konfiguration:
   - **Project name**: `dein-slug-frontend`
   - **Production branch**: `main`
   - **Build command**: `pnpm install && pnpm --filter @template/frontend build`
   - **Build output directory**: `apps/frontend/dist/apps/frontend`

### 2. Environment Variablen (Pages)

In Cloudflare Pages → Settings → Environment variables:

```
NODE_VERSION=20
SKIP_POSTINSTALL=true
```

### 3. Custom Domain (optional)

Cloudflare Pages → Custom domains → Add custom domain

---

## 🔧 Worker Deployment (Cloudflare Workers)

Der Worker wird automatisch beim ersten Deploy über GitHub Actions erstellt.

### Manueller Deploy (lokal)

```bash
cd apps/worker

# Secrets setzen
pnpm wrangler secret put DATABASE_URL
# Paste deinen DATABASE_URL und drücke Enter

# Deploy
pnpm deploy --env production
```

### Custom Routes (optional)

In `apps/worker/wrangler.toml`:

```toml
routes = [
  { pattern = "api.dein-domain.com/*", zone_name = "dein-domain.com" }
]
```

---

## 🗄️ Datenbank (Neon PostgreSQL)

### 1. Neon Projekt erstellen

1. Gehe zu [Neon Console](https://console.neon.tech)
2. Klicke "New Project"
3. Wähle Region (empfohlen: nah an deinen Workers)
4. Projekt-Name: `dein-projekt-db`

### 2. Connection Strings kopieren

In Neon Dashboard → Connection Details:

**Pooled Connection** (für Worker & Backend):

```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

→ Als `DATABASE_URL` Secret speichern

**Direct Connection** (für Migrationen):

```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&connect_timeout=10
```

→ Als `DIRECT_DATABASE_URL` Secret speichern

### 3. Erste Migration

Lokal mit Direct URL:

```bash
cd apps/backend
export DATABASE_URL="direct-connection-string"
pnpm prisma migrate deploy
```

Oder über GitHub Actions (automatisch bei Push zu `main`).

### 4. Branching (optional)

Neon unterstützt Database Branching für Entwicklung:

```bash
# Neuen DB-Branch erstellen
pnpm wrangler --filter @template/worker secret put DATABASE_URL_DEV
```

---

## 🚂 Backend Deployment

Da NestJS nicht auf Cloudflare Workers läuft, hier die besten Alternativen:

### Option A: Railway (Empfohlen)

#### 1. Railway Projekt erstellen

```bash
# Railway CLI installieren
npm install -g @railway/cli

# Login
railway login

# Projekt erstellen
cd apps/backend
railway init
```

#### 2. Environment Variablen

Im Railway Dashboard:

```bash
DATABASE_URL=postgresql://...
PORT_API=3000
NODE_ENV=production
CORS_ORIGIN=https://dein-frontend.pages.dev
```

#### 3. Deploy

```bash
railway up
```

#### 4. Custom Domain

Railway Dashboard → Settings → Domains → Generate Domain

#### 5. GitHub Integration (optional)

Railway Dashboard → Settings → Connect to GitHub → Auto-Deploy bei Push

### Option B: Render

#### 1. `render.yaml` erstellen

Im Root des Projekts:

```yaml
services:
  - type: web
    name: dein-projekt-backend
    env: node
    region: frankfurt # Oder deine bevorzugte Region
    buildCommand: cd apps/backend && pnpm install && pnpm build
    startCommand: cd apps/backend && pnpm start:prod
    healthCheckPath: /api/health
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: DIRECT_DATABASE_URL
        sync: false
      - key: PORT_API
        value: 3000
      - key: NODE_ENV
        value: production
      - key: CORS_ORIGIN
        value: https://dein-frontend.pages.dev
```

#### 2. Repository mit Render verbinden

1. Gehe zu [Render Dashboard](https://dashboard.render.com/)
2. New → Web Service
3. Connect Repository
4. Render erkennt automatisch `render.yaml`

#### 3. Environment Variablen setzen

Render Dashboard → Environment → Add Environment Variable

### Option C: Fly.io

#### 1. Fly CLI installieren

```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

#### 2. Fly.io Projekt erstellen

```bash
cd apps/backend
fly launch
```

Beantworte die Fragen:

- App name: `dein-projekt-backend`
- Region: Wähle nächste Region
- PostgreSQL: Nein (verwende Neon)
- Redis: Nein

#### 3. Secrets setzen

```bash
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set PORT_API=3000
fly secrets set NODE_ENV=production
fly secrets set CORS_ORIGIN="https://dein-frontend.pages.dev"
```

#### 4. Deploy

```bash
fly deploy
```

---

## 🔄 CI/CD Workflow

### Automatisches Deployment

Push zu `main` Branch triggert automatisch:

1. ✅ **CI Pipeline** (Lint, Test, Build)
2. 🗄️ **Database Migrations** (Neon)
3. 🌐 **Frontend Deploy** (Cloudflare Pages)
4. 🔧 **Worker Deploy** (Cloudflare Workers)

### Manuelles Deployment

GitHub → Actions → Deploy → Run workflow

### Branch-Protection (empfohlen)

Repository Settings → Branches → Add rule:

- Branch name pattern: `main`
- ☑️ Require status checks to pass before merging
- ☑️ Require branches to be up to date before merging
- Status checks: `build`, `frontend-tests`

---

## 🧪 Staging Environment

### 1. Staging Branch erstellen

```bash
git checkout -b staging
git push origin staging
```

### 2. GitHub Actions anpassen

`.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [main, staging]
```

### 3. Separate Resources

- **Cloudflare**: `dein-projekt-frontend-staging`
- **Worker**: Deploy mit `--env staging`
- **Neon**: Separater Branch oder Projekt
- **Backend**: Separate Railway/Render Service

### 4. Environment Secrets

GitHub → Environments → New environment:

- Name: `staging`
- Secrets: `DATABASE_URL_STAGING`, etc.

---

## 📊 Monitoring & Logging

### Cloudflare Analytics

Cloudflare Dashboard → Pages/Workers → Analytics

### Backend Monitoring

#### Railway

- Integriertes Monitoring im Dashboard
- Logs: `railway logs`

#### Render

- Dashboard → Logs & Metrics

#### Fly.io

- `fly logs`
- `fly status`

### Health Checks

```bash
# Frontend
curl https://dein-frontend.pages.dev

# Backend
curl https://dein-backend.railway.app/api/health

# Worker
curl https://dein-worker.workers.dev/api/health
```

---

## 🔐 Security Best Practices

1. **Secrets nie committen**
   - Nutze GitHub Secrets für alle sensiblen Daten
   - `.env` Dateien sind in `.gitignore`

2. **CORS konfigurieren**

   ```typescript
   // apps/backend/src/main.ts
   app.enableCors({
     origin: process.env.CORS_ORIGIN?.split(',') || [],
     credentials: true,
   });
   ```

3. **Rate Limiting** (empfohlen)

   ```bash
   pnpm --filter @template/backend add @nestjs/throttler
   ```

4. **SSL/HTTPS**
   - Cloudflare: Automatisch
   - Railway/Render/Fly: Automatisch

5. **Environment Variables**
   - Produktions-Secrets nur in Platform-Secrets speichern
   - Nie in Code oder Logs exposen

---

## 🐛 Troubleshooting

### Deployment schlägt fehl

```bash
# Logs prüfen
gh workflow view deploy  # GitHub CLI

# Oder im Browser:
# GitHub → Actions → Deploy → Neuester Run
```

### Prisma Migration Fehler

```bash
# Lokal mit Direct URL testen
cd apps/backend
DATABASE_URL="direct-url" pnpm prisma migrate deploy
```

### Worker funktioniert nicht

```bash
# Logs anzeigen
pnpm wrangler tail dein-worker

# Secrets überprüfen
pnpm wrangler secret list
```

### Backend startet nicht

1. Health Check URL prüfen
2. Environment Variablen überprüfen
3. Logs checken
4. Port-Konfiguration verifizieren

---

## 📚 Weitere Ressourcen

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Neon Documentation](https://neon.tech/docs)
- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs/)

---

## 💡 Tipps

1. **Kosten optimieren**:
   - Neon Free Tier: 3 GB Storage
   - Cloudflare: Generous Free Tier
   - Railway: $5/Monat für Hobby-Projekte
   - Render: Free Tier mit Einschränkungen

2. **Performance**:
   - Wähle Regions nah beieinander (DB & Backend & Workers)
   - Nutze Cloudflare Caching
   - Implementiere Database Connection Pooling

3. **Entwicklung**:
   - Nutze Staging Environment für Tests
   - Feature Flags für schrittweisen Rollout
   - Preview Deployments für PRs (Cloudflare Pages automatisch)

---

Bei Fragen oder Problemen, erstelle ein [GitHub Issue](https://github.com/Ademdkr/budget-tracker/issues)!
