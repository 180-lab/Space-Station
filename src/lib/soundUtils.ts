// Web Audio API Synthesizers for Tactical Moonbase Audio Alerts
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Plays a simple but urgent, high-visibility tactical alarm / alerty sound.
 * Uses a sawtooth wave with oscillation to mimic an emergency station klaxon.
 */
export function playAlertySound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Dual oscillator oscillating klaxon
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.linearRampToValueAtTime(400, now + 0.15);
    osc1.frequency.linearRampToValueAtTime(800, now + 0.3);
    osc1.frequency.linearRampToValueAtTime(400, now + 0.45);
    osc1.frequency.linearRampToValueAtTime(800, now + 0.6);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(805, now);
    osc2.frequency.linearRampToValueAtTime(405, now + 0.15);
    osc2.frequency.linearRampToValueAtTime(805, now + 0.3);
    osc2.frequency.linearRampToValueAtTime(405, now + 0.45);
    osc2.frequency.linearRampToValueAtTime(805, now + 0.6);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('[Sound Engine] Failed to play alerty alarm:', err);
  }
}

/**
 * Plays a beautiful, soft, chilled positive chime.
 * Uses a gentle arpeggiated major chord with a sine wave and smooth decay.
 */
export function playChilledSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Chime chords: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz)
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gainNode.gain.setValueAtTime(0.06, now + idx * 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 1.0);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 1.0);
    });
  } catch (err) {
    console.warn('[Sound Engine] Failed to play chilled chime:', err);
  }
}
