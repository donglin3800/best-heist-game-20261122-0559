// world.js — the museum floor as a simulation: walls, sight lines,
// guard patrols and the alarm. No drawing here, only rules.

import {
  VIEW_W, VIEW_H, WALL, PLAYER_R, PLAYER_SPEED, SNEAK_SPEED, GRAB_TIME,
  GRAB_RANGE, GUARD_TOUCH_R, DETECT_RATE, ALARM_SEEN_RATE, ALARM_DECAY_RATE,
  ALARM_BUSTED, ALARM_HOT, COIN_RANGE, COIN_NOISE_R, BLACKOUT_TIME,
  LOOT_VALUE, LEVELS,
} from './config.js';

export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }

function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Does the segment (x1,y1)-(x2,y2) hit the rectangle r? Used for sight lines.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  if (x1 >= r.x && x1 <= r.x + r.w && y1 >= r.y && y1 <= r.y + r.h) return true;
  const dx = x2 - x1, dy = y2 - y1;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const den = dx * (ey2 - ey1) - dy * (ex2 - ex1);
    if (den === 0) continue;
    const t = ((ex1 - x1) * (ey2 - ey1) - (ey1 - y1) * (ex2 - ex1)) / den;
    const u = ((ex1 - x1) * dy - (ey1 - y1) * dx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

export function hasLineOfSight(x1, y1, x2, y2, obstacles) {
  for (const o of obstacles) {
    if (segmentHitsRect(x1, y1, x2, y2, o)) return false;
  }
  return true;
}

// Move a circle (the thief) with AABB collision against walls and obstacles.
export function moveCircle(pos, dx, dy, obstacles) {
  const nx = pos.x + dx;
  if (!hitsAny(nx, pos.y, PLAYER_R, obstacles)) pos.x = nx;
  const ny = pos.y + dy;
  if (!hitsAny(pos.x, ny, PLAYER_R, obstacles)) pos.y = ny;
}

function hitsAny(x, y, r, obstacles) {
  if (x - r < WALL || x + r > VIEW_W - WALL || y - r < WALL || y + r > VIEW_H - WALL) return true;
  for (const o of obstacles) {
    const cx = Math.max(o.x, Math.min(x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(y, o.y + o.h));
    if (dist(x, y, cx, cy) < r) return true;
  }
  return false;
}

export function makeGuard(def, index) {
  return {
    index,
    x: def.x, y: def.y,
    waypoints: def.waypoints.map(([x, y]) => ({ x, y })),
    wp: 0,
    speed: def.speed,
    range: def.range,
    fov: def.fov,
    facing: Math.PI / 2,
    state: 'patrol', // patrol | investigate | chase | return
    detect: 0, // 0..1, how sure this guard is that it sees the thief
    investigate: null, // {x, y, t} a spot to walk to and look at
    lastSeen: null,
    pause: 0,
  };
}

export function makeCamera(def, index) {
  return {
    index,
    x: def.x, y: def.y,
    base: def.base, sweep: def.sweep, speed: def.speed,
    range: def.range, fov: def.fov,
    angle: def.base, phase: index * 1.7,
    disabled: false,
    detect: 0,
  };
}

export function makeLevel(idx) {
  const def = LEVELS[idx];
  return {
    index: idx,
    def,
    player: { x: def.player.x, y: def.player.y },
    sneaking: false,
    moving: false,
    guards: def.guards.map((g, i) => makeGuard(g, i)),
    cameras: def.cameras.map((c, i) => makeCamera(c, i)),
    loot: def.loot.map((l) => ({ ...l, taken: false })),
    obstacles: def.obstacles,
    exit: def.exit,
    alarm: 0,
    coins: def.coins,
    blackouts: def.blackouts,
    blackout: 0, // seconds of darkness left
    coin: null, // a coin in flight or on the floor: {x, y, t, landed}
    grab: null, // {loot, t} while the thief pockets something
    score: 0,
    time: 0,
    status: 'playing', // playing | won | busted | caught
    statusT: 0,
    seenNow: false, // any watcher has eyes on the thief this frame
    message: '',
    messageT: 0,
  };
}

// One simulation step. Returns an event string for sound ('seen', 'alarm',
// 'caught', 'busted', 'grab', 'coin', 'blackout', 'win') or null.
export function stepLevel(level, input, dt) {
  if (level.status !== 'playing') { level.statusT += dt; return null; }
  level.time += dt;
  const events = [];
  const p = level.player;

  // --- the thief moves ---
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(mx, my);
  level.sneaking = input.sneak && len > 0;
  level.moving = len > 0;
  if (len > 0) {
    const speed = level.sneaking ? SNEAK_SPEED : PLAYER_SPEED;
    moveCircle(p, (mx / len) * speed * dt, (my / len) * speed * dt, level.obstacles);
  }

  // --- blackout (Q) ---
  if (input.blackout && level.blackouts > 0 && level.blackout <= 0) {
    level.blackouts -= 1;
    level.blackout = BLACKOUT_TIME;
    events.push('blackout');
  }
  if (level.blackout > 0) level.blackout -= dt;

  // --- coin toss (mouse click) ---
  if (input.toss && level.coins > 0 && !level.coin) {
    const tx = input.toss.x, ty = input.toss.y;
    if (dist(p.x, p.y, tx, ty) <= COIN_RANGE) {
      level.coins -= 1;
      level.coin = { x: p.x, y: p.y, tx, ty, t: 0, landed: false };
      events.push('coin');
    }
  }
  if (level.coin) {
    const c = level.coin;
    c.t += dt;
    if (!c.landed && c.t >= 0.35) {
      c.landed = true;
      c.x = c.tx; c.y = c.ty;
      for (const g of level.guards) {
        if (dist(g.x, g.y, c.x, c.y) <= COIN_NOISE_R && g.state !== 'chase') {
          g.state = 'investigate';
          g.investigate = { x: c.x, y: c.y, t: 3 };
        }
      }
    }
    if (c.landed && c.t > 6) level.coin = null;
  }

  // --- grabbing loot (hold E) ---
  const near = level.loot.find((l) => !l.taken && dist(p.x, p.y, l.x, l.y) <= GRAB_RANGE);
  if (near && input.grab && !level.moving) {
    if (!level.grab || level.grab.loot !== near) level.grab = { loot: near, t: 0 };
    level.grab.t += dt;
    if (level.grab.t >= GRAB_TIME) {
      near.taken = true;
      level.score += LOOT_VALUE[near.kind];
      level.grab = null;
      events.push('grab');
      setMessage(level, `Pocketed the ${near.label} (+${LOOT_VALUE[near.kind]})`);
    }
  } else {
    level.grab = null;
  }

  // --- cameras sweep ---
  for (const cam of level.cameras) {
    if (cam.disabled || level.blackout > 0) { cam.detect = 0; continue; }
    cam.angle = cam.base + Math.sin(level.time * cam.speed + cam.phase) * cam.sweep;
    const d = dist(cam.x, cam.y, p.x, p.y);
    const inCone = d <= cam.range && Math.abs(angleDiff(angleTo(cam.x, cam.y, p.x, p.y), cam.angle)) <= cam.fov / 2;
    const seen = inCone && hasLineOfSight(cam.x, cam.y, p.x, p.y, level.obstacles);
    cam.detect = Math.min(1, Math.max(0, cam.detect + (seen ? DETECT_RATE * dt : -DETECT_RATE * 1.5 * dt)));
  }

  // --- guards patrol, watch, chase ---
  level.seenNow = false;
  for (const g of level.guards) {
    const d = dist(g.x, g.y, p.x, p.y);
    const range = level.blackout > 0 ? g.range * 0.45 : g.range;
    const inCone = d <= range && Math.abs(angleDiff(angleTo(g.x, g.y, p.x, p.y), g.facing)) <= g.fov / 2;
    const seen = inCone && hasLineOfSight(g.x, g.y, p.x, p.y, level.obstacles)
      && !(level.sneaking && d > range * 0.55); // sneaking shrinks the danger zone
    if (seen) {
      g.detect = Math.min(1, g.detect + DETECT_RATE * dt);
      g.lastSeen = { x: p.x, y: p.y };
      level.seenNow = true;
    } else {
      g.detect = Math.max(0, g.detect - DETECT_RATE * 0.8 * dt);
    }
    if (g.detect >= 0.6 && g.state !== 'chase') {
      g.state = 'chase';
      events.push('seen');
    }

    const hurry = level.alarm >= ALARM_HOT ? 1.25 : 1;
    if (level.blackout > 0) { /* guards freeze, confused, in the dark */ }
    else if (g.state === 'patrol') {
      const target = g.waypoints[g.wp];
      if (walkToward(g, target, g.speed * hurry, dt)) {
        g.wp = (g.wp + 1) % g.waypoints.length;
        g.pause = 0.8;
      }
    } else if (g.state === 'investigate' && g.investigate) {
      if (walkToward(g, g.investigate, g.speed * 1.15 * hurry, dt)) {
        g.investigate.t -= dt;
        g.facing += dt * 1.5; // look around the spot
        if (g.investigate.t <= 0) { g.state = 'return'; g.investigate = null; }
      }
    } else if (g.state === 'chase' && g.lastSeen) {
      if (walkToward(g, g.lastSeen, g.speed * 1.6 * hurry, dt)) {
        if (g.detect < 0.3) g.state = 'return';
      }
      if (g.detect < 0.25) g.state = 'return';
    } else if (g.state === 'return') {
      const target = g.waypoints[g.wp];
      if (walkToward(g, target, g.speed * hurry, dt)) g.state = 'patrol';
    }

    if (d <= GUARD_TOUCH_R && level.blackout <= 0) {
      level.status = 'caught';
      level.statusT = 0;
      events.push('caught');
      return events;
    }
  }

  // --- the alarm ---
  const camSeen = level.cameras.some((c) => c.detect > 0.5);
  if (camSeen) level.seenNow = true; // a camera's eye counts as spotted too
  if (level.seenNow || camSeen) {
    level.alarm += ALARM_SEEN_RATE * dt;
    if (level.alarm >= ALARM_HOT && level.alarm - ALARM_SEEN_RATE * dt < ALARM_HOT) events.push('alarm');
  } else {
    level.alarm = Math.max(0, level.alarm - ALARM_DECAY_RATE * dt);
  }
  if (level.alarm >= ALARM_BUSTED) {
    level.status = 'busted';
    level.statusT = 0;
    events.push('busted');
    return events;
  }

  // --- win: the Star is pocketed and the thief reaches the door ---
  const star = level.loot.find((l) => l.kind === 'diamond');
  const atExit = p.x >= level.exit.x && p.x <= level.exit.x + level.exit.w
    && p.y >= level.exit.y - 10 && p.y <= level.exit.y + level.exit.h + 10;
  if (star.taken && atExit) {
    const timeBonus = Math.max(0, Math.round(600 - level.time) * 2);
    level.score += timeBonus;
    level.status = 'won';
    level.statusT = 0;
    events.push('win');
    return events;
  }

  if (level.messageT > 0) level.messageT -= dt;
  return events;
}

// Walk a guard toward a point; returns true when it arrives. Updates facing.
function walkToward(g, target, speed, dt) {
  if (g.pause > 0) { g.pause -= dt; return false; }
  const d = dist(g.x, g.y, target.x, target.y);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  g.x += ((target.x - g.x) / d) * step;
  g.y += ((target.y - g.y) / d) * step;
  g.facing = angleTo(g.x, g.y, target.x, target.y);
  return d - step < 4;
}

function setMessage(level, text) {
  level.message = text;
  level.messageT = 2.5;
}

export function lootTakenCount(level) {
  return level.loot.filter((l) => l.taken).length;
}
