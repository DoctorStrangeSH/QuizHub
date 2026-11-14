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
        },
        {
            "questionRU": "На каком материке находится пустыня Сахара?",
            "questionEN": "On which continent is the Sahara Desert located?",
            "optionsRU": [
                "Азия",
                "Африка",
                "Австралия",
                "Южная Америка"
            ],
            "optionsEN": [
                "Asia",
                "Africa",
                "Australia",
                "South America"
            ],
            "correctIndex": 1,
            "explanationRU": "Сахара занимает большую часть Северной Африки.",
            "explanationEN": "The Sahara covers much of North Africa.",
            "points": 10
        },
        {
            "questionRU": "Какой океан омывает восточное побережье США?",
            "questionEN": "Which ocean borders the east coast of the United States?",
            "optionsRU": [
                "Тихий",
                "Индийский",
                "Атлантический",
                "Северный Ледовитый"
            ],
            "optionsEN": [
                "Pacific",
                "Indian",
                "Atlantic",
                "Arctic"
            ],
            "correctIndex": 2,
            "explanationRU": "Восточное побережье США выходит к Атлантическому океану.",
            "explanationEN": "The eastern coast of the US faces the Atlantic Ocean.",
            "points": 10
        },
        {
            "questionRU": "В какой стране находится город Киото?",
            "questionEN": "Which country is home to Kyoto?",
            "optionsRU": [
                "Китай",
                "Япония",
                "Южная Корея",
                "Таиланд"
            ],
            "optionsEN": [
                "China",
                "Japan",
                "South Korea",
                "Thailand"
            ],
            "correctIndex": 1,
            "explanationRU": "Киото был столицей Японии более тысячи лет.",
            "explanationEN": "Kyoto served as Japan's capital for over a thousand years.",
            "points": 10
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
        },
        {
            "questionRU": "Какая столица расположена на реке Дунай?",
            "questionEN": "Which capital city lies on the Danube River?",
            "optionsRU": [
                "Мадрид",
                "Вена",
                "Лиссабон",
                "Осло"
            ],
            "optionsEN": [
                "Madrid",
                "Vienna",
                "Lisbon",
                "Oslo"
            ],
            "correctIndex": 1,
            "explanationRU": "Дунай протекает через Вену и несколько других европейских столиц.",
            "explanationEN": "The Danube runs through Vienna and several other European capitals.",
            "points": 20
        },
        {
            "questionRU": "Какой пролив разделяет Европу и Африку?",
            "questionEN": "Which strait separates Europe and Africa?",
            "optionsRU": [
                "Берингов",
                "Гибралтарский",
                "Малаккский",
                "Магелланов"
            ],
            "optionsEN": [
                "Bering",
                "Gibraltar",
                "Malacca",
                "Magellan"
            ],
            "correctIndex": 1,
            "explanationRU": "Гибралтарский пролив соединяет Атлантический океан со Средиземным морем.",
            "explanationEN": "The Strait of Gibraltar connects the Atlantic Ocean and the Mediterranean Sea.",
            "points": 20
        },
        {
            "questionRU": "В каком полушарии находится большая часть Австралии относительно экватора?",
            "questionEN": "In which hemisphere is Australia located relative to the equator?",
            "optionsRU": [
                "Северном",
                "Южном",
                "В обоих поровну",
                "На экваторе"
            ],
            "optionsEN": [
                "Northern",
                "Southern",
                "Equally in both",
                "On the equator"
            ],
            "correctIndex": 1,
            "explanationRU": "Весь материк Австралия расположен южнее экватора.",
            "explanationEN": "The continent of Australia lies entirely south of the equator.",
            "points": 20
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
        },
        {
            "questionRU": "Какая из этих стран не имеет выхода к морю?",
            "questionEN": "Which of these countries is landlocked?",
            "optionsRU": [
                "Португалия",
                "Непал",
                "Норвегия",
                "Вьетнам"
            ],
            "optionsEN": [
                "Portugal",
                "Nepal",
                "Norway",
                "Vietnam"
            ],
            "correctIndex": 1,
            "explanationRU": "Непал расположен между Индией и Китаем и не имеет морского побережья.",
            "explanationEN": "Nepal lies between India and China and has no coastline.",
            "points": 30
        },
        {
            "questionRU": "Какое море известно высокой солёностью и расположено между Иорданией и Израилем?",
            "questionEN": "Which highly saline lake lies between Jordan and Israel?",
            "optionsRU": [
                "Каспийское",
                "Мёртвое",
                "Красное",
                "Аральское"
            ],
            "optionsEN": [
                "Caspian Sea",
                "Dead Sea",
                "Red Sea",
                "Aral Sea"
            ],
            "correctIndex": 1,
            "explanationRU": "Мёртвое море — солёное бессточное озеро, несмотря на слово «море» в названии.",
            "explanationEN": "The Dead Sea is actually a salt lake with no outlet.",
            "points": 30
        },
        {
            "questionRU": "К какому океану относится Бенгальский залив?",
            "questionEN": "Which ocean contains the Bay of Bengal?",
            "optionsRU": [
                "Тихому",
                "Атлантическому",
                "Индийскому",
                "Северному Ледовитому"
            ],
            "optionsEN": [
                "Pacific",
                "Atlantic",
                "Indian",
                "Arctic"
            ],
            "correctIndex": 2,
            "explanationRU": "Бенгальский залив находится в северо-восточной части Индийского океана.",
            "explanationEN": "The Bay of Bengal is in the northeastern Indian Ocean.",
            "points": 30
        }
    ]
};

export default geographyQuestions;