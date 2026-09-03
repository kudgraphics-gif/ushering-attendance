import { motion } from 'framer-motion';
import { MapPin, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface LocationWarningModalProps {
    distanceMeters: number;
    venueName: string;
    /** Called when the user successfully dismisses (after up to 2 re-checks) */
    onDismiss: () => void;
    /** Current attempt count (1 or 2). Parent manages this. */
    dismissCount: number;
    /** Tell parent to re-check location */
    onRecheck: () => void;
    /** Whether a re-check is currently in progress */
    rechecking: boolean;
}

export function LocationWarningModal({
    distanceMeters,
    venueName,
    onDismiss,
    onRecheck,
    rechecking,
}: LocationWarningModalProps) {
    const formattedDist =
        distanceMeters >= 1000
            ? `${(distanceMeters / 1000).toFixed(1)} km`
            : `${distanceMeters} m`;

    const isWednesday = new Date().getDay() === 3;
    const venueLabel = isWednesday ? 'DOA' : venueName;

    return (
        <div className="security-modal-overlay">
            <motion.div
                className="security-modal"
                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                style={{
                    margin: '20px',
                    width: 'calc(100% - 40px)',
                    maxWidth: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                }}
            >
                {/* Top-Right Dismiss Button */}
                <button
                    onClick={onDismiss}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: 'all 0.2s'
                    }}
                    title="Dismiss alert"
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div className="security-modal__header security-modal__header--warning" style={{ padding: '24px 24px 16px' }}>
                    <div className="security-modal__icon-ring security-modal__icon-ring--warning" style={{ marginRight: '14px' }}>
                        <AlertTriangle size={28} strokeWidth={1.8} />
                    </div>
                    <div>
                        <h2 className="security-modal__title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px' }}>
                            Location Check Failed
                        </h2>
                        <p className="security-modal__subtitle" style={{ fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
                            You appear to be outside the allowed perimeter
                        </p>
                    </div>
                </div>

                {/* Distance Badge */}
                <div className="security-modal__distance-badge" style={{ margin: '12px 24px', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 650 }}>
                        Approximately {formattedDist} away from {venueLabel}
                    </span>
                </div>

                {/* Body */}
                <div className="security-modal__body" style={{ padding: '12px 24px 24px' }}>
                    <p className="security-modal__intro" style={{ margin: '0 0 16px 0', fontSize: '0.92rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        Your device is reading that you're far from <strong>{venueLabel}</strong>. 
                        Kindly refresh your location, toggle your GPS/Location Services off and on, or step near a window/outside if you are currently deep inside a building to get a stronger signal.
                    </p>
                </div>

                {/* Footer */}
                <div className="security-modal__footer" style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        className="security-modal__btn security-modal__btn--recheck"
                        onClick={onRecheck}
                        disabled={rechecking}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        {rechecking ? (
                            <>
                                <RefreshCw size={16} className="spin" /> Updating Location…
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} /> Refresh My Location
                            </>
                        )}
                    </button>

                    <button
                        className="security-modal__btn security-modal__btn--dismiss"
                        onClick={onDismiss}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={14} /> Dismiss Alert
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
