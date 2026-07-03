const geographyQuestions = {
    easy: [
        {
            questionRU: 'Какая страна самая большая по площади?',
            questionEN: 'Which country is the largest by area?',
            optionsRU: ['Канада', 'Россия', 'Китай', 'США'],
            optionsEN: ['Canada', 'Russia', 'China', 'USA'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Какой океан самый большой?',
            questionEN: 'Which ocean is the largest?',
            optionsRU: ['Атлантический', 'Индийский', 'Тихий', 'Северный Ледовитый'],
            optionsEN: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
            correctIndex: 2,
            points: 10
        },
        {
            questionRU: 'Столица Франции?',
            questionEN: 'Capital of France?',
            optionsRU: ['Лондон', 'Берлин', 'Париж', 'Мадрид'],
            optionsEN: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctIndex: 2,
            points: 10
        }
    ],
    medium: [
        {
            questionRU: 'Какая гора самая высокая в мире?',
            questionEN: 'What is the tallest mountain in the world?',
            optionsRU: ['К2', 'Эверест', 'Канченджанга', 'Лхоцзе'],
            optionsEN: ['K2', 'Everest', 'Kangchenjunga', 'Lhotse'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Сколько штатов в США?',
            questionEN: 'How many states are in the USA?',
            optionsRU: ['48', '49', '50', '51'],
            optionsEN: ['48', '49', '50', '51'],
            correctIndex: 2,
            points: 20
        }
    ],
    hard: [
        {
            questionRU: 'Какая река самая длинная в мире?',
            questionEN: 'Which river is the longest in the world?',
            optionsRU: ['Амазонка', 'Нил', 'Янцзы', 'Миссисипи'],
            optionsEN: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
            correctIndex: 1,
            points: 30
        },
        {
            questionRU: 'Какая страна имеет больше всего островов?',
            questionEN: 'Which country has the most islands?',
            optionsRU: ['Индонезия', 'Швеция', 'Филиппины', 'Канада'],
            optionsEN: ['Indonesia', 'Sweden', 'Philippines', 'Canada'],
            correctIndex: 1,
            points: 30
        }
    ]
};

export default geographyQuestions;