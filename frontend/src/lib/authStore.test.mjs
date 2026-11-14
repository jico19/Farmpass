import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import axios from 'axios';
import { ACCOUNT_KEY } from './browserAccount.js';

test('auth store preserves A on rejected B login and clears all tabs on logout', async () => {
    const storage = () => {
        const values = new Map();
        return { getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
    };
    globalThis.localStorage = storage();
    globalThis.sessionStorage = storage();
    Object.defineProperty(globalThis, 'navigator', { configurable: true,
        value: { locks: { request: async (_name, action) => action() } } });
    globalThis.document = { querySelectorAll: () => [], addEventListener: () => {} };
    const listeners = {};
    globalThis.window = { addEventListener: (name, action) => { listeners[name] = action; } };
    const originalPost = axios.post;
    const originalError = console.error;
    console.error = () => {};
    const token = (id) => `header.${btoa(JSON.stringify({ id, username: `user${id}`, role: 'Farmer' }))}.signature`;
    axios.post = async (_url, credentials) => {
        if (credentials.username === 'invalid') throw new Error('Invalid credentials');
        return { data: { access: token(credentials.id), refresh: `refresh${credentials.id}` } };
    };
    let source = await readFile(new URL('../store/authStore.js', import.meta.url), 'utf8');
    for (const specifier of ['zustand', 'zustand/middleware', 'axios']) {
        source = source.replace(`from '${specifier}'`, `from '${import.meta.resolve(specifier)}'`);
    }
    source = source.replace("from '../lib/browserAccount'", `from '${new URL('./browserAccount.js', import.meta.url)}'`)
        .replace("from '../lib/connection'", `from '${new URL('./connection.js', import.meta.url)}'`)
        .replaceAll('import.meta.env.VITE_BASE_URL', "'http://test'");
    try {
        const { default: store } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        await store.getState().login({ id: 1 });
        const sessionId = store.getState().sessionId;
        await assert.rejects(store.getState().login({ id: 2 }), /Another account/);
        await assert.rejects(store.getState().login({ username: 'invalid' }), /Invalid credentials/);
        assert.equal(store.getState().user.id, 1);
        assert.equal(store.getState().sessionId, sessionId);
        assert.ok(sessionStorage.getItem('auth-context').includes('refresh1'));
        assert.equal(localStorage.getItem(ACCOUNT_KEY).includes('refresh'), false);
        const pending = Promise.withResolvers();
        axios.post = () => pending.promise;
        const login = store.getState().login({ id: 1 });
        await store.getState().logout();
        pending.resolve({ data: { access: token(1), refresh: 'oldRefresh' } });
        await assert.rejects(login, /session ended/);
        assert.equal(store.getState().access, null);
        // A suspended tab must discard its copied tokens when it resumes.
        store.setState({ user: { id: 1 }, access: token(1), sessionId, isAuthenticated: true });
        listeners.storage({ key: ACCOUNT_KEY });
        assert.equal(store.getState().isAuthenticated, false);
        assert.equal(store.getState().access, null);
    } finally {
        axios.post = originalPost;
        console.error = originalError;
    }
});
