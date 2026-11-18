// Orbloom's tuning table: every number the designer may want to touch lives here.

export const VIEW = { width: 1280, height: 800 };
export const PLANET = { x: 640, y: 446, radius: 112, plotCount: 12, startHealth: 20 };
export const SPAWN_DISTANCE = 680;
export const NIGHTS = 12;
export const START_DEW = 80;
export const MAX_LEVEL = 3;
export const TAU = Math.PI * 2;

export const COLORS = {
  skyTop: '#060a1c',
  skyBottom: '#1b1547',
  star: '#dfe8ff',
  planetLight: '#43e0b8',
  planetDark: '#0d4f5e',
  soil: '#4a3566',
  leaf: '#b6f36b',
  leafDark: '#3f9d52',
  gold: '#ffd166',
  ember: '#ff9f5a',
  ice: '#9be7ff',
  nova: '#ff7ad9',
  gloam: '#1d0c33',
  gloamEdge: '#8b4dff',
  eye: '#ff4d8d',
  ink: '#eef3ff',
  dim: '#9aa6d1',
  panel: 'rgba(10, 14, 40, 0.84)',
  panelEdge: 'rgba(155, 231, 255, 0.38)',
  danger: '#ff5d73',
};

// The four seeds. Arrays are indexed by plant level - 1.
export const SEEDS = {
  thorn: {
    key: '1', name: 'Thornbud', blurb: 'Spits thorns at the nearest Gloam', cost: 25, color: COLORS.leaf,
    range: [290, 310, 335], damage: [1, 2, 3], interval: [0.85, 0.7, 0.52], health: [5, 7, 9],
  },
  sun: {
    key: '2', name: 'Sunpetal', blurb: 'Brews fresh dew while it shines', cost: 30, color: COLORS.gold,
    dew: [3, 5, 7], interval: [5.5, 5.5, 5], health: [4, 6, 8],
  },
  frost: {
    key: '3', name: 'Frostfern', blurb: 'Chills and slows nearby Gloam', cost: 40, color: COLORS.ice,
    range: [200, 230, 265], slow: [0.4, 0.5, 0.6], chill: [0.6, 1, 1.5], health: [5, 7, 9],
  },
  nova: {
    key: '4', name: 'Novalily', blurb: 'Charges up, then bursts in a ring', cost: 60, color: COLORS.nova,
    radius: [150, 170, 195], damage: [5, 8, 12], interval: [3.6, 3.2, 2.8], health: [5, 7, 9],
  },
  ember: {
    key: '5', name: 'Emberpod', blurb: 'Lobs fire that bursts on tough Gloam', cost: 50, color: COLORS.ember,
    range: [400, 430, 460], damage: [3, 5, 8], splash: [62, 72, 84], interval: [2.4, 2.1, 1.8], health: [5, 7, 9],
  },
  bell: {
    key: '6', name: 'Moonbell', blurb: 'Mends the heart, quickens neighbours', cost: 45, color: '#c9b8ff',
    mend: [1, 1, 2], haste: [0.25, 0.35, 0.5], interval: [8, 7, 7], health: [4, 6, 8],
  },
};
export const SEED_ORDER = ['thorn', 'sun', 'frost', 'nova', 'ember', 'bell'];

// The Gloam: every creature that falls on the garden. threat is its price in a night's budget.
export const GLOAM = {
  mote: { name: 'Mote', health: 3, speed: 30, size: 16, bite: 1, dew: 2, score: 10, threat: 1, fromNight: 1, lore: 'drifts straight for the world heart' },
  darter: { name: 'Darter', health: 2, speed: 60, size: 13, bite: 1, dew: 2, score: 15, threat: 1.2, fromNight: 2, weave: 1.5, lore: 'fast and weaving, hard for thorns to hit' },
  gnawer: { name: 'Gnawer', health: 7, speed: 36, size: 19, bite: 2, dew: 4, score: 25, threat: 2.2, fromNight: 3, chews: true, lore: 'lands on a plant and eats it: pulse it off!' },
  twin: { name: 'Twin Shade', health: 8, speed: 26, size: 21, bite: 2, dew: 3, score: 30, threat: 2.6, fromNight: 5, splits: 2, lore: 'splits into two Motes when banished' },
  husk: { name: 'Husk', health: 16, speed: 17, size: 28, bite: 4, dew: 6, score: 45, threat: 4, fromNight: 4, lore: 'slow and armoured, with a heavy bite' },
  eclipse: { name: 'The Eclipse', health: 150, speed: 9, size: 56, bite: 12, dew: 40, score: 500, threat: 0, fromNight: 99, orbit: 0.2, broods: 2.4, lore: 'a boss that circles the world and broods Motes' },
};
export const BOSS_NIGHTS = [6, 12];

export const GARDENER = {
  walkSpeed: 2.3, // radians per second around the planet
  reach: 0.24, // how far along the surface the dew basket reaches, in radians
  pulseRange: 185,
  pulseDamage: 3,
  pulseCooldown: 5,
  tendArc: 0.36, // a plant this close to the gardener works faster
  tendBonus: 0.6,
};

export const COMBO_WINDOW = 2.6;
export const DEW_LIFETIME = 11;
