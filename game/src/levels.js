// The three rooms of the Meridian bank job: Lobby, Gallery, Vault.
// Every room is data: walls block movement and sight, cover blocks
// movement (tall cover also blocks sight), shadow zones slow detection,
// locked doors are a lockpick shortcut, guards walk waypoint loops and
// cameras sweep from the walls. Coordinates are canvas pixels (1280x720);
// the floor is x 24..1256, y 72..696. Keep lanes open: BFS tests in
// /tmp prove start -> loot -> exit is reachable in every room.
export const LEVELS = [
  {
    name: 'Lobby',
    lootName: 'Cash bundles',
    loot: { x: 1050, y: 210 },
    start: { x: 220, y: 640 },
    exit: { x: 70, y: 652, w: 100, h: 34 },
    walls: [
      // Teller counter: long tall wall with a gap on the right.
      { x: 280, y: 300, w: 520, h: 34 },
      // Lockpick shortcut wall: a gap in the middle is the locked door.
      { x: 640, y: 334, w: 16, h: 56 },
      { x: 640, y: 446, w: 16, h: 24 },
    ],
    lockedDoors: [{ x: 640, y: 390, w: 16, h: 56, open: false }],
    cover: [
      { x: 420, y: 480, w: 44, h: 44, tall: true }, // pillar
      { x: 820, y: 480, w: 44, h: 44, tall: true }, // pillar
      { x: 120, y: 180, w: 70, h: 30, tall: false }, // planter
      { x: 1080, y: 180, w: 70, h: 30, tall: false }, // planter
      { x: 150, y: 520, w: 120, h: 44, tall: false }, // desk
      { x: 980, y: 420, w: 120, h: 36, tall: false }, // velvet rope
    ],
    shadow: [
      { x: 300, y: 340, w: 480, h: 70 }, // behind the teller counter
      { x: 1000, y: 560, w: 180, h: 110 }, // corner by the exit lane
    ],
    guards: [
      {
        x: 350, y: 150,
        waypoints: [[350, 150], [950, 150], [950, 230], [350, 230]],
        pause: 1.4,
      },
      {
        x: 300, y: 560,
        waypoints: [[300, 560], [1000, 560]],
        pause: 1.8,
      },
    ],
    cameras: [{ x: 640, y: 80, angle: Math.PI / 2, sweep: 0.85, phase: 0 }],
  },
  {
    name: 'Gallery',
    lootName: 'Gold bars',
    loot: { x: 640, y: 482 },
    start: { x: 90, y: 640 },
    exit: { x: 1180, y: 600, w: 60, h: 80 },
    walls: [
      { x: 300, y: 420, w: 14, h: 60 },
      { x: 300, y: 536, w: 14, h: 24 },
    ],
    lockedDoors: [{ x: 300, y: 480, w: 14, h: 56, open: false }],
    cover: [
      { x: 340, y: 300, w: 180, h: 60, tall: true }, // display case
      { x: 760, y: 300, w: 180, h: 60, tall: true }, // display case
      { x: 180, y: 180, w: 60, h: 180, tall: true }, // display case
      { x: 1040, y: 180, w: 60, h: 180, tall: true }, // display case
      { x: 560, y: 180, w: 160, h: 36, tall: false }, // bench
      { x: 560, y: 560, w: 160, h: 36, tall: false }, // bench
      { x: 600, y: 380, w: 80, h: 80, tall: true }, // sculpture plinth
    ],
    shadow: [
      { x: 60, y: 120, w: 120, h: 200 }, // left alcove
      { x: 1100, y: 480, w: 120, h: 180 }, // right alcove
    ],
    guards: [
      {
        x: 300, y: 140,
        waypoints: [[300, 140], [980, 140]],
        pause: 1.2,
      },
      {
        x: 400, y: 480,
        waypoints: [[400, 480], [880, 480], [880, 520], [400, 520]],
        pause: 1.0,
      },
      {
        x: 300, y: 620,
        waypoints: [[300, 620], [980, 620]],
        pause: 1.6,
      },
    ],
    cameras: [
      { x: 300, y: 80, angle: Math.PI / 2, sweep: 0.7, phase: 0 },
      { x: 980, y: 80, angle: Math.PI / 2, sweep: 0.7, phase: 2.1 },
    ],
  },
  {
    name: 'Vault',
    lootName: 'The Meridian Diamond',
    loot: { x: 640, y: 130 },
    start: { x: 90, y: 640 },
    exit: { x: 1150, y: 620, w: 80, h: 60 },
    walls: [
      // Vault alcove: two cheeks, open at the bottom.
      { x: 520, y: 80, w: 40, h: 140 },
      { x: 720, y: 80, w: 40, h: 140 },
      // Lockpick shortcut wall on the left approach.
      { x: 440, y: 220, w: 14, h: 40 },
      { x: 440, y: 316, w: 14, h: 24 },
      // Safe-deposit walls.
      { x: 180, y: 220, w: 200, h: 50, tall: true },
      { x: 900, y: 220, w: 200, h: 50, tall: true },
      { x: 180, y: 460, w: 200, h: 50, tall: true },
      { x: 900, y: 460, w: 200, h: 50, tall: true },
    ],
    lockedDoors: [{ x: 440, y: 260, w: 14, h: 56, open: false }],
    cover: [
      { x: 440, y: 330, w: 44, h: 44, tall: true }, // pillar
      { x: 840, y: 330, w: 44, h: 44, tall: true }, // pillar
      { x: 600, y: 520, w: 80, h: 40, tall: false }, // bench
    ],
    shadow: [
      { x: 60, y: 480, w: 140, h: 180 },
      { x: 1080, y: 480, w: 140, h: 180 },
    ],
    guards: [
      {
        x: 480, y: 260,
        waypoints: [[480, 260], [800, 260]],
        pause: 1.0,
      },
      {
        x: 120, y: 300,
        waypoints: [[120, 300], [120, 600], [400, 600], [400, 300]],
        pause: 1.2,
      },
      {
        x: 1160, y: 300,
        waypoints: [[1160, 300], [1160, 600], [820, 600], [820, 300]],
        pause: 1.2,
      },
      {
        x: 400, y: 640,
        waypoints: [[400, 640], [900, 640]],
        pause: 1.4,
      },
    ],
    cameras: [
      { x: 640, y: 80, angle: Math.PI / 2, sweep: 0.6, phase: 0 },
      { x: 200, y: 80, angle: Math.PI / 2, sweep: 0.7, phase: 1.3 },
      { x: 1080, y: 80, angle: Math.PI / 2, sweep: 0.7, phase: 2.6 },
    ],
  },
];
