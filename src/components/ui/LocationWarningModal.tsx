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
    dismissCount,
    onRecheck,
    rechecking,
}: LocationWarningModalProps) {
    const canForceClose = dismissCount >= 2;

    const handleDismiss = () => {
        if (canForceClose) {
            onDismiss();
        } else {
            onRecheck();
        }
    };

    const formattedDist =
        distanceMeters >= 1000
            ? `${(distanceMeters / 1000).toFixed(1)} km`
            : `${distanceMeters} m`;

    return (
        <div className="security-modal-overlay">
            <motion.div
                className="security-modal"
                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            >
                {/* Header */}
                <div className="security-modal__header security-modal__header--warning">
                    <div className="security-modal__icon-ring security-modal__icon-ring--warning">
                        <AlertTriangle size={28} strokeWidth={1.8} />
                    </div>
                    <div>
                        <h2 className="security-modal__title">Location Verification</h2>
                        <p className="security-modal__subtitle">You appear to be outside the venue boundary</p>
                    </div>
                </div>

                {/* Distance Badge */}
                <div className="security-modal__distance-badge" style={{ marginBottom: '16px' }}>
                    <MapPin size={16} />
                    <span>
                        You are approximately <strong>{formattedDist}</strong> away from{' '}
                        <strong>{venueName}</strong>.
                    </span>
                </div>

                {/* Body */}
                <div className="security-modal__body" style={{ padding: '0 0 var(--space-lg)' }}>
                    <p className="security-modal__intro" style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>
                        If you are currently inside or near the venue, your device might be reporting an inaccurate GPS location. 
                        Please ensure your device Location/GPS Services are enabled, toggle Wi-Fi or Mobile Data to refresh your GPS connection, and step near a window or outside if you are deep inside the building.
                    </p>
                </div>

                {/* Footer */}
                <div className="security-modal__footer">
                    {dismissCount > 0 && !canForceClose && (
                        <p className="security-modal__attempt-note">
                            Still outside the perimeter. One more check remaining.
                        </p>
                    )}
                    {canForceClose && (
                        <p className="security-modal__attempt-note security-modal__attempt-note--final">
                            You may dismiss this notice. Please resolve the issue before your next
                            check-in.
                        </p>
                    )}

                    <button
                        className={`security-modal__btn ${canForceClose ? 'security-modal__btn--dismiss' : 'security-modal__btn--recheck'}`}
                        onClick={handleDismiss}
                        disabled={rechecking}
                    >
                        {rechecking ? (
                            <>
                                <RefreshCw size={16} className="spin" /> Checking location…
                            </>
                        ) : canForceClose ? (
                            <>
                                <X size={16} /> Dismiss
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} /> I've done this — Re-check my location
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
