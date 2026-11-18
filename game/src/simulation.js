// One tick of the rules: the order every system runs in, and how a run starts, advances and ends.

import { NIGHTS } from './config.js';
import { resetRun, showBanner } from './state.js';
import { updateEffects } from './effects.js';
import { updateEnemies } from './enemies.js';
import { updateDew, updateGardener } from './gardener.js';
import { updateEmbers, updatePlants, updateThorns } from './plants.js';
import { startNight, updateWave } from './waves.js';
import { rollBoons, takeBoon } from './boons.js';

export function startRun(game) {
  resetRun(game);
  startNight(game, 1);
}

export function stepGame(game, controls, dt) {
  game.time += dt;
  if (game.mode !== 'playing') {
    updateEffects(game, dt);
    return;
  }
  updateGardener(game, controls, dt);
  updatePlants(game, dt);
  updateThorns(game, dt);
  updateEmbers(game, dt);
  updateEnemies(game, dt);
  updateDew(game, dt);
  updateEffects(game, dt);
  if (game.health <= 0) {
    finishRun(game, 'lost');
    return;
  }
  if (updateWave(game, dt)) endNight(game);
}

function endNight(game) {
  game.stats.nights = game.night;
  game.score += game.night * 100;
  if (game.night >= NIGHTS) {
    game.score += game.health * 50;
    finishRun(game, 'won');
    return;
  }
  rollBoons(game);
}

export function chooseBoon(game, index) {
  if (game.mode !== 'boon' || !takeBoon(game, index)) return;
  startNight(game, game.night + 1);
}

function finishRun(game, outcome) {
  game.mode = outcome;
  game.newBest = game.score > game.best;
  if (game.newBest) game.best = game.score;
  showBanner(game, '', '');
  game.sound(outcome === 'won' ? 'win' : 'lose');
}

// A title for the results screen, by how far the garden got.
export function gardenerRank(game) {
  if (game.mode === 'won') return game.health >= game.maxHealth ? 'Keeper of the Unbroken Dawn' : 'Dawnbringer';
  if (game.stats.nights >= 9) return 'Warden of the Long Night';
  if (game.stats.nights >= 6) return 'Eclipse Breaker';
  if (game.stats.nights >= 3) return 'Lantern Bearer';
  return 'Seedling';
}
