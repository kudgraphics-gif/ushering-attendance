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
                style={{
                    margin: '20px',
                    width: 'calc(100% - 40px)',
                    maxWidth: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                }}
            >
                {/* Header */}
                <div className="security-modal__header security-modal__header--danger" style={{ padding: '24px 24px 16px' }}>
                    <div className="security-modal__icon-ring security-modal__icon-ring--danger" style={{ marginRight: '14px' }}>
                        <ShieldAlert size={28} strokeWidth={1.8} />
                    </div>
                    <div>
                        <h2 className="security-modal__title" style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px' }}>
                            Device Verification Failed
                        </h2>
                        <p className="security-modal__subtitle" style={{ fontSize: '0.85rem', margin: 0, opacity: 0.8 }}>
                            Device profile mismatch detected
                        </p>
                    </div>
                </div>

                {/* Info Badge */}
                <div className="security-modal__distance-badge security-modal__distance-badge--danger" style={{ margin: '12px 24px', padding: '12px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Smartphone size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 650 }}>
                        Current Browser has a different Device ID
                    </span>
                </div>

                {/* Body */}
                <div className="security-modal__body" style={{ padding: '12px 24px 24px' }}>
                    <p className="security-modal__intro" style={{ margin: '0 0 16px 0', fontSize: '0.92rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                        For security, attendance can only be logged using the same browser and phone/laptop you originally registered with. 
                        If you switched browsers, are in private mode, or got a new device, kindly ask an Admin to reset your bound Device ID.
                    </p>
                </div>

                {/* Footer */}
                <div className="security-modal__footer" style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {!canForceClose && dismissCount > 0 && (
                        <p className="security-modal__attempt-note" style={{ margin: '0 0 12px 0', textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
                            Still mismatched. One acknowledgement remaining.
                        </p>
                    )}
                    {canForceClose && (
                        <p className="security-modal__attempt-note security-modal__attempt-note--final" style={{ margin: '0 0 12px 0', textAlign: 'center', fontSize: '0.82rem', color: '#34C759' }}>
                            Acknowledge warning to proceed. Please resolve this before your next shift.
                        </p>
                    )}

                    <button
                        className={`security-modal__btn ${canForceClose ? 'security-modal__btn--dismiss' : 'security-modal__btn--recheck'}`}
                        onClick={onDismiss}
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
                        {canForceClose ? (
                            <>
                                <X size={16} /> Acknowledge & Dismiss
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
