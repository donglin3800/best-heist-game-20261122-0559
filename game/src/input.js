// input.js — keyboard and mouse, one object the simulation reads each frame.
// Clicks are consumed once (a coin toss), keys are held state.

export function makeInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false,
    sneak: false, grab: false,
    blackout: false, // edge-triggered, consumed by the simulation
    toss: null, // {x, y} in game coordinates, consumed once
    anyKey: false,
  };

  const keyMap = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'grab',
  };

  function onKeyDown(e) {
    const name = keyMap[e.code];
    if (name) { input[name] = true; e.preventDefault(); }
    if (e.code === 'KeyQ') input.blackout = true;
    if (e.code === 'Enter' || e.code === 'Space') input.anyKey = true;
    if (e.code === 'Space') e.preventDefault();
  }

  function onKeyUp(e) {
    const name = keyMap[e.code];
    if (name) input[name] = false;
  }

  function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    input.toss = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
    input.anyKey = true;
  }

  function onBlur() {
    input.up = input.down = input.left = input.right = false;
    input.sneak = input.grab = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onMouseDown);

  // The simulation calls these after each step so one press is one action.
  input.consumeEdges = function () {
    input.blackout = false;
    input.toss = null;
  };

  return input;
}
