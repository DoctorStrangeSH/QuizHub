<div align="center">
  <img src="assets/favicon.svg" alt="QuizHub Logo" width="80" height="80">
  
  # 🧠 QuizHub
  
  **Платформа для квизов с real-time рейтингом**
  
  [![GitHub Pages](https://img.shields.io/badge/Демо-GitHub%20Pages-FF6B9D?style=for-the-badge&logo=github)](https://doctorstrangesh.github.io/QuizHub/)
  [![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/ru/docs/Web/JavaScript)
</div>

---


## 📋 О проекте

**QuizHub** — это SPA-приложение, разработанное для демонстрации навыков full-stack разработки. Пользователи могут проходить квизы на двух языках, соревноваться в real-time таблице лидеров и отслеживать свой прогресс.

### 🎯 Бизнес-задачи, которые решает проект
- **Удержание пользователей** — геймификация через систему очков и рейтингов
- **Вовлечение** — соревновательный элемент (таблица лидеров)
- **Монетизация** — архитектура готова к добавлению платных категорий вопросов
- **Аналитика** — Firestore позволяет анализировать результаты пользователей

---

## 🛠 Технический стек

<table>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black">
      <img src="https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat-square&logo=bootstrap">
      <img src="https://img.shields.io/badge/CSS-Animations-1572B6?style=flat-square&logo=css3">
    </td>
  </tr>
  <tr>
    <td><strong>Backend</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase">
      <img src="https://img.shields.io/badge/Firestore-NoSQL-FFCA28?style=flat-square&logo=firebase">
    </td>
  </tr>
  <tr>
    <td><strong>API</strong></td>
    <td>
      <img src="https://img.shields.io/badge/Open_Trivia_DB-REST-00C853?style=flat-square">
    </td>
  </tr>
  <tr>
    <td><strong>Деплой</strong></td>
    <td>
      <img src="https://img.shields.io/badge/GitHub-Pages-222222?style=flat-square&logo=github">
    </td>
  </tr>
</table>

---

## ✨ Ключевые фичи

| Фича | Описание | Технология |
|------|----------|------------|
| 🔐 **Google Auth** | Вход через Google-аккаунт с сохранением профиля | Firebase Auth |
| 🌍 **Два языка** | Русский (локальная база) и английский (Open Trivia DB) | Fetch API + JSON |
| ⏱ **Таймер** | 15 секунд на вопрос, визуальное предупреждение при <5 сек | setInterval + CSS Animations |
| 🎯 **Система очков** | Бонус за скорость × множитель сложности | Алгоритм в Vanilla JS |
| 🏆 **Real-time лидеры** | Топ-3 с медалями + полная таблица (20 игроков) | Firestore onSnapshot |
| 🎉 **Конфетти** | Анимация при 70+ очках | Canvas-free CSS Animations |
| 📱 **Адаптив** | От 320px до 4K | Bootstrap Grid + Media Queries |
| 🔴 **Офлайн-режим** | Русские вопросы работают без интернета | Локальная база (52 вопроса) |

---

text

### 🧩 Принципы проектирования
- **SPA-архитектура** — все экраны в одном HTML, переключение через `display: none/block`
- **Разделение ответственности** — UI, логика квиза, API вынесены в отдельные модули
- **Event-driven** — клики, таймеры, IntersectionObserver
- **Graceful degradation** — при недоступности API используется локальная база вопросов

---

## 🔧 Быстрый старт

### Предварительные требования
- Любой современный браузер
- Live Server (VS Code) или Python 3.x

### Локальный запуск (2 минуты)

```bash
# 1. Клонируй репозиторий
git clone https://doctorstrangesh.github.io/QuizHub/
cd quizhub

# 2. Замени конфиг Firebase
# Открой js/firebase-config.js и вставь свои ключи

# 3. Запусти сервер
# Вариант A: VS Code + Live Server
# ПКМ на index.html → Open with Live Server

# Вариант B: Python
python -m http.server 8000
# Открой http://localhost:8000