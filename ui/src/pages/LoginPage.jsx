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
        try {
            if (isLogin) {
                await login(email, password);
                navigate("/dashboard");
            } else {
                await register(email, password, name);
                await login(email, password);
                navigate("/dashboard");
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

                <div className="login-footer">
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Request Access (Register)" : "Have Access? Login"}
                    </span>
                </div>
            </div>
        </div>
    );
}
