# Import Framework – Technical Design

## 1. Purpose & Scope

The Import Framework is responsible for ingesting financial data (transactions, accounts, metadata) into a **fully offline personal finance management application**.

It supports two primary input channels:

* **File-based imports** (manual, short-running)
* **Email-based imports** (automatic, long-running, resumable)

The framework is designed to:

* Operate entirely client-side (no backend)
* Be resilient to interruptions
* Delegate bank-specific logic to adapters
* Provide a unified import execution model with optional UI attachment

---

## 2. High-Level Architecture

```
Trigger (Manual / Background)
        |
        v
Common Import Executor
        |
        v
Input Normalization (File | Email)
        |
        v
Adapter Resolution
        |
        v
Bank Adapter Execution
        |
        v
Validation + Deduplication
        |
        v
Persistence Layer (external)
```

### Core Concepts

* **Unified import function**: Same execution path for files and emails
* **Adapters**: Bank-specific logic for parsing and interpretation
* **Prompt-driven interruptions**: Import can pause and resume based on user input
* **Progress emission**: Optional observers for UI and notifications

---

## 3. Unified Import Execution Model

All imports—manual or automatic—are executed through a **single common function**.

### Characteristics

* Can be triggered:

  * Manually (file drag & drop)
  * Automatically (email sync when app is open)
* Emits progress events
* Does **not** depend on UI presence
* Can be paused, resumed, or interrupted safely

### Progress Handling

* **File imports**

  * Short-lived
  * UI always attached
  * Blocking, visible progress

* **Email imports**

  * Long-running
  * Background execution
  * Progress surfaced only when:

    * User opens import settings
    * Import is interrupted (notification-driven)

---

## 4. Adapter System

### Adapter Registration

* All adapters are statically registered in a single file
* No runtime discovery or dynamic loading
* All adapters are always available while the app runs

---

## 5. File Import Flow (Manual)

### Step-by-Step Flow

1. User drops a file into the app
2. Framework identifies file type (PDF, Excel, Text, etc.)
3. If file is password-protected and password is unknown:

   * Import pauses
   * User is prompted for password
4. All file adapters are queried for support
5. Adapter resolution:

   * **0 adapters** → import ends
   * **1 adapter** → proceed
   * **>1 adapters** → user prompted to select adapter
6. Selected adapter executes `parseTransactions`
7. Import service:

   * Deduplicates transactions (hash-based, e.g., date + amount)
   * Creates missing bank accounts if required
8. Validated data is passed to persistence layer
9. Import completes

---

## 6. Email Import Overview

### Characteristics

* Triggered automatically once accounts are connected
* Runs only when app is open
* Long-running and resumable
* Processes **one account at a time**
* Strictly sequential (no concurrent imports)

---

## 7. Email Account & Token Handling

* Each connected account stores:

  * Access token
  * Refresh token
* Before each API call:

  * Access token expiry is checked locally
  * Refresh token is used if needed
* If refresh fails:

  * Import is interrupted
  * User is prompted to re-authenticate
  * Import resumes after resolution

---

## 8. Email Sync State Management (Core Design)

Email syncing is governed by **three sync points**, stored persistently.

### Sync Points

| Sync Point | Meaning                                             |
| ---------- | --------------------------------------------------- |
| `start`    | First email identifier/date fetched in a sync cycle |
| `current`  | Last fully processed email                          |
| `end`      | Boundary indicating where next sync should stop     |

Each sync point stores:

* Email identifier
* Email received date

---

### First Sync (Initial Import)

1. `start`, `current`, `end` are all `null`
2. Sync begins from **newest email**
3. First fetched email → stored in `start`
4. As emails are fully processed:

   * `current` is continuously updated
5. If interrupted:

   * Resume from `current`
6. When oldest email is reached:

   * `end = start`
   * `start` and `current` are cleared

---

### Subsequent Syncs

1. Sync starts from newest email
2. Continues until reaching `end`
3. Ensures:

   * No duplicate processing
   * No missed emails
4. If interrupted:

   * Resume from `current` (if present)

This guarantees **eventual completeness without data loss**.

---

## 9. Email Adapter Resolution

### Email Adapter Extensions

Compared to file adapters, email adapters add:

* **Supported email domains**
* Ability to work on:

  * Email body
  * Attachments
  * Metadata

### Resolution Flow

1. Extract sender/receiver domains from email
2. Filter adapters by supported domain
3. Call adapter’s `isSupported(email)` method
4. Adapter resolution:

   * **0 adapters** → email skipped
   * **1 adapter** → proceed
   * **>1 adapters** → user prompted to select adapter

---

## 10. Email Adapter Execution Modes

Email adapters can return **one of two outcomes**:

### 1. Direct Import Data

* Account details
* Transactions
* Processed identically to file adapter output

### 2. Email Attachments

* Adapter returns list of attachments
* Import service:

  1. Downloads attachments
  2. Converts them to JS `File` objects
  3. Re-enters **file import flow**
  4. File adapters take over

This allows emails to act as **transport layers** rather than parsers.

---

## 11. Prompt Errors & Interruptions

### Prompt Error Types

* Password required (file or attachment)
* Multiple adapter selection
* Account selection
* Authentication failure (email accounts)

### Behavior

* Prompt errors **interrupt import execution**
* State is persisted
* Import resumes only after user resolution

### UI Interaction

* **File imports**

  * Blocking
  * Immediate UI prompts

* **Email imports**

  * Background
  * Notification-driven
  * Resolved via import settings or notifications

---

## 12. Concurrency & Performance Model

* Only **one import process runs at a time**
* Only **one email account is synced at a time**
* Email throughput intentionally low (≈ 20–50 emails/min)
* Trade-off accepted:

  * Slower imports
  * Smoother app performance
  * Lower API risk

---

## 13. Key Design Guarantees

* Fully offline operation
* No missed emails
* Safe interruption and resumption
* Adapter-driven extensibility
* Unified execution model
* UI-optional progress observation

---

## 14. Non-Goals (Explicitly Out of Scope)

* Persistence layer design
* Repository structure
* Testing strategy
* Adapter distribution/versioning

---