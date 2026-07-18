import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.wrangler', '*.config.*', 'src/lib/icons/generated', 'scripts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Force callers to use the manifest-driven `<Icon name="..." />` so the
      // bundle stays in sync with `icons.config.ts`. Exemptions below for
      // shadcn primitives, the icon loader/registry, and the generator output.
      'no-restricted-imports': ['error', {
        paths: [
          {
            name: 'lucide-react',
            importNames: ['default'],
            message: 'Use <Icon name="..."/> from @/ui/icon and add the icon to icons.config.ts. Direct lucide imports are only allowed in src/ui/* (shadcn primitives) and src/lib/icons/* (registry).',
          },
        ],
        patterns: [
          {
            group: ['lucide-react', 'lucide-react/*'],
            message: 'Use <Icon name="..."/> from @/ui/icon and add the icon to icons.config.ts. Direct lucide imports are only allowed in src/ui/* (shadcn primitives) and src/lib/icons/* (registry).',
          },
          {
            // Overlay primitives must be opened through <AdaptiveSurface> so the
            // breakpoint choice, a11y (title/description) and gutter/close are
            // centralised. Popover and dropdown-menu are anchored menus, not
            // overlays — they stay unrestricted.
            group: ['@/ui/sheet', '@/ui/dialog', '@/ui/drawer'],
            message: 'Do not use <Sheet>/<Dialog>/<Drawer> directly. Open overlays via <AdaptiveSurface> (src/components/adaptive-surface): content in <SurfaceBody>, close via <SurfaceClose>. Direct imports are allowed only in the adaptive-surface adapters.',
          },
        ],
      }],
      // Direct fyredb/repo access is restricted to the service layer. The
      // `useDb` hook is the UI's only route to a repo, so banning its import
      // (outside the allowlist override below) keeps entity access inside the
      // domain services. Use `useServices()` and a service method instead.
      'no-restricted-syntax': ['error', {
        selector: "ImportSpecifier[imported.name='useDb']",
        message: 'Direct fyredb/repo access is restricted to the service layer — use a domain service via useServices() instead of useDb. (Allowed only in src/services/**, ServicesProvider, and a few infra/dev files; see the eslint allowlist.)',
      }],
    },
  },
  {
    // shadcn primitives + the icon registry/loader/generated bundles ship
    // their own lucide imports — that's the canonical pattern there. The
    // toaster (`providers/sonner.tsx`) is a shadcn primitive that lives with
    // the theme context, so it keeps the same lucide-authoring exemption. The
    // adaptive-surface adapters are the one place allowed to import the
    // restricted overlay primitives (@/ui/sheet|dialog|drawer).
    files: [
      'src/ui/**/*.{ts,tsx}',
      'src/lib/icons/**/*.{ts,tsx}',
      'src/assets/icons/**/*.{ts,tsx}',
      'src/providers/sonner.tsx',
      'src/components/adaptive-surface/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/providers/**/*.{ts,tsx}', 'src/components/adaptive-surface/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // The app shell is provider-like infrastructure: these two files
    // intentionally co-locate the shell hook/context (`useAppShell`) and the
    // sync-status hook/helper with their components, mirroring the providers
    // exemption above.
    files: [
      'src/features/shell/app-shell-provider.tsx',
      'src/features/shell/sync-status.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // `useFyreDb`/repo access belongs to the service layer. These are the only
    // legitimate fyredb touch-points outside it: the service entry point
    // (ServicesProvider), the dev debug handle (AppProvider), the store-level
    // sync status, and the dev entity inspector.
    files: [
      'src/services/**/*.{ts,tsx}',
      'src/providers/services-provider.tsx',
      'src/providers/app-provider.tsx',
      'src/features/shell/sync-status.tsx',
      'src/features/dev/sections/data-section.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      // Resolve `@/*` aliases and `.ts`/`.tsx` extensions so boundaries can
      // classify every import into an element. Without this, relative `.tsx`
      // imports fail node resolution (→ no-unknown) and `@/*` imports are
      // silently treated as external (→ the DAG goes unchecked).
      'import/resolver': {
        typescript: { project: 'tsconfig.app.json' },
      },
      'boundaries/include': ['src/**/*'],
      // Generated icon chunks + hand-authored SVG sources + static assets and
      // stylesheets are not part of the layered graph — exclude them so
      // no-unknown / element-types skip them.
      'boundaries/ignore': ['src/lib/icons/generated/**', 'src/assets/**', 'src/**/*.css'],
      'boundaries/elements': [
        { type: 'app',        pattern: 'src/{app/**,main.tsx}', mode: 'full' },
        { type: 'pages',      pattern: 'src/features/*/*-page.tsx', mode: 'full' },
        { type: 'templates',  pattern: 'src/templates/**', mode: 'full' },
        { type: 'feature',    pattern: 'src/features/**', mode: 'full' },
        { type: 'providers',  pattern: 'src/providers/**', mode: 'full' },
        { type: 'services',   pattern: 'src/services/**', mode: 'full' },
        { type: 'components', pattern: 'src/components/**', mode: 'full' },
        { type: 'ui',         pattern: 'src/ui/**', mode: 'full' },
        { type: 'entities',   pattern: 'src/entities/**', mode: 'full' },
        { type: 'views',      pattern: 'src/views/**', mode: 'full' },
        { type: 'catalog',    pattern: 'src/catalog/**', mode: 'full' },
        { type: 'lib',        pattern: 'src/lib/**', mode: 'full' },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'error',
      // The dependency DAG — default deny, allow only downward edges plus each
      // layer's own peers (intra-layer composition: a navbar uses sibling
      // pills, an adaptive surface composes its variant surfaces, etc.).
      //
      // `checkAllOrigins` widens the rule to external/core modules so the
      // fyre-db DATA-package restriction (last policy) is enforced here rather
      // than the deprecated `boundaries/external` rule. Policies are processed
      // in order and the last match wins, so the external baseline is allowed
      // first and then narrowed for the listed importer layers.
      'boundaries/dependencies': ['error', {
        default: 'disallow',
        checkAllOrigins: true,
        rules: [
          // Baseline: every element may import any external/core package. The
          // fyre-db DATA-package restriction (last policy) overrides this for
          // the listed importer layers.
          { from: { type: '*' }, allow: [{ to: { origin: 'external' } }, { to: { origin: 'core' } }] },

          // `app` (main + router) composes the route table from feature route
          // elements and shared chrome, so it may also reach feature/components.
          { from: { type: 'app' },        allow: [{ to: { type: ['app', 'pages', 'templates', 'feature', 'providers', 'components', 'ui', 'lib'] } }] },
          { from: { type: 'pages' },      allow: [{ to: { type: ['pages', 'feature', 'templates', 'providers', 'components', 'ui', 'views', 'entities', 'catalog', 'lib'] } }] },
          { from: { type: 'templates' },  allow: [{ to: { type: ['templates', 'feature', 'providers', 'components', 'ui', 'views', 'entities', 'catalog', 'lib'] } }] },
          { from: { type: 'feature' },    allow: [{ to: { type: ['feature', 'providers', 'components', 'ui', 'views', 'entities', 'catalog', 'lib'] } }] },
          { from: { type: 'providers' },  allow: [{ to: { type: ['providers', 'services', 'components', 'ui', 'views', 'entities', 'catalog', 'lib'] } }] },
          { from: { type: 'services' },   allow: [{ to: { type: ['services', 'views', 'entities', 'catalog', 'lib'] } }] },
          { from: { type: 'components' }, allow: [{ to: { type: ['components', 'ui', 'views', 'entities', 'catalog', 'lib'] } }] },
          { from: { type: 'ui' },         allow: [{ to: { type: ['ui', 'lib'] } }] },
          { from: { type: 'views' },      allow: [{ to: { type: ['views', 'entities', 'lib'] } }] },
          { from: { type: 'entities' },   allow: [{ to: { type: ['entities', 'lib'] } }] },
          { from: { type: 'catalog' },    allow: [{ to: { type: ['catalog', 'views', 'entities', 'lib'] } }] },
          { from: { type: 'lib' },        allow: [{ to: { type: ['lib'] } }] },

          // fyre-db DATA packages (@fyre-db/core, @fyre-db/plugins) are
          // restricted to the service layer for DATA ACCESS. Exception:
          // `entities/` may import the @fyre-db/core DEFINITION api
          // (`defineEntity`, `partitioned`) because each entity co-locates its
          // declarative schema with its type — that's schema definition, not
          // data access, which stays services-only. The React-integration
          // package (@fyre-db/plugins-ui — providers, hooks, guards, login
          // buttons) is allowed everywhere it's needed, so it is deliberately
          // NOT in `disallow`.
          { from: { type: ['ui', 'components', 'lib', 'views', 'catalog', 'feature', 'pages', 'templates', 'app'] },
            disallow: [{ dependency: { source: ['@fyre-db/core', '@fyre-db/core/*', '@fyre-db/plugins', '@fyre-db/plugins/*'] } }],
            message: 'fyre-db core/plugins access is restricted to src/services/**. Use a domain service via useServices().' },
        ],
      }],
    },
  },
  {
    // Providers construct the FyreDbApp and bridge observables — the only
    // non-service fyre-db touch-point.
    files: ['src/providers/services-provider.tsx', 'src/providers/app-provider.tsx'],
    rules: { 'boundaries/dependencies': 'off' },
  },
  {
    // Sanctioned app-wide domain widget. `<Money>` reads the active user's
    // currency/locale from `settings$`, so it renders at hundreds of call
    // sites but stays data-aware. Hoisting its tiny data read into feature
    // containers would ripple far more than it's worth. NARROW exception: this
    // file (and only this) may cross the components→providers/services edge.
    // Follow-up: pass currency/locale in as props so it can return to pure
    // `components/`.
    files: [
      'src/components/money.tsx',
    ],
    rules: { 'boundaries/dependencies': 'off' },
  },
  {
    // Import-feature data surfaces. These render stored entity rows
    // (`ImportLog & BaseEntity`) and drive live previews, so they reference a
    // few fyre-db/service types and the stateless `getMailProvider` factory
    // directly. NARROW exception for this trio only. Follow-up: expose the
    // preview fetch + a row view-model through a service method / entities so
    // these go through `useServices()` and the layered graph alone.
    files: [
      'src/features/import/import-surface.tsx',
      'src/features/import/use-email-preview.ts',
      'src/features/settings/sections/imports-section.tsx',
    ],
    rules: {
      'boundaries/dependencies': 'off',
    },
  },
  {
    // The dev entity inspector (already on the `useDb` allowlist) walks raw
    // fyre-db entity definitions to render the debug table — a sanctioned dev
    // touch-point that needs `@fyre-db/core` types and the entity schema.
    files: ['src/features/dev/sections/data-section.tsx'],
    rules: {
      'boundaries/dependencies': 'off',
    },
  },
  {
    // Context-aware shared chrome. These presentational components read
    // cross-cutting CONTEXT (viewport via `useApp`, theme, breadcrumbs, the
    // import sheet) rather than domain data — they live in `components/` for
    // reuse but need their context provider. NARROW exception: components →
    // providers for these files only. Follow-up: inject the context values as
    // props so they return to pure presentational components.
    files: [
      'src/components/adaptive-surface/adaptive-surface.tsx',
      'src/components/breadcrumb-bar.tsx',
      'src/components/section-shell.tsx',
      'src/components/import/dropzone.tsx',
      'src/components/theme-switcher.tsx',
    ],
    rules: { 'boundaries/dependencies': 'off' },
  },
  {
    // Data-wired feature/dev surfaces that read service-owned display helpers
    // (catalog bank/offering display, tagging strength, the notification
    // registry) or a service class type directly. These render domain logic;
    // routing each through a provider method is a larger refactor. NARROW
    // exception. Follow-up: relocate the pure display helpers
    // (catalog / tagging-strength / notification registry) to `lib/`.
    files: [
      'src/features/settings/sections/rules-section.tsx',
      'src/features/settings/sections/rules/rule-card.tsx',
      'src/features/shell/notifications-sheet.tsx',
      'src/features/transactions/notify-tag-similar.ts',
    ],
    rules: { 'boundaries/dependencies': 'off' },
  },
  {
    // The auth client (`clientAuth`) is constructed at the app wiring root
    // (`providers/fyredb-config`) because it depends on `providers/web-storage`.
    // These two services consume that shared singleton; injecting it would
    // ripple through the mail-provider factory. NARROW exception: services →
    // providers for the auth singleton only. Follow-up: inject `clientAuth`.
    files: [
      'src/services/connections-service.ts',
      'src/services/mail/mail-token.ts',
    ],
    rules: { 'boundaries/dependencies': 'off' },
  },
])
