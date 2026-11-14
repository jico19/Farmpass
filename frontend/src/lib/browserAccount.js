export const ACCOUNT_KEY = 'farmpass-active-account';

export const accountSnapshot = () => localStorage.getItem(ACCOUNT_KEY);
export const activeAccount = () => {
    try { return JSON.parse(accountSnapshot()); } catch { return null; }
};

export function accountError(message = 'Your session ended. Please sign in again.') {
    return Object.assign(new Error(message), { code: 'ERR_CANCELED', userMessage: message });
}

export async function accountTransition(action) {
    if (!navigator.locks) {
        throw accountError('Secure browser sessions require HTTPS or localhost and a browser supporting Web Locks.');
    }
    return navigator.locks.request('farmpass-account', action);
}

export function claimAccount(userId, expectedSnapshot) {
    const current = activeAccount();
    if (accountSnapshot() !== expectedSnapshot) throw accountError();
    if (current?.userId != null && String(current.userId) !== String(userId)) {
        throw accountError('Another account is signed in in this browser. Sign out the current account before switching.');
    }
    const marker = current?.userId != null ? current : { userId, sessionId: crypto.randomUUID() };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(marker));
    return marker.sessionId;
}

export function endAccount() {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ userId: null, sessionId: crypto.randomUUID() }));
}

export function matchesAccount(state) {
    const marker = activeAccount();
    return Boolean(state?.sessionId && state?.user && marker?.userId != null &&
        marker.sessionId === state.sessionId && String(marker.userId) === String(state.user.id));
}
