// World state: one room at a time. Detection fills while any guard or
// camera sees the thief and drains in shadow; a full meter raises the
// alarm and the guards chase; a touch while alarmed ends the job. Grab
// the loot, then reach the van door. Three rooms, then the take is yours.
import { LEVELS } from './levels.js';
import { PLAYER, GUARD, FLOOR, LOOT_NAMES } from './config.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeGuard, updateGuard, guardSees, guardStartle, guardAlarm, guardCalm } from './guards.js';
import { makeCamera, updateCamera, cameraSees } from './cameras.js';
import { makeTools, useEmp, useSmoke, updateLockpick, inSmoke, nearestLockedDoor } from './tools.js';
import { sightBlockers, moveBlockers, inShadow, rectContains } from './sight.js';

export function makeWorld(levelIndex) {
  const level = LEVELS[levelIndex];
  const world = {
    levelIndex,
    level,
    player: makePlayer(level.start),
    guards: level.guards.map(makeGuard),
    cameras: level.cameras.map(makeCamera),
    tools: makeTools(),
    blockers: moveBlockers(level),
    sight: sightBlockers(level),
    detection: 0,
    alarm: false,
    alarmTimer: 0,
    nearMiss: false,
    lootTaken: false,
    take: [],
    status: 'play', // play | caught | roomClear | win
    time: 0,
    roomTime: 0,
    message: '',
    messageTimer: 0,
    lastSeenX: level.start.x,
    lastSeenY: level.start.y,
    events: [], // one-frame event names for the audio layer
  };
  return world;
}

export function nextRoom(world) {
  const next = world.levelIndex + 1;
  const fresh = makeWorld(next);
  // The take was already appended when the room's exit was reached.
  fresh.take = [...world.take];
  return fresh;
}

function setMessage(world, text, seconds = 2.5) {
  world.message = text;
  world.messageTimer = seconds;
}

export function updateWorld(world, input, dt) {
  if (world.status !== 'play') return;
  world.time += dt;
  world.roomTime += dt;
  world.events.length = 0;
  if (world.messageTimer > 0) world.messageTimer -= dt;

  const { level, player } = world;
  player.lockpickHeld = !!input.lockpick;

  // Tools: edge-triggered from the input layer.
  if (input.emp) {
    const res = useEmp(world.tools, player, world.cameras, world.time);
    if (res.ok) {
      world.events.push('emp');
      setMessage(world, 'Camera dark — move now.');
    } else {
      setMessage(world, res.reason === 'no EMP charges left' ? 'EMP spent.' : 'No camera in range.');
    }
    input.emp = false;
  }
  if (input.smoke) {
    const res = useSmoke(world.tools, player, world.time);
    if (res.ok) {
      world.events.push('smoke');
      setMessage(world, 'Smoke out — stay inside it.');
    } else {
      setMessage(world, 'Smoke spent.');
    }
    input.smoke = false;
  }
  const opened = updateLockpick(world.tools, dt, player, level.lockedDoors);
  if (opened) {
    world.events.push('lockpick');
    world.blockers = moveBlockers(level);
    world.sight = sightBlockers(level);
    setMessage(world, 'Shortcut open.');
  }

  updatePlayer(player, input, dt, world.blockers);
  for (const cam of world.cameras) updateCamera(cam, world.time);

  // Who sees the thief, and how fast does the meter fill? Smoke hides
  // the thief outright; shadow only slows the fill.
  const smoked = inSmoke(world.tools, player.x, player.y, world.time);
  const shadow = inShadow(player.x, player.y, level) || smoked;
  let seenRate = 0;
  let seenByGuard = null;
  if (!smoked) {
    for (const g of world.guards) {
      const r = guardSees(g, player, world.sight, shadow);
      if (r.seen && r.rate > seenRate) {
        seenRate = r.rate;
        seenByGuard = g;
      }
    }
    for (const cam of world.cameras) {
      const r = cameraSees(cam, player, world.sight, shadow, world.time);
      if (r.seen && r.rate > seenRate) seenRate = r.rate;
    }
  }
  const seen = seenRate > 0;

  if (seen) {
    world.detection = Math.min(1, world.detection + PLAYER.fillBase * seenRate * dt);
    world.lastSeenX = player.x;
    world.lastSeenY = player.y;
    if (seenByGuard && !world.alarm) {
      // A guard that spots you at close range turns to look hard.
      if (world.detection > 0.4) guardStartle(seenByGuard, player.x, player.y);
    }
  } else {
    const drain = PLAYER.drainBase * (shadow ? 1.8 : 1);
    world.detection = Math.max(0, world.detection - drain * dt);
  }
  world.nearMiss = world.detection >= 0.65 && world.detection < 1;

  if (world.detection >= 1 && !world.alarm) {
    world.alarm = true;
    world.alarmTimer = PLAYER.alarmDecayAfter;
    world.events.push('alarm');
    for (const g of world.guards) guardAlarm(g, world.lastSeenX, world.lastSeenY);
    setMessage(world, 'ALARM — break line of sight!', 3);
  }

  if (world.alarm) {
    if (seen) {
      world.alarmTimer = PLAYER.alarmDecayAfter;
      for (const g of world.guards) guardAlarm(g, world.lastSeenX, world.lastSeenY);
    } else {
      world.alarmTimer -= dt;
      if (world.alarmTimer <= 0) {
        world.alarm = false;
        world.detection = 0.4;
        for (const g of world.guards) guardCalm(g);
        setMessage(world, 'They lost you. Stay quiet.');
      }
    }
  }

  for (const g of world.guards) updateGuard(g, dt, world);

  // Caught only on touch while the alarm is up: a fair caught moment.
  if (world.alarm) {
    for (const g of world.guards) {
      if (Math.hypot(g.x - player.x, g.y - player.y) < GUARD.catchDist) {
        world.status = 'caught';
        world.events.push('caught');
        return;
      }
    }
  } else {
    // A bump while calm startles the guard instead of ending the run.
    for (const g of world.guards) {
      if (Math.hypot(g.x - player.x, g.y - player.y) < GUARD.catchDist) {
        world.detection = Math.min(1, world.detection + GUARD.bumpSuspicion);
        guardStartle(g, player.x, player.y);
        world.events.push('bump');
        break;
      }
    }
  }

  // Loot pickup.
  if (!world.lootTaken && Math.hypot(level.loot.x - player.x, level.loot.y - player.y) < 30) {
    world.lootTaken = true;
    world.events.push('loot');
    setMessage(world, `${level.lootName} secured — get to the van.`, 3);
  }

  // Getaway: the van door only opens once the loot is taken.
  if (world.lootTaken && rectContains(level.exit, player.x, player.y)) {
    world.take = [...world.take, LOOT_NAMES[world.levelIndex]];
    world.events.push('escape');
    if (world.levelIndex >= LEVELS.length - 1) {
      world.status = 'win';
    } else {
      world.status = 'roomClear';
    }
  }
}

// BFS reachability over a coarse grid, for the headless tests: can the
// thief walk from start to the loot, and from the loot to the exit?
export function reachable(levelIndex) {
  const level = LEVELS[levelIndex];
  const cell = 20;
  const cols = Math.ceil(1280 / cell);
  const rows = Math.ceil(720 / cell);
  const blocked = new Uint8Array(cols * rows);
  const blockers = moveBlockers(level);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cell + cell / 2;
      const y = r * cell + cell / 2;
      if (x < FLOOR.x || x > FLOOR.x + FLOOR.w || y < FLOOR.y || y > FLOOR.y + FLOOR.h) {
        blocked[r * cols + c] = 1;
        continue;
      }
      for (const b of blockers) {
        if (x >= b.x - 11 && x <= b.x + b.w + 11 && y >= b.y - 11 && y <= b.y + b.h + 11) {
          blocked[r * cols + c] = 1;
          break;
        }
      }
    }
  }
  function bfs(from, to) {
    const start = [Math.floor(from.x / cell), Math.floor(from.y / cell)];
    const goal = [Math.floor(to.x / cell), Math.floor(to.y / cell)];
    const seen = new Uint8Array(cols * rows);
    const queue = [start];
    seen[start[1] * cols + start[0]] = 1;
    const path = new Map();
    path.set(`${start[0]},${start[1]}`, null);
    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (cx === goal[0] && cy === goal[1]) {
        const out = [];
        let key = `${cx},${cy}`;
        while (key) {
          const [px, py] = key.split(',').map(Number);
          out.push({ x: px * cell + cell / 2, y: py * cell + cell / 2 });
          key = path.get(key);
        }
        return out.reverse();
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (blocked[ny * cols + nx] || seen[ny * cols + nx]) continue;
        seen[ny * cols + nx] = 1;
        path.set(`${nx},${ny}`, `${cx},${cy}`);
        queue.push([nx, ny]);
      }
    }
    return null;
  }
  const toLoot = bfs(level.start, level.loot);
  const exitCentre = { x: level.exit.x + level.exit.w / 2, y: level.exit.y + level.exit.h / 2 };
  const toExit = toLoot ? bfs(level.loot, exitCentre) : null;
  return { toLoot, toExit };
}
