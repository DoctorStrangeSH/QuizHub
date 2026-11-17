import { createHash, timingSafeEqual } from 'node:crypto';
import { validateQuizHubMigrationManifest } from './firestore-migration-inventory.mjs';

const VERSION = 'quizhub-json-snapshot-v1';
const hash = text => createHash('sha256').update(text, 'utf8').digest('hex');

// Canonical JSON only. A Firestore export adapter must explicitly serialize
// Timestamp, GeoPoint, bytes and document references into tagged JSON first.
// Unsupported values MUST fail closed rather than silently disappear.
function canonical(value, seen = new Set()) {
    if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
    if (!value || typeof value !== 'object' || seen.has(value)) throw new TypeError('UNSUPPORTED_BACKUP_VALUE');
    if (Object.getPrototypeOf(value) !== Object.prototype && !Array.isArray(value)) {
        throw new TypeError('NON_JSON_BACKUP_VALUE');
    }
    seen.add(value);
    try {
        if (Array.isArray(value)) {
            if (Object.keys(value).length !== value.length) throw new TypeError('SPARSE_BACKUP_ARRAY');
            return '[' + value.map(item => canonical(item, seen)).join(',') + ']';
        }
        return '{' + Object.keys(value).sort().map(key => {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                throw new TypeError('UNSAFE_BACKUP_KEY');
            }
            return JSON.stringify(key) + ':' + canonical(value[key], seen);
        }).join(',') + '}';
    } finally { seen.delete(value); }
}

function collect(snapshot) {
    validateQuizHubMigrationManifest(snapshot);
    const collections = {};
    for (const key of Object.keys(snapshot).sort()) {
        if (!/^[A-Za-z][A-Za-z0-9_-]{0,80}$/.test(key) || !Array.isArray(snapshot[key])) {
            throw new TypeError('INVALID_BACKUP_COLLECTION');
        }
        const seen = new Set();
        const records = snapshot[key].map(record => {
            const id = record?.id;
            if (typeof id !== 'string' || !id ||
                id.split('/').some(segment => !segment || segment === '.' || segment === '..') ||
                seen.has(id) || !Object.hasOwn(record, 'data')) {
                throw new TypeError('INVALID_OR_DUPLICATE_BACKUP_RECORD');
            }
            seen.add(id);
            return { id, digest: hash(canonical(record.data)) };
        }).sort((a, b) => a.id.localeCompare(b.id));
        collections[key] = {
            count: records.length,
            sha256: hash(canonical(records))
        };
    }
    return collections;
}

export function createBackupIntegrityManifest(snapshot) {
    const collections = collect(snapshot);
    return {
        version: VERSION,
        algorithm: 'sha256',
        collections,
        rootSha256: hash(canonical({ version: VERSION, collections }))
    };
}

export function verifyBackupIntegrity(snapshot, expectedManifest) {
    const current = createBackupIntegrityManifest(snapshot);
    if (!expectedManifest || expectedManifest.version !== VERSION ||
        expectedManifest.algorithm !== 'sha256' ||
        typeof expectedManifest.rootSha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(expectedManifest.rootSha256)) {
        return { status: 'invalid_manifest', matched: false };
    }
    const expected = Buffer.from(expectedManifest.rootSha256, 'hex');
    const actual = Buffer.from(current.rootSha256, 'hex');
    const rootMatches = timingSafeEqual(expected, actual);
    const structureMatches = canonical(expectedManifest.collections) === canonical(current.collections);
    return {
        status: rootMatches && structureMatches ? 'verified' : 'mismatch',
        matched: rootMatches && structureMatches,
        checkedCollections: Object.keys(current.collections).length
    };
}
