import scienceQuestions from './science.js';
import historyQuestions from './history.js';
import sportsQuestions from './sports.js';
import moviesQuestions from './movies.js';
import gamingQuestions from './gaming.js';
import geographyQuestions from './geography.js';
import technologyQuestions from './technology.js';
import artQuestions from './art.js';
import musicQuestions from './music.js';
import itQuestions from './it.js';
import literatureQuestions from './literature.js';
import foodQuestions from './food.js';
import animalsQuestions from './animals.js';
import spaceQuestions from './space.js';

/**
 * ВСЕ ВОПРОСЫ ИГРЫ
 * 
 * Чтобы добавить новую категорию:
 * 1. Создай файл в этой папке (например, music.js)
 * 2. Экспортируй объект с ключами easy, medium, hard
 * 3. Добавь импорт и категорию в этот файл
 * 
 * Структура вопроса:
 * {
 *   questionRU: 'Вопрос на русском',
 *   questionEN: 'Question in English',
 *   optionsRU: ['Ответ 1', 'Ответ 2', 'Ответ 3', 'Ответ 4'],
 *   optionsEN: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'],
 *   correctIndex: 0,  // Индекс правильного ответа (0-3)
 *   points: 10        // Очки за правильный ответ
 * }
 */
const allQuestions = {
    science: {
        nameRU: 'Наука',
        nameEN: 'Science',
        icon: '🔬',
        ...scienceQuestions
    },
    history: {
        nameRU: 'История',
        nameEN: 'History',
        icon: '📜',
        ...historyQuestions
    },
    sports: {
        nameRU: 'Спорт',
        nameEN: 'Sports',
        icon: '⚽',
        ...sportsQuestions
    },
    movies: {
        nameRU: 'Кино',
        nameEN: 'Movies',
        icon: '🎬',
        ...moviesQuestions
    },
    geography: {
        nameRU: 'География',
        nameEN: 'Geography',
        icon: '🌍',
        ...geographyQuestions
    },
    technology: {
        nameRU: 'Технологии',
        nameEN: 'Technology',
        icon: '💻',
        ...technologyQuestions
    },
    art: {
        nameRU: 'Искусство',
        nameEN: 'Art',
        icon: '🎨',
        ...artQuestions
    },
    music: {
        nameRU: 'Музыка',
        nameEN: 'Music',
        icon: '🎵',
        ...musicQuestions
    },
    it: {
        nameRU: 'IT',
        nameEN: 'IT',
        icon: '🖥️',
        ...itQuestions
    },
    literature: {
        nameRU: 'Литература',
        nameEN: 'Literature',
        icon: '📖',
        ...literatureQuestions
    },
    food: {
        nameRU: 'Еда',
        nameEN: 'Food',
        icon: '🍕',
        ...foodQuestions
    },
    animals: {
        nameRU: 'Животные',
        nameEN: 'Animals',
        icon: '🦁',
        ...animalsQuestions
    },
    space: {
        nameRU: 'Космос',
        nameEN: 'Space',
        icon: '🚀',
        ...spaceQuestions
    }
};

/**
 * Получить вопросы по категории и сложности
 */
export function getQuestions(category, difficulty) {
    if (category === 'all') {
        // Собираем вопросы со всех категорий
        let allQ = [];
        for (const cat in allQuestions) {
            const catData = allQuestions[cat];
            if (catData[difficulty]) {
                const questionsWithCategory = catData[difficulty].map(q => ({
                    ...q,
                    category: cat
                }));
                allQ = allQ.concat(questionsWithCategory);
            }
        }
        return allQ;
    }
    
    if (allQuestions[category] && allQuestions[category][difficulty]) {
        return allQuestions[category][difficulty].map(q => ({
            ...q,
            category: category
        }));
    }
    
    return [];
}

/**
 * Получить список всех категорий
 */
export function getCategoriesList(lang = 'ru') {
    return Object.entries(allQuestions).map(([key, value]) => ({
        id: key,
        name: lang === 'ru' ? value.nameRU : value.nameEN,
        icon: value.icon
    }));
}

export default allQuestions;