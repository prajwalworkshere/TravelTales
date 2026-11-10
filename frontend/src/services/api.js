
import axios from "axios";

// JWT storage key used throughout the frontend.
export const TOKEN_STORAGE_KEY = "traveltales_token";

// Create a shared Axios instance.
const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:5000/api",

    headers: {
        "Content-Type": "application/json"
    }
});

// Automatically attach JWT to protected API requests.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
