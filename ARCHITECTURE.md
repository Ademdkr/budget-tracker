# 🏗️ Budget Tracker - Architektur

> Technische Architektur-Dokumentation für Entwickler

## 📋 Inhaltsverzeichnis

- [System-Architektur](#-system-architektur)
- [Backend (NestJS)](#-backend-nestjs)
- [Frontend (Angular)](#-frontend-angular)
- [Datenbank (PostgreSQL)](#️-datenbank-postgresql)
- [API & Authentifizierung](#-api--authentifizierung)
- [Sicherheit & Performance](#-sicherheit--performance)

## 🎯 System-Architektur

**Layered Architecture** mit strikter Trennung der Schichten:

```
Angular SPA (4201) → HTTP/REST → NestJS API (3001) → Prisma ORM → PostgreSQL (5434)
```

**Kern-Prinzipien:**

- Type Safety (End-to-End TypeScript)
- API-First Design (RESTful API)
- Modular & Skalierbar (Feature-basierte Module)
- Dependency Injection (IoC Container)

## 🔧 Backend (NestJS)

### 3-Schicht-Architektur

```typescript
// Controller → Service → Repository (Prisma)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.account.findMany();
  }
}
```

### Module-Struktur

Jedes Feature als eigenständiges Modul:

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
```

**Module:** Auth, Accounts, Categories, Transactions, Budgets, Health

## 🎨 Frontend (Angular)

### Component Architecture

**Smart Components** (Container) ← State & Logic  
**Presentational Components** (Dumb) ← Pure UI

```typescript
@NgModule({
  declarations: [AccountsComponent, AccountListComponent, AccountFormComponent],
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  providers: [AccountsApiService],
})
export class AccountsModule {}
```

**Features:**

- Lazy Loading: Route-basiertes Code-Splitting
- OnPush Change Detection: Optimierte Performance
- Material Design: Konsistente UI
- Reactive Forms: Typ-sichere Formulare

## 🗄️ Datenbank (PostgreSQL)

### Entity-Relationship Modell

```
USER (1:N) → ACCOUNT (1:N) → TRANSACTION
  ↓                ↓              ↓
CATEGORY ←────────┘         CATEGORY
  ↓
BUDGET
```

**Entities:**

- **User**: Authentifizierung (id, email, password, name)
- **Account**: Finanzkonten (userId, name, balance, type: CHECKING|SAVINGS|...)
- **Category**: Kategorien (userId, accountId, name, type: INCOME|EXPENSE)
- **Transaction**: Transaktionen (accountId, categoryId, amount, date, description)
- **Budget**: Budgets (userId, categoryId, amount, period)

### Indizes & Performance

```sql
-- Performance-kritische Indizes
CREATE INDEX idx_account_user ON Account(userId);
CREATE INDEX idx_transaction_account ON Transaction(accountId);
CREATE INDEX idx_transaction_date ON Transaction(date DESC);
CREATE INDEX idx_budget_user_category ON Budget(userId, categoryId);
```

**Datenintegrität:**

```prisma
model Transaction {
  account  Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: SetNull)
}
```

## 🌐 API & Authentifizierung

### REST API

**Resource-based URLs:**

```
GET/POST   /api/accounts
GET/PUT/DELETE  /api/accounts/:id
POST       /api/transactions/import    # CSV Import
GET        /api/budgets/with-stats     # Budget-Statistiken
```

**Swagger/OpenAPI:** http://localhost:3001/api/docs

### JWT Authentifizierung

```
POST /api/auth/login → { access_token, user }

Subsequent Requests:
  Authorization: Bearer <token>
  x-user-id: <userId>
```

**Route Protection:**

```typescript
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {}
```

### Validation & Error Handling

```typescript
export class CreateAccountDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEnum(AccountType) type: AccountType;
  @IsNumber() @Min(0) initialBalance: number;
}

// Error Response
{ statusCode: 404, message: "Account not found", error: "Not Found" }
```

## 🔄 Datenfluss-Beispiele

### Transaction Import Flow

```
User → Upload CSV → Frontend → POST /api/transactions/import
  → Controller validates DTO → Service parses CSV → Auto-categorize
  → Prisma batch insert → Database → Response with statistics
```

### Budget Alert Flow

```
User creates Budget → Service calculates spent amount
  → Compare spent vs. limit → If exceeded: Return with flag → Frontend alerts
```

## 🔐 Sicherheit & Performance

### Sicherheitskonzept

**Implementiert:**

- ✅ Password Hashing: `bcrypt.hash(password, 10)`
- ✅ JWT Tokens: Signierte Tokens mit Expiry
- ✅ Input Validation: class-validator DTOs
- ✅ SQL Injection Prevention: Prisma Prepared Statements
- ✅ XSS Protection: Angular Sanitization
- ✅ CORS: Konfigurierbare Origins

**Environment Variables:**

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### Performance-Optimierungen

**Database:**

- Indizierung für häufige Queries
- Connection Pooling (Prisma)
- Composite Indizes für komplexe Queries

**Backend:**

- Lazy Loading (Module on-demand)
- Pagination (Limit/Offset)
- Query Optimization (Select nur benötigte Felder)

**Frontend:**

- Route-basiertes Code-Splitting
- OnPush Change Detection
- TrackBy für effizientes Rendering

```typescript
trackByAccountId(index: number, account: Account) {
  return account.id;
}
```

### Monitoring & Health

```typescript
GET /api/health → { status: "ok", database: "connected", version: "0.0.1" }
```

## 🚀 Deployment

**Development:**

```bash
pnpm db:up      # PostgreSQL via Docker
pnpm dev:api    # NestJS (Port 3001)
pnpm dev:web    # Angular (Port 4201)
```

**Docker Compose:**

```yaml
services:
  db: # PostgreSQL 16 (5434)
  backend: # NestJS API (3001)
  frontend: # Angular + nginx (4201)
```

**Production:**

- Backend: Neon Database (Serverless PostgreSQL), Cloudflare Workers
- Frontend: Vercel, Netlify, AWS S3 + CloudFront

## 🧪 Testing & Qualität

**Unit Tests:**

```typescript
describe('AccountsService', () => {
  it('should create account', async () => {
    /* ... */
  });
});
```

**E2E Tests:**

```typescript
request(app).get('/api/accounts').expect(200);
```

**Code Quality:**

- ESLint (TypeScript Linting)
- Prettier (Code Formatting)
- Husky (Pre-commit Hooks)
- Commitlint (Conventional Commits)

**Coverage Ziele:** Unit Tests > 80%, E2E für kritische Flows

## 🔧 Erweiterbarkeit

**Geplante Features:**

- Multi-Currency Support
- Recurring Transactions
- Data Export (PDF/Excel)
- Mobile App (React Native)
- Investment Tracking
- Advanced Analytics (ML-basierte Insights)
- 2FA & Dark Mode

**API Versioning:**

```typescript
@Controller({ version: '1', path: 'accounts' })
export class AccountsController {}
```

---

**Weitere Details:**

- API-Dokumentation: http://localhost:3001/api/docs
- Setup & Usage: [README.md](./README.md)
- Lizenz: MIT - [LICENSE](LICENSE)

_Letzte Aktualisierung: November 2025_
