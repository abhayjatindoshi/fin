import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './modules/app-ui/router.tsx'
import { util } from './modules/app/entities/entities.ts'
import { GoogleDriveService } from './modules/app/services/cloud/google-drive/GoogleDriveService.ts'
import { DateStrategy } from './modules/app/store/DateStrategy.ts'
import { DrivePersistence } from './modules/app/store/DrivePersistence.ts'
import { LocalPersistence } from './modules/app/store/LocalPersistence.ts'
import { MemStore } from './modules/app/store/MemStore.ts'
import { AuthProvider, type AuthConfig } from './modules/auth/AuthProvider.tsx'
import { ThemeProvider } from './modules/base-ui/components/theme-provider.tsx'
import { DataSyncProvider } from './modules/data-sync/DataSyncProvider.tsx'

const dayaSyncConfig = {
  util: util,
  store: new MemStore(),
  local: new LocalPersistence(),
  cloud: DrivePersistence.getInstance(),
  strategy: new DateStrategy(),
}

const authConfig: AuthConfig[] = [
  GoogleDriveService.authConfig,
]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme='dark' storageKey='fin-ui-theme'>
      <AuthProvider config={authConfig} storageKey='fin-auth'>
        <DataSyncProvider config={dayaSyncConfig}>
          <AppRouter />
        </DataSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
