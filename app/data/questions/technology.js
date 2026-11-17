const technologyQuestions = {
    easy: [
        {
            questionRU: 'Как называется операционная система от Apple для компьютеров?',
            questionEN: 'What is Apple\'s operating system for computers called?',
            optionsRU: ['Windows', 'macOS', 'Linux', 'Android'],
            optionsEN: ['Windows', 'macOS', 'Linux', 'Android'],
            correctIndex: 1,
            points: 10
        },
        {
            questionRU: 'Что означает аббревиатура "URL"?',
            questionEN: 'What does "URL" stand for?',
            optionsRU: ['Uniform Resource Locator', 'United Road Link', 'User Request Line', 'Unique Reading List'],
            optionsEN: ['Uniform Resource Locator', 'United Road Link', 'User Request Line', 'Unique Reading List'],
            correctIndex: 0,
            points: 10
        },
        {
            "questionRU": "Что означает сокращение Wi-Fi в бытовом употреблении?",
            "questionEN": "What is Wi-Fi used for in everyday life?",
            "optionsRU": [
                "Беспроводное подключение к сети",
                "Печать на бумаге",
                "Зарядка батареи",
                "Охлаждение процессора"
            ],
            "optionsEN": [
                "Wireless network connection",
                "Printing on paper",
                "Charging a battery",
                "Cooling a processor"
            ],
            "correctIndex": 0,
            "explanationRU": "Wi-Fi позволяет устройствам подключаться к локальной сети по радиоканалу.",
            "explanationEN": "Wi-Fi lets devices connect to a local network over radio waves.",
            "points": 10
        },
        {
            "questionRU": "Какой компонент компьютера часто называют его процессором?",
            "questionEN": "Which computer component is commonly called the processor?",
            "optionsRU": [
                "SSD",
                "CPU",
                "RAM",
                "GPU"
            ],
            "optionsEN": [
                "SSD",
                "CPU",
                "RAM",
                "GPU"
            ],
            "correctIndex": 1,
            "explanationRU": "CPU исполняет инструкции программ и управляет вычислениями.",
            "explanationEN": "The CPU executes program instructions and performs computations.",
            "points": 10
        },
        {
            "questionRU": "Какая технология часто используется для бесконтактной оплаты телефоном?",
            "questionEN": "Which technology is commonly used for contactless phone payments?",
            "optionsRU": [
                "NFC",
                "HDMI",
                "VGA",
                "GPS"
            ],
            "optionsEN": [
                "NFC",
                "HDMI",
                "VGA",
                "GPS"
            ],
            "correctIndex": 0,
            "explanationRU": "NFC обеспечивает обмен данными на очень небольшом расстоянии.",
            "explanationEN": "NFC enables data exchange over very short distances.",
            "points": 10
        }
    ],
    medium: [
        {
            questionRU: 'В каком году был основан Google?',
            questionEN: 'What year was Google founded?',
            optionsRU: ['1996', '1998', '2000', '2002'],
            optionsEN: ['1996', '1998', '2000', '2002'],
            correctIndex: 1,
            points: 20
        },
        {
            questionRU: 'Что такое "облачные вычисления"?',
            questionEN: 'What is "cloud computing"?',
            optionsRU: ['Работа на метеостанции', 'Хранение и обработка данных через интернет', 'Создание искусственного интеллекта', 'Разработка игр'],
            optionsEN: ['Working at a weather station', 'Storing and processing data via the internet', 'Creating artificial intelligence', 'Game development'],
            correctIndex: 1,
            points: 20
        },
        {
            "questionRU": "Для чего обычно применяется система контроля версий Git?",
            "questionEN": "What is Git primarily used for?",
            "optionsRU": [
                "Монтаж видео",
                "Отслеживание изменений в файлах",
                "Очистка оперативной памяти",
                "Сжатие изображений"
            ],
            "optionsEN": [
                "Video editing",
                "Tracking changes to files",
                "Clearing RAM",
                "Compressing images"
            ],
            "correctIndex": 1,
            "explanationRU": "Git хранит историю изменений и помогает нескольким разработчикам работать вместе.",
            "explanationEN": "Git tracks changes and helps developers collaborate.",
            "points": 20
        },
        {
            "questionRU": "Какую задачу выполняет DNS в интернете?",
            "questionEN": "What does DNS do on the internet?",
            "optionsRU": [
                "Шифрует все файлы",
                "Преобразует доменные имена в адреса",
                "Увеличивает скорость процессора",
                "Создаёт резервную копию"
            ],
            "optionsEN": [
                "Encrypts all files",
                "Resolves domain names to addresses",
                "Overclocks the CPU",
                "Creates backups"
            ],
            "correctIndex": 1,
            "explanationRU": "DNS помогает находить IP-адреса серверов по удобным доменным именам.",
            "explanationEN": "DNS helps find server IP addresses from human-readable domain names.",
            "points": 20
        },
        {
            "questionRU": "Что означает HTTPS по сравнению с HTTP?",
            "questionEN": "What does HTTPS add to HTTP?",
            "optionsRU": [
                "Графический интерфейс",
                "Защищённое соединение с TLS",
                "Больше пикселей",
                "Отсутствие серверов"
            ],
            "optionsEN": [
                "Graphical interface",
                "Connection protection using TLS",
                "More pixels",
                "No servers"
            ],
            "correctIndex": 1,
            "explanationRU": "HTTPS использует TLS, чтобы защищать данные в пути между браузером и сервером.",
            "explanationEN": "HTTPS uses TLS to protect data traveling between browser and server.",
            "points": 20
        }
    ],
    hard: [
        {
            questionRU: 'Какой язык программирования является самым старым из ныне используемых?',
            questionEN: 'Which programming language is the oldest still in use?',
            optionsRU: ['C', 'Fortran', 'COBOL', 'Lisp'],
            optionsEN: ['C', 'Fortran', 'COBOL', 'Lisp'],
            correctIndex: 1,
            points: 30
        },
        {
            "questionRU": "Какую проблему решает алгоритм Дейкстры?",
            "questionEN": "What problem does Dijkstra's algorithm solve?",
            "optionsRU": [
                "Сортировку текста",
                "Кратчайшие пути в графе с неотрицательными весами",
                "Сжатие видео",
                "Шифрование сообщений"
            ],
            "optionsEN": [
                "Sorting text",
                "Shortest paths in a graph with nonnegative weights",
                "Video compression",
                "Message encryption"
            ],
            "correctIndex": 1,
            "explanationRU": "Алгоритм Дейкстры находит кратчайшие расстояния от выбранной вершины при неотрицательных весах рёбер.",
            "explanationEN": "Dijkstra's algorithm finds shortest distances from a source when edge weights are nonnegative.",
            "points": 30
        },
        {
            "questionRU": "Какое свойство транзакций БД означает «всё или ничего»?",
            "questionEN": "Which database transaction property means all-or-nothing?",
            "optionsRU": [
                "Изоляция",
                "Атомарность",
                "Долговечность",
                "Согласованность"
            ],
            "optionsEN": [
                "Isolation",
                "Atomicity",
                "Durability",
                "Consistency"
            ],
            "correctIndex": 1,
            "explanationRU": "Атомарность гарантирует, что транзакция либо применяется полностью, либо откатывается.",
            "explanationEN": "Atomicity means a transaction either completes fully or has no effect.",
            "points": 30
        },
        {
            "questionRU": "Какой протокол обеспечивает установление надёжного соединения с подтверждением доставки в интернете?",
            "questionEN": "Which protocol provides reliable, acknowledged delivery over an internet connection?",
            "optionsRU": [
                "UDP",
                "TCP",
                "ICMP",
                "ARP"
            ],
            "optionsEN": [
                "UDP",
                "TCP",
                "ICMP",
                "ARP"
            ],
            "correctIndex": 1,
            "explanationRU": "TCP использует номера последовательности и подтверждения для надёжной доставки потока байтов.",
            "explanationEN": "TCP uses sequence numbers and acknowledgments for reliable byte-stream delivery.",
            "points": 30
        }
    ]
};

export default technologyQuestions;