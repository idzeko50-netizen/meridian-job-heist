// The thief: WASD / arrows to move, Shift to sneak. Movement is a circle
// against the room's rects, sliding along one axis when the diagonal is
// blocked, so the player never sticks on a corner.
import { PLAYER } from './config.js';
import { circleHitsRect, resolveCircleRect, clampToFloor } from './sight.js';

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    lockpickHeld: false,
    stepPhase: 0,
  };
}

export function updatePlayer(player, input, dt, blockers) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  player.moving = dx !== 0 || dy !== 0;
  player.sneaking = !!input.sneak;
  if (!player.moving) return;

  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const step = speed * dt;
  const nx = player.x + dx * step;
  const ny = player.y + dy * step;
  player.facing = Math.atan2(dy, dx);

  const probe = { x: nx, y: ny };
  const blocked = blockers.some((b) => circleHitsRect(probe.x, probe.y, PLAYER.radius, b));
  if (!blocked) {
    player.x = nx;
    player.y = ny;
  } else {
    // Slide: try each axis on its own.
    const px = { x: nx, y: player.y };
    const py = { x: player.x, y: ny };
    const okX = !blockers.some((b) => circleHitsRect(px.x, px.y, PLAYER.radius, b));
    const okY = !blockers.some((b) => circleHitsRect(py.x, py.y, PLAYER.radius, b));
    if (okX) player.x = nx;
    if (okY) player.y = ny;
  }
  for (const b of blockers) resolveCircleRect(player, PLAYER.radius, b);
  clampToFloor(player, PLAYER.radius);
  player.stepPhase += dt * (player.sneaking ? 5 : 8);
}
