import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import ClerkTokenBridge from './components/ClerkTokenBridge.tsx'
import { CLERK_PUBLISHABLE_KEY, isClerkAuth } from './lib/auth.ts'

const appTree = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

if (isClerkAuth && !CLERK_PUBLISHABLE_KEY) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is required when VITE_AUTH_MODE=clerk')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isClerkAuth ? (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!}>
        <ClerkTokenBridge />
        {appTree}
      </ClerkProvider>
    ) : (
      appTree
    )}
  </StrictMode>,
)
