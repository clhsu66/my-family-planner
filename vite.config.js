import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Let env control the base. Default to your GitHub Pages path for web.
const base = process.env.VITE_BASE || '/financial-planner/'

export default defineConfig({
  plugins: [react()],
  base: 'my-family-plannner'
})