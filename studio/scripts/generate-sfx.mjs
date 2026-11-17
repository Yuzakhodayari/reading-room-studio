import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SFX_DIR = path.resolve(__dirname, "../public/sfx");

fs.mkdirSync(SFX_DIR, { recursive: true });

const SAMPLE_RATE = 48000;

/**
 * Encode mono floating-point samples [-1.0, 1.0] to a 16-bit 48kHz WAV buffer.
 */
function encodeWav(samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt Chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data Chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Soft clip to [-0.99, 0.99] to prevent digital overflow
    const s = Math.max(-0.99, Math.min(0.99, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.round(val), offset);
    offset += 2;
  }

  return buffer;
}

// Pseudo-random noise generator with seed
function createNoiseGen(seed = 12345) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s / 2147483647) * 2 - 1;
  };
}

// Simple stateful two-pole resonant bandpass/lowpass filter
function createBiquadFilter() {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return {
    process(input, fc, q, type = "bandpass", fs = SAMPLE_RATE) {
      const omega = (2 * Math.PI * fc) / fs;
      const alpha = Math.sin(omega) / (2 * q);
      const cosw = Math.cos(omega);

      let b0 = 0, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;

      if (type === "bandpass") {
        b0 = alpha;
        b1 = 0;
        b2 = -alpha;
        a0 = 1 + alpha;
        a1 = -2 * cosw;
        a2 = 1 - alpha;
      } else if (type === "lowpass") {
        b0 = (1 - cosw) / 2;
        b1 = 1 - cosw;
        b2 = (1 - cosw) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cosw;
        a2 = 1 - alpha;
      }

      const out = (b0 / a0) * input + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
      x2 = x1;
      x1 = input;
      y2 = y1;
      y1 = out;
      return out;
    },
  };
}

// =========================================================================
// SFX GENERATORS
// =========================================================================

const SFX = {
  // 1. glass-enter (0.28s): crystalline bell harmonic + subtle sub warmth
  "glass-enter.wav": () => {
    const dur = 0.28;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const envMain = Math.exp(-t * 22);
      const envSub = Math.exp(-t * 14);
      const tone1 = Math.sin(2 * Math.PI * 1850 * t);
      const tone2 = Math.sin(2 * Math.PI * 3700 * t) * 0.35;
      const tone3 = Math.sin(2 * Math.PI * 5550 * t) * 0.15;
      const sub = Math.sin(2 * Math.PI * (90 - t * 80) * t) * 0.45 * envSub;
      buf[i] = (tone1 + tone2 + tone3) * envMain * 0.55 + sub;
    }
    return buf;
  },

  // 2. glass-expand (0.32s): resonant upward glass swell
  "glass-expand.wav": () => {
    const dur = 0.32;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const p = t / dur;
      const env = Math.sin(p * Math.PI) * Math.exp(-t * 4);
      const freq = 520 + Math.pow(p, 1.8) * 980;
      phase += (2 * Math.PI * freq) / SAMPLE_RATE;
      const tone = Math.sin(phase) + Math.sin(phase * 2) * 0.25;
      buf[i] = tone * env * 0.6;
    }
    return buf;
  },

  // 3. glass-dock (0.22s): soft pill click + descending tone
  "glass-dock.wav": () => {
    const dur = 0.22;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 28);
      const freq = 840 * Math.exp(-t * 16) + 240;
      phase += (2 * Math.PI * freq) / SAMPLE_RATE;
      const click = i < 180 ? Math.sin((i / 180) * Math.PI) * 0.35 : 0;
      buf[i] = Math.sin(phase) * env * 0.55 + click;
    }
    return buf;
  },

  // 4. glass-exit (0.20s): crisp air release
  "glass-exit.wav": () => {
    const dur = 0.20;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(4411);
    const filter = createBiquadFilter();
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 24);
      const n = filter.process(noise(), 3200, 1.5, "bandpass");
      const tone = Math.sin(2 * Math.PI * (1600 - t * 3000) * t) * 0.2;
      buf[i] = (n * 0.7 + tone) * env * 0.65;
    }
    return buf;
  },

  // 5. marker-sweep (0.38s): felt highlighter friction on paper
  "marker-sweep.wav": () => {
    const dur = 0.38;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(9821);
    const filter = createBiquadFilter();
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const p = t / dur;
      const env = Math.sin(Math.PI * Math.pow(p, 0.75));
      const raw = noise();
      const filtered = filter.process(raw, 1850 + Math.sin(t * 40) * 120, 2.2, "bandpass");
      buf[i] = filtered * env * 0.75;
    }
    return buf;
  },

  // 6. paper-slide (0.35s): tactile paper brush on desk
  "paper-slide.wav": () => {
    const dur = 0.35;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(3141);
    const filter = createBiquadFilter();
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const p = t / dur;
      const env = Math.sin(Math.PI * p) * (1 - 0.2 * p);
      const raw = noise();
      const filtered = filter.process(raw, 1100 + p * 400, 1.2, "bandpass");
      buf[i] = filtered * env * 0.7;
    }
    return buf;
  },

  // 7. data-tick (0.06s): minimal modern UI tick
  "data-tick.wav": () => {
    const dur = 0.06;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 90);
      const tone = Math.sin(2 * Math.PI * 2600 * t);
      buf[i] = tone * env * 0.6;
    }
    return buf;
  },

  // 8. warning-thud (0.55s): deep calm sub-bass pulse
  "warning-thud.wav": () => {
    const dur = 0.55;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 7.5);
      const freq = 68 * Math.exp(-t * 4.5) + 32;
      phase += (2 * Math.PI * freq) / SAMPLE_RATE;
      const sub = Math.sin(phase);
      const saturation = Math.tanh(sub * 1.4);
      buf[i] = saturation * env * 0.85;
    }
    return buf;
  },

  // 9. flash-cut (0.12s): sharp investigative shutter snap
  "flash-cut.wav": () => {
    const dur = 0.12;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(7771);
    const filter = createBiquadFilter();
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 55);
      const click = i < 120 ? Math.sin((i / 120) * Math.PI) * 0.9 : 0;
      const tail = filter.process(noise(), 3400, 2.5, "bandpass") * 0.35;
      buf[i] = (click + tail) * env * 0.75;
    }
    return buf;
  },

  // 10. telestrator-draw (0.40s): textured chalk/line draw
  "telestrator-draw.wav": () => {
    const dur = 0.40;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(8882);
    const filter = createBiquadFilter();
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const p = t / dur;
      const env = Math.sin(Math.PI * p);
      const raw = noise();
      const filtered = filter.process(raw, 1400 + Math.sin(t * 60) * 300, 2.0, "bandpass");
      buf[i] = filtered * env * 0.7;
    }
    return buf;
  },

  // 11. sticker-pop (0.14s): warm muted organic pop
  "sticker-pop.wav": () => {
    const dur = 0.14;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 32);
      const freq = 440 * Math.exp(-t * 24) + 110;
      phase += (2 * Math.PI * freq) / SAMPLE_RATE;
      buf[i] = Math.sin(phase) * env * 0.65;
    }
    return buf;
  },

  // 12. newsreel-click (0.10s): vintage 16mm shutter ratchet click
  "newsreel-click.wav": () => {
    const dur = 0.10;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const click1 = i < 180 ? Math.sin((i / 180) * Math.PI) * Math.exp(-t * 70) : 0;
      const click2 = i > 400 && i < 650 ? Math.sin(((i - 400) / 250) * Math.PI) * 0.6 : 0;
      const resonance = Math.sin(2 * Math.PI * 1450 * t) * Math.exp(-t * 60) * 0.25;
      buf[i] = (click1 + click2 + resonance) * 0.7;
    }
    return buf;
  },

  // 13. map-whoosh (0.45s): smooth spatial camera glide
  "map-whoosh.wav": () => {
    const dur = 0.45;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(5432);
    const filter = createBiquadFilter();
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const p = t / dur;
      const env = Math.pow(Math.sin(Math.PI * p), 1.8);
      const freq = 280 + Math.sin(Math.PI * p) * 620;
      const filtered = filter.process(noise(), freq, 1.4, "bandpass");
      buf[i] = filtered * env * 0.8;
    }
    return buf;
  },

  // 14. type-click (0.05s): crisp tactile key tap
  "type-click.wav": () => {
    const dur = 0.05;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 110);
      const click = Math.sin(2 * Math.PI * 3400 * t) * 0.6;
      const thud = Math.sin(2 * Math.PI * 720 * t) * 0.35;
      buf[i] = (click + thud) * env * 0.65;
    }
    return buf;
  },

  // 15. ambient-tension-drone (12.0s): seamless loopable dark editorial pad
  "ambient-tension-drone.wav": () => {
    const dur = 12.0;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(2026);
    const airFilter = createBiquadFilter();

    // Generate circularly-wrapped filtered noise across 2 passes so sample 0 matches N-1
    const rawNoise = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      rawNoise[i] = noise();
    }
    const filteredAir = new Float32Array(len);
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < len; i++) {
        filteredAir[i] = airFilter.process(rawNoise[i], 220, 0.85, "lowpass");
      }
    }

    // All frequencies have exact integer cycle counts over 12.0s for click-free looping
    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const swell1 = 0.72 + 0.28 * Math.sin(2 * Math.PI * (1 / 12) * t);
      const swell2 = 0.78 + 0.22 * Math.cos(2 * Math.PI * (2 / 12) * t);

      const sub = Math.sin(2 * Math.PI * 55.0 * t) * 0.34;
      const detuneLow =
        (Math.sin(2 * Math.PI * (55.0 + 1 / 12) * t) +
          Math.sin(2 * Math.PI * (55.0 - 1 / 12) * t)) *
        0.14;
      const fifth = Math.sin(2 * Math.PI * 82.5 * t) * 0.22 * swell1;
      const octave = Math.sin(2 * Math.PI * (110.0 + 2 / 12) * t) * 0.16 * swell2;
      const darkSus = Math.sin(2 * Math.PI * 164.75 * t) * 0.09 * swell1;
      const upperBreath = Math.sin(2 * Math.PI * 220.25 * t) * 0.04 * swell2;
      const air = filteredAir[i] * 0.12 * swell2;

      buf[i] = (sub + detuneLow + fifth + octave + darkSus + upperBreath + air) * 0.55;
    }
    return buf;
  },

  // 16. riser-subtle (1.80s): smooth editorial tension build
  "riser-subtle.wav": () => {
    const dur = 1.8;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(6017);
    const filter = createBiquadFilter();
    let phase1 = 0;
    let phase2 = 0;
    const tailSamples = Math.floor(0.12 * SAMPLE_RATE);

    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const p = t / dur;
      const attack = Math.min(1, t / 0.12);
      const swell = Math.pow(p, 1.85) * attack;
      const tail =
        i > len - tailSamples
          ? 0.5 * (1 + Math.cos((Math.PI * (i - (len - tailSamples))) / tailSamples))
          : 1.0;

      const freq = 65 + Math.pow(p, 1.9) * 95;
      phase1 += (2 * Math.PI * freq) / SAMPLE_RATE;
      phase2 += (2 * Math.PI * freq * 1.5) / SAMPLE_RATE;
      const tone = Math.sin(phase1) * 0.45 + Math.sin(phase2) * 0.22;

      const cutoff = 220 + Math.pow(p, 2.1) * 2100;
      const breath = filter.process(noise(), cutoff, 1.3, "bandpass") * 0.55;

      buf[i] = (tone + breath) * swell * tail * 0.65;
    }
    return buf;
  },

  // 17. chapter-chime (0.80s): warm subtle editorial transition tone
  "chapter-chime.wav": () => {
    const dur = 0.8;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const attackSamples = Math.floor(0.008 * SAMPLE_RATE);
    const fadeOutSamples = Math.floor(0.05 * SAMPLE_RATE);

    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const attack =
        i < attackSamples
          ? 0.5 * (1 - Math.cos((Math.PI * i) / attackSamples))
          : 1.0;
      const fadeOut =
        i > len - fadeOutSamples
          ? 0.5 * (1 + Math.cos((Math.PI * (i - (len - fadeOutSamples))) / fadeOutSamples))
          : 1.0;
      const env = Math.exp(-t * 4.8) * attack * fadeOut;

      const root = Math.sin(2 * Math.PI * 523.25 * t) * 0.55;
      const subOct = Math.sin(2 * Math.PI * 261.63 * t) * 0.35 * Math.exp(-t * 2.5);
      const fifth = Math.sin(2 * Math.PI * 784.88 * t) * 0.22 * Math.exp(-t * 7.5);
      const shimmer = Math.sin(2 * Math.PI * 1046.5 * t) * 0.1 * Math.exp(-t * 11.0);

      buf[i] = (root + subOct + fifth + shimmer) * env * 0.6;
    }
    return buf;
  },

  // 18. paper-flip-fast (0.25s): crisp rapid page/card flip
  "paper-flip-fast.wav": () => {
    const dur = 0.25;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(9104);
    const filter = createBiquadFilter();

    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const p = t / dur;
      const flick = t < 0.045 ? Math.sin((t / 0.045) * Math.PI) * 0.45 : 0;
      const sweepEnv =
        t >= 0.03 ? Math.sin(Math.PI * Math.min(1, (t - 0.03) / (dur - 0.03))) * Math.exp(-(t - 0.03) * 9) : 0;
      const cutoff = 1600 + p * 1400;
      const filtered = filter.process(noise(), cutoff, 1.8, "bandpass");
      buf[i] = filtered * (flick + sweepEnv) * 0.8;
    }
    return buf;
  },

  // 19. alert-ping (0.35s): clean glass notification ping
  "alert-ping.wav": () => {
    const dur = 0.35;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const attackSamples = Math.floor(0.004 * SAMPLE_RATE);

    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const attack =
        i < attackSamples
          ? 0.5 * (1 - Math.cos((Math.PI * i) / attackSamples))
          : 1.0;
      const env = Math.exp(-t * 12.5) * attack;
      const p1 = Math.sin(2 * Math.PI * 1318.5 * t) * 0.65;
      const p2 = Math.sin(2 * Math.PI * 1975.5 * t) * 0.22 * Math.exp(-t * 16);
      const p3 = Math.sin(2 * Math.PI * 2637.0 * t) * 0.12 * Math.exp(-t * 22);
      buf[i] = (p1 + p2 + p3) * env * 0.65;
    }
    return buf;
  },

  // 20. camera-shutter (0.14s): mechanical two-curtain shutter snap
  "camera-shutter.wav": () => {
    const dur = 0.14;
    const len = Math.floor(SAMPLE_RATE * dur);
    const buf = new Float32Array(len);
    const noise = createNoiseGen(3319);
    const filter = createBiquadFilter();

    for (let i = 0; i < len; i++) {
      const t = i / SAMPLE_RATE;
      const curtain1 =
        t < 0.022 ? Math.sin((t / 0.022) * Math.PI) * 0.85 : 0;
      const curtain2 =
        t >= 0.048 && t < 0.072
          ? Math.sin(((t - 0.048) / 0.024) * Math.PI) * 0.65
          : 0;
      const bodyThud =
        Math.sin(2 * Math.PI * 380 * t) * Math.exp(-t * 55) * 0.45;
      const mechClick =
        filter.process(noise(), 3100, 2.2, "bandpass") *
        (curtain1 + curtain2) *
        0.9;
      const tailFade = Math.exp(-Math.max(0, t - 0.06) * 45);
      buf[i] = (mechClick + bodyThud) * tailFade * 0.75;
    }
    return buf;
  },
};

console.log(`Generating ${Object.keys(SFX).length} crisp 48kHz WAV sound effects into ${SFX_DIR}...`);

for (const [filename, generator] of Object.entries(SFX)) {
  const samples = generator();
  const wavBuffer = encodeWav(samples);
  const targetPath = path.join(SFX_DIR, filename);
  fs.writeFileSync(targetPath, wavBuffer);
  console.log(`✓ ${filename} (${samples.length} samples, ${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}

console.log("All SFX generated successfully.");
