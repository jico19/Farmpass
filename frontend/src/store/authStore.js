import { ACCOUNT_KEY, accountSnapshot, activeAccount, accountTransition, claimAccount, endAccount, matchesAccount } from '../lib/browserAccount';
import { connectionMessage, isOffline } from '../lib/connection';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            access: null,
            refresh: null,
            isAuthenticated: false,
            sessionId: null,
            browserAccountActive: activeAccount()?.userId != null,

            // Login Action
            login: async (credentials) => {
                const snapshot = accountSnapshot();
                try {
                    if (isOffline()) throw Object.assign(new Error('Offline'), { code: 'ERR_NETWORK' });
                    const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/login/`, credentials)
                    const decoded = JSON.parse(atob(res.data.access.split('.')[1]))
                    const user = {
                        id: decoded.id,
                        username: decoded.username,
                        role: decoded.role,
                        first_name: decoded.first_name,
                        last_name: decoded.last_name,
                        barangay: decoded.barangay,
                        barangay_name: decoded.barangay_name,
                        verification_status: decoded.verification_status || 'UNVERIFIED'
                    };

                    await accountTransition(() => {
                        const sessionId = claimAccount(user.id, snapshot);
                        set({
                            sessionId,
                            browserAccountActive: true,
                            user: user,
                            access: res.data.access,
                            refresh: res.data.refresh,
                            isAuthenticated: true,
                        });
                    });
                } catch (error) {
                    console.error("Login failed:", error);
                    error.userMessage ||= connectionMessage(error);
                    throw error
                }
            },

            // Update user state dynamically
            updateUser: (updatedFields) => {
                set((state) => ({
                    user: state.user ? { ...state.user, ...updatedFields } : null
                }));
            },

            // Fetch fresh user profile
            fetchUserProfile: async () => {
                try {
                    const sessionId = useAuthStore.getState().sessionId;
                    const access = useAuthStore.getState().access;
                    if (!access) return null;
                    const { api } = await import('../lib/api');
                    const res = await api.get('/user/me/');
                    if (res.data && sessionId === useAuthStore.getState().sessionId && matchesAccount(useAuthStore.getState())) {
                        set((state) => ({
                            user: {
                                ...state.user,
                                verification_status: res.data.verification_status,
                                verification_remarks: res.data.verification_remarks,
                                verified_at: res.data.verified_at,
                                first_name: res.data.first_name,
                                last_name: res.data.last_name,
                            }
                        }));
                        return res.data;
                    }
                } catch (error) {
                    console.error("Failed to fetch fresh user profile:", error);
                }
                return null;
            },

            // Logout Action
            logout: () => accountTransition(() => {
                endAccount();
                useAuthStore.getState().clearSession();
            }),

            clearSession: () => {
                try {
                    const videos = document.querySelectorAll('video');
                    videos.forEach((video) => {
                        if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
                            video.srcObject.getTracks().forEach((track) => track.stop());
                            video.srcObject = null;
                        }
                    });
                } catch {
                    // ignore
                }
                set({ user: null, access: null, refresh: null, isAuthenticated: false, sessionId: null, browserAccountActive: activeAccount()?.userId != null });
                sessionStorage.removeItem('auth-context');
            },
        }),
        {
            name: 'auth-context', // unique name for sessionStorage
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);

function reconcileAccount() {
    const state = useAuthStore.getState();
    if (state.access && !matchesAccount(state)) state.clearSession();
    useAuthStore.setState({ browserAccountActive: activeAccount()?.userId != null });
}

reconcileAccount();
window.addEventListener('storage', (event) => {
    if (event.key === ACCOUNT_KEY || event.key === null) reconcileAccount();
});
window.addEventListener('pageshow', reconcileAccount);
window.addEventListener('focus', reconcileAccount);
document.addEventListener('visibilitychange', reconcileAccount);

export default useAuthStore;
