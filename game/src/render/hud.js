// The heads-up display during play: night, world heart, score and combo, dew, the seed bar and the lantern.

import { BOSS_NIGHTS, COLORS, GLOAM, NIGHTS, PLANET, SEEDS, SEED_ORDER, VIEW, watchOf } from '../config.js';
import { BOONS, boonTint } from '../boons.js';
import { wishProgress } from '../wishes.js';
import { SONG_COOLDOWN, pulseCooldown } from '../gardener.js';
import { newThreat, nightName, nightProgress } from '../waves.js';
import { FONT, bar, glowDot, panel, write } from './brush.js';
import { drawSeedIcon } from './garden.js';

const CARD = { width: 121, height: 74, gap: 8, y: 712 };
const SIDE_PANEL = 226;

export function seedCardRects() {
  const total = SEED_ORDER.length * CARD.width + (SEED_ORDER.length - 1) * CARD.gap;
  const left = (VIEW.width - total) / 2;
  return SEED_ORDER.map((kind, index) => ({ kind, x: left + index * (CARD.width + CARD.gap), y: CARD.y, width: CARD.width, height: CARD.height }));
}

export function drawHud(ctx, game) {
  drawFrontWarnings(ctx, game);
  drawCoach(ctx, game);
  drawNightPanel(ctx, game);
  drawHeartPanel(ctx, game);
  drawGoalRows(ctx, game);
  drawScorePanel(ctx, game);
  drawWishPanel(ctx, game);
  drawIncoming(ctx, game);
  drawDewPanel(ctx, game);
  drawSeedBar(ctx, game);
  drawLanternPanel(ctx, game);
  drawBossBar(ctx, game);
  drawBanner(ctx, game);
  if (game.mode === 'playing') drawKeyLegend(ctx);
}

// Red chevrons at the edge of the sky show where tonight's Gloam is coming from, while more are due.
function drawFrontWarnings(ctx, game) {
  if (game.mode !== 'playing' || game.wave.queue.length === 0) return;
  const beat = 0.8 + 0.2 * Math.sin(game.time * 6);
  for (const front of game.wave.fronts) {
    const reach = Math.min(560 / Math.abs(Math.cos(front) || 0.001), 258 / Math.abs(Math.sin(front) || 0.001));
    const x = PLANET.x + Math.cos(front) * reach;
    const y = PLANET.y - 46 + Math.sin(front) * reach;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(front + Math.PI);
    ctx.globalAlpha = beat;
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const step of [0, 14]) {
      ctx.beginPath();
      ctx.moveTo(step - 8, -13);
      ctx.lineTo(step + 5, 0);
      ctx.lineTo(step - 8, 13);
      ctx.stroke();
    }
    ctx.restore();
    glowDot(ctx, x, y, 34, COLORS.danger, 0.35 * beat);
  }
}

// First-night coaching: one short line telling a new player what to do next.
function drawCoach(ctx, game) {
  if (game.mode !== 'playing' || game.night !== 1 || game.banner.timer > 0) return;
  let tip = '';
  if (game.stats.planted === 0) tip = 'Click a plot on the little world to plant your first Thornbud';
  else if (game.stats.planted < 3) tip = 'Plant where the red arrows point — that is where the Gloam will fall';
  else if (game.stats.dewGathered === 0) tip = 'Walk with A / D to gather fallen dew  ·  SPACE swings the lantern';
  if (!tip) return;
  const width = 660;
  panel(ctx, VIEW.width / 2 - width / 2, 160, width, 44, { radius: 22, edge: COLORS.gold });
  write(ctx, tip, VIEW.width / 2, 183, { size: 19, weight: 700, align: 'center', color: COLORS.gold, alpha: 0.8 + 0.2 * Math.sin(game.time * 5) });
}

function drawNightPanel(ctx, game) {
  panel(ctx, 20, 16, 300, 104);
  write(ctx, `NIGHT ${game.night}/${NIGHTS}`, 38, 46, { size: 25, weight: 800, color: COLORS.ice });
  const watch = watchOf(game.night);
  write(ctx, watch.name, 302, 36, { size: 15, weight: 800, align: 'right', color: watch.tint });
  write(ctx, nightName(game.night), 302, 58, { size: 13, align: 'right', color: COLORS.dim });
  bar(ctx, 38, 78, 264, 9, nightProgress(game), COLORS.ice);
  drawNightPips(ctx, game);
  drawBoonList(ctx, game);
}

function drawHeartPanel(ctx, game) {
  panel(ctx, 440, 16, 400, 62);
  const share = game.health / game.maxHealth;
  const color = share > 0.5 ? COLORS.leaf : share > 0.25 ? COLORS.gold : COLORS.danger;
  write(ctx, 'WORLD HEART', 458, 36, { size: 15, weight: 700, color: COLORS.dim, spacing: 2 });
  write(ctx, `${Math.ceil(game.health)} / ${game.maxHealth}`, 822, 36, { size: 18, align: 'right', weight: 800, color });
  bar(ctx, 458, 52, 364, 13, share, color);
}

function drawScorePanel(ctx, game) {
  panel(ctx, 960, 16, 300, 86);
  write(ctx, `SCORE · ${game.difficulty.name.toUpperCase()}`, 978, 38, { size: 14, weight: 700, color: COLORS.dim, spacing: 1 });
  write(ctx, game.score.toLocaleString('en-US'), 1242, 42, { size: 30, weight: 800, align: 'right', color: COLORS.gold });
  if (game.combo > 1) write(ctx, `COMBO ×${game.combo}`, 978, 78, { size: 19, weight: 800, color: COLORS.nova, glow: COLORS.nova });
  else write(ctx, 'chain kills for a combo', 978, 78, { size: 14, color: COLORS.dim });
  write(ctx, `best ${Math.max(game.best, game.score).toLocaleString('en-US')}`, 1242, 78, { size: 15, align: 'right', color: COLORS.dim });
}

// Tonight's wish sits under the score: what the garden asks for, how far along it is, and what it pays.
function drawWishPanel(ctx, game) {
  const wish = game.wish;
  if (!wish) return;
  const tint = wish.granted ? COLORS.gold : COLORS.nova;
  panel(ctx, 960, 110, 300, 52, { edge: tint, radius: 12 });
  write(ctx, wish.granted ? 'WISH GRANTED' : 'TONIGHT\'S WISH', 976, 126, { size: 13, weight: 800, color: tint, spacing: 2 });
  write(ctx, `+${wish.reward} dew`, 1244, 126, { size: 14, weight: 800, align: 'right', color: COLORS.ice });
  write(ctx, wish.text, 976, 147, { size: 16, weight: 700, color: COLORS.ink });
  if (!wish.kind.atDawn) write(ctx, `${wishProgress(game)}/${wish.goal}`, 1244, 147, { size: 15, weight: 800, align: 'right', color: tint });
}

function drawDewPanel(ctx, game) {
  panel(ctx, 20, CARD.y, SIDE_PANEL, CARD.height);
  glowDot(ctx, 56, CARD.y + 37, 26, COLORS.ice, 0.8);
  ctx.fillStyle = '#eaffff';
  ctx.beginPath();
  ctx.arc(56, CARD.y + 37, 9, 0, Math.PI * 2);
  ctx.fill();
  write(ctx, 'DEW', 84, CARD.y + 22, { size: 15, weight: 700, color: COLORS.dim, spacing: 2 });
  write(ctx, String(Math.floor(game.dew)), 84, CARD.y + 48, { size: 30, weight: 800, color: COLORS.ice });
}

function drawSeedBar(ctx, game) {
  for (const card of seedCardRects()) {
    const seed = SEEDS[card.kind];
    const chosen = game.selectedSeed === card.kind;
    const affordable = game.dew >= seed.cost;
    panel(ctx, card.x, card.y, card.width, card.height, {
      fill: chosen ? 'rgba(40, 52, 110, 0.95)' : COLORS.panel, edge: chosen ? seed.color : COLORS.panelEdge, line: chosen ? 3 : 1.5,
    });
    ctx.save();
    ctx.globalAlpha = affordable ? 1 : 0.4;
    drawSeedIcon(ctx, card.kind, card.x + 26, card.y + 30, 0.9);
    write(ctx, seed.name, card.x + card.width / 2, card.y + 58, { size: 14, weight: 800, align: 'center', color: seed.color });
    write(ctx, `${seed.cost}`, card.x + 62, card.y + 30, { size: 22, weight: 800, color: affordable ? COLORS.ice : COLORS.danger });
    ctx.restore();
    write(ctx, seed.key, card.x + card.width - 13, card.y + 14, { size: 14, weight: 800, align: 'center', color: COLORS.dim });
  }
}

function drawLanternPanel(ctx, game) {
  const x = VIEW.width - 20 - SIDE_PANEL;
  panel(ctx, x, CARD.y, SIDE_PANEL, CARD.height);
  // Pip's two gifts, one row each: the lantern pulse on SPACE and the Dew Song on E.
  const gifts = [
    { key: 'SPACE', name: 'Lantern', color: COLORS.gold, left: game.gardener.pulseTimer, full: pulseCooldown(game) },
    { key: 'E', name: 'Dew Song', color: COLORS.leaf, left: game.gardener.songTimer, full: SONG_COOLDOWN },
  ];
  gifts.forEach((gift, row) => {
    const y = CARD.y + 21 + row * 33;
    const ready = gift.left <= 0;
    glowDot(ctx, x + 22, y, ready ? 17 : 8, gift.color, ready ? 0.9 : 0.4);
    panel(ctx, x + 40, y - 11, 52, 22, { fill: 'rgba(155, 231, 255, 0.12)', radius: 6, edge: null });
    write(ctx, gift.key, x + 66, y + 1, { size: 12, weight: 800, align: 'center', color: COLORS.ice });
    write(ctx, gift.name, x + 100, y - 4, { size: 15, weight: 800, color: ready ? gift.color : COLORS.dim });
    bar(ctx, x + 100, y + 8, 110, 5, 1 - gift.left / gift.full, gift.color);
  });
}

// The boons gathered so far, by name, in a list down the left edge (a boon taken twice shows ×2).
function drawBoonList(ctx, game) {
  const counts = new Map();
  for (const id of game.boons.taken) counts.set(id, (counts.get(id) ?? 0) + 1);
  const rows = [...counts.entries()].slice(-12);
  panel(ctx, 20, 130, 212, 34 + Math.max(1, rows.length) * 20, { radius: 12 });
  write(ctx, `BOONS ${game.boons.taken.length} · OF ${BOONS.length} KINDS`, 34, 148, { size: 12, weight: 800, color: COLORS.gold, spacing: 1 });
  if (rows.length === 0) write(ctx, 'survive a night to earn one', 34, 170, { size: 13, color: COLORS.dim });
  rows.forEach(([id, count], index) => {
    const boon = BOONS.find((entry) => entry.id === id);
    const y = 170 + index * 20;
    ctx.fillStyle = boonTint(boon);
    ctx.beginPath();
    ctx.arc(40, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    write(ctx, count > 1 ? `${boon.name} ×${count}` : boon.name, 54, y, { size: 14, weight: 700, color: COLORS.ink });
  });
}

// The goal, always on screen: how the run is won and how it is lost.
function drawGoalRows(ctx, game) {
  const rows = [
    { tag: 'WIN', color: COLORS.leaf, text: `hold the garden for all ${NIGHTS} nights, until dawn` },
    { tag: 'LOSE', color: COLORS.danger, text: 'the Gloam bite the world heart down to 0' },
  ];
  rows.forEach((row, index) => {
    const y = 84 + index * 24;
    panel(ctx, 440, y, 400, 21, { radius: 6, edge: null, fill: 'rgba(10, 14, 40, 0.8)' });
    panel(ctx, 440, y, 56, 21, { radius: 6, edge: null, fill: row.color });
    write(ctx, row.tag, 468, y + 11, { size: 13, weight: 800, align: 'center', color: '#0b1030' });
    write(ctx, row.text, 506, y + 11, { size: 14, weight: 700, color: COLORS.ink });
  });
}

// What is still to come tonight, breed by breed, and how many Gloam are in the sky right now.
function drawIncoming(ctx, game) {
  const counts = new Map();
  for (const entry of game.wave.queue) counts.set(entry.kind, (counts.get(entry.kind) ?? 0) + 1);
  const kinds = Object.keys(GLOAM).filter((kind) => counts.has(kind));
  const lines = Math.max(1, Math.ceil(kinds.length / 2));
  panel(ctx, 960, 170, 300, 32 + lines * 20, { radius: 12 });
  write(ctx, `INCOMING ${game.wave.queue.length}`, 976, 187, { size: 12, weight: 800, color: COLORS.danger, spacing: 1 });
  write(ctx, `in the sky ${game.enemies.length}`, 1244, 187, { size: 13, weight: 700, align: 'right', color: COLORS.dim });
  if (kinds.length === 0) write(ctx, 'the last of them: finish the night!', 976, 208, { size: 13, color: COLORS.ink });
  kinds.forEach((kind, index) => {
    const breed = GLOAM[kind];
    const x = 976 + (index % 2) * 142;
    const y = 208 + Math.floor(index / 2) * 20;
    ctx.fillStyle = breed.tint;
    ctx.beginPath();
    ctx.arc(x + 5, y, 5, 0, Math.PI * 2);
    ctx.fill();
    write(ctx, `${breed.name} ×${counts.get(kind)}`, x + 16, y, { size: 14, weight: 700, color: COLORS.ink });
  });
}

const KEY_LEGEND = [
  ['A / D', 'walk'], ['CLICK', 'plant · grow'], ['1–6', 'seed'], ['SPACE', 'lantern'], ['E', 'dew song'],
  ['RIGHT-CLICK', 'uproot'], ['P', 'pause'], ['M', 'sound'],
];

// The controls as a row of keycaps along the bottom, above the seed bar.
function drawKeyLegend(ctx) {
  ctx.save();
  ctx.font = `800 13px ${FONT}`;
  const pad = 8;
  const gap = 18;
  const widths = KEY_LEGEND.map(([key, label]) => ctx.measureText(key).width + pad * 2 + 7 + ctx.measureText(label).width);
  ctx.restore();
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * (KEY_LEGEND.length - 1);
  let x = (VIEW.width - total) / 2;
  panel(ctx, x - 14, 677, total + 28, 32, { radius: 10, fill: 'rgba(10, 14, 40, 0.86)', edge: null });
  KEY_LEGEND.forEach(([key, label], index) => {
    ctx.save();
    ctx.font = `800 13px ${FONT}`;
    const cap = ctx.measureText(key).width + pad * 2;
    ctx.restore();
    panel(ctx, x, 682, cap, 22, { radius: 6, fill: 'rgba(155, 231, 255, 0.16)', edge: 'rgba(155, 231, 255, 0.5)', line: 1 });
    write(ctx, key, x + cap / 2, 694, { size: 13, weight: 800, align: 'center', color: COLORS.ice });
    write(ctx, label, x + cap + 7, 694, { size: 13, weight: 800, color: COLORS.ink });
    x += widths[index] + gap;
  });
}

// Twelve pips along the bottom of the night panel: nights survived, tonight, and the Eclipse nights.
function drawNightPips(ctx, game) {
  for (let night = 1; night <= NIGHTS; night++) {
    const x = 44 + (night - 1) * 23;
    const boss = BOSS_NIGHTS.includes(night);
    ctx.fillStyle = night < game.night ? COLORS.gold : night === game.night ? COLORS.ice : boss ? COLORS.eye : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.arc(x, 104, boss ? 5.5 : night === game.night ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBossBar(ctx, game) {
  const boss = game.enemies.find((enemy) => enemy.kind === 'eclipse');
  if (!boss) return;
  panel(ctx, 428, 134, 424, 40, { radius: 10, fill: 'rgba(10, 14, 40, 0.86)', edge: null });
  write(ctx, `BOSS · THE ECLIPSE · ${Math.ceil((boss.health / boss.maxHealth) * 100)}%`, VIEW.width / 2, 146, { size: 15, weight: 800, align: 'center', color: COLORS.eye, spacing: 3 });
  bar(ctx, 440, 158, 400, 10, boss.health / boss.maxHealth, COLORS.eye);
}

function drawBanner(ctx, game) {
  if (game.mode !== 'playing' || game.banner.timer <= 0 || !game.banner.text) return;
  const alpha = Math.min(1, game.banner.timer / 0.5);
  write(ctx, game.banner.text, VIEW.width / 2, 176, { size: 46, weight: 800, align: 'center', color: COLORS.ink, spacing: 6, alpha, glow: COLORS.gloamEdge });
  write(ctx, game.banner.sub, VIEW.width / 2, 216, { size: 22, align: 'center', color: COLORS.nova, alpha, spacing: 2 });
  const threat = newThreat(game.night);
  if (threat) write(ctx, `New tonight: ${threat.name} — ${threat.lore}`, VIEW.width / 2, 250, { size: 18, align: 'center', color: COLORS.ink, alpha });
  const watch = watchOf(game.night);
  if (game.night % 4 === 1) write(ctx, `${watch.name} begins — ${watch.lore}`, VIEW.width / 2, 280, { size: 18, weight: 700, align: 'center', color: watch.tint, alpha });
}
