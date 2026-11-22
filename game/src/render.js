// Drawing the world: floor, walls, cover, doors, loot, exit, cameras,
// guards and their vision cones, the thief. All procedural canvas art;
// no images, no fonts beyond the system serif/sans pair.
import { VIEW, FLOOR, PALETTE, GUARD, CAMERA } from './config.js';
import { cameraIsOff } from './cameras.js';

function conePath(ctx, x, y, angle, halfAngle, dist) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, dist, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, dist, fill, edge) {
  conePath(ctx, x, y, angle, halfAngle, dist);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawWorld(ctx, world, time) {
  const { level } = world;
  const alarm = world.alarm;

  // Floor: two-tone vault-green checker, faint seams.
  const tile = 58;
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += tile) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += tile) {
      const odd = (Math.floor((x - FLOOR.x) / tile) + Math.floor((y - FLOOR.y) / tile)) % 2 === 0;
      ctx.fillStyle = odd ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = FLOOR.x; x <= FLOOR.x + FLOOR.w; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR.y);
    ctx.lineTo(x, FLOOR.y + FLOOR.h);
    ctx.stroke();
  }
  for (let y = FLOOR.y; y <= FLOOR.y + FLOOR.h; y += tile) {
    ctx.beginPath();
    ctx.moveTo(FLOOR.x, y);
    ctx.lineTo(FLOOR.x + FLOOR.w, y);
    ctx.stroke();
  }

  // Shadow zones: darker floor where detection drains.
  for (const s of level.shadow) {
    ctx.fillStyle = PALETTE.shadow;
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(76, 195, 138, 0.25)';
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w, s.h);
    ctx.setLineDash([]);
  }

  // Outer wall frame.
  ctx.strokeStyle = PALETTE.wallTop;
  ctx.lineWidth = 6;
  ctx.strokeRect(FLOOR.x - 3, FLOOR.y - 3, FLOOR.w + 6, FLOOR.h + 6);
  ctx.strokeStyle = PALETTE.wall;
  ctx.lineWidth = 2;
  ctx.strokeRect(FLOOR.x + 2, FLOOR.y + 2, FLOOR.w - 4, FLOOR.h - 4);

  // Exit: the van door. Green and labelled once the loot is taken.
  const ex = level.exit;
  ctx.fillStyle = world.lootTaken ? PALETTE.exitDoor : '#3a3f45';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = world.lootTaken ? PALETTE.exit : '#6a7076';
  ctx.lineWidth = 3;
  ctx.strokeRect(ex.x + 1, ex.y + 1, ex.w - 2, ex.h - 2);
  ctx.fillStyle = world.lootTaken ? '#eafff3' : '#c9cdd2';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.lootTaken ? 'VAN — GO' : 'VAN', ex.x + ex.w / 2, ex.y + ex.h / 2);

  // Loot: a gold diamond on a brass plinth, gently pulsing.
  if (!world.lootTaken) {
    const pulse = 1 + Math.sin(time * 2.4) * 0.12;
    const lx = level.loot.x;
    const ly = level.loot.y;
    const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 46 * pulse);
    glow.addColorStop(0, 'rgba(255, 211, 77, 0.55)');
    glow.addColorStop(1, 'rgba(255, 211, 77, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, 46 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.moveTo(lx, ly - 13);
    ctx.lineTo(lx + 11, ly);
    ctx.lineTo(lx, ly + 13);
    ctx.lineTo(lx - 11, ly);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.lootGlow;
    ctx.beginPath();
    ctx.moveTo(lx, ly - 7);
    ctx.lineTo(lx + 5, ly);
    ctx.lineTo(lx, ly + 7);
    ctx.lineTo(lx - 5, ly);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a6d1a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(level.lootName.toUpperCase(), lx, ly + 30);
  }

  // Walls: dark green with a brass top edge.
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }

  // Locked doors: brass door with a keyhole; open ones are a gap with a frame.
  for (const d of level.lockedDoors) {
    if (d.open) {
      ctx.strokeStyle = PALETTE.coverEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x, d.y, d.w, d.h);
    } else {
      ctx.fillStyle = '#7a5c14';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = '#2a1f05';
      ctx.beginPath();
      ctx.arc(d.x + d.w / 2, d.y + d.h / 2 - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(d.x + d.w / 2 - 1, d.y + d.h / 2 - 2, 2, 8);
    }
  }

  // Cover: tall pieces read as solid furniture, low ones as obstacles.
  for (const c of level.cover) {
    ctx.fillStyle = c.tall ? PALETTE.coverTall : PALETTE.cover;
    roundRect(ctx, c.x, c.y, c.w, c.h, 6);
    ctx.fill();
    ctx.strokeStyle = PALETTE.coverEdge;
    ctx.lineWidth = c.tall ? 2 : 1;
    ctx.stroke();
    if (c.tall) {
      ctx.fillStyle = 'rgba(201, 162, 39, 0.35)';
      ctx.fillRect(c.x + 6, c.y + 6, c.w - 12, 5);
    }
  }

  // Smoke clouds.
  for (const s of world.tools.smokes) {
    if (world.time > s.until) continue;
    const fade = Math.min(1, (s.until - world.time) / 1.5);
    ctx.fillStyle = `rgba(180, 190, 185, ${0.35 * fade})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 228, 222, ${0.25 * fade})`;
    ctx.beginPath();
    ctx.arc(s.x - 24, s.y + 12, 42, 0, Math.PI * 2);
    ctx.arc(s.x + 26, s.y - 14, 48, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cameras first (their cones sit under the guards), then guards, then player.
  for (const cam of world.cameras) {
    const off = cameraIsOff(cam, world.time);
    if (!off) {
      drawCone(
        ctx, cam.x, cam.y, cam.angle, CAMERA.viewAngle, CAMERA.viewDist,
        'rgba(245, 185, 66, 0.10)', 'rgba(245, 185, 66, 0.35)',
      );
    }
    // Wall mount + lens.
    ctx.fillStyle = off ? '#4a4f55' : PALETTE.cameraBody;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = off ? '#333' : PALETTE.cameraLens;
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
    if (off) {
      ctx.fillStyle = '#c9cdd2';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFF', cam.x, cam.y + 20);
    }
  }

  for (const g of world.guards) {
    const hot = alarm || g.state === 'alarm' || g.state === 'suspicious';
    drawCone(
      ctx, g.x, g.y, g.facing, GUARD.viewAngle, GUARD.viewDist,
      hot ? 'rgba(229, 72, 77, 0.13)' : 'rgba(245, 185, 66, 0.11)',
      hot ? 'rgba(229, 72, 77, 0.5)' : 'rgba(245, 185, 66, 0.4)',
    );
    // Guard: navy body, pale visor slit, facing tick.
    ctx.fillStyle = g.state === 'alarm' ? '#7a2e31' : PALETTE.guardDark;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.guard;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#dfe9f2';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing) * 5, g.y + Math.sin(g.facing) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
    if (g.state === 'suspicious') {
      ctx.fillStyle = PALETTE.cone;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 20);
    } else if (g.state === 'alarm') {
      ctx.fillStyle = PALETTE.coneHot;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 20);
    }
  }

  // The thief: cream coat, crimson scarf, facing tick. Sneaking crouches.
  const p = world.player;
  const pr = p.sneaking ? 9 : 11;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 8, pr + 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.playerScarf;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, pr - 1, p.facing + 2.2, p.facing + 4.1);
  ctx.stroke();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 5, p.y + Math.sin(p.facing) * 5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(242, 234, 216, 0.6)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, pr + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Lockpick progress ring over the door being picked.
  if (world.tools.lockpicking) {
    const lp = world.tools.lockpicking;
    const d = lp.door;
    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;
    ctx.strokeStyle = PALETTE.loot;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + (lp.progress / 2) * Math.PI * 2);
    ctx.stroke();
  }

  void VIEW;
}
