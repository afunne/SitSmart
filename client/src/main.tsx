import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import { Toaster } from 'sonner'
import '@radix-ui/themes/styles.css'
import './styles/theme.css'
import './styles/radix-overrides.css'
import './styles/toast.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Colors are remapped to the SitSmart palette in styles/radix-overrides.css. */}
    <Theme appearance="dark" accentColor="ruby" grayColor="mauve" radius="large" panelBackground="solid">
      <App />
      {/* Outside the routes, so a toast stays visible across navigation. Colors: styles/toast.css. */}
      <Toaster theme="dark" position="top-center" />
    </Theme>
  </StrictMode>,
)
