// The whole game in one plain object: created once, reset for every new run.

import { PLANET, START_DEW } from './config.js';
import { plotAngle } from './geometry.js';

export function createGame() {
  const game = { mode: 'title', best: 0, muted: false, sound: () => {} };
  resetRun(game);
  return game;
}

export function resetRun(game) {
  game.time = 0;
  game.night = 0;
  game.score = 0;
  game.combo = 0;
  game.comboTimer = 0;
  game.dew = START_DEW;
  game.health = PLANET.startHealth;
  game.maxHealth = PLANET.startHealth;
  game.plots = Array.from({ length: PLANET.plotCount }, (_, index) => ({ index, angle: plotAngle(index), plant: null }));
  game.gardener = { angle: -Math.PI / 2, facing: 1, stride: 0, pulseTimer: 0, walking: false };
  game.enemies = [];
  game.thorns = [];
  game.dewDrops = [];
  game.particles = [];
  game.rings = [];
  game.floaters = [];
  game.selectedSeed = 'thorn';
  game.hoverPlot = -1;
  game.wave = { queue: [], clock: 0, total: 0, spawned: 0 };
  game.boons = { thornDamage: 0, dewGain: 1, pulseCooldown: 1, walkSpeed: 1, reach: 1, frostPower: 0, novaRadius: 1, tendBonus: 1, sunGain: 1, taken: [] };
  game.boonChoices = [];
  game.stats = { kills: 0, planted: 0, dewGathered: 0, nights: 0 };
  game.shake = 0;
  game.hurtFlash = 0;
  game.banner = { text: '', sub: '', timer: 0 };
  game.newBest = false;
}

export function addScore(game, points) {
  game.score += Math.round(points * (1 + game.combo * 0.1));
}

export function showBanner(game, text, sub = '') {
  game.banner = { text, sub, timer: 2.6 };
}
