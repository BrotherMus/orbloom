// The night director: writes each night's script of Gloam and spawns it on time.

import { BOSS_NIGHTS, GLOAM, NIGHTS, TAU } from './config.js';
import { pick, random, randomRange } from './rng.js';
import { spawnEnemy } from './enemies.js';
import { showBanner } from './state.js';
import { makeWish } from './wishes.js';

const NIGHT_NAMES = [
  'First Dusk', 'Whispering Dark', 'The Gnawing', 'Husk Fall', 'Twin Shades', 'THE ECLIPSE',
  'Cold Tide', 'Swarm Song', 'Long Shadow', 'Starless', 'Last Watch', 'ECLIPSE REBORN',
];

export function nightName(night) {
  return NIGHT_NAMES[night - 1] ?? 'Endless Dark';
}

// The creature a night brings for the first time (the Eclipse on boss nights), or null.
export function newThreat(night) {
  if (BOSS_NIGHTS.includes(night)) return GLOAM.eclipse;
  return Object.values(GLOAM).find((breed) => breed.fromNight === night && night > 1) ?? null;
}

// A night is a queue of { at, kind, angle }: creatures arrive along a few fronts, so where you plant matters.
export function buildNight(night) {
  const queue = [];
  const frontCount = 1 + Math.min(3, Math.floor(night / 3));
  const fronts = Array.from({ length: frontCount }, () => random() * TAU);
  const kinds = Object.keys(GLOAM).filter((kind) => GLOAM[kind].fromNight <= night);
  let budget = 5 + night * 5 + night * night * 1.1;
  let at = 2.5;
  const gap = Math.max(0.22, 1.6 - night * 0.13);
  while (budget > 0) {
    const kind = random() < 0.45 ? 'mote' : pick(kinds);
    queue.push({ at, kind, angle: pick(fronts) + randomRange(-0.4, 0.4) });
    budget -= GLOAM[kind].threat;
    at += randomRange(gap * 0.5, gap * 1.4);
  }
  if (BOSS_NIGHTS.includes(night)) queue.push({ at: 5, kind: 'eclipse', angle: fronts[0] });
  queue.sort((a, b) => a.at - b.at);
  return { queue, fronts };
}

export function startNight(game, night) {
  game.night = night;
  game.mode = 'playing';
  const { queue, fronts } = buildNight(night);
  // fronts are kept so the HUD can warn where tonight's Gloam will come from.
  game.wave = { queue, fronts, clock: 0, total: queue.length, spawned: 0 };
  makeWish(game);
  showBanner(game, `NIGHT ${night} OF ${NIGHTS}`, nightName(night));
  game.sound('night');
}

// Returns true once the night's whole script has arrived and nothing is left alive.
export function updateWave(game, dt) {
  const wave = game.wave;
  wave.clock += dt;
  while (wave.queue.length > 0 && wave.queue[0].at <= wave.clock) {
    const next = wave.queue.shift();
    spawnEnemy(game, next.kind, next.angle);
    wave.spawned += 1;
  }
  return wave.queue.length === 0 && game.enemies.length === 0;
}

export function nightProgress(game) {
  const wave = game.wave;
  if (wave.total === 0) return 0;
  return (wave.spawned - Math.min(wave.spawned, game.enemies.length)) / wave.total;
}
