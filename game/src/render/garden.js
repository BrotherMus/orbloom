// The little world and what grows on it: the planet, its twelve plots and every plant.

import { COLORS, MAX_LEVEL, PLANET, SEEDS, TAU, watchOf } from '../config.js';
import { isTended, plantHeight, plantTip, upgradeCost } from '../plants.js';
import { bar, glowDot, write } from './brush.js';

const PATCHES = [
  { x: -40, y: -30, r: 34 }, { x: 46, y: 22, r: 28 }, { x: -18, y: 54, r: 24 }, { x: 34, y: -58, r: 18 }, { x: -70, y: 26, r: 16 },
];

export function drawPlanet(ctx, game) {
  const { x, y, radius } = PLANET;
  glowDot(ctx, x, y, radius * 2.1, 'rgba(67, 224, 184, 0.30)');
  // The little world takes a little of each watch's light: teal at dusk, icy in the frost, warm near dawn.
  const watch = watchOf(game.night);
  const body = ctx.createRadialGradient(x - 38, y - 48, 10, x, y, radius);
  body.addColorStop(0, watch.planetLight);
  body.addColorStop(1, watch.planetDark);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(8, 60, 72, 0.45)';
  for (const patch of PATCHES) {
    ctx.beginPath();
    ctx.arc(x + patch.x, y + patch.y, patch.r, 0, TAU);
    ctx.fill();
  }
  // The world heart beats in the middle, fainter as the garden is hurt.
  const beat = 0.6 + 0.4 * Math.sin(game.time * 3);
  glowDot(ctx, x, y, 52 + beat * 6, game.health <= game.maxHealth * 0.3 ? COLORS.danger : COLORS.gold, 0.35 + 0.4 * (game.health / game.maxHealth));
  ctx.restore();

  ctx.strokeStyle = COLORS.soil;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(x, y, radius - 2, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(182, 243, 107, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius + 3, 0, TAU);
  ctx.stroke();
  drawGrassTufts(ctx, game);
}

// Little tufts of grass between the plots, swaying, so the world looks lived on.
function drawGrassTufts(ctx, game) {
  ctx.strokeStyle = COLORS.leaf;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let tuft = 0; tuft < PLANET.plotCount; tuft++) {
    const angle = -Math.PI / 2 + ((tuft + 0.5) * TAU) / PLANET.plotCount;
    ctx.save();
    ctx.translate(PLANET.x, PLANET.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.translate(0, -PLANET.radius - 2);
    const sway = Math.sin(game.time * 2.2 + tuft * 1.7) * 2;
    for (const blade of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(blade, 0);
      ctx.quadraticCurveTo(blade + sway * 0.5, -6, blade * 1.5 + sway, -11 - (blade === 0 ? 4 : 0));
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Draw with the plot's own frame: the origin on the surface, and -y pointing away from the planet.
function inPlotFrame(ctx, plot, draw) {
  ctx.save();
  ctx.translate(PLANET.x, PLANET.y);
  ctx.rotate(plot.angle + Math.PI / 2);
  ctx.translate(0, -PLANET.radius);
  draw();
  ctx.restore();
}

export function drawPlots(ctx, game) {
  for (const plot of game.plots) {
    const hovered = game.hoverPlot === plot.index && game.mode === 'playing';
    inPlotFrame(ctx, plot, () => {
      ctx.fillStyle = hovered ? '#7a5aa8' : COLORS.soil;
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 8, 0, 0, TAU);
      ctx.fill();
      if (!plot.plant && !hovered && game.mode === 'playing') {
        // An empty plot beckons with a faint plus sign.
        ctx.globalAlpha = 0.45 + 0.25 * Math.sin(game.time * 3 + plot.index);
        ctx.strokeStyle = COLORS.ice;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, -18);
        ctx.lineTo(6, -18);
        ctx.moveTo(0, -24);
        ctx.lineTo(0, -12);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (hovered && !plot.plant) {
        ctx.strokeStyle = SEEDS[game.selectedSeed].color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, -22, 15, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    if (plot.plant) drawPlant(ctx, game, plot, hovered);
    else if (hovered) {
      const seed = SEEDS[game.selectedSeed];
      const tip = plantTip(plot);
      write(ctx, `${seed.name} · ${seed.cost} dew`, tip.x, tip.y - 34, { size: 17, align: 'center', color: game.dew >= seed.cost ? seed.color : COLORS.danger, glow: '#000' });
    }
  }
}

function drawPlant(ctx, game, plot, hovered) {
  const plant = plot.plant;
  const seed = SEEDS[plant.kind];
  const height = plantHeight(plant) * plant.grow;
  const sway = Math.sin(game.time * 2 + plot.index) * 2.5;
  const tended = isTended(game, plot);
  inPlotFrame(ctx, plot, () => {
    ctx.strokeStyle = COLORS.leafDark;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway * 2, -height * 0.5, sway, -height);
    ctx.stroke();
    ctx.fillStyle = COLORS.leaf;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 9, -height * 0.35, 10, 4.5, side * -0.5, 0, TAU);
      ctx.fill();
    }
    ctx.translate(sway, -height);
    const scale = (0.8 + plant.level * 0.2) * (1 + plant.recoil * 0.25);
    ctx.scale(scale, scale);
    if (plant.kind === 'thorn') drawThornbud(ctx, plant, plot);
    else if (plant.kind === 'sun') drawSunpetal(ctx, game);
    else if (plant.kind === 'frost') drawFrostfern(ctx, game);
    else if (plant.kind === 'ember') drawEmberpod(ctx, plant, game);
    else if (plant.kind === 'bell') drawMoonbell(ctx, plant, game);
    else drawNovalily(ctx, plant);
  });

  const tip = plantTip(plot);
  if (tended) glowDot(ctx, tip.x, tip.y, 30, COLORS.gold, 0.5);
  if (plant.kind === 'frost') drawFrostAura(ctx, game, tip, seed.range[plant.level - 1] * (1 + game.boons.frostPower * 0.2));
  for (let pip = 0; pip < plant.level; pip++) {
    inPlotFrame(ctx, plot, () => {
      ctx.fillStyle = seed.color;
      ctx.beginPath();
      ctx.arc((pip - (plant.level - 1) / 2) * 8, 7, 2.6, 0, TAU);
      ctx.fill();
    });
  }
  const fullHealth = seed.health[plant.level - 1];
  if (plant.health < fullHealth) bar(ctx, tip.x - 18, tip.y - 30, 36, 5, plant.health / fullHealth, COLORS.danger);
  if (hovered) {
    const label = plant.level >= MAX_LEVEL ? `${seed.name} · full grown` : `Grow ${seed.name} · ${upgradeCost(plant)} dew`;
    const affordable = plant.level >= MAX_LEVEL || game.dew >= upgradeCost(plant);
    write(ctx, label, tip.x, tip.y - 44, { size: 17, align: 'center', color: affordable ? seed.color : COLORS.danger, glow: '#000' });
    const reach = seed.range ? seed.range[plant.level - 1] : seed.radius ? seed.radius[plant.level - 1] : 0;
    if (reach) {
      ctx.strokeStyle = seed.color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, reach, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

// A Frostfern's chill hangs in the air as a pale, slowly breathing disc out to its reach.
function drawFrostAura(ctx, game, tip, reach) {
  const breath = 0.85 + 0.15 * Math.sin(game.time * 1.6);
  const mist = ctx.createRadialGradient(tip.x, tip.y, reach * 0.2, tip.x, tip.y, reach);
  mist.addColorStop(0, 'rgba(155, 231, 255, 0.0)');
  mist.addColorStop(0.82, `rgba(155, 231, 255, ${0.085 * breath})`);
  mist.addColorStop(1, 'rgba(155, 231, 255, 0)');
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, reach, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(155, 231, 255, ${0.22 * breath})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 10]);
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, reach * 0.97, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawThornbud(ctx, plant, plot) {
  // The bud turns to face its target; the frame is already rotated, so undo the plot's turn.
  ctx.rotate(plant.aim - plot.angle);
  ctx.fillStyle = COLORS.leafDark;
  for (let spike = 0; spike < 7; spike++) {
    const turn = (spike / 7) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(turn - 0.25) * 9, Math.sin(turn - 0.25) * 9);
    ctx.lineTo(Math.cos(turn) * 18, Math.sin(turn) * 18);
    ctx.lineTo(Math.cos(turn + 0.25) * 9, Math.sin(turn + 0.25) * 9);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.leaf;
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, TAU);
  ctx.fill();
  // Frame trick: after the rotation above, "outward" is -y, so the mouth sits on that side.
  ctx.fillStyle = '#16321f';
  ctx.beginPath();
  ctx.arc(0, -6, 4.5, 0, TAU);
  ctx.fill();
}

function drawSunpetal(ctx, game) {
  ctx.rotate(game.time * 0.4);
  ctx.fillStyle = COLORS.gold;
  for (let petal = 0; petal < 8; petal++) {
    ctx.rotate(TAU / 8);
    ctx.beginPath();
    ctx.ellipse(0, -13, 5, 9, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.ember;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, TAU);
  ctx.fill();
  glowDot(ctx, 0, 0, 26, COLORS.gold, 0.5);
}

function drawFrostfern(ctx, game) {
  ctx.strokeStyle = COLORS.ice;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const lean of [-0.9, -0.45, 0, 0.45, 0.9]) {
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(Math.sin(lean) * 10, -8, Math.sin(lean) * 20, -6 - Math.cos(lean) * 14);
    ctx.stroke();
  }
  ctx.fillStyle = '#e8fbff';
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(5, -17);
  ctx.lineTo(0, -10);
  ctx.lineTo(-5, -17);
  ctx.fill();
  glowDot(ctx, 0, -12, 24 + Math.sin(game.time * 2) * 3, COLORS.ice, 0.4);
}

function drawNovalily(ctx, plant) {
  const seed = SEEDS.nova;
  const charge = 1 - Math.max(0, plant.timer) / seed.interval[plant.level - 1];
  ctx.fillStyle = COLORS.nova;
  for (let point = 0; point < 5; point++) {
    const turn = (point / 5) * TAU - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(turn - 0.5) * 6, Math.sin(turn - 0.5) * 6);
    ctx.lineTo(Math.cos(turn) * 19, Math.sin(turn) * 19);
    ctx.lineTo(Math.cos(turn + 0.5) * 6, Math.sin(turn + 0.5) * 6);
    ctx.fill();
  }
  ctx.fillStyle = '#fff3fb';
  ctx.beginPath();
  ctx.arc(0, 0, 3 + charge * 4, 0, TAU);
  ctx.fill();
  glowDot(ctx, 0, 0, 14 + charge * 20, COLORS.nova, 0.35 + charge * 0.4);
}

// A squat orange pod with a smouldering mouth; it swells as its next ember is nearly ready.
function drawEmberpod(ctx, plant, game) {
  const charge = 1 - Math.max(0, plant.timer) / SEEDS.ember.interval[plant.level - 1];
  ctx.fillStyle = '#b5532a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = COLORS.ember;
  for (const rib of [-7, 0, 7]) {
    ctx.beginPath();
    ctx.ellipse(rib, 1, 3.2, 12, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#2b0f08';
  ctx.beginPath();
  ctx.ellipse(0, -11, 8, 4.5, 0, 0, TAU);
  ctx.fill();
  glowDot(ctx, 0, -11, 9 + charge * 14 + Math.sin(game.time * 9) * 1.5, COLORS.gold, 0.5 + charge * 0.4);
}

// A drooping pale bell on a hooked stalk, with a soft halo that swells when it rings.
function drawMoonbell(ctx, plant, game) {
  const sway = Math.sin(game.time * 2.4) * 0.12 + plant.recoil * 0.5;
  ctx.rotate(sway);
  ctx.strokeStyle = COLORS.leaf;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.quadraticCurveTo(0, -14, 10, -10);
  ctx.stroke();
  ctx.fillStyle = '#c9b8ff';
  ctx.beginPath();
  ctx.moveTo(10, -12);
  ctx.quadraticCurveTo(24, -8, 22, 8);
  ctx.lineTo(-2, 8);
  ctx.quadraticCurveTo(-4, -8, 10, -12);
  ctx.fill();
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath();
  ctx.arc(10, 10, 3.2, 0, TAU);
  ctx.fill();
  glowDot(ctx, 10, 0, 22 + plant.recoil * 16, '#c9b8ff', 0.45);
}

// A small picture of a seed for the seed bar and the title screen.
export function drawSeedIcon(ctx, kind, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (kind === 'thorn') drawThornbud(ctx, { aim: 0 }, { angle: 0 });
  else if (kind === 'sun') drawSunpetal(ctx, { time: 0 });
  else if (kind === 'frost') {
    ctx.translate(0, 10);
    drawFrostfern(ctx, { time: 0 });
  } else if (kind === 'ember') drawEmberpod(ctx, { timer: 0, level: 1 }, { time: 0 });
  else if (kind === 'bell') {
    ctx.translate(-9, 0);
    drawMoonbell(ctx, { recoil: 0 }, { time: 0 });
  } else drawNovalily(ctx, { timer: 0, level: 1 });
  ctx.restore();
}
