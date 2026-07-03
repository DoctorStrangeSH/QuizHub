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
        }
    ]
};

export default musicQuestions;