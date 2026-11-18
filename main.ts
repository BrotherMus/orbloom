// Orbloom's hand-in program for make.fun's best-game-01 bounty (Node 22, standard library only).
//
// The game itself is game/: plain static files a desktop browser plays offline (game/index.html and its
// ES modules under game/src/, no library, no build step, no network request). This program copies game/
// and screenshots/ to the output directory and writes dossier.json there with the vendored make.fun
// library, which is the summary the judge reads.
//
// Play it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repository = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameSource = join(repository, 'game');
const shotSource = join(repository, 'screenshots');

// Fail loudly here rather than hand in something the gate would refuse.
if (!existsSync(join(gameSource, 'index.html'))) throw new Error('Orbloom: game/index.html is missing');
const shots = existsSync(shotSource) ? readdirSync(shotSource).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort() : [];
if (shots.length < 3 || shots.length > 4) throw new Error(`Orbloom: expected 3 or 4 screenshots, found ${shots.length}`);

mkdirSync(join(output, 'screenshots'), { recursive: true });
cpSync(gameSource, join(output, 'game'), { recursive: true });
for (const name of shots) cpSync(join(shotSource, name), join(output, 'screenshots', name));

// The gate's own caps: only text_max_bytes shapes the dossier; the rest refuse what the scorer would refuse.
const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(output, 'dossier.json'), dossier);
console.log(`Orbloom handed in: ${shots.length} screenshots, dossier ${dossier.length} bytes`);
