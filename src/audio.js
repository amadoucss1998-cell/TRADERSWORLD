// All sound is synthesised with WebAudio: no audio files to download.
export class Audio {
  constructor() {
    this.ctx = null;
    this.radioOn = true;
    this.listener = { x: 0, z: 0 };
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(ctx.destination);

    // engine: two detuned oscillators through a lowpass
    this.engGain = ctx.createGain();
    this.engGain.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    this.engOsc1 = ctx.createOscillator();
    this.engOsc1.type = 'sawtooth';
    this.engOsc2 = ctx.createOscillator();
    this.engOsc2.type = 'square';
    this.engOsc1.connect(lp);
    this.engOsc2.connect(lp);
    lp.connect(this.engGain);
    this.engGain.connect(this.master);
    this.engOsc1.start();
    this.engOsc2.start();
    this.engLP = lp;

    // siren
    this.sirenGain = ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenOsc = ctx.createOscillator();
    this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.value = 700;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.9;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);
    this.sirenOsc.connect(this.sirenGain);
    this.sirenGain.connect(this.master);
    this.sirenOsc.start();
    lfo.start();

    // ocean surf
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const surf = ctx.createBufferSource();
    surf.buffer = this.noiseBuf;
    surf.loop = true;
    const sf = ctx.createBiquadFilter();
    sf.type = 'lowpass';
    sf.frequency.value = 500;
    this.surfGain = ctx.createGain();
    this.surfGain.gain.value = 0;
    surf.connect(sf);
    sf.connect(this.surfGain);
    this.surfGain.connect(this.master);
    surf.start();

    // radio bus
    this.radioGain = ctx.createGain();
    this.radioGain.gain.value = 0;
    this.radioGain.connect(this.master);
    this.nextBeat = ctx.currentTime + 0.1;
    this.step = 0;
  }

  get ok() {
    return !!this.ctx;
  }

  setEngine(on, rpm, throttle) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    const f = 38 + rpm * 120;
    this.engOsc1.frequency.setTargetAtTime(f, t, 0.05);
    this.engOsc2.frequency.setTargetAtTime(f * 0.501, t, 0.05);
    this.engLP.frequency.setTargetAtTime(350 + rpm * 900 + throttle * 400, t, 0.05);
    this.engGain.gain.setTargetAtTime(on ? 0.05 + throttle * 0.04 : 0, t, 0.1);
  }

  setSiren(level) {
    if (!this.ok) return;
    this.sirenGain.gain.setTargetAtTime(level * 0.06, this.ctx.currentTime, 0.2);
  }

  setSurf(level) {
    if (!this.ok) return;
    this.surfGain.gain.setTargetAtTime(level * 0.12, this.ctx.currentTime, 0.5);
  }

  vol(pos, base = 1) {
    if (!pos) return base;
    const d = Math.hypot(pos.x - this.listener.x, pos.z - this.listener.z);
    return base * Math.max(0, 1 - d / 80);
  }

  tone(freq, dur, type = 'square', gain = 0.1, when = 0, slide = 0, dest = this.master) {
    if (!this.ok || gain <= 0.001) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise(dur, gain, freq = 1000, when = 0, dest = this.master, type = 'lowpass') {
    if (!this.ok || gain <= 0.001) return;
    const t = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  horn(pos, base = 0.6) {
    const v = this.vol(pos, base) * 0.08;
    this.tone(415, 0.35, 'square', v);
    this.tone(523, 0.35, 'square', v * 0.8);
  }

  crash(intensity, pos) {
    const v = this.vol(pos, Math.min(1, intensity / 20));
    this.noise(0.35, 0.5 * v, 900);
    this.tone(90, 0.25, 'sawtooth', 0.15 * v, 0, -50);
  }

  gunshot(pos, base = 1) {
    const v = this.vol(pos, base);
    this.noise(0.18, 0.7 * v, 2200);
    this.noise(0.5, 0.25 * v, 400);
    this.tone(140, 0.12, 'square', 0.12 * v, 0, -90);
  }

  punch() {
    this.noise(0.12, 0.35, 500);
    this.tone(120, 0.1, 'sine', 0.3, 0, -60);
  }

  explosion(pos) {
    const v = this.vol(pos, 1);
    this.noise(1.6, 0.9 * v, 400);
    this.tone(60, 1.2, 'sine', 0.5 * v, 0, -35);
  }

  pickup() {
    [784, 988, 1175].forEach((f, i) => this.tone(f, 0.15, 'triangle', 0.12, i * 0.07));
  }

  cash() {
    this.tone(1318, 0.1, 'square', 0.06);
    this.tone(1760, 0.18, 'square', 0.06, 0.08);
  }

  passed() {
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.14, i * 0.13));
  }

  failed() {
    [392, 330, 262].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.08, i * 0.2));
  }

  wasted() {
    this.tone(220, 2.5, 'sawtooth', 0.12, 0, -150);
    this.noise(1.5, 0.2, 300);
  }

  checkpoint() {
    this.tone(880, 0.12, 'square', 0.08);
    this.tone(1320, 0.2, 'square', 0.08, 0.1);
  }

  // A tiny procedural Hipco-flavoured groove for the car radio.
  updateRadio(inCar) {
    if (!this.ok) return;
    const ctx = this.ctx;
    this.radioGain.gain.setTargetAtTime(inCar && this.radioOn ? 0.5 : 0, ctx.currentTime, 0.3);
    if (!inCar || !this.radioOn) {
      this.nextBeat = Math.max(this.nextBeat, ctx.currentTime);
      return;
    }
    const spb = 60 / 104 / 4; // sixteenth notes at 104 bpm
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const root = 196; // G3
    const bass = [0, -1, 0, 0, 3, -1, 2, -1, 0, -1, 0, 0, 4, -1, 3, 2];
    const lead = [0, 2, 4, 2, 5, 4, 2, 0, 3, 4, 2, 0, 1, 2, 4, 5];
    const chords = [0, 0, 5, 3];
    while (this.nextBeat < ctx.currentTime + 0.15) {
      const s = this.step % 16;
      const bar = Math.floor(this.step / 16) % 4;
      const when = this.nextBeat - ctx.currentTime;
      const ch = chords[bar];
      const R = this.radioGain;
      if (s % 4 === 0) this.tone(55, 0.18, 'sine', 0.5, when, -25, R); // kick
      if (s === 4 || s === 12) this.noise(0.12, 0.22, 2500, when, R, 'highpass'); // snare
      if (s % 2 === 1) this.noise(0.04, 0.08, 7000, when, R, 'highpass'); // shaker
      if (bass[s] >= 0) {
        const n = scale[(bass[s] + ch) % scale.length];
        this.tone((root / 2) * Math.pow(2, n / 12), 0.2, 'triangle', 0.22, when, 0, R);
      }
      if ((s % 3 === 0 || s === 14) && bar !== 3) {
        const n = scale[(lead[(s + bar * 3) % 16] + ch) % scale.length];
        this.tone(root * 2 * Math.pow(2, n / 12), 0.22, 'sine', 0.09, when, 0, R); // marimba-ish
        this.tone(root * 4 * Math.pow(2, n / 12), 0.08, 'sine', 0.03, when, 0, R);
      }
      this.nextBeat += spb;
      this.step++;
    }
  }
}
