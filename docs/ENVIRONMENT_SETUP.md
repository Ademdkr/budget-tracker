# Environment Setup Guide

Dieses Dokument beschreibt alle benötigten Umgebungsvariablen für lokale Entwicklung und Produktion.

## 🔧 Lokale Entwicklung

### 1. Backend Setup

Kopiere `apps/backend/.env.example` nach `apps/backend/.env`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Passe die Werte für deine lokale Umgebung an:

```env
# Lokale PostgreSQL (Docker Compose)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/budget-tracker?schema=public&sslmode=disable
DIRECT_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/budget-tracker?schema=public&sslmode=disable

# API Server
PORT_API=3001
CORS_ORIGIN=http://localhost:4201

# JWT Secrets (für Entwicklung OK, in Produktion ÄNDERN!)
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# Node Environment
NODE_ENV=development
```

### 2. Docker Setup

Für Docker Compose sind die Umgebungsvariablen bereits in der `docker-compose.yml` konfiguriert.
Die Datenbank läuft auf Port `5434` (extern) und Port `5432` (intern im Container).

## 🚀 Produktion / CI/CD

### GitHub Actions Secrets

Für die CD-Pipeline müssen folgende Secrets in GitHub konfiguriert werden:

#### Repository Settings → Secrets and variables → Actions → New repository secret

1. **DATABASE_URL** (erforderlich)

   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```

   - Produktions-Datenbank URL (z.B. Neon, Supabase, oder selbst gehostet)
   - **WICHTIG:** Verwende eine sichere PostgreSQL-Instanz mit SSL

2. **DIRECT_DATABASE_URL** (erforderlich)

   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```

   - Direkter Zugriff für Prisma Migrations
   - Bei Neon: Verwende die "Direct connection" URL

3. **CLOUDFLARE_API_TOKEN** (erforderlich für Cloudflare Deployment)
   - Erstelle ein API Token in Cloudflare Dashboard
   - Berechtigungen: `Account.Cloudflare Pages:Edit`, `Account.Cloudflare Workers Scripts:Edit`
   - [Cloudflare API Tokens erstellen](https://dash.cloudflare.com/profile/api-tokens)

4. **CLOUDFLARE_ACCOUNT_ID** (erforderlich für Cloudflare Deployment)
   - Zu finden im Cloudflare Dashboard unter Account → Workers & Pages
   - Format: 32-Zeichen Hexadezimal-String

5. **JWT_SECRET** (optional, aber empfohlen)

   ```bash
   # Generiere ein sicheres Secret:
   openssl rand -base64 32
   ```

6. **JWT_REFRESH_SECRET** (optional, aber empfohlen)
   ```bash
   # Generiere ein anderes sicheres Secret:
   openssl rand -base64 32
   ```

### Cloudflare Wrangler Secrets

Für den Worker müssen zusätzlich Secrets direkt in Cloudflare gesetzt werden:

```bash
# Installiere Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Setze DATABASE_URL Secret
wrangler secret put DATABASE_URL --env production

# Setze weitere Secrets nach Bedarf
wrangler secret put JWT_SECRET --env production
wrangler secret put JWT_REFRESH_SECRET --env production
```

## 🔐 Sicherheits-Best-Practices

### ✅ DO:

- Verwende starke, zufällige Secrets für Produktion
- Rotiere Secrets regelmäßig
- Verwende verschiedene Secrets für verschiedene Umgebungen
- Aktiviere SSL/TLS für Datenbank-Verbindungen in Produktion
- Verwende `.env.example` als Template, aber committe niemals `.env` Dateien

### ❌ DON'T:

- Niemals Secrets in den Code committen
- Niemals Produktions-Secrets in lokaler Entwicklung verwenden
- Niemals Secrets in Logs ausgeben
- Niemals unsichere/schwache Passwörter verwenden

## 📋 Secrets Checklist

Vor dem ersten Production Deployment:

- [ ] `DATABASE_URL` in GitHub Secrets gesetzt
- [ ] `DIRECT_DATABASE_URL` in GitHub Secrets gesetzt
- [ ] `CLOUDFLARE_API_TOKEN` in GitHub Secrets gesetzt
- [ ] `CLOUDFLARE_ACCOUNT_ID` in GitHub Secrets gesetzt
- [ ] `JWT_SECRET` generiert und in GitHub Secrets gesetzt
- [ ] `JWT_REFRESH_SECRET` generiert und in GitHub Secrets gesetzt
- [ ] Datenbank mit SSL/TLS konfiguriert
- [ ] Cloudflare Pages Projekt erstellt
- [ ] Cloudflare Workers Projekt erstellt

## 🔍 Troubleshooting

### Migration Fehler: "type already exists"

Wenn die CD-Pipeline mit einem Fehler wie `type "AccountType" already exists` fehlschlägt:

1. **Option 1: Migration als angewendet markieren**

   ```bash
   # Lokal mit Zugriff auf Produktions-DB
   cd apps/backend
   npx prisma migrate resolve --applied "20251029180720_init_new_schema"
   ```

2. **Option 2: Manuelles Deployment mit Reset** (⚠️ LÖSCHT ALLE DATEN!)
   - Gehe zu GitHub Actions
   - Klicke auf "CD Pipeline"
   - Klicke "Run workflow"
   - Aktiviere "Reset database before deploying migrations"
   - Klicke "Run workflow"

### Fehlende Umgebungsvariablen

Wenn die Anwendung nicht startet:

```bash
# Überprüfe, ob alle Variablen gesetzt sind
cat apps/backend/.env

# Vergleiche mit dem Template
diff apps/backend/.env apps/backend/.env.example
```

## 📚 Weitere Ressourcen

- [Prisma Database Connection](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Neon Database Setup](https://neon.tech/docs/get-started-with-neon/signing-up)
