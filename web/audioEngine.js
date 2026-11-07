/**
 * AI ARENA 3.0 – Full Game Audio, Adaptive Music & Generative AI Music Composer
 * Composes skills from `awesome-gamedev-agent-skills`:
 * - `audio-design` & `references/adaptive-music.md`:
 *   1. Bus/Mixer Architecture: Master (with DynamicsCompressor peak limiter) <- { Music <- MusicDuck, SFX, Ambience, UI, Stinger }
 *   2. Squared Slider-to-Gain Mapping (`gain = slider01 * slider01`, true mute at 0)
 *   3. Sidechain Ducking (`MusicDuck` dips -10 dB on Stinger/Alert/Victory and recovers over 420ms without overwriting Music slider)
 *   4. Adaptive 4-Stem Music Sequencer (AudioContext clock lookahead, vertical layering + hysteresis)
 * - `threejs-audio-generator` & `procedural-gen`:
 *   5. `AIMusicComposer`: Deterministic Seeded PRNG (`Mulberry32`), Prompt-to-Composition-Plan parser,
 *      Markov-Chain Melodic & Harmonic Generator, Euclidean Drum Rhythm Generator (`E(k, 16)`),
 *      5 Musical Scales (including Vietnamese Pentatonic Ngũ Cung `VIET_PENTATONIC`), and AI Agent Stat Modulation.
 */

// Full Multi-Octave Note Frequency Table (Hz) including sparkling high register C6..A6
export const NOTE_FREQ = {
  D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47, C3: 130.81, Cs3: 138.59,
  D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94, C4: 261.63, Cs4: 277.18,
  D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88, C5: 523.25, Cs5: 554.37,
  D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77, C6: 1046.50,
  D6: 1174.66, E6: 1318.51, F6: 1396.91, Fs6: 1479.98, G6: 1567.98, A6: 1760.00
};

export const AI_MUSIC_SCALES = {
  FUNKY_ARCADE_PENTATONIC: {
    id: 'FUNKY_ARCADE_PENTATONIC',
    name: 'Vui Nhộn Arcade Ngũ Cung (Sôi Động & Cuốn Hút)',
    bassNotes: ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'G2'],
    arpNotes:  ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5'],
    leadNotes: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G5']
  },
  CYBER_DORIAN: {
    id: 'CYBER_DORIAN',
    name: 'D Dorian Cyberpunk (Sci-Fi Tương Lai)',
    bassNotes: ['D2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3'],
    arpNotes:  ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5'],
    leadNotes: ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'A5']
  },
  VIET_PENTATONIC: {
    id: 'VIET_PENTATONIC',
    name: 'Ngũ Cung Việt Nam (Hò-Xự-Xang-Xê-Cống)',
    bassNotes: ['D2', 'F2', 'G2', 'A2', 'C3', 'D3'],
    arpNotes:  ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5'],
    leadNotes: ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5']
  },
  PHRYGIAN_DOMINANT: {
    id: 'PHRYGIAN_DOMINANT',
    name: 'Phrygian Dominant (Kịch Tính Speed War)',
    bassNotes: ['D2', 'Eb2', 'Fs2', 'G2', 'A2', 'Bb2', 'C3'],
    arpNotes:  ['D4', 'Eb4', 'Fs4', 'G4', 'A4', 'Bb4', 'C5', 'D5'],
    leadNotes: ['D4', 'Eb4', 'Fs4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'Eb5', 'Fs5']
  },
  LYDIAN_QUANTUM: {
    id: 'LYDIAN_QUANTUM',
    name: 'Lydian Quantum (Sáng Tạo Học Viện AI)',
    bassNotes: ['D2', 'E2', 'Fs2', 'Gs2', 'A2', 'B2', 'D3'],
    arpNotes:  ['D4', 'E4', 'Fs4', 'Gs4', 'A4', 'B4', 'Cs5', 'D5'],
    leadNotes: ['D4', 'E4', 'Fs4', 'Gs4', 'A4', 'B4', 'Cs5', 'D5', 'E5', 'Fs5', 'A5']
  },
  AEOLIAN_NEURAL: {
    id: 'AEOLIAN_NEURAL',
    name: 'Aeolian Neural (Chiến Lược & Đàm Phán)',
    bassNotes: ['D2', 'F2', 'G2', 'A2', 'Bb2', 'C3', 'D3'],
    arpNotes:  ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5'],
    leadNotes: ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'F5', 'G5']
  }
};

/**
 * Deterministic Seeded PRNG (`procedural-gen` Skill Pattern #1)
 */
export function hashStringToSeed(str) {
  let h = 2166136261 >>> 0;
  const s = String(str || 'AI_ARENA_SEED');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seedInput) {
  let a = typeof seedInput === 'number' ? (seedInput >>> 0) : hashStringToSeed(seedInput);
  if (a === 0) a = 1337;
  return {
    next() {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    weightedPick(itemsWithWeights) {
      const total = itemsWithWeights.reduce((acc, item) => acc + item.weight, 0);
      let roll = this.next() * total;
      for (const entry of itemsWithWeights) {
        roll -= entry.weight;
        if (roll <= 0) return entry.value;
      }
      return itemsWithWeights[itemsWithWeights.length - 1].value;
    }
  };
}

/**
 * Bjorklund / Euclidean Rhythm Generator E(pulses, steps)
 * Used by AI Composer to generate mathematically balanced drum & bass grooves
 */
export function generateEuclideanRhythm(pulses, steps = 16, rotation = 0) {
  const pattern = new Array(steps).fill(0);
  if (pulses <= 0) return pattern;
  for (let i = 0; i < steps; i++) {
    if (((i * pulses) % steps) < pulses) {
      pattern[(i + rotation) % steps] = 1;
    }
  }
  return pattern;
}

/**
 * AI Generative Music Composer (`threejs-audio-generator` + `procedural-gen`)
 * Composes a complete 4-Stem `composition_plan` from a prompt, AI Agent stats, and seed.
 */
export class AIMusicComposer {
  static compose({
    prompt = 'Cyberpunk Ngũ Cung AI Arena hào hùng 124 BPM',
    seed = 'AI-ARENA-2026',
    agent = null
  } = {}) {
    const text = String(prompt || '').toLowerCase();
    const agentName = agent?.name || 'Nova-Prime (Creator AI)';
    const agentClass = agent?.ai_class || 'CREATOR';
    const creativity = Number(agent?.creativity ?? 88);
    const logic = Number(agent?.logic_score ?? 82);
    const speedStat = Number(agent?.speed ?? 80);

    const rng = createSeededRng(`${prompt}::${seed}::${agentName}::${creativity}`);

    // 1. Semantic Prompt & Agent Class -> Scale Selection
    let scaleKey = 'CYBER_DORIAN';
    if (text.includes('vui nhộn') || text.includes('arcade') || text.includes('funky') || text.includes('sôi động') || text.includes('cuốn hút')) {
      scaleKey = 'FUNKY_ARCADE_PENTATONIC';
    } else if (text.includes('ngũ cung') || text.includes('việt') || text.includes('hào hùng') || text.includes('dân tộc') || text.includes('đế chế')) {
      scaleKey = 'VIET_PENTATONIC';
    } else if (text.includes('chiến đấu') || text.includes('speed war') || text.includes('boss') || text.includes('căng thẳng') || text.includes('kịch tính') || agentClass === 'GUARDIAN') {
      scaleKey = 'PHRYGIAN_DOMINANT';
    } else if (text.includes('học viện') || text.includes('sáng tạo') || text.includes('bay bổng') || text.includes('lofi') || text.includes('vũ trụ') || agentClass === 'CREATOR') {
      scaleKey = 'LYDIAN_QUANTUM';
    } else if (text.includes('đàm phán') || text.includes('chiến lược') || text.includes('sâu lắng') || text.includes('kinh tế') || agentClass === 'TRADER' || agentClass === 'ANALYST') {
      scaleKey = 'AEOLIAN_NEURAL';
    } else {
      const scaleKeys = Object.keys(AI_MUSIC_SCALES);
      scaleKey = scaleKeys[rng.int(0, scaleKeys.length - 1)];
    }

    const scale = AI_MUSIC_SCALES[scaleKey];

    // 2. Extract or Synthesize Tempo (BPM)
    const bpmMatch = text.match(/(\d{2,3})\s*bpm/i);
    let bpm = bpmMatch ? Number(bpmMatch[1]) : Math.round(108 + (speedStat - 60) * 0.45 + rng.int(-6, 10));
    if (text.includes('nhanh') || text.includes('speed') || text.includes('cao trào')) bpm = Math.max(bpm, 132);
    if (text.includes('chậm') || text.includes('lofi') || text.includes('chill')) bpm = Math.min(bpm, 102);
    bpm = Math.max(88, Math.min(152, bpm));

    // 3. Markov Chain Melodic & Harmonic Generation (16 Steps)
    // Markov state is the current index in the scale's note array.
    const bassPattern = [];
    const arpPattern = [];
    const leadPattern = [];

    let bassIdx = 0;
    let arpIdx = 0;
    let leadIdx = Math.min(2, scale.leadNotes.length - 1);

    // Build a 4-step motif first if Logic is high so the composition has memorable structure
    const motifLength = logic >= 80 ? 4 : 8;
    const leadMotif = [];

    for (let step = 0; step < 16; step++) {
      // BASS: Anchors on root (index 0) on downbeats (0, 4, 8, 12), moves to 3rd/4th/5th on offbeats
      if (step % 4 === 0) {
        bassIdx = step === 8 ? Math.min(3, scale.bassNotes.length - 1) : 0;
      } else {
        bassIdx = rng.weightedPick([
          { value: 0, weight: 40 },
          { value: Math.min(2, scale.bassNotes.length - 1), weight: 25 },
          { value: Math.min(3, scale.bassNotes.length - 1), weight: 20 },
          { value: Math.min(4, scale.bassNotes.length - 1), weight: 15 }
        ]);
      }
      bassPattern.push(scale.bassNotes[bassIdx]);

      // ARP: Continuous 16th-note cyber arpeggio with Markov interval transitions
      const arpDelta = rng.weightedPick([
        { value: 1, weight: 38 },
        { value: 2, weight: 28 },
        { value: -1, weight: 22 },
        { value: 3, weight: Math.round(creativity * 0.2) }
      ]);
      arpIdx = (arpIdx + arpDelta + scale.arpNotes.length) % scale.arpNotes.length;
      arpPattern.push(scale.arpNotes[arpIdx]);

      // LEAD: Markov melody with rests and motif variation
      const restProbability = step % 4 === 1 ? 0.45 : 0.22;
      if (rng.next() < restProbability) {
        leadPattern.push(null);
      } else if (step >= motifLength && step < motifLength * 2 && leadMotif[step % motifLength] && rng.next() < (logic / 130)) {
        // Repeat motif for musical coherence
        leadPattern.push(leadMotif[step % motifLength]);
      } else {
        const stepJump = rng.weightedPick([
          { value: 1, weight: 32 },
          { value: -1, weight: 30 },
          { value: 2, weight: 18 },
          { value: -2, weight: 12 },
          { value: 0, weight: 8 }
        ]);
        leadIdx = Math.max(0, Math.min(scale.leadNotes.length - 1, leadIdx + stepJump));
        const chosenLead = scale.leadNotes[leadIdx];
        if (step < motifLength) leadMotif[step] = chosenLead;
        leadPattern.push(chosenLead);
      }
    }

    // Ensure step 0 and step 12 have strong lead notes
    if (!leadPattern[0]) leadPattern[0] = scale.leadNotes[0];
    if (!leadPattern[8]) leadPattern[8] = scale.leadNotes[Math.min(4, scale.leadNotes.length - 1)];

    // 4. Euclidean Drum Groove E(k, 16) based on Tempo & Creativity
    const kickPulses = bpm >= 128 ? 5 : 4;
    const kickPattern = generateEuclideanRhythm(kickPulses, 16, 0);
    kickPattern[0] = 1;
    kickPattern[8] = 1;

    const snarePattern = new Array(16).fill(0);
    snarePattern[4] = 1;
    snarePattern[12] = 1;
    if (creativity > 82) {
      snarePattern[15] = 1; // Ghost snare fill at end of bar
    }

    const hatPulses = Math.min(14, Math.max(8, Math.round(8 + (speedStat / 20))));
    const hatPattern = generateEuclideanRhythm(hatPulses, 16, 1);

    // 5. Synth Timbre tailored by AI Class
    const timbreByClass = {
      CREATOR:  { bassWave: 'sawtooth', arpWave: 'triangle', leadWave: 'sawtooth', filterCutoff: 580 },
      ANALYST:  { bassWave: 'triangle', arpWave: 'sine',     leadWave: 'triangle', filterCutoff: 420 },
      CODER:    { bassWave: 'sawtooth', arpWave: 'square',   leadWave: 'square',   filterCutoff: 540 },
      GUARDIAN: { bassWave: 'sawtooth', arpWave: 'sawtooth', leadWave: 'square',   filterCutoff: 640 },
      TRADER:   { bassWave: 'triangle', arpWave: 'triangle', leadWave: 'sawtooth', filterCutoff: 480 },
      MANAGER:  { bassWave: 'sawtooth', arpWave: 'triangle', leadWave: 'triangle', filterCutoff: 510 }
    }[agentClass] || { bassWave: 'sawtooth', arpWave: 'triangle', leadWave: 'square', filterCutoff: 520 };

    return {
      trackId: `aimusic_${hashStringToSeed(prompt + seed).toString(16)}`,
      title: `Bản Giao Hưởng AI: ${scale.name.split(' (')[0]}`,
      prompt,
      seed,
      bpm,
      scaleId: scale.id,
      scaleName: scale.name,
      composerAgent: {
        name: agentName,
        aiClass: agentClass,
        creativity,
        logic,
        speed: speedStat
      },
      timbre: timbreByClass,
      patterns: {
        bass: bassPattern,
        arp: arpPattern,
        lead: leadPattern,
        kick: kickPattern,
        snare: snarePattern,
        hat: hatPattern
      },
      createdAt: new Date().toLocaleTimeString('vi-VN')
    };
  }
}

export class ArenaSoundStudio {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.muted = false;

    // Slider settings (0..1)
    this.sliders = {
      master: 0.85,
      music: 0.72,
      sfx: 0.88,
      ambience: 0.65,
      ui: 0.80
    };

    this.buses = {};
    this.musicDuckGain = null;
    this.noiseBuffer = null;

    // Active AI-Generated Composition Plan (`AIMusicComposer`)
    this.currentPlan = AIMusicComposer.compose({
      prompt: 'Cyberpunk Ngũ Cung AI Arena hào hùng 122 BPM',
      seed: 'DEFAULT-ARENA-3.0',
      agent: { name: 'Nova-Prime', ai_class: 'CREATOR', creativity: 94, logic_score: 84, speed: 86 }
    });
    this.compositionHistory = [this.currentPlan];
    this.autoComposeOnZoneChange = true;
    this.lastComposedZone = 'CENTRAL_HUB';

    // Adaptive Music State (Vertical Layering + Hysteresis)
    this.intensity = 0.25;
    this.intensityLevel = 1; // 0: Calm, 1: Explore, 2: Action/Run, 3: SpeedWar Combat
    this.combatOverrideTimer = 0;

    this.stepIndex = 0;
    this.nextNoteTime = 0;
    this.schedulerTimer = null;
    this.onBeatCallback = null;
    this.onStepCallback = null;

    // Continuous Loops (Ambience & Jetpack Thruster)
    this.ambienceOsc1 = null;
    this.ambienceOsc2 = null;
    this.ambienceFilter = null;
    this.thrusterGain = null;
    this.footstepTimer = 0;
    this.lastFootstepTake = -1;

    this._bindAutoUnlock();
  }

  _bindAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlockHandler = () => {
      this.unlock();
    };
    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
  }

  unlock() {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    this.ctx = new AudioCtx();
    this._buildMixerGraph();
    this._createNoiseBuffer();
    this._startSpatialAmbience();
    this._startAdaptiveMusicScheduler();

    this.unlocked = true;
    return true;
  }

  /**
   * Compose a brand-new AI Track from prompt, agent, and seed, then immediately hot-swap it into the live 4-stem sequencer!
   */
  composeAiMusic({ prompt, seed, agent } = {}) {
    if (!this.unlocked) this.unlock();
    const newPlan = AIMusicComposer.compose({
      prompt: prompt || 'Cyberpunk Ngũ Cung AI Arena sáng tạo',
      seed: seed || `SEED-${Date.now().toString(36).toUpperCase()}`,
      agent
    });
    this.applyCompositionPlan(newPlan);
    return newPlan;
  }

  applyCompositionPlan(plan) {
    if (!plan || !plan.patterns) return;
    this.currentPlan = plan;
    this.compositionHistory.unshift(plan);
    if (this.compositionHistory.length > 10) {
      this.compositionHistory.pop();
    }
    const stemIndicator = document.getElementById('audio-stem-indicator');
    if (stemIndicator) {
      stemIndicator.textContent = `${plan.bpm} BPM • ${plan.scaleId}`;
    }
    if (typeof window.onAiMusicPlanUpdated === 'function') {
      window.onAiMusicPlanUpdated(plan);
    }
  }

  /**
   * 1. Bus / Mixer Graph with Master Limiter (`audio-design` Pattern #1)
   */
  _buildMixerGraph() {
    const ctx = this.ctx;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-3.0, ctx.currentTime);
    limiter.knee.setValueAtTime(6.0, ctx.currentTime);
    limiter.ratio.setValueAtTime(12.0, ctx.currentTime);
    limiter.attack.setValueAtTime(0.002, ctx.currentTime);
    limiter.release.setValueAtTime(0.18, ctx.currentTime);
    limiter.connect(ctx.destination);

    this.buses.master = ctx.createGain();
    this.buses.master.connect(limiter);

    this.musicDuckGain = ctx.createGain();
    this.musicDuckGain.gain.setValueAtTime(1.0, ctx.currentTime);
    this.musicDuckGain.connect(this.buses.master);

    this.buses.music = ctx.createGain();
    this.buses.music.connect(this.musicDuckGain);

    this.buses.sfx = ctx.createGain();
    this.buses.sfx.connect(this.buses.master);

    this.buses.ambience = ctx.createGain();
    this.buses.ambience.connect(this.buses.master);

    this.buses.ui = ctx.createGain();
    this.buses.ui.connect(this.buses.master);

    this.buses.stinger = ctx.createGain();
    this.buses.stinger.connect(this.buses.master);

    this.stems = {
      base: ctx.createGain(),
      arp: ctx.createGain(),
      drums: ctx.createGain(),
      lead: ctx.createGain()
    };
    this.stems.base.gain.setValueAtTime(0.75, ctx.currentTime);
    this.stems.arp.gain.setValueAtTime(0.58, ctx.currentTime);
    this.stems.drums.gain.setValueAtTime(0.35, ctx.currentTime);
    this.stems.lead.gain.setValueAtTime(0.32, ctx.currentTime);

    Object.values(this.stems).forEach(s => s.connect(this.buses.music));

    for (const [busName, val] of Object.entries(this.sliders)) {
      this.setBusVolume(busName, val);
    }
  }

  setBusVolume(busName, slider01) {
    const clamped = Math.max(0, Math.min(1, Number(slider01)));
    this.sliders[busName] = clamped;
    if (!this.ctx || !this.buses[busName]) return;

    const effectiveGain = (this.muted && busName === 'master') ? 0 : (clamped * clamped);
    this.buses[busName].gain.setTargetAtTime(effectiveGain, this.ctx.currentTime, 0.03);
  }

  toggleMute() {
    if (!this.unlocked) this.unlock();
    this.muted = !this.muted;
    this.setBusVolume('master', this.sliders.master);
    return this.muted;
  }

  triggerSidechainDuck(dipDurationSec = 0.55, dipLinear = 0.28) {
    if (!this.ctx || !this.musicDuckGain) return;
    const now = this.ctx.currentTime;
    const g = this.musicDuckGain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(dipLinear, now + 0.015);
    g.exponentialRampToValueAtTime(1.0, now + dipDurationSec + 0.42);
  }

  _createNoiseBuffer() {
    const ctx = this.ctx;
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  _startSpatialAmbience() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.ambienceFilter = ctx.createBiquadFilter();
    this.ambienceFilter.type = 'lowpass';
    this.ambienceFilter.frequency.setValueAtTime(240, now);
    this.ambienceFilter.connect(this.buses.ambience);

    const ambGain = ctx.createGain();
    ambGain.gain.setValueAtTime(0.11, now);
    ambGain.connect(this.ambienceFilter);

    this.ambienceOsc1 = ctx.createOscillator();
    this.ambienceOsc2 = ctx.createOscillator();
    this.ambienceOsc1.type = 'sawtooth';
    this.ambienceOsc2.type = 'triangle';
    this.ambienceOsc1.frequency.setValueAtTime(73.42, now);
    this.ambienceOsc2.frequency.setValueAtTime(110.0, now);
    this.ambienceOsc1.connect(ambGain);
    this.ambienceOsc2.connect(ambGain);
    this.ambienceOsc1.start(now);
    this.ambienceOsc2.start(now);

    if (this.noiseBuffer) {
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;
      noiseSrc.loop = true;

      const thrusterFilter = ctx.createBiquadFilter();
      thrusterFilter.type = 'bandpass';
      thrusterFilter.frequency.setValueAtTime(420, now);
      thrusterFilter.Q.setValueAtTime(1.8, now);

      this.thrusterGain = ctx.createGain();
      this.thrusterGain.gain.setValueAtTime(0.0001, now);

      noiseSrc.connect(thrusterFilter).connect(this.thrusterGain).connect(this.buses.sfx);
      noiseSrc.start(now);
    }
  }

  _startAdaptiveMusicScheduler() {
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.stepIndex = 0;

    this.schedulerTimer = setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const plan = this.currentPlan;
      const sixteenthSec = (60 / (plan?.bpm || 120)) / 4;

      while (this.nextNoteTime < this.ctx.currentTime + 0.14) {
        this._scheduleMusicStep(this.stepIndex, this.nextNoteTime, sixteenthSec, plan);
        this.nextNoteTime += sixteenthSec;
        this.stepIndex = (this.stepIndex + 1) % 16;
      }
    }, 30);
  }

  _scheduleMusicStep(step, time, sixteenthSec, plan) {
    const ctx = this.ctx;
    const patterns = plan.patterns;
    const timbre = plan.timbre || { bassWave: 'sawtooth', arpWave: 'triangle', leadWave: 'square', filterCutoff: 520 };

    if (this.onStepCallback) {
      const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
      setTimeout(() => this.onStepCallback(step, plan), delayMs);
    }

    // STEM 1: AI-Composed Bassline
    const bassNote = patterns.bass[step];
    if (bassNote && NOTE_FREQ[bassNote]) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = timbre.bassWave;
      osc.frequency.setValueAtTime(NOTE_FREQ[bassNote], time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(step % 4 === 0 ? timbre.filterCutoff : timbre.filterCutoff * 0.65, time);
      filter.frequency.exponentialRampToValueAtTime(105, time + sixteenthSec * 0.9);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + sixteenthSec * 0.92);

      osc.connect(filter).connect(gain).connect(this.stems.base);
      osc.start(time);
      osc.stop(time + sixteenthSec);
    }

    // STEM 2: AI-Composed Markov Arpeggiator
    const arpNote = patterns.arp[step];
    if (arpNote && NOTE_FREQ[arpNote]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = timbre.arpWave;
      osc.frequency.setValueAtTime(NOTE_FREQ[arpNote], time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.11, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + sixteenthSec * 0.85);

      osc.connect(gain).connect(this.stems.arp);
      osc.start(time);
      osc.stop(time + sixteenthSec);
    }

    // STEM 3: AI-Composed Euclidean Drums
    if (patterns.kick[step]) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(138, time);
      kickOsc.frequency.exponentialRampToValueAtTime(38, time + 0.11);

      kickGain.gain.setValueAtTime(0.26, time);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      kickOsc.connect(kickGain).connect(this.stems.drums);
      kickOsc.start(time);
      kickOsc.stop(time + 0.17);
    }
    if (patterns.snare[step]) {
      this._scheduleNoiseBurst(time, 0.11, 1400, 0.13, this.stems.drums);
    }
    if (patterns.hat[step]) {
      this._scheduleNoiseBurst(time, 0.038, 6500, 0.055, this.stems.drums);
    }

    // STEM 4: AI-Composed Markov Lead Melody
    const leadNote = patterns.lead[step];
    if (leadNote && NOTE_FREQ[leadNote]) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = timbre.leadWave;
      osc.frequency.setValueAtTime(NOTE_FREQ[leadNote], time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, time);
      filter.frequency.exponentialRampToValueAtTime(620, time + sixteenthSec * 1.35);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.095, time + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + sixteenthSec * 1.4);

      osc.connect(filter).connect(gain).connect(this.stems.lead);
      osc.start(time);
      osc.stop(time + sixteenthSec * 1.45);
    }
  }

  _scheduleNoiseBurst(time, duration, filterFreq, peakGain, destNode) {
    if (!this.noiseBuffer) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFreq, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peakGain, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    src.connect(filter).connect(gain).connect(destNode);
    src.start(time);
    src.stop(time + duration + 0.01);
  }

  updatePerFrame(dt, { animState = 'IDLE', zoneId = 'CENTRAL_HUB', isSpeedWarActive = false, activeAgent = null }) {
    if (!this.unlocked || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Auto AI-Recompose when entering a new 3D Zone (if enabled)
    if (this.autoComposeOnZoneChange && zoneId && zoneId !== this.lastComposedZone) {
      this.lastComposedZone = zoneId;
      const zonePrompts = {
        CENTRAL_HUB: 'Cyberpunk Ngũ Cung Việt Nam hào hùng tại Sảnh Trung Tâm 120 BPM',
        BATTLE_ARENA: 'Phrygian Speed War kịch tính chiến đấu tốc độ cao 138 BPM',
        JOB_CITY: 'Cyber Dorian nhịp điệu công nghệ Thành Phố Việc Làm 124 BPM',
        AI_ACADEMY: 'Lydian sáng tạo bay bổng Học Viện AI 112 BPM',
        TOKEN_EXCHANGE: 'Aeolian chiến lược tài chính Sàn Giao Dịch Token 122 BPM',
        BUSINESS_DISTRICT: 'Ngũ Cung Đế Chế Doanh Nghiệp AI hùng mạnh 126 BPM',
        AI_SOCIAL_HUB: 'Lydian kết nối mạng xã hội AI vui tươi 118 BPM',
        AI_LAB: 'Quantum Synthwave phòng thí nghiệm AI 128 BPM',
        AI_EMPIRE: 'Bản giao hưởng Ngũ Cung Đế Chế AI đỉnh cao 132 BPM'
      };
      this.composeAiMusic({
        prompt: zonePrompts[zoneId] || `Cyberpunk AI Arena ${zoneId} 122 BPM`,
        seed: `ZONE-${zoneId}`,
        agent: activeAgent
      });
    }

    if (this.combatOverrideTimer > 0) {
      this.combatOverrideTimer = Math.max(0, this.combatOverrideTimer - dt);
    }

    let rawIntensity = 0.42;
    if (zoneId === 'BATTLE_ARENA') rawIntensity = 0.85;
    else if (zoneId === 'JOB_CITY' || zoneId === 'TOKEN_EXCHANGE') rawIntensity = 0.58;
    if (animState === 'RUN') rawIntensity = Math.max(rawIntensity, 0.78);
    else if (animState === 'WALK') rawIntensity = Math.max(rawIntensity, 0.55);
    if (isSpeedWarActive || this.combatOverrideTimer > 0) rawIntensity = 0.96;

    this.intensity += (rawIntensity - this.intensity) * (1 - Math.exp(-3.0 * dt));

    if (this.intensity > 0.76) this.intensityLevel = 3;
    else if (this.intensity > 0.52) this.intensityLevel = 2;
    else if (this.intensity > 0.30) this.intensityLevel = 1;
    else this.intensityLevel = 0;

    // Smoothly blend the 4 AI-composed stems
    this.stems.base.gain.setTargetAtTime(0.78, now, 0.35);
    this.stems.arp.gain.setTargetAtTime(this.intensityLevel >= 1 ? 0.65 : 0.30, now, 0.4);
    this.stems.drums.gain.setTargetAtTime(this.intensityLevel >= 2 ? 0.78 : 0.25, now, 0.45);
    this.stems.lead.gain.setTargetAtTime(this.intensityLevel >= 2 ? 0.72 : 0.38, now, 0.35);

    if (this.ambienceFilter && this.ambienceOsc2) {
      const zoneHarmonics = {
        CENTRAL_HUB: { freq: 110.0, cutoff: 260 },
        BATTLE_ARENA: { freq: 116.54, cutoff: 480 },
        JOB_CITY: { freq: 130.81, cutoff: 340 },
        AI_ACADEMY: { freq: 146.83, cutoff: 390 },
        TOKEN_EXCHANGE: { freq: 164.81, cutoff: 420 }
      }[zoneId] || { freq: 110.0, cutoff: 260 };

      this.ambienceOsc2.frequency.setTargetAtTime(zoneHarmonics.freq, now, 0.5);
      this.ambienceFilter.frequency.setTargetAtTime(zoneHarmonics.cutoff, now, 0.5);
    }

    if (this.thrusterGain) {
      this.thrusterGain.gain.setTargetAtTime(animState === 'RUN' ? 0.12 : 0.0001, now, 0.08);
    }

    if (animState === 'WALK' || animState === 'RUN') {
      const stepInterval = animState === 'RUN' ? 0.23 : 0.37;
      this.footstepTimer += dt;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        this.playFootstep(animState === 'RUN');
      }
    } else {
      this.footstepTimer = 0.2;
    }
  }

  /**
   * 3D Stereo Spatialization Helper (`StereoPannerNode`)
   */
  _connectWithPan(sourceNode, destBus, pan = 0) {
    if (!this.ctx || !destBus) return;
    if (typeof this.ctx.createStereoPanner === 'function' && pan !== 0) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-0.95, Math.min(0.95, Number(pan) || 0)), this.ctx.currentTime);
      sourceNode.connect(panner).connect(destBus);
    } else {
      sourceNode.connect(destBus);
    }
  }

  playFootstep(isRun = false) {
    if (!this.unlocked || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const takes = [98, 112, 126, 142];
    let takeIdx = Math.floor(Math.random() * takes.length);
    if (takeIdx === this.lastFootstepTake) {
      takeIdx = (takeIdx + 1) % takes.length;
    }
    this.lastFootstepTake = takeIdx;

    const pitchJitter = 0.94 + Math.random() * 0.12;
    const baseFreq = takes[takeIdx] * pitchJitter * (isRun ? 1.18 : 1.0);
    const vol = (isRun ? 0.11 : 0.07) * (0.88 + Math.random() * 0.24);
    const stepPan = (takeIdx % 2 === 0 ? -0.18 : 0.18);

    // Soft cyber-boot thump + playful magnetic hover-boot chirp on run
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.06);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    this._connectWithPan(osc.connect(gain), this.buses.sfx, stepPan);
    osc.start(now);
    osc.stop(now + 0.075);

    if (isRun) {
      const sparkOsc = ctx.createOscillator();
      const sparkGain = ctx.createGain();
      sparkOsc.type = 'sine';
      sparkOsc.frequency.setValueAtTime(680 * pitchJitter, now + 0.01);
      sparkOsc.frequency.exponentialRampToValueAtTime(1180 * pitchJitter, now + 0.045);
      sparkGain.gain.setValueAtTime(0.024, now + 0.01);
      sparkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      this._connectWithPan(sparkOsc.connect(sparkGain), this.buses.sfx, stepPan);
      sparkOsc.start(now + 0.01);
      sparkOsc.stop(now + 0.055);
    }
  }

  /**
   * Playful Combo Bubble-Pop + Harmonic Crystal Glissando when collecting 3D Data Shards
   */
  playShardPickup(combo = 1, pan = 0) {
    if (!this.unlocked) this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const pitchVar = 0.98 + Math.random() * 0.04;
    const baseFreq = (480 + Math.min(12, combo) * 48) * pitchVar;

    // 1. Playful Bubble-Pop Transient ("Blop!")
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(280, now);
    popOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.065);
    popGain.gain.setValueAtTime(0.16, now);
    popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    this._connectWithPan(popOsc.connect(popGain), this.buses.sfx, pan);
    popOsc.start(now);
    popOsc.stop(now + 0.08);

    // 2. Sparkling Pentatonic Crystal Harp Arpeggio
    const ratios = combo % 3 === 0 ? [1, 1.25, 1.5, 2.0, 2.5] : [1, 1.25, 1.5, 2.0];
    ratios.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + 0.025 + i * 0.042;
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(baseFreq * mult, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * mult * 1.06, t + 0.19);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(i === ratios.length - 1 ? 0.14 : 0.10, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

      this._connectWithPan(osc.connect(gain), this.buses.sfx, pan + (i - 1.5) * 0.12);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  /**
   * 3D Zone Welcome Musical Signature Sting (Distinct playful theme per 3D Zone!)
   */
  playZonePortal(zoneId = null, pan = 0) {
    if (!this.unlocked) this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.triggerSidechainDuck(0.45, 0.42);

    const z = zoneId || this.lastComposedZone || 'CENTRAL_HUB';
    const zoneRiffs = {
      CENTRAL_HUB:       { notes: ['D4', 'F4', 'G4', 'A4', 'D5'], wave: 'triangle', step: 0.065 },
      BATTLE_ARENA:      { notes: ['D4', 'Eb4', 'Fs4', 'A4', 'D5', 'Fs5'], wave: 'sawtooth', step: 0.055 },
      JOB_CITY:          { notes: ['C4', 'E4', 'G4', 'A4', 'C5', 'E5'], wave: 'triangle', step: 0.055 },
      AI_ACADEMY:        { notes: ['D4', 'Fs4', 'Gs4', 'A4', 'Cs5', 'Fs5'], wave: 'sine', step: 0.06 },
      TOKEN_EXCHANGE:    { notes: ['G4', 'B4', 'D5', 'G5', 'A5'], wave: 'sine', step: 0.05 },
      AI_SOCIAL_HUB:     { notes: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'], wave: 'triangle', step: 0.05 },
      AI_LAB:            { notes: ['E4', 'G4', 'B4', 'D5', 'Fs5', 'G5'], wave: 'sine', step: 0.055 },
      BUSINESS_DISTRICT: { notes: ['D4', 'A4', 'D5', 'F5', 'A5'], wave: 'sawtooth', step: 0.07 },
      AI_EMPIRE:         { notes: ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'A5'], wave: 'triangle', step: 0.055 }
    };
    const riff = zoneRiffs[z] || zoneRiffs.CENTRAL_HUB;

    // Warp portal whoosh
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(190, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(920, now + 0.28);
    sweepGain.gain.setValueAtTime(0.001, now);
    sweepGain.gain.linearRampToValueAtTime(0.11, now + 0.04);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    this._connectWithPan(sweepOsc.connect(sweepGain), this.buses.stinger, pan);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.34);

    // Musical Zone Signature Arpeggio
    riff.notes.forEach((n, idx) => {
      const freq = NOTE_FREQ[n] || 523.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + 0.04 + idx * riff.step;
      osc.type = riff.wave;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

      this._connectWithPan(osc.connect(gain), this.buses.stinger, pan + (idx - riff.notes.length / 2) * 0.08);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /**
   * Subtle, playful Holographic Bubble Hover Tick (with anti-spam cooldown)
   */
  playUiHover() {
    if (!this.unlocked || !this.ctx || this.muted) return;
    const nowMs = performance.now();
    if (this._lastHoverMs && nowMs - this._lastHoverMs < 55) return;
    this._lastHoverMs = nowMs;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(1260, now + 0.028);

    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

    osc.connect(gain).connect(this.buses.ui);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  /**
   * Playful Arcade/Sci-Fi Pop-Blip UI Click
   */
  playUiClick(variant = 'click') {
    if (!this.unlocked) this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (variant === 'nav') {
      // Two-note cheerful navigation pop ("Boop-Bip!")
      [587.33, 880.0].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.038;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.15, t + 0.045);
        gain.gain.setValueAtTime(0.085, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
        osc.connect(gain).connect(this.buses.ui);
        osc.start(t);
        osc.stop(t + 0.06);
      });
    } else if (variant === 'confirm') {
      // Three-note upbeat confirmation chime ("Ding-Dong-Ling!")
      [523.25, 659.25, 1046.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.042;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.095, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
        osc.connect(gain).connect(this.buses.ui);
        osc.start(t);
        osc.stop(t + 0.12);
      });
    } else {
      // Bouncy tactile bubble click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.042);
      gain.gain.setValueAtTime(0.085, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gain).connect(this.buses.ui);
      osc.start(now);
      osc.stop(now + 0.055);
    }
  }

  /**
   * Sparkling Crystal Coin Cascade ("Ting-Ting-Ching!") synchronized with Flying `💎` Token Particles!
   */
  playTokenCoinCascade(count = 8) {
    if (!this.unlocked) this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const coinScale = [
      NOTE_FREQ.C5, NOTE_FREQ.D5, NOTE_FREQ.E5, NOTE_FREQ.G5,
      NOTE_FREQ.A5, NOTE_FREQ.C6, NOTE_FREQ.D6, NOTE_FREQ.E6, NOTE_FREQ.G6
    ];

    const total = Math.max(3, Math.min(12, count));
    for (let i = 0; i < total; i++) {
      const t = now + i * 0.052;
      const freq = coinScale[i % coinScale.length];
      const pan = -0.5 + (i / Math.max(1, total - 1)) * 1.0;

      // Primary crystal bell ping
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      harmonic.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      harmonic.frequency.setValueAtTime(freq * 2.0, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);

      osc.connect(gain);
      harmonic.connect(gain);
      this._connectWithPan(gain, this.buses.sfx, pan);

      osc.start(t);
      harmonic.start(t);
      osc.stop(t + 0.2);
      harmonic.stop(t + 0.2);
    }

    // Final Jackpot "Cha-Ching!" Chord when coins land in the wallet
    const endT = now + total * 0.052 + 0.04;
    [NOTE_FREQ.C5, NOTE_FREQ.E5, NOTE_FREQ.G5, NOTE_FREQ.C6].forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, endT);
      gain.gain.setValueAtTime(0.0001, endT);
      gain.gain.linearRampToValueAtTime(0.12, endT + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, endT + 0.42);
      this._connectWithPan(osc.connect(gain), this.buses.stinger, (idx - 1.5) * 0.2);
      osc.start(endT);
      osc.stop(endT + 0.45);
    });
  }

  playTokenTransaction() {
    this.playTokenCoinCascade(5);
  }

  /**
   * Joyful Arcade-Cyber Pentatonic Victory Fanfare for Completing Quests & Missions!
   */
  playWinFanfare(pan = 0) {
    if (!this.unlocked) this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.triggerSidechainDuck(0.85, 0.30);

    // Upbeat 6-note Arcade Pentatonic Victory Melody (Ta-da-da-da-DAA!)
    const melody = [
      { note: 'C5', time: 0.00, dur: 0.09 },
      { note: 'E5', time: 0.08, dur: 0.09 },
      { note: 'G5', time: 0.16, dur: 0.09 },
      { note: 'A5', time: 0.24, dur: 0.11 },
      { note: 'G5', time: 0.35, dur: 0.08 },
      { note: 'C6', time: 0.44, dur: 0.52 }
    ];

    melody.forEach((m, i) => {
      const freq = NOTE_FREQ[m.note] || 523.25;
      const t = now + m.time;
      const osc = ctx.createOscillator();
      const bell = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      bell.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      bell.frequency.setValueAtTime(freq * 1.5, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(i === melody.length - 1 ? 0.16 : 0.13, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + m.dur);

      osc.connect(gain);
      bell.connect(gain);
      this._connectWithPan(gain, this.buses.stinger, pan + (i - 2.5) * 0.1);

      osc.start(t);
      bell.start(t);
      osc.stop(t + m.dur + 0.02);
      bell.stop(t + m.dur + 0.02);
    });

    // Warm celebratory bass punch on final chord
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(NOTE_FREQ.C3, now + 0.44);
    bassOsc.frequency.exponentialRampToValueAtTime(NOTE_FREQ.C2 || 65.41, now + 0.85);
    bassGain.gain.setValueAtTime(0.22, now + 0.44);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    bassOsc.connect(bassGain).connect(this.buses.stinger);
    bassOsc.start(now + 0.44);
    bassOsc.stop(now + 0.92);
  }

  /**
   * Playful Astro-Bot / Pixar / R2-D2 Style Expressive Robot Emote Synth
   * Moods: 'HAPPY' | 'EXCITED' | 'IDEA_SPARK' | 'HIGH_FIVE' | 'CURIOUS'
   */
  playCuteRobotEmote(mood = 'HAPPY', pan = 0) {
    if (!this.unlocked) this.unlock();
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    if (mood === 'HIGH_FIVE') {
      // Snappy holographic high-five clap + joyful dual-bot harmony
      if (this.noiseBuffer) {
        this._scheduleNoiseBurst(now, 0.055, 2200, 0.14, this.buses.sfx);
      }
      [NOTE_FREQ.D5, NOTE_FREQ.Fs5, NOTE_FREQ.A5, NOTE_FREQ.D6].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + 0.03 + idx * 0.04;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.08, t + 0.16);
        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        this._connectWithPan(osc.connect(gain), this.buses.sfx, pan + (idx - 1.5) * 0.15);
        osc.start(t);
        osc.stop(t + 0.2);
      });
      return;
    }

    if (mood === 'IDEA_SPARK') {
      // "Eureka!" upward whistle glide + sparkling lightbulb ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(1480, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
      this._connectWithPan(osc.connect(gain), this.buses.sfx, pan);
      osc.start(now);
      osc.stop(now + 0.2);

      const ping = ctx.createOscillator();
      const pingGain = ctx.createGain();
      ping.type = 'triangle';
      ping.frequency.setValueAtTime(2217.46, now + 0.16);
      pingGain.gain.setValueAtTime(0.13, now + 0.16);
      pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      this._connectWithPan(ping.connect(pingGain), this.buses.sfx, pan);
      ping.start(now + 0.16);
      ping.stop(now + 0.44);
      return;
    }

    if (mood === 'CURIOUS') {
      // Questioning upward inflection ("Bwoop-wee?")
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(390, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      this._connectWithPan(osc.connect(gain), this.buses.sfx, pan);
      osc.start(now);
      osc.stop(now + 0.26);
      return;
    }

    // Default 'HAPPY' / 'EXCITED': Bubbly melodious robot whistle-boops with vibrato LFO
    const pattern = mood === 'EXCITED'
      ? [
          { f1: 587, f2: 880, d: 0.055 },
          { f1: 784, f2: 1174, d: 0.055 },
          { f1: 987, f2: 1318, d: 0.065 },
          { f1: 1174, f2: 1568, d: 0.09 }
        ]
      : [
          { f1: 540, f2: 760, d: 0.065 },
          { f1: 680, f2: 1020, d: 0.075 },
          { f1: 860, f2: 1240, d: 0.095 }
        ];

    let offset = 0;
    pattern.forEach((step, idx) => {
      const t = now + offset;
      offset += step.d + 0.015;

      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(step.f1, t);
      osc.frequency.exponentialRampToValueAtTime(step.f2, t + step.d);

      // Cute robot vocal vibrato
      lfo.frequency.setValueAtTime(28, t);
      lfoGain.gain.setValueAtTime(22, t);
      lfo.connect(lfoGain).connect(osc.frequency);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.10, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + step.d + 0.01);

      this._connectWithPan(osc.connect(gain), this.buses.sfx, pan);
      osc.start(t);
      lfo.start(t);
      osc.stop(t + step.d + 0.015);
      lfo.stop(t + step.d + 0.015);
    });
  }

  /**
   * Combined Deal Seal Celebration (Robot High-Five + Coin Cascade)
   */
  playDealSealCelebration() {
    this.playCuteRobotEmote('HIGH_FIVE', 0);
    setTimeout(() => {
      this.playTokenCoinCascade(6);
    }, 140);
  }

  playEmergencyAlarm() {
    if (!this.unlocked) this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.triggerSidechainDuck(0.7, 0.22);

    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + i * 0.22;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.linearRampToValueAtTime(340, t + 0.18);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

      osc.connect(gain).connect(this.buses.stinger);
      osc.start(t);
      osc.stop(t + 0.21);
    }
  }

  playSpeedWarFanfare() {
    if (!this.unlocked) this.unlock();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.combatOverrideTimer = 12.0;
    this.triggerSidechainDuck(0.95, 0.25);

    const chord = [NOTE_FREQ.D4, NOTE_FREQ.F4, NOTE_FREQ.A4, NOTE_FREQ.D5, NOTE_FREQ.F5, NOTE_FREQ.A5];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * 0.065;
      osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.62);

      this._connectWithPan(osc.connect(gain), this.buses.stinger, (idx - 2.5) * 0.15);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  /**
   * 6. Spatialized Playful AI Vocal Formant Telemetry Synth when AI Agents converse with each other in 3D
   */
  playAiVoiceSynth(aiClass = 'ANALYST', distanceToPlayer = 10, pan = 0) {
    if (!this.unlocked || !this.ctx || this.muted) return;
    if (distanceToPlayer > 42) return; // Distance culling
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const distanceAttenuation = Math.max(0.10, 1 - distanceToPlayer / 42);
    const voiceProfileByClass = {
      ANALYST:  { base: 560, wave: 'sine',     vibHz: 24, glide: 1.25 },
      CODER:    { base: 660, wave: 'triangle', vibHz: 32, glide: 1.35 },
      CREATOR:  { base: 740, wave: 'sine',     vibHz: 28, glide: 1.45 },
      GUARDIAN: { base: 390, wave: 'triangle', vibHz: 18, glide: 1.18 },
      TRADER:   { base: 590, wave: 'sine',     vibHz: 26, glide: 1.30 },
      MANAGER:  { base: 480, wave: 'triangle', vibHz: 22, glide: 1.22 }
    }[aiClass] || { base: 560, wave: 'sine', vibHz: 24, glide: 1.25 };

    // 4-syllable expressive & cute AI vocalization with formant bandpass + vibrato
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      const t = now + i * 0.058;
      const f1 = voiceProfileByClass.base * (0.88 + Math.random() * 0.35);
      const f2 = f1 * (i === 3 ? voiceProfileByClass.glide : (0.85 + Math.random() * 0.42));

      osc.type = i % 2 === 0 ? voiceProfileByClass.wave : 'sine';
      osc.frequency.setValueAtTime(f1, t);
      osc.frequency.exponentialRampToValueAtTime(f2, t + 0.05);

      lfo.frequency.setValueAtTime(voiceProfileByClass.vibHz, t);
      lfoGain.gain.setValueAtTime(18, t);
      lfo.connect(lfoGain).connect(osc.frequency);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(f1 * 1.6, t);
      filter.Q.setValueAtTime(2.2, t);

      const peak = 0.068 * distanceAttenuation;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.054);

      osc.connect(filter).connect(gain);
      this._connectWithPan(gain, this.buses.sfx, pan);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + 0.058);
      lfo.stop(t + 0.058);
    }
  }
}

export const soundStudio = new ArenaSoundStudio();
