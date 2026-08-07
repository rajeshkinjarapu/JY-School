/**
 * Web Audio API Notification Sound Utility
 * Synthesizes a crystal-clear, pleasant dual-tone notification chime (WhatsApp/iOS style)
 * with zero external file download dependencies.
 */
let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playNotificationChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First Tone (High Loud Bell - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle'; // Richer, louder waveform
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

    gain1.gain.setValueAtTime(0.95, now); // 200%+ Volume boost
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second Tone (Harmonic High Chime - 1318.51Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(2637, now + 0.25);

    gain2.gain.setValueAtTime(1.0, now + 0.1); // Maximum volume boost
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.1);
    osc2.stop(now + 0.55);

    // Third Accent Tone (Crystal Bell Finish - 1760Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1760, now + 0.2);

    gain3.gain.setValueAtTime(0.9, now + 0.2);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc3.start(now + 0.2);
    osc3.stop(now + 0.65);
  } catch (e) {
    console.warn('Audio chime play restricted by browser policy:', e);
  }
};
