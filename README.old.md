# Budget Tracker (Angular + NestJS)# Budget Tracker (Angular + NestJS)

[![CI](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml)[![CI](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Ademdkr/budget-tracker/actions/workflows/ci.yml)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Built with PNPM](https://img.shields.io/badge/built%20with-pnpm-orange)](https://pnpm.io)[![Built with PNPM](https://img.shields.io/badge/built%20with-pnpm-orange)](https://pnpm.io)

Eine umfassende **Budget-Tracking-Anwendung** mit Angular 18 (Frontend), NestJS 10 (Backend), Cloudflare Workers und PostgreSQL. Eine umfassende **Budget-Tracking-Anwendung** mit Angular 18 (Frontend), NestJS 10 (Backend), Cloudflare Workers und PostgreSQL.

Verwalten Sie Ihre Einnahmen und Ausgaben, kategorisieren Sie Transaktionen und behalten Sie den Überblick über Ihre Finanzen.Verwalten Sie Ihre Einnahmen und Ausgaben, kategorisieren Sie Transaktionen und behalten Sie den Überblick über Ihre Finanzen.

## 💰 Features## 💰 Features

- **💸 Transaktions-Management**: Erstellen, bearbeiten und kategorisieren Sie Ihre Einnahmen und Ausgaben- **💸 Transaktions-Management**: Erstellen, bearbeiten und kategorisieren Sie Ihre Einnahmen und Ausgaben

- **📊 Dashboard**: Übersichtliche Darstellung Ihrer Finanzen mit Charts und Statistiken- **📊 Dashboard**: Übersichtliche Darstellung Ihrer Finanzen mit Charts und Statistiken

- **🏷️ Kategorien**: Individuelle Kategorisierung für bessere Übersicht- **🏷️ Kategorien**: Individuelle Kategorisierung für bessere Übersicht

- **🏦 Konten**: Verwalten Sie mehrere Bankkonten und Zahlungsmethoden- **🏦 Konten**: Verwalten Sie mehrere Bankkonten und Zahlungsmethoden

- **💼 Budget-Planung**: Setzen Sie Budgets und verfolgen Sie Ihre Ausgaben- **💼 Budget-Planung**: Setzen Sie Budgets und verfolgen Sie Ihre Ausgaben

- **📁 Daten-Import**: Importieren Sie Transaktionen aus CSV-Dateien- **📁 Daten-Import**: Importieren Sie Transaktionen aus CSV-Dateien

## 🏗️ Architektur---

- 🧩 **Monorepo-Struktur** mit pnpm Workspaces## 🏗️ Architektur
  - `apps/frontend` - Angular 18 Frontend mit Material Design

  - `apps/backend` - NestJS 10 REST API mit Prisma ORM- 🧩 **Monorepo-Struktur** mit pnpm Workspaces

  - `apps/worker` - Cloudflare Worker für Edge-Funktionen - `apps/frontend` - Angular 18 Frontend mit Material Design

  - `apps/backend` - NestJS 10 REST API mit Prisma ORM

### 🎯 Frontend (Angular 18) - `apps/worker` - Cloudflare Worker für Edge-Funktionen

- 🔄 **Hot Reload** für Frontend & Backend gleichzeitig

- ⚡ **Standalone Components** - Moderne Angular-Architektur- � **Proxy-Konfiguration** - `/api` Requests werden automatisch ans Backend weitergeleitet

- 🎨 **Angular Material** - Konsistentes Design System

- 📱 **Responsive Design** - Funktioniert auf allen Geräten### 🛠️ Developer Experience

- 📈 **Chart.js Integration** - Interaktive Finanz-Charts

- 🔐 **Authentication** - Sichere Benutzeranmeldung- ⚙️ **Automatisches Setup-Script** - Ersetzt alle Platzhalter mit einem Befehl

- 🌐 **PWA Ready** - Progressive Web App Funktionalität- 📝 **TypeScript überall** - Type-Safety im gesamten Stack

- 🎨 **ESLint & Prettier** vorkonfiguriert

### 🚀 Backend (NestJS 10)- 🪝 **Git Hooks** mit Husky & lint-staged

- � **Conventional Commits** mit Commitlint

- 🏛️ **REST API** - Vollständige CRUD-Operationen- 🧪 **Testing** - Jest (Backend) + Karma/Jasmine (Frontend)

- 🗄️ **Prisma ORM** - Type-safe Datenbankzugriff

- 🔒 **Validation** - Request/Response Validierung### 🚀 CI/CD & Deployment

- 🐳 **Docker Support** - Containerisierte Entwicklung

- 📊 **PostgreSQL** - Robuste relationale Datenbank- ✅ **GitHub Actions CI** - Automatisches Linting, Testing & Building

- 🔍 **API Documentation** - Swagger/OpenAPI Integration- 🌐 **Multi-Platform Deployment**:
  - **Frontend** → Cloudflare Pages (automatisch)

## 🚀 Quick Start - **Worker** → Cloudflare Workers (automatisch)

- **Backend** → Railway / Render / Fly.io (konfigurierbar)

### Voraussetzungen - **Datenbank** → Neon PostgreSQL (serverless)

- � **Secrets Management** über GitHub Secrets

- **Node.js** >= 18

- **pnpm** >= 8 (empfohlen) oder npm### 🗄️ Datenbank & API

- **Docker** & **Docker Compose** (für lokale Datenbank)

- 📊 **Prisma ORM** mit Type-Safety

### Installation- 🐘 **PostgreSQL** (Docker Compose für lokale Entwicklung)

- 🌊 **Neon Serverless** Adapter für Cloudflare Workers

```bash- 📘 **Swagger/OpenAPI** Dokumentation unter `/api/docs`

# Repository klonen- 💚 **Health Checks** mit Datenbank-Status

git clone https://github.com/Ademdkr/budget-tracker.git

cd budget-tracker---

# Dependencies installieren## 📦 Tech-Stack

pnpm install

| Bereich | Technologie |

# Datenbank starten (PostgreSQL mit Docker)| ------------ | -------------------------------------- |

pnpm run db:up| **Frontend** | Angular 18, TypeScript 5, SCSS |

| **Backend** | NestJS 10, Prisma 6, PostgreSQL |

# Entwicklungsserver starten (Frontend + Backend)| **Worker** | Cloudflare Workers, Hono, Neon Adapter |

pnpm run dev| **DevOps** | Docker Compose, GitHub Actions |

````| **Tooling**  | pnpm, ESLint, Prettier, Husky          |

| **Testing**  | Jest, Karma, Jasmine                   |

### Verfügbare Scripts

---

```bash

# Entwicklung## 🚀 Schnellstart

pnpm run dev          # Frontend (4201) + Backend (3001)

pnpm run dev:web      # Nur Frontend### Als Template verwenden

pnpm run dev:api      # Nur Backend

1. **Klicke auf "Use this template"** → "Create a new repository"

# Build2. **Clone dein neues Repository**

pnpm run build        # Alles bauen

pnpm run build:web    # Frontend bauen   ```bash

pnpm run build:api    # Backend bauen   git clone https://github.com/dein-username/dein-projekt.git

   cd dein-projekt

# Datenbank   ```

pnpm run db:up        # PostgreSQL starten

pnpm run db:down      # PostgreSQL stoppen3. **Führe das Setup-Script aus**

pnpm run db:studio    # Prisma Studio öffnen

   ```bash

# Tests & Qualität   pnpm install

pnpm run test         # Alle Tests   pnpm setup -- --name="Mein Projekt" --slug="mein-projekt" --user="dein-username"

pnpm run lint         # Code-Qualität prüfen   ```

pnpm run format       # Code formatieren

```4. **Starte die Datenbank**



## 🌐 URLs   ```bash

   pnpm db:up

Nach dem Start sind folgende Services verfügbar:   ```



- **Frontend**: http://localhost:4201

5. **Backend Setup**

- **Backend API**: http://localhost:3001/api

- **API Dokumentation**: http://localhost:3001/api/docs   ```bash

- **Prisma Studio**: http://localhost:5555   cd apps/backend

   cp .env.example .env

## 📁 Projektstruktur   # Bearbeite .env falls nötig

   pnpm prisma:migrate

```   pnpm prisma:generate

budget-tracker/   pnpm prisma:seed

├── apps/   cd ../..

│   ├── frontend/          # Angular 18 Frontend   ```

│   │   ├── src/app/

│   │   │   ├── auth/          # Authentifizierung6. **Entwicklung starten**

│   │   │   ├── dashboard/     # Dashboard-Komponente

│   │   │   ├── transactions/  # Transaktions-Management   ```bash

│   │   │   ├── categories/    # Kategorie-Management   pnpm dev

│   │   │   ├── budgets/       # Budget-Planung   ```

│   │   │   ├── accounts/      # Konto-Management

│   │   │   └── import/        # Daten-Import

│   │   └── ...

│   ├── backend/           # NestJS 10 Backend

│   │   ├── src/

│   │   │   ├── transactions/  # Transaktions-API

│   │   │   ├── categories/    # Kategorien-API

│   │   │   ├── budgets/       # Budget-API### Detaillierte Anleitung

│   │   │   └── accounts/      # Konten-API

│   │   └── prisma/            # Datenbankschema & Migrationen📖 Für eine ausführliche Anleitung siehe:

│   └── worker/            # Cloudflare Worker

├── docs/                  # Dokumentation- **[TEMPLATE_USAGE.md](./TEMPLATE_USAGE.md)** - Komplette Template-Verwendung

├── tools/                 # Build-Tools & Scripts- **[docs/SETUP.md](./docs/SETUP.md)** - Lokales Setup & Troubleshooting

└── package.json          # Monorepo-Konfiguration- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution Guidelines

````

---

## 🧪 Testing

## 📜 Verfügbare Scripts

````bash

# Alle Tests ausführen### Root Scripts

pnpm run test

```bash

# Frontend Tests# Entwicklung

pnpm --filter @budget-tracker/frontend testpnpm dev          # Frontend + Backend gleichzeitig

pnpm dev:web      # Nur Frontend

# Backend Tests  pnpm dev:api      # Nur Backend

pnpm --filter @budget-tracker/backend test

# Build

# E2E Testspnpm build        # Alle Apps bauen

pnpm --filter @budget-tracker/backend test:e2epnpm build:web    # Nur Frontend

```pnpm build:api    # Nur Backend



## 🚀 Deployment# Testing & Qualität

pnpm test         # Alle Tests

### Frontend (Vercel/Netlify)pnpm lint         # Alle Apps linten

pnpm format       # Code formatieren

```bash

# Production Build# Datenbank (Docker)

pnpm run build:webpnpm db:up        # PostgreSQL starten

pnpm db:down      # PostgreSQL stoppen

# Build-Ordner: apps/frontend/dist/apps/frontendpnpm db:logs      # Logs anzeigen

```pnpm db:studio    # Prisma Studio öffnen



### Backend (Railway/Render)# Prisma

pnpm gen:prisma   # Prisma Clients generieren

```bash

# Production Build# Setup

pnpm run build:apipnpm setup        # Template konfigurieren

````

# Environment Variablen setzen:

# - DATABASE_URL---

# - PORT_API (optional, default: 3001)

# - CORS_ORIGIN## 🚢 Deployment

````

### Voraussetzungen

### Datenbank

1. **GitHub Secrets konfigurieren** (Settings → Secrets and variables → Actions):

Das Projekt unterstützt verschiedene PostgreSQL-Anbieter:

- **Neon** (empfohlen für Hobby-Projekte)   ```

- **Supabase**    CLOUDFLARE_API_TOKEN    # Für Frontend & Worker Deployment

- **Railway**   CLOUDFLARE_ACCOUNT_ID   # Cloudflare Account ID

- **Render**   DATABASE_URL            # PostgreSQL Connection (Neon empfohlen)

   DIRECT_DATABASE_URL     # Für Prisma Migrationen

## 🤝 Contributing   ```



1. Fork das Repository2. **Deployment-Plattformen**:

2. Erstelle einen Feature-Branch (`git checkout -b feature/amazing-feature`)   - ✅ **Cloudflare Pages** (Frontend) - Automatisch

3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)   - ✅ **Cloudflare Workers** (Worker) - Automatisch

4. Push zum Branch (`git push origin feature/amazing-feature`)   - ✅ **Neon** (Datenbank) - Kostenloser Serverless PostgreSQL

5. Öffne eine Pull Request   - 🔧 **Railway / Render / Fly.io** (Backend) - Konfiguration siehe [TEMPLATE_USAGE.md](./TEMPLATE_USAGE.md)



## 📜 License### Automatisches Deployment



Dieses Projekt ist unter der [MIT License](LICENSE) lizenziert.Push zu `main` triggert automatisch:



## 🙋‍♂️ Support```bash

git push origin main

- 🐛 [Issue Tracker](https://github.com/Ademdkr/budget-tracker/issues)```

- 💬 [Discussions](https://github.com/Ademdkr/budget-tracker/discussions)

Oder manuell über GitHub Actions → Deploy → Run workflow

---

### Backend Deployment Optionen

**Entwickelt mit ❤️ von [Adem Dokur](https://github.com/Ademdkr)**
Da NestJS nicht nativ auf Cloudflare Workers läuft, empfehlen wir:

**Empfohlen:**

- **[Railway](https://railway.app)** - Einfachste Option, generous free tier
- **[Render](https://render.com)** - Free tier verfügbar
- **[Fly.io](https://fly.io)** - Gute Performance, günstig

Siehe [TEMPLATE_USAGE.md](./TEMPLATE_USAGE.md#backend-auf-railway-deployen) für Details.

---

## 📁 Projekt-Struktur

````

fullstack-template/
├── apps/
│ ├── frontend/ # Angular 18 App
│ │ ├── src/
│ │ │ ├── app/ # Components, Services, Routes
│ │ │ └── environments/
│ │ ├── proxy.conf.json
│ │ └── package.json
│ ├── backend/ # NestJS API
│ │ ├── src/
│ │ │ ├── budgets/ # Beispiel-Modul
│ │ │ ├── health/ # Health Check
│ │ │ ├── prisma/ # Prisma Service
│ │ │ └── main.ts
│ │ ├── prisma/
│ │ │ ├── schema.prisma
│ │ │ ├── migrations/
│ │ │ └── seed.ts
│ │ └── package.json
│ └── worker/ # Cloudflare Worker
│ ├── src/
│ │ └── index.ts # Hono API
│ └── wrangler.toml
├── .github/
│ └── workflows/
│ ├── ci.yml # CI Pipeline
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
