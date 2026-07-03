// ===== НАУКА | ЛЁГКИЕ (200 вопросов) =====
const easyQuestions = [
    {
        questionRU: 'Какая планета ближе всего к Солнцу?',
        questionEN: 'Which planet is closest to the Sun?',
        optionsRU: ['Венера', 'Земля', 'Меркурий', 'Марс'],
        optionsEN: ['Venus', 'Earth', 'Mercury', 'Mars'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько ног у паука?',
        questionEN: 'How many legs does a spider have?',
        optionsRU: ['6', '8', '10', '12'],
        optionsEN: ['6', '8', '10', '12'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой газ мы выдыхаем?',
        questionEN: 'What gas do we exhale?',
        optionsRU: ['Кислород', 'Азот', 'Углекислый газ', 'Водород'],
        optionsEN: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько континентов на Земле?',
        questionEN: 'How many continents are there on Earth?',
        optionsRU: ['5', '6', '7', '8'],
        optionsEN: ['5', '6', '7', '8'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая самая большая планета в Солнечной системе?',
        questionEN: 'What is the largest planet in the Solar System?',
        optionsRU: ['Сатурн', 'Юпитер', 'Нептун', 'Земля'],
        optionsEN: ['Saturn', 'Jupiter', 'Neptune', 'Earth'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Что измеряет термометр?',
        questionEN: 'What does a thermometer measure?',
        optionsRU: ['Давление', 'Влажность', 'Температуру', 'Скорость'],
        optionsEN: ['Pressure', 'Humidity', 'Temperature', 'Speed'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько костей в теле взрослого человека?',
        questionEN: 'How many bones are in the adult human body?',
        optionsRU: ['106', '206', '306', '406'],
        optionsEN: ['106', '206', '306', '406'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется спутник Земли?',
        questionEN: 'What is the name of Earth\'s satellite?',
        optionsRU: ['Солнце', 'Луна', 'Марс', 'Венера'],
        optionsEN: ['Sun', 'Moon', 'Mars', 'Venus'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая вода замерзает при 0°C?',
        questionEN: 'What water freezes at 0°C?',
        optionsRU: ['Солёная', 'Пресная', 'Кипячёная', 'Дистиллированная'],
        optionsEN: ['Salt water', 'Fresh water', 'Boiled water', 'Distilled water'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько цветов в радуге?',
        questionEN: 'How many colors are in a rainbow?',
        optionsRU: ['5', '6', '7', '8'],
        optionsEN: ['5', '6', '7', '8'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой орган отвечает за дыхание?',
        questionEN: 'Which organ is responsible for breathing?',
        optionsRU: ['Сердце', 'Печень', 'Лёгкие', 'Почки'],
        optionsEN: ['Heart', 'Liver', 'Lungs', 'Kidneys'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какое животное является самым быстрым на суше?',
        questionEN: 'Which animal is the fastest on land?',
        optionsRU: ['Лев', 'Гепард', 'Антилопа', 'Тигр'],
        optionsEN: ['Lion', 'Cheetah', 'Antelope', 'Tiger'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется наука о живых организмах?',
        questionEN: 'What is the science of living organisms called?',
        optionsRU: ['Химия', 'Физика', 'Биология', 'Геология'],
        optionsEN: ['Chemistry', 'Physics', 'Biology', 'Geology'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько дней в високосном году?',
        questionEN: 'How many days are in a leap year?',
        optionsRU: ['364', '365', '366', '367'],
        optionsEN: ['364', '365', '366', '367'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется ближайшая к нам звезда?',
        questionEN: 'What is the nearest star to us called?',
        optionsRU: ['Полярная', 'Сириус', 'Солнце', 'Альфа Центавра'],
        optionsEN: ['Polaris', 'Sirius', 'Sun', 'Alpha Centauri'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой химический элемент обозначается буквой O?',
        questionEN: 'Which chemical element is denoted by the letter O?',
        optionsRU: ['Олово', 'Кислород', 'Осмий', 'Озон'],
        optionsEN: ['Tin', 'Oxygen', 'Osmium', 'Ozone'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько литров крови в теле взрослого человека?',
        questionEN: 'How many liters of blood are in an adult human body?',
        optionsRU: ['1-2', '3-4', '5-6', '7-8'],
        optionsEN: ['1-2', '3-4', '5-6', '7-8'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется столица Франции?',
        questionEN: 'What is the capital of France?',
        optionsRU: ['Лондон', 'Берлин', 'Мадрид', 'Париж'],
        optionsEN: ['London', 'Berlin', 'Madrid', 'Paris'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Какое море является самым большим?',
        questionEN: 'Which sea is the largest?',
        optionsRU: ['Чёрное', 'Средиземное', 'Красное', 'Каспийское'],
        optionsEN: ['Black Sea', 'Mediterranean Sea', 'Red Sea', 'Caspian Sea'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Сколько зубов у взрослого человека?',
        questionEN: 'How many teeth does an adult human have?',
        optionsRU: ['28', '30', '32', '34'],
        optionsEN: ['28', '30', '32', '34'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется процесс, при котором растения производят кислород?',
        questionEN: 'What is the process by which plants produce oxygen called?',
        optionsRU: ['Дыхание', 'Фотосинтез', 'Испарение', 'Пищеварение'],
        optionsEN: ['Respiration', 'Photosynthesis', 'Evaporation', 'Digestion'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая планета имеет кольца?',
        questionEN: 'Which planet has rings?',
        optionsRU: ['Марс', 'Венера', 'Сатурн', 'Меркурий'],
        optionsEN: ['Mars', 'Venus', 'Saturn', 'Mercury'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется самая высокая гора в мире?',
        questionEN: 'What is the tallest mountain in the world called?',
        optionsRU: ['Килиманджаро', 'Эверест', 'Эльбрус', 'Монблан'],
        optionsEN: ['Kilimanjaro', 'Everest', 'Elbrus', 'Mont Blanc'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько часов в сутках?',
        questionEN: 'How many hours are in a day?',
        optionsRU: ['12', '24', '36', '48'],
        optionsEN: ['12', '24', '36', '48'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется жидкая часть крови?',
        questionEN: 'What is the liquid part of blood called?',
        optionsRU: ['Плазма', 'Сыворотка', 'Лимфа', 'Цитоплазма'],
        optionsEN: ['Plasma', 'Serum', 'Lymph', 'Cytoplasm'],
        correctIndex: 0,
        points: 10
    },
    {
        questionRU: 'Какой океан является самым большим?',
        questionEN: 'Which ocean is the largest?',
        optionsRU: ['Атлантический', 'Индийский', 'Тихий', 'Северный Ледовитый'],
        optionsEN: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько хромосом у человека?',
        questionEN: 'How many chromosomes do humans have?',
        optionsRU: ['23', '44', '46', '48'],
        optionsEN: ['23', '44', '46', '48'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется газ, который мы вдыхаем?',
        questionEN: 'What is the gas we inhale called?',
        optionsRU: ['Азот', 'Кислород', 'Углекислый газ', 'Гелий'],
        optionsEN: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Helium'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая планета является красной?',
        questionEN: 'Which planet is red?',
        optionsRU: ['Венера', 'Юпитер', 'Марс', 'Сатурн'],
        optionsEN: ['Venus', 'Jupiter', 'Mars', 'Saturn'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется единица измерения силы тока?',
        questionEN: 'What is the unit of electric current called?',
        optionsRU: ['Вольт', 'Ватт', 'Ампер', 'Ом'],
        optionsEN: ['Volt', 'Watt', 'Ampere', 'Ohm'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько сторон у квадрата?',
        questionEN: 'How many sides does a square have?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется самая длинная река в мире?',
        questionEN: 'What is the longest river in the world called?',
        optionsRU: ['Нил', 'Амазонка', 'Миссисипи', 'Янцзы'],
        optionsEN: ['Nile', 'Amazon', 'Mississippi', 'Yangtze'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какое вещество имеет формулу H2O?',
        questionEN: 'What substance has the formula H2O?',
        optionsRU: ['Кислород', 'Вода', 'Водород', 'Перекись'],
        optionsEN: ['Oxygen', 'Water', 'Hydrogen', 'Peroxide'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько минут в одном градусе?',
        questionEN: 'How many minutes are in one degree?',
        optionsRU: ['30', '45', '60', '90'],
        optionsEN: ['30', '45', '60', '90'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется орган слуха?',
        questionEN: 'What is the organ of hearing called?',
        optionsRU: ['Глаз', 'Нос', 'Ухо', 'Язык'],
        optionsEN: ['Eye', 'Nose', 'Ear', 'Tongue'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какое число обозначается римской цифрой X?',
        questionEN: 'What number is denoted by the Roman numeral X?',
        optionsRU: ['5', '10', '50', '100'],
        optionsEN: ['5', '10', '50', '100'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется наука о погоде?',
        questionEN: 'What is the science of weather called?',
        optionsRU: ['Геология', 'Метеорология', 'Астрономия', 'Экология'],
        optionsEN: ['Geology', 'Meteorology', 'Astronomy', 'Ecology'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько игроков в футбольной команде?',
        questionEN: 'How many players are on a football team?',
        optionsRU: ['9', '10', '11', '12'],
        optionsEN: ['9', '10', '11', '12'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется самая маленькая частица элемента?',
        questionEN: 'What is the smallest particle of an element called?',
        optionsRU: ['Молекула', 'Атом', 'Клетка', 'Электрон'],
        optionsEN: ['Molecule', 'Atom', 'Cell', 'Electron'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая планета находится между Марсом и Сатурном?',
        questionEN: 'Which planet is between Mars and Saturn?',
        optionsRU: ['Венера', 'Земля', 'Юпитер', 'Уран'],
        optionsEN: ['Venus', 'Earth', 'Jupiter', 'Uranus'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько процентов поверхности Земли покрывает вода?',
        questionEN: 'What percentage of Earth\'s surface is covered by water?',
        optionsRU: ['50%', '60%', '71%', '80%'],
        optionsEN: ['50%', '60%', '71%', '80%'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется врач, лечащий детей?',
        questionEN: 'What is a doctor who treats children called?',
        optionsRU: ['Хирург', 'Терапевт', 'Педиатр', 'Невролог'],
        optionsEN: ['Surgeon', 'Therapist', 'Pediatrician', 'Neurologist'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой металл является жидким при комнатной температуре?',
        questionEN: 'Which metal is liquid at room temperature?',
        optionsRU: ['Железо', 'Золото', 'Ртуть', 'Серебро'],
        optionsEN: ['Iron', 'Gold', 'Mercury', 'Silver'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько пар рёбер у человека?',
        questionEN: 'How many pairs of ribs does a human have?',
        optionsRU: ['10', '12', '14', '16'],
        optionsEN: ['10', '12', '14', '16'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется самая маленькая планета Солнечной системы?',
        questionEN: 'What is the smallest planet in the Solar System called?',
        optionsRU: ['Марс', 'Меркурий', 'Венера', 'Плутон'],
        optionsEN: ['Mars', 'Mercury', 'Venus', 'Pluto'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какое животное является символом мудрости?',
        questionEN: 'Which animal is a symbol of wisdom?',
        optionsRU: ['Лиса', 'Сова', 'Змея', 'Волк'],
        optionsEN: ['Fox', 'Owl', 'Snake', 'Wolf'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько лет в одном веке?',
        questionEN: 'How many years are in one century?',
        optionsRU: ['50', '100', '200', '1000'],
        optionsEN: ['50', '100', '200', '1000'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется инструмент для измерения времени?',
        questionEN: 'What is an instrument for measuring time called?',
        optionsRU: ['Барометр', 'Термометр', 'Часы', 'Секундомер'],
        optionsEN: ['Barometer', 'Thermometer', 'Clock', 'Stopwatch'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая кость в теле человека самая длинная?',
        questionEN: 'Which bone in the human body is the longest?',
        optionsRU: ['Плечевая', 'Бедренная', 'Большеберцовая', 'Лучевая'],
        optionsEN: ['Humerus', 'Femur', 'Tibia', 'Radius'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется сила, удерживающая нас на Земле?',
        questionEN: 'What is the force that keeps us on Earth called?',
        optionsRU: ['Трение', 'Магнетизм', 'Гравитация', 'Инерция'],
        optionsEN: ['Friction', 'Magnetism', 'Gravity', 'Inertia'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой фрукт упал на голову Ньютона?',
        questionEN: 'Which fruit fell on Newton\'s head?',
        optionsRU: ['Груша', 'Яблоко', 'Слива', 'Апельсин'],
        optionsEN: ['Pear', 'Apple', 'Plum', 'Orange'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько атмосфер на Земле?',
        questionEN: 'How many atmospheres does Earth have?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 0,
        points: 10
    },
    {
        questionRU: 'Как называется самая большая кость человека?',
        questionEN: 'What is the largest human bone called?',
        optionsRU: ['Позвонок', 'Бедренная', 'Таз', 'Череп'],
        optionsEN: ['Vertebra', 'Femur', 'Pelvis', 'Skull'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой орган перекачивает кровь?',
        questionEN: 'Which organ pumps blood?',
        optionsRU: ['Мозг', 'Сердце', 'Печень', 'Лёгкие'],
        optionsEN: ['Brain', 'Heart', 'Liver', 'Lungs'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько глаз у пчелы?',
        questionEN: 'How many eyes does a bee have?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Какая температура кипения воды в градусах Цельсия?',
        questionEN: 'What is the boiling point of water in degrees Celsius?',
        optionsRU: ['50', '75', '100', '125'],
        optionsEN: ['50', '75', '100', '125'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется группа звёзд, образующая узор?',
        questionEN: 'What is a group of stars forming a pattern called?',
        optionsRU: ['Галактика', 'Созвездие', 'Вселенная', 'Туманность'],
        optionsEN: ['Galaxy', 'Constellation', 'Universe', 'Nebula'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой газ является самым распространённым в атмосфере?',
        questionEN: 'Which gas is the most abundant in the atmosphere?',
        optionsRU: ['Кислород', 'Азот', 'Углекислый газ', 'Водород'],
        optionsEN: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько пальцев на руке человека?',
        questionEN: 'How many fingers are on a human hand?',
        optionsRU: ['4', '5', '6', '7'],
        optionsEN: ['4', '5', '6', '7'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой континент является самым большим?',
        questionEN: 'Which continent is the largest?',
        optionsRU: ['Африка', 'Северная Америка', 'Азия', 'Европа'],
        optionsEN: ['Africa', 'North America', 'Asia', 'Europe'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая планета названа в честь римского бога моря?',
        questionEN: 'Which planet is named after the Roman god of the sea?',
        optionsRU: ['Юпитер', 'Марс', 'Нептун', 'Меркурий'],
        optionsEN: ['Jupiter', 'Mars', 'Neptune', 'Mercury'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько костей в черепе человека?',
        questionEN: 'How many bones are in the human skull?',
        optionsRU: ['12', '18', '22', '28'],
        optionsEN: ['12', '18', '22', '28'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется столица России?',
        questionEN: 'What is the capital of Russia?',
        optionsRU: ['Киев', 'Минск', 'Москва', 'Санкт-Петербург'],
        optionsEN: ['Kyiv', 'Minsk', 'Moscow', 'Saint Petersburg'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой химический символ у золота?',
        questionEN: 'What is the chemical symbol for gold?',
        optionsRU: ['Ag', 'Au', 'Fe', 'Cu'],
        optionsEN: ['Ag', 'Au', 'Fe', 'Cu'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько планет в Солнечной системе?',
        questionEN: 'How many planets are in the Solar System?',
        optionsRU: ['7', '8', '9', '10'],
        optionsEN: ['7', '8', '9', '10'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая птица не умеет летать?',
        questionEN: 'Which bird cannot fly?',
        optionsRU: ['Орёл', 'Страус', 'Воробей', 'Сокол'],
        optionsEN: ['Eagle', 'Ostrich', 'Sparrow', 'Falcon'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется орган вкуса?',
        questionEN: 'What is the organ of taste called?',
        optionsRU: ['Нос', 'Глаз', 'Язык', 'Кожа'],
        optionsEN: ['Nose', 'Eye', 'Tongue', 'Skin'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько дней в обычном году?',
        questionEN: 'How many days are in a regular year?',
        optionsRU: ['355', '360', '365', '370'],
        optionsEN: ['355', '360', '365', '370'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая планета является самой горячей в Солнечной системе?',
        questionEN: 'Which planet is the hottest in the Solar System?',
        optionsRU: ['Меркурий', 'Венера', 'Марс', 'Земля'],
        optionsEN: ['Mercury', 'Venus', 'Mars', 'Earth'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется единица измерения напряжения?',
        questionEN: 'What is the unit of voltage called?',
        optionsRU: ['Ампер', 'Ом', 'Вольт', 'Ватт'],
        optionsEN: ['Ampere', 'Ohm', 'Volt', 'Watt'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько лап у насекомого?',
        questionEN: 'How many legs does an insect have?',
        optionsRU: ['4', '6', '8', '10'],
        optionsEN: ['4', '6', '8', '10'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется ближайшая к Земле звезда?',
        questionEN: 'What is the closest star to Earth called?',
        optionsRU: ['Сириус', 'Полярная', 'Солнце', 'Альдебаран'],
        optionsEN: ['Sirius', 'Polaris', 'Sun', 'Aldebaran'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой элемент обозначается Fe?',
        questionEN: 'Which element is denoted by Fe?',
        optionsRU: ['Фтор', 'Фосфор', 'Железо', 'Франций'],
        optionsEN: ['Fluorine', 'Phosphorus', 'Iron', 'Francium'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько секунд в минуте?',
        questionEN: 'How many seconds are in a minute?',
        optionsRU: ['30', '45', '60', '90'],
        optionsEN: ['30', '45', '60', '90'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какое животное рождает детёнышей, а не откладывает яйца?',
        questionEN: 'Which animal gives birth to live young instead of laying eggs?',
        optionsRU: ['Курица', 'Кошка', 'Черепаха', 'Крокодил'],
        optionsEN: ['Chicken', 'Cat', 'Turtle', 'Crocodile'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется форма Земли?',
        questionEN: 'What is the shape of the Earth called?',
        optionsRU: ['Круг', 'Шар', 'Эллипс', 'Геоид'],
        optionsEN: ['Circle', 'Sphere', 'Ellipse', 'Geoid'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Сколько кругов кровообращения у человека?',
        questionEN: 'How many circuits of blood circulation does a human have?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какое число Пи примерно равно?',
        questionEN: 'What is the approximate value of Pi?',
        optionsRU: ['2.14', '3.14', '4.14', '5.14'],
        optionsEN: ['2.14', '3.14', '4.14', '5.14'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой цвет имеет хлорофилл?',
        questionEN: 'What color is chlorophyll?',
        optionsRU: ['Красный', 'Синий', 'Зелёный', 'Жёлтый'],
        optionsEN: ['Red', 'Blue', 'Green', 'Yellow'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько камер в сердце человека?',
        questionEN: 'How many chambers are in the human heart?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется спутник Марса?',
        questionEN: 'What is the satellite of Mars called?',
        optionsRU: ['Луна', 'Европа', 'Фобос', 'Титан'],
        optionsEN: ['Moon', 'Europa', 'Phobos', 'Titan'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой витамин содержится в апельсинах?',
        questionEN: 'Which vitamin is found in oranges?',
        optionsRU: ['Витамин A', 'Витамин B', 'Витамин C', 'Витамин D'],
        optionsEN: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько месяцев в году имеют 31 день?',
        questionEN: 'How many months in a year have 31 days?',
        optionsRU: ['5', '6', '7', '8'],
        optionsEN: ['5', '6', '7', '8'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется травоядное животное с длинной шеей?',
        questionEN: 'What is the herbivorous animal with a long neck called?',
        optionsRU: ['Слон', 'Жираф', 'Носорог', 'Бегемот'],
        optionsEN: ['Elephant', 'Giraffe', 'Rhinoceros', 'Hippopotamus'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой океан омывает берега России с севера?',
        questionEN: 'Which ocean washes the shores of Russia from the north?',
        optionsRU: ['Тихий', 'Атлантический', 'Северный Ледовитый', 'Индийский'],
        optionsEN: ['Pacific', 'Atlantic', 'Arctic', 'Indian'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько костей в позвоночнике человека?',
        questionEN: 'How many bones are in the human spine?',
        optionsRU: ['23', '33', '43', '53'],
        optionsEN: ['23', '33', '43', '53'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется самая большая пустыня в мире?',
        questionEN: 'What is the largest desert in the world called?',
        optionsRU: ['Сахара', 'Гоби', 'Атакама', 'Антарктическая'],
        optionsEN: ['Sahara', 'Gobi', 'Atacama', 'Antarctic'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Какая птица откладывает самые большие яйца?',
        questionEN: 'Which bird lays the largest eggs?',
        optionsRU: ['Орёл', 'Страус', 'Пингвин', 'Альбатрос'],
        optionsEN: ['Eagle', 'Ostrich', 'Penguin', 'Albatross'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется самая большая звезда в Солнечной системе?',
        questionEN: 'What is the largest star in the Solar System called?',
        optionsRU: ['Полярная', 'Сириус', 'Солнце', 'Бетельгейзе'],
        optionsEN: ['Polaris', 'Sirius', 'Sun', 'Betelgeuse'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько у человека молочных зубов?',
        questionEN: 'How many milk teeth does a human have?',
        optionsRU: ['16', '20', '24', '28'],
        optionsEN: ['16', '20', '24', '28'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой металл самый лёгкий?',
        questionEN: 'Which metal is the lightest?',
        optionsRU: ['Алюминий', 'Литий', 'Магний', 'Титан'],
        optionsEN: ['Aluminum', 'Lithium', 'Magnesium', 'Titanium'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется единица измерения сопротивления?',
        questionEN: 'What is the unit of resistance called?',
        optionsRU: ['Ампер', 'Вольт', 'Ом', 'Ватт'],
        optionsEN: ['Ampere', 'Volt', 'Ohm', 'Watt'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько спутников у Земли?',
        questionEN: 'How many satellites does Earth have?',
        optionsRU: ['0', '1', '2', '3'],
        optionsEN: ['0', '1', '2', '3'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая рыба является самой быстрой?',
        questionEN: 'Which fish is the fastest?',
        optionsRU: ['Тунец', 'Акула', 'Парусник', 'Лосось'],
        optionsEN: ['Tuna', 'Shark', 'Sailfish', 'Salmon'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется год с 366 днями?',
        questionEN: 'What is a year with 366 days called?',
        optionsRU: ['Обычный', 'Високосный', 'Длинный', 'Солнечный'],
        optionsEN: ['Regular', 'Leap', 'Long', 'Solar'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какое животное имеет полосатую окраску?',
        questionEN: 'Which animal has striped coloring?',
        optionsRU: ['Лев', 'Зебра', 'Слон', 'Медведь'],
        optionsEN: ['Lion', 'Zebra', 'Elephant', 'Bear'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько градусов в прямом угле?',
        questionEN: 'How many degrees are in a right angle?',
        optionsRU: ['45', '60', '90', '180'],
        optionsEN: ['45', '60', '90', '180'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется наука о космосе?',
        questionEN: 'What is the science of space called?',
        optionsRU: ['Астрология', 'Астрономия', 'География', 'Метеорология'],
        optionsEN: ['Astrology', 'Astronomy', 'Geography', 'Meteorology'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая планета вращается в противоположную сторону?',
        questionEN: 'Which planet rotates in the opposite direction?',
        optionsRU: ['Меркурий', 'Венера', 'Земля', 'Марс'],
        optionsEN: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько мышц в теле человека?',
        questionEN: 'How many muscles are in the human body?',
        optionsRU: ['Около 200', 'Около 400', 'Около 600', 'Около 800'],
        optionsEN: ['About 200', 'About 400', 'About 600', 'About 800'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой химический символ у серебра?',
        questionEN: 'What is the chemical symbol for silver?',
        optionsRU: ['Ag', 'Si', 'Sr', 'Sn'],
        optionsEN: ['Ag', 'Si', 'Sr', 'Sn'],
        correctIndex: 0,
        points: 10
    },
    {
        questionRU: 'Сколько граней у куба?',
        questionEN: 'How many faces does a cube have?',
        optionsRU: ['4', '6', '8', '12'],
        optionsEN: ['4', '6', '8', '12'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая самая маленькая птица в мире?',
        questionEN: 'What is the smallest bird in the world?',
        optionsRU: ['Воробей', 'Колибри', 'Синица', 'Канарейка'],
        optionsEN: ['Sparrow', 'Hummingbird', 'Titmouse', 'Canary'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется самая высокая точка планеты?',
        questionEN: 'What is the highest point on the planet called?',
        optionsRU: ['Килиманджаро', 'Эльбрус', 'Эверест', 'Монблан'],
        optionsEN: ['Kilimanjaro', 'Elbrus', 'Everest', 'Mont Blanc'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько конечностей у человека?',
        questionEN: 'How many limbs does a human have?',
        optionsRU: ['2', '4', '6', '8'],
        optionsEN: ['2', '4', '6', '8'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой орган вырабатывает инсулин?',
        questionEN: 'Which organ produces insulin?',
        optionsRU: ['Печень', 'Почки', 'Поджелудочная железа', 'Селезёнка'],
        optionsEN: ['Liver', 'Kidneys', 'Pancreas', 'Spleen'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько небесных тел в Солнечной системе официально считаются планетами?',
        questionEN: 'How many celestial bodies in the Solar System are officially considered planets?',
        optionsRU: ['7', '8', '9', '10'],
        optionsEN: ['7', '8', '9', '10'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая наука изучает вулканы?',
        questionEN: 'Which science studies volcanoes?',
        optionsRU: ['Сейсмология', 'Вулканология', 'Геоморфология', 'Минералогия'],
        optionsEN: ['Seismology', 'Volcanology', 'Geomorphology', 'Mineralogy'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой элемент самый распространённый во Вселенной?',
        questionEN: 'Which element is the most abundant in the universe?',
        optionsRU: ['Гелий', 'Кислород', 'Водород', 'Углерод'],
        optionsEN: ['Helium', 'Oxygen', 'Hydrogen', 'Carbon'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько костей в стопе человека?',
        questionEN: 'How many bones are in the human foot?',
        optionsRU: ['20', '26', '30', '36'],
        optionsEN: ['20', '26', '30', '36'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется четвёртое состояние вещества?',
        questionEN: 'What is the fourth state of matter called?',
        optionsRU: ['Твёрдое', 'Жидкое', 'Газ', 'Плазма'],
        optionsEN: ['Solid', 'Liquid', 'Gas', 'Plasma'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Какая планета третья от Солнца?',
        questionEN: 'Which planet is the third from the Sun?',
        optionsRU: ['Меркурий', 'Венера', 'Земля', 'Марс'],
        optionsEN: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько нулей в миллиарде?',
        questionEN: 'How many zeros are in a billion?',
        optionsRU: ['6', '7', '8', '9'],
        optionsEN: ['6', '7', '8', '9'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Как называется вещество, ускоряющее химическую реакцию?',
        questionEN: 'What is a substance that speeds up a chemical reaction called?',
        optionsRU: ['Реагент', 'Катализатор', 'Продукт', 'Растворитель'],
        optionsEN: ['Reagent', 'Catalyst', 'Product', 'Solvent'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой газ выделяется при фотосинтезе?',
        questionEN: 'Which gas is released during photosynthesis?',
        optionsRU: ['Азот', 'Кислород', 'Углекислый газ', 'Водород'],
        optionsEN: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Hydrogen'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько планет в Солнечной системе имеют кольца?',
        questionEN: 'How many planets in the Solar System have rings?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется самая маленькая кость человека?',
        questionEN: 'What is the smallest human bone called?',
        optionsRU: ['Молоточек', 'Стремя', 'Наковальня', 'Фаланга'],
        optionsEN: ['Malleus', 'Stapes', 'Incus', 'Phalanx'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой учёный предложил теорию эволюции?',
        questionEN: 'Which scientist proposed the theory of evolution?',
        optionsRU: ['Ньютон', 'Эйнштейн', 'Дарвин', 'Галилей'],
        optionsEN: ['Newton', 'Einstein', 'Darwin', 'Galileo'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько миллиметров в сантиметре?',
        questionEN: 'How many millimeters are in a centimeter?',
        optionsRU: ['5', '10', '100', '1000'],
        optionsEN: ['5', '10', '100', '1000'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется самый большой орган тела?',
        questionEN: 'What is the largest organ of the body called?',
        optionsRU: ['Печень', 'Мозг', 'Кожа', 'Сердце'],
        optionsEN: ['Liver', 'Brain', 'Skin', 'Heart'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая змея самая ядовитая?',
        questionEN: 'Which snake is the most venomous?',
        optionsRU: ['Гадюка', 'Кобра', 'Тайпан', 'Удав'],
        optionsEN: ['Viper', 'Cobra', 'Taipan', 'Boa'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько чувств у человека?',
        questionEN: 'How many senses does a human have?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой инструмент используется для наблюдения за звёздами?',
        questionEN: 'What instrument is used to observe stars?',
        optionsRU: ['Микроскоп', 'Телескоп', 'Перископ', 'Стетоскоп'],
        optionsEN: ['Microscope', 'Telescope', 'Periscope', 'Stethoscope'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько рёбер у мужчины и женщины?',
        questionEN: 'How many ribs do men and women have?',
        optionsRU: ['12 и 13', '13 и 12', 'По 12', 'По 10'],
        optionsEN: ['12 and 13', '13 and 12', '12 each', '10 each'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая соль в морской воде?',
        questionEN: 'What salt is in sea water?',
        optionsRU: ['Хлорид калия', 'Хлорид натрия', 'Сульфат магния', 'Карбонат кальция'],
        optionsEN: ['Potassium chloride', 'Sodium chloride', 'Magnesium sulfate', 'Calcium carbonate'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется первый человек в космосе?',
        questionEN: 'What is the name of the first person in space?',
        optionsRU: ['Нил Армстронг', 'Юрий Гагарин', 'Джон Гленн', 'Герман Титов'],
        optionsEN: ['Neil Armstrong', 'Yuri Gagarin', 'John Glenn', 'Gherman Titov'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько стран в мире приблизительно?',
        questionEN: 'Approximately how many countries are in the world?',
        optionsRU: ['Около 100', 'Около 150', 'Около 200', 'Около 250'],
        optionsEN: ['About 100', 'About 150', 'About 200', 'About 250'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой витамин вырабатывается под действием солнца?',
        questionEN: 'Which vitamin is produced under the influence of the sun?',
        optionsRU: ['A', 'B', 'C', 'D'],
        optionsEN: ['A', 'B', 'C', 'D'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Сколько костей в кисти человека?',
        questionEN: 'How many bones are in the human hand?',
        optionsRU: ['22', '27', '32', '37'],
        optionsEN: ['22', '27', '32', '37'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая часть клетки содержит генетический материал?',
        questionEN: 'Which part of the cell contains genetic material?',
        optionsRU: ['Мембрана', 'Цитоплазма', 'Ядро', 'Рибосома'],
        optionsEN: ['Membrane', 'Cytoplasm', 'Nucleus', 'Ribosome'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой химический символ меди?',
        questionEN: 'What is the chemical symbol for copper?',
        optionsRU: ['Cu', 'Co', 'Cr', 'Cd'],
        optionsEN: ['Cu', 'Co', 'Cr', 'Cd'],
        correctIndex: 0,
        points: 10
    },
    {
        questionRU: 'Сколько молекул кислорода переносит гемоглобин?',
        questionEN: 'How many oxygen molecules does hemoglobin carry?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Как называется река, протекающая через Париж?',
        questionEN: 'What is the river flowing through Paris called?',
        optionsRU: ['Темза', 'Рейн', 'Сена', 'Дунай'],
        optionsEN: ['Thames', 'Rhine', 'Seine', 'Danube'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько литров крови фильтруют почки в день?',
        questionEN: 'How many liters of blood do kidneys filter per day?',
        optionsRU: ['50', '100', '150', '200'],
        optionsEN: ['50', '100', '150', '200'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой газ самый лёгкий?',
        questionEN: 'Which gas is the lightest?',
        optionsRU: ['Гелий', 'Водород', 'Азот', 'Кислород'],
        optionsEN: ['Helium', 'Hydrogen', 'Nitrogen', 'Oxygen'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько континентов на Земле по российской классификации?',
        questionEN: 'How many continents are on Earth according to Russian classification?',
        optionsRU: ['5', '6', '7', '8'],
        optionsEN: ['5', '6', '7', '8'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой гормон регулирует уровень сахара в крови?',
        questionEN: 'Which hormone regulates blood sugar levels?',
        optionsRU: ['Адреналин', 'Инсулин', 'Тироксин', 'Эстроген'],
        optionsEN: ['Adrenaline', 'Insulin', 'Thyroxine', 'Estrogen'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько типов тканей у человека?',
        questionEN: 'How many types of tissues does a human have?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какое млекопитающее откладывает яйца?',
        questionEN: 'Which mammal lays eggs?',
        optionsRU: ['Кенгуру', 'Дельфин', 'Утконос', 'Летучая мышь'],
        optionsEN: ['Kangaroo', 'Dolphin', 'Platypus', 'Bat'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько весит мозг взрослого человека примерно?',
        questionEN: 'Approximately how much does an adult human brain weigh?',
        optionsRU: ['0.5 кг', '1.3-1.4 кг', '2 кг', '3 кг'],
        optionsEN: ['0.5 kg', '1.3-1.4 kg', '2 kg', '3 kg'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой закон открыл Архимед в ванной?',
        questionEN: 'Which law did Archimedes discover in the bath?',
        optionsRU: ['Закон тяготения', 'Закон рычага', 'Закон выталкивающей силы', 'Закон отражения'],
        optionsEN: ['Law of gravity', 'Law of the lever', 'Law of buoyancy', 'Law of reflection'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько у Земли естественных спутников?',
        questionEN: 'How many natural satellites does Earth have?',
        optionsRU: ['0', '1', '2', '3'],
        optionsEN: ['0', '1', '2', '3'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая бабочка самая большая?',
        questionEN: 'Which butterfly is the largest?',
        optionsRU: ['Махаон', 'Адмирал', 'Атлас', 'Капустница'],
        optionsEN: ['Swallowtail', 'Admiral', 'Atlas', 'Cabbage white'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько клапанов в сердце человека?',
        questionEN: 'How many valves are in the human heart?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой химический символ калия?',
        questionEN: 'What is the chemical symbol for potassium?',
        optionsRU: ['K', 'Ca', 'P', 'Ko'],
        optionsEN: ['K', 'Ca', 'P', 'Ko'],
        correctIndex: 0,
        points: 10
    },
    {
        questionRU: 'Сколько дней на планете Меркурий длится год?',
        questionEN: 'How many Earth days does a year on Mercury last?',
        optionsRU: ['88', '225', '365', '687'],
        optionsEN: ['88', '225', '365', '687'],
        correctIndex: 0,
        points: 10
    },
    {
        questionRU: 'Какая часть глаза отвечает за его цвет?',
        questionEN: 'Which part of the eye is responsible for its color?',
        optionsRU: ['Зрачок', 'Сетчатка', 'Радужка', 'Роговица'],
        optionsEN: ['Pupil', 'Retina', 'Iris', 'Cornea'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько атомов в молекуле воды?',
        questionEN: 'How many atoms are in a water molecule?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется модель строения атома Резерфорда?',
        questionEN: 'What is Rutherford\'s model of atomic structure called?',
        optionsRU: ['Ядерная', 'Планетарная', 'Квантовая', 'Пудинговая'],
        optionsEN: ['Nuclear', 'Planetary', 'Quantum', 'Pudding'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько у человека групп крови по системе AB0?',
        questionEN: 'How many blood groups do humans have according to the AB0 system?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой элемент Периодической таблицы имеет номер 1?',
        questionEN: 'Which element of the Periodic table has number 1?',
        optionsRU: ['Гелий', 'Водород', 'Литий', 'Кислород'],
        optionsEN: ['Helium', 'Hydrogen', 'Lithium', 'Oxygen'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько ног у бабочки?',
        questionEN: 'How many legs does a butterfly have?',
        optionsRU: ['4', '6', '8', '10'],
        optionsEN: ['4', '6', '8', '10'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая планета имеет Большое Красное Пятно?',
        questionEN: 'Which planet has the Great Red Spot?',
        optionsRU: ['Марс', 'Юпитер', 'Сатурн', 'Нептун'],
        optionsEN: ['Mars', 'Jupiter', 'Saturn', 'Neptune'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько процентов мозга использует человек согласно мифу?',
        questionEN: 'What percentage of the brain does a human use according to the myth?',
        optionsRU: ['5%', '10%', '50%', '100%'],
        optionsEN: ['5%', '10%', '50%', '100%'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Как называется наука о растениях?',
        questionEN: 'What is the science of plants called?',
        optionsRU: ['Зоология', 'Ботаника', 'Микология', 'Энтомология'],
        optionsEN: ['Zoology', 'Botany', 'Mycology', 'Entomology'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько месяцев в году?',
        questionEN: 'How many months are in a year?',
        optionsRU: ['10', '11', '12', '13'],
        optionsEN: ['10', '11', '12', '13'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой прибор измеряет атмосферное давление?',
        questionEN: 'What instrument measures atmospheric pressure?',
        optionsRU: ['Термометр', 'Барометр', 'Гигрометр', 'Анемометр'],
        optionsEN: ['Thermometer', 'Barometer', 'Hygrometer', 'Anemometer'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько крыльев у пчелы?',
        questionEN: 'How many wings does a bee have?',
        optionsRU: ['2', '4', '6', '8'],
        optionsEN: ['2', '4', '6', '8'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая химическая связь в молекуле воды?',
        questionEN: 'What chemical bond is in a water molecule?',
        optionsRU: ['Ионная', 'Ковалентная', 'Металлическая', 'Водородная'],
        optionsEN: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько тонн весит язык синего кита?',
        questionEN: 'How many tons does a blue whale\'s tongue weigh?',
        optionsRU: ['Около 1', 'Около 2', 'Около 3', 'Около 4'],
        optionsEN: ['About 1', 'About 2', 'About 3', 'About 4'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Какой металл самый тугоплавкий?',
        questionEN: 'Which metal has the highest melting point?',
        optionsRU: ['Железо', 'Вольфрам', 'Титан', 'Платина'],
        optionsEN: ['Iron', 'Tungsten', 'Titanium', 'Platinum'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько пар хромосом у человека?',
        questionEN: 'How many pairs of chromosomes do humans have?',
        optionsRU: ['22', '23', '24', '25'],
        optionsEN: ['22', '23', '24', '25'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой океан самый глубокий?',
        questionEN: 'Which ocean is the deepest?',
        optionsRU: ['Атлантический', 'Тихий', 'Индийский', 'Северный Ледовитый'],
        optionsEN: ['Atlantic', 'Pacific', 'Indian', 'Arctic'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько живёт муха-дрозофила?',
        questionEN: 'How long does a fruit fly live?',
        optionsRU: ['1-2 дня', '1-2 недели', '1-2 месяца', '1-2 года'],
        optionsEN: ['1-2 days', '1-2 weeks', '1-2 months', '1-2 years'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется наука о птицах?',
        questionEN: 'What is the science of birds called?',
        optionsRU: ['Ихтиология', 'Орнитология', 'Энтомология', 'Герпетология'],
        optionsEN: ['Ichthyology', 'Ornithology', 'Entomology', 'Herpetology'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько знаков после запятой в числе Пи обычно используют?',
        questionEN: 'How many decimal places of Pi are usually used?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой витамин называется аскорбиновая кислота?',
        questionEN: 'Which vitamin is called ascorbic acid?',
        optionsRU: ['A', 'B', 'C', 'D'],
        optionsEN: ['A', 'B', 'C', 'D'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько мегапикселей в человеческом глазу примерно?',
        questionEN: 'Approximately how many megapixels is the human eye?',
        optionsRU: ['5', '50', '576', '1000'],
        optionsEN: ['5', '50', '576', '1000'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая планета носит имя бога торговли?',
        questionEN: 'Which planet is named after the god of commerce?',
        optionsRU: ['Марс', 'Меркурий', 'Юпитер', 'Сатурн'],
        optionsEN: ['Mars', 'Mercury', 'Jupiter', 'Saturn'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько пальцев у слона на каждой ноге?',
        questionEN: 'How many toes does an elephant have on each foot?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой процесс превращает жидкость в газ?',
        questionEN: 'What process turns liquid into gas?',
        optionsRU: ['Конденсация', 'Испарение', 'Кристаллизация', 'Сублимация'],
        optionsEN: ['Condensation', 'Evaporation', 'Crystallization', 'Sublimation'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько мышц в лице человека?',
        questionEN: 'How many muscles are in the human face?',
        optionsRU: ['23', '33', '43', '53'],
        optionsEN: ['23', '33', '43', '53'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая частота ультразвука выше?',
        questionEN: 'What is the frequency of ultrasound higher than?',
        optionsRU: ['20 Гц', '200 Гц', '2000 Гц', '20000 Гц'],
        optionsEN: ['20 Hz', '200 Hz', '2000 Hz', '20000 Hz'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Сколько спутников у Марса?',
        questionEN: 'How many satellites does Mars have?',
        optionsRU: ['0', '1', '2', '3'],
        optionsEN: ['0', '1', '2', '3'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой тип клеток не имеет ядра?',
        questionEN: 'Which type of cells lack a nucleus?',
        optionsRU: ['Нейроны', 'Эритроциты', 'Гепатоциты', 'Миоциты'],
        optionsEN: ['Neurons', 'Erythrocytes', 'Hepatocytes', 'Myocytes'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько минут длится один тайм в футболе?',
        questionEN: 'How many minutes does one half last in football?',
        optionsRU: ['30', '40', '45', '60'],
        optionsEN: ['30', '40', '45', '60'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какое животное имеет три сердца?',
        questionEN: 'Which animal has three hearts?',
        optionsRU: ['Кит', 'Осьминог', 'Слон', 'Дельфин'],
        optionsEN: ['Whale', 'Octopus', 'Elephant', 'Dolphin'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько химических элементов в Периодической таблице?',
        questionEN: 'How many chemical elements are in the Periodic table?',
        optionsRU: ['108', '118', '128', '138'],
        optionsEN: ['108', '118', '128', '138'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая планета является самой ветреной?',
        questionEN: 'Which planet is the windiest?',
        optionsRU: ['Земля', 'Сатурн', 'Нептун', 'Юпитер'],
        optionsEN: ['Earth', 'Saturn', 'Neptune', 'Jupiter'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько живёт кожа человека до полного обновления?',
        questionEN: 'How long does human skin live before complete renewal?',
        optionsRU: ['7 дней', '27 дней', '47 дней', '67 дней'],
        optionsEN: ['7 days', '27 days', '47 days', '67 days'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой химический символ имеет ртуть?',
        questionEN: 'What is the chemical symbol for mercury?',
        optionsRU: ['Ag', 'Hg', 'Pb', 'Sn'],
        optionsEN: ['Ag', 'Hg', 'Pb', 'Sn'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько дней в феврале в високосный год?',
        questionEN: 'How many days are in February in a leap year?',
        optionsRU: ['27', '28', '29', '30'],
        optionsEN: ['27', '28', '29', '30'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой элемент обозначается символом Na?',
        questionEN: 'Which element is denoted by the symbol Na?',
        optionsRU: ['Калий', 'Кальций', 'Натрий', 'Магний'],
        optionsEN: ['Potassium', 'Calcium', 'Sodium', 'Magnesium'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько камер в сердце у собаки?',
        questionEN: 'How many chambers are in a dog\'s heart?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая змея может проглотить целого оленя?',
        questionEN: 'Which snake can swallow a whole deer?',
        optionsRU: ['Гадюка', 'Анаконда', 'Кобра', 'Питон'],
        optionsEN: ['Viper', 'Anaconda', 'Cobra', 'Python'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько метров в одной морской миле?',
        questionEN: 'How many meters are in one nautical mile?',
        optionsRU: ['1000', '1500', '1852', '2000'],
        optionsEN: ['1000', '1500', '1852', '2000'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Как называется самая быстрая птица?',
        questionEN: 'What is the fastest bird called?',
        optionsRU: ['Орёл', 'Сокол-сапсан', 'Стриж', 'Альбатрос'],
        optionsEN: ['Eagle', 'Peregrine falcon', 'Swift', 'Albatross'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько типов гамет у мужчины?',
        questionEN: 'How many types of gametes does a male have?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой закон Ньютона гласит: "Сила действия равна силе противодействия"?',
        questionEN: 'Which Newton\'s law states: "Action force equals reaction force"?',
        optionsRU: ['Первый', 'Второй', 'Третий', 'Четвёртый'],
        optionsEN: ['First', 'Second', 'Third', 'Fourth'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько ног у ракообразных?',
        questionEN: 'How many legs do crustaceans have?',
        optionsRU: ['6', '8', '10', '12'],
        optionsEN: ['6', '8', '10', '12'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая кислота содержится в желудке?',
        questionEN: 'What acid is contained in the stomach?',
        optionsRU: ['Серная', 'Соляная', 'Азотная', 'Уксусная'],
        optionsEN: ['Sulfuric', 'Hydrochloric', 'Nitric', 'Acetic'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько Земля имеет слоёв атмосферы?',
        questionEN: 'How many layers of atmosphere does Earth have?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой химический элемент назван в честь России?',
        questionEN: 'Which chemical element is named after Russia?',
        optionsRU: ['Родий', 'Рутений', 'Рений', 'Радий'],
        optionsEN: ['Rhodium', 'Ruthenium', 'Rhenium', 'Radium'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько электронов у атома водорода?',
        questionEN: 'How many electrons does a hydrogen atom have?',
        optionsRU: ['0', '1', '2', '3'],
        optionsEN: ['0', '1', '2', '3'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какая рыба может жить в пресной и солёной воде?',
        questionEN: 'Which fish can live in both fresh and salt water?',
        optionsRU: ['Карп', 'Акула', 'Лосось', 'Тунец'],
        optionsEN: ['Carp', 'Shark', 'Salmon', 'Tuna'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько миллионов сперматозоидов выделяется за раз?',
        questionEN: 'How many millions of sperm are released at once?',
        optionsRU: ['100', '200', '300', '400'],
        optionsEN: ['100', '200', '300', '400'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Как называется галактика, в которой находится Земля?',
        questionEN: 'What is the galaxy where Earth is located called?',
        optionsRU: ['Андромеда', 'Млечный Путь', 'Туманность', 'Треугольник'],
        optionsEN: ['Andromeda', 'Milky Way', 'Nebula', 'Triangulum'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько костей в теле новорождённого?',
        questionEN: 'How many bones are in a newborn\'s body?',
        optionsRU: ['200', '250', '300', '350'],
        optionsEN: ['200', '250', '300', '350'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой витамин называют "витамином роста"?',
        questionEN: 'Which vitamin is called the "growth vitamin"?',
        optionsRU: ['A', 'B', 'C', 'D'],
        optionsEN: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        points: 10
    },
    {
        questionRU: 'Сколько атмосфер на Венере?',
        questionEN: 'How many atmospheres are on Venus?',
        optionsRU: ['1', '10', '50', 'Около 90'],
        optionsEN: ['1', '10', '50', 'About 90'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Какой из этих видов не является рыбой?',
        questionEN: 'Which of these species is not a fish?',
        optionsRU: ['Лосось', 'Тунец', 'Кит', 'Акула'],
        optionsEN: ['Salmon', 'Tuna', 'Whale', 'Shark'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Сколько сантиметров в метре?',
        questionEN: 'How many centimeters are in a meter?',
        optionsRU: ['10', '50', '100', '1000'],
        optionsEN: ['10', '50', '100', '1000'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какая планета была открыта с помощью математических расчётов?',
        questionEN: 'Which planet was discovered using mathematical calculations?',
        optionsRU: ['Уран', 'Нептун', 'Плутон', 'Сатурн'],
        optionsEN: ['Uranus', 'Neptune', 'Pluto', 'Saturn'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько процентов от массы тела составляет вода?',
        questionEN: 'What percentage of body mass is water?',
        optionsRU: ['40-50%', '50-60%', '60-70%', '70-80%'],
        optionsEN: ['40-50%', '50-60%', '60-70%', '70-80%'],
        correctIndex: 2,
        points: 10
    },
    {
        questionRU: 'Какой тип крови является универсальным донором?',
        questionEN: 'Which blood type is the universal donor?',
        optionsRU: ['A', 'B', 'AB', 'O(I)'],
        optionsEN: ['A', 'B', 'AB', 'O(I)'],
        correctIndex: 3,
        points: 10
    },
    {
        questionRU: 'Сколько ног у всех насекомых?',
        questionEN: 'How many legs do all insects have?',
        optionsRU: ['4', '6', '8', '10'],
        optionsEN: ['4', '6', '8', '10'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Какой металл добавляют в сталь для нержавейки?',
        questionEN: 'Which metal is added to steel to make it stainless?',
        optionsRU: ['Никель', 'Хром', 'Марганец', 'Титан'],
        optionsEN: ['Nickel', 'Chromium', 'Manganese', 'Titanium'],
        correctIndex: 1,
        points: 10
    },
    {
        questionRU: 'Сколько планет в Солнечной системе видны невооружённым глазом?',
        questionEN: 'How many planets in the Solar System are visible to the naked eye?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 2,
        points: 10
    }
];

// ===== НАУКА | СРЕДНИЕ (200 вопросов) =====
const mediumQuestions = [
    {
        questionRU: 'Какой элемент имеет химический символ Au?',
        questionEN: 'Which element has the chemical symbol Au?',
        optionsRU: ['Серебро', 'Золото', 'Платина', 'Медь'],
        optionsEN: ['Silver', 'Gold', 'Platinum', 'Copper'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'В каком году пала Берлинская стена?',
        questionEN: 'In what year did the Berlin Wall fall?',
        optionsRU: ['1987', '1988', '1989', '1990'],
        optionsEN: ['1987', '1988', '1989', '1990'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что измеряет анемометр?',
        questionEN: 'What does an anemometer measure?',
        optionsRU: ['Давление', 'Влажность', 'Скорость ветра', 'Температуру'],
        optionsEN: ['Pressure', 'Humidity', 'Wind speed', 'Temperature'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой химический элемент является основой органической жизни?',
        questionEN: 'Which chemical element is the basis of organic life?',
        optionsRU: ['Кислород', 'Азот', 'Углерод', 'Водород'],
        optionsEN: ['Oxygen', 'Nitrogen', 'Carbon', 'Hydrogen'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая планета Солнечной системы имеет самый большой спутник?',
        questionEN: 'Which planet in the Solar System has the largest moon?',
        optionsRU: ['Сатурн', 'Юпитер', 'Уран', 'Нептун'],
        optionsEN: ['Saturn', 'Jupiter', 'Uranus', 'Neptune'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько спутников у Юпитера?',
        questionEN: 'How many moons does Jupiter have?',
        optionsRU: ['Более 60', 'Более 70', 'Более 80', 'Более 90'],
        optionsEN: ['Over 60', 'Over 70', 'Over 80', 'Over 90'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое парсек?',
        questionEN: 'What is a parsec?',
        optionsRU: ['Единица времени', 'Единица расстояния', 'Единица массы', 'Единица скорости'],
        optionsEN: ['Unit of time', 'Unit of distance', 'Unit of mass', 'Unit of speed'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой металл является лучшим проводником электричества?',
        questionEN: 'Which metal is the best conductor of electricity?',
        optionsRU: ['Золото', 'Медь', 'Серебро', 'Алюминий'],
        optionsEN: ['Gold', 'Copper', 'Silver', 'Aluminum'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой витамин вырабатывается в коже под действием ультрафиолета?',
        questionEN: 'Which vitamin is produced in the skin under the influence of ultraviolet light?',
        optionsRU: ['A', 'B', 'C', 'D'],
        optionsEN: ['A', 'B', 'C', 'D'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Что изучает мирмекология?',
        questionEN: 'What does myrmecology study?',
        optionsRU: ['Бабочек', 'Муравьёв', 'Пчёл', 'Жуков'],
        optionsEN: ['Butterflies', 'Ants', 'Bees', 'Beetles'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой элемент Периодической таблицы самый плотный?',
        questionEN: 'Which element of the Periodic table is the densest?',
        optionsRU: ['Осмий', 'Иридий', 'Платина', 'Золото'],
        optionsEN: ['Osmium', 'Iridium', 'Platinum', 'Gold'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Сколько сердец у дождевого червя?',
        questionEN: 'How many hearts does an earthworm have?',
        optionsRU: ['1', '3', '5', '8'],
        optionsEN: ['1', '3', '5', '8'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой газ является парниковым?',
        questionEN: 'Which gas is a greenhouse gas?',
        optionsRU: ['Кислород', 'Азот', 'Метан', 'Водород'],
        optionsEN: ['Oxygen', 'Nitrogen', 'Methane', 'Hydrogen'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая температура на поверхности Солнца?',
        questionEN: 'What is the temperature on the surface of the Sun?',
        optionsRU: ['Около 3000 K', 'Около 4000 K', 'Около 5800 K', 'Около 10000 K'],
        optionsEN: ['About 3000 K', 'About 4000 K', 'About 5800 K', 'About 10000 K'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое хромосомный набор человека?',
        questionEN: 'What is the human chromosome set?',
        optionsRU: ['44, XX или XY', '46, XX или XY', '48, XX или XY', '42, XX или XY'],
        optionsEN: ['44, XX or XY', '46, XX or XY', '48, XX or XY', '42, XX or XY'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой учёный сформулировал законы наследования?',
        questionEN: 'Which scientist formulated the laws of inheritance?',
        optionsRU: ['Дарвин', 'Мендель', 'Ламарк', 'Морган'],
        optionsEN: ['Darwin', 'Mendel', 'Lamarck', 'Morgan'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой химический элемент в избытке вызывает базедову болезнь?',
        questionEN: 'Which chemical element in excess causes Graves\' disease?',
        optionsRU: ['Железо', 'Йод', 'Кальций', 'Магний'],
        optionsEN: ['Iron', 'Iodine', 'Calcium', 'Magnesium'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое скорость света в вакууме?',
        questionEN: 'What is the speed of light in a vacuum?',
        optionsRU: ['~300 000 км/с', '~150 000 км/с', '~450 000 км/с', '~600 000 км/с'],
        optionsEN: ['~300,000 km/s', '~150,000 km/s', '~450,000 km/s', '~600,000 km/s'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какая планета была открыта Уильямом Гершелем?',
        questionEN: 'Which planet was discovered by William Herschel?',
        optionsRU: ['Нептун', 'Плутон', 'Уран', 'Сатурн'],
        optionsEN: ['Neptune', 'Pluto', 'Uranus', 'Saturn'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько пар спинномозговых нервов у человека?',
        questionEN: 'How many pairs of spinal nerves do humans have?',
        optionsRU: ['29', '31', '33', '35'],
        optionsEN: ['29', '31', '33', '35'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое сингулярность?',
        questionEN: 'What is a singularity?',
        optionsRU: ['Тип звезды', 'Точка бесконечной плотности', 'Вид галактики', 'Элементарная частица'],
        optionsEN: ['Type of star', 'Point of infinite density', 'Type of galaxy', 'Elementary particle'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой металл самый радиоактивный из природных?',
        questionEN: 'Which metal is the most radioactive naturally occurring?',
        optionsRU: ['Уран', 'Радий', 'Полоний', 'Торий'],
        optionsEN: ['Uranium', 'Radium', 'Polonium', 'Thorium'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая кость не соединяется ни с какой другой?',
        questionEN: 'Which bone does not connect to any other?',
        optionsRU: ['Молоточек', 'Подъязычная', 'Стремя', 'Наковальня'],
        optionsEN: ['Malleus', 'Hyoid', 'Stapes', 'Incus'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько изотопов водорода известно?',
        questionEN: 'How many isotopes of hydrogen are known?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какова единица измерения мощности в СИ?',
        questionEN: 'What is the SI unit of power?',
        optionsRU: ['Джоуль', 'Ватт', 'Ньютон', 'Паскаль'],
        optionsEN: ['Joule', 'Watt', 'Newton', 'Pascal'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое эффект Доплера?',
        questionEN: 'What is the Doppler effect?',
        optionsRU: ['Отклонение света', 'Изменение частоты', 'Преломление', 'Дифракция'],
        optionsEN: ['Deflection of light', 'Change in frequency', 'Refraction', 'Diffraction'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета была девятой до 2006 года?',
        questionEN: 'Which planet was the ninth until 2006?',
        optionsRU: ['Эрида', 'Церера', 'Плутон', 'Макемаке'],
        optionsEN: ['Eris', 'Ceres', 'Pluto', 'Makemake'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько типов зубов у человека?',
        questionEN: 'How many types of teeth do humans have?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Как называется гормон сна?',
        questionEN: 'What is the sleep hormone called?',
        optionsRU: ['Серотонин', 'Дофамин', 'Мелатонин', 'Адреналин'],
        optionsEN: ['Serotonin', 'Dopamine', 'Melatonin', 'Adrenaline'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой учёный открыл пенициллин?',
        questionEN: 'Which scientist discovered penicillin?',
        optionsRU: ['Пастер', 'Флеминг', 'Кох', 'Эрлих'],
        optionsEN: ['Pasteur', 'Fleming', 'Koch', 'Ehrlich'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое pH воды?',
        questionEN: 'What is the pH of water?',
        optionsRU: ['0', '5', '7', '14'],
        optionsEN: ['0', '5', '7', '14'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько литров в кубическом метре?',
        questionEN: 'How many liters are in a cubic meter?',
        optionsRU: ['100', '500', '1000', '10000'],
        optionsEN: ['100', '500', '1000', '10000'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой элемент является основой для алмаза и графита?',
        questionEN: 'Which element is the basis for diamond and graphite?',
        optionsRU: ['Кремний', 'Углерод', 'Бор', 'Азот'],
        optionsEN: ['Silicon', 'Carbon', 'Boron', 'Nitrogen'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая галактика ближайшая к Млечному Пути?',
        questionEN: 'Which galaxy is closest to the Milky Way?',
        optionsRU: ['Треугольник', 'Андромеда', 'Сомбреро', 'Большое Магелланово Облако'],
        optionsEN: ['Triangulum', 'Andromeda', 'Sombrero', 'Large Magellanic Cloud'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько дней на Венере длится год?',
        questionEN: 'How many Earth days does a year on Venus last?',
        optionsRU: ['225', '365', '687', '88'],
        optionsEN: ['225', '365', '687', '88'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какой химический элемент открыт Марией Кюри?',
        questionEN: 'Which chemical element was discovered by Marie Curie?',
        optionsRU: ['Уран', 'Радий', 'Полоний', 'Радий и Полоний'],
        optionsEN: ['Uranium', 'Radium', 'Polonium', 'Radium and Polonium'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Что такое квант?',
        questionEN: 'What is a quantum?',
        optionsRU: ['Частица света', 'Минимальная порция энергии', 'Элементарная частица', 'Тип волны'],
        optionsEN: ['Light particle', 'Minimum portion of energy', 'Elementary particle', 'Type of wave'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой самый большой спутник Сатурна?',
        questionEN: 'What is Saturn\'s largest moon?',
        optionsRU: ['Европа', 'Титан', 'Ганимед', 'Каллисто'],
        optionsEN: ['Europa', 'Titan', 'Ganymede', 'Callisto'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько нейтронов в ядре атома углерода-12?',
        questionEN: 'How many neutrons are in the nucleus of a carbon-12 atom?',
        optionsRU: ['4', '5', '6', '7'],
        optionsEN: ['4', '5', '6', '7'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая частота переменного тока в электросети России?',
        questionEN: 'What is the frequency of alternating current in the Russian power grid?',
        optionsRU: ['50 Гц', '60 Гц', '100 Гц', '120 Гц'],
        optionsEN: ['50 Hz', '60 Hz', '100 Hz', '120 Hz'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Что изучает тектология?',
        questionEN: 'What does tectology study?',
        optionsRU: ['Клетки', 'Ткани', 'Органы', 'Системы'],
        optionsEN: ['Cells', 'Tissues', 'Organs', 'Systems'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой гормон вырабатывается надпочечниками при стрессе?',
        questionEN: 'Which hormone is produced by the adrenal glands during stress?',
        optionsRU: ['Инсулин', 'Адреналин', 'Мелатонин', 'Эстроген'],
        optionsEN: ['Insulin', 'Adrenaline', 'Melatonin', 'Estrogen'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько аминокислот кодируется генетическим кодом?',
        questionEN: 'How many amino acids are encoded by the genetic code?',
        optionsRU: ['18', '20', '22', '24'],
        optionsEN: ['18', '20', '22', '24'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая частица имеет отрицательный заряд?',
        questionEN: 'Which particle has a negative charge?',
        optionsRU: ['Протон', 'Нейтрон', 'Электрон', 'Фотон'],
        optionsEN: ['Proton', 'Neutron', 'Electron', 'Photon'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое постоянная Планка?',
        questionEN: 'What is Planck\'s constant?',
        optionsRU: ['Скорость света', 'Фундаментальная константа в квантовой механике', 'Гравитационная постоянная', 'Число Авогадро'],
        optionsEN: ['Speed of light', 'Fundamental constant in quantum mechanics', 'Gravitational constant', 'Avogadro\'s number'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой металл самый распространённый в земной коре?',
        questionEN: 'Which metal is the most abundant in the Earth\'s crust?',
        optionsRU: ['Железо', 'Алюминий', 'Магний', 'Титан'],
        optionsEN: ['Iron', 'Aluminum', 'Magnesium', 'Titanium'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько дней на Меркурии длятся сутки?',
        questionEN: 'How many Earth days does a day on Mercury last?',
        optionsRU: ['59', '88', '176', '243'],
        optionsEN: ['59', '88', '176', '243'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какая змея способна к термолокации?',
        questionEN: 'Which snake is capable of thermolocation?',
        optionsRU: ['Уж', 'Гадюка', 'Питон', 'Полоз'],
        optionsEN: ['Grass snake', 'Viper', 'Python', 'Racer'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое энтропия?',
        questionEN: 'What is entropy?',
        optionsRU: ['Мера энергии', 'Мера беспорядка', 'Мера скорости', 'Мера массы'],
        optionsEN: ['Measure of energy', 'Measure of disorder', 'Measure of speed', 'Measure of mass'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько граммов в одном моле углерода?',
        questionEN: 'How many grams are in one mole of carbon?',
        optionsRU: ['6', '8', '12', '16'],
        optionsEN: ['6', '8', '12', '16'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой витамин нужен для свёртывания крови?',
        questionEN: 'Which vitamin is needed for blood clotting?',
        optionsRU: ['A', 'B', 'C', 'K'],
        optionsEN: ['A', 'B', 'C', 'K'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Какая часть мозга отвечает за координацию движений?',
        questionEN: 'Which part of the brain is responsible for coordination of movements?',
        optionsRU: ['Мозжечок', 'Таламус', 'Гипоталамус', 'Гиппокамп'],
        optionsEN: ['Cerebellum', 'Thalamus', 'Hypothalamus', 'Hippocampus'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Что такое число Авогадро?',
        questionEN: 'What is Avogadro\'s number?',
        optionsRU: ['6.02 × 10^22', '6.02 × 10^23', '6.02 × 10^24', '6.02 × 10^25'],
        optionsEN: ['6.02 × 10^22', '6.02 × 10^23', '6.02 × 10^24', '6.02 × 10^25'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета имеет ось вращения, почти лежащую на боку?',
        questionEN: 'Which planet has an axis of rotation almost lying on its side?',
        optionsRU: ['Юпитер', 'Сатурн', 'Уран', 'Нептун'],
        optionsEN: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько кубических сантиметров в литре?',
        questionEN: 'How many cubic centimeters are in a liter?',
        optionsRU: ['100', '500', '1000', '10000'],
        optionsEN: ['100', '500', '1000', '10000'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой газ вызывает "веселящий" эффект?',
        questionEN: 'Which gas causes a "laughing" effect?',
        optionsRU: ['Кислород', 'Азот', 'Закись азота', 'Гелий'],
        optionsEN: ['Oxygen', 'Nitrogen', 'Nitrous oxide', 'Helium'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое аллотроп?',
        questionEN: 'What is an allotrope?',
        optionsRU: ['Разная форма одного элемента', 'Смесь металлов', 'Тип химической связи', 'Радиоактивный изотоп'],
        optionsEN: ['Different form of one element', 'Mixture of metals', 'Type of chemical bond', 'Radioactive isotope'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Сколько групп крови у человека по системе резус?',
        questionEN: 'How many blood groups do humans have according to the Rh system?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой металл имеет температуру плавления около 30°C?',
        questionEN: 'Which metal has a melting point of about 30°C?',
        optionsRU: ['Ртуть', 'Галлий', 'Цезий', 'Рубидий'],
        optionsEN: ['Mercury', 'Gallium', 'Cesium', 'Rubidium'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая кость является самой прочной?',
        questionEN: 'Which bone is the strongest?',
        optionsRU: ['Плечевая', 'Бедренная', 'Большеберцовая', 'Лучевая'],
        optionsEN: ['Humerus', 'Femur', 'Tibia', 'Radius'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько молекул в одном моле?',
        questionEN: 'How many molecules are in one mole?',
        optionsRU: ['6.02 × 10^22', '6.02 × 10^23', '6.02 × 10^24', '6.02 × 10^25'],
        optionsEN: ['6.02 × 10^22', '6.02 × 10^23', '6.02 × 10^24', '6.02 × 10^25'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой химический символ олова?',
        questionEN: 'What is the chemical symbol for tin?',
        optionsRU: ['Sn', 'Sb', 'Si', 'Sr'],
        optionsEN: ['Sn', 'Sb', 'Si', 'Sr'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какая рыба имеет электрический орган?',
        questionEN: 'Which fish has an electric organ?',
        optionsRU: ['Акула', 'Скат', 'Угорь', 'Сом'],
        optionsEN: ['Shark', 'Ray', 'Eel', 'Catfish'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое изотопы?',
        questionEN: 'What are isotopes?',
        optionsRU: ['Разные элементы', 'Атомы с разным числом нейтронов', 'Заряженные частицы', 'Молекулы'],
        optionsEN: ['Different elements', 'Atoms with different numbers of neutrons', 'Charged particles', 'Molecules'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько спутников у Сатурна?',
        questionEN: 'How many moons does Saturn have?',
        optionsRU: ['Более 60', 'Более 80', 'Более 100', 'Более 140'],
        optionsEN: ['Over 60', 'Over 80', 'Over 100', 'Over 140'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Какая кислота содержится в яблоках?',
        questionEN: 'Which acid is contained in apples?',
        optionsRU: ['Лимонная', 'Яблочная', 'Щавелевая', 'Винная'],
        optionsEN: ['Citric', 'Malic', 'Oxalic', 'Tartaric'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое катализатор?',
        questionEN: 'What is a catalyst?',
        optionsRU: ['Ускоритель реакции', 'Замедлитель реакции', 'Реагент', 'Продукт'],
        optionsEN: ['Reaction accelerator', 'Reaction inhibitor', 'Reagent', 'Product'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Сколько процентов от солнечной системы составляет масса Солнца?',
        questionEN: 'What percentage of the solar system is the mass of the Sun?',
        optionsRU: ['99.86%', '90%', '80%', '70%'],
        optionsEN: ['99.86%', '90%', '80%', '70%'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какой гормон вырабатывает щитовидная железа?',
        questionEN: 'Which hormone does the thyroid gland produce?',
        optionsRU: ['Инсулин', 'Тироксин', 'Адреналин', 'Кортизол'],
        optionsEN: ['Insulin', 'Thyroxine', 'Adrenaline', 'Cortisol'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что изучает сейсмология?',
        questionEN: 'What does seismology study?',
        optionsRU: ['Вулканы', 'Землетрясения', 'Горы', 'Океаны'],
        optionsEN: ['Volcanoes', 'Earthquakes', 'Mountains', 'Oceans'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько квантовых чисел описывают состояние электрона?',
        questionEN: 'How many quantum numbers describe the state of an electron?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой элемент назван в честь Коперника?',
        questionEN: 'Which element is named after Copernicus?',
        optionsRU: ['Кюрий', 'Коперниций', 'Эйнштейний', 'Фермий'],
        optionsEN: ['Curium', 'Copernicium', 'Einsteinium', 'Fermium'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета имеет самый длинный день?',
        questionEN: 'Which planet has the longest day?',
        optionsRU: ['Меркурий', 'Венера', 'Земля', 'Марс'],
        optionsEN: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое миелиновая оболочка?',
        questionEN: 'What is the myelin sheath?',
        optionsRU: ['Оболочка мышц', 'Изоляция нейронов', 'Кожный покров', 'Костная ткань'],
        optionsEN: ['Muscle sheath', 'Neuron insulation', 'Skin covering', 'Bone tissue'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько градусов в окружности?',
        questionEN: 'How many degrees are in a circle?',
        optionsRU: ['180', '270', '360', '400'],
        optionsEN: ['180', '270', '360', '400'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой металл самый дорогой в мире?',
        questionEN: 'Which metal is the most expensive in the world?',
        optionsRU: ['Золото', 'Платина', 'Родий', 'Калифорний'],
        optionsEN: ['Gold', 'Platinum', 'Rhodium', 'Californium'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Какая планета была предсказана теоретически до открытия?',
        questionEN: 'Which planet was predicted theoretically before discovery?',
        optionsRU: ['Уран', 'Нептун', 'Плутон', 'Меркурий'],
        optionsEN: ['Uranus', 'Neptune', 'Pluto', 'Mercury'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько позвонков в шейном отделе человека?',
        questionEN: 'How many vertebrae are in the human cervical spine?',
        optionsRU: ['5', '6', '7', '8'],
        optionsEN: ['5', '6', '7', '8'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой фермент расщепляет белки в желудке?',
        questionEN: 'Which enzyme breaks down proteins in the stomach?',
        optionsRU: ['Амилаза', 'Липаза', 'Пепсин', 'Лактаза'],
        optionsEN: ['Amylase', 'Lipase', 'Pepsin', 'Lactase'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое точка росы?',
        questionEN: 'What is the dew point?',
        optionsRU: ['Температура замерзания', 'Температура конденсации', 'Температура кипения', 'Температура плавления'],
        optionsEN: ['Freezing temperature', 'Condensation temperature', 'Boiling temperature', 'Melting temperature'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько спутников у Нептуна?',
        questionEN: 'How many moons does Neptune have?',
        optionsRU: ['8', '12', '14', '16'],
        optionsEN: ['8', '12', '14', '16'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой химический символ свинца?',
        questionEN: 'What is the chemical symbol for lead?',
        optionsRU: ['Pb', 'Sn', 'Pt', 'Pd'],
        optionsEN: ['Pb', 'Sn', 'Pt', 'Pd'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какая часть клетки отвечает за производство энергии?',
        questionEN: 'Which part of the cell is responsible for energy production?',
        optionsRU: ['Ядро', 'Рибосома', 'Митохондрия', 'Лизосома'],
        optionsEN: ['Nucleus', 'Ribosome', 'Mitochondria', 'Lysosome'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое осмос?',
        questionEN: 'What is osmosis?',
        optionsRU: ['Движение воздуха', 'Движение воды через мембрану', 'Движение электронов', 'Теплопередача'],
        optionsEN: ['Air movement', 'Water movement through a membrane', 'Electron movement', 'Heat transfer'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько весит литр воды?',
        questionEN: 'How much does a liter of water weigh?',
        optionsRU: ['0.5 кг', '0.8 кг', '1 кг', '1.2 кг'],
        optionsEN: ['0.5 kg', '0.8 kg', '1 kg', '1.2 kg'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой газ является инертным?',
        questionEN: 'Which gas is inert?',
        optionsRU: ['Кислород', 'Азот', 'Гелий', 'Водород'],
        optionsEN: ['Oxygen', 'Nitrogen', 'Helium', 'Hydrogen'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая планета имеет самый большой вулкан в Солнечной системе?',
        questionEN: 'Which planet has the largest volcano in the Solar System?',
        optionsRU: ['Земля', 'Венера', 'Марс', 'Ио'],
        optionsEN: ['Earth', 'Venus', 'Mars', 'Io'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько типов рецепторов вкуса у человека?',
        questionEN: 'How many types of taste receptors do humans have?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое абсолютный ноль?',
        questionEN: 'What is absolute zero?',
        optionsRU: ['0°C', '-100°C', '-273.15°C', '-500°C'],
        optionsEN: ['0°C', '-100°C', '-273.15°C', '-500°C'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой элемент имеет наибольшую электроотрицательность?',
        questionEN: 'Which element has the highest electronegativity?',
        optionsRU: ['Кислород', 'Хлор', 'Фтор', 'Азот'],
        optionsEN: ['Oxygen', 'Chlorine', 'Fluorine', 'Nitrogen'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько костей в ухе человека?',
        questionEN: 'How many bones are in the human ear?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая планета вращается быстрее всех вокруг своей оси?',
        questionEN: 'Which planet rotates fastest on its axis?',
        optionsRU: ['Земля', 'Марс', 'Юпитер', 'Сатурн'],
        optionsEN: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое гистология?',
        questionEN: 'What is histology?',
        optionsRU: ['Наука о клетках', 'Наука о тканях', 'Наука об органах', 'Наука о болезнях'],
        optionsEN: ['Science of cells', 'Science of tissues', 'Science of organs', 'Science of diseases'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько элементов в первом периоде таблицы Менделеева?',
        questionEN: 'How many elements are in the first period of the Periodic table?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой учёный открыл закон всемирного тяготения?',
        questionEN: 'Which scientist discovered the law of universal gravitation?',
        optionsRU: ['Галилей', 'Ньютон', 'Кеплер', 'Эйнштейн'],
        optionsEN: ['Galileo', 'Newton', 'Kepler', 'Einstein'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая температура тела воробья?',
        questionEN: 'What is the body temperature of a sparrow?',
        optionsRU: ['38°C', '40°C', '42°C', '44°C'],
        optionsEN: ['38°C', '40°C', '42°C', '44°C'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое цитоплазма?',
        questionEN: 'What is cytoplasm?',
        optionsRU: ['Ядро клетки', 'Внутренняя среда клетки', 'Мембрана клетки', 'Генетический материал'],
        optionsEN: ['Cell nucleus', 'Internal environment of the cell', 'Cell membrane', 'Genetic material'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько групп в Периодической таблице?',
        questionEN: 'How many groups are in the Periodic table?',
        optionsRU: ['16', '17', '18', '19'],
        optionsEN: ['16', '17', '18', '19'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой химический символ фосфора?',
        questionEN: 'What is the chemical symbol for phosphorus?',
        optionsRU: ['P', 'Pb', 'Pt', 'Po'],
        optionsEN: ['P', 'Pb', 'Pt', 'Po'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какая железа вырабатывает гормон роста?',
        questionEN: 'Which gland produces growth hormone?',
        optionsRU: ['Щитовидная', 'Гипофиз', 'Надпочечники', 'Поджелудочная'],
        optionsEN: ['Thyroid', 'Pituitary', 'Adrenal', 'Pancreas'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько периодов в Периодической таблице?',
        questionEN: 'How many periods are in the Periodic table?',
        optionsRU: ['5', '6', '7', '8'],
        optionsEN: ['5', '6', '7', '8'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое ускорение свободного падения на Земле?',
        questionEN: 'What is the acceleration of free fall on Earth?',
        optionsRU: ['7.8 м/с²', '8.8 м/с²', '9.8 м/с²', '10.8 м/с²'],
        optionsEN: ['7.8 m/s²', '8.8 m/s²', '9.8 m/s²', '10.8 m/s²'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой газ преобладает в атмосфере Марса?',
        questionEN: 'Which gas predominates in the atmosphere of Mars?',
        optionsRU: ['Азот', 'Кислород', 'Углекислый газ', 'Метан'],
        optionsEN: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Methane'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько нуклонов в ядре атома кислорода-16?',
        questionEN: 'How many nucleons are in the nucleus of an oxygen-16 atom?',
        optionsRU: ['8', '12', '16', '24'],
        optionsEN: ['8', '12', '16', '24'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая кость самая маленькая у человека?',
        questionEN: 'Which bone is the smallest in humans?',
        optionsRU: ['Молоточек', 'Стремя', 'Наковальня', 'Фаланга'],
        optionsEN: ['Malleus', 'Stapes', 'Incus', 'Phalanx'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое валентность?',
        questionEN: 'What is valence?',
        optionsRU: ['Масса атома', 'Способность атома к образованию связей', 'Заряд ядра', 'Радиус атома'],
        optionsEN: ['Atomic mass', 'Ability of an atom to form bonds', 'Nuclear charge', 'Atomic radius'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько процентов азота в воздухе?',
        questionEN: 'What percentage of nitrogen is in the air?',
        optionsRU: ['21%', '50%', '78%', '90%'],
        optionsEN: ['21%', '50%', '78%', '90%'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой металл используется в ядерных реакторах как топливо?',
        questionEN: 'Which metal is used in nuclear reactors as fuel?',
        optionsRU: ['Железо', 'Уран', 'Свинец', 'Золото'],
        optionsEN: ['Iron', 'Uranium', 'Lead', 'Gold'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета является "сестрой" Земли?',
        questionEN: 'Which planet is Earth\'s "sister"?',
        optionsRU: ['Марс', 'Венера', 'Меркурий', 'Юпитер'],
        optionsEN: ['Mars', 'Venus', 'Mercury', 'Jupiter'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько отделов головного мозга у человека?',
        questionEN: 'How many parts of the brain do humans have?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое диэлектрик?',
        questionEN: 'What is a dielectric?',
        optionsRU: ['Проводник', 'Изолятор', 'Полупроводник', 'Сверхпроводник'],
        optionsEN: ['Conductor', 'Insulator', 'Semiconductor', 'Superconductor'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой элемент самый лёгкий из металлов?',
        questionEN: 'Which element is the lightest of the metals?',
        optionsRU: ['Литий', 'Натрий', 'Калий', 'Магний'],
        optionsEN: ['Lithium', 'Sodium', 'Potassium', 'Magnesium'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Сколько рёбер у человека?',
        questionEN: 'How many ribs does a human have?',
        optionsRU: ['10 пар', '12 пар', '14 пар', '16 пар'],
        optionsEN: ['10 pairs', '12 pairs', '14 pairs', '16 pairs'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая звезда является Полярной?',
        questionEN: 'Which star is the North Star?',
        optionsRU: ['Сириус', 'Альфа Малой Медведицы', 'Вега', 'Бетельгейзе'],
        optionsEN: ['Sirius', 'Alpha Ursae Minoris', 'Vega', 'Betelgeuse'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое ковалентная связь?',
        questionEN: 'What is a covalent bond?',
        optionsRU: ['Связь ионов', 'Общая пара электронов', 'Металлическая решётка', 'Водородная связь'],
        optionsEN: ['Ionic bond', 'Shared pair of electrons', 'Metal lattice', 'Hydrogen bond'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько электронов на внешнем слое у инертных газов?',
        questionEN: 'How many electrons are in the outer shell of inert gases?',
        optionsRU: ['2 или 8', '4 или 6', '6 или 8', '8 или 18'],
        optionsEN: ['2 or 8', '4 or 6', '6 or 8', '8 or 18'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какой гормон отвечает за мужские половые признаки?',
        questionEN: 'Which hormone is responsible for male sexual characteristics?',
        optionsRU: ['Эстроген', 'Тестостерон', 'Прогестерон', 'Пролактин'],
        optionsEN: ['Estrogen', 'Testosterone', 'Progesterone', 'Prolactin'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета самая удалённая от Солнца?',
        questionEN: 'Which planet is the farthest from the Sun?',
        optionsRU: ['Уран', 'Нептун', 'Плутон', 'Сатурн'],
        optionsEN: ['Uranus', 'Neptune', 'Pluto', 'Saturn'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько мегабайт в гигабайте?',
        questionEN: 'How many megabytes are in a gigabyte?',
        optionsRU: ['100', '512', '1000', '1024'],
        optionsEN: ['100', '512', '1000', '1024'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Какой элемент является жидким неметаллом?',
        questionEN: 'Which element is a liquid non-metal?',
        optionsRU: ['Ртуть', 'Бром', 'Галлий', 'Цезий'],
        optionsEN: ['Mercury', 'Bromine', 'Gallium', 'Cesium'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое фотосинтез?',
        questionEN: 'What is photosynthesis?',
        optionsRU: ['Дыхание растений', 'Процесс образования органики из CO2 и H2O', 'Испарение воды', 'Поглощение кислорода'],
        optionsEN: ['Plant respiration', 'Process of forming organic matter from CO2 and H2O', 'Water evaporation', 'Oxygen absorption'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько процентов кислорода в воздухе?',
        questionEN: 'What percentage of oxygen is in the air?',
        optionsRU: ['11%', '21%', '31%', '41%'],
        optionsEN: ['11%', '21%', '31%', '41%'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой учёный создал периодическую таблицу?',
        questionEN: 'Which scientist created the periodic table?',
        optionsRU: ['Ломоносов', 'Менделеев', 'Дальтон', 'Лавуазье'],
        optionsEN: ['Lomonosov', 'Mendeleev', 'Dalton', 'Lavoisier'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая частица не имеет массы покоя?',
        questionEN: 'Which particle has no rest mass?',
        optionsRU: ['Электрон', 'Протон', 'Нейтрон', 'Фотон'],
        optionsEN: ['Electron', 'Proton', 'Neutron', 'Photon'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Сколько слоёв у кожи человека?',
        questionEN: 'How many layers does human skin have?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой элемент назван в честь Эйнштейна?',
        questionEN: 'Which element is named after Einstein?',
        optionsRU: ['Кюрий', 'Эйнштейний', 'Фермий', 'Борий'],
        optionsEN: ['Curium', 'Einsteinium', 'Fermium', 'Bohrium'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета не имеет атмосферы?',
        questionEN: 'Which planet has no atmosphere?',
        optionsRU: ['Венера', 'Земля', 'Меркурий', 'Марс'],
        optionsEN: ['Venus', 'Earth', 'Mercury', 'Mars'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько весит мозг новорождённого?',
        questionEN: 'How much does a newborn\'s brain weigh?',
        optionsRU: ['200-300 г', '350-400 г', '500-600 г', '700-800 г'],
        optionsEN: ['200-300 g', '350-400 g', '500-600 g', '700-800 g'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое РНК?',
        questionEN: 'What is RNA?',
        optionsRU: ['Дезоксирибонуклеиновая кислота', 'Рибонуклеиновая кислота', 'Аминокислота', 'Белок'],
        optionsEN: ['Deoxyribonucleic acid', 'Ribonucleic acid', 'Amino acid', 'Protein'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько килограммов в тонне?',
        questionEN: 'How many kilograms are in a ton?',
        optionsRU: ['100', '500', '1000', '10000'],
        optionsEN: ['100', '500', '1000', '10000'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой элемент Периодической таблицы самый лёгкий газ?',
        questionEN: 'Which element of the Periodic table is the lightest gas?',
        optionsRU: ['Гелий', 'Водород', 'Азот', 'Кислород'],
        optionsEN: ['Helium', 'Hydrogen', 'Nitrogen', 'Oxygen'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая звезда самая яркая на ночном небе?',
        questionEN: 'Which star is the brightest in the night sky?',
        optionsRU: ['Полярная', 'Сириус', 'Вега', 'Арктур'],
        optionsEN: ['Polaris', 'Sirius', 'Vega', 'Arcturus'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько позвонков в грудном отделе человека?',
        questionEN: 'How many vertebrae are in the human thoracic spine?',
        optionsRU: ['10', '12', '14', '16'],
        optionsEN: ['10', '12', '14', '16'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое метаболизм?',
        questionEN: 'What is metabolism?',
        optionsRU: ['Только распад веществ', 'Обмен веществ', 'Только синтез веществ', 'Дыхание'],
        optionsEN: ['Only breakdown of substances', 'Metabolism', 'Only synthesis of substances', 'Breathing'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой металл самый пластичный?',
        questionEN: 'Which metal is the most malleable?',
        optionsRU: ['Серебро', 'Золото', 'Платина', 'Медь'],
        optionsEN: ['Silver', 'Gold', 'Platinum', 'Copper'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько атомов водорода в молекуле серной кислоты?',
        questionEN: 'How many hydrogen atoms are in a sulfuric acid molecule?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета видна с Земли как "утренняя звезда"?',
        questionEN: 'Which planet is visible from Earth as the "morning star"?',
        optionsRU: ['Марс', 'Венера', 'Юпитер', 'Меркурий'],
        optionsEN: ['Mars', 'Venus', 'Jupiter', 'Mercury'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое эритроциты?',
        questionEN: 'What are erythrocytes?',
        optionsRU: ['Белые кровяные клетки', 'Красные кровяные клетки', 'Тромбоциты', 'Плазма'],
        optionsEN: ['White blood cells', 'Red blood cells', 'Platelets', 'Plasma'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько нейтронов в атоме дейтерия?',
        questionEN: 'How many neutrons are in a deuterium atom?',
        optionsRU: ['0', '1', '2', '3'],
        optionsEN: ['0', '1', '2', '3'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой газ используется в лампах накаливания?',
        questionEN: 'Which gas is used in incandescent light bulbs?',
        optionsRU: ['Кислород', 'Аргон', 'Гелий', 'Неон'],
        optionsEN: ['Oxygen', 'Argon', 'Helium', 'Neon'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая наука изучает бабочек?',
        questionEN: 'Which science studies butterflies?',
        optionsRU: ['Энтомология', 'Лепидоптерология', 'Орнитология', 'Мирмекология'],
        optionsEN: ['Entomology', 'Lepidopterology', 'Ornithology', 'Myrmecology'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько длится беременность у человека?',
        questionEN: 'How long does human pregnancy last?',
        optionsRU: ['Около 7 месяцев', 'Около 8 месяцев', 'Около 9 месяцев', 'Около 10 месяцев'],
        optionsEN: ['About 7 months', 'About 8 months', 'About 9 months', 'About 10 months'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой элемент имеет химический символ W?',
        questionEN: 'Which element has the chemical symbol W?',
        optionsRU: ['Висмут', 'Вольфрам', 'Ванадий', 'Водород'],
        optionsEN: ['Bismuth', 'Tungsten', 'Vanadium', 'Hydrogen'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая галактика столкнётся с Млечным Путём?',
        questionEN: 'Which galaxy will collide with the Milky Way?',
        optionsRU: ['Треугольник', 'Андромеда', 'Сомбреро', 'Водоворот'],
        optionsEN: ['Triangulum', 'Andromeda', 'Sombrero', 'Whirlpool'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько литров воздуха вдыхает человек в минуту в покое?',
        questionEN: 'How many liters of air does a person inhale per minute at rest?',
        optionsRU: ['2-4', '6-8', '10-12', '14-16'],
        optionsEN: ['2-4', '6-8', '10-12', '14-16'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое тургор?',
        questionEN: 'What is turgor?',
        optionsRU: ['Давление в клетках', 'Тип движения', 'Вид ткани', 'Процесс деления'],
        optionsEN: ['Pressure in cells', 'Type of movement', 'Type of tissue', 'Process of division'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Какой учёный первым измерил скорость света?',
        questionEN: 'Which scientist first measured the speed of light?',
        optionsRU: ['Ньютон', 'Рёмер', 'Гюйгенс', 'Майкельсон'],
        optionsEN: ['Newton', 'Rømer', 'Huygens', 'Michelson'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько у человека молочных коренных зубов?',
        questionEN: 'How many milk molars do humans have?',
        optionsRU: ['4', '6', '8', '10'],
        optionsEN: ['4', '6', '8', '10'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой химический элемент входит в состав хлорофилла?',
        questionEN: 'Which chemical element is part of chlorophyll?',
        optionsRU: ['Железо', 'Магний', 'Кальций', 'Цинк'],
        optionsEN: ['Iron', 'Magnesium', 'Calcium', 'Zinc'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета была открыта последней?',
        questionEN: 'Which planet was discovered last?',
        optionsRU: ['Уран', 'Нептун', 'Плутон', 'Земля'],
        optionsEN: ['Uranus', 'Neptune', 'Pluto', 'Earth'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько дней в году на Марсе?',
        questionEN: 'How many Earth days are in a year on Mars?',
        optionsRU: ['365', '500', '687', '800'],
        optionsEN: ['365', '500', '687', '800'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое лейкоциты?',
        questionEN: 'What are leukocytes?',
        optionsRU: ['Красные кровяные клетки', 'Белые кровяные клетки', 'Тромбоциты', 'Плазма'],
        optionsEN: ['Red blood cells', 'White blood cells', 'Platelets', 'Plasma'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько атомов углерода в молекуле этилового спирта?',
        questionEN: 'How many carbon atoms are in an ethyl alcohol molecule?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой металл используется в градусниках?',
        questionEN: 'Which metal is used in thermometers?',
        optionsRU: ['Галлий', 'Ртуть', 'Цезий', 'Свинец'],
        optionsEN: ['Gallium', 'Mercury', 'Cesium', 'Lead'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая часть цветка становится плодом?',
        questionEN: 'Which part of the flower becomes the fruit?',
        optionsRU: ['Лепесток', 'Тычинка', 'Завязь', 'Чашелистик'],
        optionsEN: ['Petal', 'Stamen', 'Ovary', 'Sepal'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько костей в запястье человека?',
        questionEN: 'How many bones are in the human wrist?',
        optionsRU: ['6', '7', '8', '9'],
        optionsEN: ['6', '7', '8', '9'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой элемент самый распространённый в земной коре?',
        questionEN: 'Which element is the most abundant in the Earth\'s crust?',
        optionsRU: ['Кремний', 'Алюминий', 'Кислород', 'Железо'],
        optionsEN: ['Silicon', 'Aluminum', 'Oxygen', 'Iron'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая планета имеет самый короткий год?',
        questionEN: 'Which planet has the shortest year?',
        optionsRU: ['Меркурий', 'Венера', 'Земля', 'Марс'],
        optionsEN: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Сколько хромосом у шимпанзе?',
        questionEN: 'How many chromosomes does a chimpanzee have?',
        optionsRU: ['44', '46', '48', '50'],
        optionsEN: ['44', '46', '48', '50'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое ДНК?',
        questionEN: 'What is DNA?',
        optionsRU: ['Белок', 'Дезоксирибонуклеиновая кислота', 'Рибонуклеиновая кислота', 'Липид'],
        optionsEN: ['Protein', 'Deoxyribonucleic acid', 'Ribonucleic acid', 'Lipid'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько граммов в одном фунте?',
        questionEN: 'How many grams are in one pound?',
        optionsRU: ['Около 250', 'Около 350', 'Около 450', 'Около 550'],
        optionsEN: ['About 250', 'About 350', 'About 450', 'About 550'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой газ выделяется при дыхании?',
        questionEN: 'Which gas is released during respiration?',
        optionsRU: ['Кислород', 'Азот', 'Углекислый газ', 'Водород'],
        optionsEN: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая планета самая холодная в Солнечной системе?',
        questionEN: 'Which planet is the coldest in the Solar System?',
        optionsRU: ['Нептун', 'Уран', 'Сатурн', 'Плутон'],
        optionsEN: ['Neptune', 'Uranus', 'Saturn', 'Pluto'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько у человека групп крови всего с резусом?',
        questionEN: 'How many blood groups do humans have in total including Rh?',
        optionsRU: ['4', '6', '8', '10'],
        optionsEN: ['4', '6', '8', '10'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое грибница?',
        questionEN: 'What is mycelium?',
        optionsRU: ['Плодовое тело', 'Корневая система гриба', 'Споры', 'Кожура'],
        optionsEN: ['Fruiting body', 'Root system of a fungus', 'Spores', 'Skin'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько электронов у атома железа?',
        questionEN: 'How many electrons does an iron atom have?',
        optionsRU: ['24', '26', '28', '30'],
        optionsEN: ['24', '26', '28', '30'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какой металл используют для защиты от радиации?',
        questionEN: 'Which metal is used for radiation protection?',
        optionsRU: ['Железо', 'Алюминий', 'Свинец', 'Медь'],
        optionsEN: ['Iron', 'Aluminum', 'Lead', 'Copper'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая планета имеет атмосферное давление выше земного?',
        questionEN: 'Which planet has atmospheric pressure higher than Earth\'s?',
        optionsRU: ['Марс', 'Венера', 'Меркурий', 'Юпитер'],
        optionsEN: ['Mars', 'Venus', 'Mercury', 'Jupiter'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько типов зубов у взрослого человека?',
        questionEN: 'How many types of teeth does an adult human have?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое рефлекс?',
        questionEN: 'What is a reflex?',
        optionsRU: ['Мысль', 'Автоматическая реакция', 'Гормон', 'Фермент'],
        optionsEN: ['Thought', 'Automatic reaction', 'Hormone', 'Enzyme'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько лет живёт гренландский кит?',
        questionEN: 'How many years does a bowhead whale live?',
        optionsRU: ['Около 50', 'Около 100', 'Около 150', 'Около 200'],
        optionsEN: ['About 50', 'About 100', 'About 150', 'About 200'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Какой химический элемент обозначается символом K?',
        questionEN: 'Which chemical element is denoted by the symbol K?',
        optionsRU: ['Кальций', 'Калий', 'Кобальт', 'Кремний'],
        optionsEN: ['Calcium', 'Potassium', 'Cobalt', 'Silicon'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая частота инфразвука?',
        questionEN: 'What is the frequency of infrasound?',
        optionsRU: ['Выше 20000 Гц', 'Ниже 20 Гц', 'От 20 до 20000 Гц', 'Выше 100000 Гц'],
        optionsEN: ['Above 20000 Hz', 'Below 20 Hz', 'From 20 to 20000 Hz', 'Above 100000 Hz'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько планет в Солнечной системе являются газовыми гигантами?',
        questionEN: 'How many planets in the Solar System are gas giants?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое гемоглобин?',
        questionEN: 'What is hemoglobin?',
        optionsRU: ['Фермент', 'Белок, переносящий кислород', 'Гормон', 'Витамин'],
        optionsEN: ['Enzyme', 'Oxygen-carrying protein', 'Hormone', 'Vitamin'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько нуклонов в ядре урана-238?',
        questionEN: 'How many nucleons are in the nucleus of uranium-238?',
        optionsRU: ['92', '146', '238', '330'],
        optionsEN: ['92', '146', '238', '330'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой океан самый маленький?',
        questionEN: 'Which ocean is the smallest?',
        optionsRU: ['Атлантический', 'Индийский', 'Северный Ледовитый', 'Южный'],
        optionsEN: ['Atlantic', 'Indian', 'Arctic', 'Southern'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какая планета является карликовой?',
        questionEN: 'Which planet is a dwarf planet?',
        optionsRU: ['Меркурий', 'Марс', 'Плутон', 'Нептун'],
        optionsEN: ['Mercury', 'Mars', 'Pluto', 'Neptune'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько молекул АТФ образуется при гликолизе?',
        questionEN: 'How many ATP molecules are formed during glycolysis?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Что такое конденсация?',
        questionEN: 'What is condensation?',
        optionsRU: ['Переход газа в жидкость', 'Переход жидкости в газ', 'Переход твёрдого в газ', 'Переход жидкости в твёрдое'],
        optionsEN: ['Gas to liquid', 'Liquid to gas', 'Solid to gas', 'Liquid to solid'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Сколько процентов мозга реально активно всё время?',
        questionEN: 'What percentage of the brain is actually active all the time?',
        optionsRU: ['10%', '50%', '80%', '100%'],
        optionsEN: ['10%', '50%', '80%', '100%'],
        correctIndex: 3,
        points: 20
    },
    {
        questionRU: 'Какой элемент является основой стекла?',
        questionEN: 'Which element is the basis of glass?',
        optionsRU: ['Углерод', 'Кремний', 'Бор', 'Алюминий'],
        optionsEN: ['Carbon', 'Silicon', 'Boron', 'Aluminum'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета самая яркая на небе после Солнца и Луны?',
        questionEN: 'Which planet is the brightest in the sky after the Sun and Moon?',
        optionsRU: ['Марс', 'Венера', 'Юпитер', 'Сатурн'],
        optionsEN: ['Mars', 'Venus', 'Jupiter', 'Saturn'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько метров в километре?',
        questionEN: 'How many meters are in a kilometer?',
        optionsRU: ['100', '500', '1000', '10000'],
        optionsEN: ['100', '500', '1000', '10000'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое митоз?',
        questionEN: 'What is mitosis?',
        optionsRU: ['Деление клетки надвое', 'Синтез белка', 'Дыхание клетки', 'Гибель клетки'],
        optionsEN: ['Cell division into two', 'Protein synthesis', 'Cell respiration', 'Cell death'],
        correctIndex: 0,
        points: 20
    },
    {
        questionRU: 'Сколько молярная масса воды?',
        questionEN: 'What is the molar mass of water?',
        optionsRU: ['16 г/моль', '18 г/моль', '20 г/моль', '22 г/моль'],
        optionsEN: ['16 g/mol', '18 g/mol', '20 g/mol', '22 g/mol'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая кислота содержится в уксусе?',
        questionEN: 'Which acid is contained in vinegar?',
        optionsRU: ['Серная', 'Соляная', 'Уксусная', 'Лимонная'],
        optionsEN: ['Sulfuric', 'Hydrochloric', 'Acetic', 'Citric'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько земных лет длится год на Юпитере?',
        questionEN: 'How many Earth years does a year on Jupiter last?',
        optionsRU: ['Около 5', 'Около 8', 'Около 12', 'Около 20'],
        optionsEN: ['About 5', 'About 8', 'About 12', 'About 20'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое синапс?',
        questionEN: 'What is a synapse?',
        optionsRU: ['Тип клетки', 'Место контакта нейронов', 'Вид гормона', 'Часть мозга'],
        optionsEN: ['Type of cell', 'Point of contact between neurons', 'Type of hormone', 'Part of the brain'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько нейтронов в тритии?',
        questionEN: 'How many neutrons are in tritium?',
        optionsRU: ['0', '1', '2', '3'],
        optionsEN: ['0', '1', '2', '3'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой химический символ марганца?',
        questionEN: 'What is the chemical symbol for manganese?',
        optionsRU: ['Mg', 'Mn', 'Mo', 'Mt'],
        optionsEN: ['Mg', 'Mn', 'Mo', 'Mt'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета имеет самый большой перепад температур?',
        questionEN: 'Which planet has the largest temperature range?',
        optionsRU: ['Земля', 'Марс', 'Меркурий', 'Венера'],
        optionsEN: ['Earth', 'Mars', 'Mercury', 'Venus'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько калорий в 1 грамме жира?',
        questionEN: 'How many calories are in 1 gram of fat?',
        optionsRU: ['4', '6', '9', '12'],
        optionsEN: ['4', '6', '9', '12'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Что такое плазма крови?',
        questionEN: 'What is blood plasma?',
        optionsRU: ['Красные клетки', 'Белые клетки', 'Жидкая часть крови', 'Тромбоциты'],
        optionsEN: ['Red cells', 'White cells', 'Liquid part of blood', 'Platelets'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Сколько периодов в Периодической системе?',
        questionEN: 'How many periods are in the Periodic system?',
        optionsRU: ['5', '6', '7', '8'],
        optionsEN: ['5', '6', '7', '8'],
        correctIndex: 2,
        points: 20
    },
    {
        questionRU: 'Какой элемент открыл Гемфри Дэви?',
        questionEN: 'Which element did Humphry Davy discover?',
        optionsRU: ['Кислород', 'Натрий', 'Уран', 'Золото'],
        optionsEN: ['Oxygen', 'Sodium', 'Uranium', 'Gold'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Какая планета известна своим пылевыми бурями?',
        questionEN: 'Which planet is known for its dust storms?',
        optionsRU: ['Венера', 'Марс', 'Юпитер', 'Сатурн'],
        optionsEN: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctIndex: 1,
        points: 20
    },
    {
        questionRU: 'Сколько мышц нужно, чтобы улыбнуться?',
        questionEN: 'How many muscles does it take to smile?',
        optionsRU: ['10', '17', '25', '43'],
        optionsEN: ['10', '17', '25', '43'],
        correctIndex: 1,
        points: 20
    }
];

// ===== НАУКА | СЛОЖНЫЕ (200 вопросов) =====
const hardQuestions = [
    {
        questionRU: 'Какой закон физики описывает E = mc²?',
        questionEN: 'Which law of physics describes E = mc²?',
        optionsRU: ['Закон Ньютона', 'Специальная теория относительности', 'Общая теория относительности', 'Квантовая механика'],
        optionsEN: ['Newton\'s Law', 'Special theory of relativity', 'General theory of relativity', 'Quantum mechanics'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая температура на поверхности Солнца в Кельвинах?',
        questionEN: 'What is the temperature on the surface of the Sun in Kelvin?',
        optionsRU: ['3000 K', '4500 K', '5778 K', '10000 K'],
        optionsEN: ['3000 K', '4500 K', '5778 K', '10000 K'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое уравнение Шрёдингера?',
        questionEN: 'What is the Schrödinger equation?',
        optionsRU: ['Уравнение движения планет', 'Волновое уравнение в квантовой механике', 'Уравнение теплообмена', 'Уравнение Эйнштейна'],
        optionsEN: ['Planetary motion equation', 'Wave equation in quantum mechanics', 'Heat transfer equation', 'Einstein equation'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент Периодической таблицы имеет атомный номер 118?',
        questionEN: 'Which element of the Periodic table has atomic number 118?',
        optionsRU: ['Оганесон', 'Теннессин', 'Ливерморий', 'Московий'],
        optionsEN: ['Oganesson', 'Tennessine', 'Livermorium', 'Moscovium'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Сколько кварков в протоне?',
        questionEN: 'How many quarks are in a proton?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое парадокс Ферми?',
        questionEN: 'What is the Fermi paradox?',
        optionsRU: ['Противоречие в термодинамике', 'Отсутствие видимых следов инопланетян', 'Парадокс времени', 'Квантовый парадокс'],
        optionsEN: ['Contradiction in thermodynamics', 'Lack of visible traces of aliens', 'Time paradox', 'Quantum paradox'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой тип ядерной реакции происходит на Солнце?',
        questionEN: 'What type of nuclear reaction occurs on the Sun?',
        optionsRU: ['Деление', 'Синтез', 'Распад', 'Аннигиляция'],
        optionsEN: ['Fission', 'Fusion', 'Decay', 'Annihilation'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая частица является переносчиком сильного взаимодействия?',
        questionEN: 'Which particle is the carrier of the strong interaction?',
        optionsRU: ['Фотон', 'Глюон', 'W-бозон', 'Гравитон'],
        optionsEN: ['Photon', 'Gluon', 'W boson', 'Graviton'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько типов нейтрино известно?',
        questionEN: 'How many types of neutrinos are known?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое энтропия в термодинамике?',
        questionEN: 'What is entropy in thermodynamics?',
        optionsRU: ['Мера энергии', 'Мера неупорядоченности системы', 'Мера температуры', 'Мера давления'],
        optionsEN: ['Measure of energy', 'Measure of system disorder', 'Measure of temperature', 'Measure of pressure'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой закон сохранения нарушается в слабом взаимодействии?',
        questionEN: 'Which conservation law is violated in the weak interaction?',
        optionsRU: ['Закон сохранения энергии', 'Закон сохранения чётности', 'Закон сохранения массы', 'Закон сохранения заряда'],
        optionsEN: ['Conservation of energy', 'Conservation of parity', 'Conservation of mass', 'Conservation of charge'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая планета имеет ретроградное вращение?',
        questionEN: 'Which planet has retrograde rotation?',
        optionsRU: ['Меркурий', 'Венера', 'Земля', 'Марс'],
        optionsEN: ['Mercury', 'Venus', 'Earth', 'Mars'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько аминокислот считаются незаменимыми для человека?',
        questionEN: 'How many amino acids are considered essential for humans?',
        optionsRU: ['6', '8', '9', '12'],
        optionsEN: ['6', '8', '9', '12'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое постоянная тонкой структуры?',
        questionEN: 'What is the fine-structure constant?',
        optionsRU: ['Гравитационная константа', 'Константа электромагнитного взаимодействия', 'Скорость света', 'Число Пи'],
        optionsEN: ['Gravitational constant', 'Electromagnetic interaction constant', 'Speed of light', 'Pi number'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент является сверхпроводником при комнатной температуре?',
        questionEN: 'Which element is a superconductor at room temperature?',
        optionsRU: ['Медь', 'Серебро', 'Пока не открыт', 'Графен'],
        optionsEN: ['Copper', 'Silver', 'Not yet discovered', 'Graphene'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько типов РНК участвует в синтезе белка?',
        questionEN: 'How many types of RNA are involved in protein synthesis?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое горизонт событий чёрной дыры?',
        questionEN: 'What is the event horizon of a black hole?',
        optionsRU: ['Центр дыры', 'Граница невозврата', 'Область сингулярности', 'Аккреционный диск'],
        optionsEN: ['Center of the hole', 'Point of no return', 'Singularity region', 'Accretion disk'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой фермент катализирует репликацию ДНК?',
        questionEN: 'Which enzyme catalyzes DNA replication?',
        optionsRU: ['РНК-полимераза', 'ДНК-полимераза', 'Липаза', 'Амилаза'],
        optionsEN: ['RNA polymerase', 'DNA polymerase', 'Lipase', 'Amylase'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько бозонов Хиггса было обнаружено?',
        questionEN: 'How many Higgs bosons have been detected?',
        optionsRU: ['0', '1', '2', '3'],
        optionsEN: ['0', '1', '2', '3'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая частица имеет спин 2?',
        questionEN: 'Which particle has spin 2?',
        optionsRU: ['Фотон', 'Глюон', 'Гравитон', 'Электрон'],
        optionsEN: ['Photon', 'Gluon', 'Graviton', 'Electron'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое экзопланета в зоне Златовласки?',
        questionEN: 'What is an exoplanet in the Goldilocks zone?',
        optionsRU: ['Очень горячая планета', 'Планета с возможной жидкой водой', 'Холодная планета', 'Газовый гигант'],
        optionsEN: ['Very hot planet', 'Planet with possible liquid water', 'Cold planet', 'Gas giant'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой тип излучения имеет самую высокую частоту?',
        questionEN: 'Which type of radiation has the highest frequency?',
        optionsRU: ['Радиоволны', 'Рентген', 'Гамма-лучи', 'Ультрафиолет'],
        optionsEN: ['Radio waves', 'X-rays', 'Gamma rays', 'Ultraviolet'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько нуклеотидов в кодоне?',
        questionEN: 'How many nucleotides are in a codon?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое квантовая запутанность?',
        questionEN: 'What is quantum entanglement?',
        optionsRU: ['Запутывание частиц', 'Взаимосвязь состояний частиц', 'Разделение частиц', 'Столкновение частиц'],
        optionsEN: ['Tangling of particles', 'Interconnection of particle states', 'Separation of particles', 'Collision of particles'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент Периодической таблицы назван в честь Менделеева?',
        questionEN: 'Which element of the Periodic table is named after Mendeleev?',
        optionsRU: ['Дубний', 'Менделевий', 'Резерфордий', 'Сиборгий'],
        optionsEN: ['Dubnium', 'Mendelevium', 'Rutherfordium', 'Seaborgium'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая температура внутри Солнца?',
        questionEN: 'What is the temperature inside the Sun?',
        optionsRU: ['Около 5 млн K', 'Около 10 млн K', 'Около 15 млн K', 'Около 20 млн K'],
        optionsEN: ['About 5 million K', 'About 10 million K', 'About 15 million K', 'About 20 million K'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько пар оснований в геноме человека?',
        questionEN: 'How many base pairs are in the human genome?',
        optionsRU: ['Около 1 млрд', 'Около 2 млрд', 'Около 3 млрд', 'Около 4 млрд'],
        optionsEN: ['About 1 billion', 'About 2 billion', 'About 3 billion', 'About 4 billion'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое принцип Паули?',
        questionEN: 'What is the Pauli exclusion principle?',
        optionsRU: ['Сохранение энергии', 'Два фермиона не могут быть в одном состоянии', 'Квантование энергии', 'Сохранение импульса'],
        optionsEN: ['Conservation of energy', 'Two fermions cannot be in the same state', 'Energy quantization', 'Conservation of momentum'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой химический символ имеет сурьма?',
        questionEN: 'What is the chemical symbol for antimony?',
        optionsRU: ['Sb', 'Sn', 'Sr', 'Sc'],
        optionsEN: ['Sb', 'Sn', 'Sr', 'Sc'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Какая планета Солнечной системы имеет самую низкую плотность?',
        questionEN: 'Which planet in the Solar System has the lowest density?',
        optionsRU: ['Юпитер', 'Сатурн', 'Уран', 'Нептун'],
        optionsEN: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько вкусов кварков существует?',
        questionEN: 'How many flavors of quarks exist?',
        optionsRU: ['4', '5', '6', '8'],
        optionsEN: ['4', '5', '6', '8'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое рибосома?',
        questionEN: 'What is a ribosome?',
        optionsRU: ['Органелла синтеза белка', 'Энергетическая станция клетки', 'Хранилище ДНК', 'Защитная оболочка'],
        optionsEN: ['Protein synthesis organelle', 'Cell energy station', 'DNA storage', 'Protective shell'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Какой газ является основным компонентом атмосферы Венеры?',
        questionEN: 'Which gas is the main component of Venus\' atmosphere?',
        optionsRU: ['Азот', 'Кислород', 'Углекислый газ', 'Метан'],
        optionsEN: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Methane'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько квантовых состояний у электрона в атоме?',
        questionEN: 'How many quantum states does an electron have in an atom?',
        optionsRU: ['2', '3', '4', 'Бесконечно много'],
        optionsEN: ['2', '3', '4', 'Infinitely many'],
        correctIndex: 3,
        points: 30
    },
    {
        questionRU: 'Что такое красное смещение?',
        questionEN: 'What is redshift?',
        optionsRU: ['Увеличение длины волны света', 'Уменьшение длины волны света', 'Изменение цвета звезды', 'Эффект гравитации'],
        optionsEN: ['Increase in light wavelength', 'Decrease in light wavelength', 'Change in star color', 'Gravitational effect'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Какой элемент самый редкий в земной коре?',
        questionEN: 'Which element is the rarest in the Earth\'s crust?',
        optionsRU: ['Астат', 'Франций', 'Технеций', 'Прометий'],
        optionsEN: ['Astatine', 'Francium', 'Technetium', 'Promethium'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Сколько полюсов у магнитного поля Земли?',
        questionEN: 'How many poles does Earth\'s magnetic field have?',
        optionsRU: ['2', '4', '6', '8'],
        optionsEN: ['2', '4', '6', '8'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Что такое мюон?',
        questionEN: 'What is a muon?',
        optionsRU: ['Тип кварка', 'Лептон', 'Бозон', 'Барион'],
        optionsEN: ['Type of quark', 'Lepton', 'Boson', 'Baryon'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой витамин синтезируется бактериями кишечника?',
        questionEN: 'Which vitamin is synthesized by intestinal bacteria?',
        optionsRU: ['C', 'D', 'K', 'A'],
        optionsEN: ['C', 'D', 'K', 'A'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько лет Вселенной согласно современным данным?',
        questionEN: 'How old is the Universe according to current data?',
        optionsRU: ['10.8 млрд лет', '12.8 млрд лет', '13.8 млрд лет', '15.8 млрд лет'],
        optionsEN: ['10.8 billion years', '12.8 billion years', '13.8 billion years', '15.8 billion years'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой химический элемент имеет наибольшую плотность при нормальных условиях?',
        questionEN: 'Which chemical element has the highest density under normal conditions?',
        optionsRU: ['Осмий', 'Иридий', 'Платина', 'Рений'],
        optionsEN: ['Osmium', 'Iridium', 'Platinum', 'Rhenium'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Что такое эффект Комптона?',
        questionEN: 'What is the Compton effect?',
        optionsRU: ['Рассеяние света на электронах', 'Поглощение света', 'Преломление света', 'Отражение света'],
        optionsEN: ['Scattering of light on electrons', 'Absorption of light', 'Refraction of light', 'Reflection of light'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Какая звезда ближайшая к Солнцу?',
        questionEN: 'Which star is closest to the Sun?',
        optionsRU: ['Сириус', 'Проксима Центавра', 'Альфа Центавра', 'Звезда Барнарда'],
        optionsEN: ['Sirius', 'Proxima Centauri', 'Alpha Centauri', 'Barnard\'s Star'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько аминокислот кодирует один кодон?',
        questionEN: 'How many amino acids does one codon code for?',
        optionsRU: ['0 или 1', '1', '2', '3'],
        optionsEN: ['0 or 1', '1', '2', '3'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое теломеры?',
        questionEN: 'What are telomeres?',
        optionsRU: ['Центры хромосом', 'Концевые участки хромосом', 'Белки', 'Ферменты'],
        optionsEN: ['Chromosome centers', 'End sections of chromosomes', 'Proteins', 'Enzymes'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой закон описывает чёрное тело?',
        questionEN: 'Which law describes a black body?',
        optionsRU: ['Закон Ньютона', 'Закон Планка', 'Закон Ома', 'Закон Гука'],
        optionsEN: ['Newton\'s law', 'Planck\'s law', 'Ohm\'s law', 'Hooke\'s law'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько типов фундаментальных взаимодействий?',
        questionEN: 'How many types of fundamental interactions are there?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая частица является античастицей электрона?',
        questionEN: 'Which particle is the antiparticle of the electron?',
        optionsRU: ['Протон', 'Нейтрон', 'Позитрон', 'Фотон'],
        optionsEN: ['Proton', 'Neutron', 'Positron', 'Photon'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что изучает космология?',
        questionEN: 'What does cosmology study?',
        optionsRU: ['Звёзды', 'Планеты', 'Вселенную в целом', 'Галактики'],
        optionsEN: ['Stars', 'Planets', 'The Universe as a whole', 'Galaxies'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько генов у человека примерно?',
        questionEN: 'Approximately how many genes do humans have?',
        optionsRU: ['10000-15000', '20000-25000', '30000-35000', '40000-45000'],
        optionsEN: ['10000-15000', '20000-25000', '30000-35000', '40000-45000'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент является актиноидом?',
        questionEN: 'Which element is an actinide?',
        optionsRU: ['Железо', 'Уран', 'Свинец', 'Золото'],
        optionsEN: ['Iron', 'Uranium', 'Lead', 'Gold'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая планета имеет магнитное поле, смещённое относительно центра?',
        questionEN: 'Which planet has a magnetic field offset from its center?',
        optionsRU: ['Земля', 'Юпитер', 'Сатурн', 'Уран'],
        optionsEN: ['Earth', 'Jupiter', 'Saturn', 'Uranus'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько времени идёт свет от Солнца до Земли?',
        questionEN: 'How long does it take light to travel from the Sun to Earth?',
        optionsRU: ['Около 4 минут', 'Около 6 минут', 'Около 8 минут', 'Около 10 минут'],
        optionsEN: ['About 4 minutes', 'About 6 minutes', 'About 8 minutes', 'About 10 minutes'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое глюон?',
        questionEN: 'What is a gluon?',
        optionsRU: ['Переносчик гравитации', 'Переносчик сильного взаимодействия', 'Переносчик электромагнетизма', 'Переносчик слабого взаимодействия'],
        optionsEN: ['Carrier of gravity', 'Carrier of strong interaction', 'Carrier of electromagnetism', 'Carrier of weak interaction'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой тип деления клетки приводит к гаметам?',
        questionEN: 'Which type of cell division leads to gametes?',
        optionsRU: ['Митоз', 'Мейоз', 'Амитоз', 'Эндомитоз'],
        optionsEN: ['Mitosis', 'Meiosis', 'Amitosis', 'Endomitosis'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько водородных связей между гуанином и цитозином?',
        questionEN: 'How many hydrogen bonds are between guanine and cytosine?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое чёрная дыра?',
        questionEN: 'What is a black hole?',
        optionsRU: ['Звезда', 'Область пространства-времени', 'Планета', 'Галактика'],
        optionsEN: ['Star', 'Region of space-time', 'Planet', 'Galaxy'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой фермент разрушает клеточную стенку бактерий?',
        questionEN: 'Which enzyme destroys the bacterial cell wall?',
        optionsRU: ['Амилаза', 'Липаза', 'Лизоцим', 'Пепсин'],
        optionsEN: ['Amylase', 'Lipase', 'Lysozyme', 'Pepsin'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько длился первый полёт человека в космос?',
        questionEN: 'How long did the first human spaceflight last?',
        optionsRU: ['68 минут', '88 минут', '108 минут', '128 минут'],
        optionsEN: ['68 minutes', '88 minutes', '108 minutes', '128 minutes'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой элемент является переходным металлом?',
        questionEN: 'Which element is a transition metal?',
        optionsRU: ['Натрий', 'Кальций', 'Железо', 'Алюминий'],
        optionsEN: ['Sodium', 'Calcium', 'Iron', 'Aluminum'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая планета была сначала вычислена, а потом открыта?',
        questionEN: 'Which planet was first calculated and then discovered?',
        optionsRU: ['Уран', 'Нептун', 'Плутон', 'Меркурий'],
        optionsEN: ['Uranus', 'Neptune', 'Pluto', 'Mercury'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько белков в рибосоме бактерий?',
        questionEN: 'How many proteins are in a bacterial ribosome?',
        optionsRU: ['Около 30', 'Около 40', 'Около 50', 'Около 60'],
        optionsEN: ['About 30', 'About 40', 'About 50', 'About 60'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое теория струн?',
        questionEN: 'What is string theory?',
        optionsRU: ['Теория музыки', 'Объединение всех взаимодействий', 'Теория эволюции', 'Теория хаоса'],
        optionsEN: ['Music theory', 'Unification of all interactions', 'Theory of evolution', 'Chaos theory'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой металл имеет самую высокую электропроводность?',
        questionEN: 'Which metal has the highest electrical conductivity?',
        optionsRU: ['Золото', 'Медь', 'Серебро', 'Алюминий'],
        optionsEN: ['Gold', 'Copper', 'Silver', 'Aluminum'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько спутников у Урана?',
        questionEN: 'How many moons does Uranus have?',
        optionsRU: ['17', '22', '27', '32'],
        optionsEN: ['17', '22', '27', '32'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая температура в ядре Земли?',
        questionEN: 'What is the temperature in the Earth\'s core?',
        optionsRU: ['Около 3000°C', 'Около 4000°C', 'Около 5000°C', 'Около 6000°C'],
        optionsEN: ['About 3000°C', 'About 4000°C', 'About 5000°C', 'About 6000°C'],
        correctIndex: 3,
        points: 30
    },
    {
        questionRU: 'Что такое супернова типа Ia?',
        questionEN: 'What is a Type Ia supernova?',
        optionsRU: ['Взрыв массивной звезды', 'Взрыв белого карлика', 'Слияние звёзд', 'Образование чёрной дыры'],
        optionsEN: ['Explosion of a massive star', 'Explosion of a white dwarf', 'Merger of stars', 'Formation of a black hole'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько пар хромосом у мужчины?',
        questionEN: 'How many pairs of chromosomes does a male have?',
        optionsRU: ['22', '23', '24', '46'],
        optionsEN: ['22', '23', '24', '46'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой орган у человека самый энергозатратный?',
        questionEN: 'Which human organ is the most energy-consuming?',
        optionsRU: ['Сердце', 'Печень', 'Мозг', 'Почки'],
        optionsEN: ['Heart', 'Liver', 'Brain', 'Kidneys'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько фотонов излучает Солнце в секунду?',
        questionEN: 'How many photons does the Sun emit per second?',
        optionsRU: ['10^35', '10^40', '10^45', '10^50'],
        optionsEN: ['10^35', '10^40', '10^45', '10^50'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое бозон Хиггса?',
        questionEN: 'What is the Higgs boson?',
        optionsRU: ['Переносчик гравитации', 'Частица, дающая массу', 'Тип кварка', 'Переносчик света'],
        optionsEN: ['Carrier of gravity', 'Particle that gives mass', 'Type of quark', 'Carrier of light'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент имеет электронную конфигурацию [Rn] 5f14 6d10 7p5?',
        questionEN: 'Which element has the electron configuration [Rn] 5f14 6d10 7p5?',
        optionsRU: ['Астат', 'Теннессин', 'Оганесон', 'Радон'],
        optionsEN: ['Astatine', 'Tennessine', 'Oganesson', 'Radon'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько нейронов в мозге человека?',
        questionEN: 'How many neurons are in the human brain?',
        optionsRU: ['Около 10 млрд', 'Около 50 млрд', 'Около 86 млрд', 'Около 100 млрд'],
        optionsEN: ['About 10 billion', 'About 50 billion', 'About 86 billion', 'About 100 billion'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое антиматерия?',
        questionEN: 'What is antimatter?',
        optionsRU: ['Тёмная материя', 'Материя из античастиц', 'Радиоактивная материя', 'Инертная материя'],
        optionsEN: ['Dark matter', 'Matter made of antiparticles', 'Radioactive matter', 'Inert matter'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая кислота является сильнейшей?',
        questionEN: 'Which acid is the strongest?',
        optionsRU: ['Серная', 'Фторсурьмяная', 'Соляная', 'Азотная'],
        optionsEN: ['Sulfuric', 'Fluoroantimonic', 'Hydrochloric', 'Nitric'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько массы теряет Солнце в секунду?',
        questionEN: 'How much mass does the Sun lose per second?',
        optionsRU: ['Около 1 млн тонн', 'Около 4 млн тонн', 'Около 7 млн тонн', 'Около 10 млн тонн'],
        optionsEN: ['About 1 million tons', 'About 4 million tons', 'About 7 million tons', 'About 10 million tons'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое CRISPR?',
        questionEN: 'What is CRISPR?',
        optionsRU: ['Вирус', 'Система редактирования генома', 'Белок', 'Лекарство'],
        optionsEN: ['Virus', 'Genome editing system', 'Protein', 'Medicine'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой химический элемент является самым дорогим?',
        questionEN: 'Which chemical element is the most expensive?',
        optionsRU: ['Золото', 'Платина', 'Калифорний', 'Родий'],
        optionsEN: ['Gold', 'Platinum', 'Californium', 'Rhodium'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько измерений в теории суперструн?',
        questionEN: 'How many dimensions are in superstring theory?',
        optionsRU: ['8', '9', '10', '11'],
        optionsEN: ['8', '9', '10', '11'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая планета была переквалифицирована в карликовую в 2006 году?',
        questionEN: 'Which planet was reclassified as a dwarf planet in 2006?',
        optionsRU: ['Церера', 'Эрида', 'Плутон', 'Макемаке'],
        optionsEN: ['Ceres', 'Eris', 'Pluto', 'Makemake'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое хромосомные аберрации?',
        questionEN: 'What are chromosomal aberrations?',
        optionsRU: ['Нормальные изменения', 'Структурные изменения хромосом', 'Деление клеток', 'Синтез белка'],
        optionsEN: ['Normal changes', 'Structural changes in chromosomes', 'Cell division', 'Protein synthesis'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько квантовых чисел нужно для описания состояния электрона в атоме?',
        questionEN: 'How many quantum numbers are needed to describe the state of an electron in an atom?',
        optionsRU: ['2', '3', '4', '5'],
        optionsEN: ['2', '3', '4', '5'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой тип звёзд является самым распространённым во Вселенной?',
        questionEN: 'Which type of star is the most common in the Universe?',
        optionsRU: ['Голубые гиганты', 'Красные карлики', 'Жёлтые карлики', 'Сверхгиганты'],
        optionsEN: ['Blue giants', 'Red dwarfs', 'Yellow dwarfs', 'Supergiants'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая молекула является носителем наследственной информации?',
        questionEN: 'Which molecule is the carrier of hereditary information?',
        optionsRU: ['РНК', 'ДНК', 'Белок', 'АТФ'],
        optionsEN: ['RNA', 'DNA', 'Protein', 'ATP'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько спутников у Плутона?',
        questionEN: 'How many moons does Pluto have?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое изомеры?',
        questionEN: 'What are isomers?',
        optionsRU: ['Разные элементы', 'Одинаковые формулы, разная структура', 'Изотопы', 'Ионы'],
        optionsEN: ['Different elements', 'Same formula, different structure', 'Isotopes', 'Ions'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой химический символ имеет платина?',
        questionEN: 'What is the chemical symbol for platinum?',
        optionsRU: ['Pt', 'Pl', 'Pm', 'Pb'],
        optionsEN: ['Pt', 'Pl', 'Pm', 'Pb'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Какая температура в центре молнии?',
        questionEN: 'What is the temperature in the center of lightning?',
        optionsRU: ['Около 10000 K', 'Около 20000 K', 'Около 30000 K', 'Около 50000 K'],
        optionsEN: ['About 10000 K', 'About 20000 K', 'About 30000 K', 'About 50000 K'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько экзонов в гене дистрофина?',
        questionEN: 'How many exons are in the dystrophin gene?',
        optionsRU: ['59', '69', '79', '89'],
        optionsEN: ['59', '69', '79', '89'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое тёмная энергия?',
        questionEN: 'What is dark energy?',
        optionsRU: ['Невидимая материя', 'Причина ускоренного расширения Вселенной', 'Энергия чёрных дыр', 'Тепловая энергия'],
        optionsEN: ['Invisible matter', 'Cause of accelerated expansion of the Universe', 'Energy of black holes', 'Thermal energy'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент является самым химически активным металлом?',
        questionEN: 'Which element is the most chemically active metal?',
        optionsRU: ['Цезий', 'Франций', 'Калий', 'Литий'],
        optionsEN: ['Cesium', 'Francium', 'Potassium', 'Lithium'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько длится день на Венере в земных сутках?',
        questionEN: 'How long is a day on Venus in Earth days?',
        optionsRU: ['143', '183', '243', '283'],
        optionsEN: ['143', '183', '243', '283'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое апоптоз?',
        questionEN: 'What is apoptosis?',
        optionsRU: ['Деление клетки', 'Запрограммированная смерть клетки', 'Рост клетки', 'Дифференцировка клетки'],
        optionsEN: ['Cell division', 'Programmed cell death', 'Cell growth', 'Cell differentiation'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько нуклонов в ядре золота-197?',
        questionEN: 'How many nucleons are in the nucleus of gold-197?',
        optionsRU: ['79', '118', '197', '276'],
        optionsEN: ['79', '118', '197', '276'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой закон термодинамики говорит о невозможности вечного двигателя второго рода?',
        questionEN: 'Which law of thermodynamics states the impossibility of a perpetual motion machine of the second kind?',
        optionsRU: ['Нулевой', 'Первый', 'Второй', 'Третий'],
        optionsEN: ['Zeroth', 'First', 'Second', 'Third'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая планета имеет самый большой каньон в Солнечной системе?',
        questionEN: 'Which planet has the largest canyon in the Solar System?',
        optionsRU: ['Земля', 'Венера', 'Марс', 'Меркурий'],
        optionsEN: ['Earth', 'Venus', 'Mars', 'Mercury'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько типов РНК-полимераз у эукариот?',
        questionEN: 'How many types of RNA polymerases do eukaryotes have?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое гистоновый код?',
        questionEN: 'What is the histone code?',
        optionsRU: ['Генетический код', 'Паттерн модификаций гистонов', 'Аминокислотный код', 'Код репликации'],
        optionsEN: ['Genetic code', 'Pattern of histone modifications', 'Amino acid code', 'Replication code'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой изотоп используется в радиоуглеродном датировании?',
        questionEN: 'Which isotope is used in radiocarbon dating?',
        optionsRU: ['C-12', 'C-13', 'C-14', 'C-15'],
        optionsEN: ['C-12', 'C-13', 'C-14', 'C-15'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько километров составляет радиус Шварцшильда Земли?',
        questionEN: 'What is the Schwarzschild radius of Earth in kilometers?',
        optionsRU: ['Около 1 мм', 'Около 9 мм', 'Около 1 см', 'Около 9 см'],
        optionsEN: ['About 1 mm', 'About 9 mm', 'About 1 cm', 'About 9 cm'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая частица является переносчиком электромагнитного взаимодействия?',
        questionEN: 'Which particle is the carrier of electromagnetic interaction?',
        optionsRU: ['Глюон', 'Фотон', 'Бозон Хиггса', 'Гравитон'],
        optionsEN: ['Gluon', 'Photon', 'Higgs boson', 'Graviton'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько процентного содержания тёмной материи во Вселенной?',
        questionEN: 'What percentage of dark matter is in the Universe?',
        optionsRU: ['Около 15%', 'Около 27%', 'Около 50%', 'Около 68%'],
        optionsEN: ['About 15%', 'About 27%', 'About 50%', 'About 68%'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое антитело?',
        questionEN: 'What is an antibody?',
        optionsRU: ['Вирус', 'Белок иммунной системы', 'Гормон', 'Фермент'],
        optionsEN: ['Virus', 'Immune system protein', 'Hormone', 'Enzyme'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой газ светится в рекламных трубках?',
        questionEN: 'Which gas glows in advertising tubes?',
        optionsRU: ['Гелий', 'Аргон', 'Неон', 'Криптон'],
        optionsEN: ['Helium', 'Argon', 'Neon', 'Krypton'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько длится один оборот Галактики Млечный Путь?',
        questionEN: 'How long does one rotation of the Milky Way Galaxy take?',
        optionsRU: ['100 млн лет', '200 млн лет', '250 млн лет', '500 млн лет'],
        optionsEN: ['100 million years', '200 million years', '250 million years', '500 million years'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая кислота содержится в муравьях?',
        questionEN: 'Which acid is contained in ants?',
        optionsRU: ['Уксусная', 'Муравьиная', 'Серная', 'Щавелевая'],
        optionsEN: ['Acetic', 'Formic', 'Sulfuric', 'Oxalic'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое стволовые клетки?',
        questionEN: 'What are stem cells?',
        optionsRU: ['Специализированные клетки', 'Недифференцированные клетки', 'Мёртвые клетки', 'Раковые клетки'],
        optionsEN: ['Specialized cells', 'Undifferentiated cells', 'Dead cells', 'Cancer cells'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько протонов в атоме плутония-239?',
        questionEN: 'How many protons are in a plutonium-239 atom?',
        optionsRU: ['92', '93', '94', '95'],
        optionsEN: ['92', '93', '94', '95'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой закон механики утверждает, что сила равна произведению массы на ускорение?',
        questionEN: 'Which law of mechanics states that force equals mass times acceleration?',
        optionsRU: ['Первый закон Ньютона', 'Второй закон Ньютона', 'Третий закон Ньютона', 'Закон сохранения энергии'],
        optionsEN: ['Newton\'s first law', 'Newton\'s second law', 'Newton\'s third law', 'Law of conservation of energy'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая планета имеет самую разреженную атмосферу?',
        questionEN: 'Which planet has the thinnest atmosphere?',
        optionsRU: ['Венера', 'Земля', 'Марс', 'Меркурий'],
        optionsEN: ['Venus', 'Earth', 'Mars', 'Mercury'],
        correctIndex: 3,
        points: 30
    },
    {
        questionRU: 'Сколько видов аминокислот во всех белках живых организмов?',
        questionEN: 'How many types of amino acids are in all proteins of living organisms?',
        optionsRU: ['16', '18', '20', '22'],
        optionsEN: ['16', '18', '20', '22'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое трансдукция в генетике?',
        questionEN: 'What is transduction in genetics?',
        optionsRU: ['Перенос ДНК вирусом', 'Мутация', 'Деление клетки', 'Синтез белка'],
        optionsEN: ['DNA transfer by virus', 'Mutation', 'Cell division', 'Protein synthesis'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Какой элемент Периодической таблицы открыт последним?',
        questionEN: 'Which element of the Periodic table was discovered last?',
        optionsRU: ['Оганесон', 'Теннессин', 'Нихоний', 'Московий'],
        optionsEN: ['Oganesson', 'Tennessine', 'Nihonium', 'Moscovium'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Сколько энергии выделяет Солнце в секунду?',
        questionEN: 'How much energy does the Sun release per second?',
        optionsRU: ['3.8 × 10^25 Вт', '3.8 × 10^26 Вт', '3.8 × 10^27 Вт', '3.8 × 10^28 Вт'],
        optionsEN: ['3.8 × 10^25 W', '3.8 × 10^26 W', '3.8 × 10^27 W', '3.8 × 10^28 W'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое онкоген?',
        questionEN: 'What is an oncogene?',
        optionsRU: ['Ген, подавляющий опухоль', 'Ген, вызывающий рак', 'Иммунный ген', 'Репарационный ген'],
        optionsEN: ['Tumor suppressor gene', 'Cancer-causing gene', 'Immune gene', 'Repair gene'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой гормон регулирует уровень кальция в крови?',
        questionEN: 'Which hormone regulates blood calcium levels?',
        optionsRU: ['Инсулин', 'Тироксин', 'Паратгормон', 'Адреналин'],
        optionsEN: ['Insulin', 'Thyroxine', 'Parathyroid hormone', 'Adrenaline'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько типов коллагена в теле человека?',
        questionEN: 'How many types of collagen are in the human body?',
        optionsRU: ['Около 10', 'Около 20', 'Около 28', 'Около 50'],
        optionsEN: ['About 10', 'About 20', 'About 28', 'About 50'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая звезда вспыхнет как сверхновая следующей в нашей галактике?',
        questionEN: 'Which star will go supernova next in our galaxy?',
        optionsRU: ['Сириус', 'Бетельгейзе', 'Вега', 'Полярная'],
        optionsEN: ['Sirius', 'Betelgeuse', 'Vega', 'Polaris'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое гликолиз?',
        questionEN: 'What is glycolysis?',
        optionsRU: ['Синтез глюкозы', 'Расщепление глюкозы', 'Синтез гликогена', 'Окисление жиров'],
        optionsEN: ['Glucose synthesis', 'Glucose breakdown', 'Glycogen synthesis', 'Fat oxidation'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько элементов в седьмом периоде таблицы Менделеева?',
        questionEN: 'How many elements are in the seventh period of Mendeleev\'s table?',
        optionsRU: ['30', '31', '32', '33'],
        optionsEN: ['30', '31', '32', '33'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой тип химической связи в металлах?',
        questionEN: 'What type of chemical bond is in metals?',
        optionsRU: ['Ионная', 'Ковалентная', 'Металлическая', 'Водородная'],
        optionsEN: ['Ionic', 'Covalent', 'Metallic', 'Hydrogen'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая планета самая удалённая карликовая планета?',
        questionEN: 'Which planet is the farthest dwarf planet?',
        optionsRU: ['Церера', 'Плутон', 'Эрида', 'Макемаке'],
        optionsEN: ['Ceres', 'Pluto', 'Eris', 'Makemake'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько молекул АТФ даёт цикл Кребса?',
        questionEN: 'How many ATP molecules does the Krebs cycle yield?',
        optionsRU: ['1', '2', '3', '36-38'],
        optionsEN: ['1', '2', '3', '36-38'],
        correctIndex: 3,
        points: 30
    },
    {
        questionRU: 'Что такое эндоцитоз?',
        questionEN: 'What is endocytosis?',
        optionsRU: ['Выход веществ из клетки', 'Захват веществ клеткой', 'Деление клетки', 'Синтез белка'],
        optionsEN: ['Exit of substances from the cell', 'Uptake of substances by the cell', 'Cell division', 'Protein synthesis'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой фермент разрезает ДНК в определённых местах?',
        questionEN: 'Which enzyme cuts DNA at specific sites?',
        optionsRU: ['Липаза', 'Рестриктаза', 'Амилаза', 'Пепсин'],
        optionsEN: ['Lipase', 'Restriction enzyme', 'Amylase', 'Pepsin'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько нейтронов в атоме урана-235?',
        questionEN: 'How many neutrons are in a uranium-235 atom?',
        optionsRU: ['92', '143', '235', '327'],
        optionsEN: ['92', '143', '235', '327'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое ПЦР?',
        questionEN: 'What is PCR?',
        optionsRU: ['Метод разделения белков', 'Метод амплификации ДНК', 'Метод секвенирования', 'Метод окрашивания клеток'],
        optionsEN: ['Protein separation method', 'DNA amplification method', 'Sequencing method', 'Cell staining method'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая кислота является основой ДНК?',
        questionEN: 'Which acid is the basis of DNA?',
        optionsRU: ['Аминокислота', 'Дезоксирибонуклеиновая', 'Рибонуклеиновая', 'Жирная'],
        optionsEN: ['Amino acid', 'Deoxyribonucleic', 'Ribonucleic', 'Fatty'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько спутников у Меркурия?',
        questionEN: 'How many moons does Mercury have?',
        optionsRU: ['0', '1', '2', '3'],
        optionsEN: ['0', '1', '2', '3'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Что такое кварк-глюонная плазма?',
        questionEN: 'What is quark-gluon plasma?',
        optionsRU: ['Обычная материя', 'Сверхплотное состояние материи', 'Газ', 'Жидкость'],
        optionsEN: ['Ordinary matter', 'Superdense state of matter', 'Gas', 'Liquid'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой химический символ имеет ртуть?',
        questionEN: 'What is the chemical symbol for mercury?',
        optionsRU: ['Me', 'Hg', 'Pb', 'Sn'],
        optionsEN: ['Me', 'Hg', 'Pb', 'Sn'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько пар глаз у паука-скакуна?',
        questionEN: 'How many pairs of eyes does a jumping spider have?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое синхротронное излучение?',
        questionEN: 'What is synchrotron radiation?',
        optionsRU: ['Тепловое излучение', 'Излучение ускоренных зарядов', 'Радиоизлучение', 'Инфракрасное излучение'],
        optionsEN: ['Thermal radiation', 'Radiation of accelerated charges', 'Radio emission', 'Infrared radiation'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько длится митотический цикл клетки человека?',
        questionEN: 'How long does the mitotic cycle of a human cell last?',
        optionsRU: ['Около 12 часов', 'Около 24 часов', 'Около 36 часов', 'Около 48 часов'],
        optionsEN: ['About 12 hours', 'About 24 hours', 'About 36 hours', 'About 48 hours'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой изотоп водорода радиоактивен?',
        questionEN: 'Which isotope of hydrogen is radioactive?',
        optionsRU: ['Протий', 'Дейтерий', 'Тритий', 'Все стабильны'],
        optionsEN: ['Protium', 'Deuterium', 'Tritium', 'All stable'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая частота реликтового излучения?',
        questionEN: 'What is the frequency of cosmic microwave background radiation?',
        optionsRU: ['Около 10 ГГц', 'Около 100 ГГц', 'Около 160 ГГц', 'Около 1000 ГГц'],
        optionsEN: ['About 10 GHz', 'About 100 GHz', 'About 160 GHz', 'About 1000 GHz'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое эффект Холла?',
        questionEN: 'What is the Hall effect?',
        optionsRU: ['Возникновение напряжения в проводнике', 'Изменение сопротивления', 'Электромагнитная индукция', 'Термоэлектричество'],
        optionsEN: ['Occurrence of voltage in a conductor', 'Change in resistance', 'Electromagnetic induction', 'Thermoelectricity'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Сколько колец у Сатурна в основных группах?',
        questionEN: 'How many rings does Saturn have in main groups?',
        optionsRU: ['5', '6', '7', '8'],
        optionsEN: ['5', '6', '7', '8'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой витамин является коферментом в реакциях карбоксилирования?',
        questionEN: 'Which vitamin is a coenzyme in carboxylation reactions?',
        optionsRU: ['B1', 'B6', 'B7(Биотин)', 'B12'],
        optionsEN: ['B1', 'B6', 'B7(Biotin)', 'B12'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое хроматин?',
        questionEN: 'What is chromatin?',
        optionsRU: ['Белок', 'ДНК с белками', 'РНК', 'Липид'],
        optionsEN: ['Protein', 'DNA with proteins', 'RNA', 'Lipid'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько нуклонов в самом стабильном изотопе свинца?',
        questionEN: 'How many nucleons are in the most stable isotope of lead?',
        optionsRU: ['206', '207', '208', '209'],
        optionsEN: ['206', '207', '208', '209'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какое соединение является универсальным источником энергии в клетке?',
        questionEN: 'Which compound is the universal energy source in the cell?',
        optionsRU: ['Глюкоза', 'АТФ', 'НАДН', 'ФАД'],
        optionsEN: ['Glucose', 'ATP', 'NADH', 'FAD'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что изучает астрофизика?',
        questionEN: 'What does astrophysics study?',
        optionsRU: ['Только звёзды', 'Физические процессы в космосе', 'Только планеты', 'Химический состав космоса'],
        optionsEN: ['Only stars', 'Physical processes in space', 'Only planets', 'Chemical composition of space'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент назван в честь лаборатории в Дубне?',
        questionEN: 'Which element is named after the laboratory in Dubna?',
        optionsRU: ['Московий', 'Дубний', 'Оганесон', 'Флеровий'],
        optionsEN: ['Moscovium', 'Dubnium', 'Oganesson', 'Flerovium'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько молекул CO2 нужно для синтеза одной глюкозы?',
        questionEN: 'How many CO2 molecules are needed to synthesize one glucose?',
        optionsRU: ['3', '4', '6', '8'],
        optionsEN: ['3', '4', '6', '8'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое ядерный магнитный резонанс?',
        questionEN: 'What is nuclear magnetic resonance?',
        optionsRU: ['Излучение ядер', 'Резонансное поглощение энергии ядрами', 'Распад ядер', 'Синтез ядер'],
        optionsEN: ['Nuclear radiation', 'Resonant absorption of energy by nuclei', 'Nuclear decay', 'Nuclear fusion'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая кислота является "царской водкой"?',
        questionEN: 'Which acid is "aqua regia"?',
        optionsRU: ['Серная', 'Азотная', 'Смесь азотной и соляной', 'Плавиковая'],
        optionsEN: ['Sulfuric', 'Nitric', 'Mixture of nitric and hydrochloric', 'Hydrofluoric'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Сколько генов в геноме E. coli?',
        questionEN: 'How many genes are in the E. coli genome?',
        optionsRU: ['Около 2000', 'Около 4000', 'Около 6000', 'Около 8000'],
        optionsEN: ['About 2000', 'About 4000', 'About 6000', 'About 8000'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое корпускулярно-волновой дуализм?',
        questionEN: 'What is wave-particle duality?',
        optionsRU: ['Два типа частиц', 'Свойство частиц проявлять свойства волн', 'Два типа волн', 'Двойное лучепреломление'],
        optionsEN: ['Two types of particles', 'Property of particles to exhibit wave properties', 'Two types of waves', 'Double refraction'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент имеет атомную массу 238.0289?',
        questionEN: 'Which element has an atomic mass of 238.0289?',
        optionsRU: ['Плутоний', 'Уран', 'Нептуний', 'Торий'],
        optionsEN: ['Plutonium', 'Uranium', 'Neptunium', 'Thorium'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько времени живёт нейтрон вне ядра?',
        questionEN: 'How long does a neutron live outside the nucleus?',
        optionsRU: ['Около 10 минут', 'Около 15 минут', 'Около 20 минут', 'Около 30 минут'],
        optionsEN: ['About 10 minutes', 'About 15 minutes', 'About 20 minutes', 'About 30 minutes'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое теломераза?',
        questionEN: 'What is telomerase?',
        optionsRU: ['Фермент укорачивания теломер', 'Фермент удлинения теломер', 'Гормон', 'Белок-репрессор'],
        optionsEN: ['Telomere shortening enzyme', 'Telomere lengthening enzyme', 'Hormone', 'Repressor protein'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько изотопов у водорода?',
        questionEN: 'How many isotopes does hydrogen have?',
        optionsRU: ['1', '2', '3', '7'],
        optionsEN: ['1', '2', '3', '7'],
        correctIndex: 3,
        points: 30
    },
    {
        questionRU: 'Какая планета имеет самую эксцентричную орбиту?',
        questionEN: 'Which planet has the most eccentric orbit?',
        optionsRU: ['Меркурий', 'Марс', 'Плутон', 'Венера'],
        optionsEN: ['Mercury', 'Mars', 'Pluto', 'Venus'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Что такое эпигенетика?',
        questionEN: 'What is epigenetics?',
        optionsRU: ['Наука о генах', 'Изменение экспрессии генов без изменения ДНК', 'Наука о белках', 'Наука о наследственности'],
        optionsEN: ['Science of genes', 'Change in gene expression without DNA change', 'Science of proteins', 'Science of heredity'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько молекул АТФ даёт одна молекула глюкозы при полном окислении?',
        questionEN: 'How many ATP molecules does one glucose molecule yield upon complete oxidation?',
        optionsRU: ['30', '32', '36-38', '40'],
        optionsEN: ['30', '32', '36-38', '40'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой элемент является лантаноидом?',
        questionEN: 'Which element is a lanthanide?',
        optionsRU: ['Железо', 'Уран', 'Неодим', 'Плутоний'],
        optionsEN: ['Iron', 'Uranium', 'Neodymium', 'Plutonium'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое геоид?',
        questionEN: 'What is a geoid?',
        optionsRU: ['Форма планеты', 'Модель гравитационного поля Земли', 'Тип рельефа', 'Географическая карта'],
        optionsEN: ['Planet shape', 'Model of Earth\'s gravitational field', 'Type of relief', 'Geographic map'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько времени длится полный цикл прецессии Земли?',
        questionEN: 'How long does a full cycle of Earth\'s precession last?',
        optionsRU: ['Около 13000 лет', 'Около 26000 лет', 'Около 41000 лет', 'Около 100000 лет'],
        optionsEN: ['About 13000 years', 'About 26000 years', 'About 41000 years', 'About 100000 years'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какая элементарная частица имеет самый большой период полураспада?',
        questionEN: 'Which elementary particle has the longest half-life?',
        optionsRU: ['Мюон', 'Нейтрон', 'Протон', 'Электрон'],
        optionsEN: ['Muon', 'Neutron', 'Proton', 'Electron'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое интрон?',
        questionEN: 'What is an intron?',
        optionsRU: ['Кодирующая область гена', 'Некодирующая область гена', 'Белок', 'Фермент'],
        optionsEN: ['Coding region of a gene', 'Non-coding region of a gene', 'Protein', 'Enzyme'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько планет открыто за пределами Солнечной системы?',
        questionEN: 'How many planets have been discovered outside the Solar System?',
        optionsRU: ['Около 1000', 'Около 3000', 'Около 5000', 'Более 5500'],
        optionsEN: ['About 1000', 'About 3000', 'About 5000', 'More than 5500'],
        correctIndex: 3,
        points: 30
    },
    {
        questionRU: 'Какой металл имеет температуру плавления 3422°C?',
        questionEN: 'Which metal has a melting point of 3422°C?',
        optionsRU: ['Титан', 'Вольфрам', 'Рений', 'Осмий'],
        optionsEN: ['Titanium', 'Tungsten', 'Rhenium', 'Osmium'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое гравитационная линза?',
        questionEN: 'What is a gravitational lens?',
        optionsRU: ['Оптическая линза', 'Искривление света гравитацией', 'Тип телескопа', 'Вид галактики'],
        optionsEN: ['Optical lens', 'Bending of light by gravity', 'Type of telescope', 'Type of galaxy'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько колец у Урана?',
        questionEN: 'How many rings does Uranus have?',
        optionsRU: ['9', '11', '13', '15'],
        optionsEN: ['9', '11', '13', '15'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое митохондриальная Ева?',
        questionEN: 'What is Mitochondrial Eve?',
        optionsRU: ['Ископаемое', 'Общий предок по материнской линии', 'Вид обезьян', 'Ген'],
        optionsEN: ['Fossil', 'Common maternal ancestor', 'Type of ape', 'Gene'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой элемент является самым лёгким инертным газом?',
        questionEN: 'Which element is the lightest inert gas?',
        optionsRU: ['Неон', 'Гелий', 'Аргон', 'Криптон'],
        optionsEN: ['Neon', 'Helium', 'Argon', 'Krypton'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько времени живёт клетка кишечного эпителия?',
        questionEN: 'How long does an intestinal epithelial cell live?',
        optionsRU: ['1-2 дня', '3-5 дней', '7-10 дней', '30 дней'],
        optionsEN: ['1-2 days', '3-5 days', '7-10 days', '30 days'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое калиево-натриевый насос?',
        questionEN: 'What is the sodium-potassium pump?',
        optionsRU: ['Белковый канал', 'Активный транспорт ионов', 'Пассивный транспорт', 'Рецептор'],
        optionsEN: ['Protein channel', 'Active ion transport', 'Passive transport', 'Receptor'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Какой химический элемент назван в честь Польши?',
        questionEN: 'Which chemical element is named after Poland?',
        optionsRU: ['Полоний', 'Рутений', 'Германий', 'Галлий'],
        optionsEN: ['Polonium', 'Ruthenium', 'Germanium', 'Gallium'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Сколько световых лет до ближайшей галактики?',
        questionEN: 'How many light-years to the nearest galaxy?',
        optionsRU: ['Около 10000', 'Около 50000', 'Около 2.5 млн', 'Около 10 млн'],
        optionsEN: ['About 10000', 'About 50000', 'About 2.5 million', 'About 10 million'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое эффект Казимира?',
        questionEN: 'What is the Casimir effect?',
        optionsRU: ['Притяжение пластин в вакууме', 'Отталкивание зарядов', 'Гравитационное взаимодействие', 'Магнитный эффект'],
        optionsEN: ['Attraction of plates in a vacuum', 'Repulsion of charges', 'Gravitational interaction', 'Magnetic effect'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Сколько процентного содержания тёмной энергии во Вселенной?',
        questionEN: 'What percentage of dark energy is in the Universe?',
        optionsRU: ['Около 50%', 'Около 60%', 'Около 68%', 'Около 80%'],
        optionsEN: ['About 50%', 'About 60%', 'About 68%', 'About 80%'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой орган регенерирует быстрее всего?',
        questionEN: 'Which organ regenerates the fastest?',
        optionsRU: ['Кожа', 'Печень', 'Кишечник', 'Кровь'],
        optionsEN: ['Skin', 'Liver', 'Intestine', 'Blood'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое фуллерен?',
        questionEN: 'What is a fullerene?',
        optionsRU: ['Тип белка', 'Молекула углерода в форме сферы', 'Вид пластика', 'Газ'],
        optionsEN: ['Type of protein', 'Carbon molecule in sphere shape', 'Type of plastic', 'Gas'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько пальцев у летучей мыши на крыле?',
        questionEN: 'How many fingers does a bat have on its wing?',
        optionsRU: ['3', '4', '5', '6'],
        optionsEN: ['3', '4', '5', '6'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая звезда в созвездии Ориона является красным сверхгигантом?',
        questionEN: 'Which star in the Orion constellation is a red supergiant?',
        optionsRU: ['Ригель', 'Бетельгейзе', 'Беллатрикс', 'Минтака'],
        optionsEN: ['Rigel', 'Betelgeuse', 'Bellatrix', 'Mintaka'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое обратная транскриптаза?',
        questionEN: 'What is reverse transcriptase?',
        optionsRU: ['Фермент синтеза ДНК на РНК', 'Фермент синтеза РНК на ДНК', 'Фермент синтеза белка', 'Фермент репарации'],
        optionsEN: ['Enzyme for DNA synthesis on RNA', 'Enzyme for RNA synthesis on DNA', 'Protein synthesis enzyme', 'Repair enzyme'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Сколько групп крови у собак?',
        questionEN: 'How many blood groups do dogs have?',
        optionsRU: ['4', '8', '13', '20'],
        optionsEN: ['4', '8', '13', '20'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой газ вызывает парниковый эффект больше всего?',
        questionEN: 'Which gas causes the greenhouse effect the most?',
        optionsRU: ['CO2', 'Метан', 'Водяной пар', 'Озон'],
        optionsEN: ['CO2', 'Methane', 'Water vapor', 'Ozone'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое нуклеосинтез?',
        questionEN: 'What is nucleosynthesis?',
        optionsRU: ['Синтез нуклеотидов', 'Образование ядер элементов', 'Синтез белка', 'Деление ядра'],
        optionsEN: ['Nucleotide synthesis', 'Formation of element nuclei', 'Protein synthesis', 'Nuclear fission'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько длится год на Нептуне в земных годах?',
        questionEN: 'How long is a year on Neptune in Earth years?',
        optionsRU: ['Около 84', 'Около 120', 'Около 165', 'Около 248'],
        optionsEN: ['About 84', 'About 120', 'About 165', 'About 248'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая кость в теле человека ломается чаще всего?',
        questionEN: 'Which bone in the human body breaks most often?',
        optionsRU: ['Бедренная', 'Ключица', 'Лучевая', 'Ребро'],
        optionsEN: ['Femur', 'Clavicle', 'Radius', 'Rib'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое изотопный эффект?',
        questionEN: 'What is the isotope effect?',
        optionsRU: ['Различие в свойствах изотопов', 'Радиоактивный распад', 'Синтез изотопов', 'Деление изотопов'],
        optionsEN: ['Difference in isotope properties', 'Radioactive decay', 'Isotope synthesis', 'Isotope fission'],
        correctIndex: 0,
        points: 30
    },
    {
        questionRU: 'Сколько молекул РНК в рибосоме бактерий?',
        questionEN: 'How many RNA molecules are in a bacterial ribosome?',
        optionsRU: ['1', '2', '3', '4'],
        optionsEN: ['1', '2', '3', '4'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой элемент является самым тяжёлым из стабильных?',
        questionEN: 'Which element is the heaviest stable element?',
        optionsRU: ['Уран', 'Свинец', 'Висмут', 'Торий'],
        optionsEN: ['Uranium', 'Lead', 'Bismuth', 'Thorium'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая кислота отвечает за ощущение жжения от крапивы?',
        questionEN: 'Which acid is responsible for the burning sensation from nettles?',
        optionsRU: ['Уксусная', 'Муравьиная', 'Щавелевая', 'Молочная'],
        optionsEN: ['Acetic', 'Formic', 'Oxalic', 'Lactic'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое аллель?',
        questionEN: 'What is an allele?',
        optionsRU: ['Вид гена', 'Вариант гена', 'Хромосома', 'Мутация'],
        optionsEN: ['Type of gene', 'Variant of a gene', 'Chromosome', 'Mutation'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько электронов на внешнем уровне у атома серы?',
        questionEN: 'How many electrons are in the outer level of a sulfur atom?',
        optionsRU: ['4', '5', '6', '7'],
        optionsEN: ['4', '5', '6', '7'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какая частота гамма-излучения?',
        questionEN: 'What is the frequency of gamma radiation?',
        optionsRU: ['10^15 Гц', '10^18 Гц', '10^19 Гц и выше', '10^12 Гц'],
        optionsEN: ['10^15 Hz', '10^18 Hz', '10^19 Hz and above', '10^12 Hz'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Что такое вирион?',
        questionEN: 'What is a virion?',
        optionsRU: ['Бактерия', 'Вирусная частица вне клетки', 'Клетка', 'Белок'],
        optionsEN: ['Bacterium', 'Virus particle outside a cell', 'Cell', 'Protein'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько астрономических единиц до Плутона в среднем?',
        questionEN: 'How many astronomical units to Pluto on average?',
        optionsRU: ['Около 10', 'Около 20', 'Около 30', 'Около 40'],
        optionsEN: ['About 10', 'About 20', 'About 30', 'About 40'],
        correctIndex: 3,
        points: 30
    },
    {
        questionRU: 'Какой фермент катализирует образование пептидной связи?',
        questionEN: 'Which enzyme catalyzes peptide bond formation?',
        optionsRU: ['Пепсин', 'Пептидилтрансфераза', 'Трипсин', 'Липаза'],
        optionsEN: ['Pepsin', 'Peptidyl transferase', 'Trypsin', 'Lipase'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое рекомбинация ДНК?',
        questionEN: 'What is DNA recombination?',
        optionsRU: ['Синтез ДНК', 'Обмен участками ДНК', 'Репарация ДНК', 'Разрушение ДНК'],
        optionsEN: ['DNA synthesis', 'Exchange of DNA segments', 'DNA repair', 'DNA destruction'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Сколько пар хромосом у голубя?',
        questionEN: 'How many pairs of chromosomes does a pigeon have?',
        optionsRU: ['20', '30', '40', '80'],
        optionsEN: ['20', '30', '40', '80'],
        correctIndex: 2,
        points: 30
    },
    {
        questionRU: 'Какой элемент является основой полупроводников?',
        questionEN: 'Which element is the basis of semiconductors?',
        optionsRU: ['Германий', 'Кремний', 'Мышьяк', 'Галлий'],
        optionsEN: ['Germanium', 'Silicon', 'Arsenic', 'Gallium'],
        correctIndex: 1,
        points: 30
    },
    {
        questionRU: 'Что такое КТП (квантовая теория поля)?',
        questionEN: 'What is QFT (Quantum Field Theory)?',
        optionsRU: ['Теория классических полей', 'Объединение квантовой механики и СТО', 'Теория гравитации', 'Теория струн'],
        optionsEN: ['Classical field theory', 'Unification of quantum mechanics and special relativity', 'Theory of gravity', 'String theory'],
        correctIndex: 1,
        points: 30
    }
];

// Экспорт
export default { easy: easyQuestions, medium: mediumQuestions, hard: hardQuestions };