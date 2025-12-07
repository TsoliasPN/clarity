# SPECIFICATIONS.md: CLARITY Subscription Management Platform

**Version:** 1.1 (Multi-Currency Update)
**Status:** Draft
**Date:** October 26, 2023
**Author:** Technical Product Team

---

## Section 1: Product Definition

### 1.1 Product Description
CLARITY is an AI-powered subscription management and analytics platform designed to solve the opacity of modern recurring billing. It serves both individual users managing personal finances and businesses tracking SaaS metrics.

### 1.2 Core Solution
* **Ingestion:** Aggregating subscription data via Manual Entry, CSV imports, and (Phase 2) Bank Connections.
* **Intelligence:** Categorizing spend, predicting renewals, and normalizing costs across different currencies.

### 1.3 Target Personas
1.  **The Tech Professional:** Manages 15+ SaaS tools; needs to track "zombie" accounts.
2.  **The Expat/Digital Nomad:** Manages expenses in multiple currencies (USD, EUR, GBP).
3.  **The Bootstrap Founder:** Tracks MRR/ARR and burn rate without enterprise ERPs.

---

## Section 2: Feature Specifications (MVP)

### 2.1 Subscription Management (CRUD)
* **User Story:** As a user with international expenses, I want to define that my "Netflix" is billed in **EUR** while my "New York Times" is billed in **USD**, so my payment records are accurate.
* **Key Functionality:**
    * Currency selector (ISO 4217) on "Add Subscription" form.
    * Default to User's base currency, allow override per item.

### 2.2 Dashboard Aggregation (Multi-Currency)
* **Requirement:** All dashboard totals (Total Monthly Spend) must be **normalized** to the User's Base Currency.
* **Logic:**
    * Fetch User Base Currency (e.g., GBP).
    * If `sub.currency != user.baseCurrency`: Convert amount using cached exchange rates.
    * Display "Approximate" indicator for converted totals.

### 2.3 CSV Data Import
* **User Story:** As a user, I want to upload a CSV of my bank statement to bulk-import subscriptions.
* **Metrics:** 90% successful parse rate for standard bank exports.

---

## Section 3: Technical Architecture

### 3.1 Technology Stack
* **Frontend:** Next.js 14, TypeScript, Tailwind CSS, TanStack Query.
* **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL.
* **Infrastructure:** Vercel (Web), Supabase/AWS RDS (Postgres).

### 3.2 Database Schema
* **User:** Stores `baseCurrency`.
* **Subscription:** Stores `cost` (Decimal) and `currency` (String).
* **ExchangeRate:** Caches rates relative to USD to minimize API calls.

---

## Section 4: Data & Security

* **Encryption:** AES-256 for sensitive data at rest.
* **Privacy:** User-owned data model; no selling of transaction history.
* **Compliance:** GDPR compliant export/delete capabilities.

---

## Section 5: Roadmap

* **Phase 1 (MVP):** Auth, CRUD, Multi-Currency Logic, Dashboard.
* **Phase 2:** Bank Integrations (Plaid), Email Parsing, Churn Prediction.
* **Phase 3:** Mobile Native Apps.