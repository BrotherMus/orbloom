// Pip the gardener: walks around the little world, gathers fallen dew and swings the lantern.

import { COLORS, GARDENER, PLANET } from './config.js';
import { angleDiff, distanceBetween, toScreen, wrapAngle } from './geometry.js';
import { burst, floater, ring } from './effects.js';
import { damageEnemy, enemyPosition } from './enemies.js';

export const SONG_COOLDOWN = 22;

export function gardenerPosition(game) {
  return toScreen(game.gardener.angle, PLANET.radius + 16);
}

export function pulseCooldown(game) {
  return GARDENER.pulseCooldown * game.boons.pulseCooldown;
}

export function pulseRange(game) {
  return GARDENER.pulseRange * (1 + game.boons.pulsePower * 0.2);
}

// controls: { walk: -1 | 0 | 1, pulse: boolean, song: boolean }
export function updateGardener(game, controls, dt) {
  const pip = game.gardener;
  pip.walking = controls.walk !== 0;
  if (pip.walking) {
    pip.facing = controls.walk;
    pip.angle = wrapAngle(pip.angle + controls.walk * GARDENER.walkSpeed * game.boons.walkSpeed * dt);
    pip.stride += dt * 11;
  }
  pip.pulseTimer = Math.max(0, pip.pulseTimer - dt);
  pip.songTimer = Math.max(0, pip.songTimer - dt);
  if (controls.pulse && pip.pulseTimer <= 0) lanternPulse(game);
  if (controls.song && pip.songTimer <= 0) dewSong(game);
}

// Pip's second gift: a song that calls every dew drop home and makes every plant act at once.
function dewSong(game) {
  const pip = game.gardener;
  pip.songTimer = SONG_COOLDOWN;
  let gathered = 0;
  for (const drop of game.dewDrops) {
    gathered += drop.value;
    drop.life = 0;
  }
  game.dew += gathered;
  game.stats.dewGathered += gathered;
  for (const plot of game.plots) {
    if (!plot.plant) continue;
    plot.plant.timer = 0;
    plot.plant.recoil = 1;
  }
  const from = gardenerPosition(game);
  ring(game, PLANET.x, PLANET.y, 300, COLORS.leaf, 0.8);
  ring(game, PLANET.x, PLANET.y, 190, COLORS.ice, 0.6);
  floater(game, from.x, from.y - 40, gathered > 0 ? `Dew Song  +${gathered}` : 'Dew Song', COLORS.leaf);
  game.sound('boon');
}

function lanternPulse(game) {
  const pip = game.gardener;
  const from = gardenerPosition(game);
  pip.pulseTimer = pulseCooldown(game);
  const range = pulseRange(game);
  ring(game, from.x, from.y, range, COLORS.gold, 0.5);
  burst(game, from.x, from.y, COLORS.gold, 26, 260);
  game.shake = Math.max(game.shake, 5);
  for (const enemy of game.enemies) {
    if (distanceBetween(from, enemyPosition(enemy)) > range + enemy.breed.size) continue;
    if (enemy.chewing >= 0) enemy.chewing = -1;
    enemy.distance += enemy.breed.size > 30 ? 20 : 70;
    damageEnemy(game, enemy, GARDENER.pulseDamage + game.boons.pulsePower * 2);
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
