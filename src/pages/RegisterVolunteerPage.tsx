import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Users, Star, CheckCircle, Mail, Phone } from 'lucide-react';
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
  { num: '01', text: 'Fill out the volunteer interest form below' },
  { num: '02', text: 'A team leader will contact you within 3–5 working days' },
  { num: '03', text: 'Attend an orientation & meet the team' },
  { num: '04', text: 'Begin serving at your first Sunday service' },
];

export function RegisterVolunteerPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app this would call an API — for now a nice alert
    alert('Thank you for your interest! We will reach out to you soon. 🙏');
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
              <h2>Interest Form</h2>
              <p>Fill in your details and we'll get back to you shortly.</p>
            </div>

            <form className="volunteer-form" onSubmit={handleSubmit}>
              <div className="volunteer-form__row">
                <div className="volunteer-form__group">
                  <label className="volunteer-form__label">First Name</label>
                  <input
                    className="volunteer-form__input"
                    type="text"
                    placeholder="e.g. Chidi"
                    required
                  />
                </div>
                <div className="volunteer-form__group">
                  <label className="volunteer-form__label">Last Name</label>
                  <input
                    className="volunteer-form__input"
                    type="text"
                    placeholder="e.g. Okonkwo"
                    required
                  />
                </div>
              </div>

              <div className="volunteer-form__group">
                <label className="volunteer-form__label">Email Address</label>
                <div className="volunteer-form__input-icon-wrap">
                  <Mail size={16} className="volunteer-form__input-icon" />
                  <input
                    className="volunteer-form__input volunteer-form__input--icon"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="volunteer-form__group">
                <label className="volunteer-form__label">Phone Number</label>
                <div className="volunteer-form__input-icon-wrap">
                  <Phone size={16} className="volunteer-form__input-icon" />
                  <input
                    className="volunteer-form__input volunteer-form__input--icon"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    required
                  />
                </div>
              </div>

              <div className="volunteer-form__row">
                <div className="volunteer-form__group">
                  <label className="volunteer-form__label">Gender</label>
                  <select className="volunteer-form__input" required>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div className="volunteer-form__group">
                  <label className="volunteer-form__label">Age Range</label>
                  <select className="volunteer-form__input" required>
                    <option value="">Select range</option>
                    <option>16 – 20</option>
                    <option>21 – 30</option>
                    <option>31 – 40</option>
                    <option>40+</option>
                  </select>
                </div>
              </div>

              <div className="volunteer-form__group">
                <label className="volunteer-form__label">Residential Area / Zone</label>
                <input
                  className="volunteer-form__input"
                  type="text"
                  placeholder="e.g. Wuse 2, Abuja"
                />
              </div>

              <div className="volunteer-form__group">
                <label className="volunteer-form__label">Why do you want to volunteer?</label>
                <textarea
                  className="volunteer-form__input volunteer-form__textarea"
                  placeholder="Share your heart..."
                  rows={4}
                />
              </div>

              {/* Checklist */}
              <div className="volunteer-form__checklist">
                <label className="volunteer-form__check">
                  <input type="checkbox" required />
                  <CheckCircle size={16} className="volunteer-form__check-icon" />
                  <span>I am a regular attendee of Koinonia Abuja</span>
                </label>
                <label className="volunteer-form__check">
                  <input type="checkbox" required />
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Heart size={18} />
                <span>Submit Interest</span>
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
