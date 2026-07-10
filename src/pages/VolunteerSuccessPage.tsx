import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import './VolunteerSuccessPage.css';

export function VolunteerSuccessPage() {
    return (
        <div className="vol-success">
            {/* Ambient background */}
            <div className="vol-success__bg">
                <div className="vol-success__orb vol-success__orb--1" />
                <div className="vol-success__orb vol-success__orb--2" />
            </div>

            <motion.div 
                className="vol-success__card glass-strong"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="vol-success__icon-wrap">
                    <CheckCircle2 size={48} className="vol-success__icon" />
                </div>
                
                <h1 className="vol-success__title">Application Received!</h1>
                <p className="vol-success__description">
                    Thank you for applying to serve in the Koinonia Ushering Department Abuja. Your application has been successfully submitted and is under review by department administrators.
                </p>

                <div className="vol-success__alert glass">
                    <Mail size={20} className="vol-success__alert-icon" />
                    <div className="vol-success__alert-content">
                        <h4>What happens next?</h4>
                        <p>Once your application is approved, you will receive an email containing your unique onboarding token and a link to set up your password.</p>
                    </div>
                </div>

                <div className="vol-success__actions">
                    <Link to="/" className="vol-success__btn vol-success__btn--home">
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
export default VolunteerSuccessPage;
