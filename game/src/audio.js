// Every sound is synthesised here with the Web Audio API: no audio files, so nothing to load.

let context = null;
let master = null;
let musicTimer = null;
let nextNote = 0;
let step = 0;
let muted = false;

// A minor pentatonic lullaby: one bar of eight steps, with a bass note on the first.
const MELODY = [57, 60, 64, 67, 69, 67, 64, 60, 55, 60, 62, 67, 69, 72, 67, 62];
const BASS = [33, 33, 29, 31];
const hertz = (midi) => 440 * 2 ** ((midi - 69) / 12);

export function unlockAudio() {
  if (context) {
    if (context.state === 'suspended') context.resume();
    return;
  }
  const Engine = window.AudioContext ?? window.webkitAudioContext;
  if (!Engine) return;
  context = new Engine();
  master = context.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(context.destination);
  startMusic();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.5;
}

function tone({ from, to = from, length = 0.15, shape = 'sine', volume = 0.2, at = 0 }) {
  if (!context) return;
  const start = context.currentTime + at;
  const voice = context.createOscillator();
  const envelope = context.createGain();
  voice.type = shape;
  voice.frequency.setValueAtTime(from, start);
  voice.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + length);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
  voice.connect(envelope).connect(master);
  voice.start(start);
  voice.stop(start + length + 0.03);
}

function hiss({ length = 0.2, volume = 0.2, pitch = 1200 }) {
  if (!context) return;
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = buffer;
  filter.type = 'bandpass';
  filter.frequency.value = pitch;
  envelope.gain.value = volume;
  source.connect(filter).connect(envelope).connect(master);
  source.start();
}

const SOUNDS = {
  plant: () => { tone({ from: 330, to: 660, length: 0.16, shape: 'triangle' }); },
  upgrade: () => { tone({ from: 440, to: 880, length: 0.14, shape: 'triangle' }); tone({ from: 660, to: 1320, length: 0.2, shape: 'triangle', at: 0.1 }); },
  thorn: () => { tone({ from: 900, to: 420, length: 0.06, shape: 'square', volume: 0.05 }); },
  hit: () => { hiss({ length: 0.05, volume: 0.08, pitch: 2400 }); },
  pop: () => { tone({ from: 520, to: 130, length: 0.14, volume: 0.16 }); hiss({ length: 0.1, volume: 0.1, pitch: 900 }); },
  boom: () => { tone({ from: 160, to: 30, length: 0.9, shape: 'sawtooth', volume: 0.3 }); hiss({ length: 0.7, volume: 0.3, pitch: 300 }); },
  dew: () => { tone({ from: 1200, to: 1900, length: 0.09, volume: 0.1 }); },
  pulse: () => { tone({ from: 220, to: 880, length: 0.32, shape: 'triangle', volume: 0.25 }); hiss({ length: 0.3, volume: 0.12, pitch: 1600 }); },
  nova: () => { tone({ from: 990, to: 180, length: 0.3, shape: 'sawtooth', volume: 0.12 }); },
  hurt: () => { tone({ from: 190, to: 60, length: 0.35, shape: 'sawtooth', volume: 0.25 }); },
  deny: () => { tone({ from: 180, to: 150, length: 0.12, shape: 'square', volume: 0.08 }); },
  boon: () => { [523, 659, 784].forEach((f, i) => tone({ from: f, length: 0.22, shape: 'triangle', at: i * 0.07 })); },
  night: () => { tone({ from: 196, to: 147, length: 0.7, shape: 'triangle', volume: 0.2 }); },
  win: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ from: f, length: 0.4, shape: 'triangle', at: i * 0.13 })); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone({ from: f, length: 0.5, shape: 'triangle', at: i * 0.2 })); },
};

export function playSound(name) {
  if (context && !muted) SOUNDS[name]?.();
}

function startMusic() {
  nextNote = context.currentTime + 0.1;
  musicTimer = setInterval(scheduleMusic, 120);
}

// Schedule a little ahead of the clock so the tune never stutters with the frame rate.
function scheduleMusic() {
  while (nextNote < context.currentTime + 0.4) {
    const at = nextNote - context.currentTime;
    tone({ from: hertz(MELODY[step % MELODY.length]), length: 0.5, shape: 'triangle', volume: 0.045, at });
    if (step % 8 === 0) tone({ from: hertz(BASS[Math.floor(step / 8) % BASS.length]), length: 1.8, volume: 0.1, at });
    step += 1;
    nextNote += 0.3;
  }
}

export function stopMusic() {
  clearInterval(musicTimer);
}
