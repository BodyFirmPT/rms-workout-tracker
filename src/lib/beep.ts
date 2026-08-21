let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

export function playBeep(frequency = 800, duration = 0.1, volume = 0.3) {
  const context = getContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(volume, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + duration);
}

export function playCountdownBeep() {
  playBeep(600, 0.08, 0.25);
}

export function playStartBeep() {
  playBeep(1000, 0.25, 0.3);
}

export function playCompletionBeeps(count = 6, spacing = 200) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => playBeep(), i * spacing);
  }
}

/** Unlock audio playback on iOS/Safari — call from a user gesture. */
export function primeAudio() {
  getContext();
}
