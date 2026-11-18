// Short-lived feedback: sparks, shock rings and floating numbers. Pure data; render/effects.js draws it.

import { random, randomRange } from './rng.js';
import { TAU } from './config.js';

export function burst(game, x, y, color, count = 10, speed = 120) {
  for (let i = 0; i < count; i++) {
    const angle = random() * TAU;
    const velocity = randomRange(speed * 0.3, speed);
    game.particles.push({
      x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity,
      life: randomRange(0.35, 0.8), maxLife: 0.8, color, size: randomRange(1.5, 4),
    });
  }
}

export function ring(game, x, y, radius, color, life = 0.5) {
  game.rings.push({ x, y, radius, color, life, maxLife: life });
}

export function floater(game, x, y, text, color, size = 17) {
  game.floaters.push({ x, y, text, color, size, life: size > 20 ? 1.6 : 1.1, maxLife: 1.1 });
}

export function updateEffects(game, dt) {
  for (const p of game.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  for (const r of game.rings) r.life -= dt;
  game.rings = game.rings.filter((r) => r.life > 0);
  for (const f of game.floaters) {
    f.y -= 34 * dt;
    f.life -= dt;
  }
  game.floaters = game.floaters.filter((f) => f.life > 0);
  game.shake = Math.max(0, game.shake - dt * 30);
  game.hurtFlash = Math.max(0, game.hurtFlash - dt * 1.8);
  if (game.banner.timer > 0) game.banner.timer -= dt;
}
