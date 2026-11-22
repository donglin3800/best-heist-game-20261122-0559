// audio.js — every sound is synthesized with WebAudio. No audio files,
// no network, nothing to load. Created on the first user gesture.

export function makeAudio() {
  let ctx = null;
  let sirenNodes = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0, slideTo = null) {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock() { ensure(); },
    click() { tone(660, 0.06, 'sine', 0.08); },
    coin() { tone(1320, 0.09, 'sine', 0.12); tone(1760, 0.14, 'sine', 0.1, 0.07); },
    grab() { tone(523, 0.1, 'triangle', 0.14); tone(659, 0.1, 'triangle', 0.14, 0.09); tone(784, 0.18, 'triangle', 0.14, 0.18); },
    seen() { tone(220, 0.16, 'square', 0.07, 0, 330); },
    blackout() { tone(180, 0.5, 'sawtooth', 0.06, 0, 60); },
    caught() { tone(392, 0.2, 'sawtooth', 0.12, 0, 98); tone(196, 0.5, 'sawtooth', 0.12, 0.18, 49); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.12));
      tone(1319, 0.5, 'triangle', 0.12, 0.5);
    },
    // A soft two-tone siren while the alarm runs hot; start/stop it.
    siren(on) {
      const c = ensure();
      if (!c) return;
      if (on && !sirenNodes) {
        const osc = c.createOscillator();
        const g = c.createGain();
        const lfo = c.createOscillator();
        const lfoGain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = 620;
        lfo.type = 'sine';
        lfo.frequency.value = 1.4;
        lfoGain.gain.value = 180;
        lfo.connect(lfoGain).connect(osc.frequency);
        g.gain.value = 0.035;
        osc.connect(g).connect(c.destination);
        osc.start(); lfo.start();
        sirenNodes = { osc, lfo, g };
      } else if (!on && sirenNodes) {
        const { osc, lfo, g } = sirenNodes;
        g.gain.setValueAtTime(g.gain.value, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.2);
        setTimeout(() => { try { osc.stop(); lfo.stop(); } catch (_) { /* already stopped */ } }, 250);
        sirenNodes = null;
      }
    },
  };
}
