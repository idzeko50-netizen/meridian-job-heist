// Procedural WebAudio only: no sound files, no network. A small synth
// kit — blips, chimes, footsteps panned by distance — started on the
// first user gesture, since browsers block audio before one.
export function makeAudio() {
  return {
    ctx: null,
    master: null,
    muted: false,
    alarmNext: 0,
    stepNext: 0,
    playerStepNext: 0,
  };
}

export function ensureAudio(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') void audio.ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  audio.ctx = new AC();
  audio.master = audio.ctx.createGain();
  audio.master.gain.value = audio.muted ? 0 : 0.5;
  audio.master.connect(audio.ctx.destination);
}

export function setMuted(audio, muted) {
  audio.muted = muted;
  if (audio.master) audio.master.gain.value = muted ? 0 : 0.5;
}

function tone(audio, freq, dur, type, gain, when = 0, slideTo = null) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime + when;
  const osc = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(audio.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(audio, dur, filterFreq, gain, pan = 0) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime;
  const len = Math.max(1, Math.floor(audio.ctx.sampleRate * dur));
  const buffer = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audio.ctx.createBufferSource();
  src.buffer = buffer;
  const filter = audio.ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const g = audio.ctx.createGain();
  g.gain.value = gain;
  const panner = audio.ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  src.connect(filter);
  filter.connect(g);
  g.connect(panner);
  panner.connect(audio.master);
  src.start(t0);
}

export const sfx = {
  click(audio) {
    tone(audio, 660, 0.07, 'sine', 0.18);
  },
  loot(audio) {
    tone(audio, 880, 0.12, 'sine', 0.25);
    tone(audio, 1318, 0.18, 'sine', 0.22, 0.09);
  },
  alarm(audio) {
    tone(audio, 620, 0.16, 'square', 0.12);
    tone(audio, 466, 0.16, 'square', 0.12, 0.18);
  },
  caught(audio) {
    tone(audio, 220, 0.5, 'sawtooth', 0.22, 0, 110);
  },
  win(audio) {
    [523, 659, 784, 1046].forEach((f, i) => tone(audio, f, 0.22, 'sine', 0.22, i * 0.11));
  },
  emp(audio) {
    tone(audio, 1200, 0.3, 'sawtooth', 0.16, 0, 180);
    noiseBurst(audio, 0.2, 2400, 0.12);
  },
  lockpick(audio) {
    tone(audio, 1800, 0.04, 'square', 0.1);
    tone(audio, 1400, 0.04, 'square', 0.1, 0.12);
  },
  smoke(audio) {
    noiseBurst(audio, 0.5, 900, 0.16);
  },
  bump(audio) {
    tone(audio, 140, 0.12, 'sine', 0.25);
  },
  footstep(audio, pan, vol) {
    noiseBurst(audio, 0.07, 320, vol, pan);
  },
};

// Per-frame audio: guard footsteps by distance, the alarm's two-tone
// pulse, the thief's own soft steps. Called from the main loop.
export function updateAudio(audio, world, dt) {
  if (!audio.ctx || audio.muted) return;
  const now = world.time;
  if (world.alarm && now >= audio.alarmNext) {
    sfx.alarm(audio);
    audio.alarmNext = now + 0.55;
  }
  if (world.status !== 'play') return;
  audio.stepNext -= dt;
  if (audio.stepNext <= 0) {
    audio.stepNext = 0.42;
    let best = null;
    let bestD = Infinity;
    for (const g of world.guards) {
      const d = Math.hypot(g.x - world.player.x, g.y - world.player.y);
      if (d < bestD) {
        bestD = d;
        best = g;
      }
    }
    if (best && bestD < 420) {
      const pan = (best.x - world.player.x) / 420;
      sfx.footstep(audio, pan, 0.22 * (1 - bestD / 420));
    }
  }
  audio.playerStepNext -= dt;
  if (world.player.moving && audio.playerStepNext <= 0) {
    audio.playerStepNext = world.player.sneaking ? 0.5 : 0.34;
    sfx.footstep(audio, 0, world.player.sneaking ? 0.05 : 0.09);
  }
}
