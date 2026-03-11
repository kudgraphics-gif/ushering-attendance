import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import './PrivacyPolicyPage.css';

export function PrivacyPolicyPage() {
    return (
        <div className="privacy-page">
            <div className="privacy-page__container">
                <header className="privacy-page__header">
                    <Link to="/login" className="privacy-page__back">
                        <ArrowLeft size={20} />
                        <span>Back to Login</span>
                    </Link>
                    <div className="privacy-page__icon">
                        <Shield size={48} />
                    </div>
                    <h1 className="privacy-page__title">Privacy Policy</h1>
                    <p className="privacy-page__subtitle">Koinonia Ushering Department Abuja</p>
                </header>

                <div className="privacy-page__content glass">
                    <section className="privacy-page__section">
                        <h2>Our Commitment to Privacy</h2>
                        <p>
                            At the <strong>Koinonia Ushering Department Abuja</strong>, your privacy and security are our highest priorities.
                            This Privacy Policy sets out how we collect, use, and protect any information that you give us when you use this platform.
                        </p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Data Usage & Advertisement</h2>
                        <p>
                            We want to be completely clear: <strong>we are not using the data collected here for advertisement</strong>,
                            nor for anything outside of identifying users and managing attendance on this platform.
                            We will never sell, distribute, or lease your personal information to third-party companies or any external entities.
                        </p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Data Retention & Deletion</h2>
                        <p>
                            Your data belongs to you. We only retain personal information for as long as necessary to fulfill the purposes of this platform.
                            If a user is removed or deleted from the platform, <strong>all of that user's data is also deleted immediately and permanently</strong> from our active databases.
                        </p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Security</h2>
                        <p>
                            We are committed to ensuring that your information is secure. In order to prevent unauthorized access or disclosure,
                            we have put in place suitable physical, electronic, and managerial procedures to safeguard and secure the information we collect online.
                        </p>
                    </section>
                </div>

                <footer className="privacy-page__footer">
                    &copy; {new Date().getFullYear()} Koinonia Ushering Department Abuja. All rights reserved.
                </footer>
            </div>
        </div>
    );
}
