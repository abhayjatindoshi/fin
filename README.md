<p align="center">
  <img src="src/modules/app-ui/icons/logo.svg" alt="Fin Logo" width="96" height="96" />
</p>

# Fin — Personal Finance Manager

Import, tag, and analyze your finances across banks and accounts with a fast, modern React app. Fin makes it simple to ingest statements, auto-categorize transactions, track budgets, and sync data across devices.

## Highlights
- **Fast UI:** Built with React + Vite + TypeScript for instant feedback.
- **Smart Tagging:** Auto and manual tagging via a flexible rules engine.
- **Powerful Imports:** Pluggable adapters for banks and CSV sources.
- **Actionable Insights:** Dashboards for spend, income, merchants, and categories.
- **Private by Design:** Local-first data with optional cloud sync providers.
- **Optional Auth:** Google Sign-In available for multi-device access.

## Core Features
- **Transactions:** Browse, filter, and search by date, merchant, account, tags, and amounts.
- **Tagging Rules:** Create rules by merchant, memo, amount range, or account context; leverage system tags for consistency.
- **Import Pipeline:** Normalize bank statements through an `ImportMatrix` with typed interfaces; CSV support included.
- **Accounts & Entities:** Model households, money accounts, merchants, user accounts, settings, and tags.
- **Budget & Dashboards:** Visualize spend trends, category allocations, and merchant summaries.
- **Sync & Observability:** Orchestrated sync with metadata tracking, dirty-state management, and observable updates.
- **Themes & UX:** Theme switcher, responsive layouts, currency and money display helpers.

## Architecture Overview
- **Domain (`src/modules/app`):** Entities (`Transaction`, `Tag`, `MoneyAccount`, `Merchant`, `UserAccount`, `Household`, `Setting`, `SubTag`) and services (`TransactionService`, `TaggingService`, `ImportService`, `SettingService`) plus utilities (`EntityUtils`, `FileUtils`, `SystemTags`).
- **Import (`src/modules/app/import`):** `ImportMatrix`, source adapters for banks/providers, and typed interfaces for extensibility.
- **Data Sync (`src/modules/data-sync`):** `DataManager`, `DataRepository`, `DirtyTracker`, `ObservableManager`, `SyncScheduler`, `TenantManager`, with pluggable providers and logging.
- **App UI (`src/modules/app-ui`):** Pages (Dashboard, Budget, Transactions, Settings, About, Home), components (transactions, import, layouts, navbar), and common helpers (currency, money, account numbers, sync status, theme).
- **Auth (`src/modules/auth`):** `AuthProvider`, `LoginComponent`, Google auth handler and button.
- **Base UI (`src/modules/base-ui`):** Theme provider, UI kit, hooks like `use-mobile`, and base library utilities.

## Getting Started
Prerequisites: Node.js 18+ and your choice of `pnpm` or `npm`.

```powershell
# From repo root
pnpm install
# or
npm install

# Start dev server
pnpm dev
# or
npm run dev

# Build for production
pnpm build
# or
npm run build

# Preview production build
pnpm preview
# or
npm run preview
```

## Configuration
- **Settings:** App and user preferences via `SettingService` and UI providers in `src/modules/app-ui/providers`.
- **Auth:** Enable or configure Google Sign-In under `src/modules/auth`.
- **Tooling:** ESLint/TS configs in `eslint.config.ts`, `tsconfig.*.json`; Vite setup in `vite.config.ts`.

## Extending Imports
- Add new bank/provider adapters in `src/modules/app/import/banks`.
- Define interfaces in `src/modules/app/import/interfaces` and register in `ImportMatrix`.
- Use `FileUtils` for robust parsing and validation.

## Roadmap
- Rule editor UI for advanced tagging
- Budget planning and alerts
- Additional bank adapters and export formats

## License
This project is private to the repository owner.
