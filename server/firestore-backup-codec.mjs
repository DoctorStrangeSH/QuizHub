// Lossless tagged JSON representation of values accepted by Firebase Admin
// Firestore. Pure conversion: does not read/write a database or open a network.
const TAG = '__quizhub_firestore_type_v1';
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function assertPath(path) {
    if (typeof path !== 'string' || path.split('/').length % 2 !== 0 ||
        path.split('/').some(part => !part || part === '.' || part === '..')) {
        throw new TypeError('INVALID_BACKUP_REFERENCE_PATH');
    }
    return path;
}

function safeBase64(base64) {
    if (typeof base64 !== 'string' || base64.length % 4 !== 0 ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)) {
        throw new TypeError('INVALID_BACKUP_BYTES');
    }
    return Buffer.from(base64, 'base64');
}

function walk(value, mode, options, seen) {
    const { Timestamp, GeoPoint, DocumentReference, db } = options;
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
        if (Number.isFinite(value) && !Object.is(value, -0)) return value;
        if (mode === 'decode') throw new TypeError('NON_JSON_BACKUP_NUMBER');
        const literal = Number.isNaN(value) ? 'NaN' :
            value === Infinity ? 'Infinity' : value === -Infinity ? '-Infinity' : '-0';
        return { [TAG]: 'number', value: literal };
    }
    if (!value || typeof value !== 'object' || seen.has(value)) throw new TypeError('UNSUPPORTED_BACKUP_VALUE');
    if (mode === 'encode') {
        if (Timestamp && value instanceof Timestamp) {
            return { [TAG]: 'timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds };
        }
        if (GeoPoint && value instanceof GeoPoint) {
            return { [TAG]: 'geopoint', latitude: value.latitude, longitude: value.longitude };
        }
        if (DocumentReference && value instanceof DocumentReference) {
            if (!db || value.firestore !== db) throw new TypeError('CROSS_DATABASE_BACKUP_REFERENCE');
            return { [TAG]: 'reference', path: assertPath(value.path) };
        }
        if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
            return { [TAG]: 'bytes', base64: Buffer.from(value).toString('base64') };
        }
        if (value instanceof Date) {
            if (!Number.isFinite(value.getTime())) throw new TypeError('INVALID_BACKUP_DATE');
            return { [TAG]: 'date', iso: value.toISOString() };
        }
    }
    if (Array.isArray(value)) {
        if (Object.keys(value).length !== value.length) throw new TypeError('SPARSE_BACKUP_ARRAY');
        seen.add(value);
        try { return value.map(item => walk(item, mode, options, seen)); }
        finally { seen.delete(value); }
    }
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
        throw new TypeError('NON_JSON_BACKUP_VALUE');
    }
    if (hasOwn(value, TAG)) {
        if (mode === 'encode') throw new TypeError('RESERVED_BACKUP_TAG_COLLISION');
        const { [TAG]: type, ...fields } = value;
        const exact = keys => Object.keys(fields).sort().join('|') === keys.sort().join('|');
        switch (type) {
        case 'timestamp':
            if (!exact(['seconds', 'nanoseconds']) || !Timestamp ||
                !Number.isSafeInteger(fields.seconds) || !Number.isInteger(fields.nanoseconds) ||
                fields.nanoseconds < 0 || fields.nanoseconds > 999999999) break;
            return new Timestamp(fields.seconds, fields.nanoseconds);
        case 'geopoint':
            if (!exact(['latitude', 'longitude']) || !GeoPoint ||
                !Number.isFinite(fields.latitude) || !Number.isFinite(fields.longitude)) break;
            return new GeoPoint(fields.latitude, fields.longitude);
        case 'reference':
            if (!exact(['path']) || !db) break;
            return db.doc(assertPath(fields.path));
        case 'bytes':
            if (!exact(['base64'])) break;
            return safeBase64(fields.base64);
        case 'date':
            if (!exact(['iso']) || typeof fields.iso !== 'string') break;
            {
                const date = new Date(fields.iso);
                if (!Number.isFinite(date.getTime()) || date.toISOString() !== fields.iso) break;
                return date;
            }
        case 'number':
            if (!exact(['value'])) break;
            if (fields.value === 'NaN') return NaN;
            if (fields.value === 'Infinity') return Infinity;
            if (fields.value === '-Infinity') return -Infinity;
            if (fields.value === '-0') return -0;
            break;
        }
        throw new TypeError('INVALID_BACKUP_TYPE_TAG');
    }
    seen.add(value);
    try {
        const result = {};
        for (const [key, item] of Object.entries(value)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                throw new TypeError('UNSAFE_BACKUP_KEY');
            }
            Object.defineProperty(result, key, {
                value: walk(item, mode, options, seen),
                enumerable: true, writable: true, configurable: true
            });
        }
        return result;
    } finally { seen.delete(value); }
}

// Pass constructors from firebase-admin/firestore and the same Admin db that
// supplied the document refs. Codec never automatically initializes Admin.
export function encodeFirestoreBackupData(data, options = {}) {
    return walk(data, 'encode', options, new Set());
}

export function decodeFirestoreBackupData(data, options = {}) {
    return walk(data, 'decode', options, new Set());
}
