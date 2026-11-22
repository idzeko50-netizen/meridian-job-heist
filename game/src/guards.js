// Guard patrol AI: patrol -> suspicious (pause and look) -> alarm (chase)
// -> return (walk back to the route). Guards never teleport; a chase that
// loses the player for the alarm window ends in a return walk.
import { GUARD } from './config.js';
import { circleHitsRect, resolveCircleRect, clampToFloor, inCone } from './sight.js';

export function makeGuard(def) {
  return {
    x: def.x,
    y: def.y,
    waypoints: def.waypoints.map(([x, y]) => ({ x, y })),
    wp: 0,
    pause: def.pause,
    wait: 0,
    facing: Math.PI / 2,
    state: 'patrol', // patrol | suspicious | alarm | return
    lookTimer: 0,
    lookX: def.x,
    lookY: def.y,
    lastSeenX: def.x,
    lastSeenY: def.y,
    seen: false,
    // Footstep timing for the audio layer.
    stepPhase: 0,
  };
}

function moveToward(g, tx, ty, speed, dt, blockers) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  const nx = g.x + (dx / d) * step;
  const ny = g.y + (dy / d) * step;
  g.facing = Math.atan2(dy, dx);
  const probe = { x: nx, y: ny };
  for (const b of blockers) {
    if (circleHitsRect(probe.x, probe.y, GUARD.radius, b)) {
      // Slide along one axis when the diagonal is blocked.
      const px = { x: nx, y: g.y };
      const py = { x: g.x, y: ny };
      const okX = !blockers.some((r) => circleHitsRect(px.x, px.y, GUARD.radius, r));
      const okY = !blockers.some((r) => circleHitsRect(py.x, py.y, GUARD.radius, r));
      if (okX && !okY) {
        g.x = nx;
      } else if (okY && !okX) {
        g.y = ny;
      } else if (okX && okY) {
        // Prefer the axis with more progress.
        if (Math.abs(dx) >= Math.abs(dy)) g.x = nx;
        else g.y = ny;
      }
      clampToFloor(g, GUARD.radius);
      return false;
    }
  }
  g.x = nx;
  g.y = ny;
  clampToFloor(g, GUARD.radius);
  return d - step < 2;
}

// Does this guard see the player right now?
export function guardSees(g, player, sightBlockers, shadow) {
  const seen = inCone(
    g.x, g.y, g.facing, GUARD.viewAngle, GUARD.viewDist,
    player.x, player.y, sightBlockers,
  );
  if (!seen) return { seen: false, rate: 0 };
  const dist = Math.hypot(player.x - g.x, player.y - g.y);
  const distFactor = 1 - (dist / GUARD.viewDist) * 0.55;
  const rate = distFactor * (player.sneaking ? 0.55 : 1) * (shadow ? 0.5 : 1);
  return { seen: true, rate: Math.max(0.05, rate) };
}

export function updateGuard(g, dt, world) {
  const { blockers } = world;
  const player = world.player;
  const speed =
    g.state === 'alarm' ? GUARD.chaseSpeed : g.state === 'return' ? GUARD.returnSpeed : GUARD.patrolSpeed;

  if (g.state === 'patrol') {
    if (g.wait > 0) {
      g.wait -= dt;
    } else {
      const target = g.waypoints[g.wp];
      if (moveToward(g, target.x, target.y, speed, dt, blockers)) {
        g.wp = (g.wp + 1) % g.waypoints.length;
        g.wait = g.pause;
      }
    }
  } else if (g.state === 'suspicious') {
    // Stand, look at the spot that startled them, then resume the route.
    g.lookTimer -= dt;
    g.facing = Math.atan2(g.lookY - g.y, g.lookX - g.x);
    if (g.lookTimer <= 0) g.state = 'patrol';
  } else if (g.state === 'alarm') {
    moveToward(g, g.lastSeenX, g.lastSeenY, speed, dt, blockers);
  } else if (g.state === 'return') {
    // Walk back to the nearest waypoint, then resume patrolling.
    let best = 0;
    let bestD = Infinity;
    g.waypoints.forEach((w, i) => {
      const d = Math.hypot(w.x - g.x, w.y - g.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    g.wp = best;
    if (moveToward(g, g.waypoints[g.wp].x, g.waypoints[g.wp].y, speed, dt, blockers)) {
      g.state = 'patrol';
    }
  }

  // Footstep phase advances with movement, for the audio layer.
  g.stepPhase += dt * (g.state === 'alarm' ? 7 : 4.5);
}

export function guardStartle(g, x, y) {
  if (g.state === 'alarm') return;
  g.state = 'suspicious';
  g.lookX = x;
  g.lookY = y;
  g.lookTimer = 1.6;
}

export function guardAlarm(g, x, y) {
  g.state = 'alarm';
  g.lastSeenX = x;
  g.lastSeenY = y;
}

export function guardCalm(g) {
  if (g.state === 'alarm') g.state = 'return';
}

// Keep a guard out of walls after any direct position change.
export function resolveGuard(g, blockers) {
  for (const b of blockers) resolveCircleRect(g, GUARD.radius, b);
  clampToFloor(g, GUARD.radius);
}
