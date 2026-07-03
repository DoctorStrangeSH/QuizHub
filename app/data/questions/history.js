const historyQuestions = {
    easy: [
        {
            questionRU: 'В каком году началась Вторая мировая война?',
            questionEN: 'What year did World War II begin?',
            optionsRU: ['1937', '1939', '1941', '1945'],
            optionsEN: ['1937', '1939', '1941', '1945'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Кто был первым президентом США?',
            questionEN: 'Who was the first president of the USA?',
            optionsRU: ['Томас Джефферсон', 'Джордж Вашингтон', 'Авраам Линкольн', 'Джон Адамс'],
            optionsEN: ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'John Adams'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Как назывались корабли Колумба, на которых он открыл Америку?',
            questionEN: 'What were the names of Columbus\'s ships that discovered America?',
            optionsRU: ['Санта-Мария, Пинта, Нинья', 'Титаник, Олимп, Британик', 'Виктория, Тринидад, Санта', 'Мэйфлауэр, Баунти, Эндевор'],
            optionsEN: ['Santa Maria, Pinta, Nina', 'Titanic, Olympic, Britannic', 'Victoria, Trinidad, Santa', 'Mayflower, Bounty, Endeavour'],
            correctIndex: 0,
            points: 10
        }
    ],
    medium: [
        {
            questionRU: 'Как называлась эпоха правления Екатерины II?',
            questionEN: 'What was the era of Catherine II\'s reign called?',
            optionsRU: ['Золотой век', 'Просвещённый абсолютизм', 'Серебряный век', 'Эпоха реформ'],
            optionsEN: ['Golden Age', 'Enlightened Absolutism', 'Silver Age', 'Reform Era'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'В каком году пала Берлинская стена?',
            questionEN: 'What year did the Berlin Wall fall?',
            optionsRU: ['1987', '1989', '1991', '1993'],
            optionsEN: ['1987', '1989', '1991', '1993'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Кто был первым человеком в космосе?',
            questionEN: 'Who was the first human in space?',
            optionsRU: ['Нил Армстронг', 'Юрий Гагарин', 'Джон Гленн', 'Валентина Терешкова'],
            optionsEN: ['Neil Armstrong', 'Yuri Gagarin', 'John Glenn', 'Valentina Tereshkova'],
            correctIndex: 1,
            points: 20
        }
    ],
    hard: [
        {
            questionRU: 'Какой договор завершил Первую мировую войну?',
            questionEN: 'Which treaty ended World War I?',
            optionsRU: ['Парижский', 'Версальский', 'Брестский', 'Потсдамский'],
            optionsEN: ['Paris', 'Versailles', 'Brest', 'Potsdam'],
            correctIndex: 1,
            points: 30
        },
        {
            questionRU: 'В каком году была подписана Великая хартия вольностей?',
            questionEN: 'What year was the Magna Carta signed?',
            optionsRU: ['1066', '1215', '1348', '1492'],
            optionsEN: ['1066', '1215', '1348', '1492'],
            correctIndex: 1,
            points: 30
        }
    ]
};

export default historyQuestions;