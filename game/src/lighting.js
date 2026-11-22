// Light and tension over the world: a vignette that keeps the room a
// night job, gold and green pools around the loot and the van door, and a
// red pulse while the alarm is up. Reduced motion drops the pulse.
import { VIEW, PALETTE } from './config.js';

export function drawLighting(ctx, world, time, reducedMotion) {
  // Vignette: dark edges, clear centre.
  const grad = ctx.createRadialGradient(
    VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.42,
    VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.95,
  );
  grad.addColorStop(0, 'rgba(2, 8, 5, 0)');
  grad.addColorStop(1, 'rgba(2, 8, 5, 0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Warm pool over the loot, green pool over the van door.
  const { level } = world;
  if (!world.lootTaken) {
    const g = ctx.createRadialGradient(level.loot.x, level.loot.y, 4, level.loot.x, level.loot.y, 120);
    g.addColorStop(0, 'rgba(255, 211, 77, 0.10)');
    g.addColorStop(1, 'rgba(255, 211, 77, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(level.loot.x - 120, level.loot.y - 120, 240, 240);
  }
  if (world.lootTaken) {
    const ex = level.exit;
    const cx = ex.x + ex.w / 2;
    const cy = ex.y + ex.h / 2;
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 130);
    g.addColorStop(0, 'rgba(76, 195, 138, 0.14)');
    g.addColorStop(1, 'rgba(76, 195, 138, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 130, cy - 130, 260, 260);
  }

  // Alarm: red edges closing in. Near-miss: a faint amber breath.
  if (world.alarm) {
    const pulse = reducedMotion ? 0.16 : 0.12 + Math.sin(time * 6) * 0.07;
    const rg = ctx.createRadialGradient(
      VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.3,
      VIEW.width / 2, VIEW.height / 2, VIEW.height * 0.9,
    );
    rg.addColorStop(0, 'rgba(229, 72, 77, 0)');
    rg.addColorStop(1, `rgba(229, 72, 77, ${pulse})`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  } else if (world.nearMiss && !reducedMotion) {
    const pulse = 0.05 + Math.sin(time * 4) * 0.03;
    ctx.fillStyle = `rgba(245, 185, 66, ${pulse})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  void PALETTE;
}
