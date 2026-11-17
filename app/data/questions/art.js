const artQuestions = {
    easy: [
        {
            questionRU: 'Кто написал картину "Мона Лиза"?',
            questionEN: 'Who painted the "Mona Lisa"?',
            optionsRU: ['Ван Гог', 'Леонардо да Винчи', 'Пикассо', 'Рембрандт'],
            optionsEN: ['Van Gogh', 'Leonardo da Vinci', 'Picasso', 'Rembrandt'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Какой цвет получается при смешивании синего и жёлтого?',
            questionEN: 'What color is made by mixing blue and yellow?',
            optionsRU: ['Фиолетовый', 'Зелёный', 'Оранжевый', 'Коричневый'],
            optionsEN: ['Purple', 'Green', 'Orange', 'Brown'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Как называется искусство складывания бумаги в Японии?',
            questionEN: 'What is the Japanese art of paper folding called?',
            optionsRU: ['Икебана', 'Оригами', 'Каллиграфия', 'Бонсай'],
            optionsEN: ['Ikebana', 'Origami', 'Calligraphy', 'Bonsai'],
            correctIndex: 1,
            points: 10
        },
        {
            "questionRU": "Как называется живопись красками на водной основе по бумаге?",
            "questionEN": "What is painting with water-based transparent colors on paper called?",
            "optionsRU": [
                "Акварель",
                "Мозаика",
                "Гравюра",
                "Скульптура"
            ],
            "optionsEN": [
                "Watercolor",
                "Mosaic",
                "Engraving",
                "Sculpture"
            ],
            "correctIndex": 0,
            "explanationRU": "Акварель обычно используют на бумаге, а прозрачные слои создают лёгкие оттенки.",
            "explanationEN": "Watercolor is commonly painted on paper using transparent layers of pigment.",
            "points": 10
        },
        {
            "questionRU": "Кто создал скульптуру «Давид» во Флоренции?",
            "questionEN": "Who sculpted the marble David in Florence?",
            "optionsRU": [
                "Микеланджело",
                "Рафаэль",
                "Караваджо",
                "Донателло"
            ],
            "optionsEN": [
                "Michelangelo",
                "Raphael",
                "Caravaggio",
                "Donatello"
            ],
            "correctIndex": 0,
            "explanationRU": "Микеланджело завершил знаменитого мраморного «Давида» в начале XVI века.",
            "explanationEN": "Michelangelo completed his famous marble David in the early 16th century.",
            "points": 10
        },
        {
            "questionRU": "Какой предмет художник часто использует для смешивания красок?",
            "questionEN": "What does a painter often use to mix colors?",
            "optionsRU": [
                "Палитру",
                "Мольберт",
                "Раму",
                "Резец"
            ],
            "optionsEN": [
                "Palette",
                "Easel",
                "Frame",
                "Chisel"
            ],
            "correctIndex": 0,
            "explanationRU": "Палитра — поверхность, на которой смешивают краски перед нанесением.",
            "explanationEN": "A palette is a surface used to mix paints before applying them.",
            "points": 10
        }
    ],
    medium: [
        {
            questionRU: 'Какой художник отрезал себе ухо?',
            questionEN: 'Which artist cut off his own ear?',
            optionsRU: ['Клод Моне', 'Винсент Ван Гог', 'Сальвадор Дали', 'Поль Гоген'],
            optionsEN: ['Claude Monet', 'Vincent Van Gogh', 'Salvador Dali', 'Paul Gauguin'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Как называется стиль живописи с точками?',
            questionEN: 'What is the painting style with dots called?',
            optionsRU: ['Кубизм', 'Пуантилизм', 'Сюрреализм', 'Импрессионизм'],
            optionsEN: ['Cubism', 'Pointillism', 'Surrealism', 'Impressionism'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'В каком музее находится "Мона Лиза"?',
            questionEN: 'In which museum is the "Mona Lisa" located?',
            optionsRU: ['Эрмитаж', 'Лувр', 'Метрополитен', 'Прадо'],
            optionsEN: ['Hermitage', 'Louvre', 'Metropolitan', 'Prado'],
            correctIndex: 1,
            points: 20
        },
        {
            "questionRU": "К какому направлению относится Клод Моне?",
            "questionEN": "Which art movement is Claude Monet associated with?",
            "optionsRU": [
                "Кубизм",
                "Импрессионизм",
                "Барокко",
                "Сюрреализм"
            ],
            "optionsEN": [
                "Cubism",
                "Impressionism",
                "Baroque",
                "Surrealism"
            ],
            "correctIndex": 1,
            "explanationRU": "Картина Моне «Впечатление. Восход солнца» дала название импрессионизму.",
            "explanationEN": "Monet's Impression, Sunrise gave Impressionism its name.",
            "points": 20
        },
        {
            "questionRU": "Кто написал картину «Звёздная ночь»?",
            "questionEN": "Who painted The Starry Night?",
            "optionsRU": [
                "Винсент ван Гог",
                "Пабло Пикассо",
                "Эдвард Мунк",
                "Анри Матисс"
            ],
            "optionsEN": [
                "Vincent van Gogh",
                "Pablo Picasso",
                "Edvard Munch",
                "Henri Matisse"
            ],
            "correctIndex": 0,
            "explanationRU": "Ван Гог создал «Звёздную ночь» в 1889 году.",
            "explanationEN": "Van Gogh painted The Starry Night in 1889.",
            "points": 20
        },
        {
            "questionRU": "Как называется картина, изображающая главным образом неодушевлённые предметы?",
            "questionEN": "What is a painting primarily depicting inanimate objects called?",
            "optionsRU": [
                "Портрет",
                "Натюрморт",
                "Пейзаж",
                "Фреска"
            ],
            "optionsEN": [
                "Portrait",
                "Still life",
                "Landscape",
                "Fresco"
            ],
            "correctIndex": 1,
            "explanationRU": "В натюрмортах часто изображают посуду, фрукты, цветы и бытовые предметы.",
            "explanationEN": "Still life paintings often depict vessels, fruit, flowers, and everyday objects.",
            "points": 20
        }
    ],
    hard: [
        {
            questionRU: 'Кто основал стиль кубизм?',
            questionEN: 'Who founded the Cubism style?',
            optionsRU: ['Ван Гог и Гоген', 'Пикассо и Брак', 'Дали и Магритт', 'Моне и Ренуар'],
            optionsEN: ['Van Gogh and Gauguin', 'Picasso and Braque', 'Dali and Magritte', 'Monet and Renoir'],
            correctIndex: 1,
            points: 30
        },
        {
            questionRU: 'Как называется техника живописи по сырой штукатурке?',
            questionEN: 'What is the technique of painting on wet plaster called?',
            optionsRU: ['Темпера', 'Фреска', 'Акварель', 'Гуашь'],
            optionsEN: ['Tempera', 'Fresco', 'Watercolor', 'Gouache'],
            correctIndex: 1,
            points: 30
        },
        {
            "questionRU": "Какой художник создал работу «Постоянство памяти» с мягкими часами?",
            "questionEN": "Who painted The Persistence of Memory with melting clocks?",
            "optionsRU": [
                "Рене Магритт",
                "Сальвадор Дали",
                "Макс Эрнст",
                "Жоан Миро"
            ],
            "optionsEN": [
                "René Magritte",
                "Salvador Dalí",
                "Max Ernst",
                "Joan Miró"
            ],
            "correctIndex": 1,
            "explanationRU": "Картина Дали 1931 года стала одним из символов сюрреализма.",
            "explanationEN": "Dalí's 1931 painting became an emblem of Surrealism.",
            "points": 30
        },
        {
            "questionRU": "Какая техника использует небольшие кусочки камня или стекла для создания изображения?",
            "questionEN": "Which technique makes images from small pieces of stone or glass?",
            "optionsRU": [
                "Офорт",
                "Мозаика",
                "Литография",
                "Темпера"
            ],
            "optionsEN": [
                "Etching",
                "Mosaic",
                "Lithography",
                "Tempera"
            ],
            "correctIndex": 1,
            "explanationRU": "Мозаики складывают из отдельных элементов — тессер.",
            "explanationEN": "Mosaics are composed of small pieces called tesserae.",
            "points": 30
        },
        {
            "questionRU": "Как называется печатная техника с изображением, вытравленным кислотой на металлической пластине?",
            "questionEN": "Which printmaking technique uses an acid-etched metal plate?",
            "optionsRU": [
                "Офорт",
                "Шелкография",
                "Ксилография",
                "Коллаж"
            ],
            "optionsEN": [
                "Etching",
                "Screen printing",
                "Woodcut",
                "Collage"
            ],
            "correctIndex": 0,
            "explanationRU": "При офорте кислотой протравливают линии на пластине, с которой затем печатают оттиски.",
            "explanationEN": "Etching uses acid to bite lines into a metal plate for printing.",
            "points": 30
        }
    ]
};

export default artQuestions;