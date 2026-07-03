const sportsQuestions = {
    easy: [
        {
            questionRU: 'Сколько игроков в футбольной команде на поле?',
            questionEN: 'How many players are on a football team on the field?',
            optionsRU: ['9', '10', '11', '12'],
            optionsEN: ['9', '10', '11', '12'],
            correctIndex: 2,
            points: 10
        },
        {
            questionRU: 'В каком виде спорта используется шайба?',
            questionEN: 'In which sport is a puck used?',
            optionsRU: ['Футбол', 'Хоккей', 'Баскетбол', 'Теннис'],
            optionsEN: ['Football', 'Hockey', 'Basketball', 'Tennis'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Как называется площадка для игры в теннис?',
            questionEN: 'What is a tennis playing area called?',
            optionsRU: ['Поле', 'Корт', 'Ринг', 'Трек'],
            optionsEN: ['Field', 'Court', 'Ring', 'Track'],
            correctIndex: 1,
            points: 10
        }
    ],
    medium: [
        {
            questionRU: 'Сколько очков даётся за трёхочковый бросок в баскетболе?',
            questionEN: 'How many points is a three-point shot in basketball?',
            optionsRU: ['1', '2', '3', '4'],
            optionsEN: ['1', '2', '3', '4'],
            correctIndex: 2,
            points: 20
        },
        {
            questionRU: 'Какая страна выиграла ЧМ по футболу в 2018 году?',
            questionEN: 'Which country won the 2018 FIFA World Cup?',
            optionsRU: ['Германия', 'Бразилия', 'Франция', 'Аргентина'],
            optionsEN: ['Germany', 'Brazil', 'France', 'Argentina'],
            correctIndex: 2,
            points: 20
        }
    ],
    hard: [
        {
            questionRU: 'Кто является рекордсменом по количеству золотых олимпийских медалей?',
            questionEN: 'Who holds the record for most Olympic gold medals?',
            optionsRU: ['Усэйн Болт', 'Майкл Фелпс', 'Лариса Латынина', 'Карл Льюис'],
            optionsEN: ['Usain Bolt', 'Michael Phelps', 'Larisa Latynina', 'Carl Lewis'],
            correctIndex: 1,
            points: 30
        }
    ]
};

export default sportsQuestions;