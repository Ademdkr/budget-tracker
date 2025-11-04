# 🔄 Datenbank-Umgebung wechseln

Schnellanleitung zum Wechseln zwischen lokaler PostgreSQL und Neon Production Database.

## 📋 Verfügbare Umgebungen

| Datei        | Beschreibung               | Verwendung                 |
| ------------ | -------------------------- | -------------------------- |
| `.env.local` | Lokale PostgreSQL (Docker) | Entwicklung, Tests         |
| `.env.neon`  | Neon Production DB         | Production-Test, Debugging |
| `.env`       | Aktuelle Verbindung        | Wird von der App verwendet |

## 🚀 Quick Commands

### Status prüfen

```bash
cd apps/backend
pnpm env:status
```

### Zu lokaler DB wechseln

```bash
cd apps/backend
pnpm env:local
```

### Zu Neon DB wechseln

```bash
cd apps/backend
pnpm env:neon
```

## 📝 Ersteinrichtung

### 1. Neon Connection Strings holen

1. Gehe zu [Neon Console](https://console.neon.tech)
2. Wähle dein Projekt: `budget-tracker-production`
3. Kopiere die Connection Strings:

**Pooled Connection (für DATABASE_URL):**

```
postgresql://user:password@ep-holy-cake-agz4x04m.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**Direct Connection (für DIRECT_DATABASE_URL):**

```
postgresql://user:password@ep-holy-cake-agz4x04m.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&direct=true
```

### 2. `.env.neon` aktualisieren

Öffne `apps/backend/.env.neon` und ersetze:

- `YOUR_USER` mit deinem Neon-Benutzer
- `YOUR_PASSWORD` mit deinem Neon-Passwort

```bash
# Beispiel
DATABASE_URL=postgresql://neondb_owner:npg_abc123...@ep-holy-cake-agz4x04m.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Teste die Verbindung

```bash
cd apps/backend

# Wechsle zu Neon
pnpm env:neon

# Prüfe Verbindung
pnpm prisma:studio
# Sollte Prisma Studio mit Neon-Daten öffnen

# Wechsle zurück zu lokal
pnpm env:local
```

## 🎯 Typische Workflows

### Entwicklung (Standard)

```bash
# Lokale DB verwenden
pnpm env:local

# App starten
pnpm start:dev
```

### Production-Daten testen

```bash
# Zu Neon wechseln
pnpm env:neon

# Prisma Studio öffnen
pnpm prisma:studio

# App mit Production-DB starten
pnpm start:dev

# ⚠️ Wichtig: Zurück zu lokal wechseln nach dem Test!
pnpm env:local
```

### Migration auf Neon testen

```bash
# Zu Neon wechseln
pnpm env:neon

# Migration Status
pnpm prisma migrate status

# Migrationen anwenden (⚠️ Vorsicht in Production!)
# pnpm prisma migrate deploy

# Zurück zu lokal
pnpm env:local
```

## ⚠️ Wichtige Hinweise

### ✅ DO:

- Immer Status prüfen bevor du die App startest: `pnpm env:status`
- Nach Neon-Tests wieder zu lokal wechseln: `pnpm env:local`
- Backups vor destructive Operations auf Neon
- `.env.neon` niemals committen (ist in .gitignore)

### ❌ DON'T:

- **Niemals** `db:reset` auf Neon ausführen (löscht alle Production-Daten!)
- Keine Migrations auf Neon ohne Backup
- `.env.neon` nicht im Git committen
- Production-DB nicht für Tests verwenden (Neon Free Tier hat Limits)

## 🔧 Troubleshooting

### "Error: P1001: Can't reach database server"

**Lösung:** Neon DB ist eingeschlafen (Free Tier). Warte 10-20 Sekunden und versuche es erneut.

```bash
# Überprüfe ob .env.neon korrekt konfiguriert ist
cat apps/backend/.env.neon
```

### "Error: Invalid connection string"

**Lösung:** Prüfe ob `sslmode=require` in der Connection String ist:

```bash
# Korrekt:
postgresql://user:pass@host/db?sslmode=require

# Falsch:
postgresql://user:pass@host/db
```

### Falsches Environment

```bash
# Status prüfen
pnpm env:status

# Zur richtigen Umgebung wechseln
pnpm env:local  # oder
pnpm env:neon
```

## 📚 Weitere Infos

- [Neon Database Setup Guide](./NEON_DATABASE_SETUP.md)
- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Prisma Dokumentation](https://www.prisma.io/docs)
