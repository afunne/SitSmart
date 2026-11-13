import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// ASP.NET API from Piletimyyk.Api/Properties/launchSettings.json ("http" profile).
const apiUrl = 'http://localhost:5237'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': apiUrl,
      '/ws': { target: apiUrl, ws: true },
    },
  },
  build: {
    // ASP.NET serves the built app from wwwroot (UseDefaultFiles + UseStaticFiles).
    outDir: '../Piletimyyk.Api/wwwroot',
    emptyOutDir: true,
  },
})
