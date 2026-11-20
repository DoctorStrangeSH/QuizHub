// Conditions use only server-maintained facts. Never accept progress from callable input.
export const ACHIEVEMENT_CATALOG = Object.freeze([
    { id: 'first_quiz', fact: 'totalGames', threshold: 1 },
    { id: 'ten_quizzes', fact: 'totalGames', threshold: 10 },
    { id: 'fifty_quizzes', fact: 'totalGames', threshold: 50 },
    { id: 'hundred_quizzes', fact: 'totalGames', threshold: 100 },
    { id: 'fast_learner', fact: 'experience', threshold: 1000 },
    { id: 'first_win', fact: 'totalWins', threshold: 1 },
    { id: 'ten_wins', fact: 'totalWins', threshold: 10 },
    { id: 'perfect_score', fact: 'perfectGames', threshold: 1 },
    { id: 'level_five', fact: 'level', threshold: 5 },
    { id: 'level_ten', fact: 'level', threshold: 10 }
]);

export const DEFERRED_ACHIEVEMENT_IDS = Object.freeze([
    'social', 'collector'
]);
