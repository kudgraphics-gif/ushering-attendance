import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    ShieldAlert, CheckCircle2, XCircle, Clock, X, ChevronRight, ChevronLeft,
    CalendarDays, CalendarRange, Eye, RefreshCw, Search, Filter, Bold, Italic,
    List, Strikethrough, Undo2, Redo2, Check, Trash2, Pencil, ChevronLeft as PrevPage,
    ChevronRight as NextPage,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, isValid } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { permissionsAPI } from '../services/api';
import type {
    PermissionItem,
    PermissionStatus,
    PermissionCategory,
    PermissionListParams,
    CreatePermissionRequest,
} from '../types';
import './PermissionsPage.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { key: PermissionCategory; emoji: string; label: string; desc: string; gradient: string }[] = [
    {
        key: 'Sickness',
        emoji: '🤒',
        label: 'Sickness',
        desc: 'Feeling unwell or recovering from illness',
        gradient: 'linear-gradient(135deg, rgba(255,69,58,0.12), rgba(255,69,58,0.04))',
    },
    {
        key: 'Travel',
        emoji: '✈️',
        label: 'Travel',
        desc: 'Out of town or away from Abuja',
        gradient: 'linear-gradient(135deg, rgba(10,132,255,0.12), rgba(10,132,255,0.04))',
    },
    {
        key: 'Work',
        emoji: '💼',
        label: 'Work',
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
const PAGE_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'MMM d, yyyy') : iso;
}

function fmtTimestamp(iso: string) {
    const d = parseISO(iso);
    return isValid(d) ? format(d, "MMM d, yyyy 'at' h:mm a") : iso;
}

function buildTemplate(category: PermissionCategory, name: string, startDate: string, endDate?: string, isRange?: boolean): string {
    const isSingle = !isRange || !endDate || startDate === endDate;
    const dateStr = isSingle
        ? `on <strong>${fmtDate(startDate)}</strong>`
        : `from <strong>${fmtDate(startDate)}</strong> to <strong>${fmtDate(endDate)}</strong>`;

    const templates: Record<PermissionCategory, string> = {
        Sickness:
            `<p>Dear HOD &amp; Secretary,</p><p>I am writing to formally request leave of absence from my scheduled ushering duties ${dateStr} due to health challenges. I am currently feeling unwell and am focusing on recovery under medical guidance.</p><p>I kindly seek your permission and approval to be excused from service. I deeply regret any inconvenience my absence might cause to the team setup, and I will be sure to update you once I am fully recovered and fit to resume.</p><p>Thank you for your understanding, prayers, and support.</p><p>Yours faithfully,<br/><strong>${name}</strong></p>`,
        Travel:
            `<p>Dear HOD &amp; Secretary,</p><p>I am writing to formally request permission to be excused from service ${dateStr}. I will be traveling to <strong>[Insert Destination/Where]</strong> for <strong>[State the reason for your travel]</strong>, and will be unavailable to perform my duties during this period.</p><p>I kindly ask for your approval of this leave of absence. I have already informed my team lead so that adequate replacements can be coordinated, ensuring smooth service flow.</p><p>Thank you very much for your kind consideration of my request.</p><p>Yours faithfully,<br/><strong>${name}</strong></p>`,
        Work:
            `<p>Dear HOD &amp; Secretary,</p><p>I am writing to seek your permission to be absent from my scheduled ushering duties ${dateStr}. This is due to urgent, unavoidable professional commitments, specifically <strong>[Explain the work reason/what you will be doing]</strong>, which require my personal attendance.</p><p>I highly value my commitment to the ushering department and apologize for having to request this exemption. I hope for your favorable consideration and look forward to resuming duties immediately upon my return.</p><p>Thank you for your leadership and understanding.</p><p>Yours faithfully,<br/><strong>${name}</strong></p>`,
        Other:
            `<p>Dear HOD &amp; Secretary,</p><p>I am writing to request permission to be excused from service ${dateStr} due to personal commitments that require my full attention.</p><p>I kindly ask for your approval of my request. I sincerely apologize for any gap this may create on the team and appreciate your kind consideration.</p><p>Yours faithfully,<br/><strong>${name}</strong></p>`,
    };
    return templates[category];
}

function catEmoji(c: PermissionCategory) {
    return CATEGORIES.find(x => x.key === c)?.emoji || '📝';
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PermissionStatus }) {
    const config: Record<PermissionStatus, { icon: React.ReactNode; label: string }> = {
        Pending:  { icon: <Clock size={11} />,        label: 'Pending' },
        Approved: { icon: <CheckCircle2 size={11} />, label: 'Approved' },
        Rejected: { icon: <XCircle size={11} />,      label: 'Rejected' },
    };
    const { icon, label } = config[status];
    const cls = status === 'Approved' ? 'approved' : status === 'Rejected' ? 'declined' : 'pending';
    return (
        <span className={`perms__badge perms__badge--${cls}`}>
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
    const { user, token } = useAuthStore();
    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Member';

    const [step, setStep] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [myPermissions, setMyPermissions] = useState<PermissionItem[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);

    // Edit mode
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [category, setCategory] = useState<PermissionCategory | null>(null);
    const [isRange, setIsRange] = useState<boolean | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [letterHtml, setLetterHtml] = useState('');

    const today = new Date().toISOString().split('T')[0];

    const fetchMyPermissions = useCallback(async () => {
        if (!user || !token) return;
        setListLoading(true);
        try {
            const result = await permissionsAPI.getAll(
                { user_id: user.id, page: 1, size: 50 },
                token
            );
            setMyPermissions(
                result.items.sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
            );
        } catch (err) {
            console.error('[Permissions] Failed to fetch my permissions', err);
        } finally {
            setListLoading(false);
        }
    }, [user, token]);

    useEffect(() => { fetchMyPermissions(); }, [fetchMyPermissions, submitted]);

    // Auto-fill template when selections change
    useEffect(() => {
        if (category && startDate) {
            setLetterHtml(buildTemplate(category, userName, startDate, isRange ? endDate : undefined, isRange ?? false));
        }
    }, [category, startDate, endDate, isRange, userName]);

    const canProceedStep0 = !!category;
    const canProceedStep1 = isRange !== null && !!startDate && (!isRange || !!endDate);
    const canProceedStep2 = letterHtml.trim().length > 0 && letterHtml !== '<p></p>';

    const handleSubmit = async () => {
        if (!user || !token || !category || isRange === null || !startDate) {
            toast.error('Please complete all fields');
            return;
        }
        setLoading(true);
        try {
            const payload: CreatePermissionRequest = {
                category,
                permission: letterHtml,
                is_range: isRange,
                start_date: startDate,
                end_date: isRange ? endDate : startDate,
            };

            if (editingId) {
                await permissionsAPI.update({ id: editingId, ...payload }, token);
                toast.success('Permission request updated!');
            } else {
                await permissionsAPI.create(payload, token);
                toast.success('Permission request submitted!');
            }
            setSubmitted(s => !s); // trigger re-fetch
            resetForm();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to submit';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!token) return;
        if (!confirm('Delete this permission request?')) return;
        try {
            await permissionsAPI.delete(id, token);
            toast.success('Request deleted');
            fetchMyPermissions();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Delete failed');
        }
    };

    const handleEdit = (perm: PermissionItem) => {
        setEditingId(perm.id);
        setCategory(perm.category);
        setIsRange(perm.is_range);
        setStartDate(perm.start_date);
        setEndDate(perm.end_date);
        setLetterHtml(perm.permission);
        setStep(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setStep(0);
        setCategory(null);
        setIsRange(null);
        setStartDate('');
        setEndDate('');
        setLetterHtml('');
        setEditingId(null);
        setSubmitted(false);
    };

    const pendingPermissions = myPermissions.filter(p => p.status === 'Pending');

    return (
        <motion.div className="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="perms__header">
                <h1 className="perms__title">Permissions</h1>
                <p className="perms__subtitle">
                    {editingId ? 'Edit your leave request' : 'Submit a leave request addressed to the HOD & Secretary'}
                </p>
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
                                    {editingId && (
                                        <Button variant="secondary" onClick={resetForm}>Cancel Edit</Button>
                                    )}
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
                                        className={`perms__dur-btn ${isRange === false ? 'perms__dur-btn--selected' : ''}`}
                                        onClick={() => setIsRange(false)}
                                    >
                                        <div className="perms__dur-icon"><CalendarDays size={28} /></div>
                                        <span>Single Day</span>
                                        <span className="perms__dur-sub">I'll be away for one service</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`perms__dur-btn ${isRange === true ? 'perms__dur-btn--selected' : ''}`}
                                        onClick={() => setIsRange(true)}
                                    >
                                        <div className="perms__dur-icon"><CalendarRange size={28} /></div>
                                        <span>Date Range</span>
                                        <span className="perms__dur-sub">I'll be away for multiple days</span>
                                    </button>
                                </div>

                                {isRange !== null && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`perms__dates ${!isRange ? 'perms__dates--single' : ''}`}
                                    >
                                        <div className="perms__date-group">
                                            <label className="perms__date-label">
                                                {!isRange ? 'Absence Date' : 'Start Date'}
                                            </label>
                                            <input
                                                type="date"
                                                className="perms__date-input"
                                                value={startDate}
                                                min={today}
                                                onChange={e => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        {isRange && (
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

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                                    {[
                                        { label: 'Category', value: CATEGORIES.find(c => c.key === category)?.emoji + ' ' + category },
                                        { label: 'Duration', value: !isRange ? 'Single Day' : 'Date Range' },
                                        { label: 'Date', value: isRange ? `${fmtDate(startDate)} → ${fmtDate(endDate)}` : fmtDate(startDate) },
                                    ].map(item => (
                                        <div key={item.label} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', marginBottom: 4 }}>{item.label}</div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="perms__editor-label">Your Letter (Preview)</div>
                                <WYSIWYGEditor content={letterHtml} onChange={setLetterHtml} readOnly />

                                <div className="perms__actions">
                                    <Button variant="secondary" icon={<ChevronLeft size={16} />} onClick={() => setStep(2)}>Edit Letter</Button>
                                    <Button variant="primary" icon={<CheckCircle2 size={16} />} loading={loading} onClick={handleSubmit}>
                                        {editingId ? 'Update Request' : 'Submit Request'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── My Applications ── */}
            <div style={{ marginTop: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        My Applications
                    </h2>
                    <Button variant="secondary" icon={<RefreshCw size={14} />} size="sm" loading={listLoading} onClick={fetchMyPermissions}>
                        Refresh
                    </Button>
                </div>

                {listLoading ? (
                    <div className="perms__empty">
                        <RefreshCw size={32} className="perms__empty-icon" style={{ animation: 'spin 1s linear infinite' }} />
                        <p>Loading your requests...</p>
                    </div>
                ) : myPermissions.length === 0 ? (
                    <Card glass>
                        <div className="perms__empty">
                            <ShieldAlert size={40} className="perms__empty-icon" />
                            <p style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>No requests yet</p>
                            <p>Submit your first permission request above.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="perms__app-list">
                        {myPermissions.map((perm, i) => (
                            <motion.div
                                key={perm.id}
                                className="perms__app-card"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => setExpandedId(expandedId === perm.id ? null : perm.id)}
                            >
                                <div className="perms__app-icon">{catEmoji(perm.category)}</div>
                                <div className="perms__app-body">
                                    <div className="perms__app-title">{perm.category} Leave</div>
                                    <div className="perms__app-meta">
                                        <span>
                                            {perm.is_range && perm.end_date !== perm.start_date
                                                ? `${fmtDate(perm.start_date)} → ${fmtDate(perm.end_date)}`
                                                : fmtDate(perm.start_date)}
                                        </span>
                                        <span>Submitted {fmtTimestamp(perm.created_at)}</span>
                                        <StatusBadge status={perm.status} />
                                    </div>
                                    <AnimatePresence>
                                        {expandedId === perm.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <div className="perms__app-reason" dangerouslySetInnerHTML={{ __html: perm.permission }} />
                                                {perm.review_comment && (
                                                    <div
                                                        className="perms__app-reason"
                                                        style={{ marginTop: 8, borderColor: perm.status === 'Approved' ? 'rgba(52,199,89,0.2)' : 'rgba(255,69,58,0.2)' }}
                                                    >
                                                        <strong style={{ color: perm.status === 'Approved' ? '#34C759' : '#FF453A' }}>
                                                            {perm.status === 'Approved' ? '✅ Approved' : '❌ Rejected'}:
                                                        </strong>{' '}{perm.review_comment}
                                                    </div>
                                                )}
                                                {/* Edit / Delete only for pending */}
                                                {perm.status === 'Pending' && (
                                                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            icon={<Pencil size={13} />}
                                                            onClick={() => handleEdit(perm)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            icon={<Trash2 size={13} />}
                                                            onClick={() => handleDelete(perm.id)}
                                                            style={{ color: '#FF453A', borderColor: 'rgba(255,69,58,0.3)' }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, transform: expandedId === perm.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Upcoming permissions widget */}
                {pendingPermissions.length > 0 && (
                    <div style={{ marginTop: 'var(--space-lg)', padding: '14px 18px', background: 'rgba(255,196,0,0.07)', border: '1px solid rgba(255,196,0,0.18)', borderRadius: 14 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFC400', marginBottom: 4 }}>
                            ⏳ {pendingPermissions.length} request{pendingPermissions.length > 1 ? 's' : ''} awaiting review
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            You will be notified once reviewed by the HOD or Secretary.
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Admin View ───────────────────────────────────────────────────────────────

function AdminPermissions() {
    const { token, user } = useAuthStore();
    const isLeader = user?.role === 'Leader';

    // List state
    const [permissions, setPermissions] = useState<PermissionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [numPages, setNumPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<PermissionStatus | ''>('');
    const [filterCategory, setFilterCategory] = useState<PermissionCategory | ''>('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Stats
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    // Modal
    const [selected, setSelected] = useState<PermissionItem | null>(null);
    const [reviewComment, setReviewComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // ── Fetch Stats ──
    const fetchStats = useCallback(async () => {
        if (!token) return;
        setStatsLoading(true);
        try {
            const s = await permissionsAPI.getStats(token);
            setStats({ total: s.total, pending: s.pending, approved: s.approved, rejected: s.rejected });
        } catch (err) {
            console.error('[Permissions] Failed to fetch stats', err);
        } finally {
            setStatsLoading(false);
        }
    }, [token]);

    // ── Fetch List ──
    const fetchPermissions = useCallback(async (pg: number = 1) => {
        if (!token) return;
        setLoading(true);
        try {
            const params: PermissionListParams = {
                page: pg,
                size: PAGE_SIZE,
                status: filterStatus || undefined,
                category: filterCategory || undefined,
                start_date: filterStartDate || undefined,
                end_date: filterEndDate || undefined,
            };
            const result = await permissionsAPI.getAll(params, token);
            setPermissions(result.items);
            setNumPages(result.num_pages);
            setTotalItems(result.total_items);
            setPage(pg);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to load permissions');
        } finally {
            setLoading(false);
        }
    }, [token, filterStatus, filterCategory, filterStartDate, filterEndDate]);

    useEffect(() => {
        fetchStats();
        fetchPermissions(1);
    }, [fetchStats, fetchPermissions]);

    // ── Client-side name search ──
    const filtered = permissions.filter(p => {
        if (!search) return true;
        const name = `${p.user_first_name || ''} ${p.user_last_name || ''}`.toLowerCase();
        return name.includes(search.toLowerCase());
    });

    // ── Admin Review ──
    const handleReview = async (status: PermissionStatus) => {
        if (!selected || !token) return;
        setActionLoading(true);
        try {
            await permissionsAPI.adminReview({ id: selected.id, review_comment: reviewComment, status }, token);
            toast.success(`Permission ${status.toLowerCase()}!`);
            setSelected(null);
            setReviewComment('');
            fetchPermissions(page);
            fetchStats();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Review failed');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Admin Delete ──
    const handleDelete = async (id: string) => {
        if (!token) return;
        if (!confirm('Are you sure you want to delete this permission request as an Administrator?')) return;
        try {
            await permissionsAPI.delete(id, token);
            toast.success('Permission request deleted successfully.');
            setSelected(null);
            fetchPermissions(page);
            fetchStats();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Deletion failed');
        }
    };

    const openModal = (perm: PermissionItem) => {
        setSelected(perm);
        setReviewComment(perm.review_comment || '');
    };

    return (
        <motion.div className="perms" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="perms__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="perms__title">Permissions</h1>
                    <p className="perms__subtitle">Review and manage member leave requests</p>
                </div>
                <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={() => { fetchPermissions(page); fetchStats(); }} loading={loading || statsLoading} size="sm">
                    Refresh
                </Button>
            </div>

            {/* ── Stats ── */}
            <div className="perms__stats">
                {[
                    { label: 'Total', num: stats.total, color: 'var(--color-primary)' },
                    { label: 'Pending', num: stats.pending, color: '#FFC400' },
                    { label: 'Approved', num: stats.approved, color: '#34C759' },
                    { label: 'Rejected', num: stats.rejected, color: '#FF453A' },
                ].map(s => (
                    <Card glass key={s.label} className="perms__stat-card">
                        <div className="perms__stat-num" style={{ color: s.color, fontWeight: '800' }}>
                            {statsLoading ? '—' : s.num}
                        </div>
                        <div className="perms__stat-label">{s.label}</div>
                    </Card>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="perms__filters">
                <div className="perms__filters-search-wrap">
                    <Search size={16} className="perms__search-icon" />
                    <input
                        className="perms__filter-input"
                        placeholder="Search by member name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="perms__filters-select-wrap">
                    <Filter size={14} className="perms__filter-icon" />
                    <select className="perms__filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value as PermissionStatus | ''); setPage(1); }}>
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                <div className="perms__filters-select-wrap">
                    <select className="perms__filter-select" value={filterCategory} onChange={e => { setFilterCategory(e.target.value as PermissionCategory | ''); setPage(1); }}>
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                </div>
                <div className="perms__filters-select-wrap">
                    <span className="perms__date-filter-label">From:</span>
                    <input
                        type="date"
                        className="perms__filter-select perms__filter-date"
                        value={filterStartDate}
                        title="Filter from date"
                        onChange={e => { setFilterStartDate(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="perms__filters-select-wrap">
                    <span className="perms__date-filter-label">To:</span>
                    <input
                        type="date"
                        className="perms__filter-select perms__filter-date"
                        value={filterEndDate}
                        title="Filter to date"
                        onChange={e => { setFilterEndDate(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* ── Table ── */}
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
                                {filtered.map((perm, i) => (
                                    <motion.tr
                                        key={perm.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <td>
                                            <div style={{ fontWeight: 600 }}>
                                                {perm.user_first_name || perm.user_last_name
                                                    ? `${perm.user_first_name || ''} ${perm.user_last_name || ''}`.trim()
                                                    : '—'}
                                            </div>
                                            <div style={{ fontSize: '0.74rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                                ID: {perm.user_id.slice(0, 8)}…
                                            </div>
                                        </td>
                                        <td>{catEmoji(perm.category)} {perm.category}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            {perm.is_range && perm.end_date !== perm.start_date
                                                ? `${fmtDate(perm.start_date)} – ${fmtDate(perm.end_date)}`
                                                : fmtDate(perm.start_date)}
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                            {fmtDate(perm.created_at)}
                                        </td>
                                        <td><StatusBadge status={perm.status} /></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="perms__table-row-btn" onClick={() => openModal(perm)}>
                                                    <Eye size={13} /> View
                                                </button>
                                                {!isLeader && (
                                                    <button
                                                        className="perms__table-row-btn perms__table-row-btn--danger"
                                                        onClick={() => handleDelete(perm.id)}
                                                        title="Delete request"
                                                    >
                                                        <Trash2 size={13} /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {numPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 10 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                Page {page} of {numPages} · {totalItems} total
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="perms__table-row-btn"
                                    disabled={page <= 1}
                                    onClick={() => fetchPermissions(page - 1)}
                                >
                                    <PrevPage size={14} /> Prev
                                </button>
                                <button
                                    className="perms__table-row-btn"
                                    disabled={page >= numPages}
                                    onClick={() => fetchPermissions(page + 1)}
                                >
                                    Next <NextPage size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* ── Detail / Review Modal ── */}
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
                                <h2 className="perms__modal-name">
                                    {selected.user_first_name || selected.user_last_name
                                        ? `${selected.user_first_name || ''} ${selected.user_last_name || ''}`.trim()
                                        : 'Member'}
                                </h2>
                                <div className="perms__modal-meta">
                                    <span>{selected.category}</span>
                                    <span>·</span>
                                    <span>
                                        {selected.is_range && selected.end_date !== selected.start_date
                                            ? `${fmtDate(selected.start_date)} → ${fmtDate(selected.end_date)}`
                                            : fmtDate(selected.start_date)}
                                    </span>
                                    <StatusBadge status={selected.status} />
                                </div>
                                <div style={{ fontSize: '0.77rem', color: 'var(--color-text-secondary)', marginTop: 6 }}>
                                    Submitted {fmtTimestamp(selected.created_at)}
                                    {selected.reviewed_at && ` · Reviewed ${fmtTimestamp(selected.reviewed_at)}`}
                                </div>
                            </div>

                            {/* Full letter */}
                            <div className="perms__editor-label" style={{ marginBottom: 10 }}>Permission Letter</div>
                            <WYSIWYGEditor content={selected.permission} onChange={() => {}} readOnly />

                            {/* Action controls or Leader read-only message */}
                            {isLeader ? (
                                <div>
                                    {selected.status === 'Pending' ? (
                                        <div style={{ marginTop: 16, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                            ⏳ This permission request is pending review by HOD/Secretary.
                                        </div>
                                    ) : (
                                        <div className="perms__app-reason" style={{ marginTop: 16, borderColor: selected.status === 'Approved' ? 'rgba(52,199,89,0.2)' : 'rgba(255,69,58,0.2)' }}>
                                            <strong style={{ color: selected.status === 'Approved' ? '#34C759' : '#FF453A' }}>
                                                {selected.status === 'Approved' ? '✅ Approved' : '❌ Rejected'}
                                            </strong>
                                            {selected.review_comment && `: ${selected.review_comment}`}
                                            {selected.reviewed_at && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                                                    · {fmtTimestamp(selected.reviewed_at)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : selected.status === 'Pending' ? (
                                <>
                                    <div className="perms__editor-label" style={{ marginBottom: 8, marginTop: 16 }}>Review Comment (optional)</div>
                                    <textarea
                                        className="perms__modal-reason-input"
                                        placeholder="Add a note or reason for your decision..."
                                        value={reviewComment}
                                        onChange={e => setReviewComment(e.target.value)}
                                    />
                                    <div className="perms__modal-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Button
                                                variant="secondary"
                                                icon={<XCircle size={16} />}
                                                loading={actionLoading}
                                                onClick={() => handleReview('Rejected')}
                                                style={{ borderColor: 'rgba(255,69,58,0.4)', color: '#FF453A' }}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                variant="primary"
                                                icon={<CheckCircle2 size={16} />}
                                                loading={actionLoading}
                                                onClick={() => handleReview('Approved')}
                                            >
                                                Approve
                                            </Button>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            icon={<Trash2 size={16} />}
                                            onClick={() => handleDelete(selected.id)}
                                            style={{ color: '#FF453A', borderColor: 'rgba(255,69,58,0.3)' }}
                                        >
                                            Delete Request
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <div className={`perms__app-reason`} style={{ marginTop: 16, borderColor: selected.status === 'Approved' ? 'rgba(52,199,89,0.2)' : 'rgba(255,69,58,0.2)' }}>
                                        <strong style={{ color: selected.status === 'Approved' ? '#34C759' : '#FF453A' }}>
                                            {selected.status === 'Approved' ? '✅ Approved' : '❌ Rejected'}
                                        </strong>
                                        {selected.review_comment && `: ${selected.review_comment}`}
                                        {selected.reviewed_at && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 8 }}>
                                                · {fmtTimestamp(selected.reviewed_at)}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="secondary"
                                            icon={<Trash2 size={16} />}
                                            onClick={() => handleDelete(selected.id)}
                                            style={{ color: '#FF453A', borderColor: 'rgba(255,69,58,0.3)' }}
                                        >
                                            Delete Request
                                        </Button>
                                    </div>
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
    const isAdmin = (user?.role === 'Admin' && isAdminView) || user?.role === 'Leader';
    return isAdmin ? <AdminPermissions /> : <UserPermissions />;
}
