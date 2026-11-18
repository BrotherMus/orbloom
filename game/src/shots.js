// Screenshot staging: ?shot=play|title|boons|results&seed=N builds one repeatable moment of the real game
// and draws a single frame of it, so the screenshots in screenshots/ can be taken again exactly.

import { MAX_LEVEL } from './config.js';
import { seedRandom } from './rng.js';
import { BOONS, rollBoons } from './boons.js';
import { robotControls } from './autoplay.js';
import { startDemo, stepDemo } from './demo.js';
import { plantSeed, upgradePlant } from './plants.js';
import { startRun, stepGame } from './simulation.js';
import { startNight } from './waves.js';

const STEP = 1 / 60;
const GARDEN = [
  ['thorn', 3], ['sun', 2], ['frost', 2], ['ember', 2], ['nova', 2], ['thorn', 3],
  ['sun', 3], ['bell', 2], ['thorn', 2], ['nova', 3], ['ember', 3], ['thorn', 2],
];

export function shotRequest() {
  const query = new URLSearchParams(window.location.search);
  const name = query.get('shot');
  // live=1 keeps playing from the staged moment, which is how the later nights are play-tested.
  return name ? {
    name, seed: Number(query.get('seed')) || 1, seconds: Number(query.get('seconds')) || 20,
    night: Number(query.get('night')) || 12, live: query.get('live') === '1',
  } : null;
}

// Grow a mid-run garden the way a player would have by this night: plant, then upgrade.
function growGarden(game, plots, boonIds) {
  game.dew = 9999;
  plots.forEach(([kind, level], index) => {
    plantSeed(game, index, kind);
    for (let grown = 1; grown < Math.min(level, MAX_LEVEL); grown++) upgradePlant(game, index);
    game.plots[index].plant.grow = 1;
  });
  for (const id of boonIds) {
    const boon = BOONS.find((entry) => entry.id === id);
    boon.apply(game);
    game.boons.taken.push(id);
  }
  game.particles = [];
  game.rings = [];
  game.floaters = [];
}

function playFor(game, seconds) {
  for (let tick = 0; tick < seconds / STEP && game.mode === 'playing'; tick++) stepGame(game, robotControls(game), STEP);
}

export function stageShot(game, shot) {
  seedRandom(shot.seed);
  game.sound = () => {};
  if (shot.name === 'title') {
    startDemo(game);
    for (let tick = 0; tick < 26 / STEP; tick++) stepDemo(game, STEP);
    return;
  }
  startRun(game);
  if (shot.name === 'boons') {
    growGarden(game, GARDEN.slice(0, 7).map(([kind]) => [kind, 1]), ['keen', 'honeydew', 'lantern']);
    game.night = 4;
    game.dew = 64;
    game.score = 6120;
    game.health = 18;
    game.stats = { kills: 96, planted: 7, dewGathered: 410, nights: 4 };
    rollBoons(game);
    return;
  }
  if (shot.name === 'results') {
    growGarden(game, GARDEN.map(([kind]) => [kind, 3]), ['keen', 'honeydew', 'lantern', 'roots', 'thumb', 'hoarfrost', 'supernova', 'sunrise', 'basket', 'sandals', 'rain']);
    game.night = 12;
    game.dew = 310;
    game.health = 21;
    game.score = 104250;
    game.stats = { kills: 948, planted: 14, dewGathered: 3120, nights: 12 };
    game.best = game.score;
    game.newBest = true;
    game.mode = 'won';
    return;
  }
  // 'play': an Eclipse night, mid-fight, with the garden a player would have grown by then.
  const night = shot.night;
  const boonsByNow = ['keen', 'honeydew', 'lantern', 'thumb', 'hoarfrost', 'volley', 'wildfire', 'roots', 'starlit', 'supernova', 'bloomburst'].slice(0, night - 1);
  growGarden(game, GARDEN.map(([kind, level]) => [kind, night >= 10 ? 3 : level]), boonsByNow);
  game.dew = 85;
  game.score = night * night * 610 + 240;
  game.best = 96400;
  game.health = game.maxHealth - 5;
  game.stats = { kills: night * 62, planted: 12 + night, dewGathered: night * 260, nights: night - 1 };
  startNight(game, night);
  playFor(game, shot.seconds - 1.2);
  // Skip the Eclipse's long approach so the frame catches it bearing down on the garden.
  const eclipse = game.enemies.find((enemy) => enemy.kind === 'eclipse');
  if (eclipse) {
    eclipse.distance = 318;
    eclipse.angle = -2.62;
  }
  playFor(game, 1.2);
  game.banner.timer = 0;
  game.hoverPlot = 4;
}
