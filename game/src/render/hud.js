// The heads-up display during play: night, world heart, score and combo, dew, the seed bar and the lantern.

import { COLORS, NIGHTS, PLANET, SEEDS, SEED_ORDER, VIEW } from '../config.js';
import { pulseCooldown } from '../gardener.js';
import { newThreat, nightName, nightProgress } from '../waves.js';
import { bar, glowDot, panel, write } from './brush.js';
import { drawSeedIcon } from './garden.js';

const CARD = { width: 168, height: 74, gap: 10, y: 712 };

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
  drawScorePanel(ctx, game);
  drawDewPanel(ctx, game);
  drawSeedBar(ctx, game);
  drawLanternPanel(ctx, game);
  drawBossBar(ctx, game);
  drawBanner(ctx, game);
  if (game.mode === 'playing') {
    write(ctx, 'A / D walk  ·  SPACE lantern  ·  click a plot to plant or grow  ·  right-click uproots  ·  P pause  ·  M mute', VIEW.width / 2, 694, { size: 14, align: 'center', color: COLORS.dim });
  }
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
  panel(ctx, 20, 16, 300, 86);
  write(ctx, `NIGHT ${game.night}`, 38, 44, { size: 30, weight: 800, color: COLORS.ice, spacing: 1 });
  write(ctx, `of ${NIGHTS}`, 302, 40, { size: 18, align: 'right', color: COLORS.dim });
  write(ctx, nightName(game.night), 302, 62, { size: 15, align: 'right', color: COLORS.nova });
  bar(ctx, 38, 78, 264, 9, nightProgress(game), COLORS.ice);
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
  write(ctx, 'SCORE', 978, 38, { size: 15, weight: 700, color: COLORS.dim, spacing: 2 });
  write(ctx, game.score.toLocaleString('en-US'), 1242, 42, { size: 30, weight: 800, align: 'right', color: COLORS.gold });
  if (game.combo > 1) write(ctx, `COMBO ×${game.combo}`, 978, 78, { size: 19, weight: 800, color: COLORS.nova, glow: COLORS.nova });
  else write(ctx, 'chain kills for a combo', 978, 78, { size: 14, color: COLORS.dim });
  write(ctx, `best ${Math.max(game.best, game.score).toLocaleString('en-US')}`, 1242, 78, { size: 15, align: 'right', color: COLORS.dim });
}

function drawDewPanel(ctx, game) {
  panel(ctx, 20, CARD.y, 236, CARD.height);
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
    drawSeedIcon(ctx, card.kind, card.x + 34, card.y + 38, 1.05);
    write(ctx, seed.name, card.x + 66, card.y + 24, { size: 18, weight: 800, color: seed.color });
    write(ctx, `${seed.cost} dew`, card.x + 66, card.y + 50, { size: 16, color: affordable ? COLORS.ink : COLORS.danger });
    ctx.restore();
    write(ctx, seed.key, card.x + card.width - 16, card.y + 16, { size: 15, weight: 800, align: 'center', color: COLORS.dim });
  }
}

function drawLanternPanel(ctx, game) {
  const x = VIEW.width - 256;
  panel(ctx, x, CARD.y, 236, CARD.height);
  const ready = game.gardener.pulseTimer <= 0;
  glowDot(ctx, x + 36, CARD.y + 37, ready ? 28 : 12, COLORS.gold, ready ? 0.9 : 0.4);
  write(ctx, 'LANTERN', x + 66, CARD.y + 22, { size: 15, weight: 700, color: COLORS.dim, spacing: 2 });
  write(ctx, ready ? 'SPACE · ready!' : 'recharging…', x + 66, CARD.y + 44, { size: 18, weight: 800, color: ready ? COLORS.gold : COLORS.dim });
  bar(ctx, x + 66, CARD.y + 58, 150, 6, 1 - game.gardener.pulseTimer / pulseCooldown(game), COLORS.gold);
}

function drawBossBar(ctx, game) {
  const boss = game.enemies.find((enemy) => enemy.kind === 'eclipse');
  if (!boss) return;
  write(ctx, 'THE ECLIPSE', VIEW.width / 2, 98, { size: 16, weight: 800, align: 'center', color: COLORS.eye, spacing: 4, glow: COLORS.eye });
  bar(ctx, 440, 110, 400, 10, boss.health / boss.maxHealth, COLORS.eye);
}

function drawBanner(ctx, game) {
  if (game.mode !== 'playing' || game.banner.timer <= 0 || !game.banner.text) return;
  const alpha = Math.min(1, game.banner.timer / 0.5);
  write(ctx, game.banner.text, VIEW.width / 2, 176, { size: 46, weight: 800, align: 'center', color: COLORS.ink, spacing: 6, alpha, glow: COLORS.gloamEdge });
  write(ctx, game.banner.sub, VIEW.width / 2, 216, { size: 22, align: 'center', color: COLORS.nova, alpha, spacing: 2 });
  const threat = newThreat(game.night);
  if (threat) write(ctx, `New tonight: ${threat.name} — ${threat.lore}`, VIEW.width / 2, 250, { size: 18, align: 'center', color: COLORS.ink, alpha });
}
