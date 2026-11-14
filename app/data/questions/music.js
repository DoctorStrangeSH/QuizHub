const musicQuestions = {
    easy: [
        {
            questionRU: 'Сколько струн у стандартной гитары?',
            questionEN: 'How many strings does a standard guitar have?',
            optionsRU: ['4', '5', '6', '7'],
            optionsEN: ['4', '5', '6', '7'],
            correctIndex: 2,
            points: 10
        },
        {
            questionRU: 'Какой инструмент является королём оркестра?',
            questionEN: 'Which instrument is the king of the orchestra?',
            optionsRU: ['Скрипка', 'Фортепиано', 'Орган', 'Труба'],
            optionsEN: ['Violin', 'Piano', 'Organ', 'Trumpet'],
            correctIndex: 2,
            points: 10
        },
        {
            questionRU: 'Кто является "Королём поп-музыки"?',
            questionEN: 'Who is the "King of Pop"?',
            optionsRU: ['Элвис Пресли', 'Майкл Джексон', 'Принс', 'Фредди Меркьюри'],
            optionsEN: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Freddie Mercury'],
            correctIndex: 1,
            points: 10
        },
        {
            "questionRU": "С помощью чего пианист нажимает ноты на фортепиано?",
            "questionEN": "What does a pianist press to play notes?",
            "optionsRU": [
                "Струны",
                "Клавиши",
                "Клапаны трубы",
                "Лады"
            ],
            "optionsEN": [
                "Strings",
                "Keys",
                "Trumpet valves",
                "Frets"
            ],
            "correctIndex": 1,
            "explanationRU": "При нажатии клавиш механика фортепиано приводит в движение молоточки.",
            "explanationEN": "Piano keys operate a mechanism that moves hammers.",
            "points": 10
        },
        {
            "questionRU": "Как называют человека, который руководит оркестром?",
            "questionEN": "What do you call the person who leads an orchestra?",
            "optionsRU": [
                "Композитор",
                "Дирижёр",
                "Настройщик",
                "Солист"
            ],
            "optionsEN": [
                "Composer",
                "Conductor",
                "Tuner",
                "Soloist"
            ],
            "correctIndex": 1,
            "explanationRU": "Дирижёр координирует темп, вступления и выразительность исполнения.",
            "explanationEN": "A conductor coordinates tempo, entrances, and musical expression.",
            "points": 10
        },
        {
            "questionRU": "На каком инструменте обычно играют смычком?",
            "questionEN": "Which instrument is typically played with a bow?",
            "optionsRU": [
                "Барабан",
                "Скрипка",
                "Труба",
                "Арфа"
            ],
            "optionsEN": [
                "Drum",
                "Violin",
                "Trumpet",
                "Harp"
            ],
            "correctIndex": 1,
            "explanationRU": "Смычок заставляет струны скрипки вибрировать, создавая звук.",
            "explanationEN": "The bow makes violin strings vibrate to produce sound.",
            "points": 10
        }
    ],
    medium: [
        {
            questionRU: 'Как называется самая известная группа из Ливерпуля?',
            questionEN: 'What is the most famous band from Liverpool called?',
            optionsRU: ['The Rolling Stones', 'The Beatles', 'Queen', 'Led Zeppelin'],
            optionsEN: ['The Rolling Stones', 'The Beatles', 'Queen', 'Led Zeppelin'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Какой музыкальный интервал составляет 8 нот?',
            questionEN: 'What musical interval is 8 notes?',
            optionsRU: ['Квинта', 'Октава', 'Терция', 'Кварта'],
            optionsEN: ['Fifth', 'Octave', 'Third', 'Fourth'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Как называется устройство для ритма в музыке?',
            questionEN: 'What is the rhythm device in music called?',
            optionsRU: ['Тюнер', 'Метроном', 'Камертон', 'Усилитель'],
            optionsEN: ['Tuner', 'Metronome', 'Tuning fork', 'Amplifier'],
            correctIndex: 1,
            points: 20
        },
        {
            "questionRU": "Что означает музыкальный термин «форте»?",
            "questionEN": "What does the musical marking forte mean?",
            "optionsRU": [
                "Тихо",
                "Громко",
                "Медленно",
                "Быстро"
            ],
            "optionsEN": [
                "Softly",
                "Loudly",
                "Slowly",
                "Quickly"
            ],
            "correctIndex": 1,
            "explanationRU": "Обозначение f в нотной записи указывает на громкое исполнение.",
            "explanationEN": "The marking f in sheet music indicates loud playing.",
            "points": 20
        },
        {
            "questionRU": "Сколько полутонов в одной октаве равномерно темперированного строя?",
            "questionEN": "How many semitones are in an equal-tempered octave?",
            "optionsRU": [
                "8",
                "10",
                "12",
                "14"
            ],
            "optionsEN": [
                "8",
                "10",
                "12",
                "14"
            ],
            "correctIndex": 2,
            "explanationRU": "В современной западной музыке октаву обычно делят на 12 равных полутонов.",
            "explanationEN": "Modern Western equal temperament divides the octave into 12 equal semitones.",
            "points": 20
        },
        {
            "questionRU": "Как называется многоголосное музыкальное произведение, где темы имитационно повторяются в разных голосах?",
            "questionEN": "What is a contrapuntal composition built on imitative entries of a theme called?",
            "optionsRU": [
                "Фуга",
                "Вальс",
                "Ноктюрн",
                "Этюд"
            ],
            "optionsEN": [
                "Fugue",
                "Waltz",
                "Nocturne",
                "Étude"
            ],
            "correctIndex": 0,
            "explanationRU": "В фуге тема появляется последовательно в разных голосах.",
            "explanationEN": "In a fugue, a theme enters successively in different voices.",
            "points": 20
        }
    ],
    hard: [
        {
            questionRU: 'Кто написал "Лунную сонату"?',
            questionEN: 'Who composed the "Moonlight Sonata"?',
            optionsRU: ['Моцарт', 'Бетховен', 'Бах', 'Шопен'],
            optionsEN: ['Mozart', 'Beethoven', 'Bach', 'Chopin'],
            correctIndex: 1,
            points: 30
        },
        {
            questionRU: 'Какой стиль музыки зародился в Новом Орлеане?',
            questionEN: 'Which music style originated in New Orleans?',
            optionsRU: ['Блюз', 'Джаз', 'Рок-н-ролл', 'Кантри'],
            optionsEN: ['Blues', 'Jazz', 'Rock and Roll', 'Country'],
            correctIndex: 1,
            points: 30
        },
        {
            "questionRU": "Какой композитор написал цикл «Времена года» из четырёх скрипичных концертов?",
            "questionEN": "Which composer wrote The Four Seasons, a set of four violin concertos?",
            "optionsRU": [
                "Антонио Вивальди",
                "Иоганн Бах",
                "Георг Гендель",
                "Клаудио Монтеверди"
            ],
            "optionsEN": [
                "Antonio Vivaldi",
                "Johann Sebastian Bach",
                "George Frideric Handel",
                "Claudio Monteverdi"
            ],
            "correctIndex": 0,
            "explanationRU": "Вивальди включил четыре концерта «Времена года» в сборник «Спор гармонии с изобретением».",
            "explanationEN": "Vivaldi published The Four Seasons within Il cimento dell'armonia e dell'inventione.",
            "points": 30
        },
        {
            "questionRU": "Как называется постепенное ускорение темпа в музыкальном произведении?",
            "questionEN": "What term means gradually speeding up the tempo?",
            "optionsRU": [
                "Ритардандо",
                "Аччелерандо",
                "Диминуэндо",
                "Легато"
            ],
            "optionsEN": [
                "Ritardando",
                "Accelerando",
                "Diminuendo",
                "Legato"
            ],
            "correctIndex": 1,
            "explanationRU": "Accelerando обозначает постепенное увеличение скорости исполнения.",
            "explanationEN": "Accelerando instructs performers to increase the tempo gradually.",
            "points": 30
        },
        {
            "questionRU": "Как называется интервал между звуками до и соль?",
            "questionEN": "What is the interval from C up to G?",
            "optionsRU": [
                "Малая терция",
                "Чистая кварта",
                "Чистая квинта",
                "Большая секста"
            ],
            "optionsEN": [
                "Minor third",
                "Perfect fourth",
                "Perfect fifth",
                "Major sixth"
            ],
            "correctIndex": 2,
            "explanationRU": "Между до и соль пять ступеней звукоряда: это чистая квинта.",
            "explanationEN": "C to G spans five letter-note positions and forms a perfect fifth.",
            "points": 30
        }
    ]
};

export default musicQuestions;