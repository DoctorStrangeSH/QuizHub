// A presentation-only summary. It must never be used for competitive rewards.
export function getDailyResultSummary(correct, total, language = 'ru') {
    const count = Number.isFinite(correct) ? Math.max(0, Math.trunc(correct)) : 0;
    const max = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;
    const safeCorrect = Math.min(count, max);
    const percent = max ? Math.round((safeCorrect / max) * 100) : 0;
    const isEN = language === 'en';
    let tier = 'learning';
    if (max > 0 && percent >= 80) tier = 'excellent';
    else if (max > 0 && percent >= 50) tier = 'steady';

    const copy = {
        excellent: isEN
            ? { icon: '🏆', title: 'Brilliant run!', detail: 'You mastered most of today’s questions.' }
            : { icon: '🏆', title: 'Блестяще!', detail: 'Ты справился с большинством сегодняшних вопросов.' },
        steady: isEN
            ? { icon: '✨', title: 'Nice progress!', detail: 'A little more practice and you will be unstoppable.' }
            : { icon: '✨', title: 'Хороший результат!', detail: 'Ещё немного практики — и будет идеально.' },
        learning: isEN
            ? { icon: '🌱', title: 'Keep exploring!', detail: 'Every question helps you learn something new.' }
            : { icon: '🌱', title: 'Продолжай исследовать!', detail: 'Каждый вопрос помогает узнать что-то новое.' }
    };
    return { correct: safeCorrect, total: max, percent, tier, ...copy[tier] };
}
