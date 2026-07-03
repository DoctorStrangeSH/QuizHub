const moviesQuestions = {
    easy: [
        {
            questionRU: 'Как звали льва из мультфильма "Король Лев"?',
            questionEN: 'What was the name of the lion from "The Lion King"?',
            optionsRU: ['Муфаса', 'Симба', 'Шрам', 'Тимон'],
            optionsEN: ['Mufasa', 'Simba', 'Scar', 'Timon'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Кто сыграл Железного человека в фильмах Marvel?',
            questionEN: 'Who played Iron Man in Marvel movies?',
            optionsRU: ['Крис Эванс', 'Роберт Дауни мл.', 'Крис Хемсворт', 'Марк Руффало'],
            optionsEN: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Какой фильм получил Оскар за лучший фильм в 2020 году?',
            questionEN: 'Which film won the Oscar for Best Picture in 2020?',
            optionsRU: ['Джокер', '1917', 'Паразиты', 'Однажды в Голливуде'],
            optionsEN: ['Joker', '1917', 'Parasite', 'Once Upon a Time in Hollywood'],
            correctIndex: 2,
            points: 10
        }
    ],
    medium: [
        {
            questionRU: 'Как называется школа волшебства в Гарри Поттере?',
            questionEN: 'What is the name of the wizarding school in Harry Potter?',
            optionsRU: ['Дурмстранг', 'Хогвартс', 'Шармбатон', 'Ильверморни'],
            optionsEN: ['Durmstrang', 'Hogwarts', 'Beauxbatons', 'Ilvermorny'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Кто снял фильм "Криминальное чтиво"?',
            questionEN: 'Who directed "Pulp Fiction"?',
            optionsRU: ['Стивен Спилберг', 'Квентин Тарантино', 'Мартин Скорсезе', 'Кристофер Нолан'],
            optionsEN: ['Steven Spielberg', 'Quentin Tarantino', 'Martin Scorsese', 'Christopher Nolan'],
            correctIndex: 1,
            points: 20
        }
    ],
    hard: [
        {
            questionRU: 'Какой фильм был первым полнометражным анимационным фильмом?',
            questionEN: 'What was the first full-length animated feature film?',
            optionsRU: ['Король Лев', 'Белоснежка и семь гномов', 'Золушка', 'Бэмби'],
            optionsEN: ['The Lion King', 'Snow White and the Seven Dwarfs', 'Cinderella', 'Bambi'],
            correctIndex: 1,
            points: 30
        }
    ]
};

export default moviesQuestions;