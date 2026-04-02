import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogIn, UserPlus, Shield, Heart, Users, Star } from 'lucide-react';
import './HomePage.css';

// Import all pictures — 1.jpg must be first
import pic1 from '../assets/pictures/1.jpg';
import pic2 from '../assets/pictures/2.jpg';
import pic3 from '../assets/pictures/3.jpg';
import pic5 from '../assets/pictures/5.jpg';
import pic6 from '../assets/pictures/6.jpg';
import pic7 from '../assets/pictures/7.jpg';
import pic8 from '../assets/pictures/8.jpg';
import pic9 from '../assets/pictures/9.jpg';
import pic10 from '../assets/pictures/10.jpg';
import pic11 from '../assets/pictures/11.jpg';
import pic13 from '../assets/pictures/13.jpg';
import pic14 from '../assets/pictures/14.jpg';
import pic15 from '../assets/pictures/15.jpg';
import pic16 from '../assets/pictures/16.jpg';
import pic17 from '../assets/pictures/17.jpg';
import pic18 from '../assets/pictures/18.jpg';
import pic19 from '../assets/pictures/19.jpg';
import pic20 from '../assets/pictures/20.jpg';
import pic21 from '../assets/pictures/21.jpg';
import pic22 from '../assets/pictures/22.jpg';
import pic23 from '../assets/pictures/23.jpg';
import pic24 from '../assets/pictures/24.jpg';
import pic25 from '../assets/pictures/25.jpg';
import pic26 from '../assets/pictures/26.jpg';
import pic27 from '../assets/pictures/27.jpg';
import pic28 from '../assets/pictures/28.jpg';
import pic29 from '../assets/pictures/29.jpg';
import pic618 from '../assets/pictures/618531923_1207748671471655_7560232948923943112_n.jpg';
import pic634 from '../assets/pictures/634130028_1226368452943010_6417466623284303872_n.jpg';

const slides = [
  pic1, pic2, pic3, pic5, pic6, pic7, pic8, pic9, pic10, pic11,
 pic13, pic14, pic15, pic16, pic17, pic18, pic19, pic20,
  pic21, pic22, pic23, pic24, pic25, pic26, pic27, pic28, pic29,
  pic618, pic634,
];

const heroTexts = [
  { title: 'THIS IS KUDA', subtitle: 'A family of faith, love, and service' },
  { title: 'SERVING WITH EXCELLENCE', subtitle: 'Dedicated ushers creating unforgettable experiences' },
  { title: 'WELCOME TO KUDA', subtitle: 'Koinonia Ushering Department Abuja' },
  { title: 'UNITED IN PURPOSE', subtitle: 'Bridging the gap between the outside world and the presence of God' },
];

const stats = [
  { icon: <Users size={28} />, value: '200+', label: 'Active Members' },
  { icon: <Heart size={28} />, value: '10+', label: 'Years of Service' },
  { icon: <Star size={28} />, value: '1000+', label: 'Services Covered' },
];

const gallerySlides = slides.slice(0, 9); // first 9 for the gallery strip

export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Auto-advance main slider
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  // Cycle hero texts
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroTexts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.05,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="home-page">
      {/* ─── HERO SLIDESHOW ─── */}
      <section
        className="home-hero"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slides */}
        <div className="home-hero__slides">
          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={currentSlide}
              className="home-hero__slide"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            >
              <img
                src={slides[currentSlide]}
                alt={`Koinonia moment ${currentSlide + 1}`}
                className="home-hero__img"
              />
              <div className="home-hero__overlay" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating shimmer orbs */}
        <div className="home-hero__orb home-hero__orb--1" />
        <div className="home-hero__orb home-hero__orb--2" />

        {/* NAV BAR */}
        <header className="home-nav">
          <motion.div
            className="home-nav__brand"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="home-nav__logo">K</div>
            <span className="home-nav__name">KUDA</span>
          </motion.div>

          <motion.nav
            className="home-nav__links"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Link to="/login" className="home-nav__btn home-nav__btn--ghost">
              <LogIn size={16} />
              <span>Sign In</span>
            </Link>
            <Link to="/register-volunteer" className="home-nav__btn home-nav__btn--primary">
              <UserPlus size={16} />
              <span>Volunteer</span>
            </Link>
          </motion.nav>
        </header>

        {/* HERO CONTENT */}
        <div className="home-hero__content">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroIndex}
              className="home-hero__text-block"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <div className="home-hero__badge">
                <span>✦</span>
                <span>Koinonia Ushering Department</span>
                <span>✦</span>
              </div>
              <h1 className="home-hero__title">{heroTexts[heroIndex].title}</h1>
              <p className="home-hero__subtitle">{heroTexts[heroIndex].subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* CTA Buttons */}
          <motion.div
            className="home-hero__ctas"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link to="/login" className="home-cta home-cta--primary">
              <LogIn size={20} />
              <span>Sign In to Dashboard</span>
            </Link>
            <Link to="/register-volunteer" className="home-cta home-cta--outline">
              <UserPlus size={20} />
              <span>Register as Volunteer</span>
            </Link>
          </motion.div>
        </div>

        {/* SLIDE CONTROLS */}
        <button className="home-hero__arrow home-hero__arrow--left" onClick={prevSlide} aria-label="Previous">
          <ChevronLeft size={24} />
        </button>
        <button className="home-hero__arrow home-hero__arrow--right" onClick={nextSlide} aria-label="Next">
          <ChevronRight size={24} />
        </button>

        {/* DOTS */}
        <div className="home-hero__dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`home-hero__dot ${i === currentSlide ? 'home-hero__dot--active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* SLIDE COUNTER */}
        <div className="home-hero__counter">
          <span className="home-hero__counter-current">{String(currentSlide + 1).padStart(2, '0')}</span>
          <span className="home-hero__counter-sep" />
          <span className="home-hero__counter-total">{String(slides.length).padStart(2, '0')}</span>
        </div>

        {/* SCROLL HINT */}
        <div className="home-hero__scroll-hint">
          <div className="home-hero__scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ─── STATS SECTION ─── */}
      <section className="home-stats">
        <div className="home-stats__bg-gradient" />
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="home-stats__card"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.6 }}
            whileHover={{ y: -6, scale: 1.03 }}
          >
            <div className="home-stats__icon">{stat.icon}</div>
            <div className="home-stats__value">{stat.value}</div>
            <div className="home-stats__label">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* ─── IDENTITY SECTION ─── */}
      <section className="home-identity">
        <motion.div
          className="home-identity__text"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="home-section-tag">Who We Are</div>
          <h2 className="home-identity__heading">
            <span className="home-identity__heading--gold">This is</span> Koinonia
          </h2>
          <p className="home-identity__body">
            We are the Koinonia Ushering Department Abuja — a passionate team of dedicated volunteers
            committed to creating a warm, orderly, and Spirit-filled atmosphere for every service.
            We don't just open doors; we open hearts.
          </p>
          <p className="home-identity__body">
            From managing seating arrangements to ensuring smooth flow of services, every usher plays
            a vital role in making worship an extraordinary experience for all who walk through our doors.
          </p>
          <div className="home-identity__divider" />
          <div className="home-identity__ctas">
            <Link to="/register-volunteer" className="home-cta home-cta--primary">
              <UserPlus size={18} />
              <span>Join Our Team</span>
            </Link>
            <Link to="/privacy-policy" className="home-cta home-cta--ghost">
              <Shield size={18} />
              <span>Privacy Policy</span>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="home-identity__visual"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="home-identity__mosaic">
            {[pic1, pic5, pic8, pic17, pic21].map((src, i) => (
              <motion.div
                key={i}
                className={`home-identity__mosaic-item home-identity__mosaic-item--${i + 1}`}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                transition={{ duration: 0.3 }}
              >
                <img src={src} alt={`Gallery ${i + 1}`} />
              </motion.div>
            ))}
          </div>
          <div className="home-identity__glow" />
        </motion.div>
      </section>

      {/* ─── GALLERY RIBBON ─── */}
      <section className="home-gallery">
        <motion.div
          className="home-section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="home-section-tag">Our Moments</div>
          <h2 className="home-gallery__heading">Memories That Matter</h2>
        </motion.div>

        <div className="home-gallery__track-wrap">
          <div className="home-gallery__track home-gallery__track--left">
            {[...gallerySlides, ...gallerySlides].map((src, i) => (
              <div key={i} className="home-gallery__pill">
                <img src={src} alt={`Gallery moment ${i + 1}`} />
              </div>
            ))}
          </div>
          <div className="home-gallery__track home-gallery__track--right">
            {[...gallerySlides.slice(4), ...gallerySlides.slice(4)].map((src, i) => (
              <div key={i} className="home-gallery__pill">
                <img src={src} alt={`Gallery moment ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="home-join">
        <div className="home-join__bg" />
        <motion.div
          className="home-join__content"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="home-section-tag">Get Started</div>
          <h2 className="home-join__heading">Ready to Make a Difference?</h2>
          <p className="home-join__body">
            Whether you're an existing member or someone new to the family, there's a place for you here.
          </p>
          <div className="home-join__actions">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/login" className="home-cta home-cta--primary home-cta--lg">
                <LogIn size={20} />
                <span>Member Login</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/register-volunteer" className="home-cta home-cta--outline home-cta--lg">
                <UserPlus size={20} />
                <span>Register as Volunteer</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="home-footer">
        <div className="home-footer__inner">
          <div className="home-footer__brand">
            <div className="home-nav__logo">K</div>
            <div>
              <div className="home-footer__name">Koinonia Ushering Department</div>
              <div className="home-footer__sub">Abuja · Nigeria</div>
            </div>
          </div>
          <nav className="home-footer__links">
            <Link to="/login" className="home-footer__link">Sign In</Link>
            <Link to="/register-volunteer" className="home-footer__link">Register as Volunteer</Link>
            <Link to="/privacy-policy" className="home-footer__link">Privacy Policy</Link>
          </nav>
          <div className="home-footer__copy">
            © {new Date().getFullYear()} Koinonia Ushering Department Abuja. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
