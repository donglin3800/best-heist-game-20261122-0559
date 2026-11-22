// main.js — the loop, the screens, the sounds, and the staged scenes
// the screenshots are taken from (?scene=cover|patrol|caught|win).

import { VIEW_W, VIEW_H, LEVELS } from './config.js';
import { makeLevel, stepLevel } from './world.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';
import { render } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const audio = makeAudio();
const input = makeInput(canvas);

const game = {
  level: makeLevel(0),
  screen: 'title', // title | playing
  now: 0,
  frozen: false, // a staged screenshot scene: render, never simulate
  lastStatus: 'title',
};

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function startLevel(idx) {
  game.level = makeLevel(idx);
  game.screen = 'playing';
  game.frozen = false;
  announce(`${LEVELS[idx].name}. ${LEVELS[idx].brief}`);
}

function handleEvents(events) {
  if (!events) return;
  for (const e of events) {
    if (e === 'grab') audio.grab();
    else if (e === 'coin') audio.coin();
    else if (e === 'seen') audio.seen();
    else if (e === 'blackout') audio.blackout();
    else if (e === 'caught') { audio.caught(); announce('Caught by a guard. Press R to try again.'); }
    else if (e === 'busted') { audio.caught(); announce('Busted. The alarm hit 100 percent. Press R to try again.'); }
    else if (e === 'win') { audio.win(); announce(`Heist complete. Score ${game.level.score}.`); }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.now = now / 1000;

  if (game.screen === 'title') {
    if (input.anyKey) {
      audio.unlock();
      audio.click();
      input.anyKey = false;
      startLevel(0);
    }
  } else if (!game.frozen) {
    const events = stepLevel(game.level, input, dt);
    input.consumeEdges();
    handleEvents(events);
    audio.siren(game.level.status === 'playing' && game.level.alarm >= 70);
    if (input.anyKey) input.anyKey = false;
  }

  if (game.level.status !== game.lastStatus) {
    game.lastStatus = game.level.status;
  }
  render(ctx, game);
  requestAnimationFrame(frame);
}

// Restart / next-night keys, on keydown so one press is one action.
window.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyR') return;
  const level = game.level;
  if (game.screen !== 'playing') return;
  if (level.status === 'won' && level.index + 1 < LEVELS.length) {
    audio.click();
    startLevel(level.index + 1);
  } else if (level.status !== 'playing') {
    audio.click();
    startLevel(level.index);
  }
});

// --- staged scenes for screenshots (?scene=cover|patrol|caught|win) ---
// Fixed positions, no randomness: the same URL always renders the same frame.
function stageScene(name) {
  const set = (fn) => { fn(game.level); game.screen = 'playing'; game.frozen = true; };
  if (name === 'cover') {
    set((level) => {
      level.player.x = 560; level.player.y = 430;
      level.guards[0].x = 300; level.guards[0].y = 380; level.guards[0].facing = 0.5;
      level.guards[1].x = 980; level.guards[1].y = 330; level.guards[1].facing = Math.PI - 0.4;
      level.cameras[0].angle = Math.PI / 2 + 0.5;
      level.alarm = 35;
      level.loot.find((l) => l.id === 'vase').taken = true;
      level.score = 100;
      level.time = 74;
      level.seenNow = false;
    });
  } else if (name === 'patrol') {
    game.level = makeLevel(1);
    set((level) => {
      level.player.x = 210; level.player.y = 400;
      level.sneaking = true;
      level.guards[0].x = 250; level.guards[0].y = 300; level.guards[0].facing = Math.PI / 2;
      level.guards[1].x = 1030; level.guards[1].y = 430; level.guards[1].facing = -Math.PI / 2;
      level.guards[2].x = 640; level.guards[2].y = 120; level.guards[2].facing = 0;
      level.cameras[0].angle = Math.PI / 2 - 0.6;
      level.cameras[1].angle = Math.PI / 2 + 0.6;
      level.alarm = 12;
      level.loot.find((l) => l.id === 'muse').taken = true;
      level.loot.find((l) => l.id === 'bars').taken = true;
      level.score = 350;
      level.time = 132;
    });
  } else if (name === 'caught') {
    set((level) => {
      level.player.x = 700; level.player.y = 380;
      level.guards[0].x = 726; level.guards[0].y = 380; level.guards[0].facing = Math.PI;
      level.guards[0].detect = 1; level.guards[0].state = 'chase';
      level.guards[1].x = 980; level.guards[1].y = 300; level.guards[1].facing = Math.PI - 0.5;
      level.cameras[0].angle = Math.PI / 2;
      level.alarm = 92;
      level.seenNow = true;
      level.status = 'caught';
      level.score = 100;
      level.time = 96;
    });
  } else if (name === 'win') {
    set((level) => {
      level.player.x = 640; level.player.y = 660;
      level.loot.forEach((l) => { l.taken = true; });
      level.score = 1240;
      level.time = 187;
      level.alarm = 8;
      level.status = 'won';
    });
  }
}

const scene = new URLSearchParams(window.location.search).get('scene');
if (scene) stageScene(scene);

requestAnimationFrame(frame);
// The screenshot harness waits on this flag.
window.__sceneReady = true;
