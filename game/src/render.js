// render.js — everything the eye sees: the museum floor, the cones,
// the loot, the HUD and the title / win / caught screens. Canvas only.

import { VIEW_W, VIEW_H, WALL, PLAYER_R, GRAB_TIME, ALARM_HOT, ALARM_BUSTED } from './config.js';
import { lootTakenCount } from './world.js';

const GOLD = '#d9a441';
const CREAM = '#f2e6c9';
const FLOOR_A = '#241f33';
const FLOOR_B = '#1d1829';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, fov, range, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - fov / 2, angle + fov / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFloor(ctx) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = WALL; x <= VIEW_W - WALL; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, WALL); ctx.lineTo(x, VIEW_H - WALL); ctx.stroke();
  }
  for (let y = WALL; y <= VIEW_H - WALL; y += 64) {
    ctx.beginPath(); ctx.moveTo(WALL, y); ctx.lineTo(VIEW_W - WALL, y); ctx.stroke();
  }
  // Red carpet runner from the service door to the Star's pedestal:
  // dark, so it reads as floor dressing, not a wall.
  ctx.fillStyle = '#431420';
  ctx.fillRect(600, 300, 80, 372);
  ctx.strokeStyle = 'rgba(217,164,65,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(600, 300); ctx.lineTo(600, 672); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(680, 300); ctx.lineTo(680, 672); ctx.stroke();
  ctx.setLineDash([10, 12]);
  ctx.strokeStyle = 'rgba(217,164,65,0.35)';
  ctx.beginPath(); ctx.moveTo(640, 310); ctx.lineTo(640, 662); ctx.stroke();
  ctx.setLineDash([]);
  // Gold trim along the walls.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(WALL - 1.5, WALL - 1.5, VIEW_W - 2 * WALL + 3, VIEW_H - 2 * WALL + 3);
  // Walls.
  ctx.fillStyle = '#12101c';
  ctx.fillRect(0, 0, VIEW_W, WALL);
  ctx.fillRect(0, VIEW_H - WALL, VIEW_W, WALL);
  ctx.fillRect(0, 0, WALL, VIEW_H);
  ctx.fillRect(VIEW_W - WALL, 0, WALL, VIEW_H);
}

function drawObstacle(ctx, o) {
  if (o.kind === 'case') {
    ctx.fillStyle = '#2c2740';
    roundRect(ctx, o.x, o.y, o.w, o.h, 6);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(160,220,255,0.16)';
    roundRect(ctx, o.x + 6, o.y + 6, o.w - 12, o.h - 12, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(o.x + 12, o.y + o.h - 10);
    ctx.lineTo(o.x + 34, o.y + 10);
    ctx.lineTo(o.x + 52, o.y + 10);
    ctx.lineTo(o.x + 30, o.y + o.h - 10);
    ctx.closePath();
    ctx.fill();
  } else if (o.kind === 'pillar') {
    ctx.fillStyle = '#3a3350';
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#57507a';
    ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2 - 8, 0, Math.PI * 2); ctx.fill();
  } else if (o.kind === 'sofa') {
    ctx.fillStyle = '#5c1a24';
    roundRect(ctx, o.x, o.y, o.w, o.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#8a2f3d';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawLoot(ctx, l, t) {
  if (l.taken) return;
  const bob = Math.sin(t * 3 + l.x) * 2;
  const cx = l.x, cy = l.y + bob;
  // Glow ring so loot reads at a glance.
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,215,90,0.14)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,90,0.65)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (l.kind === 'diamond') {
    ctx.fillStyle = '#8fe8ff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16); ctx.lineTo(cx + 13, cy - 2); ctx.lineTo(cx, cy + 14); ctx.lineTo(cx - 13, cy - 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16); ctx.lineTo(cx + 13, cy - 2); ctx.lineTo(cx - 13, cy - 2);
    ctx.closePath(); ctx.fill();
  } else if (l.kind === 'painting') {
    ctx.fillStyle = '#6b4a1f';
    ctx.fillRect(cx - 26, cy - 18, 52, 36);
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.strokeRect(cx - 26, cy - 18, 52, 36);
    ctx.fillStyle = '#b98a4a';
    ctx.beginPath(); ctx.arc(cx, cy - 2, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3d2b12';
    ctx.fillRect(cx - 16, cy + 8, 32, 6);
  } else if (l.kind === 'gold') {
    ctx.fillStyle = '#f7c948';
    for (let i = 0; i < 3; i++) {
      roundRect(ctx, cx - 18 + i * 4, cy + 8 - i * 9, 28, 9, 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#a67c00'; ctx.lineWidth = 1; ctx.stroke();
  } else { // vase
    ctx.fillStyle = '#7fb3d5';
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 14); ctx.lineTo(cx + 7, cy - 14); ctx.lineTo(cx + 11, cy + 4);
    ctx.quadraticCurveTo(cx + 11, cy + 14, cx, cy + 14);
    ctx.quadraticCurveTo(cx - 11, cy + 14, cx - 11, cy + 4);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8f4ff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.fillStyle = CREAM;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(l.label.toUpperCase(), cx, cy + 32);
}

function drawGuard(ctx, g, t, blackout) {
  const alert = g.detect > 0.5 || g.state === 'chase';
  const color = alert ? 'rgba(255,60,50,0.30)' : 'rgba(255,200,60,0.26)';
  if (!blackout) drawCone(ctx, g.x, g.y, g.facing, g.fov, g.range, color);
  // Body: navy uniform, cap, facing tick.
  ctx.fillStyle = '#2b3a67';
  ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = alert ? '#ff5040' : '#8fa3d9';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#dfe6ff';
  ctx.beginPath(); ctx.arc(g.x, g.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2b3a67';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.facing) * 15, g.y + Math.sin(g.facing) * 15);
  ctx.stroke();
  if (g.detect > 0.15) {
    ctx.fillStyle = alert ? '#ff5040' : '#ffd23e';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 24 - Math.sin(t * 6) * 2);
  }
}

function drawCamera(ctx, cam, blackout) {
  if (cam.disabled) {
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2); ctx.fill();
    return;
  }
  if (!blackout) drawCone(ctx, cam.x, cam.y, cam.angle, cam.fov, cam.range, 'rgba(140,220,255,0.20)');
  ctx.fillStyle = '#9fb4c8';
  ctx.beginPath(); ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff5a4a';
  ctx.beginPath(); ctx.arc(cam.x, cam.y, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#9fb4c8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cam.x, cam.y);
  ctx.lineTo(cam.x + Math.cos(cam.angle) * 16, cam.y + Math.sin(cam.angle) * 16);
  ctx.stroke();
}

function drawPlayer(ctx, level, t) {
  const p = level.player;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  // Hooded thief: near-black cloak, pale mask, gold sash.
  ctx.fillStyle = '#101018';
  ctx.beginPath(); ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = level.sneaking ? '#7fd4ff' : GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#e8e2d0';
  ctx.beginPath(); ctx.arc(p.x, p.y - 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#101018';
  ctx.fillRect(p.x - 4, p.y - 4, 8, 3);
  if (level.sneaking) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(127,212,255,0.7)';
    ctx.beginPath(); ctx.arc(p.x, p.y, PLAYER_R + 7, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Grab progress ring.
  if (level.grab) {
    const frac = level.grab.t / GRAB_TIME;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_R + 12, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }
  // Coin in flight / on the floor.
  if (level.coin) {
    const c = level.coin;
    const cx = c.landed ? c.x : c.x + (c.tx - c.x) * Math.min(1, c.t / 0.35);
    const cy = c.landed ? c.y : c.y + (c.ty - c.y) * Math.min(1, c.t / 0.35) - Math.sin(Math.min(1, c.t / 0.35) * Math.PI) * 22;
    ctx.fillStyle = '#f7c948';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#a67c00'; ctx.lineWidth = 1; ctx.stroke();
    if (c.landed) {
      ctx.strokeStyle = 'rgba(247,201,72,0.6)';
      ctx.beginPath(); ctx.arc(cx, cy, 12 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

function drawHUD(ctx, level) {
  // Top bar.
  ctx.fillStyle = 'rgba(8,8,14,0.82)';
  ctx.fillRect(0, 0, VIEW_W, 46);
  ctx.fillStyle = CREAM;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(level.def.name.toUpperCase(), 16, 29);
  // Alarm meter, centre.
  const ax = VIEW_W / 2 - 170, ay = 13, aw = 340, ah = 20;
  ctx.fillStyle = '#3a1420';
  roundRect(ctx, ax, ay, aw, ah, 5);
  ctx.fill();
  const frac = level.alarm / ALARM_BUSTED;
  const col = frac < 0.4 ? '#57c465' : frac < ALARM_HOT / 100 ? '#f7c948' : '#ff5040';
  ctx.fillStyle = col;
  if (frac > 0.01) { roundRect(ctx, ax, ay, Math.max(8, aw * frac), ah, 5); ctx.fill(); }
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 1.5;
  roundRect(ctx, ax, ay, aw, ah, 5);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(level.alarm)}%`, ax + aw / 2, ay + 15);
  if (level.seenNow) {
    ctx.fillStyle = '#ff5040';
    ctx.font = '900 15px system-ui, sans-serif';
    ctx.fillText('SPOTTED!', VIEW_W / 2, 62);
  }
  // Right side: loot, coins, blackouts, score, time.
  ctx.textAlign = 'right';
  ctx.fillStyle = CREAM;
  ctx.font = '700 15px system-ui, sans-serif';
  const mins = Math.floor(level.time / 60);
  const secs = Math.floor(level.time % 60).toString().padStart(2, '0');
  ctx.fillText(
    `LOOT ${lootTakenCount(level)}/${level.loot.length}   COINS ${level.coins}   BLACKOUT ${level.blackouts}   SCORE ${level.score}   ${mins}:${secs}`,
    VIEW_W - 16, 29,
  );
  // Objective line.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(242,230,201,0.85)';
  ctx.font = '600 14px system-ui, sans-serif';
  const starTaken = level.loot.find((l) => l.kind === 'diamond').taken;
  ctx.fillText(
    starTaken ? 'The Star is yours — reach the SERVICE DOOR at the bottom.' : level.def.brief,
    VIEW_W / 2, VIEW_H - 8,
  );
  // Message toast.
  if (level.messageT > 0) {
    ctx.fillStyle = 'rgba(8,8,14,0.8)';
    const w = ctx.measureText(level.message).width + 28;
    roundRect(ctx, VIEW_W / 2 - w / 2, 56, w, 28, 6);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText(level.message, VIEW_W / 2, 75);
  }
  // Exit door label.
  ctx.fillStyle = '#57c465';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('EXIT', level.exit.x + level.exit.w / 2, level.exit.y - 6);
}

function drawExit(ctx, level) {
  const e = level.exit;
  ctx.fillStyle = '#1d4d2a';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = '#57c465';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#57c465';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(6,6,12,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function overlayTitle(ctx, text, sub, lines, foot) {
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = '900 64px Georgia, serif';
  ctx.fillText(text, VIEW_W / 2, 220);
  ctx.fillStyle = CREAM;
  ctx.font = '600 22px Georgia, serif';
  ctx.fillText(sub, VIEW_W / 2, 262);
  ctx.fillStyle = 'rgba(242,230,201,0.9)';
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 330 + i * 26));
  ctx.fillStyle = GOLD;
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText(foot, VIEW_W / 2, 330 + lines.length * 26 + 36);
}

export function render(ctx, game) {
  const level = game.level;
  const t = game.now;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx);
  drawExit(ctx, level);
  for (const o of level.obstacles) drawObstacle(ctx, o);
  for (const cam of level.cameras) drawCamera(ctx, cam, level.blackout > 0);
  for (const l of level.loot) drawLoot(ctx, l, t);
  for (const g of level.guards) drawGuard(ctx, g, t, level.blackout > 0);
  drawPlayer(ctx, level, t);
  drawHUD(ctx, level);

  if (level.blackout > 0) {
    ctx.fillStyle = 'rgba(2,2,8,0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#7fd4ff';
    ctx.font = '900 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`POWER CUT — ${Math.ceil(level.blackout)}s`, VIEW_W / 2, 110);
  }

  if (game.screen === 'title') {
    dim(ctx);
    overlayTitle(ctx, 'THE VELVET VAULT', 'A Midnight Heist', [
      'WASD / arrows — move    Shift — sneak (harder to spot)',
      'Hold E beside loot to pocket it — grab the Star of Midnight',
      'Click — toss a coin to lure a guard    Q — cut the power (limited)',
      'Stay out of the yellow cones. Cameras sweep. If the alarm hits 100%, you are done.',
      'Steal the Star, then slip out the SERVICE DOOR at the bottom.',
    ], 'Press ENTER or click to begin');
  } else if (level.status === 'won') {
    dim(ctx);
    overlayTitle(ctx, 'HEIST COMPLETE', `${level.def.name} — clean getaway`, [
      `Score ${level.score}  ·  Loot ${lootTakenCount(level)}/${level.loot.length}  ·  Time ${Math.floor(level.time / 60)}:${Math.floor(level.time % 60).toString().padStart(2, '0')}`,
      level.index + 1 < 3 ? 'The next night is harder. The curator is already suspicious.' : 'Three nights, three clean getaways. The Velvet Vault is yours.',
    ], level.index + 1 < 3 ? 'Press R for the next night' : 'Press R to play again');
  } else if (level.status === 'busted') {
    dim(ctx);
    overlayTitle(ctx, 'BUSTED!', 'The alarm hit 100% — the museum is crawling with police', [
      `Score ${level.score}  ·  Loot ${lootTakenCount(level)}/${level.loot.length}`,
    ], 'Press R to try the night again');
  } else if (level.status === 'caught') {
    dim(ctx);
    overlayTitle(ctx, 'CAUGHT!', 'A guard got hands on you in the gallery', [
      `Score ${level.score}  ·  Loot ${lootTakenCount(level)}/${level.loot.length}`,
    ], 'Press R to try the night again');
  }
}
