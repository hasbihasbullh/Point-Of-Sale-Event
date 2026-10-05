/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Audio API Synthesizer to ring a crisp POS buzzer chime natively
 * Plays high bell (A5 880Hz) followed by warm second bell (E5 659.25Hz)
 */
export function playPOSChime(isMuted: boolean = false) {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    // Tone 1: High bell
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.setValueAtTime(880, t); // A5 note
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc1.start(t);
    osc1.stop(t + 0.6);

    // Tone 2: Warm second bell
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(659.25, t + 0.15); // E5 note
    gain2.gain.setValueAtTime(0.25, t + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc2.start(t + 0.15);
    osc2.stop(t + 0.82);
  } catch (e) {
    console.warn('Web Audio gagal berbunyi', e);
  }
}
