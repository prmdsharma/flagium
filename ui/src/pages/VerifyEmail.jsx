import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import logo from '../assets/logo.png';

export default function VerifyEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (token) {
            api.verifyEmail(token)
                .then(res => {
                    setStatus('success');
                    setMessage(res.message || 'Email verified successfully!');
                    // Redirect to login after 3 seconds
                    setTimeout(() => navigate('/login'), 3000);
                })
                .catch(err => {
                    setStatus('error');
                    setMessage(err.message || 'Verification failed. The link may be invalid or expired.');
                });
        }
    }, [token, navigate]);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <img src="/assets/logo.png" alt="Flagium AI" className="auth-logo" />
                    <h2>Email Verification</h2>
                </div>

                <div className={`status-box ${status}`}>
                    {status === 'verifying' && <div className="spinner"></div>}
                    <p>{message}</p>

                    {status === 'success' && (
                        <p className="sub-text">Redirecting to login...</p>
                    )}

                    {status === 'error' && (
                        <button className="btn-primary" onClick={() => navigate('/login')}>
                            Back to Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
