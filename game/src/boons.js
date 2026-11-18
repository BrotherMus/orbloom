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
  { id: 'wildfire', name: 'Wildfire', icon: 'ember', text: 'Emberpod bursts spread 35% wider.', apply: (g) => { g.boons.emberSplash += 0.35; } },
  { id: 'lullaby', name: 'Lullaby', icon: 'bell', text: 'Every Moonbell mends +1 more heart.', apply: (g) => { g.boons.bellMend += 1; } },
  { id: 'volley', name: 'Thorn Volley', icon: 'thorn', once: true, text: 'Thornbuds spit three thorns in a fan.', apply: (g) => { g.boons.volley = 1; } },
  { id: 'starlit', name: 'Starlit Chain', icon: 'nova', text: 'Combos last 50% longer before they break.', apply: (g) => { g.boons.comboWindow += 0.5; } },
  { id: 'bloomburst', name: 'Bloomburst', icon: 'lantern', text: 'The lantern pulse hits harder and reaches wider.', apply: (g) => { g.boons.pulsePower += 1; } },
];

const TINTS = {
  heart: '#ff5d73', drop: '#9be7ff', thorn: '#b6f36b', lantern: '#ffd166', boot: '#ff9f5a', basket: '#9be7ff',
  frost: '#9be7ff', nova: '#ff7ad9', leaf: '#b6f36b', sun: '#ffd166', rain: '#9be7ff', ember: '#ff9f5a', bell: '#c9b8ff',
};

// The colour a boon is shown in, on its card and on its HUD badge.
export function boonTint(boon) {
  return TINTS[boon?.icon] ?? '#9be7ff';
}

// Three different boons; a once-only boon already taken is never offered again.
export function rollBoons(game) {
  const open = BOONS.filter((boon) => !(boon.once && game.boons.taken.includes(boon.id)));
  game.boonChoices = shuffled(open).slice(0, 3);
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
