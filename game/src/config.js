// Tuning and palette for The Meridian Job.
// One place for every number a designer would tweak: speeds, detection,
// tools, room pacing. Palette is bank-vault green + brass, deliberately
// not the ink-navy of the sibling stealth game.
export const VIEW = { width: 1280, height: 720 };
export const HUD_H = 56;

// Playable floor: inside the outer wall, below the HUD bar.
export const FLOOR = { x: 24, y: 72, w: 1232, h: 624 };

export const PLAYER = {
  radius: 11,
  walkSpeed: 168,
  sneakSpeed: 96,
  // Detection the player takes while standing in a cone, per second.
  // Tuned so a walk across a cone at mid-range costs ~0.45, a sneak ~0.25.
  fillBase: 0.5,
  drainBase: 0.38,
  sneakFactor: 0.55,
  shadowFactor: 0.5,
  cameraFactor: 0.7,
  // Alarm: how long out of sight before the alarm decays.
  alarmDecayAfter: 4,
  alarmDecayRate: 0.5,
};

export const GUARD = {
  radius: 12,
  patrolSpeed: 62,
  chaseSpeed: 132,
  returnSpeed: 80,
  viewDist: 235,
  viewAngle: 1.15, // radians, half-angle of the cone (~66 degrees each side)
  catchDist: 24,
  // A touch while calm only startles the guard: detection jumps, guard looks.
  bumpSuspicion: 0.35,
};

export const CAMERA = {
  viewDist: 250,
  viewAngle: 0.62,
  sweepSpeed: 0.55, // radians per second of sweep
  empDuration: 6, // seconds a camera stays dark after an EMP
};

export const TOOLS = {
  empPerRoom: 2,
  empRange: 280,
  smokePerRoom: 1,
  smokeRadius: 95,
  smokeDuration: 5,
  lockpickChannel: 2, // seconds standing at a locked door to open it
};

export const PALETTE = {
  // Floor: deep vault green, two alternating tiles.
  floorA: '#0e241c',
  floorB: '#0c1f18',
  floorLine: '#143328',
  wall: '#274b3a',
  wallTop: '#3a6b52',
  // Cover: brass-trimmed furniture, marble plinths, dark wood.
  cover: '#1d3a2d',
  coverEdge: '#c9a227',
  coverTall: '#16301f',
  // Safe / shadow: where detection drains.
  shadow: '#081712',
  // Danger: alarm red, cone amber.
  cone: '#f5b942',
  coneHot: '#e5484d',
  cameraBody: '#8a94a6',
  cameraLens: '#ff5a5a',
  // Loot: gold.
  loot: '#ffd34d',
  lootGlow: '#ffe9a3',
  // The thief: cream coat, crimson scarf.
  player: '#f2ead8',
  playerScarf: '#c0392b',
  guard: '#5b7fa6',
  guardDark: '#33475e',
  exit: '#4cc38a',
  exitDoor: '#1f7a4d',
  hudBg: '#08130e',
  hudText: '#e8e4d8',
  hudDim: '#9db8a6',
  title: '#ffd34d',
  paper: '#efe7d3',
};

export const ROOM_NAMES = ['Lobby', 'Gallery', 'Vault'];
export const LOOT_NAMES = ['Cash bundles', 'Gold bars', 'The Meridian Diamond'];
// Take shown on the win screen: what the crew walks away with.
export const TAKE = ['Cash bundles', 'Gold bars', 'The Meridian Diamond'];
