# Budget Tracker# Budget Tracker (Angular + NestJS)# Budget Tracker (Angular + NestJS)

[![CI](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml)[![CI](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml)[![CI](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Built with PNPM](https://img.shields.io/badge/built%20with-pnpm-orange)](https://pnpm.io)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Eine moderne Full-Stack Finanzmanagement-Anwendung zur Verwaltung persönlicher Finanzen mit Multi-Account-Support, intelligenten Kategorien und CSV-Import.[![Built with PNPM](https://img.shields.io/badge/built%20with-pnpm-orange)](https://pnpm.io)[![Built with PNPM](https://img.shields.io/badge/built%20with-pnpm-orange)](https://pnpm.io)

**Live Demo**: _(Coming Soon)_ | **[Dokumentation](./docs/)** | **[Changelog](./CHANGELOG.md)**Eine umfassende **Budget-Tracking-Anwendung** mit Angular 18 (Frontend), NestJS 10 (Backend), Cloudflare Workers und PostgreSQL. Eine umfassende **Budget-Tracking-Anwendung** mit Angular 18 (Frontend), NestJS 10 (Backend), Cloudflare Workers und PostgreSQL.

---Verwalten Sie Ihre Einnahmen und Ausgaben, kategorisieren Sie Transaktionen und behalten Sie den Überblick über Ihre Finanzen.Verwalten Sie Ihre Einnahmen und Ausgaben, kategorisieren Sie Transaktionen und behalten Sie den Überblick über Ihre Finanzen.

## 📋 Über das Projekt## 💰 Features## 💰 Features

Budget Tracker ist eine professionelle Finanzmanagement-Lösung, die Ihnen hilft:- **💸 Transaktions-Management**: Erstellen, bearbeiten und kategorisieren Sie Ihre Einnahmen und Ausgaben- **💸 Transaktions-Management**: Erstellen, bearbeiten und kategorisieren Sie Ihre Einnahmen und Ausgaben

- 💰 Einnahmen und Ausgaben über mehrere Konten zu verwalten

- 📊 Finanzielle Übersicht durch interaktive Dashboards zu erhalten- **📊 Dashboard**: Übersichtliche Darstellung Ihrer Finanzen mit Charts und Statistiken- **📊 Dashboard**: Übersichtliche Darstellung Ihrer Finanzen mit Charts und Statistiken

- 🎯 Budgets zu planen und Ausgaben zu kontrollieren

- 📁 Transaktionen per CSV-Import effizient zu erfassen- **🏷️ Kategorien**: Individuelle Kategorisierung für bessere Übersicht- **🏷️ Kategorien**: Individuelle Kategorisierung für bessere Übersicht

- 🏷️ Ausgaben intelligent zu kategorisieren

- **🏦 Konten**: Verwalten Sie mehrere Bankkonten und Zahlungsmethoden- **🏦 Konten**: Verwalten Sie mehrere Bankkonten und Zahlungsmethoden

**Gebaut als Full-Stack Portfolio-Projekt mit modernen Technologien und Best Practices.**

- **💼 Budget-Planung**: Setzen Sie Budgets und verfolgen Sie Ihre Ausgaben- **💼 Budget-Planung**: Setzen Sie Budgets und verfolgen Sie Ihre Ausgaben

---

- **📁 Daten-Import**: Importieren Sie Transaktionen aus CSV-Dateien- **📁 Daten-Import**: Importieren Sie Transaktionen aus CSV-Dateien

## ✨ Hauptfunktionen

## 🏗️ Architektur---

### 🏦 Multi-Account-Management

- Verwalten Sie verschiedene Konten (Girokonto, Sparkonto, Kreditkarte, etc.)- 🧩 **Monorepo-Struktur** mit pnpm Workspaces## 🏗️ Architektur

- Account-spezifische Kategorien und Transaktionen - `apps/frontend` - Angular 18 Frontend mit Material Design

- Kontoübergreifende Übersicht und Filterung
  - `apps/backend` - NestJS 10 REST API mit Prisma ORM- 🧩 **Monorepo-Struktur** mit pnpm Workspaces

### 💸 Intelligentes Transaktions-Management

- Schnelles Erfassen von Einnahmen und Ausgaben - `apps/worker` - Cloudflare Worker für Edge-Funktionen - `apps/frontend` - Angular 18 Frontend mit Material Design

- Kategorisierung mit benutzerdefinierten Kategorien

- Such- und Filterfunktionen - `apps/backend` - NestJS 10 REST API mit Prisma ORM

- Bulk-Import via CSV mit automatischer Kategorie-Zuordnung

### 🎯 Frontend (Angular 18) - `apps/worker` - Cloudflare Worker für Edge-Funktionen

### 📊 Dashboard & Visualisierung

- Monatliche Übersicht mit KPIs (Einnahmen, Ausgaben, Bilanz, Sparquote)- 🔄 **Hot Reload** für Frontend & Backend gleichzeitig

- Interaktive Charts (Ausgaben nach Kategorie, Top-Ausgaben)

- Budget-Fortschritt mit visueller Darstellung- ⚡ **Standalone Components** - Moderne Angular-Architektur- � **Proxy-Konfiguration** - `/api` Requests werden automatisch ans Backend weitergeleitet

- Aktuelle Transaktionsübersicht

- 🎨 **Angular Material** - Konsistentes Design System

### 🎯 Budget-Planung

- Monatliche Budgets pro Kategorie- 📱 **Responsive Design** - Funktioniert auf allen Geräten### 🛠️ Developer Experience

- Echtzeit-Tracking des Verbrauchs

- Visuelle Warnung bei Budgetüberschreitung- 📈 **Chart.js Integration** - Interaktive Finanz-Charts

- Historische Budget-Analyse

- 🔐 **Authentication** - Sichere Benutzeranmeldung- ⚙️ **Automatisches Setup-Script** - Ersetzt alle Platzhalter mit einem Befehl

### 📁 CSV-Import

- Import von Banktransaktionen aus CSV-Dateien- 🌐 **PWA Ready** - Progressive Web App Funktionalität- 📝 **TypeScript überall** - Type-Safety im gesamten Stack

- Flexible Spaltenzuordnung (Datum, Betrag, Notiz)

- Unterstützung verschiedener Datums- und Zahlenformate- 🎨 **ESLint & Prettier** vorkonfiguriert

- Automatische Kategorisierung (Unbekannte Einnahmen/Ausgaben)

- Detaillierte Fehlerberichterstattung### 🚀 Backend (NestJS 10)- 🪝 **Git Hooks** mit Husky & lint-staged

### 🔐 Sicherheit- � **Conventional Commits** mit Commitlint

- JWT-basierte Authentifizierung

- Sichere Password-Speicherung mit bcrypt- 🏛️ **REST API** - Vollständige CRUD-Operationen- 🧪 **Testing** - Jest (Backend) + Karma/Jasmine (Frontend)

- User-spezifische Datenisolierung

- CORS-Schutz- 🗄️ **Prisma ORM** - Type-safe Datenbankzugriff

---- 🔒 **Validation** - Request/Response Validierung### 🚀 CI/CD & Deployment

## 🛠️ Tech Stack- 🐳 **Docker Support** - Containerisierte Entwicklung

### Frontend- 📊 **PostgreSQL** - Robuste relationale Datenbank- ✅ **GitHub Actions CI** - Automatisches Linting, Testing & Building

- **Framework**: Angular 18 (Standalone Components)

- **UI**: Angular Material Design- 🔍 **API Documentation** - Swagger/OpenAPI Integration- 🌐 **Multi-Platform Deployment**:

- **Charts**: Chart.js mit ng2-charts - **Frontend** → Cloudflare Pages (automatisch)

- **State Management**: RxJS & Service-basiert

- **Forms**: Reactive Forms mit Validation## 🚀 Quick Start - **Worker** → Cloudflare Workers (automatisch)

- **Styling**: SCSS mit Material Theme

- **Backend** → Railway / Render / Fly.io (konfigurierbar)

### Backend

- **Framework**: NestJS 10### Voraussetzungen - **Datenbank** → Neon PostgreSQL (serverless)

- **ORM**: Prisma 6

- **Datenbank**: PostgreSQL- � **Secrets Management** über GitHub Secrets

- **Auth**: Passport.js mit JWT

- **Validation**: class-validator- **Node.js** >= 18

- **API Docs**: Swagger/OpenAPI

- **pnpm** >= 8 (empfohlen) oder npm### 🗄️ Datenbank & API

### DevOps & Tooling

- **Package Manager**: pnpm Workspaces (Monorepo)- **Docker** & **Docker Compose** (für lokale Datenbank)

- **Containerization**: Docker & Docker Compose

- **CI/CD**: GitHub Actions- 📊 **Prisma ORM** mit Type-Safety

- **Code Quality**: ESLint, Prettier

- **Git Hooks**: Husky, Commitlint### Installation- 🐘 **PostgreSQL** (Docker Compose für lokale Entwicklung)

- **Testing**: Jest (Backend), Karma/Jasmine (Frontend)

- 🌊 **Neon Serverless** Adapter für Cloudflare Workers

---

```bash- 📘 **Swagger/OpenAPI** Dokumentation unter `/api/docs`

## 🏗️ Architektur

# Repository klonen- 💚 **Health Checks** mit Datenbank-Status

`````plaintext

budget-tracker/git clone https://github.com/Ademdkr/budget-tracker.git

├── apps/

│   ├── frontend/           # Angular 18 SPAcd budget-tracker---

│   │   ├── src/app/

│   │   │   ├── auth/       # Authentifizierung# Dependencies installieren## 📦 Tech-Stack

│   │   │   ├── dashboard/  # Dashboard mit Charts

│   │   │   ├── transactions/ # Transaktionsverwaltungpnpm install

│   │   │   ├── categories/ # Kategorien-Management

│   │   │   ├── budgets/    # Budget-Planung| Bereich | Technologie |

│   │   │   ├── accounts/   # Konto-Management

│   │   │   ├── import/     # CSV-Import# Datenbank starten (PostgreSQL mit Docker)| ------------ | -------------------------------------- |

│   │   │   └── shared/     # Wiederverwendbare Komponenten

│   │   └── proxy.conf.jsonpnpm run db:up| **Frontend** | Angular 18, TypeScript 5, SCSS |

│   │

│   └── backend/            # NestJS REST API| **Backend** | NestJS 10, Prisma 6, PostgreSQL |

│       ├── src/

│       │   ├── auth/       # JWT Authentication# Entwicklungsserver starten (Frontend + Backend)| **Worker** | Cloudflare Workers, Hono, Neon Adapter |

│       │   ├── users/      # User Management

│       │   ├── accounts/   # Account CRUDpnpm run dev| **DevOps** | Docker Compose, GitHub Actions |

│       │   ├── transactions/ # Transaction CRUD & Import

│       │   ├── categories/ # Category CRUD````| **Tooling**  | pnpm, ESLint, Prettier, Husky          |

│       │   ├── budgets/    # Budget CRUD & Tracking

│       │   └── prisma/     # Prisma Service| **Testing**  | Jest, Karma, Jasmine                   |

│       └── prisma/

│           ├── schema.prisma  # Datenbankschema### Verfügbare Scripts

│           ├── migrations/    # DB Migrationen

│           └── seed.ts        # Seed-Daten---

│

├── docs/                   # Dokumentation```bash

├── .github/workflows/      # CI/CD Pipelines

└── docker-compose.yml      # PostgreSQL Container# Entwicklung## 🚀 Schnellstart

`````

pnpm run dev # Frontend (4201) + Backend (3001)

### Datenbank-Schema

pnpm run dev:web # Nur Frontend### Als Template verwenden

**Hauptentitäten:**

- `User` - Benutzer mit Authentifizierungpnpm run dev:api # Nur Backend

- `Account` - Bankkonten (1:n zu User)

- `Category` - Kategorien (1:n zu Account, spezifisch für Einnahmen/Ausgaben)1. **Klicke auf "Use this template"** → "Create a new repository"

- `Transaction` - Transaktionen (n:1 zu Account, n:1 zu Category)

- `Budget` - Budgets (n:1 zu Category, monatlich)# Build2. **Clone dein neues Repository**

**Beziehungen:**pnpm run build # Alles bauen

- User hat mehrere Accounts

- Account hat mehrere Categories und Transactionspnpm run build:web # Frontend bauen ```bash

- Category gehört zu einem Account und hat einen Type (INCOME/EXPENSE)

- Transaction gehört zu einem Account und einer Categorypnpm run build:api # Backend bauen git clone https://github.com/dein-username/dein-projekt.git

- Budget gehört zu einer Category und trackt monatliche Ausgaben

  cd dein-projekt

---

# Datenbank ```

## 🚀 Quick Start

pnpm run db:up # PostgreSQL starten

### Voraussetzungen

- **Node.js** >= 18pnpm run db:down # PostgreSQL stoppen3. **Führe das Setup-Script aus**

- **pnpm** >= 8 (empfohlen) oder npm

- **Docker** & **Docker Compose** (für PostgreSQL)pnpm run db:studio # Prisma Studio öffnen

### Installation ```bash

````bash# Tests & Qualität   pnpm install

# Repository klonen

git clone https://github.com/Ademdkr/budget-tracker.gitpnpm run test         # Alle Tests   pnpm setup -- --name="Mein Projekt" --slug="mein-projekt" --user="dein-username"

cd budget-tracker

pnpm run lint         # Code-Qualität prüfen   ```

# Dependencies installieren

pnpm installpnpm run format       # Code formatieren



# Datenbank starten (PostgreSQL in Docker)```4. **Starte die Datenbank**

pnpm db:up



# Backend konfigurieren

cd apps/backend## 🌐 URLs   ```bash

cp .env.example .env

# Bearbeite .env falls nötig (Standard-Werte funktionieren für lokale Entwicklung)   pnpm db:up



# Datenbank migrieren und mit Test-Daten füllenNach dem Start sind folgende Services verfügbar:   ```

pnpm prisma:migrate

pnpm prisma:generate

pnpm prisma:seed

cd ../..- **Frontend**: http://localhost:4201



# Entwicklungsserver starten (Frontend + Backend)5. **Backend Setup**

pnpm dev

```- **Backend API**: http://localhost:3001/api



### URLs nach dem Start- **API Dokumentation**: http://localhost:3001/api/docs   ```bash



- **Frontend**: http://localhost:4201- **Prisma Studio**: http://localhost:5555   cd apps/backend

- **Backend API**: http://localhost:3001/api

- **API Dokumentation**: http://localhost:3001/api/docs   cp .env.example .env

- **Prisma Studio**: http://localhost:5555 (mit `pnpm db:studio`)

## 📁 Projektstruktur   # Bearbeite .env falls nötig

### Test-Login

   pnpm prisma:migrate

Nach dem Seeding sind folgende Test-User verfügbar:

```   pnpm prisma:generate

````

Email: alice.wonder@example.combudget-tracker/ pnpm prisma:seed

Password: password123

├── apps/ cd ../..

Email: bob.builder@example.com

Password: password123│ ├── frontend/ # Angular 18 Frontend ```

Email: charlie.brown@example.com│ │ ├── src/app/

Password: password123

````│ │   │   ├── auth/          # Authentifizierung6. **Entwicklung starten**



---│   │   │   ├── dashboard/     # Dashboard-Komponente



## 📦 Verfügbare Scripts│   │   │   ├── transactions/  # Transaktions-Management   ```bash



### Development│   │   │   ├── categories/    # Kategorie-Management   pnpm dev



```bash│   │   │   ├── budgets/       # Budget-Planung   ```

pnpm dev          # Frontend (4201) + Backend (3001) parallel

pnpm dev:web      # Nur Frontend│   │   │   ├── accounts/      # Konto-Management

pnpm dev:api      # Nur Backend

```│   │   │   └── import/        # Daten-Import



### Build│   │   └── ...



```bash│   ├── backend/           # NestJS 10 Backend

pnpm build        # Alle Apps bauen

pnpm build:web    # Nur Frontend│   │   ├── src/

pnpm build:api    # Nur Backend

```│   │   │   ├── transactions/  # Transaktions-API



### Datenbank│   │   │   ├── categories/    # Kategorien-API



```bash│   │   │   ├── budgets/       # Budget-API### Detaillierte Anleitung

pnpm db:up        # PostgreSQL starten

pnpm db:down      # PostgreSQL stoppen│   │   │   └── accounts/      # Konten-API

pnpm db:studio    # Prisma Studio öffnen

pnpm gen:prisma   # Prisma Clients generieren│   │   └── prisma/            # Datenbankschema & Migrationen📖 Für eine ausführliche Anleitung siehe:

```

### 🐳 Docker (Production-like)

Das gesamte Projekt kann mit Docker Compose gestartet werden - ohne IDE oder lokale Node.js-Installation:

```bash
# Komplettes Setup mit einem Befehl starten
docker compose up -d --build

# Services sind verfügbar unter:
# - Frontend: http://localhost:4201
# - Backend API: http://localhost:3001/api
# - API Docs: http://localhost:3001/api/docs
# - PostgreSQL: localhost:5434

# Status anzeigen
docker compose ps

# Logs anzeigen
docker compose logs -f             # Alle Services
docker compose logs -f backend     # Nur Backend
docker compose logs -f frontend    # Nur Frontend

# Services neustarten
docker compose restart backend
docker compose restart frontend

# Alles stoppen und entfernen
docker compose down

# Mit Rebuild (nach Code-Änderungen)
docker compose up -d --build

# Volumes auch löschen (⚠️ Datenbank wird gelöscht!)
docker compose down -v
```

#### Test-Benutzer

Die Datenbank wird beim ersten Start automatisch mit Testdaten gefüllt:

| Email | Passwort | Konten |
|-------|----------|--------|
| `example@example.com` | `password` | Bausparkonto, Deutsche Bank |
| `example2@example.com` | `password` | Klarna, Aktienkonto |
| `example3@example.com` | `password` | Bargeld-Bunker, Sonstiges |

Jeder Benutzer hat vordefinierte Kategorien, Budgets und Transaktionen zum Testen.

**✨ Features:**
- ✅ Multi-stage Dockerfiles für optimierte Images
- ✅ Nginx als Production-Server für Angular
- ✅ Automatische Prisma Migrationen und Seeding beim Start
- ✅ Health Checks für alle Services
- ✅ Isoliertes Netzwerk zwischen Services
- ✅ Persistente Datenbank mit Docker Volumes
- ✅ Keine lokale Node.js-Installation notwendig
`

│ └── worker/ # Cloudflare Worker

### Testing & Qualität

├── docs/ # Dokumentation- **[TEMPLATE_USAGE.md](./TEMPLATE_USAGE.md)** - Komplette Template-Verwendung

```bash

pnpm test         # Alle Tests├── tools/                 # Build-Tools & Scripts- **[docs/SETUP.md](./docs/SETUP.md)** - Lokales Setup & Troubleshooting

pnpm lint         # Alle Apps linten

pnpm format       # Code formatieren└── package.json          # Monorepo-Konfiguration- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution Guidelines

```

````

---

---

## 🔧 Konfiguration

## 🧪 Testing

### Environment-Variablen

## 📜 Verfügbare Scripts

**Backend (`apps/backend/.env`):**

```````bash

```bash

# Database# Alle Tests ausführen### Root Scripts

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/budget_tracker

DIRECT_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/budget_trackerpnpm run test



# API```bash

PORT_API=3001

CORS_ORIGIN=http://localhost:4201# Frontend Tests# Entwicklung



# JWT (für Production ändern!)pnpm --filter @budget-tracker/frontend testpnpm dev          # Frontend + Backend gleichzeitig

JWT_SECRET=your-super-secret-jwt-key

JWT_EXPIRES_IN=15mpnpm dev:web      # Nur Frontend

JWT_REFRESH_SECRET=your-super-secret-refresh-key

JWT_REFRESH_EXPIRES_IN=7d# Backend Tests  pnpm dev:api      # Nur Backend

```

pnpm --filter @budget-tracker/backend test

**Frontend** nutzt Proxy-Konfiguration - keine Environment-Variablen nötig für lokale Entwicklung.

# Build

---

# E2E Testspnpm build        # Alle Apps bauen

## 🎯 Technische Highlights

pnpm --filter @budget-tracker/backend test:e2epnpm build:web    # Nur Frontend

### CSV-Import mit intelligenter Verarbeitung

```pnpm build:api    # Nur Backend

Der Import verarbeitet verschiedene Datums- und Zahlenformate:



```typescript

// Deutsche: 20.11.2024, Englische: 11/20/2024, ISO: 2024-11-20## 🚀 Deployment# Testing & Qualität

parseDate(dateString: string): Date {

  // Verwendet Date.UTC() für konsistente Timezone-Behandlungpnpm test         # Alle Tests

  return new Date(Date.UTC(year, month, day, 12, 0, 0));

}### Frontend (Vercel/Netlify)pnpm lint         # Alle Apps linten



// Deutsche: 1.234,56 | Englische: 1,234.56 | Simple: 1234.56pnpm format       # Code formatieren

parseAmount(amountString: string): number

``````bash



Automatische Kategorie-Erstellung mit Race-Condition-Prevention:# Production Build# Datenbank (Docker)

- "Unbekannte Einnahmen" (grün) für positive Beträge

- "Unbekannte Ausgaben" (rot) für negative Beträgepnpm run build:webpnpm db:up        # PostgreSQL starten



### Dashboard-Optimierungpnpm db:down      # PostgreSQL stoppen



Das Dashboard zeigt aktuelle Finanzübersicht mit:# Build-Ordner: apps/frontend/dist/apps/frontendpnpm db:logs      # Logs anzeigen

- KPI-Karten (Einnahmen, Ausgaben, Bilanz, Sparquote)

- Bar-Chart für Top-10 Ausgabenkategorien (aktueller Monat)```pnpm db:studio    # Prisma Studio öffnen

- Aktuelle Transaktionen mit Kategorie-Badges



### Type-Safe Datenbank-Zugriff

### Backend (Railway/Render)# Prisma

Prisma ORM mit BigInt IDs und vollständiger TypeScript-Integration:

pnpm gen:prisma   # Prisma Clients generieren

```prisma

model Transaction {```bash

  id          BigInt   @id @default(autoincrement())

  date        DateTime# Production Build# Setup

  amount      Decimal  @db.Decimal(10, 2)

  account     Account  @relation(...)pnpm run build:apipnpm setup        # Template konfigurieren

  category    Category @relation(...)

}````

```

# Environment Variablen setzen:

---

# - DATABASE_URL---

## 🧪 Testing

# - PORT_API (optional, default: 3001)

```bash

# Alle Tests# - CORS_ORIGIN## 🚢 Deployment

pnpm test

```````

# Backend Tests

pnpm --filter @budget-tracker/backend test### Voraussetzungen

# Frontend Tests### Datenbank

pnpm --filter @budget-tracker/frontend test

1. **GitHub Secrets konfigurieren** (Settings → Secrets and variables → Actions):

# E2E Tests

pnpm --filter @budget-tracker/backend test:e2eDas Projekt unterstützt verschiedene PostgreSQL-Anbieter:

````

- **Neon** (empfohlen für Hobby-Projekte)   ```

---

- **Supabase**    CLOUDFLARE_API_TOKEN    # Für Frontend & Worker Deployment

## 📚 Dokumentation

- **Railway**   CLOUDFLARE_ACCOUNT_ID   # Cloudflare Account ID

- **[SETUP.md](./docs/SETUP.md)** - Detaillierte Setup-Anleitung

- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deployment-Guide- **Render**   DATABASE_URL            # PostgreSQL Connection (Neon empfohlen)

- **[API Docs](http://localhost:3001/api/docs)** - Swagger/OpenAPI (nach Start)

   DIRECT_DATABASE_URL     # Für Prisma Migrationen

---

## 🤝 Contributing   ```

## 🎯 Projektziele & Learnings



Dieses Projekt wurde entwickelt, um folgende Technologien und Konzepte zu demonstrieren:

1. Fork das Repository2. **Deployment-Plattformen**:

**Frontend:**

- ✅ Moderne Angular-Architektur (Standalone Components, Signals)2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)   - ✅ **Cloudflare Pages** (Frontend) - Automatisch

- ✅ State Management mit Services & RxJS

- ✅ Material Design System Integration3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)   - ✅ **Cloudflare Workers** (Worker) - Automatisch

- ✅ Form Validation & Error Handling

- ✅ Chart-Integration mit Chart.js4. Push zum Branch (`git push origin feature/amazing-feature`)   - ✅ **Neon** (Datenbank) - Kostenloser Serverless PostgreSQL

- ✅ Responsive Design

5. Öffne eine Pull Request   - 🔧 **Railway / Render / Fly.io** (Backend) - Konfiguration siehe [TEMPLATE_USAGE.md](./TEMPLATE_USAGE.md)

**Backend:**

- ✅ REST API Design mit NestJS

- ✅ Prisma ORM mit TypeScript

- ✅ JWT-basierte Authentifizierung## 📜 License### Automatisches Deployment

- ✅ Request/Response Validation

- ✅ Error Handling & Logging

- ✅ Database Migrations & Seeding

Dieses Projekt ist unter der [MIT License](LICENSE) lizenziert.Push zu `main` triggert automatisch:

**DevOps:**

- ✅ Monorepo-Setup mit pnpm Workspaces

- ✅ Docker für lokale Entwicklung

- ✅ CI/CD mit GitHub Actions## 🙋‍♂️ Support```bash

- ✅ Code Quality Tools (ESLint, Prettier, Husky)

- ✅ Conventional Commitsgit push origin main



---- 🐛 [Issue Tracker](https://github.com/Ademdkr/budget-tracker/issues)```



## 🔮 Roadmap- 💬 [Discussions](https://github.com/Ademdkr/budget-tracker/discussions)



- [ ] Export-Funktionalität (CSV, PDF Reports)Oder manuell über GitHub Actions → Deploy → Run workflow

- [ ] Recurring Transactions (Wiederkehrende Transaktionen)

- [ ] Mobile App (Flutter/React Native)---

- [ ] Email-Benachrichtigungen bei Budget-Überschreitung

- [ ] Multi-Currency Support### Backend Deployment Optionen

- [ ] Shared Budgets (Mehrere User)

- [ ] Finanzielle Insights & Forecasting**Entwickelt mit ❤️ von [Adem Dokur](https://github.com/Ademdkr)**

Da NestJS nicht nativ auf Cloudflare Workers läuft, empfehlen wir:

---

**Empfohlen:**

## 🤝 Contributing

- **[Railway](https://railway.app)** - Einfachste Option, generous free tier

Beiträge sind willkommen! Bitte lies [CONTRIBUTING.md](./CONTRIBUTING.md) für Details.- **[Render](https://render.com)** - Free tier verfügbar

- **[Fly.io](https://fly.io)** - Gute Performance, günstig

1. Fork das Projekt

2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)Siehe [TEMPLATE_USAGE.md](./TEMPLATE_USAGE.md#backend-auf-railway-deployen) für Details.

3. Committe mit Conventional Commits (`git commit -m 'feat: add amazing feature'`)

4. Push zum Branch (`git push origin feature/amazing-feature`)---

5. Öffne einen Pull Request

## 📁 Projekt-Struktur

---

````

## 📄 License

fullstack-template/

Dieses Projekt ist unter der [MIT License](./LICENSE) lizenziert.├── apps/

│ ├── frontend/ # Angular 18 App

---│ │ ├── src/

│ │ │ ├── app/ # Components, Services, Routes

## 👤 Autor│ │ │ └── environments/

│ │ ├── proxy.conf.json

**Adem Dokur**│ │ └── package.json

│ ├── backend/ # NestJS API

- GitHub: [@Ademdkr](https://github.com/Ademdkr)│ │ ├── src/

- Portfolio: *(Coming Soon)*│ │ │ ├── budgets/ # Beispiel-Modul

- LinkedIn: *(Coming Soon)*│ │ │ ├── health/ # Health Check

│ │ │ ├── prisma/ # Prisma Service

---│ │ │ └── main.ts

│ │ ├── prisma/

## 🙏 Danksagungen│ │ │ ├── schema.prisma

│ │ │ ├── migrations/

- [NestJS](https://nestjs.com/) - Progressive Node.js Framework│ │ │ └── seed.ts

- [Angular](https://angular.io/) - Platform for building web applications│ │ └── package.json

- [Prisma](https://www.prisma.io/) - Next-generation ORM│ └── worker/ # Cloudflare Worker

- [Chart.js](https://www.chartjs.org/) - Simple yet flexible JavaScript charting│ ├── src/

- [Angular Material](https://material.angular.io/) - Material Design components│ │ └── index.ts # Hono API

│ └── wrangler.toml

---├── .github/

│ └── workflows/

**Entwickelt mit ❤️ als Full-Stack Portfolio-Projekt**│ ├── ci.yml # CI Pipeline

│ └── deploy.yml # Deployment
├── tools/
│ └── setup.mjs # Setup-Script
├── docs/
│ └── SETUP.md # Setup-Dokumentation
├── docker-compose.yml # Lokale PostgreSQL
├── package.json # Root Package
├── pnpm-workspace.yaml # Workspace Config
├── README.md # Diese Datei
└── TEMPLATE_USAGE.md # Template-Anleitung

````

---

## 🔧 Konfiguration

### Environment-Variablen

**Root `.env`:**

```bash
APP_NAME="Mein Projekt"
APP_SLUG="mein-projekt"
PORT_WEB=4201
PORT_API=3001
````

**Backend `apps/backend/.env`:**

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/mydb
PORT_API=3001
CORS_ORIGIN=http://localhost:4201
```

**Frontend `apps/frontend/.env`:**

```bash
VITE_API_URL=http://localhost:3001
```

---

## 🧪 Testing

```bash
# Alle Tests
pnpm test

# Nur Backend
pnpm --filter @template/backend test

# Nur Frontend (benötigt Chrome/Chromium)
pnpm --filter @template/frontend test
```

**Hinweis:** Frontend-Tests benötigen Chrome. In CI wird Chromium automatisch installiert.

---

## 🤝 Contributing

Beiträge sind willkommen! Bitte lies [CONTRIBUTING.md](./CONTRIBUTING.md) für Guidelines.

1. Fork das Projekt
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'feat: add amazing feature'`)
4. Pushe zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

---

## 📝 License

MIT License - siehe [LICENSE](./LICENSE) für Details.

---

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js Framework
- [Angular](https://angular.io/) - Platform for building web applications
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless Platform
- [Neon](https://neon.tech/) - Serverless PostgreSQL

---

## 📞 Support

- 📖 [Dokumentation](./TEMPLATE_USAGE.md)
- 🐛 [Issue Tracker](https://github.com/Ademdkr/fullstack-template/issues)
- 💬 [Discussions](https://github.com/Ademdkr/fullstack-template/discussions)

---

**Erstellt mit ❤️ für die Developer Community**
