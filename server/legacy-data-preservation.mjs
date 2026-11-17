import { isDeepStrictEqual } from 'node:util';

// Pure comparison of two independently captured snapshot manifests.
// The caller must capture COMPLETE, CONSISTENT snapshots under a write freeze.
// The function never connects to a database and never emits document values.
export function verifyLegacyDataPreservation(before, after, {
    protectedCollections
} = {}) {
    if (!before || !after || !Array.isArray(protectedCollections) ||
        protectedCollections.length === 0 ||
        new Set(protectedCollections).size !== protectedCollections.length ||
        protectedCollections.some(name => typeof name !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,80}$/.test(name))) {
        throw new TypeError('EXPLICIT_PROTECTED_COLLECTIONS_REQUIRED');
    }
    const issues = [];
    const counts = {};
    const describe = (snapshot, collection) => {
        const records = snapshot?.[collection];
        if (!Array.isArray(records)) throw new TypeError('COMPLETE_SNAPSHOTS_REQUIRED: ' + collection);
        const byId = new Map();
        for (const record of records) {
            if (typeof record?.id !== 'string' || !record.id ||
                record.id.includes('/') || !Object.hasOwn(record, 'data') ||
                byId.has(record.id)) {
                throw new TypeError('INVALID_OR_DUPLICATE_SNAPSHOT_RECORD: ' + collection);
            }
            byId.set(record.id, record.data);
        }
        return byId;
    };
    for (const collection of protectedCollections) {
        const original = describe(before, collection);
        const current = describe(after, collection);
        counts[collection] = { before: original.size, after: current.size };
        for (const [id, oldData] of original) {
            if (!current.has(id)) {
                issues.push({ collection, id, code: 'DOCUMENT_MISSING' });
            } else if (!isDeepStrictEqual(oldData, current.get(id))) {
                issues.push({ collection, id, code: 'DOCUMENT_CHANGED' });
            }
        }
        for (const [id] of current) {
            if (!original.has(id)) issues.push({ collection, id, code: 'UNEXPECTED_DOCUMENT' });
        }
    }
    issues.sort((a, b) => a.collection.localeCompare(b.collection) ||
        a.id.localeCompare(b.id) || a.code.localeCompare(b.code));
    return {
        status: issues.length ? 'blocked' : 'preserved',
        checkedCollections: [...protectedCollections],
        counts,
        issueCount: issues.length,
        issues
    };
}
