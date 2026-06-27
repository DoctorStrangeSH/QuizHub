// ============================================
// QuizHub — Генератор частиц v2.0
// ============================================

function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 15 : 35;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 6 + 2;
        const left = Math.random() * 100;
        const delay = Math.random() * 8;
        const duration = Math.random() * 6 + 6;

        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            animation-delay: ${delay}s;
            animation-duration: ${duration}s;
        `;

        container.appendChild(particle);
    }
}