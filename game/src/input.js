// Keyboard and mouse: held keys, keys pressed since the last frame, and the pointer in game units.

import { VIEW } from './config.js';

export function createInput(canvas) {
  const input = { held: new Set(), pressed: [], clicks: [], pointer: { x: VIEW.width / 2, y: VIEW.height / 2 }, touched: false };

  const toGame = (event) => {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * VIEW.width,
      y: ((event.clientY - box.top) / box.height) * VIEW.height,
    };
  };

  window.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) event.preventDefault();
    if (!input.held.has(key)) input.pressed.push(key);
    input.held.add(key);
    input.touched = true;
  });
  window.addEventListener('keyup', (event) => {
    input.held.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  });
  window.addEventListener('blur', () => input.held.clear());
  canvas.addEventListener('pointermove', (event) => {
    input.pointer = toGame(event);
  });
  canvas.addEventListener('pointerdown', (event) => {
    input.pointer = toGame(event);
    input.clicks.push({ ...input.pointer, button: event.button });
    input.touched = true;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  return input;
}

export function walkDirection(input) {
  const left = input.held.has('a') || input.held.has('ArrowLeft');
  const right = input.held.has('d') || input.held.has('ArrowRight');
  return (right ? 1 : 0) - (left ? 1 : 0);
}

export function drainInput(input) {
  const events = { pressed: input.pressed, clicks: input.clicks };
  input.pressed = [];
  input.clicks = [];
  return events;
}
