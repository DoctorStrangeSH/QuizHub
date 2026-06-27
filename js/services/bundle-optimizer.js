// ============================================
// QuizHub — Оптимизатор загрузки скриптов
// ============================================

// ========== ДИНАМИЧЕСКАЯ ЗАГРУЗКА СКРИПТОВ ==========

const loadedScripts = new Set();
const scriptLoadQueue = [];

function loadScript(src, priority = 'normal') {
  if (loadedScripts.has(src)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    if (priority === 'low') {
      script.defer = true;
    }
    
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    
    script.onerror = () => {
      console.error(`Ошибка загрузки: ${src}`);
      reject(new Error(`Failed to load: ${src}`));
    };
    
    document.body.appendChild(script);
  });
}

// ========== ЛЕНИВАЯ ЗАГРУЗКА НЕКРИТИЧЕСКИХ МОДУЛЕЙ ==========

const lazyModules = {
  charts: {
    src: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    check: () => typeof Chart !== 'undefined',
    loadOnScreens: ['stats']
  },
  voice: {
    src: 'js/voice.js',
    check: () => typeof addVoiceButton !== 'undefined',
    loadOnScreens: ['quiz']
  },
  duel: {
    src: 'js/duel.js',
    check: () => typeof createDuelRoom !== 'undefined',
    loadOnScreens: []
  },
  ai: {
    src: 'js/ai.js',
    check: () => typeof startAIDuel !== 'undefined',
    loadOnScreens: []
  },
  tournaments: {
    src: 'js/tournaments.js',
    check: () => typeof showTournamentScreen !== 'undefined',
    loadOnScreens: ['tournament']
  },
  teams: {
    src: 'js/teams.js',
    check: () => typeof showTeamScreen !== 'undefined',
    loadOnScreens: ['team']
  },
  swipe: {
    src: 'js/swipe.js',
    check: () => typeof initSwipeGestures !== 'undefined',
    loadOnScreens: ['quiz']
  }
};

function preloadModule(moduleName) {
  const module = lazyModules[moduleName];
  if (!module || module.check()) return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = module.src;
  link.as = 'script';
  document.head.appendChild(link);
}

function loadModule(moduleName) {
  const module = lazyModules[moduleName];
  if (!module || module.check()) return Promise.resolve();
  
  return loadScript(module.src);
}

function loadModulesForScreen(screenName) {
  const promises = [];
  
  Object.entries(lazyModules).forEach(([name, module]) => {
    if (module.loadOnScreens.includes(screenName) && !module.check()) {
      promises.push(loadScript(module.src));
    }
  });
  
  return Promise.all(promises);
}

// ========== ПРЕДЗАГРУЗКА МОДУЛЕЙ ==========

function preloadNextLikelyModules() {
  // Предзагружаем модули, которые скорее всего понадобятся
  preloadModule('voice');
  preloadModule('swipe');
}

// ========== МИНИФИКАЦИЯ CSS НА ЛЕТУ (для dev) ==========

function optimizeStylesheets() {
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    // Добавляем media="print" для некритических стилей
    if (link.href.includes('themes.css')) {
      link.media = 'all';
    }
  });
}

// ========== ОПТИМИЗАЦИЯ ШРИФТОВ ==========

function optimizeFonts() {
  // Проверяем, загружены ли шрифты
  if (document.fonts) {
    document.fonts.ready.then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });
  }
}

// ========== ПЕРЕХВАТ ИЗМЕНЕНИЙ SCREEN ДЛЯ ЛЕНИВОЙ ЗАГРУЗКИ ==========

const originalShowScreen = typeof showScreen === 'function' ? showScreen : null;

if (originalShowScreen) {
  showScreen = async function(screenName) {
    // Загружаем модули для этого экрана
    await loadModulesForScreen(screenName);
    
    // Вызываем оригинальную функцию
    originalShowScreen(screenName);
    
    // Предзагружаем модули для вероятных следующих экранов
    preloadNextLikelyModules();
  };
}

// ========== КРИТИЧЕСКИЙ CSS (inline) ==========

function injectCriticalCSS() {
  const criticalCSS = `
    body{margin:0;font-family:'Inter',sans-serif;background:#0F0E17;color:#fff}
    .app-container{min-height:100vh;display:flex;flex-direction:column}
    .app-header{background:rgba(15,14,23,0.8);backdrop-filter:blur(20px);z-index:10}
    .app-main{flex-grow:1;display:flex;align-items:center;padding:40px 0}
    .screen{display:none}.screen.active{display:block}
    .spinner-border{display:inline-block;width:3rem;height:3rem;border:3px solid rgba(255,107,157,0.2);border-top-color:#FF6B9D;border-radius:50%;animation:spin 1s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  `;
  
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.insertBefore(style, document.head.firstChild);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  injectCriticalCSS();
  optimizeFonts();
  optimizeStylesheets();
    // preloadNextLikelyModules();
  
  console.log('Оптимизация бандла активирована');
});