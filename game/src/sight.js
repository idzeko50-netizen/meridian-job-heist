// Geometry: collision, line of sight and vision cones.
// Everything is rects and circles in canvas pixels; no tile map.
import { FLOOR } from './config.js';

export function rectContains(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// Push a circle out of a rect; returns true when a push happened.
export function resolveCircleRect(pos, r, rect) {
  const nx = Math.max(rect.x, Math.min(pos.x, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(pos.y, rect.y + rect.h));
  let dx = pos.x - nx;
  let dy = pos.y - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return false;
  if (d2 === 0) {
    // Centre inside the rect: push out along the smallest penetration.
    const left = pos.x - rect.x;
    const right = rect.x + rect.w - pos.x;
    const top = pos.y - rect.y;
    const bottom = rect.y + rect.h - pos.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) pos.x = rect.x - r;
    else if (m === right) pos.x = rect.x + rect.w + r;
    else if (m === top) pos.y = rect.y - r;
    else pos.y = rect.y + rect.h + r;
    return true;
  }
  const d = Math.sqrt(d2);
  dx /= d;
  dy /= d;
  pos.x = nx + dx * r;
  pos.y = ny + dy * r;
  return true;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (rectContains(rect, x1, y1) || rectContains(rect, x2, y2)) return true;
  const { x, y, w, h } = rect;
  return (
    segmentsCross(x1, y1, x2, y2, x, y, x + w, y) ||
    segmentsCross(x1, y1, x2, y2, x + w, y, x + w, y + h) ||
    segmentsCross(x1, y1, x2, y2, x + w, y + h, x, y + h) ||
    segmentsCross(x1, y1, x2, y2, x, y + h, x, y)
  );
}

// True when nothing tall stands between (x1,y1) and (x2,y2).
export function hasLineOfSight(x1, y1, x2, y2, blockers) {
  for (const b of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}

// Is (x,y) inside a watcher's vision cone, with line of sight?
export function inCone(wx, wy, angle, halfAngle, dist, x, y, blockers) {
  const dx = x - wx;
  const dy = y - wy;
  const d = Math.hypot(dx, dy);
  if (d > dist) return false;
  if (d < 1) return true;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  return hasLineOfSight(wx, wy, x, y, blockers);
}

// Sight blockers for a level: walls, tall cover, closed locked doors.
export function sightBlockers(level) {
  const out = [...level.walls];
  for (const c of level.cover) if (c.tall) out.push(c);
  for (const d of level.lockedDoors) if (!d.open) out.push(d);
  return out;
}

// Movement blockers: walls, all cover, closed locked doors, plus the floor edge.
export function moveBlockers(level) {
  const out = [...level.walls, ...level.cover];
  for (const d of level.lockedDoors) if (!d.open) out.push(d);
  return out;
}

export function clampToFloor(pos, r) {
  pos.x = Math.max(FLOOR.x + r, Math.min(FLOOR.x + FLOOR.w - r, pos.x));
  pos.y = Math.max(FLOOR.y + r, Math.min(FLOOR.y + FLOOR.h - r, pos.y));
}

export function inShadow(x, y, level) {
  for (const s of level.shadow) if (rectContains(s, x, y)) return true;
  return false;
}
