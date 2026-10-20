// Short applause made with the Web Audio API (no audio file needed): many tiny filtered noise bursts,
// denser at the start and fading out. Used for celebrations, Welcome to Passage Walk and Welcome back 👏 (Shikha's idea).
let context: AudioContext | null = null;

function getAudio() {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

// A soft rising bell chime (C–E–G–C with a gentle shimmer) for opening an earned badge — a "well done" wish,
// different from the applause.
export function playChime(volume = 0.32) {
  try {
    const audio = getAudio();
    const master = audio.createGain();
    master.gain.value = volume;
    master.connect(audio.destination);
    const start = audio.currentTime + 0.05;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const at = start + index * 0.13;
      // Each note: a sine with a quiet octave above, quick attack and a long bell-like fade.
      [[frequency, 1], [frequency * 2, 0.18]].forEach(([pitch, level]) => {
        const oscillator = audio.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = pitch;
        const gain = audio.createGain();
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.32 * level, at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.4);
        oscillator.connect(gain).connect(master);
        oscillator.start(at);
        oscillator.stop(at + 1.5);
      });
    });
  } catch {
    // Audio unavailable — the page still shows.
  }
}

// A short victory fanfare for finishing a whole journey: a rising brass-like call (G–C–E–G) that lands on a
// full C major chord, with a soft sparkle on top. Played just before the long applause.
export function playFanfare(volume = 0.26) {
  try {
    const audio = getAudio();
    const master = audio.createGain();
    master.gain.value = volume;
    master.connect(audio.destination);
    const start = audio.currentTime + 0.05;

    // One brassy note: two slightly detuned sawtooths through a lowpass that opens on the attack.
    const brass = (frequency: number, at: number, length: number, level = 0.3) => {
      const filter = audio.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(700, at);
      filter.frequency.linearRampToValueAtTime(2600, at + 0.06);
      filter.frequency.exponentialRampToValueAtTime(1200, at + length);
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(level, at + 0.03);
      gain.gain.setValueAtTime(level * 0.8, at + length * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      filter.connect(gain).connect(master);
      [-6, 6].forEach((detune) => {
        const oscillator = audio.createOscillator();
        oscillator.type = "sawtooth";
        oscillator.frequency.value = frequency;
        oscillator.detune.value = detune;
        oscillator.connect(filter);
        oscillator.start(at);
        oscillator.stop(at + length + 0.05);
      });
    };

    // Call: G4 · C5 · E5 · G5, then the chord C4 E4 G4 C5 E5.
    [[392, 0, 0.16], [523.25, 0.15, 0.16], [659.25, 0.3, 0.16], [783.99, 0.45, 0.42]].forEach(([frequency, offset, length]) => brass(frequency, start + offset, length));
    [261.63, 329.63, 392, 523.25, 659.25].forEach((frequency) => brass(frequency, start + 0.92, 1.9, 0.16));

    // Sparkle: quick high bell notes over the chord.
    [1567.98, 2093, 2637, 3135.96].forEach((frequency, index) => {
      const at = start + 0.95 + index * 0.09;
      const oscillator = audio.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.06, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
      oscillator.connect(gain).connect(master);
      oscillator.start(at);
      oscillator.stop(at + 1);
    });
  } catch {
    // Audio unavailable — the celebration still shows.
  }
}

export function playApplause(duration = 1.6, volume = 0.5) {
  try {
    const audio = getAudio();

    // One clap = a 90 ms burst of noise with a fast decay.
    const length = Math.floor(audio.sampleRate * 0.09);
    const clap = audio.createBuffer(1, length, audio.sampleRate);
    const data = clap.getChannelData(0);
    for (let index = 0; index < length; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 4;

    const master = audio.createGain();
    master.gain.value = volume;
    master.connect(audio.destination);

    const start = audio.currentTime + 0.05;
    const claps = Math.round(duration * 16);
    for (let index = 0; index < claps; index += 1) {
      const offset = duration * Math.random() ** 1.5;
      const source = audio.createBufferSource();
      source.buffer = clap;
      source.playbackRate.value = 0.8 + Math.random() * 0.5;
      const filter = audio.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900 + Math.random() * 1400;
      filter.Q.value = 0.9;
      const gain = audio.createGain();
      gain.gain.value = (0.12 + Math.random() * 0.14) * (1 - offset / (duration * 1.15));
      source.connect(filter).connect(gain).connect(master);
      source.start(start + offset);
    }
  } catch {
    // Audio unavailable (e.g. blocked by the browser) — the celebration still shows.
  }
}
