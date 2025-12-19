import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // Enable fast refresh
    fastRefresh: true,
    // Include .jsx files
    include: '**/*.{jsx,js}',
  })],
  base: '/', // Ensure correct base path for deployment
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true, // Automatically open browser
    hmr: {
      overlay: true, // Show errors as overlay
    },
    watch: {
      // Watch for changes in these file patterns
      usePolling: true, // Useful for WSL/Docker environments
      interval: 100, // Check every 100ms
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Optimize dependencies for faster rebuilds
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  // Enhanced build options
  build: {
    sourcemap: true, // Enable source maps for better debugging
    outDir: 'dist', // Ensure correct output directory
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})