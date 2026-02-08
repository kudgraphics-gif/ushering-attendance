import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../stores/authStore';
import './PaymentsPage.css';

interface PaymentDetail {
    id: string;
    title: string;
    purpose: string;
    accountName?: string;
    bankName?: string;
    accounts: Array<{
        currency?: string;
        number: string;
    }>;
    sortCode?: string;
    swiftCode?: string;
    address?: string;
    additionalInfo?: string;
}

const DEFAULT_PAYMENTS: PaymentDetail[] = [
    {
        id: '1',
        title: 'Apostle Joshua Selman Account',
        purpose: 'Missions and General Offerings',
        accountName: 'Joshua Selman Nimmak',
        bankName: 'Guaranty Trust Bank',
        accounts: [
            { currency: 'USD', number: '0025782355' },
            { currency: 'GBP', number: '0608522895' },
            { currency: 'EUR', number: '0608522905' },
            { currency: 'NGN', number: '0025782331' },
        ],
        sortCode: '058-203312',
        swiftCode: 'GTBINGLA',
        address: 'Plot 13B Jengri road, Jos Plateau State, Nigeria',
        additionalInfo: 'God bless you',
    },
    {
        id: '2',
        title: 'Departmental Dues',
        purpose: 'Department Operations and Support',
        accountName: 'MUHAMMED BLESSING',
        bankName: 'UBA',
        accounts: [
            { number: '2072105191' },
        ],
    },
    {
        id: '3',
        title: 'Ministry Account',
        purpose: 'Eternity Network International Ministry',
        accountName: 'Eternity Network International',
        bankName: 'GTBANK',
        accounts: [
            { number: '0113343316' },
        ],
        sortCode: '058118119',
        swiftCode: 'GTBINGLA',
        address: '13/15 MANCHESTER ROAD, G.R.A, ZARIA, KADUNA STATE',
    },
    {
        id: '4',
        title: 'International Payments',
        purpose: 'International Transfers via GTB',
        bankName: 'Guaranty Trust Bank (GTB)',
        accounts: [
            { currency: 'USD', number: '0459170230' },
            { currency: 'GBP', number: '0459170247' },
            { currency: 'EUR', number: '0459170089' },
        ],
        swiftCode: 'GTBINGLA',
    },
    {
        id: '5',
        title: 'PayAza Giving',
        purpose: 'Online Giving Platform',
        accounts: [
            { number: 'https://give.payaza.africa/koinonia' },
        ],
    },
];

export function PaymentsPage() {
    const [payments, setPayments] = useState<PaymentDetail[]>(DEFAULT_PAYMENTS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentDetail | undefined>();
    const [formData, setFormData] = useState<Partial<PaymentDetail>>({});
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'Admin';

    // Load payments from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('koinonia_payments');
        if (saved) {
            try {
                setPayments(JSON.parse(saved));
            } catch {
                // Use default if localStorage is corrupted
                localStorage.setItem('koinonia_payments', JSON.stringify(DEFAULT_PAYMENTS));
            }
        } else {
            // Save defaults to localStorage
            localStorage.setItem('koinonia_payments', JSON.stringify(DEFAULT_PAYMENTS));
        }
    }, []);

    // Save to localStorage whenever payments change
    useEffect(() => {
        localStorage.setItem('koinonia_payments', JSON.stringify(payments));
    }, [payments]);

    const handleAddPayment = () => {
        setSelectedPayment(undefined);
        setFormData({
            title: '',
            purpose: '',
            accountName: '',
            bankName: '',
            accounts: [{ number: '' }],
            sortCode: '',
            swiftCode: '',
            address: '',
            additionalInfo: '',
        });
        setIsModalOpen(true);
    };

    const handleEditPayment = (payment: PaymentDetail) => {
        setSelectedPayment(payment);
        setFormData(payment);
        setIsModalOpen(true);
    };

    const handleDeletePayment = (id: string) => {
        if (window.confirm('Are you sure you want to delete this payment detail?')) {
            setPayments(payments.filter(p => p.id !== id));
            toast.success('Payment deleted successfully');
        }
    };

    const handleSavePayment = () => {
        if (!formData.title || !formData.purpose || !formData.accounts?.length) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (selectedPayment) {
            // Update existing
            setPayments(payments.map(p => 
                p.id === selectedPayment.id ? { ...formData, id: selectedPayment.id } as PaymentDetail : p
            ));
            toast.success('Payment updated successfully');
        } else {
            // Create new
            const newPayment: PaymentDetail = {
                ...formData,
                id: Date.now().toString(),
            } as PaymentDetail;
            setPayments([...payments, newPayment]);
            toast.success('Payment added successfully');
        }
        setIsModalOpen(false);
    };

    const handleAddAccount = () => {
        setFormData({
            ...formData,
            accounts: [...(formData.accounts || []), { number: '' }],
        });
    };

    const handleRemoveAccount = (index: number) => {
        const newAccounts = formData.accounts?.filter((_, i) => i !== index) || [];
        setFormData({ ...formData, accounts: newAccounts });
    };

    const handleAccountChange = (index: number, field: string, value: string) => {
        const newAccounts = [...(formData.accounts || [])];
        newAccounts[index] = { ...newAccounts[index], [field]: value };
        setFormData({ ...formData, accounts: newAccounts });
    };

    return (
        <motion.div
            className="payments-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="payments-page__header">
                <div>
                    <h1 className="payments-page__title">Payment Information</h1>
                    <p className="payments-page__subtitle">Donation and Payment Details</p>
                </div>
                {isAdmin && (
                    <Button
                        variant="primary"
                        icon={<Plus size={20} />}
                        onClick={handleAddPayment}
                    >
                        Add Payment
                    </Button>
                )}
            </div>

            {/* Warning Message */}
            <motion.div
                className="payments-page__warning"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="payments-page__warning-icon">
                    <AlertTriangle size={24} />
                </div>
                <div className="payments-page__warning-content">
                    <h3>⚠️ Important Notice</h3>
                    <p>
                        Please carefully read and verify all payment information before making any transfer. 
                        Always double-check account numbers, bank details, and currency type. 
                        We are not responsible for errors made during transaction entry. 
                        For any clarification, contact the ministry leadership.
                    </p>
                </div>
            </motion.div>

            {/* Payment Cards Grid */}
            <div className="payments-page__grid">
                <AnimatePresence>
                    {payments.map((payment, index) => (
                        <motion.div
                            key={payment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card glass hover className="payment-card">
                                <div className="payment-card__header">
                                    <div>
                                        <h3 className="payment-card__title">{payment.title}</h3>
                                        <p className="payment-card__purpose">{payment.purpose}</p>
                                    </div>
                                    {isAdmin && (
                                        <div className="payment-card__actions">
                                            <button
                                                className="payment-card__btn payment-card__btn--edit"
                                                onClick={() => handleEditPayment(payment)}
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="payment-card__btn payment-card__btn--delete"
                                                onClick={() => handleDeletePayment(payment.id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="payment-card__body">
                                    {payment.accountName && (
                                        <div className="payment-detail">
                                            <label className="payment-detail__label">Account Name</label>
                                            <p className="payment-detail__value">{payment.accountName}</p>
                                        </div>
                                    )}

                                    <div className="payment-detail">
                                        <label className="payment-detail__label">Account Numbers</label>
                                        <div className="payment-accounts">
                                            {payment.accounts.map((acc, idx) => (
                                                <div key={idx} className="payment-account">
                                                    {acc.currency && (
                                                        <span className="payment-account__currency">{acc.currency}</span>
                                                    )}
                                                    <span className="payment-account__number">{acc.number}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {payment.bankName && (
                                        <div className="payment-detail">
                                            <label className="payment-detail__label">Bank</label>
                                            <p className="payment-detail__value">{payment.bankName}</p>
                                        </div>
                                    )}

                                    {payment.sortCode && (
                                        <div className="payment-detail">
                                            <label className="payment-detail__label">Sort Code</label>
                                            <p className="payment-detail__value">{payment.sortCode}</p>
                                        </div>
                                    )}

                                    {payment.swiftCode && (
                                        <div className="payment-detail">
                                            <label className="payment-detail__label">Swift Code</label>
                                            <p className="payment-detail__value">{payment.swiftCode}</p>
                                        </div>
                                    )}

                                    {payment.address && (
                                        <div className="payment-detail">
                                            <label className="payment-detail__label">Address</label>
                                            <p className="payment-detail__value">{payment.address}</p>
                                        </div>
                                    )}

                                    {payment.additionalInfo && (
                                        <div className="payment-detail payment-detail--highlight">
                                            <p className="payment-detail__value">{payment.additionalInfo}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedPayment ? 'Edit Payment Details' : 'Add Payment Details'}
            >
                <div className="payment-form">
                    <Input
                        label="Title"
                        placeholder="e.g., Apostle Joshua Selman Account"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <Input
                        label="Purpose"
                        placeholder="e.g., Missions and General Offerings"
                        value={formData.purpose || ''}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        required
                    />

                    <Input
                        label="Account Name (Optional)"
                        placeholder="Account holder name"
                        value={formData.accountName || ''}
                        onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    />

                    <Input
                        label="Bank Name (Optional)"
                        placeholder="Bank name"
                        value={formData.bankName || ''}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />

                    <div className="payment-form__accounts">
                        <label className="payment-form__label">Account Numbers (Required)</label>
                        {formData.accounts?.map((account, idx) => (
                            <div key={idx} className="payment-form__account">
                                <Input
                                    placeholder="Currency (e.g., USD, GBP)"
                                    value={account.currency || ''}
                                    onChange={(e) => handleAccountChange(idx, 'currency', e.target.value)}
                                />
                                <Input
                                    placeholder="Account number"
                                    value={account.number}
                                    onChange={(e) => handleAccountChange(idx, 'number', e.target.value)}
                                    required
                                />
                                {formData.accounts!.length > 1 && (
                                    <button
                                        className="payment-form__remove-account"
                                        onClick={() => handleRemoveAccount(idx)}
                                        type="button"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAddAccount}
                            icon={<Plus size={16} />}
                        >
                            Add Account
                        </Button>
                    </div>

                    <Input
                        label="Sort Code (Optional)"
                        placeholder="Sort code"
                        value={formData.sortCode || ''}
                        onChange={(e) => setFormData({ ...formData, sortCode: e.target.value })}
                    />

                    <Input
                        label="Swift Code (Optional)"
                        placeholder="Swift code"
                        value={formData.swiftCode || ''}
                        onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                    />

                    <Input
                        label="Address (Optional)"
                        placeholder="Bank address"
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />

                    <Input
                        label="Additional Info (Optional)"
                        placeholder="e.g., God bless you"
                        value={formData.additionalInfo || ''}
                        onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    />

                    <div className="payment-form__actions">
                        <Button
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            fullWidth
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSavePayment}
                            fullWidth
                        >
                            {selectedPayment ? 'Update' : 'Add'} Payment
                        </Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}
