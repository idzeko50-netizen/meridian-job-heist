// The Meridian Job — main loop and screens.
// Screens: title -> brief -> play <-> paused -> caught / roomClear / win.
// State the automation reads is mirrored to the canvas dataset every
// frame (Camoufox isolates page-script globals from evaluate), and a
// staged ?shot= scene sets window.__shotReady after its first frame.
import { VIEW } from './config.js';
import { makeWorld, updateWorld, nextRoom } from './world.js';
import { makeInput } from './input.js';
import { makeAudio, ensureAudio, setMuted, updateAudio, sfx } from './audio.js';
import { drawWorld } from './render.js';
import { drawLighting } from './lighting.js';
import * as ui from './ui.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const statusEl = document.getElementById('status');
const reducedMotion =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const input = makeInput(canvas);
const audio = makeAudio();
let world = makeWorld(0);
let screen = 'title';
let buttons = [];
let shotName = null;
let shotReadySent = false;
let lastStatusText = '';

const params = new URLSearchParams(window.location.search);
if (params.get('shot')) {
  const staged = stageShot(params.get('shot'));
  if (staged) {
    screen = staged.screen;
    world = staged.world;
    shotName = params.get('shot');
  }
}

function hover(id) {
  const b = buttons.find((r) => r.id === id);
  if (!b) return false;
  return (
    input.mouse.x >= b.x && input.mouse.x <= b.x + b.w &&
    input.mouse.y >= b.y && input.mouse.y <= b.y + b.h
  );
}

function clickedButton() {
  if (!input.mouse.clicked) return null;
  for (const b of buttons) {
    if (
      input.mouse.clickX >= b.x && input.mouse.clickX <= b.x + b.w &&
      input.mouse.clickY >= b.y && input.mouse.clickY <= b.y + b.h
    ) {
      return b.id;
    }
  }
  return null;
}

function beginRoom(index) {
  world = makeWorld(index);
  screen = 'brief';
}

function playEventSounds() {
  for (const e of world.events) {
    if (e === 'loot') sfx.loot(audio);
    else if (e === 'alarm') sfx.alarm(audio);
    else if (e === 'caught') sfx.caught(audio);
    else if (e === 'escape') sfx.win(audio);
    else if (e === 'emp') sfx.emp(audio);
    else if (e === 'smoke') sfx.smoke(audio);
    else if (e === 'lockpick') sfx.lockpick(audio);
    else if (e === 'bump') sfx.bump(audio);
  }
}

function handleInput() {
  if (input.justPressed.size > 0 || input.mouse.clicked) ensureAudio(audio);
  if (input.take('KeyM')) {
    setMuted(audio, !audio.muted);
  }
  const clicked = clickedButton();
  const enter = input.take('Enter');

  if (screen === 'title') {
    if (enter || clicked === 'start') {
      sfx.click(audio);
      screen = 'brief';
    }
  } else if (screen === 'brief') {
    if (enter || clicked === 'enter') {
      sfx.click(audio);
      screen = 'play';
    }
  } else if (screen === 'play') {
    if (input.take('Escape')) {
      screen = 'paused';
      sfx.click(audio);
    }
  } else if (screen === 'paused') {
    if (input.take('Escape') || clicked === 'resume') {
      screen = 'play';
      sfx.click(audio);
    } else if (clicked === 'restart') {
      sfx.click(audio);
      beginRoom(world.levelIndex);
    }
  } else if (screen === 'caught') {
    if (enter || clicked === 'retry') {
      sfx.click(audio);
      beginRoom(world.levelIndex);
    } else if (clicked === 'menu') {
      sfx.click(audio);
      world = makeWorld(0);
      screen = 'title';
    }
  } else if (screen === 'roomClear') {
    if (enter || clicked === 'next') {
      sfx.click(audio);
      beginRoom(world.levelIndex + 1);
    }
  } else if (screen === 'win') {
    if (enter || clicked === 'again') {
      sfx.click(audio);
      beginRoom(0);
    }
  }
}

function mirrorDataset() {
  const d = canvas.dataset;
  d.screen = screen;
  d.player = `${Math.round(world.player.x)},${Math.round(world.player.y)}`;
  d.detection = world.detection.toFixed(2);
  d.alarm = String(world.alarm);
  d.loot = String(world.lootTaken);
  d.room = String(world.levelIndex + 1);
  d.tools = `${world.tools.emp},${world.tools.smoke}`;
  d.status = world.status;
  d.shotready = shotName && shotReadySent ? 'true' : 'false';
  const text = `${screen}, room ${world.levelIndex + 1}, detection ${world.detection.toFixed(2)}${world.alarm ? ', alarm' : ''}${world.lootTaken ? ', loot secured' : ''}`;
  if (text !== lastStatusText) {
    lastStatusText = text;
    statusEl.textContent = text;
  }
  if (shotName && !shotReadySent) {
    shotReadySent = true;
    window.__shotReady = true;
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;

  handleInput();

  if (screen === 'play' && world.status === 'play' && !shotName) {
    updateWorld(world, input, dt);
    playEventSounds();
    if (world.status === 'caught') screen = 'caught';
    else if (world.status === 'roomClear') screen = 'roomClear';
    else if (world.status === 'win') screen = 'win';
  }
  updateAudio(audio, world, dt);

  buttons = [];
  drawWorld(ctx, world, world.time);
  drawLighting(ctx, world, world.time, reducedMotion);
  if (screen === 'play' || screen === 'paused') {
    ui.drawHUD(ctx, world);
    ui.drawMessage(ctx, world);
  }
  if (screen === 'title') ui.drawTitle(ctx, buttons, hover);
  else if (screen === 'brief') ui.drawBrief(ctx, world, buttons, hover);
  else if (screen === 'paused') ui.drawPaused(ctx, buttons, hover);
  else if (screen === 'caught') ui.drawCaught(ctx, world, buttons, hover);
  else if (screen === 'roomClear') ui.drawRoomClear(ctx, world, buttons, hover);
  else if (screen === 'win') ui.drawWin(ctx, world, buttons, hover);

  mirrorDataset();
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
