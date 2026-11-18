// Boons: between nights the garden offers three gifts and the player keeps one.

import { shuffled } from './rng.js';

export const BOONS = [
  { id: 'roots', name: 'Deep Roots', icon: 'heart', text: 'The world heart grows: +6 health, fully mended.', apply: (g) => { g.maxHealth += 6; g.health = g.maxHealth; } },
  { id: 'honeydew', name: 'Honeydew', icon: 'drop', text: 'Fallen Gloam leave 40% more dew.', apply: (g) => { g.boons.dewGain += 0.4; } },
  { id: 'keen', name: 'Keen Thorns', icon: 'thorn', text: 'Every Thornbud hits for +1.', apply: (g) => { g.boons.thornDamage += 1; } },
  { id: 'lantern', name: 'Ever-Lantern', icon: 'lantern', text: 'The lantern pulse recharges 35% faster.', apply: (g) => { g.boons.pulseCooldown *= 0.65; } },
  { id: 'sandals', name: 'Wind Sandals', icon: 'boot', text: 'Pip walks the world 30% faster.', apply: (g) => { g.boons.walkSpeed += 0.3; } },
  { id: 'basket', name: 'Wide Basket', icon: 'basket', text: 'Gather dew from twice as far.', apply: (g) => { g.boons.reach *= 2; } },
  { id: 'hoarfrost', name: 'Hoarfrost', icon: 'frost', text: 'Frostferns reach further and bite colder.', apply: (g) => { g.boons.frostPower += 1; } },
  { id: 'supernova', name: 'Supernova', icon: 'nova', text: 'Novalily bursts spread 30% wider.', apply: (g) => { g.boons.novaRadius += 0.3; } },
  { id: 'thumb', name: 'Green Thumb', icon: 'leaf', text: 'Plants beside Pip work twice as eagerly.', apply: (g) => { g.boons.tendBonus += 1; } },
  { id: 'sunrise', name: 'Second Sunrise', icon: 'sun', text: 'Sunpetals brew 50% more dew.', apply: (g) => { g.boons.sunGain += 0.5; } },
  { id: 'rain', name: 'Seed Rain', icon: 'rain', text: 'A sudden shower: +70 dew right now.', apply: (g) => { g.dew += 70; } },
];

export function rollBoons(game) {
  game.boonChoices = shuffled(BOONS).slice(0, 3);
  game.mode = 'boon';
}

export function takeBoon(game, index) {
  const boon = game.boonChoices[index];
  if (!boon) return false;
  boon.apply(game);
  game.boons.taken.push(boon.id);
  game.boonChoices = [];
  game.sound('boon');
  return true;
}
