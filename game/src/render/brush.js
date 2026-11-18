// Shared drawing helpers: text with a glow, rounded panels, bars and soft light.

import { COLORS } from '../config.js';

export const FONT = "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif";

export function write(ctx, text, x, y, { size = 20, color = COLORS.ink, align = 'left', weight = 600, glow = null, spacing = 0, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.6;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function panel(ctx, x, y, width, height, { fill = COLORS.panel, edge = COLORS.panelEdge, radius = 14, line = 1.5 } = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (edge) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = line;
    ctx.stroke();
  }
  ctx.restore();
}

export function bar(ctx, x, y, width, height, share, color, back = 'rgba(255,255,255,0.12)') {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, height / 2);
  ctx.fillStyle = back;
  ctx.fill();
  const filled = Math.max(0, Math.min(1, share)) * width;
  if (filled > 1) {
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(height, filled), height, height / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

export function glowDot(ctx, x, y, radius, color, alpha = 1) {
  const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
  light.addColorStop(0, color);
  light.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Wrap a sentence into lines no wider than `width`, drawn centred from `y` down.
export function paragraph(ctx, text, x, y, width, options = {}) {
  const size = options.size ?? 18;
  ctx.save();
  ctx.font = `${options.weight ?? 500} ${size}px ${FONT}`;
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > width && line) {
      lines.push(line);
      line = word;
    } else line = trial;
  }
  if (line) lines.push(line);
  ctx.restore();
  lines.forEach((entry, index) => write(ctx, entry, x, y + index * size * 1.3, { ...options, size, align: options.align ?? 'center' }));
  return lines.length;
}
