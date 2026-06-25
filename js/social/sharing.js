// ============================================
// QuizHub — Шаринг и стриминг
// ============================================

// ========== ПОДЕЛИТЬСЯ РЕЗУЛЬТАТОМ ==========

function generateShareCard(result) {
  const grade = getGrade(result.score);
  const emoji = grade.icon === 'trophy-fill' ? '🏆' : 
                grade.icon === 'star-fill' ? '⭐' : 
                grade.icon === 'hand-thumbs-up-fill' ? '👍' : '💪';
  
  const card = {
    title: `${emoji} QuizHub — ${grade.title}`,
    description: `${result.playerName} набрал ${result.score} очков!\nПравильных ответов: ${result.correctAnswers}/10\nВремя: ${formatTime(result.totalTime)}\nСложность: ${result.difficulty}`,
    score: result.score,
    playerName: result.playerName,
    correctAnswers: result.correctAnswers,
    difficulty: result.difficulty,
  };
  
  return card;
}

function shareResult(result) {
  const card = generateShareCard(result);
  
  // Используем Web Share API если доступен
  if (navigator.share) {
    navigator.share({
      title: card.title,
      text: card.description,
      url: window.location.href
    }).catch(() => {});
  } else {
    // Fallback — копируем в буфер обмена
    const shareText = `${card.title}\n\n${card.description}\n\nПопробуй и ты: ${window.location.href}`;
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('Результат скопирован! Поделись с друзьями 📋', 'success');
    });
  }
}

function shareAchievement(achievement) {
  const text = `🏆 Я разблокировал достижение «${achievement.name}» в QuizHub!\n${achievement.desc}\n\nПопробуй и ты: ${window.location.href}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'Новое достижение!',
      text: text,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Достижение скопировано! 📋', 'success');
    });
  }
}

// ========== КАРТОЧКА РЕЗУЛЬТАТА (изображение) ==========

function generateResultImage(result) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Фон
  const gradient = ctx.createLinearGradient(0, 0, 600, 400);
  gradient.addColorStop(0, '#0F0E17');
  gradient.addColorStop(1, '#1A1A2E');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 400);
  
  // Заголовок
  ctx.fillStyle = '#FF6B9D';
  ctx.font = 'bold 32px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('QuizHub', 300, 60);
  
  // Имя игрока
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '24px Inter, sans-serif';
  ctx.fillText(result.playerName, 300, 110);
  
  // Счёт
  ctx.fillStyle = '#FF6B9D';
  ctx.font = 'bold 72px Orbitron, sans-serif';
  ctx.fillText(result.score.toString(), 300, 200);
  
  ctx.fillStyle = '#B0B0C0';
  ctx.font = '18px Inter, sans-serif';
  ctx.fillText('очков', 300, 235);
  
  // Статистика
  ctx.font = '20px Inter, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`✅ ${result.correctAnswers}/10 правильно`, 150, 300);
  ctx.fillText(`⏱ ${formatTime(result.totalTime)}`, 300, 300);
  ctx.fillText(`${result.difficulty === 'easy' ? '🟢' : result.difficulty === 'medium' ? '🟡' : '🔴'} ${result.difficulty}`, 450, 300);
  
  // Подпись
  ctx.fillStyle = '#B0B0C0';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('Попробуй и ты!', 300, 360);
  
  return canvas.toDataURL('image/png');
}

function downloadResultImage(result) {
  const dataUrl = generateResultImage(result);
  
  const link = document.createElement('a');
  link.download = `quizhub-result-${result.score}.png`;
  link.href = dataUrl;
  link.click();
  
  showToast('Изображение сохранено! 📸', 'success');
}

// ========== ИНТЕГРАЦИЯ С СОЦСЕТЯМИ ==========

function shareToTelegram(result) {
  const card = generateShareCard(result);
  const text = encodeURIComponent(`${card.title}\n\n${card.description}\n\nПопробуй: ${window.location.href}`);
  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
}

function shareToVK(result) {
  const card = generateShareCard(result);
  const text = encodeURIComponent(`${card.title}\n${card.description}`);
  window.open(`https://vk.com/share.php?url=${encodeURIComponent(window.location.href)}&title=${text}`, '_blank');
}

function shareToTwitter(result) {
  const card = generateShareCard(result);
  const text = encodeURIComponent(`${card.title}\n${card.description}`);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, '_blank');
}

function shareToWhatsApp(result) {
  const card = generateShareCard(result);
  const text = encodeURIComponent(`${card.title}\n\n${card.description}\n\n${window.location.href}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// ========== РЕЖИМ ДЛЯ СТРИМЕРОВ ==========

let streamerMode = JSON.parse(localStorage.getItem('quizhub-streamer-mode') || 'false');

function toggleStreamerMode() {
  streamerMode = !streamerMode;
  localStorage.setItem('quizhub-streamer-mode', JSON.stringify(streamerMode));
  
  if (streamerMode) {
    enableStreamerMode();
    showToast('Режим стримера включён! 🎥', 'success');
  } else {
    disableStreamerMode();
    showToast('Режим стримера выключен', 'info');
  }
}

function enableStreamerMode() {
  // Скрываем личную информацию
  document.body.classList.add('streamer-mode');
  
  // Скрываем email/имя если есть
  const personalInfo = document.querySelectorAll('.user-email, .user-fullname');
  personalInfo.forEach(el => el.style.display = 'none');
  
  // Показываем оверлей с информацией
  if (!document.getElementById('streamer-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'streamer-overlay';
    overlay.className = 'streamer-overlay';
    overlay.innerHTML = `
      <div class="streamer-bar">
        <span class="streamer-dot"></span> Стримерский режим
        <button onclick="toggleStreamerMode()" class="btn btn-sm btn-outline-light rounded-pill ms-2">Выключить</button>
      </div>
    `;
    document.body.appendChild(overlay);
  }
}

function disableStreamerMode() {
  document.body.classList.remove('streamer-mode');
  
  const overlay = document.getElementById('streamer-overlay');
  if (overlay) overlay.remove();
}

// ========== DISCORD ИНТЕГРАЦИЯ (Webhook) ==========

async function sendToDiscord(result, webhookUrl) {
  const card = generateShareCard(result);
  
  const embed = {
    title: card.title,
    description: card.description.replace(/\n/g, '\n'),
    color: 0xFF6B9D,
    fields: [
      { name: 'Очки', value: result.score.toString(), inline: true },
      { name: 'Правильно', value: `${result.correctAnswers}/10`, inline: true },
      { name: 'Сложность', value: result.difficulty, inline: true }
    ],
    footer: { text: 'QuizHub • quizhub.app' }
  };
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    
    showToast('Отправлено в Discord! 🎮', 'success');
  } catch (error) {
    console.error('Discord webhook error:', error);
    showToast('Не удалось отправить в Discord', 'danger');
  }
}

// ========== КНОПКИ ШАРИНГА НА ЭКРАНЕ РЕЗУЛЬТАТА ==========

function addShareButtons(result) {
  const container = document.querySelector('#screen-result .d-flex.flex-wrap');
  if (!container) return;
  
  const shareHTML = `
    <div class="share-buttons mt-3 w-100">
      <p class="text-muted small mb-2">Поделиться:</p>
      <div class="d-flex flex-wrap gap-2 justify-content-center">
        <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick='shareResult(${JSON.stringify(result)})'>
          📋 Копировать
        </button>
        <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick='downloadResultImage(${JSON.stringify(result)})'>
          📸 Картинка
        </button>
        <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick='shareToTelegram(${JSON.stringify(result)})'>
          📱 Telegram
        </button>
        <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick='shareToVK(${JSON.stringify(result)})'>
          💬 VK
        </button>
        <button class="btn btn-sm btn-outline-accent rounded-pill px-3" onclick='shareToWhatsApp(${JSON.stringify(result)})'>
          📲 WhatsApp
        </button>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', shareHTML);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

document.addEventListener('DOMContentLoaded', () => {
  if (streamerMode) {
    enableStreamerMode();
  }
});

// Переопределяем renderResultScreen для добавления кнопок шаринга
const originalRenderResultScreen = renderResultScreen;
renderResultScreen = function(result) {
  originalRenderResultScreen(result);
  setTimeout(() => addShareButtons(result), 100);
};