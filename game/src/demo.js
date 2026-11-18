// The attract mode: behind the title screen a robot gardener plays a real, silent game.

import { robotControls, robotGardening } from './autoplay.js';
import { chooseBoon, startRun, stepGame } from './simulation.js';
import { startNight } from './waves.js';

export function startDemo(game) {
  const best = game.best;
  const sound = game.sound;
  game.sound = () => {};
  startRun(game);
  startNight(game, 3);
  game.sound = sound;
  game.best = best;
  game.dew = 240;
  game.demo = { clock: 0 };
  game.mode = 'title';
  game.banner.timer = 0;
}

export function stepDemo(game, dt) {
  const best = game.best;
  const sound = game.sound;
  game.sound = () => {};
  game.mode = 'playing';
  game.demo.clock += dt;
  if (game.demo.clock > 0.45) {
    game.demo.clock = 0;
    robotGardening(game);
  }
  stepGame(game, robotControls(game), dt);
  if (game.mode === 'boon') chooseBoon(game, 0);
  const over = game.mode === 'won' || game.mode === 'lost' || game.night > 8;
  game.sound = sound;
  game.best = best;
  game.banner.timer = 0;
  game.mode = 'title';
  if (over) startDemo(game);
}
