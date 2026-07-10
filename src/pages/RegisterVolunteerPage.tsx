import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Users, Star, CheckCircle, Mail, Phone, User, Calendar,
  Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code2, Heading1, Heading2, Undo2, Redo2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { volunteersAPI } from '../services/api';
import './RegisterVolunteerPage.css';

const perks = [
  {
    icon: <Heart size={22} />,
    title: 'Serve with Purpose',
    body: 'Use your gifts to create a welcoming atmosphere that transforms lives.',
  },
  {
    icon: <Users size={22} />,
    title: 'Join a Family',
    body: 'Become part of a loving, close-knit community of dedicated ushers.',
  },
  {
    icon: <Star size={22} />,
    title: 'Grow & Lead',
    body: 'Develop leadership, hospitality, and organisational skills.',
  },
];

const steps = [
  { num: '01', text: 'Fill out the registration form below' },
  { num: '02', text: 'Verify your email and set your password' },
  { num: '03', text: 'Attend an orientation & meet the team' },
  { num: '04', text: 'Begin serving at your first Sunday service' },
];

export function RegisterVolunteerPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    spiritual_journey: '',
    year_joined: new Date().getFullYear().toString(),
  });

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, spiritual_journey: editor.getHTML() }));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      toast.error('Please agree to the Privacy Policy to continue');
      return;
    }

    // Basic validation
    const hasSpiritualJourney = formData.spiritual_journey && formData.spiritual_journey !== '<p></p>' && formData.spiritual_journey.trim() !== '';
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.gender || !hasSpiritualJourney) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await volunteersAPI.create({
        email: formData.email,
        first_name: formData.first_name,
        gender: formData.gender,
        last_name: formData.last_name,
        phone: formData.phone,
        role: 'Ksom',
        spiritual_journey: formData.spiritual_journey,
        year_joined: formData.year_joined,
      });

      toast.success('Registration submitted successfully! 🙏');
      navigate('/volunteer-success');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="volunteer-page">
      {/* Ambient background */}
      <div className="volunteer-page__bg">
        <div className="volunteer-page__orb volunteer-page__orb--1" />
        <div className="volunteer-page__orb volunteer-page__orb--2" />
        <div className="volunteer-page__orb volunteer-page__orb--3" />
      </div>

      {/* Back nav */}
      <motion.header
        className="volunteer-page__nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="volunteer-page__back">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
        <Link to="/login" className="volunteer-page__login-link">
          Already a member? <span>Sign In →</span>
        </Link>
      </motion.header>

      <div className="volunteer-page__layout">
        {/* ── LEFT PANEL */}
        <motion.aside
          className="volunteer-page__aside"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="volunteer-page__aside-top">
            <div className="volunteer-page__badge">Volunteer Programme</div>
            <h1 className="volunteer-page__heading">
              Register as a<br />
              <span className="volunteer-page__heading--gold">Volunteer</span>
            </h1>
            <p className="volunteer-page__intro">
              The Koinonia Ushering Department Abuja is looking for passionate, committed
              individuals ready to serve with excellence. Join us today and make an eternal
              difference through selfless service.
            </p>
          </div>

          {/* Perks */}
          <div className="volunteer-page__perks">
            {perks.map((perk, i) => (
              <motion.div
                key={i}
                className="volunteer-page__perk"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12, duration: 0.5 }}
              >
                <div className="volunteer-page__perk-icon">{perk.icon}</div>
                <div>
                  <div className="volunteer-page__perk-title">{perk.title}</div>
                  <div className="volunteer-page__perk-body">{perk.body}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Steps */}
          <div className="volunteer-page__steps-label">What happens next?</div>
          <div className="volunteer-page__steps">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                className="volunteer-page__step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
              >
                <span className="volunteer-page__step-num">{s.num}</span>
                <span className="volunteer-page__step-text">{s.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="volunteer-page__aside-footer">
            <div className="volunteer-page__contact-item">
              <Mail size={15} />
              <span>kudaprivacy@gmail.com</span>
            </div>
          </div>
        </motion.aside>

        {/* ── RIGHT PANEL — FORM */}
        <motion.main
          className="volunteer-page__main"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="volunteer-page__card glass-strong">
            <div className="volunteer-page__card-header">
              <div className="volunteer-page__card-icon">
                <Heart size={26} />
              </div>
              <h2>Registration Form</h2>
              <p>Fill in your details to join the volunteer programme.</p>
            </div>

            <form className="volunteer-form" onSubmit={handleSubmit}>

              {/* Personal Info */}
              <div className="volunteer-form__section-label">Personal Information</div>

              <div className="volunteer-form__row">
                <div className="volunteer-form__group">
                  <label className="volunteer-form__label">First Name *</label>
                  <div className="volunteer-form__input-icon-wrap">
                    <User size={16} className="volunteer-form__input-icon" />
                    <input
                      className="volunteer-form__input volunteer-form__input--icon"
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="e.g. Chidi"
                      required
                    />
                  </div>
                </div>
                <div className="volunteer-form__group">
                  <label className="volunteer-form__label">Last Name *</label>
                  <div className="volunteer-form__input-icon-wrap">
                    <User size={16} className="volunteer-form__input-icon" />
                    <input
                      className="volunteer-form__input volunteer-form__input--icon"
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="e.g. Okonkwo"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="volunteer-form__group">
                <label className="volunteer-form__label">Email Address *</label>
                <div className="volunteer-form__input-icon-wrap">
                  <Mail size={16} className="volunteer-form__input-icon" />
                  <input
                    className="volunteer-form__input volunteer-form__input--icon"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="volunteer-form__group">
                <label className="volunteer-form__label">Phone Number *</label>
                <div className="volunteer-form__input-icon-wrap">
                  <Phone size={16} className="volunteer-form__input-icon" />
                  <input
                    className="volunteer-form__input volunteer-form__input--icon"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+234 800 000 0000"
                    required
                  />
                </div>
              </div>

              <div className="volunteer-form__row">
                <div className="volunteer-form__group">
                  <label className="volunteer-form__label">Gender *</label>
                  <select
                    className="volunteer-form__input"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="volunteer-form__group">
                  <label className="volunteer-form__label">Year Joined *</label>
                  <div className="volunteer-form__input-icon-wrap">
                    <Calendar size={16} className="volunteer-form__input-icon" />
                    <input
                      className="volunteer-form__input volunteer-form__input--icon"
                      type="number"
                      name="year_joined"
                      value={formData.year_joined}
                      onChange={handleChange}
                      placeholder={new Date().getFullYear().toString()}
                      min="2000"
                      max={new Date().getFullYear()}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="volunteer-form__group">
                <label className="volunteer-form__label">Spiritual Journey / Testimony *</label>
                <div className="tiptap-editor">
                  {editor && (
                    <div className="tiptap-editor__toolbar">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`tiptap-editor__btn ${editor.isActive('bold') ? 'tiptap-editor__btn--active' : ''}`}
                        title="Bold"
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`tiptap-editor__btn ${editor.isActive('italic') ? 'tiptap-editor__btn--active' : ''}`}
                        title="Italic"
                      >
                        <Italic size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`tiptap-editor__btn ${editor.isActive('strike') ? 'tiptap-editor__btn--active' : ''}`}
                        title="Strikethrough"
                      >
                        <Strikethrough size={14} />
                      </button>
                      <span className="tiptap-editor__divider" />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`tiptap-editor__btn ${editor.isActive('heading', { level: 1 }) ? 'tiptap-editor__btn--active' : ''}`}
                        title="Heading 1"
                      >
                        <Heading1 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`tiptap-editor__btn ${editor.isActive('heading', { level: 2 }) ? 'tiptap-editor__btn--active' : ''}`}
                        title="Heading 2"
                      >
                        <Heading2 size={14} />
                      </button>
                      <span className="tiptap-editor__divider" />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`tiptap-editor__btn ${editor.isActive('bulletList') ? 'tiptap-editor__btn--active' : ''}`}
                        title="Bullet List"
                      >
                        <List size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`tiptap-editor__btn ${editor.isActive('orderedList') ? 'tiptap-editor__btn--active' : ''}`}
                        title="Ordered List"
                      >
                        <ListOrdered size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`tiptap-editor__btn ${editor.isActive('blockquote') ? 'tiptap-editor__btn--active' : ''}`}
                        title="Blockquote"
                      >
                        <Quote size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={`tiptap-editor__btn ${editor.isActive('codeBlock') ? 'tiptap-editor__btn--active' : ''}`}
                        title="Code Block"
                      >
                        <Code2 size={14} />
                      </button>
                      <span className="tiptap-editor__divider" />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="tiptap-editor__btn"
                        title="Undo"
                      >
                        <Undo2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="tiptap-editor__btn"
                        title="Redo"
                      >
                        <Redo2 size={14} />
                      </button>
                    </div>
                  )}
                  <EditorContent editor={editor} className="tiptap-editor__content" />
                </div>
              </div>

              {/* Agreement */}
              <div className="volunteer-form__checklist">
                <label className="volunteer-form__check">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                  />
                  <CheckCircle size={16} className="volunteer-form__check-icon" />
                  <span>
                    I have read and agree to the{' '}
                    <Link to="/privacy-policy" className="volunteer-form__policy-link">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              <motion.button
                type="submit"
                className="volunteer-form__submit"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                disabled={loading}
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Heart size={18} />
                    <span>Register as Volunteer</span>
                  </>
                )}
              </motion.button>

              <p className="volunteer-form__note">
                Already registered?{' '}
                <Link to="/login" className="volunteer-form__policy-link">
                  Sign in to your account
                </Link>
              </p>
            </form>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
