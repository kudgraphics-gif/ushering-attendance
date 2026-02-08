import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
// Initialize theme immediately (before rendering)
import './stores/themeStore'
import './styles/theme.css'
import './styles/global.css'
import './styles/forms.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 4000,
                style: {
                    fontSize: '14px',
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                },
                success: {
                    style: {
                        background: 'linear-gradient(135deg, #2E8B57 0%, #3CB371 100%)',
                        color: 'white',
                    },
                },
                error: {
                    style: {
                        background: 'linear-gradient(135deg, #B22222 0%, #DC143C 100%)',
                        color: 'white',
                    },
                },
            }}
        />
        <App />
    </StrictMode>,
)
