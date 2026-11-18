// The night sky behind everything: a deep gradient, drifting nebulae and twinkling stars.

import { COLORS, PLANET, TAU, VIEW } from '../config.js';

// Stars are laid out once from their own tiny generator, so they never disturb the game's random seed.
const STARS = [];
let seed = 7;
const next = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
for (let i = 0; i < 170; i++) STARS.push({ x: next() * VIEW.width, y: next() * VIEW.height, size: 0.5 + next() * 1.7, phase: next() * TAU, warm: next() < 0.2 });

const NEBULAE = [
  { x: 190, y: 170, radius: 380, color: 'rgba(139, 77, 255, 0.20)' },
  { x: 1090, y: 600, radius: 420, color: 'rgba(67, 224, 184, 0.13)' },
  { x: 1010, y: 130, radius: 300, color: 'rgba(255, 122, 217, 0.12)' },
];

// Two far-off moons, one ringed, drift a little so the sky never sits quite still.
function drawFarMoons(ctx, game) {
  const drift = Math.sin(game.time * 0.05) * 6;
  const ringed = { x: 1128 + drift, y: 232, radius: 34 };
  ctx.save();
  ctx.globalAlpha = 0.55;
  const shade = ctx.createRadialGradient(ringed.x - 12, ringed.y - 12, 4, ringed.x, ringed.y, ringed.radius);
  shade.addColorStop(0, '#c9b8ff');
  shade.addColorStop(1, '#3b2a78');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(ringed.x, ringed.y, ringed.radius, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(ringed.x, ringed.y, ringed.radius * 1.8, ringed.radius * 0.42, -0.35, 0, TAU);
  ctx.stroke();
  const small = { x: 148 - drift, y: 590, radius: 20 };
  const frost = ctx.createRadialGradient(small.x - 7, small.y - 7, 2, small.x, small.y, small.radius);
  frost.addColorStop(0, '#bff3ff');
  frost.addColorStop(1, '#1f4d73');
  ctx.fillStyle = frost;
  ctx.beginPath();
  ctx.arc(small.x, small.y, small.radius, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawSky(ctx, game) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  for (const cloud of NEBULAE) {
    const haze = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
    haze.addColorStop(0, cloud.color);
    haze.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(cloud.x - cloud.radius, cloud.y - cloud.radius, cloud.radius * 2, cloud.radius * 2);
  }

  for (const star of STARS) {
    const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(game.time * 0.9 + star.phase));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = star.warm ? COLORS.gold : COLORS.star;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawFarMoons(ctx, game);

  // Faint orbit rings show how far the garden's plants can reach.
  ctx.strokeStyle = 'rgba(155, 231, 255, 0.07)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 9]);
  for (const reach of [250, 400]) {
    ctx.beginPath();
    ctx.arc(PLANET.x, PLANET.y, reach, 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}
