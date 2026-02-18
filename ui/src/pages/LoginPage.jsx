import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.pathname === "/register") {
            setIsLogin(false);
        }
    }, [location.pathname]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            if (isLogin) {
                await login(email, password);
                navigate("/dashboard");
            } else {
                await register(email, password, name);
                setSuccess("Registration successful! We've sent a verification link to your email. Please verify to continue.");
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <img src={logo} alt="Flagium" className="login-logo" />
                    <h1>Risk Terminal Access</h1>
                    <p>{isLogin ? "Authenticate" : "Initialize Identity"}</p>
                </div>

                {error && <div className="login-error">{error}</div>}
                {success && (
                    <div className="login-success-view">
                        <div className="login-success">{success}</div>
                        <button
                            className="login-btn"
                            onClick={() => {
                                setSuccess(null);
                                setIsLogin(true);
                            }}
                        >
                            Return to Login
                        </button>
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="mono-input"
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Email Credential</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mono-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Passcode</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mono-input"
                            />
                        </div>
                        <button type="submit" className="login-btn">
                            {isLogin ? "Decrypt & Enter" : "Establish Identity"}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="login-footer">
                        <span onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? "Request Access (Register)" : "Have Access? Login"}
                        </span>
                        {isLogin && (
                            <span onClick={() => navigate("/forgot-password")} style={{ marginLeft: '1rem', cursor: 'pointer', opacity: 0.8 }}>
                                Forgot Password?
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
