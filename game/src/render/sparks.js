// The small bright things: thorns in flight, dew drops, sparks, shock rings and floating numbers.

import { COLORS, TAU } from '../config.js';
import { toScreen } from '../geometry.js';
import { glowDot, write } from './brush.js';

export function drawThorns(ctx, game) {
  ctx.strokeStyle = COLORS.leaf;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const thorn of game.thorns) {
    ctx.beginPath();
    ctx.moveTo(thorn.x, thorn.y);
    ctx.lineTo(thorn.x - thorn.vx * 0.03, thorn.y - thorn.vy * 0.03);
    ctx.stroke();
    glowDot(ctx, thorn.x, thorn.y, 9, COLORS.leaf, 0.7);
  }
}

// Embers fly in an arc, so each one draws a short fading tail behind a bright head.
export function drawEmbers(ctx, game) {
  for (const ember of game.embers) {
    glowDot(ctx, ember.x, ember.y, 20, COLORS.ember, 0.9);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, 4.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 159, 90, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.arc(ember.toX, ember.toY, ember.splash, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawDew(ctx, game) {
  for (const drop of game.dewDrops) {
    const at = toScreen(drop.angle, drop.distance + (drop.resting ? Math.sin(game.time * 4 + drop.angle * 9) * 2 : 0));
    if (drop.resting && drop.life < 3 && Math.floor(game.time * 8) % 2 === 0) continue;
    glowDot(ctx, at.x, at.y, 16, COLORS.ice, 0.75);
    ctx.fillStyle = '#eaffff';
    ctx.beginPath();
    ctx.arc(at.x, at.y, 4.5, 0, TAU);
    ctx.fill();
  }
}

export function drawSparks(ctx, game) {
  for (const ring of game.rings) {
    const age = 1 - ring.life / ring.maxLife;
    ctx.globalAlpha = 1 - age;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 5 * (1 - age) + 1;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius * (0.25 + age * 0.75), 0, TAU);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, TAU);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  for (const f of game.floaters) {
    write(ctx, f.text, f.x, f.y, { size: f.size ?? 17, align: 'center', color: f.color, weight: 800, alpha: Math.min(1, f.life / 0.4), glow: f.size > 20 ? f.color : '#000' });
  }
}
