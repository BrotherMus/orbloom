// The garden: planting, upgrading and uprooting, and what each kind of plant does every tick.

import { COLORS, GARDENER, MAX_LEVEL, PLANET, SEEDS } from './config.js';
import { angleDiff, distanceBetween, toScreen } from './geometry.js';
import { burst, floater, ring } from './effects.js';
import { damageEnemy, enemyPosition, nearestEnemy } from './enemies.js';

export function plantHeight(plant) {
  return 30 + plant.level * 9;
}

export function plantTip(plot) {
  const height = plot.plant ? plantHeight(plot.plant) * Math.min(1, plot.plant.grow) : 20;
  return toScreen(plot.angle, PLANET.radius + height);
}

export function upgradeCost(plant) {
  return SEEDS[plant.kind].cost * plant.level;
}

export function plantSeed(game, plotIndex, kind) {
  const plot = game.plots[plotIndex];
  const seed = SEEDS[kind];
  if (!plot || plot.plant || game.dew < seed.cost) return false;
  game.dew -= seed.cost;
  plot.plant = { kind, level: 1, timer: seed.interval ? seed.interval[0] * 0.5 : 0, health: seed.health[0], grow: 0, aim: plot.angle, recoil: 0, wilt: 0 };
  game.stats.planted += 1;
  const tip = plantTip(plot);
  burst(game, tip.x, tip.y, seed.color, 12, 110);
  game.sound('plant');
  return true;
}

export function upgradePlant(game, plotIndex) {
  const plot = game.plots[plotIndex];
  const plant = plot?.plant;
  if (!plant || plant.level >= MAX_LEVEL) return false;
  const cost = upgradeCost(plant);
  if (game.dew < cost) return false;
  game.dew -= cost;
  plant.level += 1;
  plant.health = SEEDS[plant.kind].health[plant.level - 1];
  plant.grow = 0.6;
  const tip = plantTip(plot);
  ring(game, tip.x, tip.y, 46, SEEDS[plant.kind].color, 0.5);
  floater(game, tip.x, tip.y - 16, `level ${plant.level}`, SEEDS[plant.kind].color);
  game.sound('upgrade');
  return true;
}

export function uprootPlant(game, plotIndex) {
  const plot = game.plots[plotIndex];
  if (!plot?.plant) return false;
  const refund = Math.round(SEEDS[plot.plant.kind].cost * plot.plant.level * 0.5);
  const tip = plantTip(plot);
  floater(game, tip.x, tip.y - 16, `+${refund} dew`, COLORS.ice);
  game.dew += refund;
  plot.plant = null;
  game.sound('dew');
  return true;
}

export function isTended(game, plot) {
  return Math.abs(angleDiff(game.gardener.angle, plot.angle)) < GARDENER.tendArc;
}

export function updatePlants(game, dt) {
  for (const plot of game.plots) {
    const plant = plot.plant;
    if (!plant) continue;
    plant.grow = Math.min(1, plant.grow + dt * 2.2);
    plant.recoil = Math.max(0, plant.recoil - dt * 6);
    plant.wilt = Math.max(0, plant.wilt - dt);
    const haste = (isTended(game, plot) ? 1 + GARDENER.tendBonus * game.boons.tendBonus : 1) + bellHaste(game, plot);
    plant.timer -= dt * haste;
    if (plant.kind === 'thorn') tickThornbud(game, plot, plant);
    else if (plant.kind === 'sun') tickSunpetal(game, plot, plant);
    else if (plant.kind === 'nova') tickNovalily(game, plot, plant);
    else if (plant.kind === 'ember') tickEmberpod(game, plot, plant);
    else if (plant.kind === 'bell') tickMoonbell(game, plot, plant);
  }
}

// A Moonbell quickens the plants on the plots either side of it.
export function bellHaste(game, plot) {
  let haste = 0;
  for (const step of [-1, 1]) {
    const neighbour = game.plots[(plot.index + step + game.plots.length) % game.plots.length].plant;
    if (neighbour && neighbour.kind === 'bell') haste += SEEDS.bell.haste[neighbour.level - 1];
  }
  return haste;
}

function tickEmberpod(game, plot, plant) {
  const seed = SEEDS.ember;
  const tip = plantTip(plot);
  // Embers go for the toughest creature in reach, where a splash is worth the most.
  let target = null;
  for (const enemy of game.enemies) {
    if (enemy.health <= 0) continue;
    if (distanceBetween(tip, enemyPosition(enemy)) > seed.range[plant.level - 1]) continue;
    if (!target || enemy.health > target.health) target = enemy;
  }
  if (!target) return;
  const at = enemyPosition(target);
  plant.aim = Math.atan2(at.y - tip.y, at.x - tip.x);
  if (plant.timer > 0) return;
  plant.timer = seed.interval[plant.level - 1];
  plant.recoil = 1;
  game.embers.push({
    fromX: tip.x, fromY: tip.y, toX: at.x, toY: at.y, x: tip.x, y: tip.y, flight: 0,
    duration: Math.max(0.35, distanceBetween(tip, at) / 430),
    damage: seed.damage[plant.level - 1], splash: seed.splash[plant.level - 1] * game.boons.emberSplash,
  });
  game.sound('thorn');
}

function tickMoonbell(game, plot, plant) {
  if (plant.timer > 0) return;
  const seed = SEEDS.bell;
  plant.timer = seed.interval[plant.level - 1];
  plant.recoil = 1;
  const tip = plantTip(plot);
  ring(game, tip.x, tip.y, 60, seed.color, 0.7);
  if (game.health >= game.maxHealth) return;
  const mend = seed.mend[plant.level - 1] + game.boons.bellMend;
  game.health = Math.min(game.maxHealth, game.health + mend);
  floater(game, tip.x, tip.y - 16, `+${mend} heart`, seed.color);
  game.sound('dew');
}

export function updateEmbers(game, dt) {
  for (const ember of game.embers) {
    ember.flight += dt / ember.duration;
    const t = Math.min(1, ember.flight);
    // A lobbed arc: straight-line travel plus a hump that rises and falls with the flight.
    ember.x = ember.fromX + (ember.toX - ember.fromX) * t;
    ember.y = ember.fromY + (ember.toY - ember.fromY) * t - Math.sin(t * Math.PI) * 46;
    if (t < 1) continue;
    for (const enemy of game.enemies) {
      const at = enemyPosition(enemy);
      if (Math.hypot(at.x - ember.x, at.y - ember.y) < ember.splash + enemy.breed.size) damageEnemy(game, enemy, ember.damage);
    }
    ring(game, ember.x, ember.y, ember.splash, COLORS.ember, 0.45);
    burst(game, ember.x, ember.y, COLORS.ember, 16, 200);
    game.sound('pop');
  }
  game.embers = game.embers.filter((ember) => ember.flight < 1);
}

function tickThornbud(game, plot, plant) {
  const seed = SEEDS.thorn;
  const tip = plantTip(plot);
  const target = nearestEnemy(game, tip, seed.range[plant.level - 1]);
  if (!target) return;
  const at = enemyPosition(target);
  plant.aim = Math.atan2(at.y - tip.y, at.x - tip.x);
  if (plant.timer > 0) return;
  plant.timer = seed.interval[plant.level - 1];
  plant.recoil = 1;
  const speed = 560;
  // The Thorn Volley boon adds a second and third thorn, fanned a little to either side.
  const fan = game.boons.volley > 0 ? [0, -0.16, 0.16].slice(0, 1 + game.boons.volley * 2) : [0];
  for (const spread of fan) {
    game.thorns.push({
      x: tip.x, y: tip.y, vx: Math.cos(plant.aim + spread) * speed, vy: Math.sin(plant.aim + spread) * speed,
      damage: seed.damage[plant.level - 1] + game.boons.thornDamage, life: 0.9,
    });
  }
  game.sound('thorn');
}

function tickSunpetal(game, plot, plant) {
  if (plant.timer > 0) return;
  const seed = SEEDS.sun;
  plant.timer = seed.interval[plant.level - 1];
  const amount = Math.round(seed.dew[plant.level - 1] * game.boons.sunGain);
  game.dew += amount;
  game.stats.dewGathered += amount;
  const tip = plantTip(plot);
  floater(game, tip.x, tip.y - 14, `+${amount}`, COLORS.gold);
  burst(game, tip.x, tip.y, COLORS.gold, 6, 70);
}

function tickNovalily(game, plot, plant) {
  if (plant.timer > 0) return;
  const seed = SEEDS.nova;
  const tip = plantTip(plot);
  const radius = seed.radius[plant.level - 1] * game.boons.novaRadius;
  const inReach = game.enemies.filter((enemy) => distanceBetween(tip, enemyPosition(enemy)) < radius + enemy.breed.size);
  if (inReach.length === 0) {
    plant.timer = 0;
    return;
  }
  plant.timer = seed.interval[plant.level - 1];
  plant.recoil = 1;
  for (const enemy of inReach) damageEnemy(game, enemy, seed.damage[plant.level - 1]);
  ring(game, tip.x, tip.y, radius, COLORS.nova, 0.55);
  burst(game, tip.x, tip.y, COLORS.nova, 22, 240);
  game.shake = Math.max(game.shake, 4);
  game.sound('nova');
}

export function updateThorns(game, dt) {
  for (const thorn of game.thorns) {
    thorn.x += thorn.vx * dt;
    thorn.y += thorn.vy * dt;
    thorn.life -= dt;
    for (const enemy of game.enemies) {
      if (enemy.health <= 0) continue;
      const at = enemyPosition(enemy);
      if (Math.hypot(at.x - thorn.x, at.y - thorn.y) < enemy.breed.size + 5) {
        damageEnemy(game, enemy, thorn.damage);
        burst(game, thorn.x, thorn.y, COLORS.leaf, 4, 80);
        thorn.life = 0;
        game.sound('hit');
        break;
      }
    }
  }
  game.thorns = game.thorns.filter((thorn) => thorn.life > 0);
}
