// Everything that moves on its own: the Gloam in all its shapes, and Pip the gardener.

import { COLORS, PLANET, TAU } from '../config.js';
import { enemyPosition } from '../enemies.js';
import { gardenerPosition, pulseCooldown, pulseRange } from '../gardener.js';
import { bar, glowDot } from './brush.js';

export function drawEnemies(ctx, game) {
  for (const enemy of game.enemies) {
    const at = enemyPosition(enemy);
    const size = enemy.breed.size;
    const wobble = 1 + Math.sin(enemy.age * 5) * 0.06;
    // Smoke trails away from the planet, the way the creature came.
    const away = { x: Math.cos(enemy.angle), y: Math.sin(enemy.angle) };
    ctx.fillStyle = 'rgba(139, 77, 255, 0.22)';
    for (let puff = 1; puff <= 3; puff++) {
      ctx.beginPath();
      ctx.arc(at.x + away.x * size * puff * 0.75, at.y + away.y * size * puff * 0.75 + Math.sin(enemy.age * 4 + puff) * 3, size * (0.75 - puff * 0.16), 0, TAU);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(at.x, at.y);
    ctx.rotate(enemy.angle + Math.PI / 2);
    ctx.scale(wobble, 2 - wobble);
    if (enemy.kind === 'eclipse') drawEclipse(ctx, enemy, size);
    else drawShade(ctx, enemy, size);
    ctx.restore();
    if (enemy.slow > 0) glowDot(ctx, at.x, at.y, size * 1.6, COLORS.ice, 0.35);
    if (enemy.health < enemy.maxHealth && enemy.kind !== 'eclipse') {
      bar(ctx, at.x - size, at.y - size - 10, size * 2, 4, enemy.health / enemy.maxHealth, COLORS.eye);
    }
  }
}

// In this frame +y points at the planet, so eyes and teeth sit on the +y side.
function drawShade(ctx, enemy, size) {
  ctx.shadowColor = COLORS.gloamEdge;
  ctx.shadowBlur = 14;
  ctx.fillStyle = enemy.hitFlash > 0.5 ? '#ffffff' : COLORS.gloam;
  ctx.strokeStyle = COLORS.gloamEdge;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (enemy.kind === 'darter') {
    ctx.moveTo(0, size * 1.5);
    ctx.quadraticCurveTo(size, 0, 0, -size * 1.3);
    ctx.quadraticCurveTo(-size, 0, 0, size * 1.5);
  } else if (enemy.kind === 'twin') {
    ctx.arc(-size * 0.45, 0, size * 0.75, 0, TAU);
    ctx.moveTo(size * 1.2, 0);
    ctx.arc(size * 0.45, 0, size * 0.75, 0, TAU);
  } else {
    ctx.arc(0, 0, size, 0, TAU);
  }
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  if (enemy.kind === 'husk') {
    ctx.strokeStyle = 'rgba(139, 77, 255, 0.7)';
    ctx.lineWidth = 3;
    for (const shell of [0.45, 0.72]) {
      ctx.beginPath();
      ctx.arc(0, 0, size * shell, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  }
  ctx.fillStyle = COLORS.eye;
  const eyes = enemy.kind === 'darter' ? [0] : enemy.kind === 'twin' ? [-0.45, 0.45] : [-0.35, 0.35];
  for (const eye of eyes) {
    ctx.beginPath();
    ctx.arc(eye * size, size * 0.25, Math.max(2.2, size * 0.17), 0, TAU);
    ctx.fill();
  }
  if (enemy.kind === 'gnawer') {
    ctx.fillStyle = '#f3ecff';
    for (let tooth = -2; tooth <= 2; tooth++) {
      ctx.beginPath();
      ctx.moveTo(tooth * 5 - 2.5, size * 0.62);
      ctx.lineTo(tooth * 5, size * 0.62 + 7);
      ctx.lineTo(tooth * 5 + 2.5, size * 0.62);
      ctx.fill();
    }
  }
}

function drawEclipse(ctx, enemy, size) {
  glowDot(ctx, 0, 0, size * 2.6, 'rgba(255, 77, 141, 0.55)');
  ctx.strokeStyle = COLORS.eye;
  ctx.lineWidth = 2;
  for (let ray = 0; ray < 16; ray++) {
    const turn = (ray / 16) * TAU + enemy.age * 0.3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(turn) * size * 1.08, Math.sin(turn) * size * 1.08);
    ctx.lineTo(Math.cos(turn) * size * (1.35 + (ray % 2) * 0.22), Math.sin(turn) * size * (1.35 + (ray % 2) * 0.22));
    ctx.stroke();
  }
  ctx.shadowColor = COLORS.eye;
  ctx.shadowBlur = 30;
  // Under constant fire the Eclipse stays dark; only its rim flares white when it is hit.
  ctx.fillStyle = '#0a0416';
  ctx.strokeStyle = enemy.hitFlash > 0.5 ? '#fff6c9' : COLORS.ember;
  ctx.lineWidth = enemy.hitFlash > 0.5 ? 6 : 4;
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.eye;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.25, size * 0.42, size * 0.24, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0a0416';
  ctx.beginPath();
  ctx.arc(0, size * 0.3, size * 0.13, 0, TAU);
  ctx.fill();
}

export function drawGardener(ctx, game) {
  const pip = game.gardener;
  const at = gardenerPosition(game);
  const ready = pip.pulseTimer <= 0;
  if (ready) {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(at.x, at.y, pulseRange(game), 0, TAU);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(PLANET.x, PLANET.y);
  ctx.rotate(pip.angle + Math.PI / 2);
  ctx.translate(0, -PLANET.radius);
  ctx.scale(pip.facing * 1.35, 1.35);
  const hop = pip.walking ? Math.abs(Math.sin(pip.stride)) * 4 : 0;
  // Legs
  ctx.strokeStyle = '#2b1d4a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const swing = pip.walking ? Math.sin(pip.stride) * 5 : 0;
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.lineTo(-4 + swing, 0);
  ctx.moveTo(4, -8);
  ctx.lineTo(4 - swing, 0);
  ctx.stroke();
  ctx.translate(0, -hop);
  // Cloak and face
  ctx.fillStyle = '#f2a65a';
  ctx.beginPath();
  ctx.moveTo(-11, -6);
  ctx.quadraticCurveTo(0, -34, 11, -6);
  ctx.fill();
  ctx.fillStyle = '#ffe9c9';
  ctx.beginPath();
  ctx.arc(0, -24, 8, 0, TAU);
  ctx.fill();
  // Leaf hat
  ctx.fillStyle = COLORS.leaf;
  ctx.beginPath();
  ctx.moveTo(-12, -28);
  ctx.quadraticCurveTo(0, -48, 13, -28);
  ctx.fill();
  ctx.fillStyle = '#2b1d4a';
  ctx.beginPath();
  ctx.arc(3, -24, 1.6, 0, TAU);
  ctx.fill();
  // Lantern on a pole
  ctx.strokeStyle = '#c9b8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, -14);
  ctx.lineTo(18, -30);
  ctx.stroke();
  ctx.fillStyle = ready ? COLORS.gold : '#7a6a4a';
  ctx.beginPath();
  ctx.arc(18, -24, 5, 0, TAU);
  ctx.fill();
  if (ready) glowDot(ctx, 18, -24, 22, COLORS.gold, 0.8);
  ctx.restore();
  if (!ready) bar(ctx, at.x - 20, at.y + 22, 40, 5, 1 - pip.pulseTimer / pulseCooldown(game), COLORS.gold);
}
