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
 * Uses a crisp, urgent triple-chirp sequence with frequency sweeps and modulation
 * to add intense tactical urgency and instantly alert the player.
 */
export function playAlertySound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    const playBeep = (startTime: number) => {
      const osc = ctx.createOscillator();
      const oscMod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const gainNode = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1100, startTime);
      osc.frequency.exponentialRampToValueAtTime(350, startTime + 0.12);

      oscMod.type = 'sine';
      oscMod.frequency.setValueAtTime(160, startTime);
      modGain.gain.setValueAtTime(250, startTime);

      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      oscMod.connect(modGain);
      modGain.connect(osc.frequency);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscMod.start(startTime);
      osc.start(startTime);
      
      oscMod.stop(startTime + 0.13);
      osc.stop(startTime + 0.13);
    };

    // 3 rapid, urgent, alerty pulses
    playBeep(now);
    playBeep(now + 0.15);
    playBeep(now + 0.30);
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
