import test from 'node:test';
import assert from 'node:assert/strict';
import { auditLegacyProgressionProfile } from '../server/legacy-progression-audit.mjs';

const cleanProfile = () => ({
    experience: 450,
    weeklyExperience: 120,
    coins: 80,
    quizzesCompleted: 12,
    wins: 8,
    level: 5,
    achievements: ['first_quiz', 'perfect_score', 'social'],
    stats: {
        totalGames: 12,
        totalWins: 8,
        totalQuestions: 120,
        correctAnswers: 94,
        bestStreak: 12
    }
});

test('returns a review-only snapshot and never proposes trusted facts from client-writable fields', () => {
    const report = auditLegacyProgressionProfile({ uid: 'player-1', profile: cleanProfile() });
    assert.equal(report.status, 'review_required');
    assert.equal(report.eligibleForAutomaticImport, false);
    assert.equal(report.observedCounters.experience, 450);
    assert.equal(report.observedCounters['stats.totalGames'], 12);
    assert.equal(report.existingAchievementFacts, null);
    assert.equal('proposedAchievementFacts' in report, false);
    assert.ok(report.blockers.includes('LEGACY_PROFILE_FIELDS_ARE_NOT_TRUSTED_PROVENANCE'));
});

test('preserves the legacy snapshot without mutating the caller profile', () => {
    const profile = cleanProfile();
    const before = structuredClone(profile);
    const report = auditLegacyProgressionProfile({ uid: 'player-1', profile });
    assert.deepEqual(profile, before);
    assert.deepEqual(report.legacySnapshot, before);
});

test('detects inconsistent game, win, answer and level counters', () => {
    const profile = cleanProfile();
    profile.quizzesCompleted = 11;
    profile.wins = 9;
    profile.stats.totalWins = 14;
    profile.stats.correctAnswers = 130;
    profile.level = 2;
    const report = auditLegacyProgressionProfile({ uid: 'player-1', profile });
    const codes = report.anomalies.map(item => item.code);
    assert.ok(codes.includes('QUIZ_COUNT_MISMATCH'));
    assert.ok(codes.includes('WIN_COUNT_MISMATCH'));
    assert.ok(codes.includes('WINS_EXCEED_GAMES'));
    assert.ok(codes.includes('CORRECT_ANSWERS_EXCEED_QUESTIONS'));
    assert.ok(codes.includes('LEVEL_EXPERIENCE_MISMATCH'));
});

test('rejects unsafe counters, malformed stats and malformed achievement IDs without coercion', () => {
    const profile = cleanProfile();
    profile.coins = Number.MAX_SAFE_INTEGER + 1;
    profile.stats = [];
    profile.achievements = ['valid_id', '../bad'];
    const report = auditLegacyProgressionProfile({ uid: 'player-1', profile });
    const codes = report.anomalies.map(item => item.code);
    assert.ok(codes.includes('INVALID_LEGACY_COUNTER'));
    assert.ok(codes.includes('INVALID_LEGACY_STATS_OBJECT'));
    assert.ok(codes.includes('INVALID_LEGACY_ACHIEVEMENTS'));
    assert.equal(report.observedCounters.coins, null);
    assert.deepEqual(report.legacyAchievementIds, []);
});

test('does not convert legacy best streak or perfect_score unlock into trusted perfectGames', () => {
    const report = auditLegacyProgressionProfile({ uid: 'player-1', profile: cleanProfile() });
    const codes = report.warnings.map(item => item.code);
    assert.ok(codes.includes('PERFECT_SCORE_SEMANTICS_CHANGED'));
    assert.ok(codes.includes('BEST_STREAK_NOT_EQUIVALENT_TO_PERFECT_GAMES'));
    assert.equal(report.existingAchievementFacts, null);
});

test('retains an existing server facts document separately and flags invalid trusted fields', () => {
    const facts = {
        totalGames: 3, experience: 250, totalWins: 2,
        perfectGames: 1, level: 3, unlockedIds: ['first_quiz']
    };
    const report = auditLegacyProgressionProfile({
        uid: 'player-1', profile: cleanProfile(), existingAchievementFacts: facts
    });
    assert.deepEqual(report.existingAchievementFacts, facts);
    assert.notEqual(report.existingAchievementFacts, facts);
    facts.experience = -1;
    const invalid = auditLegacyProgressionProfile({
        uid: 'player-1', profile: cleanProfile(), existingAchievementFacts: facts
    });
    assert.ok(invalid.anomalies.some(item => item.code === 'INVALID_EXISTING_ACHIEVEMENT_FACT'));
});

test('requires a valid UID and plain profile object', () => {
    assert.throws(() => auditLegacyProgressionProfile({ uid: '', profile: cleanProfile() }), /INVALID_AUDIT_UID/);
    assert.throws(() => auditLegacyProgressionProfile({ uid: 'player-1', profile: null }), /INVALID_LEGACY_PROFILE/);
    assert.throws(() => auditLegacyProgressionProfile({ uid: 'player-1', profile: [] }), /INVALID_LEGACY_PROFILE/);
});
