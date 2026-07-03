// Web Audio API Synthesizers for Tactical Moonbase Audio Alerts
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Plays a simple, sweet, and elegant digital double-ding notification sound.
 * Uses sweet, harmonious sine waves instead of sharp sawtooth laser sweeps.
 */
export function playAlertySound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // A beautiful sweet digital chime (D5 -> A5 -> D6 chime swipe)
    const playChimeTone = (freq: number, delay: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gainNode.gain.setValueAtTime(0.001, now + delay);
      gainNode.gain.linearRampToValueAtTime(0.08, now + delay + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + dur);
    };

    // A sweet, gentle double-ding harmonic arpeggio
    playChimeTone(587.33, 0, 0.4);      // D5
    playChimeTone(880.00, 0.08, 0.6);   // A5
    playChimeTone(1174.66, 0.16, 0.8);  // D6
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
  if (playVibrate) {
    // Dispatch a custom event so that the UI can render a responsive visual "shake/vibration" fallback.
    // This provides high-fidelity tactile feedback even on desktop browsers, iOS Safari, or restricted iframes.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('moonbase_vibrate', { detail: { isAttack } }));
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (isAttack) {
          // Nuclear attack alarm pulse: heavy 3-pulse vibration pattern
          navigator.vibrate([600, 200, 600, 200, 600]);
        } else {
          // Standard pleasant double-pulse vibration
          navigator.vibrate([150, 80, 150]);
        }
      } catch (err) {
        console.warn('[Vibration Engine] Hardware vibration failed:', err);
      }
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
