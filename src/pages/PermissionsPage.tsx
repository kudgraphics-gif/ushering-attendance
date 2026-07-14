import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    ShieldAlert, CheckCircle2, XCircle, Clock, X, ChevronRight, ChevronLeft,
    CalendarDays, CalendarRange, Eye, RefreshCw, Search, Filter, Bold, Italic,
    List, Strikethrough, Undo2, Redo2, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, isValid } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import './PermissionsPage.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveCategory = 'Sickness' | 'Travelling' | 'Work Commitment' | 'Other';
type DurationType  = 'single' | 'range';
type LeaveStatus   = 'pending' | 'approved' | 'declined';

interface LeaveApplication {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    category: LeaveCategory;
    durationType: DurationType;
    startDate: string;
    endDate?: string;
    letterHtml: string;
    status: LeaveStatus;
    adminReason?: string;
    submittedAt: string;
    reviewedAt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kd_leave_applications';

const CATEGORIES: { key: LeaveCategory; emoji: string; label: string; desc: string; gradient: string }[] = [
    {
        key: 'Sickness',
        emoji: '🤒',
        label: 'Sickness',
        desc: 'Feeling unwell or recovering from illness',
        gradient: 'linear-gradient(135deg, rgba(255,69,58,0.12), rgba(255,69,58,0.04))',
    },
    {
        key: 'Travelling',
        emoji: '✈️',
        label: 'Travelling',
        desc: 'Out of town or away from Abuja',
        gradient: 'linear-gradient(135deg, rgba(10,132,255,0.12), rgba(10,132,255,0.04))',
    },
    {
        key: 'Work Commitment',
        emoji: '💼',
        label: 'Work Commitment',
        desc: 'Professional obligation requiring your presence',
        gradient: 'linear-gradient(135deg, rgba(255,159,10,0.12), rgba(255,159,10,0.04))',
    },
    {
        key: 'Other',
        emoji: '📝',
        label: 'Other',
        desc: 'Any other reason not listed above',
        gradient: 'linear-gradient(135deg, rgba(175,82,222,0.12), rgba(175,82,222,0.04))',
    },
];

const STEPS = ['Category', 'Duration & Date', 'Letter', 'Review'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadApplications(): LeaveApplication[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveApplications(apps: LeaveApplication[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fmtDate(iso: string) {
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'MMM d, yyyy') : iso;
}

function fmtTimestamp(iso: string) {
    const d = parseISO(iso);
    return isValid(d) ? format(d, "MMM d, yyyy 'at' h:mm a") : iso;
}

function buildTemplate(category: LeaveCategory, name: string, startDate: string, endDate?: string): string {
    const dateStr = endDate
        ? `${fmtDate(startDate)} to ${fmtDate(endDate)}`
        : fmtDate(startDate);
    const returnDate = endDate ? fmtDate(endDate) : fmtDate(startDate);

    const templates: Record<LeaveCategory, string> = {
        Sickness:
            `<p>Dear HOD &amp; Secretary,</p><p>I, <strong>${name}</strong>, write to inform you that I am currently unwell and will be unable to attend and serve at the service scheduled for <strong>${dateStr}</strong>. I expect to recover and return by <strong>${returnDate}</strong>.</p><p>I sincerely apologise for any inconvenience this may cause and will ensure to communicate my return promptly. Thank you for your understanding and continued support.</p><p>Yours faithfully,<br/><strong>${name}</strong></p>`,
        Travelling:
            `<p>Dear HOD &amp; Secretary,</p><p>I, <strong>${name}</strong>, write to notify you that I will be travelling and will be unavailable for service on <strong>${dateStr}</strong>. I will resume my duties by <strong>${returnDate}</strong>.</p><p>I remain committed to my responsibilities and have made arrangements to ensure my absence causes minimal disruption. Thank you for your understanding.</p><p>Yours faithfully,<br/><strong>${name}</strong></p>`,
        'Work Commitment':
            `<p>Dear HOD &amp; Secretary,</p><p>I, <strong>${name}</strong>, humbly request permission to be absent from service on <strong>${dateStr}</strong> due to a professional work commitment that requires my presence. I will resume my duties by <strong>${returnDate}</strong>.</p><p>I deeply value my role in the ushering department and regret that I am unable to serve on this occasion. Thank you for your kind consideration.</p><p>Yours faithfully,<br/><strong>${name}</strong></p>`,
        Other:
            `<p>Dear HOD &amp; Secretary,</p><p>I, <strong>${name}</strong>, write to request permission to be absent from service on <strong>${dateStr}</strong>. [Please describe your reason here]. I will resume my duties by <strong>${returnDate}</strong>.</p><p>I apologise for any inconvenience this may cause and thank you for your understanding and support.</p><p>Yours faithfully,<br/><strong>${name}</strong></p>`,
    };
    return templates[category];
}

function StatusBadge({ status }: { status: LeaveStatus }) {
    const config: Record<LeaveStatus, { icon: React.ReactNode; label: string }> = {
        pending:  { icon: <Clock size={11} />,         label: 'Pending' },
        approved: { icon: <CheckCircle2 size={11} />,  label: 'Approved' },
        declined: { icon: <XCircle size={11} />,       label: 'Declined' },
    };
    const { icon, label } = config[status];
    return (
        <span className={`perms__badge perms__badge--${status}`}>
            {icon}{label}
        </span>
    );
}

// ─── Tiptap WYSIWYG Editor ────────────────────────────────────────────────────

interface WYSIWYGProps {
    content: string;
    onChange: (html: string) => void;
    readOnly?: boolean;
}

function WYSIWYGEditor({ content, onChange, readOnly = false }: WYSIWYGProps) {
    const editor = useEditor({
        extensions: [StarterKit],
        content,
        editable: !readOnly,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    // Sync content when template changes
    useEffect(() => {
        if (editor && !editor.isDestroyed) {
            const current = editor.getHTML();
            if (current !== content && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content]);

    if (readOnly) {
        return (
            <div
                className="perms__modal-letter"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return (
        <div className="perms__editor-wrap">
            {editor && (
                <div className="perms__editor-toolbar">
                    <button type="button" className={`perms__editor-btn ${editor.isActive('bold') ? 'perms__editor-btn--active' : ''}`} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></button>
                    <button type="button" className={`perms__editor-btn ${editor.isActive('italic') ? 'perms__editor-btn--active' : ''}`} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></button>
                    <button type="button" className={`perms__editor-btn ${editor.isActive('strike') ? 'perms__editor-btn--active' : ''}`} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough"><Strikethrough size={14} /></button>
                    <div className="perms__editor-sep" />
                    <button type="button" className={`perms__editor-btn ${editor.isActive('bulletList') ? 'perms__editor-btn--active' : ''}`} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List"><List size={14} /></button>
                    <div className="perms__editor-sep" />
                    <button type="button" className="perms__editor-btn" onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo2 size={14} /></button>
                    <button type="button" className="perms__editor-btn" onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo2 size={14} /></button>
                </div>
            )}
            <div className="perms__editor-content">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
    return (
        <div className="perms__steps">
            {STEPS.map((label, i) => (
                <div key={label} className="perms__step" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div className={`perms__step-bubble ${i < step ? 'perms__step-bubble--done' : i === step ? 'perms__step-bubble--active' : ''}`}>
                        {i < step ? <Check size={14} /> : i + 1}
                    </div>
                    <span className={`perms__step-label ${i === step ? 'perms__step-label--active' : ''}`}>{label}</span>
                    {i < STEPS.length - 1 && (
                        <div className={`perms__step-connector ${i < step ? 'perms__step-connector--done' : ''}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── User View ────────────────────────────────────────────────────────────────

function UserPermissions() {
    const { user } = useAuthStore();
    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Member';

    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [category, setCategory] = useState<LeaveCategory | null>(null);
    const [durationType, setDurationType] = useState<DurationType | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [letterHtml, setLetterHtml] = useState('');

    const today = new Date().toISOString().split('T')[0];

    // Load my applications
    useEffect(() => {
        const all = loadApplications();
        const mine = all.filter(a => a.userId === (user?.id || user?.email || ''));
        setApplications(mine.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }, [submitted]);

    // Auto-fill template when all selection is complete
    useEffect(() => {
        if (category && startDate) {
            setLetterHtml(buildTemplate(category, userName, startDate, durationType === 'range' ? endDate : undefined));
        }
    }, [category, startDate, endDate, durationType]);

    const canProceedStep0 = !!category;
    const canProceedStep1 = !!durationType && !!startDate && (durationType === 'single' || !!endDate);
    const canProceedStep2 = letterHtml.trim().length > 0 && letterHtml !== '<p></p>';

    const handleSubmit = async () => {
        if (!user || !category || !durationType || !startDate) {
            toast.error('Please complete all fields');
            return;
        }
        setLoading(true);
        await new Promise(r => setTimeout(r, 800)); // simulate async
        const app: LeaveApplication = {
            id: generateId(),
            userId: user.id || user.email || '',
            userName,
            userEmail: user.email || '',
            category,
            durationType,
            startDate,
            endDate: durationType === 'range' ? endDate : undefined,
            letterHtml,
            status: 'pending',
            submittedAt: new Date().toISOString(),
        };
        const all = loadApplications();
        saveApplications([...all, app]);
        setLoading(false);
        setSubmitted(true);
        toast.success('Permission request submitted!');
    };

    const resetForm = () => {
        setStep(0);
        setCategory(null);
        setDurationType(null);
        setStartDate('');
        setEndDate('');
        setLetterHtml('');
        setSubmitted(false);
    };

    if (submitted) {
        return (
            <motion.div className="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="perms__header">
                    <h1 className="perms__title">Permissions</h1>
                    <p className="perms__subtitle">Manage your leave requests</p>
                </div>
                <Card glass>
                    <motion.div
                        className="perms__success"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    >
                        <div className="perms__success-icon">
                            <CheckCircle2 size={36} />
                        </div>
                        <h2 className="perms__success-title">Request Submitted!</h2>
                        <p className="perms__success-body">
                            Your {category} leave request has been submitted to the HOD and Secretary.
                            You will be notified once it has been reviewed. Check your applications below.
                        </p>
                        <Button variant="primary" icon={<ShieldAlert size={16} />} onClick={resetForm}>
                            New Request
                        </Button>
                    </motion.div>
                </Card>

                <UserApplicationsList
                    applications={applications}
                    expandedId={expandedId}
                    setExpandedId={setExpandedId}
                />
            </motion.div>
        );
    }

    return (
        <motion.div className="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="perms__header">
                <h1 className="perms__title">Permissions</h1>
                <p className="perms__subtitle">Submit a leave request addressed to the HOD & Secretary</p>
            </div>

            <StepIndicator step={step} />

            <AnimatePresence mode="wait">
                {/* ── Step 0: Category ── */}
                {step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                        <Card glass>
                            <div className="perms__section">
                                <div className="perms__section-title">
                                    <ShieldAlert size={18} className="perms__section-title-icon" />
                                    What is the reason for your leave?
                                </div>
                                <div className="perms__categories">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            className={`perms__cat-card ${category === cat.key ? 'perms__cat-card--selected' : ''}`}
                                            style={{ background: category === cat.key ? undefined : cat.gradient }}
                                            onClick={() => setCategory(cat.key)}
                                        >
                                            <div className="perms__cat-icon">{cat.emoji}</div>
                                            <div className="perms__cat-name">{cat.label}</div>
                                            <div className="perms__cat-desc">{cat.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                <div className="perms__actions">
                                    <Button variant="primary" icon={<ChevronRight size={16} />} disabled={!canProceedStep0} onClick={() => setStep(1)}>
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ── Step 1: Duration & Date ── */}
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                        <Card glass>
                            <div className="perms__section">
                                <div className="perms__section-title">
                                    <CalendarDays size={18} className="perms__section-title-icon" />
                                    How long will you be away?
                                </div>

                                <div className="perms__duration">
                                    <button
                                        type="button"
                                        className={`perms__dur-btn ${durationType === 'single' ? 'perms__dur-btn--selected' : ''}`}
                                        onClick={() => setDurationType('single')}
                                    >
                                        <div className="perms__dur-icon"><CalendarDays size={28} /></div>
                                        <span>Single Day</span>
                                        <span className="perms__dur-sub">I'll be away for one service</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`perms__dur-btn ${durationType === 'range' ? 'perms__dur-btn--selected' : ''}`}
                                        onClick={() => setDurationType('range')}
                                    >
                                        <div className="perms__dur-icon"><CalendarRange size={28} /></div>
                                        <span>Date Range</span>
                                        <span className="perms__dur-sub">I'll be away for multiple days</span>
                                    </button>
                                </div>

                                {durationType && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`perms__dates ${durationType === 'single' ? 'perms__dates--single' : ''}`}
                                    >
                                        <div className="perms__date-group">
                                            <label className="perms__date-label">
                                                {durationType === 'single' ? 'Absence Date' : 'Start Date'}
                                            </label>
                                            <input
                                                type="date"
                                                className="perms__date-input"
                                                value={startDate}
                                                min={today}
                                                onChange={e => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        {durationType === 'range' && (
                                            <div className="perms__date-group">
                                                <label className="perms__date-label">End Date</label>
                                                <input
                                                    type="date"
                                                    className="perms__date-input"
                                                    value={endDate}
                                                    min={startDate || today}
                                                    onChange={e => setEndDate(e.target.value)}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                <div className="perms__actions">
                                    <Button variant="secondary" icon={<ChevronLeft size={16} />} onClick={() => setStep(0)}>Back</Button>
                                    <Button variant="primary" icon={<ChevronRight size={16} />} disabled={!canProceedStep1} onClick={() => setStep(2)}>
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ── Step 2: Letter ── */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                        <Card glass>
                            <div className="perms__section">
                                <div className="perms__section-title">
                                    ✉️&nbsp; Your Permission Letter
                                </div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: -8, marginBottom: 16 }}>
                                    We've pre-filled a letter for you. Feel free to edit it to suit your situation.
                                </p>
                                <div className="perms__editor-label">Letter Content</div>
                                <WYSIWYGEditor content={letterHtml} onChange={setLetterHtml} />
                                <div className="perms__actions">
                                    <Button variant="secondary" icon={<ChevronLeft size={16} />} onClick={() => setStep(1)}>Back</Button>
                                    <Button variant="primary" icon={<ChevronRight size={16} />} disabled={!canProceedStep2} onClick={() => setStep(3)}>
                                        Review & Submit
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* ── Step 3: Review ── */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}>
                        <Card glass>
                            <div className="perms__section">
                                <div className="perms__section-title">
                                    🔍&nbsp; Review Your Application
                                </div>

                                {/* Summary */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                                    {[
                                        { label: 'Category', value: CATEGORIES.find(c => c.key === category)?.emoji + ' ' + category },
                                        { label: 'Duration', value: durationType === 'single' ? 'Single Day' : 'Date Range' },
                                        { label: 'Date', value: durationType === 'range' ? `${fmtDate(startDate)} → ${fmtDate(endDate)}` : fmtDate(startDate) },
                                    ].map(item => (
                                        <div key={item.label} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{item.label}</div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Letter preview */}
                                <div className="perms__editor-label">Your Letter (Preview)</div>
                                <WYSIWYGEditor content={letterHtml} onChange={setLetterHtml} readOnly />

                                <div className="perms__actions">
                                    <Button variant="secondary" icon={<ChevronLeft size={16} />} onClick={() => setStep(2)}>Edit Letter</Button>
                                    <Button variant="primary" icon={<CheckCircle2 size={16} />} loading={loading} onClick={handleSubmit}>
                                        Submit Request
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* My Applications */}
            <UserApplicationsList
                applications={applications}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
            />
        </motion.div>
    );
}

// ─── User Application List Component ─────────────────────────────────────────

function UserApplicationsList({ applications, expandedId, setExpandedId }: {
    applications: LeaveApplication[];
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
}) {
    if (applications.length === 0) return null;

    const catEmoji = (c: LeaveCategory) => CATEGORIES.find(x => x.key === c)?.emoji || '📝';

    return (
        <div style={{ marginTop: 'var(--space-2xl)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 'var(--space-md)' }}>
                My Applications
            </h2>
            <div className="perms__app-list">
                {applications.map((app, i) => (
                    <motion.div
                        key={app.id}
                        className="perms__app-card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    >
                        <div className="perms__app-icon">{catEmoji(app.category)}</div>
                        <div className="perms__app-body">
                            <div className="perms__app-title">{app.category} Leave</div>
                            <div className="perms__app-meta">
                                <span>
                                    {app.durationType === 'range' && app.endDate
                                        ? `${fmtDate(app.startDate)} → ${fmtDate(app.endDate)}`
                                        : fmtDate(app.startDate)}
                                </span>
                                <span>Submitted {fmtTimestamp(app.submittedAt)}</span>
                                <StatusBadge status={app.status} />
                            </div>
                            <AnimatePresence>
                                {expandedId === app.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="perms__app-reason" dangerouslySetInnerHTML={{ __html: app.letterHtml }} />
                                        {app.adminReason && (
                                            <div className="perms__app-reason" style={{ marginTop: 8, borderColor: app.status === 'approved' ? 'rgba(52,199,89,0.2)' : 'rgba(255,69,58,0.2)' }}>
                                                <strong style={{ color: app.status === 'approved' ? '#34C759' : '#FF453A' }}>
                                                    {app.status === 'approved' ? '✅ Approved' : '❌ Declined'}:
                                                </strong>{' '}{app.adminReason}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, transform: expandedId === app.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Admin View ───────────────────────────────────────────────────────────────

function AdminPermissions() {
    const [applications, setApplications] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<LeaveStatus | ''>('');
    const [filterCategory, setFilterCategory] = useState<LeaveCategory | ''>('');
    const [selected, setSelected] = useState<LeaveApplication | null>(null);
    const [adminReason, setAdminReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchApplications = () => {
        setLoading(true);
        setTimeout(() => {
            const all = loadApplications();
            setApplications(all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
            setLoading(false);
        }, 400);
    };

    useEffect(() => { fetchApplications(); }, []);

    const handleAction = (status: 'approved' | 'declined') => {
        if (!selected) return;
        setActionLoading(true);
        setTimeout(() => {
            const all = loadApplications();
            const updated = all.map(a =>
                a.id === selected.id
                    ? { ...a, status, adminReason, reviewedAt: new Date().toISOString() }
                    : a
            );
            saveApplications(updated);
            setApplications(updated.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
            setSelected(null);
            setAdminReason('');
            setActionLoading(false);
            toast.success(`Application ${status}!`);
        }, 600);
    };

    const filtered = applications.filter(a => {
        const matchSearch = `${a.userName} ${a.userEmail}`.toLowerCase().includes(search.toLowerCase());
        const matchStatus = !filterStatus || a.status === filterStatus;
        const matchCat = !filterCategory || a.category === filterCategory;
        return matchSearch && matchStatus && matchCat;
    });

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        declined: applications.filter(a => a.status === 'declined').length,
    };

    const catEmoji = (c: LeaveCategory) => CATEGORIES.find(x => x.key === c)?.emoji || '📝';

    return (
        <motion.div className="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="perms__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="perms__title">Permissions</h1>
                    <p className="perms__subtitle">Review and manage member leave requests</p>
                </div>
                <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={fetchApplications} loading={loading} size="sm">Refresh</Button>
            </div>

            {/* Stats */}
            <div className="perms__stats">
                {[
                    { label: 'Total', num: stats.total, color: 'var(--color-primary)' },
                    { label: 'Pending', num: stats.pending, color: '#FFC400' },
                    { label: 'Approved', num: stats.approved, color: '#34C759' },
                    { label: 'Declined', num: stats.declined, color: '#FF453A' },
                ].map(s => (
                    <Card glass key={s.label} className="perms__stat-card">
                        <div className="perms__stat-num" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}99)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
                        <div className="perms__stat-label">{s.label}</div>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <div className="perms__filters">
                <Search size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                <input
                    className="perms__filter-input"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Filter size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                <select className="perms__filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as LeaveStatus | '')}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                </select>
                <select className="perms__filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value as LeaveCategory | '')}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
            </div>

            {/* Table / List */}
            {loading ? (
                <div className="perms__empty">
                    <RefreshCw size={32} className="perms__empty-icon" style={{ animation: 'spin 1s linear infinite' }} />
                    <p>Loading applications...</p>
                </div>
            ) : filtered.length === 0 ? (
                <Card glass>
                    <div className="perms__empty">
                        <ShieldAlert size={48} className="perms__empty-icon" />
                        <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>No applications found</p>
                        <p>Applications from members will appear here.</p>
                    </div>
                </Card>
            ) : (
                <Card glass style={{ padding: 0 }}>
                    <div className="perms__table-wrap">
                        <table className="perms__table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Category</th>
                                    <th>Date(s)</th>
                                    <th>Submitted</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((app, i) => (
                                    <motion.tr
                                        key={app.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{app.userName}</div>
                                            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)' }}>{app.userEmail}</div>
                                        </td>
                                        <td>{catEmoji(app.category)} {app.category}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            {app.durationType === 'range' && app.endDate
                                                ? `${fmtDate(app.startDate)} – ${fmtDate(app.endDate)}`
                                                : fmtDate(app.startDate)}
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            {fmtDate(app.submittedAt)}
                                        </td>
                                        <td><StatusBadge status={app.status} /></td>
                                        <td>
                                            <button className="perms__table-row-btn" onClick={() => { setSelected(app); setAdminReason(app.adminReason || ''); }}>
                                                <Eye size={13} /> View
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        className="perms__modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
                    >
                        <motion.div
                            className="perms__modal"
                            initial={{ scale: 0.93, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <button className="perms__modal-close" onClick={() => setSelected(null)}><X size={16} /></button>

                            <div className="perms__modal-header">
                                <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>
                                    {catEmoji(selected.category)}
                                </div>
                                <h2 className="perms__modal-name">{selected.userName}</h2>
                                <div className="perms__modal-meta">
                                    <span>{selected.userEmail}</span>
                                    <span>·</span>
                                    <span>{selected.category}</span>
                                    <span>·</span>
                                    <span>
                                        {selected.durationType === 'range' && selected.endDate
                                            ? `${fmtDate(selected.startDate)} → ${fmtDate(selected.endDate)}`
                                            : fmtDate(selected.startDate)}
                                    </span>
                                    <StatusBadge status={selected.status} />
                                </div>
                                <div style={{ fontSize: '0.77rem', color: 'var(--color-text-secondary)', marginTop: 6 }}>
                                    Submitted {fmtTimestamp(selected.submittedAt)}
                                    {selected.reviewedAt && ` · Reviewed ${fmtTimestamp(selected.reviewedAt)}`}
                                </div>
                            </div>

                            {/* Full letter */}
                            <div className="perms__editor-label" style={{ marginBottom: 10 }}>Permission Letter</div>
                            <WYSIWYGEditor content={selected.letterHtml} onChange={() => {}} readOnly />

                            {/* Admin action */}
                            {selected.status === 'pending' ? (
                                <>
                                    <div className="perms__editor-label" style={{ marginBottom: 8 }}>Your Response / Reason (optional)</div>
                                    <textarea
                                        className="perms__modal-reason-input"
                                        placeholder="Add a note or reason for your decision..."
                                        value={adminReason}
                                        onChange={e => setAdminReason(e.target.value)}
                                    />
                                    <div className="perms__modal-actions">
                                        <Button
                                            variant="secondary"
                                            icon={<XCircle size={16} />}
                                            loading={actionLoading}
                                            onClick={() => handleAction('declined')}
                                            style={{ borderColor: 'rgba(255,69,58,0.4)', color: '#FF453A' }}
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            variant="primary"
                                            icon={<CheckCircle2 size={16} />}
                                            loading={actionLoading}
                                            onClick={() => handleAction('approved')}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className={`perms__app-reason`} style={{ borderColor: selected.status === 'approved' ? 'rgba(52,199,89,0.2)' : 'rgba(255,69,58,0.2)' }}>
                                    <strong style={{ color: selected.status === 'approved' ? '#34C759' : '#FF453A' }}>
                                        {selected.status === 'approved' ? '✅ Approved' : '❌ Declined'}
                                    </strong>
                                    {selected.adminReason && `: ${selected.adminReason}`}
                                    {selected.reviewedAt && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                                            · {fmtTimestamp(selected.reviewedAt)}
                                        </span>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Page Entry Point ─────────────────────────────────────────────────────────

export function PermissionsPage() {
    const { user } = useAuthStore();
    const isAdminView = useAuthStore(state => state.isAdminView);

    const isAdmin = user?.role === 'Admin' && isAdminView;
    return isAdmin ? <AdminPermissions /> : <UserPermissions />;
}
