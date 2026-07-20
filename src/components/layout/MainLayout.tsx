import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSidebarStore } from '../../stores/sidebarStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProfileCompletionPopup } from '../ui/ProfileCompletionPopup';
import { useAuthStore } from '../../stores/authStore';
import { permissionsAPI } from '../../services/api';
import { Bell } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import { format, parseISO, isValid } from 'date-fns';
import { isIOSDevice } from '../../utils/notifications';
import './MainLayout.css';

function fmtDate(iso: string) {
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'MMM d, yyyy') : iso;
}

export function MainLayout() {
    const sidebarOpen = useSidebarStore((state) => state.isOpen);
    const setSidebarOpen = useSidebarStore((state) => state.setOpen);
    const navigate = useNavigate();

    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const isAdminView = useAuthStore((state) => state.isAdminView);

    const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // ── Check Browser / iOS Notification Permission ──
    useEffect(() => {
        const isIOS = isIOSDevice();
        const dismissed = localStorage.getItem('notification_prompt_dismissed');

        if (!dismissed) {
            if (('Notification' in window && Notification.permission === 'default') || isIOS) {
                // Show prompt modal after 3 seconds for both Android and iPhone users
                const timer = setTimeout(() => setShowPermissionPrompt(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleEnableNotifications = async () => {
        try {
            if ('Notification' in window && typeof Notification.requestPermission === 'function') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.ready.then((registration) => {
                            registration.showNotification("Notifications Enabled", {
                                body: "You will now receive alerts for attendance check-ins and permissions.",
                            });
                        }).catch(() => {
                            new Notification("Notifications Enabled", {
                                body: "You will now receive alerts for attendance check-ins and permissions.",
                            });
                        });
                    } else {
                        new Notification("Notifications Enabled", {
                            body: "You will now receive alerts for attendance check-ins and permissions.",
                        });
                    }
                    toast.success("Browser notifications enabled successfully!");
                } else if (permission === 'denied') {
                    toast.error("Notifications were denied. You can enable them manually in browser settings.");
                }
            } else if (isIOSDevice()) {
                toast.success("iPhone Setup: Tap Share icon below & select 'Add to Home Screen' for push notifications!");
            }
            localStorage.setItem('notification_prompt_dismissed', 'true');
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
                            <div 
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', cursor: 'pointer' }}
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    navigate('/permissions');
                                }}
                            >
                                <span style={{ fontSize: '0.88rem' }}>
                                    🔔 You have <strong>{stats.pending}</strong> unattended permission request{stats.pending > 1 ? 's' : ''} awaiting review.
                                </span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.dismiss(t.id);
                                    }}
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
                            const notification = new Notification("Unattended Permission Requests", {
                                body: `There are ${stats.pending} unattended permission requests awaiting review.`,
                                tag: 'admin-pending-permissions',
                            });
                            notification.onclick = () => {
                                window.focus();
                                navigate('/permissions');
                                notification.close();
                            };
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

    // ── Check User Permissions Decisions (Toast & Push Notification) ──
    useEffect(() => {
        if (!user || !token) return;

        const checkPermissionDecisions = async () => {
            try {
                // Fetch user's own permissions (up to 50 latest)
                const result = await permissionsAPI.getAll(
                    { user_id: user.id, page: 1, size: 50 },
                    token
                );
                
                // Get cached permissions from localStorage
                const cacheKey = `perms_cache_${user.id}`;
                const cachedDataRaw = localStorage.getItem(cacheKey);
                const cache: Record<string, string> = cachedDataRaw ? JSON.parse(cachedDataRaw) : {};
                
                let cacheUpdated = false;
                const newCache: Record<string, string> = { ...cache };

                result.items.forEach((perm) => {
                    const prevStatus = cache[perm.id];
                    
                    // We only notify if the permission was previously known as 'Pending'
                    // and has now transitioned to 'Approved' or 'Rejected'
                    if (prevStatus === 'Pending' && perm.status !== 'Pending') {
                        const dateStr = perm.is_range && perm.end_date !== perm.start_date
                            ? `${fmtDate(perm.start_date)} to ${fmtDate(perm.end_date)}`
                            : fmtDate(perm.start_date);
                        
                        const title = perm.status === 'Approved' ? 'Permission Approved ✅' : 'Permission Rejected ❌';
                        const body = `Your request for ${perm.category} leave (${dateStr}) has been ${perm.status.toLowerCase()}${perm.review_comment ? `: "${perm.review_comment}"` : '.'}`;
                        
                        // Show toast
                        toast((t) => (
                            <div 
                                style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', cursor: 'pointer' }} 
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    navigate('/permissions');
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: perm.status === 'Approved' ? '#34C759' : '#FF453A' }}>
                                    {title}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                                    {body}
                                </div>
                            </div>
                        ), {
                            duration: 8000,
                            id: `perm-decision-${perm.id}`,
                        });

                        // Show browser Push Notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                            const notification = new Notification(title, {
                                body,
                                tag: `perm-decision-${perm.id}`,
                            });
                            notification.onclick = () => {
                                window.focus();
                                navigate('/permissions');
                                notification.close();
                            };
                        }
                    }

                    // Update cached status
                    if (cache[perm.id] !== perm.status) {
                        newCache[perm.id] = perm.status;
                        cacheUpdated = true;
                    }
                });

                if (cacheUpdated) {
                    localStorage.setItem(cacheKey, JSON.stringify(newCache));
                }
            } catch (err) {
                console.error('Failed to check permission decisions for notifications', err);
            }
        };

        // Run after 4 seconds initial delay, then check every 30 seconds
        const initialTimer = setTimeout(checkPermissionDecisions, 4000);
        const interval = setInterval(checkPermissionDecisions, 30000);
        
        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [user, token]);

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
                            {isIOSDevice() && (
                                <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--color-text-primary)', textAlign: 'left' }}>
                                    <strong style={{ color: 'var(--color-primary)' }}>📱 iPhone Users:</strong> Tap Safari's <strong>Share</strong> icon (📤) and select <strong>"Add to Home Screen"</strong> to enable instant push notifications!
                                </div>
                            )}
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
