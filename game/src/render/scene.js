// One frame, back to front: sky, world, garden, creatures, sparks, then the HUD and any screen on top.

import { COLORS, VIEW } from '../config.js';
import { drawSky } from './sky.js';
import { drawPlanet, drawPlots } from './garden.js';
import { drawEnemies, drawGardener } from './creatures.js';
import { drawDew, drawEmbers, drawSparks, drawThorns } from './sparks.js';
import { drawHud } from './hud.js';
import { drawBoonChoice, drawPause, drawResults, drawTitle } from './screens.js';

export function drawFrame(ctx, game, pointer) {
  ctx.save();
  drawSky(ctx, game);
  if (game.shake > 0.5) ctx.translate(Math.sin(game.time * 90) * game.shake * 0.5, Math.cos(game.time * 70) * game.shake * 0.5);
  drawPlanet(ctx, game);
  drawPlots(ctx, game);
  drawDew(ctx, game);
  drawGardener(ctx, game);
  drawEnemies(ctx, game);
  drawThorns(ctx, game);
  drawEmbers(ctx, game);
  drawSparks(ctx, game);
  ctx.restore();

  if (game.hurtFlash > 0) {
    const edge = ctx.createRadialGradient(VIEW.width / 2, VIEW.height / 2, 260, VIEW.width / 2, VIEW.height / 2, 760);
    edge.addColorStop(0, 'rgba(255, 93, 115, 0)');
    edge.addColorStop(1, `rgba(255, 93, 115, ${0.5 * game.hurtFlash})`);
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  if (game.mode === 'title') {
    drawTitle(ctx, game);
    return;
  }
  drawHud(ctx, game);
  if (game.mode === 'boon') drawBoonChoice(ctx, game, pointer);
  else if (game.mode === 'paused') drawPause(ctx);
  else if (game.mode === 'won' || game.mode === 'lost') drawResults(ctx, game);
  if (game.muted) {
    ctx.fillStyle = COLORS.dim;
    ctx.font = "600 14px 'Trebuchet MS', sans-serif";
    ctx.textAlign = 'right';
    ctx.fillText('sound off (M)', VIEW.width - 24, 124);
  }
}
