import { ACHIEVEMENT_CATALOG } from './achievement-catalog.mjs';

const ID = /^[a-z0-9_]{1,64}$/;
const FACTS = new Set(['totalGames', 'experience', 'level']);

export function createAchievementUnlockService({ store, catalog = ACHIEVEMENT_CATALOG }) {
    if (!store || typeof store.runTransaction !== 'function') throw new Error('INVALID_ACHIEVEMENT_STORE');
    if (!Array.isArray(catalog) || catalog.some(item =>
        !item || typeof item.id !== 'string' || !ID.test(item.id) ||
        !FACTS.has(item.fact) || !Number.isSafeInteger(item.threshold) || item.threshold < 1
    ) || new Set(catalog.map(item => item.id)).size !== catalog.length) {
        throw new Error('INVALID_ACHIEVEMENT_CATALOG');
    }

    return {
        async evaluate({ uid }) {
            if (typeof uid !== 'string' || !uid.trim() || uid.includes('/')) throw new Error('AUTH_REQUIRED');
            return store.runTransaction(async tx => {
                const [facts, user] = await Promise.all([
                    tx.getAchievementFacts(uid),
                    tx.getUser(uid)
                ]);
                if (!user) throw new Error('USER_NOT_FOUND');
                const unlocked = Array.isArray(user.achievements) ? user.achievements : [];
                if (unlocked.some(id => typeof id !== 'string')) throw new Error('INVALID_ACHIEVEMENT_STATE');
                const newlyUnlocked = catalog.filter(item =>
                    !unlocked.includes(item.id) &&
                    Number.isSafeInteger(facts?.[item.fact]) &&
                    facts[item.fact] >= item.threshold
                ).map(item => item.id);
                if (newlyUnlocked.length) {
                    await tx.setUserPatch(uid, { achievements: [...new Set([...unlocked, ...newlyUnlocked])] });
                    await tx.createUnlockReceipts(uid, newlyUnlocked);
                }
                return { unlocked: [...unlocked], newlyUnlocked, alreadyUnlocked: newlyUnlocked.length === 0 };
            });
        }
    };
}
