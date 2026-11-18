// The Gloam: how each creature falls toward the garden, bites it, chews plants and dies.

import { COLORS, COMBO_WINDOW, DEW_LIFETIME, GLOAM, PLANET, SEEDS, SPAWN_DISTANCE, watchOf } from './config.js';
import { angleDiff, distanceBetween, nearestPlot, toScreen } from './geometry.js';
import { randomRange } from './rng.js';
import { addScore } from './state.js';
import { burst, floater, ring } from './effects.js';
import { plantTip } from './plants.js';

export function spawnEnemy(game, kind, angle, distance = SPAWN_DISTANCE) {
  const breed = GLOAM[kind];
  // The Gloam hardens slowly at first, then steeply once the garden is full grown.
  const toughness = 1 + (game.night - 1) * 0.22 + Math.max(0, game.night - 6) ** 2 * 0.2;
  const scale = toughness * watchOf(game.night).health * game.difficulty.health;
  const health = Math.ceil(breed.health * scale * (kind === 'eclipse' && game.night > 6 ? 2.1 : 1));
  const enemy = {
    kind, breed, angle, distance, health, maxHealth: health,
    age: randomRange(0, 6), slow: 0, hitFlash: 0, broodTimer: breed.broods ?? 0, chewing: -1,
    spin: randomRange(-0.05, 0.05),
  };
  game.enemies.push(enemy);
  return enemy;
}

export function enemyPosition(enemy) {
  return toScreen(enemy.angle, enemy.distance);
}

// How much the Frostferns in reach slow this creature, and the chill they deal each second.
function frostOn(game, position) {
  let slow = 0;
  let chill = 0;
  for (const plot of game.plots) {
    const plant = plot.plant;
    if (!plant || plant.kind !== 'frost') continue;
    const seed = SEEDS.frost;
    const range = seed.range[plant.level - 1] * (1 + game.boons.frostPower * 0.2);
    if (distanceBetween(plantTip(plot), position) > range) continue;
    slow = Math.max(slow, seed.slow[plant.level - 1] + game.boons.frostPower * 0.12);
    chill = Math.max(chill, seed.chill[plant.level - 1]);
  }
  return { slow: Math.min(0.85, slow), chill };
}

export function updateEnemies(game, dt) {
  for (const enemy of game.enemies) {
    const breed = enemy.breed;
    enemy.age += dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 5);
    const frost = frostOn(game, enemyPosition(enemy));
    enemy.slow = frost.slow;
    if (frost.chill > 0) damageEnemy(game, enemy, frost.chill * dt, true);
    if (enemy.health <= 0) continue;

    if (enemy.chewing >= 0) {
      chewPlant(game, enemy, dt);
      continue;
    }
    const pace = breed.speed * watchOf(game.night).speed * game.difficulty.speed * (1 - enemy.slow) * dt;
    enemy.distance -= pace;
    if (breed.weave) enemy.angle += Math.cos(enemy.age * 3.1) * breed.weave * dt * 0.5;
    else if (breed.orbit) enemy.angle += breed.orbit * dt * (1 - enemy.slow * 0.5);
    else enemy.angle += enemy.spin * dt;

    if (breed.broods) {
      enemy.broodTimer -= dt;
      if (enemy.broodTimer <= 0) {
        enemy.broodTimer = breed.broods;
        spawnEnemy(game, enemy.health < enemy.maxHealth / 2 ? 'darter' : 'mote', enemy.angle + randomRange(-0.5, 0.5), enemy.distance - 30);
      }
    }
    if (enemy.distance <= PLANET.radius + breed.size * 0.6) land(game, enemy);
  }
  game.enemies = game.enemies.filter((enemy) => enemy.health > 0);
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) game.combo = 0;
  }
}

function land(game, enemy) {
  const plotIndex = nearestPlot(enemy.angle);
  const plot = game.plots[plotIndex];
  if (enemy.breed.chews && plot.plant && Math.abs(angleDiff(plot.angle, enemy.angle)) < 0.3) {
    enemy.chewing = plotIndex;
    enemy.distance = PLANET.radius + 34;
    enemy.angle = plot.angle + 0.12;
    return;
  }
  biteWorld(game, enemy);
}

function chewPlant(game, enemy, dt) {
  const plot = game.plots[enemy.chewing];
  if (!plot.plant) {
    biteWorld(game, enemy);
    return;
  }
  plot.plant.health -= dt * 1.4;
  plot.plant.wilt = 0.3;
  if (plot.plant.health <= 0) {
    const tip = plantTip(plot);
    burst(game, tip.x, tip.y, COLORS.leafDark, 16, 150);
    floater(game, tip.x, tip.y - 12, 'eaten!', COLORS.danger);
    plot.plant = null;
    game.sound('hurt');
  }
}

function biteWorld(game, enemy) {
  const at = enemyPosition(enemy);
  game.health = Math.max(0, game.health - enemy.breed.bite);
  game.combo = 0;
  game.comboTimer = 0;
  game.shake = Math.min(18, 6 + enemy.breed.bite * 2);
  game.hurtFlash = 1;
  burst(game, at.x, at.y, COLORS.eye, 18, 190);
  ring(game, at.x, at.y, 70, COLORS.danger, 0.45);
  floater(game, at.x, at.y - 18, `-${enemy.breed.bite}`, COLORS.danger);
  game.sound('hurt');
  enemy.health = 0;
}

export function damageEnemy(game, enemy, amount, quiet = false) {
  if (enemy.health <= 0) return;
  enemy.health -= amount;
  if (!quiet) enemy.hitFlash = 1;
  if (enemy.health > 0) return;
  const at = enemyPosition(enemy);
  const breed = enemy.breed;
  game.combo += 1;
  game.comboTimer = COMBO_WINDOW * game.boons.comboWindow;
  game.stats.kills += 1;
  // Every tenth kill in a chain is called out in big letters above the garden.
  if (game.combo % 10 === 0) floater(game, PLANET.x, PLANET.y - PLANET.radius - 96, `COMBO ×${game.combo}!`, COLORS.nova, 44);
  addScore(game, breed.score);
  burst(game, at.x, at.y, breed.tint, breed.size > 30 ? 60 : 14, breed.size > 30 ? 320 : 150);
  ring(game, at.x, at.y, breed.size * 2.4, breed.tint, 0.4);
  floater(game, at.x, at.y - breed.size, `+${Math.round(breed.score * (1 + game.combo * 0.1))}`, COLORS.ink);
  game.dewDrops.push({
    angle: enemy.angle, distance: enemy.distance, value: Math.round((breed.dew + watchOf(game.night).dew) * game.boons.dewGain),
    life: DEW_LIFETIME, resting: false,
  });
  if (breed.splits) {
    for (let i = 0; i < breed.splits; i++) spawnEnemy(game, 'mote', enemy.angle + (i - 0.5) * 0.22, enemy.distance + 10);
  }
  game.sound(breed.size > 30 ? 'boom' : 'pop');
}

export function nearestEnemy(game, from, range) {
  let best = null;
  let bestDistance = range;
  for (const enemy of game.enemies) {
    if (enemy.health <= 0) continue;
    const gap = distanceBetween(from, enemyPosition(enemy)) - enemy.breed.size;
    if (gap < bestDistance) {
      best = enemy;
      bestDistance = gap;
    }
  }
  return best;
}
