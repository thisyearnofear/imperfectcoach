
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'trail' | 'sparkle' | 'confetti';
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private maxParticles = 200;

  createTrailParticle(x: number, y: number): void {
    const particle = this.getParticle();
    if (!particle) return;

    particle.x = x + (Math.random() - 0.5) * 10;
    particle.y = y + (Math.random() - 0.5) * 10;
    particle.vx = (Math.random() - 0.5) * 2;
    particle.vy = Math.random() * -2 - 1;
    particle.life = 30;
    particle.maxLife = 30;
    particle.size = Math.random() * 3 + 2;
    particle.color = `hsl(120, 80%, ${50 + Math.random() * 30}%)`;
    particle.type = 'trail';
  }

  createSparkleEffect(x: number, y: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) continue;

      const angle = (i / count) * Math.PI * 2;
      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * (Math.random() * 3 + 2);
      particle.vy = Math.sin(angle) * (Math.random() * 3 + 2);
      particle.life = 45;
      particle.maxLife = 45;
      particle.size = Math.random() * 4 + 3;
      particle.color = `hsl(${Math.random() * 60 + 40}, 90%, 70%)`;
      particle.type = 'sparkle';
    }
  }

  createConfettiEffect(x: number, y: number, count: number = 15): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) continue;

      particle.x = x + (Math.random() - 0.5) * 100;
      particle.y = y + (Math.random() - 0.5) * 50;
      particle.vx = (Math.random() - 0.5) * 8;
      particle.vy = Math.random() * -8 - 2;
      particle.life = 90;
      particle.maxLife = 90;
      particle.size = Math.random() * 6 + 4;
      particle.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
      particle.type = 'confetti';
    }
  }

  private getParticle(): Particle | null {
    if (this.particles.length >= this.maxParticles) return null;

    let particle = this.pool.pop();
    if (!particle) {
      particle = {
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0, size: 0,
        color: '', type: 'trail'
      };
    }
    this.particles.push(particle);
    return particle;
  }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply gravity for confetti
      if (particle.type === 'confetti') {
        particle.vy += 0.3;
      }
      
      // Fade out
      particle.life--;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        this.pool.push(particle);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      
      if (particle.type === 'sparkle') {
        // Draw star shape
        this.drawStar(ctx, particle.x, particle.y, particle.size);
      } else {
        // Draw circle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  clear(): void {
    this.pool.push(...this.particles);
    this.particles = [];
  }
}
