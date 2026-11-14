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
            questionRU: 'Как назывались корабли первой экспедиции Колумба через Атлантику в 1492 году?',
            questionEN: 'What were the ships of Columbus\'s first Atlantic voyage in 1492 called?',
            optionsRU: ['Санта-Мария, Пинта, Нинья', 'Титаник, Олимп, Британик', 'Виктория, Тринидад, Санта', 'Мэйфлауэр, Баунти, Эндевор'],
            optionsEN: ['Santa Maria, Pinta, Nina', 'Titanic, Olympic, Britannic', 'Victoria, Trinidad, Santa', 'Mayflower, Bounty, Endeavour'],
            correctIndex: 0,
            points: 10
        },
        {
            "questionRU": "В какой древней цивилизации строили пирамиды Гизы?",
            "questionEN": "Which ancient civilization built the pyramids at Giza?",
            "optionsRU": [
                "Древний Египет",
                "Древний Рим",
                "Древняя Греция",
                "Империя инков"
            ],
            "optionsEN": [
                "Ancient Egypt",
                "Ancient Rome",
                "Ancient Greece",
                "Inca Empire"
            ],
            "correctIndex": 0,
            "explanationRU": "Пирамиды Гизы были построены в эпоху Древнего царства Египта.",
            "explanationEN": "The Giza pyramids were built during Egypt's Old Kingdom.",
            "points": 10
        },
        {
            "questionRU": "Как назывался знаменитый торговый путь между Восточной Азией и Европой?",
            "questionEN": "What was the famous trade route linking East Asia and Europe called?",
            "optionsRU": [
                "Янтарный путь",
                "Шёлковый путь",
                "Дорога специй",
                "Королевский тракт"
            ],
            "optionsEN": [
                "Amber Road",
                "Silk Road",
                "Spice Route",
                "King's Highway"
            ],
            "correctIndex": 1,
            "explanationRU": "Шёлковый путь представлял собой сеть торговых маршрутов, а не одну дорогу.",
            "explanationEN": "The Silk Road was a network of trade routes rather than a single road.",
            "points": 10
        },
        {
            "questionRU": "В каком городе находится Колизей?",
            "questionEN": "Which city is home to the Colosseum?",
            "optionsRU": [
                "Афины",
                "Рим",
                "Стамбул",
                "Неаполь"
            ],
            "optionsEN": [
                "Athens",
                "Rome",
                "Istanbul",
                "Naples"
            ],
            "correctIndex": 1,
            "explanationRU": "Колизей — римский амфитеатр, строительство которого завершили в I веке нашей эры.",
            "explanationEN": "The Colosseum is a Roman amphitheater completed in the first century CE.",
            "points": 10
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
        },
        {
            "questionRU": "Какой документ 1215 года ограничил власть английского короля?",
            "questionEN": "Which 1215 document placed limits on the English king's authority?",
            "optionsRU": [
                "Билль о правах",
                "Великая хартия вольностей",
                "Декларация независимости",
                "Нантский эдикт"
            ],
            "optionsEN": [
                "Bill of Rights",
                "Magna Carta",
                "Declaration of Independence",
                "Edict of Nantes"
            ],
            "correctIndex": 1,
            "explanationRU": "Великая хартия вольностей закрепила важные ограничения королевской власти.",
            "explanationEN": "Magna Carta established important limits on royal power.",
            "points": 20
        },
        {
            "questionRU": "В каком году человек впервые высадился на Луне?",
            "questionEN": "In what year did humans first land on the Moon?",
            "optionsRU": [
                "1957",
                "1961",
                "1969",
                "1975"
            ],
            "optionsEN": [
                "1957",
                "1961",
                "1969",
                "1975"
            ],
            "correctIndex": 2,
            "explanationRU": "Аполлон-11 совершил первую пилотируемую посадку на Луну в июле 1969 года.",
            "explanationEN": "Apollo 11 made the first crewed Moon landing in July 1969.",
            "points": 20
        },
        {
            "questionRU": "Какая цивилизация построила Мачу-Пикчу?",
            "questionEN": "Which civilization built Machu Picchu?",
            "optionsRU": [
                "Ацтеки",
                "Инки",
                "Майя",
                "Ольмеки"
            ],
            "optionsEN": [
                "Aztec",
                "Inca",
                "Maya",
                "Olmec"
            ],
            "correctIndex": 1,
            "explanationRU": "Мачу-Пикчу — город инков в Андах на территории современного Перу.",
            "explanationEN": "Machu Picchu is an Inca site in the Andes of present-day Peru.",
            "points": 20
        }
    ],
    hard: [
        {
            questionRU: 'Какой мирный договор с Германией был подписан после Первой мировой войны в 1919 году?',
            questionEN: 'Which 1919 peace treaty was signed with Germany after World War I?',
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
        },
        {
            "questionRU": "Какой город был столицей Византийской империи?",
            "questionEN": "Which city served as the capital of the Byzantine Empire?",
            "optionsRU": [
                "Александрия",
                "Константинополь",
                "Антиохия",
                "Равенна"
            ],
            "optionsEN": [
                "Alexandria",
                "Constantinople",
                "Antioch",
                "Ravenna"
            ],
            "correctIndex": 1,
            "explanationRU": "Константинополь был основан как новая столица Римской империи в IV веке.",
            "explanationEN": "Constantinople became the Roman Empire's new capital in the fourth century.",
            "points": 30
        },
        {
            "questionRU": "В каком году началась Реформация, традиционно связываемая с тезисами Мартина Лютера?",
            "questionEN": "Which year traditionally marks the Reformation associated with Martin Luther's theses?",
            "optionsRU": [
                "1453",
                "1492",
                "1517",
                "1648"
            ],
            "optionsEN": [
                "1453",
                "1492",
                "1517",
                "1648"
            ],
            "correctIndex": 2,
            "explanationRU": "В 1517 году Лютер обнародовал свои 95 тезисов о церковных злоупотреблениях.",
            "explanationEN": "In 1517 Luther circulated his 95 theses criticizing church practices.",
            "points": 30
        },
        {
            "questionRU": "Какой мирный договор 1648 года завершил Тридцатилетнюю войну?",
            "questionEN": "Which 1648 peace settlement ended the Thirty Years' War?",
            "optionsRU": [
                "Утрехтский мир",
                "Вестфальский мир",
                "Тильзитский мир",
                "Венский конгресс"
            ],
            "optionsEN": [
                "Peace of Utrecht",
                "Peace of Westphalia",
                "Treaties of Tilsit",
                "Congress of Vienna"
            ],
            "correctIndex": 1,
            "explanationRU": "Вестфальский мир — комплекс соглашений, завершивших Тридцатилетнюю войну.",
            "explanationEN": "The Peace of Westphalia refers to agreements that ended the Thirty Years' War.",
            "points": 30
        }
    ]
};

export default historyQuestions;