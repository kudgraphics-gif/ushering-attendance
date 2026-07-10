import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Calendar, MapPin, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { volunteersAPI } from '../services/api';
import './VolunteerOnboardPage.css';

export function VolunteerOnboardPage() {
  const navigate = useNavigate();
  const { token: urlToken } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    dob: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });

  useEffect(() => {
    if (!urlToken) {
      setTokenMissing(true);
    }
  }, [urlToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!urlToken) {
      toast.error('Invalid onboarding link. Please use the link sent to your email.');
      return;
    }

    if (!formData.password) {
      toast.error('Please enter a password');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      let dob = '';
      if (formData.dob) {
        dob = new Date(formData.dob + 'T00:00:00.000Z').toISOString();
      }

      await volunteersAPI.onboard({
        token: urlToken,
        password: formData.password,
        dob: dob || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
      });

      toast.success('Onboarding complete! You can now log in to the Volunteer Portal. 🙏');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Onboarding failed. Please check your link and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Invalid / missing token state ─────────────────────────────────────────
  if (tokenMissing) {
    return (
      <div className="onboard-page">
        <div className="onboard-page__bg">
          <div className="onboard-page__orb onboard-page__orb--1" />
          <div className="onboard-page__orb onboard-page__orb--2" />
          <div className="onboard-page__orb onboard-page__orb--3" />
        </div>
        <motion.header
          className="onboard-page__nav"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/login" className="onboard-page__back">
            <ArrowLeft size={18} />
            <span>Back to Login</span>
          </Link>
        </motion.header>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '24px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              maxWidth: '440px',
              width: '100%',
              background: 'rgba(12,12,14,0.95)',
              border: '1px solid rgba(255,60,60,0.25)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            {/* Red accent header */}
            <div style={{
              padding: '28px 28px 22px',
              background: 'linear-gradient(135deg, rgba(255,60,60,0.12) 0%, rgba(255,60,60,0.04) 100%)',
              borderBottom: '1px solid rgba(255,60,60,0.1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ff4444'
              }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.2px' }}>
                  Invalid Onboarding Link
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                  No token was found in the URL
                </p>
              </div>
            </div>

            <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                This page requires a valid onboarding link sent to your registered email address. 
                Please open the link directly from that email.
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                If you believe this is an error, contact your department admin or email{' '}
                <span style={{ color: '#D4AF37' }}>kudaprivacy@gmail.com</span>
              </p>
              <Link
                to="/login"
                style={{
                  display: 'block',
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginTop: '4px',
                  transition: 'all 0.18s ease',
                }}
              >
                Go to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Normal onboard form ───────────────────────────────────────────────────
  return (
    <div className="onboard-page">
      {/* Ambient background */}
      <div className="onboard-page__bg">
        <div className="onboard-page__orb onboard-page__orb--1" />
        <div className="onboard-page__orb onboard-page__orb--2" />
        <div className="onboard-page__orb onboard-page__orb--3" />
      </div>

      {/* Back nav */}
      <motion.header
        className="onboard-page__nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/login" className="onboard-page__back">
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </Link>
      </motion.header>

      <div className="onboard-page__layout">
        {/* ── LEFT PANEL */}
        <motion.aside
          className="onboard-page__aside"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="onboard-page__aside-top">
            <div className="onboard-page__badge">Volunteer Setup</div>
            <h1 className="onboard-page__heading">
              Complete Your<br />
              <span className="onboard-page__heading--gold">Onboarding</span>
            </h1>
            <p className="onboard-page__intro">
              Welcome to the Koinonia Ushering Department Abuja volunteer team!
              Set your password and fill in your profile details below to activate your account.
            </p>
            {/* Token confirmation chip */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '8px 14px',
              borderRadius: '100px',
              background: 'rgba(52,199,89,0.1)',
              border: '1px solid rgba(52,199,89,0.25)',
              fontSize: '12px',
              color: '#34c759',
              fontWeight: 500,
            }}>
              <CheckCircle size={13} />
              Onboarding link verified
            </div>
          </div>

          <div className="onboard-page__aside-footer">
            <div>
              <p className="onboard-page__help-text">Need help? Contact department admin or email</p>
              <span className="onboard-page__email-link">kudaprivacy@gmail.com</span>
            </div>
          </div>
        </motion.aside>

        {/* ── RIGHT PANEL — FORM */}
        <motion.main
          className="onboard-page__main"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="onboard-page__card glass-strong">
            <div className="onboard-page__card-header">
              <div className="onboard-page__card-icon">
                <Lock size={26} />
              </div>
              <h2>Account Setup</h2>
              <p>Set your password and details to complete onboarding.</p>
            </div>

            <form className="onboard-form" onSubmit={handleSubmit}>
              
              {/* Account Security */}
              <div className="onboard-form__section-label">Account Security</div>

              <div className="onboard-form__row">
                <div className="onboard-form__group">
                  <label className="onboard-form__label">Password *</label>
                  <div className="onboard-form__input-icon-wrap">
                    <Lock size={16} className="onboard-form__input-icon" />
                    <input
                      className="onboard-form__input onboard-form__input--icon"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="onboard-form__group">
                  <label className="onboard-form__label">Confirm Password *</label>
                  <div className="onboard-form__input-icon-wrap">
                    <Lock size={16} className="onboard-form__input-icon" />
                    <input
                      className="onboard-form__input onboard-form__input--icon"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Personal details */}
              <div className="onboard-form__section-label">Profile Details (Optional)</div>

              <div className="onboard-form__row">
                <div className="onboard-form__group">
                  <label className="onboard-form__label">Date of Birth</label>
                  <div className="onboard-form__input-icon-wrap">
                    <Calendar size={16} className="onboard-form__input-icon" />
                    <input
                      className="onboard-form__input onboard-form__input--icon"
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="onboard-form__group">
                  <label className="onboard-form__label">Country</label>
                  <div className="onboard-form__input-icon-wrap">
                    <Globe size={16} className="onboard-form__input-icon" />
                    <input
                      className="onboard-form__input onboard-form__input--icon"
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="e.g. Nigeria"
                    />
                  </div>
                </div>
              </div>

              <div className="onboard-form__group">
                <label className="onboard-form__label">Address</label>
                <div className="onboard-form__input-icon-wrap">
                  <MapPin size={16} className="onboard-form__input-icon" />
                  <input
                    className="onboard-form__input onboard-form__input--icon"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div className="onboard-form__row">
                <div className="onboard-form__group">
                  <label className="onboard-form__label">City</label>
                  <input
                    className="onboard-form__input"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Abuja"
                  />
                </div>
                <div className="onboard-form__group">
                  <label className="onboard-form__label">State</label>
                  <input
                    className="onboard-form__input"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. FCT"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                className="onboard-form__submit"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                disabled={loading}
              >
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Complete Onboarding</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
