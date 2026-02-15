import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for token on load
    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem("flagium_token");
            if (token) {
                try {
                    // Verify token (Mocking validation by just decoding or fetching /me)
                    // For now, we assume if token exists, we fetch /me
                    api.setToken(token); // Ensure API uses it
                    const profile = await api.getMe();
                    setUser(profile);
                } catch (e) {
                    console.error("Auth check failed", e);
                    localStorage.removeItem("flagium_token");
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        localStorage.setItem("flagium_token", data.access_token);
        api.setToken(data.access_token);

        // Fetch profile
        const profile = await api.getMe();
        setUser(profile);
        return profile;
    };

    const logout = () => {
        localStorage.removeItem("flagium_token");
        api.setToken(null);
        setUser(null);
    };

    const register = async (email, password, fullName) => {
        const profile = await api.register(email, password, fullName);
        // Auto login often nice, but for now let's ask to login or just return
        return profile;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
