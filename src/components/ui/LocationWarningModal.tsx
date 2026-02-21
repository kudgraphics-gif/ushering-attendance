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

const TIPS = [
    {
        icon: '📍',
        title: 'Toggle Location Off & On',
        body: 'Go to your phone settings → Location / GPS, turn it off, wait 5 seconds, then turn it back on.',
    },
    {
        icon: '📶',
        title: 'Toggle Mobile Data / Wi-Fi',
        body: 'Turn your data or Wi-Fi off and back on. Sometimes a network refresh gives you a more accurate GPS fix.',
    },
    {
        icon: '🔄',
        title: 'Log Out and Log In Again',
        body: 'After toggling location and data, log out of the app and log back in to trigger a fresh location read.',
    },
    {
        icon: '🏢',
        title: 'Step Outside the Building',
        body: 'GPS signals are often blocked or reflected indoors. Moving outside — even briefly — usually gives a much more accurate reading.',
    },
    {
        icon: '⏱️',
        title: 'Wait 30 Seconds',
        body: 'After enabling location services, wait at least 30 seconds before trying again so your device can lock onto satellites.',
    },
    {
        icon: '🔁',
        title: 'Refresh the App',
        body: 'Close this browser tab completely and reopen it to get a clean location request.',
    },
];

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
            // Trigger a re-check; parent will decide whether to close
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
                        <h2 className="security-modal__title">Location Check</h2>
                        <p className="security-modal__subtitle">You appear to be outside the venue</p>
                    </div>
                </div>

                {/* Distance Badge */}
                <div className="security-modal__distance-badge">
                    <MapPin size={16} />
                    <span>
                        You are approximately <strong>{formattedDist}</strong> away from{' '}
                        <strong>{venueName}</strong>
                    </span>
                </div>

                {/* Tips */}
                <div className="security-modal__body">
                    <p className="security-modal__intro">
                        If you believe you are actually inside the venue, your device may be reading
                        the wrong location. Try the following steps:
                    </p>

                    <ol className="security-modal__tips">
                        {TIPS.map((tip, i) => (
                            <li key={i} className="security-modal__tip">
                                <span className="security-modal__tip-icon">{tip.icon}</span>
                                <div>
                                    <strong>{tip.title}</strong>
                                    <p>{tip.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
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
