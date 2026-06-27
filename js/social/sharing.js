// ============================================
// QuizHub — Шаринг результатов v2.0
// ============================================

function generateShareCard(result) {
    const grade = typeof getGrade === 'function' ? getGrade(result.score) : { icon: 'trophy-fill', title: 'Отлично!' };
    const emoji = grade.icon === 'trophy-fill' ? '🏆' : grade.icon === 'star-fill' ? '⭐' : '💪';

    return {
        title: `${emoji} QuizHub — ${grade.title}`,
        description: `${result.playerName} набрал ${result.score} очков!\nПравильных ответов: ${result.correctAnswers}/10\nВремя: ${typeof formatTime === 'function' ? formatTime(result.totalTime) : result.totalTime}\nСложность: ${result.difficulty}`,
        score: result.score,
        playerName: result.playerName,
        correctAnswers: result.correctAnswers,
        difficulty: result.difficulty,
    };
}

function shareResult(result) {
    const card = generateShareCard(result);

    if (navigator.share) {
        navigator.share({
            title: card.title,
            text: card.description,
            url: window.location.href
        }).catch(() => {});
    } else {
        const shareText = `${card.title}\n\n${card.description}\n\nПопробуй и ты: ${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Результат скопирован! Поделись с друзьями 📋', 'success');
        });
    }
}

function shareToTelegram(result) {
    const card = generateShareCard(result);
    const text = encodeURIComponent(`${card.title}\n\n${card.description}\n\n${window.location.href}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
}

function shareToVK(result) {
    const card = generateShareCard(result);
    const text = encodeURIComponent(`${card.title}\n${card.description}`);
    window.open(`https://vk.com/share.php?url=${encodeURIComponent(window.location.href)}&title=${text}`, '_blank');
}

function shareToWhatsApp(result) {
    const card = generateShareCard(result);
    const text = encodeURIComponent(`${card.title}\n\n${card.description}\n\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function addShareButtons(result) {
    const container = document.querySelector('#screen-result .d-flex.flex-wrap');
    if (!container) return;

    const shareHTML = `
        <div class="share-buttons mt-3 w-100">
            <p class="text-muted small mb-2">Поделиться:</p>
            <div class="d-flex flex-wrap gap-2 justify-content-center">
                <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick="shareResult(${JSON.stringify(result).replace(/"/g, '&quot;')})">📋 Копировать</button>
                <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick="shareToTelegram(${JSON.stringify(result).replace(/"/g, '&quot;')})">📱 Telegram</button>
                <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick="shareToVK(${JSON.stringify(result).replace(/"/g, '&quot;')})">💬 VK</button>
                <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick="shareToWhatsApp(${JSON.stringify(result).replace(/"/g, '&quot;')})">📲 WhatsApp</button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', shareHTML);
}