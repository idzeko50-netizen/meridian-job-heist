// Wall-mounted security cameras: a cone that sweeps back and forth across
// its arc. An EMP kills one camera for CAMERA.empDuration seconds; while
// dark it sees nothing and its cone is gone from the render.
import { CAMERA } from './config.js';
import { inCone } from './sight.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.angle,
    sweep: def.sweep,
    phase: def.phase,
    angle: def.angle,
    offlineUntil: 0,
  };
}

export function updateCamera(cam, t) {
  cam.angle = cam.base + Math.sin(t * CAMERA.sweepSpeed + cam.phase) * cam.sweep;
}

export function cameraIsOff(cam, now) {
  return now < cam.offlineUntil;
}

export function cameraSees(cam, player, sightBlockers, shadow, now) {
  if (cameraIsOff(cam, now)) return { seen: false, rate: 0 };
  const seen = inCone(
    cam.x, cam.y, cam.angle, CAMERA.viewAngle, CAMERA.viewDist,
    player.x, player.y, sightBlockers,
  );
  if (!seen) return { seen: false, rate: 0 };
  const dist = Math.hypot(player.x - cam.x, player.y - cam.y);
  const distFactor = 1 - (dist / CAMERA.viewDist) * 0.5;
  const rate = distFactor * CAMERA.cameraFactor * (player.sneaking ? 0.55 : 1) * (shadow ? 0.5 : 1);
  return { seen: true, rate: Math.max(0.05, rate) };
}

export function empCamera(cam, now) {
  cam.offlineUntil = now + CAMERA.empDuration;
}
