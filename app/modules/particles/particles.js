const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const maxParticles = 60;

let currentParticleType = 'particles_default';
let currentHue = 260;

const particleConfigs = {
    particles_default: { 
        hue: 260, saturation: 70, lightness: 65, 
        shape: 'circle', 
        size: { min: 0.8, max: 3.3 },
        speed: 0.4
    },
    particles_gold: { 
        hue: 45, saturation: 90, lightness: 55, 
        shape: 'circle', 
        size: { min: 1, max: 4 }, 
        glow: true,
        speed: 0.4
    },
    particles_snow: { 
        hue: 200, saturation: 80, lightness: 90, 
        shape: 'snowflake', 
        size: { min: 2, max: 6 },
        speed: 0.2
    },
    particles_hearts: { 
        hue: 350, saturation: 80, lightness: 65, 
        shape: 'heart', 
        size: { min: 4, max: 10 },  // 🔥 УВЕЛИЧЕНО с 2-6 до 4-10
        speed: 0.35
    },
    particles_stars: { 
        hue: 55, saturation: 90, lightness: 70, 
        shape: 'star', 
        size: { min: 2, max: 6 },
        glow: true, 
        twinkle: true,
        speed: 0.3
    }
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.reset();
    }
    
    reset() {
        const config = particleConfigs[currentParticleType] || particleConfigs.particles_default;
        
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * (config.size.max - config.size.min) + config.size.min;
        
        const speedMultiplier = config.speed || 0.4;
        this.speedX = (Math.random() - 0.5) * speedMultiplier;
        this.speedY = (Math.random() - 0.5) * speedMultiplier;
        
        this.opacity = Math.random() * 0.5 + 0.15;
        this.fadeSpeed = Math.random() * 0.004 + 0.001;
        this.fadingIn = Math.random() > 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.015;
        
        // Мерцание для звёзд — медленнее
        if (config.twinkle) {
            this.baseOpacity = 0.15 + Math.random() * 0.5;
            this.twinkleSpeed = Math.random() * 0.003 + 0.001; // 🔥 ЗАМЕДЛЕНО в 5 раз
            this.twinkleOffset = Math.random() * Math.PI * 2;
        }
    }
    
    update() {
        const config = particleConfigs[currentParticleType] || particleConfigs.particles_default;
        
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
        
        // Пульсация для обычных частиц
        if (!config.twinkle) {
            if (this.fadingIn) {
                this.opacity += this.fadeSpeed;
                if (this.opacity >= 0.55) this.fadingIn = false;
            } else {
                this.opacity -= this.fadeSpeed;
                if (this.opacity <= 0.12) this.fadingIn = true;
            }
        }
        
        // Медленное мерцание для звёзд
        if (config.twinkle) {
            this.opacity = this.baseOpacity * (0.5 + 0.5 * Math.sin(Date.now() * this.twinkleSpeed + this.twinkleOffset));
        }
        
        // Зацикливание
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = canvas.height + 20;
        if (this.y > canvas.height + 20) this.y = -20;
    }
    
    draw() {
        const config = particleConfigs[currentParticleType] || particleConfigs.particles_default;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const color = `hsla(${currentHue}, ${config.saturation}%, ${config.lightness}%, ${this.opacity})`;
        
        if (config.glow) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
        }
        
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.6;
        
        switch (config.shape) {
            case 'heart':
                this.drawHeart(this.size);
                break;
            case 'star':
                this.drawStar(this.size);
                break;
            case 'snowflake':
                this.drawSnowflake(this.size);
                break;
            default:
                this.drawCircle(this.size);
        }
        
        ctx.restore();
    }
    
    drawCircle(size) {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawHeart(size) {
        const s = size * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.4);
        ctx.bezierCurveTo(-s * 0.8, -s, -s, s * 0.3, 0, s * 0.9);
        ctx.bezierCurveTo(s, s * 0.3, s * 0.8, -s, 0, -s * 0.4);
        ctx.fill();
    }
    
    drawStar(size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    drawSnowflake(size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
            
            const branchAngle1 = angle + Math.PI / 6;
            const branchAngle2 = angle - Math.PI / 6;
            const branchPos = size * 0.6;
            
            ctx.moveTo(Math.cos(angle) * branchPos, Math.sin(angle) * branchPos);
            ctx.lineTo(
                Math.cos(angle) * branchPos + Math.cos(branchAngle1) * size * 0.25,
                Math.sin(angle) * branchPos + Math.sin(branchAngle1) * size * 0.25
            );
            
            ctx.moveTo(Math.cos(angle) * branchPos, Math.sin(angle) * branchPos);
            ctx.lineTo(
                Math.cos(angle) * branchPos + Math.cos(branchAngle2) * size * 0.25,
                Math.sin(angle) * branchPos + Math.sin(branchAngle2) * size * 0.25
            );
        }
        ctx.stroke();
    }
}

function createParticles() {
    particles = [];
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
}

createParticles();

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}

animate();

export function updateParticlesColor(hue) {
    currentHue = hue;
    createParticles();
}

export function updateParticlesType(type) {
    currentParticleType = type;
    const config = particleConfigs[type] || particleConfigs.particles_default;
    currentHue = config.hue;
    createParticles();
}

const savedParticles = localStorage.getItem('shopParticles');
if (savedParticles && savedParticles !== 'particles_default') {
    updateParticlesType(savedParticles);
}

window.updateParticlesType = updateParticlesType;