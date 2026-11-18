// Full-screen layers over the garden: the title, the boon choice, the pause veil and the results.

import { BOSS_NIGHTS, COLORS, NIGHTS, SEEDS, SEED_ORDER, VIEW } from '../config.js';
import { gardenerRank } from '../simulation.js';
import { newThreat, nightName } from '../waves.js';
import { glowDot, panel, paragraph, write } from './brush.js';
import { drawSeedIcon } from './garden.js';

const MIDDLE = VIEW.width / 2;
const BOON_CARD = { width: 300, height: 290, gap: 36, y: 262 };

function veil(ctx, strength) {
  ctx.fillStyle = `rgba(5, 7, 24, ${strength})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function logo(ctx, y, size) {
  const ink = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  ink.addColorStop(0, '#fff6c9');
  ink.addColorStop(0.5, COLORS.gold);
  ink.addColorStop(1, COLORS.leaf);
  write(ctx, 'ORBLOOM', MIDDLE + size * 0.08, y, { size, weight: 800, align: 'center', color: ink, spacing: size * 0.16, glow: 'rgba(255, 209, 102, 0.8)' });
}

export function drawTitle(ctx, game) {
  veil(ctx, 0.38);
  logo(ctx, 112, 118);
  write(ctx, 'Grow a garden on a tiny world. Hold back the Gloam for twelve nights.', MIDDLE, 198, { size: 24, align: 'center', color: COLORS.ink });

  panel(ctx, 40, 262, 380, 390);
  write(ctx, 'HOW TO PLAY', 64, 296, { size: 20, weight: 800, color: COLORS.gold, spacing: 3 });
  const steps = [
    ['CLICK', 'a plot to plant the chosen seed'],
    ['CLICK', 'a plant again to grow it (3 levels)'],
    ['1 – 4', 'choose a seed · right-click uproots'],
    ['A / D', 'walk Pip around the world'],
    ['SPACE', 'swing the lantern: a shock pulse'],
    ['GOAL', 'gather dew, guard the world heart'],
    ['WIN', `survive all ${NIGHTS} nights to see dawn`],
  ];
  steps.forEach(([key, text], index) => {
    const y = 340 + index * 43;
    panel(ctx, 64, y - 15, 74, 30, { fill: 'rgba(155, 231, 255, 0.12)', radius: 8 });
    write(ctx, key, 101, y, { size: 15, weight: 800, align: 'center', color: COLORS.ice });
    write(ctx, text, 150, y, { size: 16, color: COLORS.ink });
  });

  panel(ctx, 860, 262, 380, 390);
  write(ctx, 'YOUR SEEDS', 884, 296, { size: 20, weight: 800, color: COLORS.gold, spacing: 3 });
  SEED_ORDER.forEach((kind, index) => {
    const seed = SEEDS[kind];
    const y = 352 + index * 76;
    drawSeedIcon(ctx, kind, 916, y, 1.1);
    write(ctx, `${seed.name}`, 956, y - 12, { size: 19, weight: 800, color: seed.color });
    write(ctx, `${seed.cost} dew`, 1216, y - 12, { size: 15, align: 'right', color: COLORS.dim });
    write(ctx, seed.blurb, 956, y + 13, { size: 15, color: COLORS.ink });
  });

  const pulse = 0.85 + 0.15 * Math.sin(game.time * 4);
  panel(ctx, MIDDLE - 250, 684, 500, 58, { fill: 'rgba(54, 40, 12, 0.94)', edge: COLORS.gold, radius: 29, line: 2.5 });
  write(ctx, 'CLICK or press ENTER to begin', MIDDLE, 714, { size: 26, weight: 800, align: 'center', color: COLORS.gold, alpha: pulse, glow: COLORS.gold });
  write(ctx, game.best > 0 ? `Best garden: ${game.best.toLocaleString('en-US')} points` : 'Twelve nights · four seeds · eleven boons · two eclipses', MIDDLE, 768, { size: 17, align: 'center', color: COLORS.dim });
}

export function boonCardRects() {
  const total = 3 * BOON_CARD.width + 2 * BOON_CARD.gap;
  const left = (VIEW.width - total) / 2;
  return [0, 1, 2].map((index) => ({ index, x: left + index * (BOON_CARD.width + BOON_CARD.gap), y: BOON_CARD.y, width: BOON_CARD.width, height: BOON_CARD.height }));
}

const BOON_TINTS = { heart: COLORS.danger, drop: COLORS.ice, thorn: COLORS.leaf, lantern: COLORS.gold, boot: COLORS.ember, basket: COLORS.ice, frost: COLORS.ice, nova: COLORS.nova, leaf: COLORS.leaf, sun: COLORS.gold, rain: COLORS.ice };

export function drawBoonChoice(ctx, game, pointer) {
  veil(ctx, 0.62);
  write(ctx, `NIGHT ${game.night} SURVIVED`, MIDDLE, 118, { size: 54, weight: 800, align: 'center', color: COLORS.gold, spacing: 6, glow: 'rgba(255, 209, 102, 0.7)' });
  write(ctx, `+${game.night * 100} points  ·  the garden offers a boon — choose one`, MIDDLE, 178, { size: 24, align: 'center', color: COLORS.ink });
  for (const card of boonCardRects()) {
    const boon = game.boonChoices[card.index];
    if (!boon) continue;
    const tint = BOON_TINTS[boon.icon] ?? COLORS.ice;
    const hot = pointer.x >= card.x && pointer.x <= card.x + card.width && pointer.y >= card.y && pointer.y <= card.y + card.height;
    panel(ctx, card.x, card.y - (hot ? 8 : 0), card.width, card.height, { fill: hot ? 'rgba(40, 52, 110, 0.97)' : 'rgba(14, 20, 54, 0.95)', edge: tint, line: hot ? 4 : 2, radius: 20 });
    const top = card.y - (hot ? 8 : 0);
    const cx = card.x + card.width / 2;
    glowDot(ctx, cx, top + 84, 62, tint, 0.85);
    ctx.fillStyle = '#0b1030';
    ctx.beginPath();
    ctx.arc(cx, top + 84, 30, 0, Math.PI * 2);
    ctx.fill();
    write(ctx, String(card.index + 1), cx, top + 86, { size: 32, weight: 800, align: 'center', color: tint });
    write(ctx, boon.name, cx, top + 166, { size: 28, weight: 800, align: 'center', color: tint });
    paragraph(ctx, boon.text, cx, top + 212, card.width - 48, { size: 19, color: COLORS.ink });
  }
  write(ctx, 'Click a card, or press 1, 2 or 3', MIDDLE, 584, { size: 20, weight: 700, align: 'center', color: COLORS.dim });
  drawNightPath(ctx, game);
}

// The road to dawn: twelve nights in a row, the ones survived lit, the Eclipse nights marked, and what comes next.
function drawNightPath(ctx, game) {
  const spacing = 62;
  const left = MIDDLE - ((NIGHTS - 1) * spacing) / 2;
  const y = 632;
  ctx.strokeStyle = 'rgba(155, 231, 255, 0.3)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(left + (NIGHTS - 1) * spacing, y);
  ctx.stroke();
  for (let night = 1; night <= NIGHTS; night++) {
    const x = left + (night - 1) * spacing;
    const boss = BOSS_NIGHTS.includes(night);
    const done = night <= game.night;
    const next = night === game.night + 1;
    const radius = boss ? 17 : 12;
    if (next) glowDot(ctx, x, y, 40, COLORS.nova, 0.6 + 0.3 * Math.sin(game.time * 5));
    ctx.fillStyle = done ? COLORS.gold : boss ? '#0a0416' : '#1a2152';
    ctx.strokeStyle = boss ? COLORS.eye : next ? COLORS.nova : done ? COLORS.gold : COLORS.panelEdge;
    ctx.lineWidth = boss || next ? 3 : 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    write(ctx, String(night), x, y + 1, { size: 13, weight: 800, align: 'center', color: done ? '#2b1d4a' : boss ? COLORS.eye : COLORS.dim });
  }
  write(ctx, 'DUSK', left - 44, y, { size: 13, weight: 800, align: 'center', color: COLORS.dim, spacing: 2 });
  write(ctx, 'DAWN', left + (NIGHTS - 1) * spacing + 46, y, { size: 13, weight: 800, align: 'center', color: COLORS.gold, spacing: 2 });
  const threat = newThreat(game.night + 1);
  const intel = threat ? `  ·  new: ${threat.name}, ${threat.lore}` : '';
  write(ctx, `Next — night ${game.night + 1}: ${nightName(game.night + 1)}${intel}`, MIDDLE, 672, { size: 17, weight: 700, align: 'center', color: COLORS.nova });
}

export function drawPause(ctx) {
  veil(ctx, 0.6);
  write(ctx, 'PAUSED', MIDDLE, 340, { size: 84, weight: 800, align: 'center', color: COLORS.ink, spacing: 12, glow: COLORS.gloamEdge });
  write(ctx, 'P to resume  ·  R to start a new garden  ·  M to mute', MIDDLE, 420, { size: 24, align: 'center', color: COLORS.dim });
}

export function drawResults(ctx, game) {
  const won = game.mode === 'won';
  veil(ctx, 0.66);
  if (won) glowDot(ctx, MIDDLE, 860, 640, 'rgba(255, 190, 90, 0.55)');
  const tint = won ? COLORS.gold : COLORS.danger;
  write(ctx, won ? 'DAWN BREAKS' : 'THE GARDEN FELL', MIDDLE, 108, { size: 84, weight: 800, align: 'center', color: tint, spacing: 8, glow: tint });
  write(ctx, won ? `You held back the Gloam for all ${NIGHTS} nights. The garden lives!` : `The Gloam reached the world heart on night ${game.night} of ${NIGHTS}.`, MIDDLE, 178, { size: 24, align: 'center', color: COLORS.ink });

  panel(ctx, MIDDLE - 330, 222, 660, 372, { radius: 22, edge: tint, line: 2.5 });
  write(ctx, 'FINAL SCORE', MIDDLE, 258, { size: 18, weight: 700, align: 'center', color: COLORS.dim, spacing: 4 });
  write(ctx, game.score.toLocaleString('en-US'), MIDDLE, 314, { size: 78, weight: 800, align: 'center', color: COLORS.gold, glow: 'rgba(255, 209, 102, 0.6)' });
  write(ctx, game.newBest ? '★ NEW BEST ★' : `best ${game.best.toLocaleString('en-US')}`, MIDDLE, 370, { size: 20, weight: 800, align: 'center', color: game.newBest ? COLORS.nova : COLORS.dim, spacing: 2 });
  write(ctx, `Rank: ${gardenerRank(game)}`, MIDDLE, 408, { size: 24, weight: 800, align: 'center', color: COLORS.leaf });

  const stats = [
    ['Nights survived', `${game.stats.nights} / ${NIGHTS}`],
    ['Gloam banished', String(game.stats.kills)],
    ['Seeds planted', String(game.stats.planted)],
    ['Dew gathered', String(game.stats.dewGathered)],
    ['Boons taken', String(game.boons.taken.length)],
    ['World heart', `${Math.ceil(game.health)} / ${game.maxHealth}`],
  ];
  stats.forEach(([label, value], index) => {
    const x = MIDDLE - 290 + (index % 2) * 300;
    const y = 458 + Math.floor(index / 2) * 42;
    write(ctx, label, x, y, { size: 19, color: COLORS.dim });
    write(ctx, value, x + 270, y, { size: 21, weight: 800, align: 'right', color: COLORS.ink });
  });

  const pulse = 0.85 + 0.15 * Math.sin(game.time * 4);
  panel(ctx, MIDDLE - 290, 632, 580, 60, { fill: 'rgba(54, 40, 12, 0.94)', edge: COLORS.gold, radius: 30, line: 2.5 });
  write(ctx, 'Press R or CLICK to plant a new garden', MIDDLE, 663, { size: 26, weight: 800, align: 'center', color: COLORS.gold, alpha: pulse, glow: COLORS.gold });
}
