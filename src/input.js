// Keyboard, mouse and touch input folded into one small API.
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();
    this.lookDX = 0;
    this.lookDY = 0;
    this.joy = { x: 0, y: 0 };
    this.touchHeld = new Set();
    this.mouseDown = false;
    this.locked = false;
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    addEventListener('keydown', (e) => {
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    addEventListener('keyup', (e) => this.down.delete(e.code));
    addEventListener('blur', () => this.down.clear());

    canvas.addEventListener('mousedown', (e) => {
      if (this.touch) return;
      if (e.button === 0) {
        if (!this.locked && canvas.requestPointerLock) {
          try {
            const r = canvas.requestPointerLock();
            if (r && r.catch) r.catch(() => {});
          } catch {
            /* pointer lock not allowed here: drag to look instead */
          }
        }
        this.pressed.add('Mouse0');
        this.down.add('Mouse0Held');
      }
      this.mouseDown = true;
    });
    addEventListener('mouseup', () => {
      this.mouseDown = false;
      this.down.delete('Mouse0Held');
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
    });
    addEventListener('mousemove', (e) => {
      if (this.locked || this.mouseDown) {
        this.lookDX += e.movementX;
        this.lookDY += e.movementY;
      }
    });
    if (this.touch) this.setupTouch();
  }

  setupTouch() {
    const ui = document.getElementById('touch');
    ui.hidden = false;
    const stick = document.getElementById('stick');
    const knob = document.getElementById('knob');
    let stickId = null;
    let cx = 0;
    let cy = 0;
    stick.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      stickId = t.identifier;
      const r = stick.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
      e.preventDefault();
    }, { passive: false });
    const moveStick = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== stickId) continue;
        let dx = (t.clientX - cx) / 50;
        let dy = (t.clientY - cy) / 50;
        const l = Math.hypot(dx, dy);
        if (l > 1) {
          dx /= l;
          dy /= l;
        }
        this.joy.x = dx;
        this.joy.y = -dy;
        knob.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
      }
    };
    const endStick = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== stickId) continue;
        stickId = null;
        this.joy.x = 0;
        this.joy.y = 0;
        knob.style.transform = '';
      }
    };
    stick.addEventListener('touchmove', moveStick, { passive: true });
    stick.addEventListener('touchend', endStick);
    stick.addEventListener('touchcancel', endStick);

    for (const b of document.querySelectorAll('[data-key]')) {
      const code = b.dataset.key;
      b.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.pressed.add(code);
        this.touchHeld.add(code);
        b.classList.add('on');
      }, { passive: false });
      const up = () => {
        this.touchHeld.delete(code);
        b.classList.remove('on');
      };
      b.addEventListener('touchend', up);
      b.addEventListener('touchcancel', up);
    }

    // drag anywhere else to look around
    let lookId = null;
    let lx = 0;
    let ly = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      lookId = t.identifier;
      lx = t.clientX;
      ly = t.clientY;
    }, { passive: true });
    this.canvas.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier !== lookId) continue;
        this.lookDX += (t.clientX - lx) * 1.6;
        this.lookDY += (t.clientY - ly) * 1.6;
        lx = t.clientX;
        ly = t.clientY;
      }
    }, { passive: true });
    this.canvas.addEventListener('touchend', () => (lookId = null));
  }

  isDown(...codes) {
    return codes.some((c) => this.down.has(c) || this.touchHeld.has(c));
  }

  wasPressed(...codes) {
    return codes.some((c) => this.pressed.has(c));
  }

  get move() {
    let x = this.joy.x;
    let y = this.joy.y;
    if (this.isDown('KeyW', 'ArrowUp')) y += 1;
    if (this.isDown('KeyS', 'ArrowDown')) y -= 1;
    if (this.isDown('KeyD', 'ArrowRight')) x += 1;
    if (this.isDown('KeyA', 'ArrowLeft')) x -= 1;
    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  }

  endFrame() {
    this.pressed.clear();
    this.lookDX = 0;
    this.lookDY = 0;
  }
}
