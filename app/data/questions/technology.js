const technologyQuestions = {
    easy: [
        {
            questionRU: 'Как называется операционная система от Apple для компьютеров?',
            questionEN: 'What is Apple\'s operating system for computers called?',
            optionsRU: ['Windows', 'macOS', 'Linux', 'Android'],
            optionsEN: ['Windows', 'macOS', 'Linux', 'Android'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Что означает аббревиатура "URL"?',
            questionEN: 'What does "URL" stand for?',
            optionsRU: ['Universal Resource Locator', 'United Road Link', 'User Request Line', 'Unique Reading List'],
            optionsEN: ['Universal Resource Locator', 'United Road Link', 'User Request Line', 'Unique Reading List'],
            correctIndex: 0,
            points: 10
        }
    ],
    medium: [
        {
            questionRU: 'В каком году был основан Google?',
            questionEN: 'What year was Google founded?',
            optionsRU: ['1996', '1998', '2000', '2002'],
            optionsEN: ['1996', '1998', '2000', '2002'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Что такое "облачные вычисления"?',
            questionEN: 'What is "cloud computing"?',
            optionsRU: ['Работа на метеостанции', 'Хранение и обработка данных через интернет', 'Создание искусственного интеллекта', 'Разработка игр'],
            optionsEN: ['Working at a weather station', 'Storing and processing data via the internet', 'Creating artificial intelligence', 'Game development'],
            correctIndex: 1,
            points: 20
        }
    ],
    hard: [
        {
            questionRU: 'Какой язык программирования является самым старым из ныне используемых?',
            questionEN: 'Which programming language is the oldest still in use?',
            optionsRU: ['C', 'Fortran', 'COBOL', 'Lisp'],
            optionsEN: ['C', 'Fortran', 'COBOL', 'Lisp'],
            correctIndex: 1,
            points: 30
        }
    ]
};

export default technologyQuestions;