import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function RegistrationSuccess() {
    const navigate = useNavigate();

    return (
        <div className="success-page-full">
            <div className="heroic-content">
                <div style={{ marginBottom: '64px' }}>
                    <img src={logo} alt="Flagium" style={{ width: '100px', margin: '0 auto' }} />
                </div>

                <div className="heroic-icon-container">
                    ✓
                </div>

                <h1 className="heroic-title">
                    Identity Established
                </h1>

                <div className="heroic-msg">
                    <p style={{ marginBottom: '20px' }}>
                        Your registration was successful. A verification link has been dispatched to your email address.
                    </p>
                    <p>
                        <strong>Please confirm the link in your inbox</strong> before attempting to decrypt the terminal and access your risk intelligence.
                    </p>
                </div>

                <button
                    className="login-btn"
                    onClick={() => navigate('/login')}
                    style={{
                        width: 'auto',
                        padding: '16px 56px',
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 auto',
                        borderRadius: 'var(--radius-md)'
                    }}
                >
                    Return to Terminal Access
                </button>

                <div style={{ marginTop: '64px', fontSize: '15px', color: 'var(--text-muted)' }}>
                    Didn't receive the email? Check your junk folder or contact support.
                </div>
            </div>
        </div>
    );
}
