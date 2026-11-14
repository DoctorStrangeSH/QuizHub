/**
 * Pure reward calculation shared by gameplay and persistence.
 * The caller remains responsible for authenticating and validating rewards
 * on a trusted backend before crediting a real account.
 */
export function calculateQuizRewards(score, multipliers = {}) {
    const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
    const safeMultiplier = value =>
        Number.isFinite(value) && value > 0 ? value : 1;

    const xpMultiplier = safeMultiplier(multipliers.xpMultiplier);
    const coinMultiplier = safeMultiplier(multipliers.coinMultiplier);

    return {
        xp: Math.floor(safeScore * xpMultiplier),
        coins: Math.floor((safeScore / 2) * coinMultiplier)
    };
}
