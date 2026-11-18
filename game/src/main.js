// Orbloom's entry point: sets up the canvas, reads input, runs the fixed-step loop and draws each frame.

import { PLANET, SEED_ORDER, VIEW } from './config.js';
import { nearestPlot, toPolar } from './geometry.js';
import { createGame } from './state.js';
import { createInput, drainInput, walkDirection } from './input.js';
import { playSound, setMuted, unlockAudio } from './audio.js';
import { loadBest, saveBest } from './storage.js';
import { chooseBoon, startRun, stepGame } from './simulation.js';
import { startDemo, stepDemo } from './demo.js';
import { plantSeed, upgradePlant, uprootPlant } from './plants.js';
import { drawFrame } from './render/scene.js';
import { seedCardRects } from './render/hud.js';
import { boonCardRects } from './render/screens.js';
import { shotRequest, stageShot } from './shots.js';
import { seedRandom } from './rng.js';

const STEP = 1 / 60;
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const game = createGame();
const input = createInput(canvas);
let pulseQueued = false;
let modeClock = 0;
let lastMode = '';

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  const ratio = window.devicePixelRatio || 1;
  canvas.style.width = `${VIEW.width * scale}px`;
  canvas.style.height = `${VIEW.height * scale}px`;
  canvas.width = Math.round(VIEW.width * scale * ratio);
  canvas.height = Math.round(VIEW.height * scale * ratio);
}

function render() {
  ctx.setTransform(canvas.width / VIEW.width, 0, 0, canvas.height / VIEW.height, 0, 0);
  drawFrame(ctx, game, input.pointer);
}

function beginRun() {
  game.demo = null;
  game.sound = playSound;
  seedRandom(Date.now());
  startRun(game);
  status.textContent = 'Night 1 begins. Plant seeds and guard the world heart.';
}

function inside(point, box) {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

function plotUnder(point) {
  const polar = toPolar(point.x, point.y);
  if (polar.distance < PLANET.radius - 45 || polar.distance > PLANET.radius + 125) return -1;
  return nearestPlot(polar.angle);
}

function onKey(key) {
  if (key === 'm') {
    game.muted = !game.muted;
    setMuted(game.muted);
    return;
  }
  if (game.mode === 'title') {
    if (key === 'Enter' || key === ' ') beginRun();
  } else if (game.mode === 'playing') {
    const seedIndex = ['1', '2', '3', '4'].indexOf(key);
    if (seedIndex >= 0) game.selectedSeed = SEED_ORDER[seedIndex];
    else if (key === ' ') pulseQueued = true;
    else if (key === 'p' || key === 'Escape') game.mode = 'paused';
    else if (key === 'x' && game.hoverPlot >= 0) uprootPlant(game, game.hoverPlot);
  } else if (game.mode === 'paused') {
    if (key === 'p' || key === 'Escape') game.mode = 'playing';
    else if (key === 'r') beginRun();
  } else if (game.mode === 'boon') {
    const choice = ['1', '2', '3'].indexOf(key);
    if (choice >= 0) chooseBoon(game, choice);
  } else if ((key === 'r' || key === 'Enter') && modeClock > 0.6) {
    beginRun();
  }
}

function onClick(click) {
  if (game.mode === 'title') {
    beginRun();
  } else if (game.mode === 'playing') {
    const card = seedCardRects().find((box) => inside(click, box));
    if (card) {
      game.selectedSeed = card.kind;
      return;
    }
    const plot = plotUnder(click);
    if (plot < 0) return;
    if (click.button === 2) uprootPlant(game, plot);
    else if (!(game.plots[plot].plant ? upgradePlant(game, plot) : plantSeed(game, plot, game.selectedSeed))) game.sound('deny');
  } else if (game.mode === 'boon') {
    const card = boonCardRects().find((box) => inside(click, box));
    if (card && modeClock > 0.4) chooseBoon(game, card.index);
  } else if ((game.mode === 'won' || game.mode === 'lost') && modeClock > 0.8) {
    beginRun();
  }
}

function handleInput() {
  const events = drainInput(input);
  if (input.touched) unlockAudio();
  for (const key of events.pressed) onKey(key);
  for (const click of events.clicks) onClick(click);
  game.hoverPlot = game.mode === 'playing' ? plotUnder(input.pointer) : -1;
}

let last = performance.now();
let owed = 0;

function frame(now) {
  owed += Math.min(0.1, (now - last) / 1000);
  last = now;
  handleInput();
  while (owed >= STEP) {
    owed -= STEP;
    if (game.mode === 'title') stepDemo(game, STEP);
    else if (game.mode !== 'paused') {
      stepGame(game, { walk: walkDirection(input), pulse: pulseQueued || input.held.has(' ') }, STEP);
      pulseQueued = false;
    }
    modeClock = game.mode === lastMode ? modeClock + STEP : 0;
    if (game.mode !== lastMode) onModeChange();
    lastMode = game.mode;
  }
  render();
  requestAnimationFrame(frame);
}

function onModeChange() {
  if (game.mode === 'won' || game.mode === 'lost') {
    saveBest(game.best);
    status.textContent = `${game.mode === 'won' ? 'Dawn breaks: you won' : 'The garden fell'} with ${game.score} points. Press R to play again.`;
  } else if (game.mode === 'boon') {
    status.textContent = `Night ${game.night} survived. Choose a boon with 1, 2 or 3.`;
  }
}

window.addEventListener('resize', () => {
  fitCanvas();
  render();
});
fitCanvas();

const shot = shotRequest();
if (shot) {
  stageShot(game, shot);
  render();
  document.title = `Orbloom shot: ${shot.name}`;
} else {
  game.best = loadBest();
  seedRandom(Date.now());
  startDemo(game);
  requestAnimationFrame(frame);
}
