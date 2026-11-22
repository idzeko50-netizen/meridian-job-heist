// The crew's tools. Each one costs something, so the choice matters:
// EMP (key 1) kills the nearest camera for a few seconds, but there are
// only two charges a room. Smoke (key 3) hides you where you stand, but
// there is only one bomb a room. The lockpick (key 2 / E at a locked
// door) opens a shortcut, but you stand still for two seconds to use it.
import { TOOLS } from './config.js';
import { empCamera } from './cameras.js';

export function makeTools() {
  return {
    emp: TOOLS.empPerRoom,
    smoke: TOOLS.smokePerRoom,
    lockpicking: null, // { door, progress } while channelling, else null
    smokes: [], // { x, y, until }
  };
}

export function useEmp(tools, player, cameras, now) {
  if (tools.emp <= 0) return { ok: false, reason: 'no EMP charges left' };
  let best = null;
  let bestD = TOOLS.empRange;
  for (const cam of cameras) {
    const d = Math.hypot(cam.x - player.x, cam.y - player.y);
    if (d < bestD) {
      bestD = d;
      best = cam;
    }
  }
  if (!best) return { ok: false, reason: 'no camera in EMP range' };
  empCamera(best, now);
  tools.emp -= 1;
  return { ok: true, camera: best };
}

export function useSmoke(tools, player, now) {
  if (tools.smoke <= 0) return { ok: false, reason: 'no smoke bombs left' };
  tools.smoke -= 1;
  tools.smokes.push({ x: player.x, y: player.y, until: now + TOOLS.smokeDuration });
  return { ok: true };
}

export function inSmoke(tools, x, y, now) {
  for (const s of tools.smokes) {
    if (now > s.until) continue;
    if (Math.hypot(x - s.x, y - s.y) < TOOLS.smokeRadius) return true;
  }
  return false;
}

export function nearestLockedDoor(doors, player) {
  for (const d of doors) {
    if (d.open) continue;
    const cx = d.x + d.w / 2;
    const cy = d.y + d.h / 2;
    if (Math.hypot(cx - player.x, cy - player.y) < 46) return d;
  }
  return null;
}

// Hold E (or key 2) beside a locked door: stand still and channel.
export function updateLockpick(tools, dt, player, doors) {
  const door = nearestLockedDoor(doors, player);
  if (!door) {
    tools.lockpicking = null;
    return null;
  }
  if (!player.lockpickHeld) {
    tools.lockpicking = null;
    return null;
  }
  if (!tools.lockpicking || tools.lockpicking.door !== door) {
    tools.lockpicking = { door, progress: 0 };
  }
  tools.lockpicking.progress += dt;
  if (tools.lockpicking.progress >= TOOLS.lockpickChannel) {
    door.open = true;
    tools.lockpicking = null;
    return door;
  }
  return null;
}
