import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './modules/app-ui/router.tsx'
import { ThemeProvider } from './modules/base-ui/components/theme-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme='dark' storageKey='fin-ui-theme'>
      <AppRouter />
    </ThemeProvider>
  </StrictMode>,
)
