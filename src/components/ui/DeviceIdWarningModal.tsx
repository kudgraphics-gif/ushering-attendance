import { motion } from 'framer-motion';
import { Smartphone, X, ShieldAlert, RefreshCw } from 'lucide-react';

interface DeviceIdWarningModalProps {
    onDismiss: () => void;
    dismissCount: number;
}

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
                        <h2 className="security-modal__title">Device Mismatch</h2>
                        <p className="security-modal__subtitle">This browser doesn't match your registered device</p>
                    </div>
                </div>

                {/* Info Badge */}
                <div className="security-modal__distance-badge security-modal__distance-badge--danger" style={{ marginBottom: '16px' }}>
                    <Smartphone size={16} />
                    <span>
                        The browser profile you are currently using has a different <strong>Device ID</strong>.
                    </span>
                </div>

                {/* Body */}
                <div className="security-modal__body" style={{ padding: '0 0 var(--space-lg)' }}>
                    <p className="security-modal__intro" style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.5' }}>
                        To log attendance, please open this app in the browser/device you used when you originally registered. 
                        If you have changed devices, switched browsers, or are using incognito/private mode, you can request an Admin to reset your bound Device ID.
                    </p>
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
