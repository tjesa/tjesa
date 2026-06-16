'use client';

// Settings state
let sfxEnabled = true;
let sfxVolume = 0.5;

// Cached audio contexts and buffers
let audioCtx = null;
let noiseBuffer = null;

// Initialize settings from localStorage if on client side
if (typeof window !== 'undefined') {
  try {
    const savedEnabled = localStorage.getItem('tjesa_sfx_enabled');
    sfxEnabled = savedEnabled !== 'false';
    const savedVolume = localStorage.getItem('tjesa_sfx_volume');
    sfxVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;
  } catch (e) {
    console.warn('[Audio] Failed to read settings from localStorage:', e);
  }
}

// Lazy initializer for AudioContext
function getAudioContext() {
  if (typeof window === 'undefined') return null;

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  // Resume context if browser suspended it (autoplay policy)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Generate white noise buffer
function getNoiseBuffer(ctx, duration = 1.5) {
  if (noiseBuffer) return noiseBuffer;

  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  noiseBuffer = buffer;
  return noiseBuffer;
}

// Play sound wrapper
function playSound(generatorFn) {
  if (!sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Make sure state is running
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      try {
        generatorFn(ctx);
      } catch (e) {
        console.error('[Audio] Sound playback error:', e);
      }
    }).catch(() => {});
  } else {
    try {
      generatorFn(ctx);
    } catch (e) {
      console.error('[Audio] Sound playback error:', e);
    }
  }
}

// --- Synthesized Pharaonic Sound Effects ---

/**
 * Sand Sweep (Hover) - Rusty papyrus or sliding sand.
 * Synthesized using bandpass filtered white noise swept upward.
 */
export function playHoverSound() {
  playSound((ctx) => {
    const now = ctx.currentTime;
    const duration = 0.12;

    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx, 1.0);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 5.0;
    // Sweep frequency up to simulate brush/sweep
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(sfxVolume * 0.08, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  });
}

/**
 * Tomb Slab Tap (Click) - Solid stone click.
 * Triangle oscillator swept down rapidly with a high-pass noise click.
 */
export function playClickSound() {
  playSound((ctx) => {
    const now = ctx.currentTime;
    const duration = 0.07;

    // Stone body
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + duration);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(sfxVolume * 0.35, now + 0.004);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Crack transient
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx, 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(sfxVolume * 0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    noise.start(now);
    noise.stop(now + 0.02);
  });
}

/**
 * Temple Chime (Success) - Harmonious rising pentatonic chime.
 * Triggers 4 bells at timed intervals using sine/triangle waves.
 */
export function playSuccessSound() {
  playSound((ctx) => {
    const now = ctx.currentTime;
    const notes = [
      { freq: 440.00, delay: 0.0 },  // A4
      { freq: 523.25, delay: 0.11 }, // C5
      { freq: 587.33, delay: 0.22 }, // D5
      { freq: 659.25, delay: 0.33 }  // E5
    ];

    notes.forEach((note) => {
      const noteTime = now + note.delay;
      const duration = 0.7;

      // Bell chime tone
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, noteTime);

      const ringOsc = ctx.createOscillator();
      ringOsc.type = 'triangle';
      ringOsc.frequency.setValueAtTime(note.freq * 2.0, noteTime); // Harmonic ring

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, noteTime);
      filter.frequency.exponentialRampToValueAtTime(150, noteTime + duration);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, noteTime);
      gainNode.gain.linearRampToValueAtTime(sfxVolume * 0.14, noteTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(filter);
      ringOsc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration);

      ringOsc.start(noteTime);
      ringOsc.stop(noteTime + duration);
    });
  });
}

/**
 * Tomb Curse (Error) - Low detuned ominous drone.
 * Detuned sawtooth oscillators swept down through a sweeping low-pass filter.
 */
export function playErrorSound() {
  playSound((ctx) => {
    const now = ctx.currentTime;
    const duration = 0.55;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(85, now);
    osc1.frequency.linearRampToValueAtTime(65, now + duration);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(85.6, now); // Detuned for grinding drone
    osc2.frequency.linearRampToValueAtTime(65.4, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 4.0;
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(70, now + duration);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(sfxVolume * 0.32, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + duration);

    osc2.start(now);
    osc2.stop(now + duration);
  });
}

/**
 * Stone Portal (Portal Gate/Modal) - Deep sliding stone slab.
 * Low rumbling bandpass-filtered noise mixed with a sub-bass oscillator.
 */
export function playPortalSound() {
  playSound((ctx) => {
    const now = ctx.currentTime;
    const duration = 1.1;

    // Heavy sliding friction
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx, 2.0);

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.Q.value = 3.0;
    noiseFilter.frequency.setValueAtTime(320, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(140, now + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(sfxVolume * 0.22, now + 0.25);
    noiseGain.gain.linearRampToValueAtTime(sfxVolume * 0.18, now + 0.85);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Deep structural rumble
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(45, now);
    subOsc.frequency.linearRampToValueAtTime(38, now + duration);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(sfxVolume * 0.28, now + 0.15);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);

    subOsc.start(now);
    subOsc.stop(now + duration);
  });
}

// --- Configuration Management ---

export function isSfxEnabled() {
  return sfxEnabled;
}

export function setSfxEnabled(enabled) {
  sfxEnabled = enabled;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tjesa_sfx_enabled', String(enabled));
    } catch (e) {
      console.warn('[Audio] Failed to save sfxEnabled to localStorage:', e);
    }
  }
}

export function getSfxVolume() {
  return sfxVolume;
}

export function setSfxVolume(volume) {
  sfxVolume = Math.max(0, Math.min(1, volume));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('tjesa_sfx_volume', String(sfxVolume));
    } catch (e) {
      console.warn('[Audio] Failed to save sfxVolume to localStorage:', e);
    }
  }
}
