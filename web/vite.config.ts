import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const certificatePath = new URL('./certs/localhost.pfx', import.meta.url)
const hasCertificate = fs.existsSync(certificatePath)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: hasCertificate
      ? {
        pfx: fs.readFileSync(certificatePath),
        passphrase: process.env.VITE_HTTPS_CERT_PASSWORD ?? 'pasta-list-local-dev',
      }
      : undefined,
    proxy: {
      '/api': {
        target: 'https://localhost:7208',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
