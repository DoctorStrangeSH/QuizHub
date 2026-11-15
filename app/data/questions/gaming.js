const gamingQuestions = {
    easy: [
        {
            questionRU: 'В каком году Minecraft вышла из раннего доступа и получила полноценный релиз?',
            questionEN: 'In which year did Minecraft leave beta and receive its full release?',
            optionsRU: ['2009', '2011', '2013', '2015'],
            optionsEN: ['2009', '2011', '2013', '2015'],
            correctIndex: 1,
            explanationRU: 'Полная версия Minecraft 1.0 вышла 18 ноября 2011 года.',
            explanationEN: 'Minecraft version 1.0 was officially released on November 18, 2011.',
            points: 10
        },
        {
            questionRU: 'Как звали персонажа, которым позже стал Марио, в первой игре Donkey Kong?',
            questionEN: 'What was the character who later became Mario originally called in Donkey Kong?',
            optionsRU: ['Джампмен', 'Луиджи', 'Варио', 'Капитан'],
            optionsEN: ['Jumpman', 'Luigi', 'Wario', 'Captain'],
            correctIndex: 0,
            explanationRU: 'В аркадной Donkey Kong 1981 года персонажа называли Jumpman.',
            explanationEN: 'In the 1981 arcade game Donkey Kong, the character was called Jumpman.',
            points: 10
        },
        {
            questionRU: 'Кто создал оригинальную игру Tetris?',
            questionEN: 'Who created the original game Tetris?',
            optionsRU: ['Сигэру Миямото', 'Алексей Пажитнов', 'Сид Мейер', 'Хидэо Кодзима'],
            optionsEN: ['Shigeru Miyamoto', 'Alexey Pajitnov', 'Sid Meier', 'Hideo Kojima'],
            correctIndex: 1,
            explanationRU: 'Алексей Пажитнов создал Tetris в 1984 году, работая в СССР.',
            explanationEN: 'Alexey Pajitnov created Tetris in 1984 while working in the Soviet Union.',
            points: 10
        },
        {
            questionRU: 'Какая компания выпускает игровые консоли PlayStation?',
            questionEN: 'Which company makes PlayStation consoles?',
            optionsRU: ['Nintendo', 'Sega', 'Sony', 'Microsoft'],
            optionsEN: ['Nintendo', 'Sega', 'Sony', 'Microsoft'],
            correctIndex: 2,
            explanationRU: 'PlayStation — линейка игровых консолей компании Sony.',
            explanationEN: 'PlayStation is a video game console line developed by Sony.',
            points: 10
        },
        {
            questionRU: 'Какой покемон стал главным талисманом франшизы Pokémon?',
            questionEN: 'Which Pokémon became the main mascot of the Pokémon franchise?',
            optionsRU: ['Чарizard', 'Пикачу', 'Сквиртл', 'Иви'],
            optionsEN: ['Charizard', 'Pikachu', 'Squirtle', 'Eevee'],
            correctIndex: 1,
            explanationRU: 'Пикачу стал самым узнаваемым символом Pokémon и постоянным спутником Эша в аниме.',
            explanationEN: 'Pikachu became the best-known symbol of Pokémon and Ash’s longtime anime companion.',
            points: 10
        },
        {
            questionRU: 'Какая компания создала персонажа Соника?',
            questionEN: 'Which company created Sonic the Hedgehog?',
            optionsRU: ['Capcom', 'Sega', 'Konami', 'Atari'],
            optionsEN: ['Capcom', 'Sega', 'Konami', 'Atari'],
            correctIndex: 1,
            explanationRU: 'Соник дебютировал в игре Sonic the Hedgehog, выпущенной Sega в 1991 году.',
            explanationEN: 'Sonic debuted in the game Sonic the Hedgehog, released by Sega in 1991.',
            points: 10
        }
    ],
    medium: [
        {
            questionRU: 'Какая студия разработала Portal?',
            questionEN: 'Which studio developed Portal?',
            optionsRU: ['Valve', 'BioWare', 'Bungie', 'Rare'],
            optionsEN: ['Valve', 'BioWare', 'Bungie', 'Rare'],
            correctIndex: 0,
            explanationRU: 'Portal была разработана Valve и впервые выпущена в составе The Orange Box в 2007 году.',
            explanationEN: 'Portal was developed by Valve and first released as part of The Orange Box in 2007.',
            points: 20
        },
        {
            questionRU: 'Какая компания разработала League of Legends?',
            questionEN: 'Which company developed League of Legends?',
            optionsRU: ['Blizzard Entertainment', 'Riot Games', 'Epic Games', 'Ubisoft'],
            optionsEN: ['Blizzard Entertainment', 'Riot Games', 'Epic Games', 'Ubisoft'],
            correctIndex: 1,
            explanationRU: 'League of Legends разработана и поддерживается Riot Games.',
            explanationEN: 'League of Legends is developed and operated by Riot Games.',
            points: 20
        },
        {
            questionRU: 'В каком году впервые вышла игра Among Us?',
            questionEN: 'In which year was Among Us first released?',
            optionsRU: ['2016', '2018', '2020', '2022'],
            optionsEN: ['2016', '2018', '2020', '2022'],
            correctIndex: 1,
            explanationRU: 'Among Us вышла в 2018 году, а широкую популярность получила в 2020-м.',
            explanationEN: 'Among Us launched in 2018 and became widely popular in 2020.',
            points: 20
        },
        {
            questionRU: 'В каком году первая PlayStation поступила в продажу в Японии?',
            questionEN: 'In which year did the original PlayStation launch in Japan?',
            optionsRU: ['1992', '1994', '1996', '1998'],
            optionsEN: ['1992', '1994', '1996', '1998'],
            correctIndex: 1,
            explanationRU: 'Первая PlayStation вышла в Японии 3 декабря 1994 года.',
            explanationEN: 'The original PlayStation launched in Japan on December 3, 1994.',
            points: 20
        },
        {
            questionRU: 'В каком году состоялся первоначальный релиз Overwatch?',
            questionEN: 'In which year was the original Overwatch released?',
            optionsRU: ['2014', '2016', '2018', '2020'],
            optionsEN: ['2014', '2016', '2018', '2020'],
            correctIndex: 1,
            explanationRU: 'Первая Overwatch вышла в мае 2016 года.',
            explanationEN: 'The first Overwatch was released in May 2016.',
            points: 20
        },
        {
            questionRU: 'Как называется игровая серия, в которой впервые появился Линк?',
            questionEN: 'In which game series did Link first appear?',
            optionsRU: ['Final Fantasy', 'The Legend of Zelda', 'Metroid', 'Fire Emblem'],
            optionsEN: ['Final Fantasy', 'The Legend of Zelda', 'Metroid', 'Fire Emblem'],
            correctIndex: 1,
            explanationRU: 'Линк — главный герой серии The Legend of Zelda от Nintendo.',
            explanationEN: 'Link is the main hero of Nintendo’s The Legend of Zelda series.',
            points: 20
        }
    ],
    hard: [
        {
            questionRU: 'Какая студия выпустила оригинальную Doom в 1993 году?',
            questionEN: 'Which studio released the original Doom in 1993?',
            optionsRU: ['id Software', '3D Realms', 'Epic MegaGames', 'Westwood Studios'],
            optionsEN: ['id Software', '3D Realms', 'Epic MegaGames', 'Westwood Studios'],
            correctIndex: 0,
            explanationRU: 'Оригинальную Doom разработала id Software; игра вышла в декабре 1993 года.',
            explanationEN: 'The original Doom was developed by id Software and released in December 1993.',
            points: 30
        },
        {
            questionRU: 'В каком году первые игры Pokémon Red и Green вышли в Японии?',
            questionEN: 'In which year were the first Pokémon Red and Green games released in Japan?',
            optionsRU: ['1994', '1996', '1998', '2000'],
            optionsEN: ['1994', '1996', '1998', '2000'],
            correctIndex: 1,
            explanationRU: 'Pokémon Red и Green впервые вышли в Японии 27 февраля 1996 года.',
            explanationEN: 'Pokémon Red and Green first launched in Japan on February 27, 1996.',
            points: 30
        },
        {
            questionRU: 'В каком году Dota 2 вышла из раннего доступа и получила официальный релиз?',
            questionEN: 'In which year did Dota 2 leave beta and receive its official release?',
            optionsRU: ['2011', '2012', '2013', '2015'],
            optionsEN: ['2011', '2012', '2013', '2015'],
            correctIndex: 2,
            explanationRU: 'Valve объявила о полноценном выпуске Dota 2 в июле 2013 года.',
            explanationEN: 'Valve announced the full release of Dota 2 in July 2013.',
            points: 30
        },
        {
            questionRU: 'На какой платформе впервые вышла оригинальная Metal Gear в 1987 году?',
            questionEN: 'On which platform did the original Metal Gear first launch in 1987?',
            optionsRU: ['Nintendo Entertainment System', 'MSX2', 'Sega Master System', 'Commodore 64'],
            optionsEN: ['Nintendo Entertainment System', 'MSX2', 'Sega Master System', 'Commodore 64'],
            correctIndex: 1,
            explanationRU: 'Первая Metal Gear была выпущена для компьютеров стандарта MSX2 в 1987 году.',
            explanationEN: 'The first Metal Gear was released for MSX2 computers in 1987.',
            points: 30
        },
        {
            questionRU: 'В какой день состоялся релиз Elden Ring?',
            questionEN: 'On which date was Elden Ring released?',
            optionsRU: ['25 февраля 2022 года', '10 марта 2022 года', '12 ноября 2021 года', '21 апреля 2022 года'],
            optionsEN: ['February 25, 2022', 'March 10, 2022', 'November 12, 2021', 'April 21, 2022'],
            correctIndex: 0,
            explanationRU: 'Elden Ring вышла 25 февраля 2022 года на нескольких поколениях консолей и ПК.',
            explanationEN: 'Elden Ring launched on February 25, 2022 for consoles and PC.',
            points: 30
        },
        {
            questionRU: 'Какое кодовое название использовалось для Nintendo GameCube во время разработки?',
            questionEN: 'What codename was used for the Nintendo GameCube during development?',
            optionsRU: ['Dolphin', 'Revolution', 'Ultra', 'NX'],
            optionsEN: ['Dolphin', 'Revolution', 'Ultra', 'NX'],
            correctIndex: 0,
            explanationRU: 'До выхода консоль Nintendo GameCube была известна под кодовым названием Dolphin.',
            explanationEN: 'Before release, the Nintendo GameCube was known by the codename Dolphin.',
            points: 30
        }
    ]
};

export default gamingQuestions;
