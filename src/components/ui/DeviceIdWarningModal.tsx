import { motion } from 'framer-motion';
import { Smartphone, X, ShieldAlert, RefreshCw } from 'lucide-react';

interface DeviceIdWarningModalProps {
    onDismiss: () => void;
    dismissCount: number;
}

const STEPS = [
    {
        icon: '🌐',
        title: 'Use the Right Browser',
        body: 'Open this attendance app in the same browser you originally used to register or log in for the first time. Your Device ID is tied to that specific browser.',
    },
    {
        icon: '🚫',
        title: 'Avoid Private / Incognito Mode',
        body: 'Private browsing generates a new Device ID each session. Switch to a regular browser window.',
    },
    {
        icon: '📱',
        title: 'Use the Same Device',
        body: 'If you are on a different phone or laptop from usual, switch back to the device you first used to check in.',
    },
    {
        icon: '🛠️',
        title: 'Contact an Admin',
        body: "If your original device is unavailable or you've changed phones, ask an Admin to reset your Device ID for you so you can re-register from your new device.",
    },
];

export function DeviceIdWarningModal({ onDismiss, dismissCount }: DeviceIdWarningModalProps) {
    const canForceClose = dismissCount >= 2;

    return (
        <div className="security-modal-overlay security-modal-overlay--top">
            <motion.div
                className="security-modal"
                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: 24 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            >
                {/* Header */}
                <div className="security-modal__header security-modal__header--danger">
                    <div className="security-modal__icon-ring security-modal__icon-ring--danger">
                        <ShieldAlert size={28} strokeWidth={1.8} />
                    </div>
                    <div>
                        <h2 className="security-modal__title">Device Not Recognised</h2>
                        <p className="security-modal__subtitle">This device doesn't match your registered browser</p>
                    </div>
                </div>

                {/* Info Badge */}
                <div className="security-modal__distance-badge security-modal__distance-badge--danger">
                    <Smartphone size={16} />
                    <span>
                        The <strong>Device ID</strong> on this browser does not match the one saved
                        on your account.
                    </span>
                </div>

                {/* Body */}
                <div className="security-modal__body">
                    <p className="security-modal__intro">
                        For security, attendance can only be recorded from the browser you first
                        registered with. Please follow these steps:
                    </p>

                    <ol className="security-modal__tips">
                        {STEPS.map((step, i) => (
                            <li key={i} className="security-modal__tip">
                                <span className="security-modal__tip-icon">{step.icon}</span>
                                <div>
                                    <strong>{step.title}</strong>
                                    <p>{step.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Footer */}
                <div className="security-modal__footer">
                    {!canForceClose && dismissCount > 0 && (
                        <p className="security-modal__attempt-note">
                            Still mismatched. One more acknowledgement remaining.
                        </p>
                    )}
                    {canForceClose && (
                        <p className="security-modal__attempt-note security-modal__attempt-note--final">
                            You may dismiss. Please resolve this before your next check-in attempt.
                        </p>
                    )}

                    <button
                        className={`security-modal__btn ${canForceClose ? 'security-modal__btn--dismiss' : 'security-modal__btn--recheck'}`}
                        onClick={onDismiss}
                    >
                        {canForceClose ? (
                            <>
                                <X size={16} /> Dismiss
                            </>
                        ) : (
                            <>
                                <RefreshCw size={16} /> I understand — Acknowledge
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
