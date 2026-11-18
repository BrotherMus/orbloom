// A seeded random source (mulberry32), so a night can be replayed and a screenshot staged exactly.

let state = 1;

export function seedRandom(seed) {
  state = (seed >>> 0) || 1;
}

export function random() {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomRange(low, high) {
  return low + random() * (high - low);
}

export function pick(list) {
  return list[Math.floor(random() * list.length)];
}

export function shuffled(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
