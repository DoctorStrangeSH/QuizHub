const itQuestions = {
    easy: [
        {
            questionRU: 'Что такое HTML?',
            questionEN: 'What is HTML?',
            optionsRU: ['Язык программирования', 'Язык разметки', 'База данных', 'Операционная система'],
            optionsEN: ['Programming language', 'Markup language', 'Database', 'Operating system'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Сколько бит в одном байте?',
            questionEN: 'How many bits are in one byte?',
            optionsRU: ['4', '8', '16', '32'],
            optionsEN: ['4', '8', '16', '32'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Что такое "баг" в программировании?',
            questionEN: 'What is a "bug" in programming?',
            optionsRU: ['Функция', 'Ошибка', 'Вирус', 'Обновление'],
            optionsEN: ['Function', 'Error', 'Virus', 'Update'],
            correctIndex: 1,
            points: 10
        }
    ],
    medium: [
        {
            questionRU: 'Какой протокол используется для передачи веб-страниц?',
            questionEN: 'Which protocol is used to transfer web pages?',
            optionsRU: ['FTP', 'HTTP', 'SMTP', 'TCP'],
            optionsEN: ['FTP', 'HTTP', 'SMTP', 'TCP'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Что означает аббревиатура "API"?',
            questionEN: 'What does "API" stand for?',
            optionsRU: ['Application Programming Interface', 'Apple Programming Integration', 'Advanced Platform Interface', 'Automated Program Index'],
            optionsEN: ['Application Programming Interface', 'Apple Programming Integration', 'Advanced Platform Interface', 'Automated Program Index'],
            correctIndex: 0,
            points: 20
        },
        {
            questionRU: 'Какой язык используется для стилей веб-страниц?',
            questionEN: 'Which language is used for styling web pages?',
            optionsRU: ['HTML', 'CSS', 'JavaScript', 'PHP'],
            optionsEN: ['HTML', 'CSS', 'JavaScript', 'PHP'],
            correctIndex: 1,
            points: 20
        }
    ],
    hard: [
        {
            questionRU: 'Что такое "рекурсия" в программировании?',
            questionEN: 'What is "recursion" in programming?',
            optionsRU: ['Повторение цикла', 'Функция, вызывающая саму себя', 'Обработка ошибок', 'Создание класса'],
            optionsEN: ['Loop repetition', 'Function calling itself', 'Error handling', 'Class creation'],
            correctIndex: 1,
            points: 30
        },
        {
            questionRU: 'Какой алгоритм лежит в основе блокчейна?',
            questionEN: 'Which algorithm is the basis of blockchain?',
            optionsRU: ['Сортировка', 'Хеширование', 'Сжатие', 'Шифрование Цезаря'],
            optionsEN: ['Sorting', 'Hashing', 'Compression', 'Caesar cipher'],
            correctIndex: 1,
            points: 30
        },
        {
            questionRU: 'Что такое Big O notation?',
            questionEN: 'What is Big O notation?',
            optionsRU: ['Размер программы', 'Оценка сложности алгоритма', 'Формат данных', 'Тип переменной'],
            optionsEN: ['Program size', 'Algorithm complexity estimation', 'Data format', 'Variable type'],
            correctIndex: 1,
            points: 30
        }
    ]
};

export default itQuestions;