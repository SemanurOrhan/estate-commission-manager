# Design Document — Estate Commission Manager

## 1. Overview

The Estate Commission Manager is a full-stack application designed to automate the lifecycle of real estate transactions — from initial agreement through earnest money and title deed stages to final completion — and to accurately distribute service fee commissions between the agency and its agents.

This document explains the key architectural decisions, data models, and frontend state management strategies used in this project.

---

## 2. Architecture

### 2.1 Backend — NestJS

The backend follows NestJS's modular architecture. Each domain concern is isolated into its own module:

| Module | Responsibility |
|---|---|
| `TransactionsModule` | CRUD operations, stage advancement, commission persistence |
| `AgentsModule` | Agent registration and lookup |
| `PropertiesModule` | Property listing management |
| `CommissionModule` | Pure business logic for fee distribution (stateless) |
| `StageMachineModule` | Stage transition rules and validation (stateless) |

**Key design choice:** `CommissionService` and `StageMachineService` are intentionally **stateless, pure-logic services** with no database dependency. This makes them trivially testable and reusable without mocking the database layer.

### 2.2 Frontend — Nuxt 3

The frontend is a Nuxt 3 application using:
- **Pinia** for centralized transaction state management
- **Tailwind CSS** for utility-first styling
- **Nuxt auto-imports** for components and composables

Page structure:

| Page | Purpose |
|---|---|
| `/` (Dashboard) | Lists all transactions with stage badges |
| `/transactions/new` | Form to create a new transaction |
| `/transactions/[id]` | Transaction detail with stage tracker and commission breakdown |
| `/agents` | CRUD management for agents |
| `/properties` | CRUD management for properties |
| `/reports` | Financial summary of completed transactions |

---

## 3. Data Models

### 3.1 Transaction Schema

```
Transaction {
  propertyId:          ObjectId → Property
  listingAgentId:      ObjectId → Agent
  sellingAgentId:      ObjectId → Agent
  agreedPrice:         Number
  totalServiceFee:     Number
  stage:               Enum (agreement | earnest_money | title_deed | completed)
  stageHistory:        [{ stage, timestamp, notes }]
  commissionBreakdown: {
    totalServiceFee, agencyAmount, agencyPercentage,
    agentEntries: [{ agentId, agentName, role, amount, percentage }],
    calculatedAt
  }
  buyerName:           String (optional)
  buyerEmail:          String (optional)
}
```

### 3.2 Commission Breakdown — Embedded Document

**Decision:** The commission breakdown is stored as an **embedded sub-document** inside the transaction, rather than in a separate collection.

**Rationale:**
- **Atomic reads:** A single `findById` returns the transaction and its full financial breakdown in one query. No joins, no secondary lookups.
- **Historical snapshot:** The embedded breakdown captures the exact commission state at the moment of completion. If commission policies change in the future, historical records remain accurate and immutable.
- **Simplicity:** For a system where the breakdown is always read alongside its parent transaction, embedding avoids the overhead of managing a separate collection and maintaining referential integrity.

**Dynamic fallback:** For legacy transactions that were completed before the breakdown feature was added to the database, the `findOne` method dynamically computes the breakdown on the fly using `CommissionService.calculate()`. This ensures backward compatibility without requiring data migration scripts.

### 3.3 Agent Schema

```
Agent {
  firstName, lastName, email, phone, isActive
}
```

### 3.4 Property Schema

```
Property {
  address, city, postcode, type (sale | rental), askingPrice, description
}
```

---

## 4. Stage Machine

### 4.1 Transition Rules

Transactions follow a strict linear progression:

```
agreement → earnest_money → title_deed → completed
```

**Invalid transitions are strictly prevented.** The `StageMachineService`:
- Only allows forward, sequential transitions (no skipping stages)
- Throws `BadRequestException` for backward transitions
- Throws `BadRequestException` when attempting to advance past `completed`

**Rationale:** This mirrors the real-world real estate closing process. In practice:
- You cannot execute a title deed transfer before earnest money has been deposited
- You cannot reverse a completed transaction back to an earlier stage
- Each stage represents a legal/financial milestone that must occur in order

### 4.2 Stage History

Every stage transition is recorded in a `stageHistory` array with a timestamp and optional notes. This provides a complete audit trail of the transaction lifecycle.

---

## 5. Commission Policy

### 5.1 Distribution Rules

The `CommissionService` implements the agency's fee distribution policy:

| Party | Share |
|---|---|
| Agency | 50% of total service fee |
| Agent(s) | 50% of total service fee |

**Scenario 1 — Dual Agent:** If the listing and selling agent are the same person, that agent receives the full 50% agent portion.

**Scenario 2 — Split Agents:** If the listing and selling agents are different, they each receive 25% of the total service fee.

### 5.2 Calculation Trigger

Commission is calculated **once** when the transaction advances to the `completed` stage. The result is persisted atomically via `$set` in the same `findByIdAndUpdate` call that updates the stage, ensuring the breakdown is never lost due to partial writes.

---

## 6. Frontend State Management

### 6.1 Pinia Store

The `useTransactionsStore` manages:
- **State:** `transactions[]`, `currentTransaction`, `isLoading`, `isAdvancing`, `error`
- **Getters:** `completedTransactions`, `transactionById`
- **Actions:** `fetchAll`, `fetchOne`, `advanceStage`, `createTransaction`, `$reset`

The `$reset` method clears stale loading/error state on page transitions, preventing infinite loading spinners when navigating between pages that share the same store.

### 6.2 Error Handling

Every API call follows a consistent pattern:
- Store actions set `error` from `$fetch` error responses (extracting `err.data.message` for NestJS HTTP errors)
- Page components read `store.error` and display user-friendly error cards with retry buttons
- No silent `catch` blocks — every failure is surfaced to the user

---

## 7. Scope Decisions

### 7.1 Authentication

Authentication and authorization were **intentionally excluded**. This application is designed as a backoffice/admin tool where the primary focus is the core business logic: transaction lifecycle management and commission distribution. Adding auth would increase complexity without contributing to the core problem being solved.

### 7.2 API Validation

DTOs use `class-validator` decorators with NestJS's `ValidationPipe` to validate all incoming request bodies, ensuring data integrity at the API boundary.

---

## 8. Testing Strategy

Unit tests cover the three critical business logic layers:

| Suite | Coverage |
|---|---|
| `CommissionService` | Dual agent, split agents, edge cases (zero fee, large fee), ID comparison |
| `StageMachineService` | All valid transitions, invalid transitions, backward transitions, boundary checks |
| `TransactionsService` | CRUD operations, stage advancement, commission calculation trigger, history recording |
| `AgentsService` | CRUD operations, not-found handling |
| `PropertiesService` | CRUD operations, not-found handling |

All tests use NestJS's `Test.createTestingModule` with dependency injection and Jest mocks, ensuring isolated unit tests without database connections.

---

## 9. Deployment Strategy

### 9.1 Platform Choice — Vercel

The application is deployed on **Vercel** for the following reasons:

- **Native Nuxt 3 support:** Vercel provides first-class support for Nuxt 3 applications with zero-configuration builds, automatic SSR/SSG detection, and edge function capabilities.
- **GitHub integration:** Automatic deployments on every push to the main branch, with preview deployments for pull requests — enabling a seamless CI/CD workflow.
- **High availability:** Vercel's global edge network ensures low-latency responses worldwide, with automatic scaling and zero-downtime deployments.
- **Environment variable management:** Secure storage and injection of sensitive configuration values (e.g., `MONGO_URI`, `NUXT_PUBLIC_API_BASE`) through the Vercel dashboard.

### 9.2 Monorepo Handling

The repository follows a monorepo structure with separate `backend/` and `frontend/` directories. A `vercel.json` at the root configures Vercel to build and deploy the frontend, while the backend can be deployed independently to Vercel Serverless Functions, Render, or Railway.

### 9.3 Environment Configuration

| Variable | Location | Purpose |
|---|---|---|
| `MONGO_URI` | Backend | MongoDB Atlas connection string |
| `PORT` | Backend | HTTP server port |
| `NUXT_PUBLIC_API_BASE` | Frontend | Backend API base URL |

---

# Mimari Kararlar (Türkçe)

## Gömülü Model (Embedded Document)

Komisyon dağılımı, işlem dökümanının içine **gömülü bir alt belge** olarak saklanmaktadır. Bu yaklaşımın gerekçeleri:

- **Atomik okumalar:** Tek bir `findById` sorgusuyla hem işlem hem de finansal dağılım bilgisi alınır. Ek sorgu veya birleştirme (join) gerekmez.
- **Tarihsel anlık görüntü:** Gömülü dağılım, işlem tamamlandığı andaki komisyon durumunu yakalar. Gelecekte komisyon politikaları değişse bile, geçmiş kayıtlar doğru ve değişmez kalır.
- **Geriye uyumluluk:** Dağılım özelliği eklenmeden önce tamamlanmış eski işlemler için `findOne` metodu, `CommissionService.calculate()` kullanarak dağılımı anında dinamik olarak hesaplar.

## Aşama Makinesi (Stage Machine)

İşlemler sıkı bir doğrusal ilerleme izler:

```
anlaşma → kapora → tapu → tamamlandı
```

- **Geçersiz geçişler kesinlikle engellenir.** Aşama atlama (örn. anlaşmadan doğrudan tapuya) veya geriye dönüş (örn. tapudan kaparaya) yapılamaz.
- **Gerekçe:** Bu, gerçek dünya gayrimenkul kapanış sürecini yansıtır. Kapora yatırılmadan tapu devri gerçekleştirilemez ve tamamlanmış bir işlem önceki aşamaya döndürülemez.

## Kapsam Kararları

### Kimlik Doğrulama (Authentication)

Kimlik doğrulama ve yetkilendirme **bilinçli olarak kapsam dışı bırakılmıştır**. Bu uygulama, temel iş mantığına (işlem yaşam döngüsü yönetimi ve komisyon dağılımı) odaklanan bir backoffice/yönetim aracı olarak tasarlanmıştır.

### API Doğrulama

DTO'lar (Data Transfer Objects), NestJS'in `ValidationPipe`'ı ile birlikte `class-validator` dekoratörlerini kullanarak tüm gelen istek gövdelerini doğrular ve API sınırında veri bütünlüğünü sağlar.

## Test Stratejisi

Birim testleri, üç kritik iş mantığı katmanını kapsar:

| Paket | Kapsam |
|---|---|
| `CommissionService` | İkili danışman, bölünmüş danışmanlar, sınır durumlar |
| `StageMachineService` | Tüm geçerli/geçersiz geçişler, geri dönüşler |
| `TransactionsService` | CRUD, aşama ilerlemesi, komisyon tetikleme |
| `AgentsService` | CRUD işlemleri, bulunamama durumu |
| `PropertiesService` | CRUD işlemleri, bulunamama durumu |

Tüm testler, veritabanı bağlantısı gerektirmeden bağımlılık enjeksiyonu ve Jest mockleri ile NestJS'in `Test.createTestingModule` yapısını kullanır. Toplam **55 birim test** başarıyla geçmektedir.
