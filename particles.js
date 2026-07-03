/* ========== ЕЖЕДНЕВНЫЕ НАГРАДЫ ========== */

/* Попап ежедневной награды */
.daily-popup {
    max-width: 500px;
    margin: 20px auto;
    padding: 28px 24px;
    text-align: center;
    border: 1px solid var(--gold);
    box-shadow: 0 0 30px var(--gold-glow);
}

.daily-popup-header h3 {
    font-weight: 700;
    margin-bottom: 6px;
}

.daily-popup-header p {
    font-size: 0.9rem;
    margin: 0;
}

/* Полоска с днями */
.daily-streak-row {
    display: flex;
    gap: 8px;
    margin-top: 20px;
    justify-content: center;
    flex-wrap: wrap;
}

.daily-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 10px;
    border-radius: var(--radius-md);
    background: var(--bg-card);
    border: 1px solid var(--border);
    min-width: 55px;
    transition: all var(--transition);
    position: relative;
}

/* Уже полученные дни */
.daily-day.claimed {
    border-color: var(--success);
    background: rgba(46, 213, 115, 0.08);
    opacity: 0.7;
}

.daily-day.claimed::after {
    content: '✓';
    position: absolute;
    top: -6px;
    right: -6px;
    background: var(--success);
    color: #fff;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 0.65rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
}

/* Текущий день (можно забрать) */
.daily-day.current {
    border-color: var(--gold);
    background: rgba(255, 215, 0, 0.1);
    box-shadow: 0 0 20px var(--gold-glow);
    animation: pulseGold 2s infinite;
    transform: scale(1.08);
}

@keyframes pulseGold {
    0%, 100% { box-shadow: 0 0 15px var(--gold-glow); }
    50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.5); }
}

.daily-day-icon {
    font-size: 1.4rem;
}

.daily-day-num {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
}

.daily-day-coins {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--gold);
}

/* Анимация получения награды */
@keyframes claimReward {
    0% { transform: scale(1); }
    30% { transform: scale(1.2); }
    50% { transform: scale(0.95); }
    70% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.claim-animation {
    animation: claimReward 0.6s ease;
}

/* Мобильная адаптация */
@media (max-width: 480px) {
    .daily-popup {
        padding: 20px 14px;
        margin: 12px;
    }
    
    .daily-streak-row {
        gap: 6px;
    }
    
    .daily-day {
        padding: 10px 8px;
        min-width: 42px;
    }
    
    .daily-day-icon {
        font-size: 1.1rem;
    }
    
    .daily-day-num {
        font-size: 0.65rem;
    }
    
    .daily-day-coins {
        font-size: 0.7rem;
    }
}