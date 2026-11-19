// Read-only Firestore inventory collector.
// It records collection paths, document counts, orphan parent references and
// field names/types only. It never returns document IDs or field values.
function normalizeCollectionPath(path) {
    return String(path).split('/').map((part, index) =>
        index % 2 === 1 ? '{docId}' : part
    ).join('/');
}

function firestoreType(value) {
    if (value === null) return 'null';
    if (value instanceof Date || value?.constructor?.name === 'Timestamp' ||
        (value && typeof value.toDate === 'function' && typeof value.toMillis === 'function')) return 'timestamp';
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return 'bytes';
    if (value instanceof Uint8Array) return 'bytes';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
    if (value && typeof value === 'object' &&
        typeof value.latitude === 'number' && typeof value.longitude === 'number') return 'geoPoint';
    if (value && typeof value === 'object' &&
        typeof value.path === 'string' && value.parent) return 'reference';
    if (value && typeof value === 'object') return 'map';
    return typeof value;
}

function collectFieldTypes(value, prefix, fields) {
    if (!value || typeof value !== 'object' || value instanceof Date ||
        value?.constructor?.name === 'Timestamp' || value instanceof Uint8Array ||
        (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) ||
        (typeof value.toDate === 'function' && typeof value.toMillis === 'function')) return;

    if (Array.isArray(value)) return;

    for (const [key, child] of Object.entries(value)) {
        const path = prefix ? prefix + '.' + key : key;
        const type = firestoreType(child);
        let entry = fields.get(path);
        if (!entry) {
            entry = new Map();
            fields.set(path, entry);
        }
        entry.set(type, (entry.get(type) ?? 0) + 1);
        if (type === 'map') collectFieldTypes(child, path, fields);
    }
}

function validateLimits({ maxDocuments, maxDepth }) {
    if (!Number.isSafeInteger(maxDocuments) || maxDocuments < 1 || maxDocuments > 20000) {
        throw new TypeError('INVALID_INVENTORY_DOCUMENT_LIMIT');
    }
    if (!Number.isSafeInteger(maxDepth) || maxDepth < 0 || maxDepth > 8) {
        throw new TypeError('INVALID_INVENTORY_DEPTH_LIMIT');
    }
}

export async function collectFirestoreInventory(db, {
    maxDocuments = 5000,
    maxDepth = 8
} = {}) {
    validateLimits({ maxDocuments, maxDepth });
    if (!db || typeof db.listCollections !== 'function') {
        throw new TypeError('FIRESTORE_DATABASE_REQUIRED');
    }

    const stats = new Map();
    let totalDocumentReferences = 0;
    let existingDocuments = 0;
    let missingParentDocuments = 0;

    async function visitCollection(collectionRef, depth) {
        if (depth > maxDepth) throw new Error('INVENTORY_MAX_DEPTH_EXCEEDED');
        const path = normalizeCollectionPath(collectionRef.path);
        let stat = stats.get(path);
        if (!stat) {
            stat = {
                path,
                collectionInstances: 0,
                documentReferences: 0,
                existingDocuments: 0,
                missingParentDocuments: 0,
                fields: new Map()
            };
            stats.set(path, stat);
        }
        stat.collectionInstances++;

        const documentRefs = await collectionRef.listDocuments();
        for (const documentRef of documentRefs) {
            totalDocumentReferences++;
            stat.documentReferences++;
            if (totalDocumentReferences > maxDocuments) {
                throw new Error('INVENTORY_MAX_DOCUMENTS_EXCEEDED');
            }

            const snapshot = await documentRef.get();
            if (snapshot.exists) {
                existingDocuments++;
                stat.existingDocuments++;
                collectFieldTypes(snapshot.data() ?? {}, '', stat.fields);
            } else {
                missingParentDocuments++;
                stat.missingParentDocuments++;
            }

            // listCollections also discovers subcollections below a missing
            // parent document, which ordinary collection queries can miss.
            const subcollections = await documentRef.listCollections();
            for (const subcollection of subcollections) {
                await visitCollection(subcollection, depth + 1);
            }
        }
    }

    const rootCollections = await db.listCollections();
    for (const collectionRef of rootCollections) {
        await visitCollection(collectionRef, 0);
    }

    const collections = [...stats.values()]
        .sort((a, b) => a.path.localeCompare(b.path))
        .map(stat => ({
            path: stat.path,
            collectionInstances: stat.collectionInstances,
            documentReferences: stat.documentReferences,
            existingDocuments: stat.existingDocuments,
            missingParentDocuments: stat.missingParentDocuments,
            fields: [...stat.fields.entries()]
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([field, types]) => ({
                    field,
                    types: Object.fromEntries([...types.entries()].sort(([a], [b]) => a.localeCompare(b)))
                }))
        }));

    return {
        format: 'quizhub-firestore-inventory-v1',
        complete: true,
        dataValuesIncluded: false,
        documentIdsIncluded: false,
        totalDocumentReferences,
        existingDocuments,
        missingParentDocuments,
        collectionPatternCount: collections.length,
        collections
    };
}
