import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: '0.0.0.0',
  //   port: 5173,
  //   strictPort: true,
  //   hmr: {
  //     port: 5173,
  //     host: '0.0.0.0'
  //   },
  //   // Allow external domain access for Kubernetes ingress
  //   allowedHosts: [
  //     '.vigneshks.tech',
  //     '.davish.tech',
  //     'localhost'
  //   ]
  // },
  // preview: {
  //   host: '0.0.0.0',
  //   port: 5174,
  //   strictPort: true,
  //   // Allow external domain access for preview mode
  //   allowedHosts: [
  //     '.vigneshks.tech', 
  //     '.davish.tech',
  //     'localhost'
  //   ]
  // }
})
