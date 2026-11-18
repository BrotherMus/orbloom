// Polar helpers: the garden is a small round world, so most things live at an angle and a distance.

import { PLANET, TAU } from './config.js';

export function toScreen(angle, distance) {
  return { x: PLANET.x + Math.cos(angle) * distance, y: PLANET.y + Math.sin(angle) * distance };
}

export function toPolar(x, y) {
  const dx = x - PLANET.x;
  const dy = y - PLANET.y;
  return { angle: Math.atan2(dy, dx), distance: Math.hypot(dx, dy) };
}

export function wrapAngle(angle) {
  let a = angle % TAU;
  if (a > Math.PI) a -= TAU;
  if (a < -Math.PI) a += TAU;
  return a;
}

// The signed shortest turn from angle b to angle a.
export function angleDiff(a, b) {
  return wrapAngle(a - b);
}

export function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function plotAngle(index) {
  return -Math.PI / 2 + (index * TAU) / PLANET.plotCount;
}

export function nearestPlot(angle) {
  const step = TAU / PLANET.plotCount;
  const raw = Math.round((angle + Math.PI / 2) / step);
  return ((raw % PLANET.plotCount) + PLANET.plotCount) % PLANET.plotCount;
}
