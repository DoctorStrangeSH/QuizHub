// Trusted-server social transitions. The caller must derive actorUid from verified
// authentication, never from an untrusted browser payload. Not deployed.
const UID = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_RELATIONSHIPS = 500;

function readIds(profile, field) {
    const raw = profile?.[field];
    if (!Array.isArray(raw) || raw.length > MAX_RELATIONSHIPS ||
        raw.some(id => typeof id !== 'string' || !UID.test(id)) ||
        new Set(raw).size !== raw.length) {
        throw new Error('SOCIAL_MIGRATION_REQUIRED');
    }
    return raw;
}

function add(ids, uid) {
    if (ids.includes(uid)) return ids;
    if (ids.length >= MAX_RELATIONSHIPS) throw new Error('SOCIAL_LIST_FULL');
    return [...ids, uid];
}
const remove = (ids, uid) => ids.filter(id => id !== uid);

export function transitionFriendship(operation, actorUid, targetUid, actor, target) {
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof targetUid !== 'string' || !UID.test(targetUid) || actorUid === targetUid) {
        throw new Error('INVALID_SOCIAL_TARGET');
    }
    if (!['send', 'accept', 'decline', 'cancel', 'remove'].includes(operation)) {
        throw new Error('INVALID_SOCIAL_OPERATION');
    }
    const a = {
        friends: readIds(actor, 'friends'),
        friendRequests: readIds(actor, 'friendRequests'),
        sentRequests: readIds(actor, 'sentRequests')
    };
    const b = {
        friends: readIds(target, 'friends'),
        friendRequests: readIds(target, 'friendRequests'),
        sentRequests: readIds(target, 'sentRequests')
    };
    const areFriends = a.friends.includes(targetUid) && b.friends.includes(actorUid);
    const incoming = a.friendRequests.includes(targetUid) && b.sentRequests.includes(actorUid);
    const outgoing = a.sentRequests.includes(targetUid) && b.friendRequests.includes(actorUid);
    if (a.friends.includes(targetUid) !== b.friends.includes(actorUid) ||
        a.friendRequests.includes(targetUid) !== b.sentRequests.includes(actorUid) ||
        a.sentRequests.includes(targetUid) !== b.friendRequests.includes(actorUid) ||
        (incoming && outgoing) || (areFriends && (incoming || outgoing))) {
        throw new Error('SOCIAL_STATE_CONFLICT');
    }

    if (operation === 'send') {
        if (areFriends || outgoing) return { status: 'unchanged' };
        if (incoming) throw new Error('INCOMING_REQUEST_EXISTS');
        a.sentRequests = add(a.sentRequests, targetUid);
        b.friendRequests = add(b.friendRequests, actorUid);
    } else if (operation === 'accept') {
        if (areFriends) return { status: 'unchanged' };
        if (!incoming) throw new Error('REQUEST_NOT_FOUND');
        a.friendRequests = remove(a.friendRequests, targetUid);
        b.sentRequests = remove(b.sentRequests, actorUid);
        a.friends = add(a.friends, targetUid);
        b.friends = add(b.friends, actorUid);
    } else if (operation === 'decline') {
        if (!incoming) return { status: 'unchanged' };
        a.friendRequests = remove(a.friendRequests, targetUid);
        b.sentRequests = remove(b.sentRequests, actorUid);
    } else if (operation === 'cancel') {
        if (!outgoing) return { status: 'unchanged' };
        a.sentRequests = remove(a.sentRequests, targetUid);
        b.friendRequests = remove(b.friendRequests, actorUid);
    } else if (operation === 'remove') {
        if (!areFriends) return { status: 'unchanged' };
        a.friends = remove(a.friends, targetUid);
        b.friends = remove(b.friends, actorUid);
    }
    return { status: 'updated', actor: a, target: b };
}

export async function updateFriendship(db, { operation, actorUid, targetUid }) {
    if (!db || typeof db.runTransaction !== 'function' || typeof db.collection !== 'function') {
        throw new TypeError('TRUSTED_DATABASE_REQUIRED');
    }
    if (typeof actorUid !== 'string' || !UID.test(actorUid) ||
        typeof targetUid !== 'string' || !UID.test(targetUid) || actorUid === targetUid) {
        throw new Error('INVALID_SOCIAL_TARGET');
    }
    const actorRef = db.collection('users').doc(actorUid);
    const targetRef = db.collection('users').doc(targetUid);
    return db.runTransaction(async tx => {
        // Read before writes, and update only the three social arrays.
        const actorSnap = await tx.get(actorRef);
        const targetSnap = await tx.get(targetRef);
        if (!actorSnap.exists || !targetSnap.exists) throw new Error('PROFILE_NOT_FOUND');
        const result = transitionFriendship(operation, actorUid, targetUid,
            actorSnap.data(), targetSnap.data());
        if (result.status === 'updated') {
            tx.update(actorRef, result.actor);
            tx.update(targetRef, result.target);
        }
        return { status: result.status };
    });
}
