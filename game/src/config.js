// config.js — tuning and the three nights of The Velvet Vault.
// Every number the game balances on lives here, so a level is data, not code.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WALL = 24; // border wall thickness

export const PLAYER_R = 14;
export const PLAYER_SPEED = 175; // px per second, walking
export const SNEAK_SPEED = 105; // px per second, Shift held
export const GRAB_TIME = 0.7; // seconds of holding E beside loot
export const GRAB_RANGE = 42;

export const GUARD_TOUCH_R = 26; // a guard this close catches the thief
export const DETECT_RATE = 1.0; // detection meter fills in ~1s of full view
export const ALARM_SEEN_RATE = 16; // alarm points per second while seen
export const ALARM_DECAY_RATE = 5; // alarm points per second while unseen
export const ALARM_BUSTED = 100;
export const ALARM_HOT = 70; // above this, guards hurry

export const COIN_RANGE = 520; // how far a thrown coin can land
export const COIN_NOISE_R = 360; // guards inside this radius investigate
export const BLACKOUT_TIME = 5; // seconds of darkness from Q

export const LOOT_VALUE = { diamond: 500, painting: 200, gold: 150, vase: 100 };
export const TIME_BONUS_PER_SEC = 2; // bonus for finishing fast

// A level is one museum floor: obstacles block sight and movement,
// guards walk waypoints, cameras sweep, loot waits to be pocketed.
export const LEVELS = [
  {
    name: 'Night 1 — The Velvet Gallery',
    brief: 'Lift the Star of Midnight, then slip out the service door.',
    player: { x: 640, y: 640 },
    exit: { x: 600, y: 672, w: 80, h: 24, label: 'SERVICE DOOR' },
    coins: 3,
    blackouts: 1,
    obstacles: [
      { x: 400, y: 200, w: 120, h: 60, kind: 'case' },
      { x: 760, y: 200, w: 120, h: 60, kind: 'case' },
      { x: 400, y: 460, w: 120, h: 60, kind: 'case' },
      { x: 760, y: 460, w: 120, h: 60, kind: 'case' },
      { x: 296, y: 340, w: 40, h: 40, kind: 'pillar' },
      { x: 944, y: 340, w: 40, h: 40, kind: 'pillar' },
      { x: 120, y: 120, w: 90, h: 44, kind: 'sofa' },
      { x: 1070, y: 556, w: 90, h: 44, kind: 'sofa' },
    ],
    loot: [
      { id: 'star', kind: 'diamond', x: 640, y: 300, label: 'Star of Midnight' },
      { id: 'muse', kind: 'painting', x: 300, y: 82, label: 'Portrait of the Muse' },
      { id: 'bars', kind: 'gold', x: 1090, y: 360, label: 'Gold bars' },
      { id: 'vase', kind: 'vase', x: 180, y: 360, label: 'Ming vase' },
    ],
    guards: [
      { x: 300, y: 150, waypoints: [[300, 150], [300, 560]], speed: 58, range: 250, fov: 1.25 },
      { x: 980, y: 150, waypoints: [[980, 150], [980, 560]], speed: 58, range: 250, fov: 1.25 },
    ],
    cameras: [
      { x: 640, y: 64, base: Math.PI / 2, sweep: 0.9, speed: 0.45, range: 300, fov: 0.7 },
    ],
  },
  {
    name: 'Night 2 — The Vault Hall',
    brief: 'Two cameras, three guards. The Star is never left alone twice.',
    player: { x: 640, y: 640 },
    exit: { x: 600, y: 672, w: 80, h: 24, label: 'SERVICE DOOR' },
    coins: 3,
    blackouts: 1,
    obstacles: [
      { x: 300, y: 160, w: 110, h: 56, kind: 'case' },
      { x: 560, y: 160, w: 160, h: 56, kind: 'case' },
      { x: 870, y: 160, w: 110, h: 56, kind: 'case' },
      { x: 300, y: 470, w: 110, h: 56, kind: 'case' },
      { x: 870, y: 470, w: 110, h: 56, kind: 'case' },
      { x: 620, y: 330, w: 40, h: 40, kind: 'pillar' },
      { x: 200, y: 330, w: 40, h: 40, kind: 'pillar' },
      { x: 1040, y: 330, w: 40, h: 40, kind: 'pillar' },
      { x: 120, y: 560, w: 90, h: 44, kind: 'sofa' },
    ],
    loot: [
      { id: 'star', kind: 'diamond', x: 640, y: 300, label: 'Star of Midnight' },
      { id: 'muse', kind: 'painting', x: 220, y: 82, label: 'Portrait of the Muse' },
      { id: 'bars', kind: 'gold', x: 1100, y: 120, label: 'Gold bars' },
      { id: 'vase', kind: 'vase', x: 170, y: 470, label: 'Ming vase' },
      { id: 'crown', kind: 'gold', x: 1100, y: 560, label: 'Duchess crown' },
    ],
    guards: [
      { x: 250, y: 140, waypoints: [[250, 140], [250, 560], [640, 560]], speed: 66, range: 260, fov: 1.25 },
      { x: 1030, y: 140, waypoints: [[1030, 140], [1030, 560]], speed: 66, range: 260, fov: 1.25 },
      { x: 640, y: 120, waypoints: [[640, 120], [420, 120], [860, 120]], speed: 60, range: 240, fov: 1.2 },
    ],
    cameras: [
      { x: 360, y: 64, base: Math.PI / 2, sweep: 0.8, speed: 0.5, range: 300, fov: 0.7 },
      { x: 920, y: 64, base: Math.PI / 2, sweep: 0.8, speed: 0.5, range: 300, fov: 0.7 },
    ],
  },
  {
    name: 'Night 3 — The Grand Atrium',
    brief: 'Four guards, three cameras, one very nervous curator.',
    player: { x: 640, y: 640 },
    exit: { x: 600, y: 672, w: 80, h: 24, label: 'SERVICE DOOR' },
    coins: 4,
    blackouts: 2,
    obstacles: [
      { x: 240, y: 150, w: 130, h: 56, kind: 'case' },
      { x: 560, y: 150, w: 160, h: 56, kind: 'case' },
      { x: 910, y: 150, w: 130, h: 56, kind: 'case' },
      { x: 240, y: 480, w: 130, h: 56, kind: 'case' },
      { x: 910, y: 480, w: 130, h: 56, kind: 'case' },
      { x: 560, y: 480, w: 160, h: 56, kind: 'case' },
      { x: 430, y: 330, w: 40, h: 40, kind: 'pillar' },
      { x: 810, y: 330, w: 40, h: 40, kind: 'pillar' },
      { x: 120, y: 330, w: 90, h: 44, kind: 'sofa' },
      { x: 1070, y: 330, w: 90, h: 44, kind: 'sofa' },
    ],
    loot: [
      { id: 'star', kind: 'diamond', x: 640, y: 300, label: 'Star of Midnight' },
      { id: 'muse', kind: 'painting', x: 220, y: 82, label: 'Portrait of the Muse' },
      { id: 'bars', kind: 'gold', x: 1100, y: 120, label: 'Gold bars' },
      { id: 'vase', kind: 'vase', x: 170, y: 120, label: 'Ming vase' },
      { id: 'crown', kind: 'gold', x: 1100, y: 560, label: 'Duchess crown' },
      { id: 'mask', kind: 'vase', x: 170, y: 560, label: 'Jade mask' },
    ],
    guards: [
      { x: 220, y: 140, waypoints: [[220, 140], [220, 560]], speed: 74, range: 270, fov: 1.3 },
      { x: 1060, y: 140, waypoints: [[1060, 140], [1060, 560]], speed: 74, range: 270, fov: 1.3 },
      { x: 460, y: 120, waypoints: [[460, 120], [820, 120]], speed: 68, range: 250, fov: 1.25 },
      { x: 640, y: 600, waypoints: [[640, 600], [400, 600], [880, 600]], speed: 68, range: 250, fov: 1.25 },
    ],
    cameras: [
      { x: 300, y: 64, base: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 310, fov: 0.7 },
      { x: 640, y: 64, base: Math.PI / 2, sweep: 0.7, speed: 0.4, range: 310, fov: 0.7 },
      { x: 980, y: 64, base: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 310, fov: 0.7 },
    ],
  },
];
