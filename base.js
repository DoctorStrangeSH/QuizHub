/* ========== LAYOUT ========== */
.dashboard-layout {
    display: flex;
    min-height: 100vh;
    position: relative;
    z-index: 2;
}

/* ========== SIDEBAR ========== */
.dashboard-sidebar {
    width: 260px;
    height: 100vh;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    border-right: 1px solid var(--border);
    border-radius: 0;
    transition: transform 0.3s ease;
    overflow-y: auto;
}

.sidebar-header {
    text-align: center;
    margin-bottom: 32px;
    flex-shrink: 0;
}

.sidebar-logo {
    font-size: 2.5rem;
    margin-bottom: 8px;
}

.sidebar-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}

.sidebar-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition);
    flex-shrink: 0;
}

.sidebar-link:hover {
    background: var(--bg-card);
    color: var(--text-primary);
}

.sidebar-link.active {
    background: rgba(124, 92, 252, 0.1);
    color: var(--accent);
}

.sidebar-link.disabled {
    opacity: 0.4;
    pointer-events: none;
    cursor: not-allowed;
}

.sidebar-link-icon {
    font-size: 1.2rem;
}

.sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
}

.sidebar-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 10px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.85rem;
    text-align: left;
    transition: all var(--transition);
}

.sidebar-btn:hover {
    background: var(--bg-card);
    color: var(--text-primary);
}

/* ========== MAIN ========== */
.dashboard-main {
    flex: 1;
    margin-left: 260px;
    padding: 24px;
    display: flex;
    justify-content: center;
    min-height: 100vh;
    overflow-y: auto;
}

.dashboard-content-wrapper {
    width: 100%;
    max-width: 700px;
}

/* ========== MOBILE HEADER ========== */
.mobile-header {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    margin-bottom: 20px;
    position: sticky;
    top: 12px;
    z-index: 50;
}

.burger-btn {
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px 8px;
}

/* ========== WELCOME ========== */
.welcome-section {
    padding: 24px 28px;
    margin-bottom: 24px;
    border: 1px solid var(--border-glow);
    background: linear-gradient(135deg, var(--bg-glass), rgba(124, 92, 252, 0.04));
}

.welcome-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
}

.welcome-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 4px;
}

.welcome-subtitle {
    color: var(--text-secondary);
    margin: 0;
    font-size: 0.9rem;
}

.welcome-stats {
    display: flex;
    gap: 20px;
}

.mini-stat {
    text-align: center;
}

.mini-stat-value {
    font-weight: 700;
    font-size: 1.1rem;
}

.mini-stat-label {
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-transform: uppercase;
}

/* ========== GAME SECTION ========== */
.game-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 40px;
}

.section-heading {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
}

/* ========== SELECTOR ROW ========== */
.selector-row {
    padding: 16px 20px;
}

.selector-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
    margin-bottom: 10px;
}

.selector-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.selector-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 10px 18px;
    border-radius: 50px;
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all var(--transition);
}

.selector-btn:hover {
    border-color: var(--accent);
    color: var(--text-primary);
}

.selector-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    box-shadow: 0 4px 15px var(--accent-glow);
}

.selector-btn.disabled {
    opacity: 0.35;
    pointer-events: none;
}

/* ========== CATEGORY TRIGGER ========== */
.category-display {
    position: relative;
}

.category-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 14px 20px;
    border-radius: var(--radius-sm);
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all var(--transition);
}

.category-trigger:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124, 92, 252, 0.1);
}

.category-arrow {
    font-size: 0.8rem;
    opacity: 0.5;
}

/* ========== PLAY BUTTON ========== */
.play-btn {
    background: linear-gradient(135deg, var(--accent), #a855f7, #6366f1);
    color: #fff;
    border: none;
    padding: 20px;
    font-size: 1.3rem;
    font-weight: 800;
    border-radius: var(--radius-lg);
    cursor: pointer;
    letter-spacing: 1px;
    box-shadow: 0 8px 30px var(--accent-glow);
    transition: all var(--transition);
    animation: glowPulse 2s infinite;
    width: 100%;
}

.play-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(124, 92, 252, 0.6);
}

.play-btn:active {
    transform: scale(0.97);
}

@keyframes glowPulse {
    0%, 100% { box-shadow: 0 8px 30px var(--accent-glow); }
    50% { box-shadow: 0 12px 45px rgba(124, 92, 252, 0.6); }
}

/* ========== QUICK STATS ========== */
.quick-stats {
    margin-top: 8px;
}

.stat-mini-card {
    padding: 16px 12px;
    transition: all var(--transition);
}

.stat-mini-card:hover {
    transform: translateY(-2px);
    border-color: var(--border-glow);
}

.stat-mini-value {
    font-size: 1.5rem;
    font-weight: 700;
    display: block;
    margin-bottom: 2px;
}

.stat-mini-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* ========== CATEGORY MODAL ========== */
.category-modal {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: all 0.3s ease;
}

.category-modal.open {
    opacity: 1;
    visibility: visible;
    pointer-events: all;
}

.category-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
}

.category-modal-content {
    position: relative;
    width: 90%;
    max-width: 480px;
    max-height: 70vh;
    padding: 24px;
    overflow-y: auto;
    animation: modalIn 0.3s ease;
}

@keyframes modalIn {
    from { transform: scale(0.9) translateY(20px); opacity: 0; }
    to { transform: scale(1) translateY(0); opacity: 1; }
}

.category-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    position: sticky;
    top: 0;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    padding-bottom: 12px;
    z-index: 1;
}

.category-modal-header h3 {
    margin: 0;
    font-weight: 700;
}

.modal-close-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-primary);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1rem;
    transition: all var(--transition);
    flex-shrink: 0;
}

.modal-close-btn:hover {
    background: var(--danger);
    border-color: var(--danger);
    color: #fff;
}

.category-modal-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.sidebar-cat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition);
    border: 1px solid transparent;
}

.sidebar-cat-item:hover {
    background: var(--bg-card);
    border-color: var(--border);
}

.sidebar-cat-item.active {
    background: rgba(124, 92, 252, 0.1);
    border-color: var(--accent);
}

.sidebar-cat-icon {
    font-size: 1.3rem;
}

.sidebar-cat-name {
    font-weight: 500;
    flex: 1;
}

.sidebar-cat-check {
    color: var(--accent);
    font-weight: 700;
    opacity: 0;
}

.sidebar-cat-item.active .sidebar-cat-check {
    opacity: 1;
}

/* ========== OVERLAY ========== */
.sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 90;
}

/* ========== БЕЙДЖИ ========== */
.level-badge {
    background: var(--accent-glow);
    color: var(--accent);
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.78rem;
    font-weight: 600;
    border: 1px solid var(--border-glow);
}

.coins-badge {
    background: var(--gold-glow);
    color: #fbbf24;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.78rem;
    font-weight: 600;
    border: 1px solid rgba(255, 215, 0, 0.2);
}

.text-gold {
    background: linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* ========== АДАПТИВ ========== */
@media (max-width: 1024px) {
    .dashboard-sidebar {
        transform: translateX(-100%);
    }
    
    .dashboard-sidebar.open {
        transform: translateX(0);
    }
    
    .sidebar-overlay.open {
        display: block;
    }
    
    .dashboard-main {
        margin-left: 0;
        padding: 12px;
        justify-content: center;
        overflow-y: visible;
    }
    
    .mobile-header {
        display: flex;
    }
}

@media (max-width: 480px) {
    .dashboard-main {
        padding: 8px;
        overflow-y: visible;
    }
    
    .dashboard-content-wrapper {
        padding-bottom: 20px;
    }
    
    .welcome-section {
        padding: 16px;
    }
    
    .welcome-title {
        font-size: 1.1rem;
    }
    
    .selector-row {
        padding: 12px 14px;
    }
    
    .selector-btn {
        padding: 8px 14px;
        font-size: 0.8rem;
    }
    
    .play-btn {
        padding: 16px;
        font-size: 1.1rem;
    }
}