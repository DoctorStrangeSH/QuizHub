import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const auth = readFileSync(new URL('../app/modules/auth/auth.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/modules/auth/auth.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../app/app.js', import.meta.url), 'utf8');
const router = readFileSync(new URL('../app/router.js', import.meta.url), 'utf8');

test('login and registration preserve Firebase identity and existing profile routing', () => {
    assert.match(auth, /signInWithEmailAndPassword\(auth, email, password\)/);
    assert.match(auth, /createUserWithEmailAndPassword\(auth, email, password\)/);
    assert.match(auth, /signInWithPopup\(auth, provider\)/);
    assert.match(auth, /browserLocalPersistence/);
    assert.match(app, /doc\(db, 'users', user\.uid\)/);
    assert.match(app, /onAuthStateChanged\(auth,/);
    assert.doesNotMatch(auth, /setDoc\(|updateDoc\(|deleteDoc\(/);
});

test('Google sign-in and password reset show localized accessible feedback', () => {
    assert.match(auth, /new GoogleAuthProvider\(\)/);
    assert.match(auth, /sendPasswordResetEmail\(auth, email\)/);
    assert.match(auth, /id="auth-feedback"[^>]*role="status"[^>]*aria-live="polite"/);
    assert.match(auth, /auth\/unauthorized-domain/);
    assert.match(auth, /auth\/account-exists-with-different-credential/);
    assert.match(auth, /const labels = \{\s*ru:/);
    assert.match(auth, /\ben:\s*\{/);
    assert.match(css, /\.auth-feedback--error/);
    assert.doesNotMatch(auth, /\balert\(/);
});

test('buttons cannot dispatch duplicate requests while authentication is pending', () => {
    assert.match(auth, /lockButtons\(true\)/);
    assert.match(auth, /finally \{\s*lockButtons\(false\)/);
});

test('account switching invalidates stale profile checks and saved routes', () => {
    assert.match(app, /let authRevision = 0/);
    assert.match(app, /const revision = \+\+authRevision/);
    assert.match(app, /revision !== authRevision \|\| auth\.currentUser\?\.uid !== user\.uid/);
    assert.match(app, /ownerUid === user\.uid \? sessionStorage\.getItem\('lastRoute'\) : null/);
    assert.match(app, /sessionStorage\.setItem\('lastRouteOwnerUid', user\.uid\)/);
    assert.match(app, /sessionStorage\.removeItem\('lastRouteOwnerUid'\)/);
    assert.match(app, /setState\('profile', null\)/);
});

test('pending daily reward UI cannot be attached to a different user', () => {
    assert.match(router, /const ownerUid = getState\(\)\.currentUser\?\.uid/);
    assert.match(router, /revision !== renderRevision \|\| getState\(\)\.currentRoute !== 'home'/);
    assert.match(router, /getState\(\)\.currentUser\?\.uid !== ownerUid/);
    assert.match(app, /getElementById\('daily-popup-container'\)\?\.remove\(\)/);
});

test('temporary profile load failures cannot be mistaken for new accounts', () => {
    assert.match(app, /return null;\s*\}\s*\}\s*async function checkWeeklyReset/);
    assert.match(app, /hasProfile === null \? 'profileUnavailable'/);
    assert.match(router, /profileUnavailable: \(\) =>/);
    assert.match(router, /id="retry-profile"/);
    assert.match(router, /Создавать новый аккаунт не нужно/);
    assert.match(router, /location\.reload\(\)/);
});
