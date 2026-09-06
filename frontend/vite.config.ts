import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The browser talks to /api on this same origin and Vite forwards it to the backend.
    // Two things depend on this. The refresh cookie is SameSite=Strict, which only works
    // when the page and the API share an origin. And exposing the app through a tunnel
    // for someone else to try means their browser cannot reach "localhost:8081", because
    // that is their machine, not ours; with the proxy, one tunnel to this port is enough.
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:8081',
        changeOrigin: true,
      },
    },
    // Vite refuses requests whose Host header it does not recognise, which is correct
    // for a dev server and exactly what blocks a tunnel. ngrok domains are allowed so
    // the app can be shown to someone outside this machine.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.dev', '.ngrok.app', '.ngrok.io'],
  },
})
