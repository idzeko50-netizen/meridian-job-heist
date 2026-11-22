// Keyboard + mouse. Movement keys are held state; action keys are
// edge-triggered and consumed by the main loop, so a quick press is
// never swallowed between frames (the stealth build's Esc bug).
export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    justPressed: new Set(),
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
    // Movement, read every frame.
    get up() {
      return this.keys.has('KeyW') || this.keys.has('ArrowUp');
    },
    get down() {
      return this.keys.has('KeyS') || this.keys.has('ArrowDown');
    },
    get left() {
      return this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    },
    get right() {
      return this.keys.has('KeyD') || this.keys.has('ArrowRight');
    },
    get sneak() {
      return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    },
    get lockpick() {
      return this.keys.has('KeyE') || this.keys.has('Digit2');
    },
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) {
      input.justPressed.add(e.code);
      if (e.code === 'Digit1') input.emp = true;
      if (e.code === 'Digit3') input.smoke = true;
    }
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.mouse.clicked = true;
  });

  // Consume one edge-triggered press; true only on the frame it landed.
  input.take = (code) => {
    if (input.justPressed.has(code)) {
      input.justPressed.delete(code);
      return true;
    }
    return false;
  };
  // Drain all pending edges at the end of a frame.
  input.endFrame = () => {
    input.justPressed.clear();
    input.mouse.clicked = false;
    input.emp = false;
    input.smoke = false;
  };
  input.emp = false;
  input.smoke = false;
  return input;
}
