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
 * Plays a powerful, high-priority oscillating siren that sounds like a nuclear warning.
 * Uses detuned sawtooth oscillators modulated by an LFO to create a heavy warbling alarm effect.
 */
export function playNuclearWarningSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const duration = 2.0;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gainNode = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(380, now);
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(383, now); // slightly detuned

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2.0, now); // 2Hz siren oscillation

    lfoGain.gain.setValueAtTime(100, now); // oscillate by 100Hz

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.15);
    gainNode.gain.setValueAtTime(0.2, now + duration - 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);

    lfo.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch (err) {
    console.warn('[Sound Engine] Failed to play nuclear warning:', err);
  }
}

/**
 * Handles unified vibration and audio alert based on the user's selected mode.
 * Modes: 'vibrate' | 'sound' | 'both' | 'mute'
 * isAttack: if true, triggers a nuclear warning sound and heavy pulsing vibration pattern.
 */
export function triggerNotificationAlert(isAttack: boolean) {
  // Read alert mode from localStorage, default to 'both'
  const alertMode = localStorage.getItem('moonbase_notification_alert_mode') || 'both';

  if (alertMode === 'mute') {
    return; // Do absolutely nothing when muted
  }

  const playSound = alertMode === 'sound' || alertMode === 'both';
  const playVibrate = alertMode === 'vibrate' || alertMode === 'both';

  // 1. Play Sound
  if (playSound) {
    if (isAttack) {
      playNuclearWarningSound();
    } else {
      playAlertySound();
    }
  }

  // 2. Play Vibe
  if (playVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
    if (isAttack) {
      // Nuclear attack alarm pulse: heavy 3-pulse vibration pattern
      navigator.vibrate([600, 200, 600, 200, 600]);
    } else {
      // Standard gentle pulse
      navigator.vibrate([100]);
    }
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
