import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import toast, { Toaster, ToastBar } from 'react-hot-toast'
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
                    backgroundColor: 'rgba(22, 24, 30, 0.85)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
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
        >
            {(t) => (
                <ToastBar toast={t}>
                    {({ icon, message }) => (
                        <div
                            onClick={() => toast.dismiss(t.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                width: '100%',
                            }}
                        >
                            {icon}
                            <div style={{ flex: 1 }}>{message}</div>
                            {t.type !== 'loading' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.dismiss(t.id);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'inherit',
                                        opacity: 0.7,
                                        cursor: 'pointer',
                                        padding: '0 4px',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        marginLeft: '6px'
                                    }}
                                    title="Dismiss notification"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}
                </ToastBar>
            )}
        </Toaster>
        <App />
    </StrictMode>,
)
