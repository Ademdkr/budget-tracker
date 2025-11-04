# Neon PostgreSQL Database Setup

Anleitung zur Einrichtung und Konfiguration einer Neon PostgreSQL-Datenbank für das Budget Tracker Projekt.

## 📝 Voraussetzungen

- Neon Account (kostenlos): https://neon.tech
- GitHub Repository mit Secrets-Zugriff

## 🚀 Schritt-für-Schritt Anleitung

### 1. Neon Datenbank erstellen

1. Melde dich bei [Neon](https://neon.tech) an
2. Klicke auf "Create a Project"
3. Konfiguriere das Projekt:
   - **Project name**: `budget-tracker-production`
   - **Region**: Wähle die Region näher zu deinen Benutzern (empfohlen: `eu-central-1`)
   - **PostgreSQL version**: 16 (neueste stabile Version)
4. Klicke auf "Create Project"

### 2. Connection Strings kopieren

Nach der Erstellung siehst du zwei wichtige Connection Strings:

#### Pooled Connection (für Anwendung)

```
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

#### Direct Connection (für Migrations)

```
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&direct=true
```

**💡 Tipp:** Die Direct Connection enthält oft `?sslmode=require&direct=true` oder hat einen anderen Hostname.

### 3. GitHub Secrets konfigurieren

Gehe zu deinem GitHub Repository:

```
Settings → Secrets and variables → Actions → Repository secrets
```

Erstelle/Aktualisiere folgende Secrets:

#### DATABASE_URL

```bash
# Pooled Connection von Neon
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

#### DIRECT_DATABASE_URL

```bash
# Direct Connection von Neon (für Prisma Migrations)
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&direct=true
```

### 4. Datenbank zurücksetzen (bei Migrationsproblemen)

Wenn du bereits fehlgeschlagene Migrationen in der Datenbank hast:

#### Option A: Über Neon SQL Editor (empfohlen)

1. Gehe zu deinem Neon Projekt Dashboard
2. Klicke auf "SQL Editor"
3. Führe folgendes SQL aus:

```sql
-- Alle Tabellen löschen
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Berechtigungen wiederherstellen
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

#### Option B: Über lokale Prisma CLI

```bash
# Setze temporär die Neon DATABASE_URL
export DATABASE_URL="postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
export DIRECT_DATABASE_URL="postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&direct=true"

# Wechsle ins Backend-Verzeichnis
cd apps/backend

# Führe alle Migrationen aus
npx prisma migrate deploy

# Optional: Seed-Daten einfügen
npx prisma db seed
```

#### Option C: Über GitHub Actions (⚠️ DESTRUCTIVE)

1. Gehe zu GitHub Actions
2. Wähle "CD Pipeline"
3. Klicke "Run workflow"
4. Aktiviere "Reset database before deploying migrations"
5. Klicke "Run workflow"

**⚠️ ACHTUNG:** Dies löscht ALLE Daten in der Produktionsdatenbank!

### 5. Erste Deployment durchführen

Nach dem Zurücksetzen der Datenbank:

```bash
# Pushe einen Commit, um CD-Pipeline zu triggern
git commit --allow-empty -m "chore: trigger CD pipeline"
git push origin main
```

Die CD-Pipeline sollte jetzt erfolgreich durchlaufen und alle Migrationen anwenden.

## 🔍 Migration Status überprüfen

### Lokal (mit Neon Connection)

```bash
cd apps/backend
export DATABASE_URL="postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require"
npx prisma migrate status
```

Erwartete Ausgabe bei erfolgreichen Migrationen:

```
Database schema is up to date!
```

### Über Neon SQL Editor

```sql
-- Zeige alle angewendeten Migrationen
SELECT migration_name, finished_at, rolled_back_at
FROM _prisma_migrations
ORDER BY finished_at DESC;

-- Zeige fehlgeschlagene Migrationen
SELECT migration_name, started_at, logs
FROM _prisma_migrations
WHERE finished_at IS NULL
  AND rolled_back_at IS NULL;
```

## 🐛 Troubleshooting

### Problem: "type AccountType already exists"

**Ursache:** Migration wurde teilweise angewendet, dann fehlgeschlagen.

**Lösung:**

1. Datenbank komplett zurücksetzen (siehe Option A oben)
2. CD-Pipeline erneut ausführen

### Problem: "Migration failed to apply"

**Ursache:** Fehlgeschlagene Migration blockiert neue Migrationen.

**Lösung:**

```bash
# Markiere fehlgeschlagene Migration als "rolled back"
npx prisma migrate resolve --rolled-back "MIGRATION_NAME"

# Oder markiere als "applied" wenn Schema bereits korrekt ist
npx prisma migrate resolve --applied "MIGRATION_NAME"
```

### Problem: Connection Timeout

**Ursache:** Neon Database ist pausiert (Free Tier schläft nach Inaktivität).

**Lösung:**

1. Warte 10-20 Sekunden
2. Führe Query erneut aus
3. Oder wecke die DB auf über Neon Dashboard → "Wake up database"

### Problem: SSL Connection Error

**Ursache:** `sslmode=require` fehlt in der Connection String.

**Lösung:**
Stelle sicher, dass alle Neon Connection Strings `?sslmode=require` enthalten:

```
postgresql://user:password@host/db?sslmode=require
```

## 📊 Neon Limits (Free Tier)

- **Storage**: 0.5 GB
- **Active time**: 100 Stunden/Monat
- **Compute**: Shared CPU
- **Connections**: 100 gleichzeitig
- **Branches**: 10

💡 Für Production-Workloads empfiehlt sich ein Upgrade auf den Pro Plan.

## 🔐 Sicherheits-Best-Practices

### ✅ DO:

- Verwende unterschiedliche Datenbanken für Development/Staging/Production
- Rotiere Passwörter regelmäßig
- Aktiviere IP Allowlist in Neon (falls möglich)
- Verwende CONNECTION POOLING für bessere Performance
- Backup wichtiger Daten regelmäßig

### ❌ DON'T:

- Niemals Connection Strings in Code committen
- Keine Produktionsdaten in Development verwenden
- Keine öffentlichen Connection Strings teilen

## 📚 Weiterführende Links

- [Neon Dokumentation](https://neon.tech/docs)
- [Prisma mit Neon](https://www.prisma.io/docs/guides/database/neon)
- [Neon Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 🆘 Noch Probleme?

Wenn die Migrationen immer noch fehlschlagen:

1. Überprüfe die [GitHub Actions Logs](https://github.com/Ademdkr/budget-tracker/actions)
2. Prüfe die Neon Dashboard Logs
3. Stelle sicher, dass alle 5 Migrationen in `apps/backend/prisma/migrations/` existieren
4. Kontaktiere Neon Support bei persistenten Verbindungsproblemen
