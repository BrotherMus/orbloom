// Pip the gardener: walks around the little world, gathers fallen dew and swings the lantern.

import { COLORS, GARDENER, PLANET } from './config.js';
import { angleDiff, distanceBetween, toScreen, wrapAngle } from './geometry.js';
import { burst, floater, ring } from './effects.js';
import { damageEnemy, enemyPosition } from './enemies.js';

export function gardenerPosition(game) {
  return toScreen(game.gardener.angle, PLANET.radius + 16);
}

export function pulseCooldown(game) {
  return GARDENER.pulseCooldown * game.boons.pulseCooldown;
}

// controls: { walk: -1 | 0 | 1, pulse: boolean }
export function updateGardener(game, controls, dt) {
  const pip = game.gardener;
  pip.walking = controls.walk !== 0;
  if (pip.walking) {
    pip.facing = controls.walk;
    pip.angle = wrapAngle(pip.angle + controls.walk * GARDENER.walkSpeed * game.boons.walkSpeed * dt);
    pip.stride += dt * 11;
  }
  pip.pulseTimer = Math.max(0, pip.pulseTimer - dt);
  if (controls.pulse && pip.pulseTimer <= 0) lanternPulse(game);
}

function lanternPulse(game) {
  const pip = game.gardener;
  const from = gardenerPosition(game);
  pip.pulseTimer = pulseCooldown(game);
  ring(game, from.x, from.y, GARDENER.pulseRange, COLORS.gold, 0.5);
  burst(game, from.x, from.y, COLORS.gold, 26, 260);
  game.shake = Math.max(game.shake, 5);
  for (const enemy of game.enemies) {
    if (distanceBetween(from, enemyPosition(enemy)) > GARDENER.pulseRange + enemy.breed.size) continue;
    if (enemy.chewing >= 0) enemy.chewing = -1;
    enemy.distance += enemy.breed.size > 30 ? 20 : 70;
    damageEnemy(game, enemy, GARDENER.pulseDamage);
  }
  game.sound('pulse');
}

export function updateDew(game, dt) {
  const reach = GARDENER.reach * game.boons.reach;
  for (const drop of game.dewDrops) {
    if (!drop.resting) {
      drop.distance -= 150 * dt;
      if (drop.distance <= PLANET.radius + 9) {
        drop.distance = PLANET.radius + 9;
        drop.resting = true;
      }
      continue;
    }
    drop.life -= dt;
    if (Math.abs(angleDiff(drop.angle, game.gardener.angle)) < reach) {
      game.dew += drop.value;
      game.stats.dewGathered += drop.value;
      const at = toScreen(drop.angle, drop.distance + 18);
      floater(game, at.x, at.y, `+${drop.value}`, COLORS.ice);
      burst(game, at.x, at.y, COLORS.ice, 5, 60);
      drop.life = 0;
      game.sound('dew');
    }
  }
  game.dewDrops = game.dewDrops.filter((drop) => drop.life > 0);
}
