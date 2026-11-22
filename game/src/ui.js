// Menus and the HUD. Menus are overlays with one thin rule and sentence
// case copy; the HUD is a single top bar: room, alarm meter, loot, tools.
// Buttons are canvas rects; this module draws them and records their hit
// boxes for the main loop to test clicks against.
import { VIEW, PALETTE, HUD_H, ROOM_NAMES, TAKE } from './config.js';
import { LEVELS } from './levels.js';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(6, 16, 11, 0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.coverEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

export function drawButton(ctx, buttons, id, label, x, y, w, h, hover) {
  ctx.fillStyle = hover ? '#c9a227' : 'rgba(201, 162, 39, 0.12)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.coverEdge;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.fillStyle = hover ? '#08130e' : PALETTE.title;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  buttons.push({ id, x, y, w, h });
}

function centred(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW.width / 2, y);
}

function eye(ctx, x, y, r, fillRatio) {
  // The alarm meter's eye: white, pupil grows as detection fills.
  ctx.strokeStyle = PALETTE.hudText;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = fillRatio >= 1 ? '#e5484d' : PALETTE.hudText;
  ctx.beginPath();
  ctx.arc(x, y, 2 + r * 0.45 * fillRatio, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHUD(ctx, world) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, VIEW.width, HUD_H);
  ctx.fillStyle = PALETTE.coverEdge;
  ctx.fillRect(0, HUD_H - 1, VIEW.width, 1);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(`Room ${world.levelIndex + 1}/3 · ${ROOM_NAMES[world.levelIndex]}`, 20, HUD_H / 2 - 8);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  const mm = String(Math.floor(world.roomTime / 60)).padStart(2, '0');
  const ss = String(Math.floor(world.roomTime % 60)).padStart(2, '0');
  ctx.fillText(`${mm}:${ss}   Loot: ${world.lootTaken ? 'secured' : world.level.lootName}`, 20, HUD_H / 2 + 12);

  // Alarm meter, centre: eye + bar + label.
  const barX = 470;
  const barW = 340;
  const barY = HUD_H / 2 - 8;
  eye(ctx, barX - 28, HUD_H / 2, 13, world.detection);
  ctx.fillStyle = '#1d3a2d';
  ctx.fillRect(barX, barY, barW, 14);
  const d = world.detection;
  ctx.fillStyle = d >= 1 ? '#e5484d' : d >= 0.65 ? '#f5b942' : '#4cc38a';
  ctx.fillRect(barX, barY, Math.max(0, barW * d), 14);
  ctx.strokeStyle = PALETTE.hudDim;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW, 14);
  ctx.fillStyle = world.alarm ? '#e5484d' : PALETTE.hudText;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(world.alarm ? 'ALARM' : 'ALARM METER', barX + barW / 2, barY + 26);

  // Tools, right.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(
    `EMP [1] ×${world.tools.emp}   Smoke [3] ×${world.tools.smoke}   Lockpick [E]`,
    VIEW.width - 20,
    HUD_H / 2 - 8,
  );
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('WASD move · Shift sneak · Esc pause · M mute', VIEW.width - 20, HUD_H / 2 + 12);
  ctx.textAlign = 'left';
}

export function drawMessage(ctx, world) {
  if (world.messageTimer <= 0 || !world.message) return;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(world.message).width + 36;
  ctx.fillStyle = 'rgba(6, 16, 11, 0.85)';
  ctx.fillRect(VIEW.width / 2 - w / 2, HUD_H + 12, w, 34);
  ctx.strokeStyle = PALETTE.coverEdge;
  ctx.strokeRect(VIEW.width / 2 - w / 2 + 0.5, HUD_H + 12.5, w, 34);
  ctx.fillStyle = PALETTE.paper;
  ctx.fillText(world.message, VIEW.width / 2, HUD_H + 30);
}

export function drawTitle(ctx, buttons, hover) {
  ctx.fillStyle = 'rgba(4, 10, 7, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 340, 150, 600, 400);
  centred(ctx, 'THE MERIDIAN JOB', 205, 'bold 44px Georgia, serif', PALETTE.title);
  centred(ctx, 'One bank. Three rooms. One diamond.', 248, '17px Georgia, serif', PALETTE.paper);
  ctx.strokeStyle = PALETTE.coverEdge;
  ctx.beginPath();
  ctx.moveTo(480, 278);
  ctx.lineTo(800, 278);
  ctx.stroke();
  centred(ctx, 'Cross each room unseen. Guards watch cones of light;', 310, '16px system-ui, sans-serif', PALETTE.hudText);
  centred(ctx, 'cameras sweep the floor. Take the loot, reach the van.', 336, '16px system-ui, sans-serif', PALETTE.hudText);
  centred(ctx, 'EMP kills a camera · smoke hides you · E picks a lock', 372, '15px system-ui, sans-serif', PALETTE.hudDim);
  centred(ctx, 'WASD or arrows to move · Shift to sneak · Esc to pause', 398, '15px system-ui, sans-serif', PALETTE.hudDim);
  drawButton(ctx, buttons, 'start', 'Start the job', 490, 440, 300, 52, hover('start'));
  centred(ctx, 'Press Enter', 522, '13px system-ui, sans-serif', PALETTE.hudDim);
}

export function drawBrief(ctx, world, buttons, hover) {
  ctx.fillStyle = 'rgba(4, 10, 7, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const level = LEVELS[world.levelIndex];
  panel(ctx, 390, 180, 500, 330);
  centred(ctx, `Room ${world.levelIndex + 1} — ${ROOM_NAMES[world.levelIndex]}`, 228, 'bold 30px Georgia, serif', PALETTE.title);
  centred(ctx, `Take: ${level.lootName}`, 278, '18px Georgia, serif', PALETTE.paper);
  centred(ctx, `${level.guards.length} guards on patrol · ${level.cameras.length} camera${level.cameras.length > 1 ? 's' : ''} sweeping`, 316, '16px system-ui, sans-serif', PALETTE.hudText);
  centred(ctx, 'Tall cover blocks sight. Shadow drains the meter.', 344, '15px system-ui, sans-serif', PALETTE.hudDim);
  centred(ctx, 'A full meter raises the alarm. A touch while alarmed ends the job.', 370, '15px system-ui, sans-serif', PALETTE.hudDim);
  drawButton(ctx, buttons, 'enter', 'Enter the room', 490, 410, 300, 52, hover('enter'));
  centred(ctx, 'Press Enter', 492, '13px system-ui, sans-serif', PALETTE.hudDim);
}

export function drawPaused(ctx, buttons, hover) {
  ctx.fillStyle = 'rgba(4, 10, 7, 0.66)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 440, 240, 400, 220);
  centred(ctx, 'Paused', 285, 'bold 32px Georgia, serif', PALETTE.title);
  centred(ctx, 'The guards wait. The cameras do not.', 322, '15px system-ui, sans-serif', PALETTE.hudDim);
  drawButton(ctx, buttons, 'resume', 'Resume', 490, 360, 300, 48, hover('resume'));
  drawButton(ctx, buttons, 'restart', 'Restart the room', 490, 420, 300, 48, hover('restart'));
}

export function drawCaught(ctx, world, buttons, hover) {
  ctx.fillStyle = 'rgba(20, 4, 5, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 390, 200, 500, 300);
  centred(ctx, 'Caught', 248, 'bold 40px Georgia, serif', '#e5484d');
  centred(ctx, `A guard closed the distance in the ${ROOM_NAMES[world.levelIndex]}.`, 296, '17px Georgia, serif', PALETTE.paper);
  centred(ctx, 'The alarm was already up — the touch ended it.', 326, '15px system-ui, sans-serif', PALETTE.hudDim);
  centred(ctx, 'Read the cones before you move. Shadow is your friend.', 352, '15px system-ui, sans-serif', PALETTE.hudDim);
  drawButton(ctx, buttons, 'retry', 'Try the room again', 490, 400, 300, 52, hover('retry'));
  drawButton(ctx, buttons, 'menu', 'Back to the title', 490, 462, 300, 48, hover('menu'));
}

export function drawRoomClear(ctx, world, buttons, hover) {
  ctx.fillStyle = 'rgba(4, 10, 7, 0.66)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 390, 200, 500, 300);
  centred(ctx, 'Room clear', 248, 'bold 36px Georgia, serif', PALETTE.exit);
  centred(ctx, `${world.level.lootName} secured. The van is waiting.`, 296, '17px Georgia, serif', PALETTE.paper);
  centred(ctx, `Take so far: ${world.take.join(' · ')}`, 330, '15px system-ui, sans-serif', PALETTE.hudDim);
  drawButton(ctx, buttons, 'next', 'Next room', 490, 400, 300, 52, hover('next'));
}

export function drawWin(ctx, world, buttons, hover) {
  ctx.fillStyle = 'rgba(4, 10, 7, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 340, 150, 600, 400);
  centred(ctx, 'CLEAN GETAWAY', 205, 'bold 40px Georgia, serif', PALETTE.title);
  centred(ctx, 'The Meridian Diamond is yours. Nobody saw a thing.', 250, '18px Georgia, serif', PALETTE.paper);
  ctx.strokeStyle = PALETTE.coverEdge;
  ctx.beginPath();
  ctx.moveTo(480, 282);
  ctx.lineTo(800, 282);
  ctx.stroke();
  TAKE.forEach((item, i) => {
    centred(ctx, `${i + 1}. ${item}`, 318 + i * 30, '16px system-ui, sans-serif', PALETTE.hudText);
  });
  centred(ctx, `Finished in ${Math.floor(world.roomTime / 60)}:${String(Math.floor(world.roomTime % 60)).padStart(2, '0')} in the Vault.`, 430, '15px system-ui, sans-serif', PALETTE.hudDim);
  drawButton(ctx, buttons, 'again', 'Run it again', 490, 460, 300, 52, hover('again'));
}
