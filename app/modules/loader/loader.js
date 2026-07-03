// Система ленивой загрузки модулей
const moduleCache = new Map();

export async function lazyLoad(modulePath) {
    if (moduleCache.has(modulePath)) {
        return moduleCache.get(modulePath);
    }
    
    showLoader();
    
    try {
        const module = await import(modulePath);
        moduleCache.set(modulePath, module);
        return module;
    } catch (error) {
        console.error(`Ошибка загрузки модуля ${modulePath}:`, error);
        throw error;
    } finally {
        hideLoader();
    }
}

function showLoader() {
    let loader = document.getElementById('lazy-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'lazy-loader';
        loader.className = 'lazy-loader';
        loader.innerHTML = '<div class="lazy-spinner"></div>';
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoader() {
    const loader = document.getElementById('lazy-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}