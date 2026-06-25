// ============================================
// QuizHub — Оптимизация производительности
// ============================================

// ========== ЛЕНИВАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЙ ==========

function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

// ========== ВИРТУАЛЬНЫЙ СКРОЛЛ ДЛЯ ДЛИННЫХ СПИСКОВ ==========

function createVirtualScroll(container, items, itemHeight, renderItem, bufferCount = 5) {
  let scrollTop = 0;
  let visibleCount = Math.ceil(container.clientHeight / itemHeight) + bufferCount * 2;
  
  function update() {
    scrollTop = container.scrollTop;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferCount);
    const endIndex = Math.min(items.length, startIndex + visibleCount);
    
    const visibleItems = items.slice(startIndex, endIndex);
    
    container.innerHTML = `
      <div style="height: ${items.length * itemHeight}px; position: relative;">
        ${visibleItems.map((item, i) => {
          const actualIndex = startIndex + i;
          return `
            <div style="position: absolute; top: ${actualIndex * itemHeight}px; width: 100%; height: ${itemHeight}px;">
              ${renderItem(item, actualIndex)}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  container.addEventListener('scroll', update, { passive: true });
  update();
  
  // Возвращаем функцию для обновления при изменении данных
  return update;
}

// ========== ДЕБАУНС И ТРОТТЛИНГ ==========

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ========== ОПТИМИЗАЦИЯ ПОВТОРНЫХ РЕНДЕРОВ ==========

const renderCache = new Map();

function memoizeRender(key, renderFunc) {
  if (renderCache.has(key)) {
    return renderCache.get(key);
  }
  
  const result = renderFunc();
  renderCache.set(key, result);
  
  // Очищаем кэш каждые 5 минут
  if (renderCache.size === 1) {
    setTimeout(() => renderCache.clear(), 300000);
  }
  
  return result;
}

// ========== ПРЕДЗАГРУЗКА КРИТИЧЕСКИХ РЕСУРСОВ ==========

function preloadCriticalResources() {
  const resources = [
    { href: 'css/style.css', as: 'style' },
    { href: 'css/themes.css', as: 'style' },
    { href: 'js/quiz.js', as: 'script' },
    { href: 'js/ui.js', as: 'script' },
  ];
  
  resources.forEach(({ href, as }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  });
}

// ========== ОПТИМИЗАЦИЯ ANIMATION FRAME ==========

let animationQueue = [];
let animationFrameId = null;

function queueAnimation(callback) {
  animationQueue.push(callback);
  
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(processAnimationQueue);
  }
}

function processAnimationQueue() {
  const queue = animationQueue;
  animationQueue = [];
  animationFrameId = null;
  
  queue.forEach(callback => callback());
}

// ========== ОПТИМИЗАЦИЯ ЗАПРОСОВ К FIREBASE ==========

const firebaseCache = new Map();
const FIREBASE_CACHE_DURATION = 60000; // 1 минута

async function cachedFirebaseQuery(collectionName, queryFunc, cacheKey) {
  const cached = firebaseCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < FIREBASE_CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await queryFunc();
  
  firebaseCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  
  // Очистка старых записей
  if (firebaseCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of firebaseCache) {
      if (now - value.timestamp > FIREBASE_CACHE_DURATION * 2) {
        firebaseCache.delete(key);
      }
    }
  }
  
  return data;
}

function clearFirebaseCache() {
  firebaseCache.clear();
}

// ========== BATCH UPDATES ==========

let batchUpdates = [];
let batchTimeout = null;

function batchUpdate(callback) {
  batchUpdates.push(callback);
  
  if (!batchTimeout) {
    batchTimeout = setTimeout(() => {
      const updates = batchUpdates;
      batchUpdates = [];
      batchTimeout = null;
      
      updates.forEach(cb => {
        try {
          cb();
        } catch (e) {
          console.error('Batch update error:', e);
        }
      });
    }, 16); // ~60 FPS
  }
}

// ========== ОПТИМИЗАЦИЯ ПАМЯТИ ==========

function cleanupMemory() {
  // Очищаем старые данные
  renderCache.clear();
  
  // Удаляем старые элементы из DOM
  const toastContainer = document.getElementById('toastContainer');
  if (toastContainer) {
    const toasts = toastContainer.children;
    if (toasts.length > 5) {
      for (let i = 0; i < toasts.length - 5; i++) {
        toasts[i].remove();
      }
    }
  }
  
  // Очищаем консольные таймеры
  if (typeof gc === 'function') {
    gc();
  }
  
  console.log('Память очищена');
}

// Периодическая очистка каждые 10 минут
setInterval(cleanupMemory, 600000);

// ========== МОНИТОРИНГ ПРОИЗВОДИТЕЛЬНОСТИ ==========

function getPerformanceMetrics() {
  if (!window.performance) return null;
  
  const timing = performance.timing;
  const navigation = performance.getEntriesByType('navigation')[0];
  
  return {
    // Время загрузки страницы
    pageLoadTime: timing.loadEventEnd - timing.navigationStart,
    
    // Время до первого байта
    ttfb: timing.responseStart - timing.requestStart,
    
    // Время рендеринга DOM
    domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
    
    // Количество запросов
    resourceCount: performance.getEntriesByType('resource').length,
    
    // Память (если доступно)
    memory: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
    } : null,
    
    // FPS
    fps: calculateFPS(),
  };
}

let fpsFrames = 0;
let fpsLastTime = performance.now();
let currentFPS = 60;

function calculateFPS() {
  fpsFrames++;
  const now = performance.now();
  
  if (now - fpsLastTime >= 1000) {
    currentFPS = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
    fpsFrames = 0;
    fpsLastTime = now;
  }
  
  return currentFPS;
}

// Считаем FPS постоянно
function startFPSMonitoring() {
  function loop() {
    calculateFPS();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ========== ОПТИМИЗАЦИЯ ДЛЯ МОБИЛЬНЫХ ==========

function applyMobileOptimizations() {
  const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Уменьшаем количество частиц
    const particles = document.getElementById('particles');
    if (particles && particles.children.length > 10) {
      while (particles.children.length > 10) {
        particles.lastChild.remove();
      }
    }
    
    // Отключаем тяжёлые анимации
    document.documentElement.classList.add('reduce-motion');
    
    // Уменьшаем качество конфетти
    window.CONFETTI_REDUCED = true;
  }
}

// ========== ОПТИМИЗАЦИЯ СЕТЕВЫХ ЗАПРОСОВ ==========

const requestQueue = [];
let processingQueue = false;

async function queueRequest(requestFunc, priority = 'normal') {
  return new Promise((resolve, reject) => {
    requestQueue.push({ func: requestFunc, priority, resolve, reject });
    
    if (!processingQueue) {
      processRequestQueue();
    }
  });
}

async function processRequestQueue() {
  if (requestQueue.length === 0) {
    processingQueue = false;
    return;
  }
  
  processingQueue = true;
  
  // Сортируем по приоритету
  requestQueue.sort((a, b) => {
    const priorities = { high: 0, normal: 1, low: 2 };
    return priorities[a.priority] - priorities[b.priority];
  });
  
  const { func, resolve, reject } = requestQueue.shift();
  
  try {
    const result = await func();
    resolve(result);
  } catch (error) {
    reject(error);
  }
  
  // Задержка между запросами
  setTimeout(processRequestQueue, 50);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  initLazyLoading();
  preloadCriticalResources();
  applyMobileOptimizations();
  startFPSMonitoring();
  
  // Оптимизируем обработчики событий
  window.addEventListener('scroll', throttle(() => {
    // Проверяем, нужно ли подгрузить данные
    const scrollPosition = window.scrollY + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition > documentHeight - 500) {
      // Предзагрузка данных
      queueAnimation(() => {
        console.log('Near bottom, preloading data...');
      });
    }
  }, 200), { passive: true });
  
  // Оптимизируем ресайз
  window.addEventListener('resize', debounce(() => {
    renderCache.clear();
    // Перерисовываем активный экран
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
      const screenId = activeScreen.id.replace('screen-', '');
      if (typeof showScreen === 'function') {
        showScreen(screenId);
      }
    }
  }, 250));
  
  console.log('Оптимизации производительности активированы');
});