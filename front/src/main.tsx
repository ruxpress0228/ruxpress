import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { useAndroidBridge } from './hooks/useAndroidBridge'
import { I18nProvider } from './i18n/I18nProvider'
import { router } from './routes'
import './styles/index.css'

function AndroidBridgeBootstrap() {
  useAndroidBridge()
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AndroidBridgeBootstrap />
      <RouterProvider router={router} />
    </I18nProvider>
  </StrictMode>,
)
