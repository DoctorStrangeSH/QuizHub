const UID = /^[A-Za-z0-9_-]{1,128}$/;

export async function createDirectChatId(firstUid, secondUid, cryptoApi = globalThis.crypto) {
    if (typeof firstUid !== 'string' || !UID.test(firstUid) ||
        typeof secondUid !== 'string' || !UID.test(secondUid) || firstUid === secondUid) {
        throw new Error('INVALID_CHAT_PARTICIPANTS');
    }
    if (!cryptoApi?.subtle || typeof cryptoApi.subtle.digest !== 'function') throw new Error('WEB_CRYPTO_REQUIRED');
    const pair = [firstUid, secondUid].sort();
    const bytes = new TextEncoder().encode(pair.join('\0'));
    const digest = await cryptoApi.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    return 'dm_' + hex.slice(0, 48);
}

export function renderUnreadBadge(count, label = 'Непрочитанные сообщения') {
    if (!Number.isSafeInteger(count) || count <= 0) return '';
    const visible = count > 99 ? '99+' : String(count);
    const safeLabel = String(label).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
    return `<span class="chat-unread-badge" role="status" aria-label="${safeLabel}">${visible}</span>`;
}