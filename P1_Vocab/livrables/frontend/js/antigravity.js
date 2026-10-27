/**
 * ========================================================
 * VOCABMASTER - ANTIGRAVITY PHYSICS & EFFECTS (ANTIGRAVITY.JS)
 * ========================================================
 */

class AntigravityBackground {
  constructor(canvasId = 'antigravity-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 45;
    this.animationId = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.createParticles();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    const colors = [
      'rgba(249, 190, 39, ',  // Sunny Amber
      'rgba(61, 108, 231, ',  // Cosmic Royal Blue
      'rgba(138, 63, 252, ',  // Electric Violet
      'rgba(32, 163, 117, ',  // Emerald Mint
      'rgba(238, 96, 68, '    // Coral
    ];

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.5 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseAlpha: Math.random() * 0.35 + 0.15,
        alpha: 0.2,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35 - 0.1, // Slight upward drift
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseVal: Math.random() * Math.PI
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulseVal += p.pulseSpeed;
      p.alpha = p.baseAlpha + Math.sin(p.pulseVal) * 0.15;

      // Wrap around bounds
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `${p.color}${Math.max(0.05, p.alpha)})`;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = `${p.color}0.5)`;
      this.ctx.fill();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

/**
 * Attaches a 3D perspective mouse-tilt physics effect to an element
 */
export function attachTiltPhysics(element) {
  if (!element) return;

  let bounds = null;

  function updateBounds() {
    bounds = element.getBoundingClientRect();
  }

  function handleMouseMove(e) {
    if (!bounds) updateBounds();
    // Don't tilt if card is currently flipped 180deg
    if (element.classList.contains('flipped')) {
      element.style.transform = `rotateY(180deg)`;
      return;
    }

    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    const xPct = (mouseX / bounds.width - 0.5) * 2; // -1 to 1
    const yPct = (mouseY / bounds.height - 0.5) * 2; // -1 to 1

    const tiltX = -yPct * 8; // Max 8 deg tilt X
    const tiltY = xPct * 12; // Max 12 deg tilt Y

    element.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-4px) scale3d(1.01, 1.01, 1.01)`;
  }

  function handleMouseLeave() {
    bounds = null;
    if (element.classList.contains('flipped')) {
      element.style.transform = 'rotateY(180deg)';
    } else {
      element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale3d(1, 1, 1)';
    }
  }

  element.addEventListener('mouseenter', updateBounds);
  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);
}

// Auto instantiate background on load
document.addEventListener('DOMContentLoaded', () => {
  new AntigravityBackground('antigravity-canvas');
});
