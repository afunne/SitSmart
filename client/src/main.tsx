import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import './styles/theme.css'
import './styles/radix-overrides.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Colors are remapped to the SitSmart palette in styles/radix-overrides.css. */}
    <Theme appearance="dark" accentColor="ruby" grayColor="mauve" radius="large" panelBackground="solid">
      <App />
    </Theme>
  </StrictMode>,
)
