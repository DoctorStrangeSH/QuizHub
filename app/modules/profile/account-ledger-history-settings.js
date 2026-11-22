export function isAccountLedgerHistoryPreviewEnabled(location, auth) {
    if (!location || !['localhost', '127.0.0.1'].includes(location.hostname)) return false;
    const user = auth?.currentUser;
    if (typeof user?.uid !== 'string' || !user.uid || user.isAnonymous) return false;
    const params = new URLSearchParams(location.search || '');
    return params.get('firebaseEmulator') === '1' &&
        params.get('accountLedgerHistoryPreview') === '1' &&
        auth.app?.options?.projectId === 'demo-quizhub';
}
