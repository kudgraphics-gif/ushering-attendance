import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import './PrivacyPolicyPage.css';

export function PrivacyPolicyPage() {
    return (
        <div className="privacy-page">
            <div className="privacy-page__container">
                <header className="privacy-page__header">
                    <Link to="/" className="privacy-page__back">
                        <ArrowLeft size={20} />
                        <span>Back to Home</span>
                    </Link>
                    <div className="privacy-page__icon">
                        <Shield size={48} />
                    </div>
                    <h1 className="privacy-page__title">Privacy Policy</h1>
                    <p className="privacy-page__subtitle">Koinonia Ushering Department Abuja ("KUDA") Attendance System</p>
                </header>

                <div className="privacy-page__content glass">
                    <section className="privacy-page__section">
                        <h2>Introduction</h2>
                        <p>Koinonia Ushering Department Abuja, "KUDA" is an attendance management platform owned and operated by the Koinonia Ushering Department Abuja. We are committed to protecting the privacy and personal data of individuals who use the Website. This Privacy Policy explains how we collect, use, disclose, and protect personal data when you access or use the KUDA attendance management platform. This Privacy Policy applies to the website and to any information collected through the platform, including all features and functionalities available on the website.</p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Purpose</h2>
                        <p>This Privacy Policy explains how we collect and process your personal data when you use the KUDA attendance management platform, including any information you provide through the platform. It is important that you read this Privacy Policy together with any other privacy notice we may provide when collecting or processing your personal data so that you are fully aware of how and why we use your data.</p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Interpretation and Definition</h2>
                        <p>For the purposes of this Privacy Policy:</p>
                        <ul>
                            <li><strong>Account</strong> means a unique account created for you to access our Website.</li>
                            <li><strong>Website</strong> refers to the Koinonia Ushering Department Abuja (KUDA) Attendance System, accessible from https://app.koinoniaushers.cloud/.</li>
                            <li><strong>Device</strong> means any device that can access the KUDA Website, such as a computer, a cell phone, or a digital tablet. </li>
                            <li><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</li>
                            <li><strong>Usage Data</strong> refers to data collected automatically, either generated using the Service or from the Service infrastructure itself. </li>
                            <li><strong>We/Our/Us</strong> refers to Koinonia Ushering Department Abuja, as the Data Controller/Processor.</li>
                            <li><strong>You or Your</strong> means the individual who accesses or uses the Service.</li>
                        </ul>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Who Are We?</h2>
                        <p>We are the Koinonia Ushering Department Abuja, and we operate the KUDA attendance management platform to facilitate the recording and management of attendance for the Koinonia Ushering Department members in Abuja. By using the website, you consent to the data practices described in this Privacy Policy.</p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Information We Collect</h2>
                        <p>To provide the services available on the KUDA attendance management platform, we may collect the following information:</p>
                        <ul>
                            <li><strong>Personal Information:</strong> When you use our website, we may collect personal data such as your name, email address, phone number, date of birth, photograph, address, gender, and attendance records.</li>
                            <li><strong>Usage Data:</strong> We may collect information about your interactions with the website, such as login times, pages accessed, and other system activity and interactions.</li>
                        </ul>
                        <p>We only collect personal data that you voluntarily provide or that is necessary for the operation of the attendance management platform.</p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Data Collected Automatically</h2>
                        <p>When you access the website, certain information may be collected automatically, including:</p>
                        <ul>
                            <li><strong>Location Information:</strong> your general location may be inferred through your Internet Protocol (IP) address.</li>
                            <li><strong>Device Information:</strong> We may collect information about the device you use to access the website, including: IP address.</li>
                            <li><strong>Usage Information:</strong> We may collect information about your interactions with the platform, including: features used, attendance submissions, dates, and times of access.</li>
                        </ul>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Purpose of Data Collection</h2>
                        <p>We collect personal data for the following purposes:</p>
                        <ul>
                            <li>To register and manage user accounts.</li>
                            <li>To record and manage members' attendance for the department.</li>
                            <li>To administer and maintain the attendance platform.</li>
                            <li>To improve the functionality and user experience of the website.</li>
                            <li>To communicate important updates or notifications to users, and to comply with legal and regulatory obligations.</li>
                        </ul>
                    </section>

                    <section className="privacy-page__section">
                        <h2>How We Use Your Information</h2>
                        <p>We may use the information collected to:</p>
                        <ul>
                            <li>Manage user accounts and access to the platform, and record and track attendance activities.</li>
                            <li>Improve and maintain the performance of the system, provide administrative support and communication, and monitor usage trends and system performance.</li>
                            <li>Protect the security and integrity of the platform.</li>
                        </ul>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Sharing Your Information</h2>
                        <p>We may share your information with:</p>
                        <ul>
                            <li><strong>Administrative Personnel:</strong> Authorized personnel within the Koinonia Ushering Department Abuja, are responsible for managing attendance and coordinating departmental activities.</li>
                            <li><strong>Legal Requirements:</strong> Where disclosure is required to comply with applicable laws, regulations, or legal obligations.</li>
                        </ul>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Data Security</h2>
                        <p>We implement appropriate technical and organizational measures to protect personal data from unauthorized access, loss, misuse, or disclosure. These measures include secure access controls and system monitoring. However, no internet-based service can be completely secure. Users are encouraged to take reasonable steps to protect their personal data.</p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Your Data Rights</h2>
                        <p>As a data subject, subject to the applicable data protection laws, you have certain rights regarding your personal data, which are:</p>
                        <ul>
                            <li>If we process your data based on your consent, to withdraw your consent at any time.</li>
                            <li>To correct your data if it is inaccurate or complete your data if it's incomplete.</li>
                            <li>If we process your data based on your consent or to fulfil a contract, to receive a copy of your personal information that was processed.</li>
                            <li>To request that the erasure (deletion) of your personal data (in certain cases).</li>
                            <li>To ask us to stop processing (restrict processing) your personal information.</li>
                            <li>Where we process your data based on your consent or performance of a contract, you can ask us to transfer your personal data to a third party indicated by you.</li>
                        </ul>
                        <p>Individuals also have the opportunity to choose whether their personally identifiable data is to be disclosed to a third party or to be used for a purpose other than the purpose it was originally collected or subsequently authorized by the individual. When you request that we remove any of your data that we have on our systems, we will respond as soon as practically possible. You may contact our privacy officer at kudaprivacy@gmail.com.</p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Retention of Data</h2>
                        <p>We retain your personal data for as long as necessary for the purpose(s) it was collected. Storage of your data is also determined by legal, regulatory, administrative, or operational requirements, which are considered customary in our sector. We retain only the information necessary to comply with legal and regulatory requests for specific data, fulfill necessary business undertakings and auditing prerequisites, address complaints and inquiries, and handle any potential disputes or claims that might arise. Data that is not retained is carefully destroyed when it is identified as no longer needed for the purposes for which it was collected. </p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Reviewing Your Personal Information</h2>
                        <p>In all cases, you can make a request to review and correct your personal data that is collected via our website or that you provide when you contact us by contacting us using the contact information stated in this policy. We may take steps to verify your identity before providing you access to your personal information. You can help us to maintain the accuracy of your information by notifying us of any change to your mailing address, phone number, or e-mail address. </p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Analytics & International Data Transfers</h2>
                        <p>We may use third-party analytics tools to monitor and analyze the use of the website in order to improve system performance and user experience. For example, we may use analytics services that track and report website traffic and usage patterns. Where Personal Data is to be transferred to a country outside Nigeria, we shall put adequate measures in place to ensure the security of such personal data and to ensure same is done securely and in accordance with the Nigerian Data Protection Laws. </p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Changes to this Privacy Policy</h2>
                        <p>We reserve the right to change this Privacy Policy from time to time. We will notify you of any significant changes in the way we treat personal data by sending a notice to the primary email address specified in your account or by placing a prominent notice on our website, and/or by updating any privacy information on this page.You are advised to review this Privacy Policy periodically for any changes. The pasting of the update notice on our website shall be considered adequate notice to you. Your continued use of the website after such modification will constitute your: a) acknowledgement of the modified privacy Policy;  and b) agreement to abide and be bound by that policy.</p>
                    </section>

                    <section className="privacy-page__section">
                        <h2>Governing Law & Contact Us</h2>
                        <p>This Privacy Policy is governed by the laws of the Federal Republic of Nigeria. You agree to submit to the exclusive jurisdiction of the courts of the country. All access requests, questions, comments, complaints, and other requests regarding the privacy policy should be sent to kudaprivacy@gmail.com. We may request additional details from you regarding your complaints and keep a record of your requests and resolutions.</p>
                    </section>
                </div>

                <footer className="privacy-page__footer">
                    &copy; {new Date().getFullYear()} Koinonia Ushering Department Abuja. All rights reserved.
                </footer>
            </div>
        </div>
    );
}