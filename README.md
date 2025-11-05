# 💰 Budget Tracker

Eine moderne Full-Stack-Webanwendung zur Verwaltung persönlicher Finanzen, Budgets und Transaktionen.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![Angular](https://img.shields.io/badge/Angular-18-red)
![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Inhaltsverzeichnis

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Projekt-Struktur](#-projekt-struktur)
- [Voraussetzungen](#-voraussetzungen)
- [Installation](#-installation)
- [Entwicklung](#-entwicklung)
- [Produktion](#-produktion)
- [Datenbank](#-datenbank)
- [API Dokumentation](#-api-dokumentation)
- [Verfügbare Scripts](#-verfügbare-scripts)
- [Umgebungsvariablen](#-umgebungsvariablen)
- [Docker](#-docker)
- [Lizenz](#-lizenz)

## ✨ Features

- 📊 **Dashboard** - Übersichtliche Darstellung aller Finanzdaten
- 💳 **Kontoverwaltung** - Verwaltung mehrerer Konten (Giro, Sparkonto, Kreditkarte, etc.)
- 📝 **Transaktionen** - Erfassung und Kategorisierung von Einnahmen und Ausgaben
- 🎯 **Budgets** - Monatliche Budgets für verschiedene Kategorien
- 📈 **Kategorien** - Flexible Kategorisierung mit Emojis und Farben
- 🔐 **Authentifizierung** - Sicheres JWT-basiertes Auth-System
- 📱 **Responsive Design** - Optimiert für Desktop und Mobile
- 🌙 **Material Design** - Moderne Benutzeroberfläche mit Angular Material
- 🐳 **Docker Support** - Einfaches Deployment mit Docker Compose
- ☁️ **Cloud-Ready** - Unterstützung für Neon Database (Serverless PostgreSQL)

## 🛠 Tech Stack

### Backend

- **[NestJS](https://nestjs.com/)** - Progressive Node.js Framework
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Relationale Datenbank
- **[TypeScript](https://www.typescriptlang.org/)** - Typsicheres JavaScript
- **[Class Validator](https://github.com/typestack/class-validator)** - Validierung
- **[JWT](https://jwt.io/)** - JSON Web Tokens für Authentifizierung

### Frontend

- **[Angular 18](https://angular.io/)** - Modernes Web Framework
- **[Angular Material](https://material.angular.io/)** - Material Design Components
- **[Chart.js](https://www.chartjs.org/)** - Datenvisualisierung
- **[RxJS](https://rxjs.dev/)** - Reaktive Programmierung
- **[TypeScript](https://www.typescriptlang.org/)** - Typsicheres JavaScript

### DevOps & Tools

- **[pnpm](https://pnpm.io/)** - Effizienter Package Manager
- **[Docker](https://www.docker.com/)** - Containerisierung
- **[Husky](https://typicode.github.io/husky/)** - Git Hooks
- **[ESLint](https://eslint.org/)** - Linting
- **[Prettier](https://prettier.io/)** - Code Formatting
- **[Commitlint](https://commitlint.js.org/)** - Conventional Commits

## 📁 Projekt-Struktur

```
budget-tracker/
├── apps/
│   ├── backend/              # NestJS Backend API
│   │   ├── prisma/           # Prisma Schema & Migrations
│   │   │   ├── schema.prisma # Datenbankschema
│   │   │   ├── seed.ts       # Seed-Daten
│   │   │   └── migrations/   # Datenbank-Migrationen
│   │   └── src/
│   │       ├── auth/         # Authentifizierung
│   │       ├── accounts/     # Kontoverwaltung
│   │       ├── transactions/ # Transaktionen
│   │       ├── categories/   # Kategorien
│   │       ├── budgets/      # Budgets
│   │       ├── prisma/       # Prisma Service
│   │       └── health/       # Health Checks
│   │
│   ├── frontend/             # Angular Frontend
│   │   └── src/
│   │       ├── app/          # Angular Components
│   │       │   ├── auth/     # Auth Module
│   │       │   ├── dashboard/
│   │       │   ├── accounts/
│   │       │   ├── transactions/
│   │       │   ├── categories/
│   │       │   └── budgets/
│   │       └── environments/ # Environment Configs
│   │
│   └── worker/               # Cloudflare Worker (Optional)
│
├── tools/                    # Setup Scripts
├── docker-compose.yml        # Docker Compose Config
├── pnpm-workspace.yaml       # PNPM Workspace Config
└── package.json              # Root Package Config
```

## 📦 Voraussetzungen

- **Node.js** >= 18
- **pnpm** >= 8
- **Docker** & **Docker Compose** (optional, für lokale Datenbank)
- **PostgreSQL** 16+ (falls ohne Docker)

## 🚀 Installation

### 1. Repository klonen

```bash
git clone https://github.com/Ademdkr/budget-tracker.git
cd budget-tracker
```

### 2. Dependencies installieren

```bash
pnpm install
```

### 3. Setup-Script ausführen

```bash
pnpm setup
```

Dieses Script erstellt automatisch die benötigten `.env`-Dateien im Backend-Verzeichnis.

### 4. Datenbank starten

#### Option A: Mit Docker (empfohlen)

```bash
pnpm db:up
```

Dies startet einen PostgreSQL-Container auf Port `5434`.

#### Option B: Eigene PostgreSQL-Instanz

Passen Sie die `DATABASE_URL` in `apps/backend/.env` an Ihre PostgreSQL-Verbindung an.

### 5. Datenbank initialisieren

```bash
# Prisma Client generieren
pnpm gen:prisma

# Migrationen ausführen
cd apps/backend
pnpm prisma:migrate

# Optional: Seed-Daten einfügen
pnpm db:seed
```

## 💻 Entwicklung

### Gesamtes Projekt starten

```bash
pnpm dev
```

Dies startet parallel:

- **Frontend**: http://localhost:4201
- **Backend API**: http://localhost:3001

### Einzelne Services starten

```bash
# Nur Frontend
pnpm dev:web

# Nur Backend
pnpm dev:api
```

### Prisma Studio öffnen

Für die visuelle Datenbankexploration:

```bash
pnpm db:studio
```

Öffnet Prisma Studio auf http://localhost:5555

## 🏭 Produktion

### Mit Docker Compose

```bash
# Services bauen und starten
docker compose up -d

# Logs ansehen
docker compose logs -f

# Services stoppen
docker compose down
```

Die Services sind dann verfügbar unter:

- **Frontend**: http://localhost:4201
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5434

### Manuelles Build

```bash
# Alle Projekte bauen
pnpm build

# Oder einzeln
pnpm build:web
pnpm build:api

# Produktion starten
pnpm start
```

## 🗄️ Datenbank

### Lokale Datenbank (Docker)

```bash
# Datenbank starten
pnpm db:up

# Logs anzeigen
pnpm db:logs

# Datenbank stoppen
pnpm db:down
```

**Connection String**: `postgresql://postgres:postgres@localhost:5434/budget-tracker`

### Neon Database (Cloud)

Das Projekt unterstützt [Neon](https://neon.tech) als serverlose PostgreSQL-Lösung.

```bash
# Zu Neon Database wechseln
cd apps/backend
pnpm env:neon

# Zurück zu lokaler Database
pnpm env:local

# Aktuellen Status prüfen
pnpm env:status
```

### Prisma Commands

```bash
# Prisma Client generieren
pnpm gen:prisma

# Neue Migration erstellen
cd apps/backend
pnpm prisma:migrate

# Datenbank zurücksetzen (⚠️ Vorsicht!)
pnpm db:reset

# Prisma Studio öffnen
pnpm prisma:studio
```

## 📚 API Dokumentation

Die API-Dokumentation ist über Swagger verfügbar:

**Development**: http://localhost:3001/api/docs

### Hauptendpunkte

#### Authentication

- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer anmelden
- `POST /api/auth/refresh` - Token erneuern

#### Accounts

- `GET /api/accounts` - Alle Konten abrufen
- `POST /api/accounts` - Konto erstellen
- `GET /api/accounts/:id` - Konto abrufen
- `PATCH /api/accounts/:id` - Konto aktualisieren
- `DELETE /api/accounts/:id` - Konto löschen

#### Transactions

- `GET /api/transactions` - Alle Transaktionen abrufen
- `POST /api/transactions` - Transaktion erstellen
- `GET /api/transactions/:id` - Transaktion abrufen
- `PATCH /api/transactions/:id` - Transaktion aktualisieren
- `DELETE /api/transactions/:id` - Transaktion löschen

#### Categories

- `GET /api/categories` - Alle Kategorien abrufen
- `POST /api/categories` - Kategorie erstellen
- `PATCH /api/categories/:id` - Kategorie aktualisieren
- `DELETE /api/categories/:id` - Kategorie löschen

#### Budgets

- `GET /api/budgets` - Alle Budgets abrufen
- `POST /api/budgets` - Budget erstellen
- `GET /api/budgets/:id` - Budget abrufen
- `PATCH /api/budgets/:id` - Budget aktualisieren
- `DELETE /api/budgets/:id` - Budget löschen

#### Health

- `GET /api/health` - Health Check

## 📜 Verfügbare Scripts

### Root-Level

```bash
# Entwicklung
pnpm dev              # Alle Services starten
pnpm dev:web          # Nur Frontend
pnpm dev:api          # Nur Backend

# Build
pnpm build            # Alle Projekte bauen
pnpm build:web        # Nur Frontend
pnpm build:api        # Nur Backend

# Tests
pnpm test             # Tests in allen Projekten
pnpm lint             # Linting in allen Projekten
pnpm format           # Code formatieren

# Datenbank
pnpm db:up            # Docker DB starten
pnpm db:down          # Docker DB stoppen
pnpm db:logs          # DB Logs anzeigen
pnpm db:studio        # Prisma Studio öffnen
pnpm gen:prisma       # Prisma Client generieren

# Setup
pnpm setup            # Projekt einrichten
```

### Backend-Spezifisch

```bash
cd apps/backend

pnpm start:dev        # Development Server
pnpm start:prod       # Production Server
pnpm build            # Build für Produktion

# Prisma
pnpm prisma:generate  # Client generieren
pnpm prisma:migrate   # Migration erstellen
pnpm prisma:studio    # Studio öffnen
pnpm db:seed          # Seed-Daten einfügen
pnpm db:reset         # Datenbank zurücksetzen

# Database Umgebung wechseln
pnpm env:local        # Zu lokaler DB wechseln
pnpm env:neon         # Zu Neon DB wechseln
pnpm env:status       # Aktuelle DB anzeigen
```

### Frontend-Spezifisch

```bash
cd apps/frontend

pnpm dev              # Development Server
pnpm build            # Build für Produktion
pnpm build:prod       # Optimized Production Build
pnpm test             # Unit Tests
pnpm preview          # Build Preview
```

## 🔐 Umgebungsvariablen

### Backend (`apps/backend/.env`)

```env
# Node Environment
NODE_ENV=development

# Server
PORT_API=3001

# Database (Local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/budget-tracker
DIRECT_DATABASE_URL=postgresql://postgres:postgres@localhost:5434/budget-tracker

# Database (Neon - Optional)
# DATABASE_URL=postgresql://user:password@endpoint.neon.tech/budget-tracker?sslmode=require
# DIRECT_DATABASE_URL=postgresql://user:password@endpoint.neon.tech/budget-tracker?sslmode=require

# CORS
CORS_ORIGIN=http://localhost:4201

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (`apps/frontend/src/environments`)

Die Umgebungsvariablen werden in TypeScript-Konfigurationsdateien verwaltet:

- `environment.ts` - Development
- `environment.prod.ts` - Production

## 🐳 Docker

### Docker Compose Services

```yaml
services:
  db: # PostgreSQL 16
  backend: # NestJS API
  frontend: # Angular App mit nginx
```

### Docker Commands

```bash
# Alle Services starten
docker compose up -d

# Logs verfolgen
docker compose logs -f

# Spezifische Service-Logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Services neu bauen
docker compose up -d --build

# Services stoppen
docker compose down

# Services stoppen und Volumes löschen
docker compose down -v
```

### Health Checks

Alle Services haben Health Checks konfiguriert:

- **Database**: Port-Erreichbarkeit
- **Backend**: HTTP-Endpoint `/api/health`
- **Frontend**: HTTP-Anfrage an nginx

## 🧪 Testing

```bash
# Alle Tests ausführen
pnpm test

# Backend Tests
cd apps/backend
pnpm test              # Unit Tests
pnpm test:watch        # Watch Mode
pnpm test:cov          # Mit Coverage
pnpm test:e2e          # E2E Tests

# Frontend Tests
cd apps/frontend
pnpm test              # Unit Tests
```

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'feat: add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

**Commit-Konvention**: Dieses Projekt nutzt [Conventional Commits](https://www.conventionalcommits.org/).

Beispiele:

- `feat: add user authentication`
- `fix: resolve database connection issue`
- `docs: update README`
- `style: format code`
- `refactor: restructure auth module`
- `test: add unit tests for transactions`

## 🐛 Troubleshooting

### Port bereits in Verwendung

Wenn Port 3001 oder 4201 bereits verwendet wird:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Prisma Client Fehler

```bash
# Prisma Client neu generieren
pnpm gen:prisma

# Oder
cd apps/backend
pnpm prisma:generate
```

### Datenbank-Verbindungsprobleme

```bash
# Prüfen, ob Docker DB läuft
docker ps

# DB Logs prüfen
pnpm db:logs

# DB neu starten
pnpm db:down
pnpm db:up
```

### Migration Fehler

```bash
# Migrationen zurücksetzen (⚠️ Löscht alle Daten!)
cd apps/backend
pnpm db:reset
```

## 📈 Roadmap

- [ ] Dark Mode
- [ ] Multi-Currency Support
- [ ] Recurring Transactions
- [ ] Data Export (CSV, PDF)
- [ ] Mobile App (React Native/Flutter)
- [ ] Investment Tracking
- [ ] Financial Goals
- [ ] Reports & Analytics
- [ ] Email Notifications
- [ ] Two-Factor Authentication

## 📄 Lizenz

Dieses Projekt ist unter der [MIT License](LICENSE) lizenziert.

## 👤 Autor

**Adem Dokur**

- GitHub: [@Ademdkr](https://github.com/Ademdkr)

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Ein fantastisches Backend-Framework
- [Angular](https://angular.io/) - Leistungsstarkes Frontend-Framework
- [Prisma](https://www.prisma.io/) - Modernes ORM
- [Angular Material](https://material.angular.io/) - Material Design Components
- [Chart.js](https://www.chartjs.org/) - Flexible Charting Library

---

<div align="center">
  <p>Entwickelt mit ❤️ von Adem Dokur</p>
  <p>⭐ Gib diesem Projekt einen Stern, wenn es dir gefällt!</p>
</div>
