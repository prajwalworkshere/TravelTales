
import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    loginUser,
    registerUser,
    getCurrentUser
} from "../services/authService";

import { TOKEN_STORAGE_KEY } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore the existing login session on application startup.
    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem(TOKEN_STORAGE_KEY);

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await getCurrentUser();

                // Support both common API response structures.
                setUser(response.data?.data || response.data?.user || response.data);
            } catch (error) {
                console.error("Session restoration failed:", error);

                localStorage.removeItem(TOKEN_STORAGE_KEY);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    // Login
    const login = async (credentials) => {
        const response = await loginUser(credentials);

        localStorage.setItem(
            TOKEN_STORAGE_KEY,
            response.token
        );

        setUser(
            response.data?.data ||
            response.data?.user ||
            response.data
        );

        return response;
    };

    // Register
    const register = async (userData) => {
        return await registerUser(userData);
    };

    // Update user information globally after profile editing.
    const updateUser = (updatedUser) => {
        setUser((previousUser) => ({
            ...previousUser,
            ...updatedUser
        }));
    };

    // Logout
    const logout = () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
    };

    const value = {
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === "ADMIN",
        login,
        register,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to access authentication state.
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
};

export default AuthContext;
