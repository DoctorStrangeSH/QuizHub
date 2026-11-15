const animalsQuestions = {
    easy: [
        {
            questionRU: 'Какое животное самое высокое в мире?',
            questionEN: 'What is the tallest animal in the world?',
            optionsRU: ['Слон', 'Жираф', 'Страус', 'Лось'],
            optionsEN: ['Elephant', 'Giraffe', 'Ostrich', 'Moose'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Какое животное называют "королём зверей"?',
            questionEN: 'Which animal is called the "king of beasts"?',
            optionsRU: ['Тигр', 'Лев', 'Медведь', 'Волк'],
            optionsEN: ['Tiger', 'Lion', 'Bear', 'Wolf'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'К какой группе животных относятся лягушки и саламандры?',
            questionEN: 'Which animal group includes frogs and salamanders?',
            optionsRU: ['Рептилии', 'Земноводные', 'Млекопитающие', 'Рыбы'],
            optionsEN: ['Reptiles', 'Amphibians', 'Mammals', 'Fish'],
            correctIndex: 1,
            explanationRU: 'Лягушки и саламандры относятся к земноводным: их жизненный цикл обычно связан и с водой, и с сушей.',
            explanationEN: 'Frogs and salamanders are amphibians, a group whose life cycles are commonly linked to both water and land.',
            points: 10
        }
    ],
    medium: [
        {
            questionRU: 'Какая птица не умеет летать, но быстро бегает?',
            questionEN: 'Which bird cannot fly but runs fast?',
            optionsRU: ['Пингвин', 'Страус', 'Киви', 'Курица'],
            optionsEN: ['Penguin', 'Ostrich', 'Kiwi', 'Chicken'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Какое летающее млекопитающее использует эхолокацию для ориентации и поиска добычи?',
            questionEN: 'Which flying mammal uses echolocation to navigate and find prey?',
            optionsRU: ['Панда', 'Летучая мышь', 'Коала', 'Верблюд'],
            optionsEN: ['Panda', 'Bat', 'Koala', 'Camel'],
            correctIndex: 1,
            explanationRU: 'Многие летучие мыши издают ультразвуковые сигналы и ориентируются по отражённому эху.',
            explanationEN: 'Many bats emit ultrasonic calls and navigate by listening to the returning echoes.',
            points: 20
        },
        {
            questionRU: 'Как называется группа волков?',
            questionEN: 'What is a group of wolves called?',
            optionsRU: ['Стадо', 'Стая', 'Табун', 'Рой'],
            optionsEN: ['Herd', 'Pack', 'Flock', 'Swarm'],
            correctIndex: 1,
            points: 20
        }
    ],
    hard: [
        {
            questionRU: 'Какие млекопитающие способны к активному, а не планирующему полёту?',
            questionEN: 'Which mammals are capable of powered, rather than gliding, flight?',
            optionsRU: ['Летучие мыши', 'Белки-летяги', 'Лемуры', 'Поссумы'],
            optionsEN: ['Bats', 'Flying squirrels', 'Lemurs', 'Possums'],
            correctIndex: 1,
            explanationRU: 'Летучие мыши — единственная группа млекопитающих, освоившая активный машущий полёт.',
            explanationEN: 'Bats are the only group of mammals capable of sustained powered flight.',
            points: 30
        },
        {
            questionRU: 'Какое млекопитающее может летать?',
            questionEN: 'Which mammal can fly?',
            optionsRU: ['Белка', 'Летучая мышь', 'Лемур', 'Опоссум'],
            optionsEN: ['Squirrel', 'Bat', 'Lemur', 'Opossum'],
            correctIndex: 1,
            points: 30
        }
    ]
};

export default animalsQuestions;