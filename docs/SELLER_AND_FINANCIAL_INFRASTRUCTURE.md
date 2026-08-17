# AUREVYXON OMEGA ULTRA
## SELLER & FINANCIAL INFRASTRUCTURE — MASTER PROMPT
### Classification: Core Financial Systems Architecture — Priority: P0 — Standard: Institutional-Grade

---

## 🎯 MISSION

Build Aurevyxon's seller onboarding and financial infrastructure to the standard of a **real fintech-grade marketplace ledger system** — not a feature list, not a CRUD app with a "payments" tab bolted on. Every rupee that moves through this platform must be traceable, reversible, auditable, and provably correct, forever.

---

## 🧠 ROLE MANDATE

Acting simultaneously as: **CTO** · **Fintech/Payments Architect** · **Accounting Systems Engineer** · **Fraud & Risk Engineer** · **Compliance Officer** · **Site Reliability Engineer (Disaster Recovery)**

---

## 📋 PART 1 — SELLER ONBOARDING (Foundation Layer)

### 1.1 Onboarding Flow
1. **Seller Profile Basics** — display name, seller type (Individual/Business), bio, logo, address.
2. **KYC Verification** — government ID upload, liveness/selfie face-match, PAN (India), GSTIN (business sellers), verification status machine: `pending → under_review → verified/rejected`.
3. **Payout Account Setup** — bank/UPI/Stripe Connect/Razorpay Route sub-account, **penny-drop verification** before activation.
4. **Legal & Tax Agreement** — digitally signed Seller Agreement (distinct from platform ToS), TDS declaration (Section 194-O, India), consent timestamp recorded.
5. **Review & Activation** — automated + manual quality gate; role upgrade `user → seller`, same login, expanded permissions.

### 1.2 Seller Data Model
```
SellerProfile {
  id, user_id, display_name, seller_type,
  kyc_status, pan_number (encrypted), gstin (encrypted),
  payout_method, payout_details (encrypted), payout_verified,
  commission_tier, risk_score, reserve_hold_percent,
  seller_agreement_accepted_at, created_at, updated_at
}
```
All PII and financial identifiers: **AES-256 encrypted at rest, masked on display** (e.g., `XXXX-1234`), never shown in raw form post-entry.

---

## 📋 PART 2 — DOUBLE-ENTRY LEDGER ENGINE (Core Financial Truth Layer)

This is the single most important module. **No balance anywhere in the system is ever a raw number stored and edited directly.** Every balance is *derived* from an immutable ledger of debit/credit entries — the same principle real accounting systems and banks use.

### 2.1 Core Principle
Every financial event creates **at least two ledger entries** (a debit and a matching credit) that always net to zero. This makes every rupee traceable and makes fraud/errors mathematically detectable (if debits ≠ credits anywhere, something is broken — and it's instantly visible).

### 2.2 Ledger Data Model
```
LedgerEntry {
  id, transaction_id (groups related entries),
  account_id (which ledger account — e.g., "Seller_123_Payable", "Platform_Commission_Revenue", "TDS_Payable"),
  entry_type: debit | credit,
  amount, currency,
  created_at,
  immutable: true  // NEVER updated or deleted, only reversed via new offsetting entries
}
```

### 2.3 Ledger Accounts (Chart of Accounts)
- `Platform_Revenue` (commission earned)
- `Seller_Payable_<seller_id>` (what's owed to each seller)
- `TDS_Payable` (tax withheld, owed to tax authority)
- `Escrow_Held_<seller_id>` (funds in hold, not yet released)
- `Reserve_Held_<seller_id>` (risk reserve, released after hold period)
- `Refund_Clearing` (temporary account during refund processing)
- `Gateway_Clearing` (funds in transit from payment gateway before settlement)

### 2.4 Reconciliation Engine
- Automated daily job compares **ledger-derived balances** against **actual payment gateway settlement reports** (Razorpay/Stripe payout statements).
- Any mismatch triggers an alert to the Admin Panel's Reconciliation Dashboard — flagged, never silently auto-corrected.
- Immutable ledger means historical entries are never edited — corrections happen via new reversing entries, preserving full audit history.

---

## 📋 PART 3 — EVENT SOURCING ARCHITECTURE

Every meaningful state change in the seller/financial lifecycle is recorded as an **immutable event**, not just a final-state database row. This gives full historical replay capability and airtight audit trails.

### 3.1 Core Events to Capture
`SellerCreated` · `SellerKYCSubmitted` · `SellerApproved` · `SellerRejected` · `ProductPublished` · `SaleCreated` · `PaymentSucceeded` · `PaymentFailed` · `CommissionCalculated` · `TDSDeducted` · `PayoutInitiated` · `PayoutSettled` · `RefundRequested` · `RefundApproved` · `DisputeOpened` · `DisputeResolved` · `ChargebackReceived` · `ReserveHoldApplied` · `ReserveReleased`

### 3.2 Event Store Model
```
Event {
  id, aggregate_id (e.g., seller_id or transaction_id),
  event_type, payload (JSON snapshot of relevant data),
  triggered_by (user_id/system), timestamp,
  immutable: true
}
```
**Current state = replay of all events for that aggregate.** This means the system can always answer "what exactly happened and in what order" for any seller, sale, or dispute — critical for compliance audits and dispute resolution.

---

## 📋 PART 4 — SPLIT PAYMENT & SETTLEMENT ARCHITECTURE

### 4.1 Real-Time Split at Point of Sale
Using **Razorpay Route** (India) / **Stripe Connect** (international) — real marketplace-split payment infrastructure, not manual redistribution:

1. Buyer pays gross amount → gateway processes full payment.
2. Gateway auto-splits: Platform commission → Aurevyxon master account | Seller's net share → seller's linked sub-account.
3. **TDS (Section 194-O)** calculated and recorded as its own ledger line — never merged silently into commission.
4. Every split generates matching ledger entries (Part 2) and a `PaymentSucceeded`/`CommissionCalculated` event (Part 3).

### 4.2 Marketplace Escrow & Reserve Balance
For **high-risk sellers** (determined by the Risk Engine, Part 6):
- A configurable percentage of each sale (e.g., 20%) is held in `Reserve_Held_<seller_id>` instead of paid out immediately.
- Reserve auto-releases after a defined hold period (e.g., 30 days) if no dispute/chargeback occurs on that transaction.
- Full flow: `Sale → Reserve Hold Applied → 30-Day Window → Auto-Release → Payout`, each step logged as an event.
- Escrow logic applies more broadly for Exclusive Asset sales (Part covered in existing Exclusive Assets framework) — funds held until buyer-side technical verification confirms delivery matches specification.

### 4.3 Refund/Chargeback Reversal
- Refunds reverse **both** the platform commission portion and the seller's net portion through the gateway's native reversal API — never manual accounting adjustment.
- Each reversal creates offsetting ledger entries (never edits/deletes original entries) and a `RefundApproved`/`ChargebackReceived` event.

---

## 📋 PART 5 — MULTI-CURRENCY & SMART GATEWAY ROUTING

### 5.1 Multi-Currency Support
- Supported settlement currencies: INR, USD, EUR, GBP, JPY, AED (extensible).
- Every transaction stores both **original transaction currency** and **seller's payout currency**, with the FX rate applied at time of transaction recorded immutably (for audit — FX rates fluctuate, so the exact rate used must be locked to that transaction forever).

### 5.2 Smart Multi-Gateway Routing
Automatic gateway selection per transaction based on:
- Buyer's country/currency
- Payment method chosen (card, UPI, wallet, bank transfer)
- Real-time gateway health/uptime status (route away from a gateway currently experiencing elevated failure rates)
- Cost optimization (lowest processing fee for that transaction profile, where multiple gateways support the same route)

---

## 📋 PART 6 — AI FRAUD & RISK ENGINE

### 6.1 Signals Evaluated
- **Seller Fraud Score** — based on account age, KYC confidence, dispute history, sudden volume spikes.
- **Buyer Fraud Score** — payment method risk, purchase velocity, mismatched billing/shipping signals.
- **Download Abuse Detection** — repeated re-downloads, credential sharing patterns.
- **Velocity Checks** — unusual spikes in transaction frequency/value from a single account.
- **Device Fingerprinting & IP Reputation** — flags known-bad devices/IP ranges, VPN/proxy detection where relevant.
- **Country Risk Scoring** — configurable risk weighting per jurisdiction based on historical fraud/chargeback rates.

### 6.2 Risk Engine Decision Flow
```
Transaction/Seller Event → Risk Score Calculated
   ↓
 Score below threshold  → Auto-Approve
 Score in gray zone      → Manual Review Queue (Admin Panel)
 Score above threshold   → Auto-Reject / Auto-Hold (Reserve applied)
```
All risk-engine decisions are logged as events (Part 3) with the score and contributing factors — never a black-box, always explainable in the Admin Panel for audit/appeal purposes.

---

## 📋 PART 7 — WEBHOOK RETRY ENGINE

Payment gateway webhooks (payment success, refund, dispute, payout settled) are the backbone of the settlement flow — they cannot be allowed to silently fail.

### 7.1 Retry Architecture
- On webhook receipt failure or processing error: automatic retry with exponential backoff (e.g., 1min → 5min → 30min → 2hr → 12hr).
- After exhausting retries: event moves to a **Dead Letter Queue**, visible in the Admin Panel with a **manual retry / manual resolve** action.
- Every webhook attempt (success or failure) is logged as its own auditable record — never processed silently with no trace.

---

## 📋 PART 8 — COMPLIANCE, AUDIT & REPORTING LAYER

### 8.1 Financial Audit Trail
Every rupee — commission, payout, refund, reversal, tax — is traceable through the full chain: **Event → Ledger Entry → Gateway Transaction → Settlement Record**, forever, immutably.

### 8.2 Accounting Reports (Generated from Ledger, Never Hand-Maintained)
- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Revenue & Commission Reports
- GST Reports (India)
- TDS Reports (Section 194-O compliance, India)
- Settlement Reports (per seller, per period)

### 8.3 Full Financial Dashboard (Admin Panel)
Real-time visibility into: **GMV** (Gross Merchandise Value) · **Net Platform Revenue** · **Commission Collected** · **Tax Withheld** · **Refunds/Chargebacks** · **Settlement Status** · **Reserve Balances Held** · **Seller Wallet Balances** · **Full Ledger Explorer** (searchable, filterable, exportable).

---

## 📋 PART 9 — DISASTER RECOVERY & RELIABILITY

- **Immutable event log + ledger** means the entire financial state can be **replayed and reconstructed** from event history in case of database failure — this is a primary advantage of the event-sourcing approach.
- Regular automated backups of the event store and ledger, with tested restore procedures (a backup that has never been restored in a test is not a real backup).
- Idempotency keys on every payment-related API call — prevents duplicate charges/payouts if a request is retried after a network failure.
