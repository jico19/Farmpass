import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountSnapshot, accountTransition, claimAccount, endAccount, matchesAccount } from './browserAccount.js';

test('one account owns all tabs, logout invalidates old sessions and pending logins', async () => {
    const storage = new Map();
    globalThis.localStorage = {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
    };
    let queue = Promise.resolve();
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
        locks: { request: (_name, action) => {
            const result = queue.then(action);
            queue = result.catch(() => {});
            return result;
        } },
    } });
    const snapshot = accountSnapshot();
    const results = await Promise.allSettled([
        accountTransition(() => claimAccount(1, snapshot)),
        accountTransition(() => claimAccount(2, snapshot)),
    ]);
    assert.equal(results[0].status, 'fulfilled');
    assert.equal(results[1].status, 'rejected');
    const a = { user: { id: 1 }, sessionId: results[0].value };
    assert.ok(matchesAccount(a));
    assert.equal(claimAccount(1, accountSnapshot()), a.sessionId);
    assert.throws(() => claimAccount(2, accountSnapshot()), /Another account/);
    const pending = accountSnapshot();
    endAccount();
    assert.equal(matchesAccount(a), false);
    assert.throws(() => claimAccount(1, pending), /session ended/);
    const b = { user: { id: 2 }, sessionId: claimAccount(2, accountSnapshot()) };
    assert.ok(matchesAccount(b));
    assert.equal(matchesAccount(a), false);
    assert.equal(matchesAccount({ user: { id: 2 } }), false);
    assert.equal(accountSnapshot().includes('access'), false);
    navigator.locks = undefined;
    await assert.rejects(accountTransition(() => {}), /HTTPS or localhost/);
});
