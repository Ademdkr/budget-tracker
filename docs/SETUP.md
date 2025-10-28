# Setup & Quickstart

Dieses Dokument erklärt den schnellsten Weg, das Template lokal zu starten.

Voraussetzungen

- Node (empfohlen: 22.x, siehe `package.json` engines)
- pnpm
- Docker (optional, für Postgres)

1. Repository klonen

```bash
git clone https://github.com/Ademdkr/budget-tracker.git
cd budget-tracker
```

2. Environment vorbereiten

- Kopiere `apps/backend/.env.example` nach `apps/backend/.env` und passe `DATABASE_URL` an (siehe docker-compose.yml für lokale Postgres).
- Optional: passe Root `.env` an (App-Name/Ports). tools/setup.mjs kann Platzhalter ersetzen.

3. Abhängigkeiten installieren

```bash
pnpm install
```

Hinweis: Das Repo führt `prisma generate` für Backend/Worker nach der Installation aus (postinstall). Wenn du die Scripts überspringen willst, verwende `pnpm install --ignore-scripts`.

4. Datenbank lokal starten (optional, empfohlen für Backend)

```bash
pnpm db:up
```

5. Prisma-Migrationen / -Seed (nur falls du localkopierst)

```bash
cd apps/backend
pnpm prisma:migrate
pnpm prisma:generate
pnpm prisma:seed
```

6. Entwicklung starten

Frontend + Backend gleichzeitig:

```bash
pnpm dev
```

Nur Frontend:

```bash
pnpm --filter @budget-tracker/frontend dev
```

Nur Backend:

```bash
pnpm --filter @budget-tracker/backend start:dev
```

7. Build / CI

Die GitHub Actions CI (falls aktiviert) führt `pnpm install --ignore-scripts`, `pnpm -r build`, `pnpm -r lint` und `pnpm -r test` aus.

Fehlerbehebung

- Wenn `prisma generate` in CI/Install fehlschlägt: benutze `pnpm install --ignore-scripts` in CI und führe `pnpm --filter @budget-tracker/backend prisma:generate` manuell danach.

Frontend-Tests (Karma/ChromeHeadless)

- Lokale Ausführung der Frontend-Tests benötigt eine Chrome/Chromium-Installation.
- Beispiel (lokal): `pnpm --filter @budget-tracker/frontend test -- --watch=false --browsers=ChromeHeadless`
- In CI werden Frontend-Tests in einem separaten Job ausgeführt, der Chromium installiert. Falls du die Frontend-Tests in deinem CI nicht benötigst, kannst du den entsprechenden Job in `.github/workflows/ci.yml` deaktivieren.

Sicherheit / Geheimnisse

- Dieses Template enthält keine aktiven Zugangsdaten. Falls du Produktions-DB-URLs (z. B. Neon) in `apps/*/.env.neon` findest, entferne sie oder ersetze sie durch Platzhalter. Verwende stattdessen CI- oder Secrets-Management (GitHub Secrets, Vault), und aktualisiere `README`/`docs` entsprechend.
