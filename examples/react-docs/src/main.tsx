// Import polyfills first
import './polyfills'

// The vite-plugin-node-polyfills handles most polyfills automatically
// Just ensure global is available for Solana/Metaplex libraries
if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Initialize Prism.js - core must be imported first
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
) 