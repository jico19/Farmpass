import { accountError, matchesAccount } from './browserAccount';
import { connectionMessage, isOffline } from './connection';
import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
});

let refreshPromise = null;

async function refreshAccessToken() {
    const authStorage = sessionStorage.getItem('auth-context');
    if (!authStorage) throw new Error('no auth context');
    const parsed = JSON.parse(authStorage);
    if (!matchesAccount(parsed?.state)) throw accountError();
    const refreshToken = parsed?.state?.refresh;
    if (!refreshToken) throw new Error('no refresh token');
    const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/token/refresh/`, { refresh: refreshToken });
    const { default: useAuthStore } = await import('../store/authStore');
    if (!matchesAccount(parsed.state) || useAuthStore.getState().sessionId !== parsed.state.sessionId) throw accountError();
    parsed.state.access = res.data.access;
    if (res.data.refresh) parsed.state.refresh = res.data.refresh;
    sessionStorage.setItem('auth-context', JSON.stringify(parsed));
    useAuthStore.setState({ access: res.data.access, refresh: res.data.refresh || parsed.state.refresh });
    return res.data.access;
}

// Request Interceptor: Attach the access token from sessionStorage
api.interceptors.request.use(
    (config) => {
        assertRequestAccount(config);
        if (isOffline() && !['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
            const error = new Error('Offline');
            error.code = 'ERR_NETWORK';
            error.config = config;
            return Promise.reject(error);
        }
        const stored = JSON.parse(sessionStorage.getItem('auth-context') || 'null');
        if (stored?.state?.access && !matchesAccount(stored.state)) throw accountError();
        try {
            const authStorage = sessionStorage.getItem('auth-context');
            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                const token = parsed?.state?.access;
                if (token) {
                    config._accountSession = parsed.state.sessionId;
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (e) {
            console.error("Failed to parse auth token", e);
        }
        return config;
    },
    (error) => {
        if (error.userMessage && !error.response && error.code !== 'ERR_CANCELED') window.dispatchEvent(new CustomEvent('farmpass:connection', { detail: error.userMessage }));
        return Promise.reject(error);
    }
);

function assertRequestAccount(config) {
    if (!config?._accountSession) return;
    const state = JSON.parse(sessionStorage.getItem('auth-context') || 'null')?.state;
    if (!matchesAccount(state) || state.sessionId !== config._accountSession) throw accountError();
}

// Response Interceptor: Handle token refresh on 401 Unauthorized
api.interceptors.response.use(
    (response) => {
        assertRequestAccount(response.config);
        window.dispatchEvent(new CustomEvent('farmpass:connection', { detail: '' })); return response; },
    async (error) => {
        const originalRequest = error.config || {};
        assertRequestAccount(originalRequest);
        if (error.code === 'ERR_CANCELED') return Promise.reject(error);
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            if (!refreshPromise) {
                refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
            }
            try {
                const newAccess = await refreshPromise;
                originalRequest.headers.Authorization = `Bearer ${newAccess}`;
                return api(originalRequest);
            } catch (refreshError) {
                assertRequestAccount(originalRequest);
                if (refreshError.code === 'ERR_CANCELED') return Promise.reject(refreshError);
                if (!refreshError.response || ![400, 401, 403].includes(refreshError.response.status)) {
                    refreshError.userMessage = connectionMessage(refreshError) || 'Cannot refresh your session. Please try again shortly.';
                    return Promise.reject(refreshError);
                }
                console.error("Token refresh rejected", refreshError);
                const { default: useAuthStore } = await import('../store/authStore');
                assertRequestAccount(originalRequest);
                useAuthStore.getState().clearSession();
                if (!window.__fp_refresh_redirected) { window.__fp_refresh_redirected = true; window.location.href = '/login'; }
            }
        }

        // Normalize 500-level errors
        if (error.response?.status >= 500) {
            // Attach a normalized message for components to display
            error.userMessage = 'A server error occurred. Please try again later.';
        }
        // Normalize network errors (no response at all)
        if (!error.response) {
            error.userMessage = connectionMessage(error);
            if (!['get', 'head', 'options'].includes(originalRequest.method?.toLowerCase()) && error.request && !isOffline()) error.userMessage = 'We couldn?t confirm whether this action completed. Check its status before trying again.';
        }

        if (error.userMessage && !error.response && error.code !== 'ERR_CANCELED') window.dispatchEvent(new CustomEvent('farmpass:connection', { detail: error.userMessage }));
        return Promise.reject(error);
    }
);
