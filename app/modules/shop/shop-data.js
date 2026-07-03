export const SHOP_ITEMS = {
    themes: [
        {
            id: 'theme_default',
            nameRU: 'Стандартная',
            nameEN: 'Default',
            descRU: 'Классическая тёмная тема',
            descEN: 'Classic dark theme',
            icon: '🌙',
            price: 0,
            type: 'theme',
            owned: true
        },
        {
            id: 'theme_light',
            nameRU: 'Светлая',
            nameEN: 'Light',
            descRU: 'Чистая светлая тема',
            descEN: 'Clean light theme',
            icon: '☀️',
            price: 0,
            type: 'theme',
            owned: true
        },
        {
            id: 'theme_neon',
            nameRU: 'Неоновая',
            nameEN: 'Neon',
            descRU: 'Яркая неоновая тема',
            descEN: 'Bright neon theme',
            icon: '💜',
            price: 500,
            type: 'theme',
            owned: false
        },
        {
            id: 'theme_ocean',
            nameRU: 'Морская',
            nameEN: 'Ocean',
            descRU: 'Спокойная морская тема',
            descEN: 'Calm ocean theme',
            icon: '🌊',
            price: 500,
            type: 'theme',
            owned: false
        },
        {
            id: 'theme_sunset',
            nameRU: 'Закат',
            nameEN: 'Sunset',
            descRU: 'Тёплая тема заката',
            descEN: 'Warm sunset theme',
            icon: '🌅',
            price: 750,
            type: 'theme',
            owned: false
        },
        {
            id: 'theme_forest',
            nameRU: 'Лесная',
            nameEN: 'Forest',
            descRU: 'Природная зелёная тема',
            descEN: 'Natural green theme',
            icon: '🌲',
            price: 750,
            type: 'theme',
            owned: false
        }
    ],

    frames: [
        {
            id: 'frame_default',
            nameRU: 'Стандартная',
            nameEN: 'Default',
            descRU: 'Обычная рамка',
            descEN: 'Regular frame',
            icon: '⬜',
            price: 0,
            type: 'frame',
            owned: true
        },
        {
            id: 'frame_gold',
            nameRU: 'Золотая',
            nameEN: 'Gold',
            descRU: 'Премиум золотая рамка',
            descEN: 'Premium gold frame',
            icon: '🟨',
            price: 300,
            type: 'frame',
            owned: false
        },
        {
            id: 'frame_diamond',
            nameRU: 'Бриллиантовая',
            nameEN: 'Diamond',
            descRU: 'Сверкающая бриллиантовая рамка',
            descEN: 'Sparkling diamond frame',
            icon: '💎',
            price: 800,
            type: 'frame',
            owned: false
        },
        {
            id: 'frame_fire',
            nameRU: 'Огненная',
            nameEN: 'Fire',
            descRU: 'Пылающая огненная рамка',
            descEN: 'Burning fire frame',
            icon: '🔥',
            price: 600,
            type: 'frame',
            owned: false
        },
        {
            id: 'frame_galaxy',
            nameRU: 'Галактическая',
            nameEN: 'Galaxy',
            descRU: 'Космическая галактическая рамка',
            descEN: 'Space galaxy frame',
            icon: '🌌',
            price: 1000,
            type: 'frame',
            owned: false
        }
    ],

    particles: [
        {
            id: 'particles_default',
            nameRU: 'Стандартные',
            nameEN: 'Default',
            descRU: 'Обычные фиолетовые частицы',
            descEN: 'Regular purple particles',
            icon: '✨',
            price: 0,
            type: 'particles',
            owned: true
        },
        {
            id: 'particles_gold',
            nameRU: 'Золотые',
            nameEN: 'Gold',
            descRU: 'Золотые сверкающие частицы',
            descEN: 'Golden sparkling particles',
            icon: '🌟',
            price: 400,
            type: 'particles',
            owned: false
        },
        {
            id: 'particles_snow',
            nameRU: 'Снежные',
            nameEN: 'Snow',
            descRU: 'Падающие снежинки',
            descEN: 'Falling snowflakes',
            icon: '❄️',
            price: 350,
            type: 'particles',
            owned: false
        },
        {
            id: 'particles_hearts',
            nameRU: 'Сердечки',
            nameEN: 'Hearts',
            descRU: 'Летающие сердечки',
            descEN: 'Floating hearts',
            icon: '💕',
            price: 450,
            type: 'particles',
            owned: false
        },
        {
            id: 'particles_stars',
            nameRU: 'Звёздные',
            nameEN: 'Stars',
            descRU: 'Мерцающие звёзды',
            descEN: 'Twinkling stars',
            icon: '⭐',
            price: 500,
            type: 'particles',
            owned: false
        }
    ],

    bonuses: [
        {
            id: 'bonus_xp_boost',
            nameRU: 'Бустер XP',
            nameEN: 'XP Booster',
            descRU: 'Удвоение опыта на 1 час',
            descEN: 'Double XP for 1 hour',
            icon: '⚡',
            price: 200,
            type: 'bonus',
            effect: 'xp_boost',
            duration: 3600
        },
        {
            id: 'bonus_coin_boost',
            nameRU: 'Бустер монет',
            nameEN: 'Coin Booster',
            descRU: 'Удвоение монет на 1 час',
            descEN: 'Double coins for 1 hour',
            icon: '🪙',
            price: 250,
            type: 'bonus',
            effect: 'coin_boost',
            duration: 3600
        },
        {
            id: 'bonus_skip',
            nameRU: 'Пропуск вопроса',
            nameEN: 'Skip Question',
            descRU: 'Пропустить вопрос без штрафа',
            descEN: 'Skip a question without penalty',
            icon: '⏭️',
            price: 100,
            type: 'bonus',
            effect: 'skip',
            duration: 0
        },
        {
            id: 'bonus_fifty',
            nameRU: '50/50',
            nameEN: '50/50',
            descRU: 'Убрать 2 неверных ответа',
            descEN: 'Remove 2 wrong answers',
            icon: '🎯',
            price: 150,
            type: 'bonus',
            effect: 'fifty',
            duration: 0
        }
    ]
};

export function getAllItems() {
    return [
        ...SHOP_ITEMS.themes,
        ...SHOP_ITEMS.frames,
        ...SHOP_ITEMS.particles,
        ...SHOP_ITEMS.bonuses
    ];
}