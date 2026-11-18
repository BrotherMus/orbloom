// Wishes: every night the garden makes one wish, an optional goal that pays dew and score when granted.

import { COLORS, PLANET } from './config.js';
import { pick } from './rng.js';
import { floater, ring } from './effects.js';

export const WISHES = [
  {
    id: 'combo', label: (goal) => `Chain a ×${goal} combo`,
    goal: (night) => 8 + night * 2, progress: (game) => game.wish.bestCombo,
  },
  {
    id: 'banish', label: (goal) => `Banish ${goal} Gloam tonight`,
    goal: (night) => 10 + night * 5, progress: (game) => game.stats.kills - game.wish.killsAtDusk,
  },
  {
    id: 'harvest', label: (goal) => `Gather ${goal} dew tonight`,
    goal: (night) => 30 + night * 12, progress: (game) => game.stats.dewGathered - game.wish.dewAtDusk,
  },
  {
    id: 'unharmed', label: () => 'Keep the world heart unharmed', atDawn: true,
    goal: () => 1, progress: (game) => (game.wish.hurt ? 0 : 1),
  },
];

export function makeWish(game) {
  const kind = pick(WISHES);
  const goal = kind.goal(game.night);
  game.wish = {
    kind, goal, text: kind.label(goal), reward: 20 + game.night * 6, granted: false, hurt: false,
    bestCombo: 0, killsAtDusk: game.stats.kills, dewAtDusk: game.stats.dewGathered, heartBefore: game.health,
  };
}

export function wishProgress(game) {
  return Math.min(game.wish.goal, game.wish.kind.progress(game));
}

// Called every tick: keeps the wish's own tallies and grants it the moment its goal is met.
export function updateWish(game) {
  const wish = game.wish;
  if (!wish) return;
  wish.bestCombo = Math.max(wish.bestCombo, game.combo);
  if (game.health < wish.heartBefore) wish.hurt = true;
  wish.heartBefore = game.health;
  if (!wish.granted && !wish.kind.atDawn && wishProgress(game) >= wish.goal) grantWish(game);
}

// Called when the night is survived: wishes about the whole night are settled here.
export function settleWish(game) {
  const wish = game.wish;
  if (wish && !wish.granted && wish.kind.atDawn && wishProgress(game) >= wish.goal) grantWish(game);
}

function grantWish(game) {
  const wish = game.wish;
  wish.granted = true;
  game.dew += wish.reward;
  game.stats.wishes += 1;
  game.score += Math.round(wish.reward * 10 * game.difficulty.score);
  ring(game, PLANET.x, PLANET.y, 240, COLORS.gold, 0.9);
  floater(game, PLANET.x, PLANET.y - PLANET.radius - 70, `Wish granted!  +${wish.reward} dew`, COLORS.gold);
  game.sound('boon');
}
