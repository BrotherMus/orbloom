// A simple robot gardener: it plays the demo behind the title screen and stages the screenshots.

import { GARDENER, MAX_LEVEL, SEEDS } from './config.js';
import { angleDiff, distanceBetween, nearestPlot } from './geometry.js';
import { enemyPosition } from './enemies.js';
import { gardenerPosition } from './gardener.js';
import { plantSeed, upgradeCost, upgradePlant } from './plants.js';

// Where the robot wants to stand: the nearest resting dew, else under the lowest creature.
function goalAngle(game) {
  const pip = game.gardener;
  let goal = null;
  let nearest = Infinity;
  for (const drop of game.dewDrops) {
    const turn = Math.abs(angleDiff(drop.angle, pip.angle));
    if (turn < nearest) {
      nearest = turn;
      goal = drop.angle;
    }
  }
  if (goal !== null) return goal;
  let lowest = null;
  for (const enemy of game.enemies) if (!lowest || enemy.distance < lowest.distance) lowest = enemy;
  return lowest ? lowest.angle : null;
}

export function robotControls(game) {
  const pip = game.gardener;
  const goal = goalAngle(game);
  let walk = 0;
  if (goal !== null) {
    const turn = angleDiff(goal, pip.angle);
    if (Math.abs(turn) > 0.08) walk = Math.sign(turn);
  }
  const from = gardenerPosition(game);
  const close = game.enemies.filter((enemy) => distanceBetween(from, enemyPosition(enemy)) < GARDENER.pulseRange * 0.8);
  return { walk, pulse: close.length >= 2 || close.some((enemy) => enemy.chewing >= 0 || enemy.breed.size > 20) };
}

// Spend dew the way a sensible player might: guard the front under attack, keep some Sunpetals, then upgrade.
export function robotGardening(game) {
  const planted = game.plots.filter((plot) => plot.plant);
  const suns = planted.filter((plot) => plot.plant.kind === 'sun').length;
  const want = suns < Math.min(3, 1 + Math.floor(planted.length / 3)) ? 'sun'
    : planted.length % 5 === 3 ? 'frost' : planted.length % 5 === 4 ? 'nova' : 'thorn';
  if (planted.length < game.plots.length && game.dew >= SEEDS[want].cost) {
    let target = null;
    for (const enemy of game.enemies) if (!target || enemy.distance < target.distance) target = enemy;
    const start = target ? nearestPlot(target.angle) : nearestPlot(game.gardener.angle);
    for (let offset = 0; offset < game.plots.length; offset++) {
      const index = (start + (offset % 2 ? -1 : 1) * Math.ceil(offset / 2) + game.plots.length * 2) % game.plots.length;
      if (!game.plots[index].plant) {
        plantSeed(game, index, want);
        return;
      }
    }
  }
  if (planted.length >= 6) {
    for (const plot of planted) {
      if (plot.plant.level < MAX_LEVEL && game.dew >= upgradeCost(plot.plant) + 20) {
        upgradePlant(game, plot.index);
        return;
      }
    }
  }
}
