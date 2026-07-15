import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebarStore } from '../../stores/sidebarStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProfileCompletionPopup } from '../ui/ProfileCompletionPopup';
import { useAuthStore } from '../../stores/authStore';
import { permissionsAPI } from '../../services/api';
import { Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import './MainLayout.css';

export function MainLayout() {
    const sidebarOpen = useSidebarStore((state) => state.isOpen);
    const setSidebarOpen = useSidebarStore((state) => state.setOpen);

    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const isAdminView = useAuthStore((state) => state.isAdminView);

    const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // ── Check Browser Notification Permission ──
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            // Show prompt modal after 3 seconds
            const timer = setTimeout(() => setShowPermissionPrompt(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleEnableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification("Notifications Enabled", {
                    body: "You will now receive alerts for attendance check-ins and permissions.",
                });
                toast.success("Browser notifications enabled successfully!");
            } else if (permission === 'denied') {
                toast.error("Notifications were denied. You can enable them manually in browser settings.");
            }
            setShowPermissionPrompt(false);
        } catch (err) {
            console.error("Error requesting browser notifications", err);
            setShowPermissionPrompt(false);
        }
    };

    // ── Check Pending Permissions (Admin Alert) ──
    useEffect(() => {
        if (user?.role === 'Admin' && token && isAdminView) {
            const checkUnattendedPermissions = async () => {
                try {
                    const stats = await permissionsAPI.getStats(token);
                    if (stats.pending > 0) {
                        // Toast notification
                        toast((t) => (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                                <span style={{ fontSize: '0.88rem' }}>
                                    🔔 You have <strong>{stats.pending}</strong> unattended permission request{stats.pending > 1 ? 's' : ''} awaiting review.
                                </span>
                                <button 
                                    onClick={() => toast.dismiss(t.id)}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: '6px',
                                        color: 'var(--color-primary, #D4AF37)',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        fontWeight: '700',
                                        padding: '4px 10px',
                                        marginLeft: 'auto',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
                                    }}
                                    onMouseOut={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                                    }}
                                >
                                    Dismiss
                                </button>
                            </div>
                        ), {
                            duration: 12000,
                            id: 'admin-pending-permissions-alert',
                        });

                        // Browser Push notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification("Unattended Permission Requests", {
                                body: `There are ${stats.pending} unattended permission requests awaiting review.`,
                                tag: 'admin-pending-permissions',
                            });
                        }
                    }
                } catch (err) {
                    console.error('Failed to query pending permissions stats for alert', err);
                }
            };
            
            const timer = setTimeout(checkUnattendedPermissions, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, token, isAdminView]);

    return (
        <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <ProfileCompletionPopup />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main-layout__content">
                <Header onMenuClick={toggleSidebar} />
                <main className="main-layout__main">
                    <Outlet />
                </main>
            </div>

            {sidebarOpen && (
                <div
                    className="main-layout__overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Browser notification permission request pop-up */}
            {showPermissionPrompt && (
                <div className="security-modal-overlay security-modal-overlay--top" style={{ zIndex: 10000 }}>
                    <div className="security-modal" style={{ maxWidth: '420px', padding: 'var(--space-xl)', textAlign: 'center' }}>
                        <div className="security-modal__header security-modal__header--warning" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                            <div className="security-modal__icon-ring security-modal__icon-ring--warning" style={{ margin: 0 }}>
                                <Bell size={28} strokeWidth={1.8} />
                            </div>
                            <div>
                                <h2 className="security-modal__title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Enable Notifications</h2>
                                <p className="security-modal__subtitle" style={{ fontSize: '0.8rem' }}>Required for attendance alerts</p>
                            </div>
                        </div>

                        <div className="security-modal__body" style={{ padding: 'var(--space-md) 0 var(--space-lg)' }}>
                            <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', lineHeight: '1.5', margin: 0 }}>
                                Please enable browser notifications to ensure you receive real-time updates on your permission approvals, roster changes, and check-in windows.
                            </p>
                        </div>

                        <div className="security-modal__footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: 0, border: 'none', background: 'none' }}>
                            <Button variant="primary" onClick={handleEnableNotifications} style={{ width: '100%' }}>
                                Enable Notifications
                            </Button>
                            <button 
                                onClick={() => setShowPermissionPrompt(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    padding: '4px',
                                    marginTop: '4px'
                                }}
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
