/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Synthesize retro-tally counting sounds using basic AudioContext
export const playCounterSound = (
  type: 'up' | 'down' | 'target' | 'reset',
  soundType: 'sine' | 'square' | 'triangle' = 'sine'
) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = soundType;
    
    let duration = 0.08;
    let startFreq = 800;
    let endFreq = 800;
    
    if (type === 'up') {
      startFreq = 880; // A5
      endFreq = 1200;
      duration = 0.05;
    } else if (type === 'down') {
      startFreq = 659; // E5
      endFreq = 500;
      duration = 0.06;
    } else if (type === 'target') {
      // Fanfare chord for target reached
      startFreq = 523.25; // C5
      endFreq = 1046.50; // C6
      duration = 0.35;
    } else if (type === 'reset') {
      startFreq = 800;
      endFreq = 300;
      duration = 0.2;
    }
    
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    if (startFreq !== endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
    
    // For 'target' type, play a nice secondary harmony note
    if (type === 'target') {
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = soundType;
          osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
          osc2.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.3); // E6
          gain2.gain.setValueAtTime(0.06, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.3);
        } catch (e) {
          // ignore inside secondary osc
        }
      }, 80);
    }
  } catch (err) {
    console.warn('AudioContext failed to start (interaction needed):', err);
  }
};

// Base64 silent audio source to maintain background state and claim device media focus
const SILENT_WAV_BASE64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA";
let silentAudioElement: HTMLAudioElement | null = null;

export const startSilentAudioLoop = () => {
  try {
    if (!silentAudioElement) {
      silentAudioElement = new Audio(SILENT_WAV_BASE64);
      silentAudioElement.loop = true;
    }
    silentAudioElement.play().catch(err => {
      console.warn("Silent audio playback deferred for key interaction:", err);
    });
  } catch (err) {
    console.warn("Silent audio context start failed:", err);
  }
};

// Handle native android vibration pattern
export const triggerVibration = (type: 'up' | 'down' | 'target' | 'reset') => {
  if (!navigator.vibrate) return;
  
  try {
    if (type === 'up') {
      navigator.vibrate(35); // brief single haptic buzz
    } else if (type === 'down') {
      navigator.vibrate([25, 30, 25]); // double short buzz
    } else if (type === 'target') {
      navigator.vibrate([100, 50, 100, 50, 150]); // celebratory long pulse
    } else if (type === 'reset') {
      navigator.vibrate([150, 80, 50]); // heavy drop vibration
    }
  } catch (err) {
    console.warn('Vibration API not allowed or supported on this device:', err);
  }
};
