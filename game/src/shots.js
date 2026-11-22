// Deterministic ?shot= scenes for the screenshots. Guards are placed by
// walking a fixed fraction of their patrol loop (no simulation, so the
// staging is exact every run), cameras are set at a fixed sweep time,
// and the meter/alarm are forced to the staged values. The cover shot
// (patrol) shows the whole game at once: room, thief, guards, cones,
// cameras, loot and the alarm meter.
import { makeWorld } from './world.js';
import { guardAlarm } from './guards.js';
import { updateCamera } from './cameras.js';

function placeGuardOnRoute(g, frac) {
  const pts = g.waypoints;
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({ a, b, len });
    total += len;
  }
  let d = frac * total;
  for (const s of segs) {
    if (d <= s.len) {
      const t = s.len === 0 ? 0 : d / s.len;
      g.x = s.a.x + (s.b.x - s.a.x) * t;
      g.y = s.a.y + (s.b.y - s.a.y) * t;
      g.facing = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
      g.wp = pts.indexOf(s.b);
      g.wait = 0;
      return;
    }
    d -= s.len;
  }
}

function stageCameras(world, t) {
  for (const cam of world.cameras) updateCamera(cam, t);
}

export function stageShot(name) {
  if (name === 'start') {
    return { screen: 'title', world: makeWorld(0) };
  }
  if (name === 'patrol') {
    // Gallery, mid-room: the cover. Thief below the central plinth, gold
    // bars in sight, three guards mid-patrol, both cameras sweeping.
    const world = makeWorld(1);
    world.player.x = 640;
    world.player.y = 600;
    world.player.facing = -Math.PI / 2;
    const fracs = [0.15, 0.6, 0.85];
    world.guards.forEach((g, i) => placeGuardOnRoute(g, fracs[i]));
    stageCameras(world, 2.0);
    world.detection = 0.3;
    world.time = 2.0;
    return { screen: 'play', world };
  }
  if (name === 'alarm') {
    // Vault, alarm up: red cones, meter near full, thief on the approach.
    const world = makeWorld(2);
    world.player.x = 640;
    world.player.y = 320;
    world.player.facing = -Math.PI / 2;
    const fracs = [0.6, 0.3, 0.3, 0.5];
    world.guards.forEach((g, i) => placeGuardOnRoute(g, fracs[i]));
    stageCameras(world, 4.5);
    world.detection = 0.85;
    world.alarm = true;
    world.alarmTimer = 4;
    world.lastSeenX = world.player.x;
    world.lastSeenY = world.player.y;
    for (const g of world.guards) guardAlarm(g, world.player.x, world.player.y);
    world.time = 4.5;
    return { screen: 'play', world };
  }
  if (name === 'exit') {
    // Vault, loot taken: the van door is open, thief running for it.
    const world = makeWorld(2);
    world.player.x = 1000;
    world.player.y = 640;
    world.player.facing = 0;
    const fracs = [0.2, 0.25, 0.75, 0.8];
    world.guards.forEach((g, i) => placeGuardOnRoute(g, fracs[i]));
    stageCameras(world, 6.0);
    world.lootTaken = true;
    world.detection = 0.15;
    world.time = 6.0;
    return { screen: 'play', world };
  }
  return null;
}
