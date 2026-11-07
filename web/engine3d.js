/**
 * AI ARENA 3.0 – Three.js AAA 3D World Engine + Awesome-Gamedev-Agent-Skills Integration
 * Composes:
 * - `threejs-scene-setup` & `threejs-materials-lighting` (WebGLRenderer, ACESFilmic, PCFSoftShadowMap, 3-Light Rig)
 * - `threejs-aaa-graphics-builder` (MaterialLibrary, ProceduralTextures, HeroFactory, WorldPropKit, InstancedMesh, Diagnostics)
 * - `shader-programming` (GLSL Fresnel Rim + Scrolling UV Holographic Forcefield ShaderMaterial)
 * - `camera-systems` (Frame-rate-independent exponential follow, Deadzone, Velocity Look-Ahead, Bounds Clamp, Shake Hook)
 * - `game-feel` (Decaying Trauma² Screen Shake, Real-time Hit-Stop, Back-Out Squash & Stretch Pop, Tiered Feedback Bundles)
 * - `ai-behavior-trees-utility-ai` (Blackboard, Selector/Sequence Behavior Tree + Normalized Utility AI 3D Agents)
 */
import { Blackboard, createHybridAgentBrain } from './btUtilityRuntime.js';
import { soundStudio, ArenaSoundStudio } from './audioEngine.js';

/* ============================================================================
 * 1. WEB AUDIO SYNTHESIS & ADAPTIVE MUSIC STUDIO (`audio-design` skill)
 * ============================================================================ */
export { ArenaSoundStudio, soundStudio };


/* ============================================================================
 * 2. CUSTOM GLSL SHADER: FRESNEL RIM + SCROLLING UV HOLOGRAM (`shader-programming`)
 * ============================================================================ */
export function createFresnelForcefieldMaterial(THREE, hexColor = 0x00e5ff) {
  const color = new THREE.Color(hexColor);
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0.0 },
      uColor: { value: new THREE.Vector3(color.r, color.g, color.b) },
      uRimPower: { value: 2.4 },
      uScrollSpeed: { value: 0.85 }
    },
    vertexShader: `
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uRimPower;
      uniform float uScrollSpeed;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        vec3 n = normalize(vWorldNormal);
        vec3 v = normalize(vViewDir);
        float fresnel = pow(1.0 - clamp(abs(dot(n, v)), 0.0, 1.0), uRimPower);
        float scanWave = smoothstep(0.35, 0.95, fract(vUv.y * 10.0 - uTime * uScrollSpeed));
        float alpha = clamp(fresnel * 0.78 + scanWave * 0.22, 0.08, 0.88);
        vec3 finalColor = mix(uColor, vec3(1.0), fresnel * 0.45);
        gl_FragColor = vec4(finalColor, alpha);
      }
    `
  });
}

/* ============================================================================
 * 3. GAME FEEL ("JUICE") SYSTEM (`game-feel` & `camera-systems`)
 *    - Decaying Trauma² Screen Shake (additive camera offset, never player body)
 *    - Real-time unscaled Hit-Stop with overlapping ID protection
 *    - Squash & Stretch + Back-Out Overshoot Pop Tween
 * ============================================================================ */
export class GameFeelSystem {
  constructor(audio) {
    this.audio = audio;
    this.trauma = 0;
    this.decay = 1.35;
    this.noiseTime = 0;
    this.shakeOffset = { x: 0, y: 0, z: 0, roll: 0 };

    this.timeScale = 1.0;
    this._hitStopId = 0;
    this._hitStopEndRealMs = 0;

    this.activePopTweens = []; // { target, elapsed, duration }
  }

  addTrauma(amount) {
    this.trauma = Math.max(0, Math.min(1, this.trauma + amount));
  }

  triggerHitStop(durationSec = 0.065, slowScale = 0.08) {
    this._hitStopId++;
    this.timeScale = slowScale;
    this._hitStopEndRealMs = performance.now() + durationSec * 1000;
  }

  triggerSquashStretchPop(object3d, durationSec = 0.24) {
    if (!object3d) return;
    // Instant volume-conserving squash & stretch on impact
    object3d.scale.set(1.32, 0.72, 1.32);
    this.activePopTweens.push({
      target: object3d,
      elapsed: 0,
      duration: durationSec
    });
  }

  feedback(tier = 'small', targetMesh = null, combo = 1) {
    if (tier === 'small') {
      this.audio.playShardPickup(combo);
      this.addTrauma(0.18);
      if (targetMesh) this.triggerSquashStretchPop(targetMesh, 0.2);
    } else if (tier === 'medium') {
      this.audio.playShardPickup(combo + 2);
      this.addTrauma(0.38);
      this.triggerHitStop(0.05, 0.12);
      if (targetMesh) this.triggerSquashStretchPop(targetMesh, 0.26);
    } else if (tier === 'large') {
      this.audio.playZonePortal();
      this.addTrauma(0.65);
      this.triggerHitStop(0.085, 0.06);
      if (targetMesh) this.triggerSquashStretchPop(targetMesh, 0.32);
    }
  }

  update(rawDt, nowMs) {
    // 1. Real-time unscaled hit-stop recovery
    if (this.timeScale < 1.0 && nowMs >= this._hitStopEndRealMs) {
      this.timeScale = 1.0;
    }

    // 2. Decaying Trauma² Screen Shake (smooth sampled sin waves, never random static)
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.decay * rawDt);
      const shake = this.trauma * this.trauma;
      this.noiseTime += rawDt * 28.0;
      this.shakeOffset.x = 0.85 * shake * Math.sin(this.noiseTime * 1.7);
      this.shakeOffset.y = 0.65 * shake * Math.sin(this.noiseTime * 2.3);
      this.shakeOffset.z = 0.65 * shake * Math.cos(this.noiseTime * 1.9);
      this.shakeOffset.roll = 0.04 * shake * Math.sin(this.noiseTime * 1.3);
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      this.shakeOffset.z = 0;
      this.shakeOffset.roll = 0;
    }

    // 3. Back-Out Overshoot Squash & Stretch Tweens
    for (let i = this.activePopTweens.length - 1; i >= 0; i--) {
      const tw = this.activePopTweens[i];
      tw.elapsed += rawDt;
      const t = Math.min(1, tw.elapsed / tw.duration);
      // EaseOutBack curve (overshoots past 1.0 then settles at 1.0)
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const easeOutBack = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);

      const sx = 1.32 + (1.0 - 1.32) * easeOutBack;
      const sy = 0.72 + (1.0 - 0.72) * easeOutBack;
      tw.target.scale.set(sx, sy, sx);

      if (t >= 1) {
        tw.target.scale.set(1, 1, 1);
        this.activePopTweens.splice(i, 1);
      }
    }

    return rawDt * this.timeScale;
  }
}

/* ============================================================================
 * 4. PROCEDURAL TEXTURES & SPRITE LABELS (`threejs-aaa-graphics-builder`)
 * ============================================================================ */
export function createProceduralTextures(THREE) {
  // 1. Multi-Color Neon Cyber-Grid Ground Texture
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = 512;
  gridCanvas.height = 512;
  const gCtx = gridCanvas.getContext('2d');
  const bgGrad = gCtx.createLinearGradient(0, 0, 512, 512);
  bgGrad.addColorStop(0, '#070b22');
  bgGrad.addColorStop(0.5, '#09132c');
  bgGrad.addColorStop(1, '#120b2e');
  gCtx.fillStyle = bgGrad;
  gCtx.fillRect(0, 0, 512, 512);

  // Subtle circuit sub-grid
  gCtx.strokeStyle = 'rgba(99, 102, 241, 0.24)';
  gCtx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 64) {
    gCtx.beginPath();
    gCtx.moveTo(i, 0);
    gCtx.lineTo(i, 512);
    gCtx.stroke();
    gCtx.beginPath();
    gCtx.moveTo(0, i);
    gCtx.lineTo(512, i);
    gCtx.stroke();
  }

  // Diagonal cyber energy traces
  gCtx.strokeStyle = 'rgba(236, 72, 153, 0.22)';
  gCtx.lineWidth = 2;
  gCtx.beginPath();
  gCtx.moveTo(0, 256);
  gCtx.lineTo(256, 0);
  gCtx.moveTo(256, 512);
  gCtx.lineTo(512, 256);
  gCtx.stroke();

  // Vibrant Cyan + Magenta outer tile frame
  const borderGrad = gCtx.createLinearGradient(0, 0, 512, 512);
  borderGrad.addColorStop(0, 'rgba(0, 229, 255, 0.78)');
  borderGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.65)');
  borderGrad.addColorStop(1, 'rgba(245, 158, 11, 0.75)');
  gCtx.strokeStyle = borderGrad;
  gCtx.lineWidth = 4;
  gCtx.strokeRect(2, 2, 508, 508);

  // Multi-color corner power nodes
  gCtx.fillStyle = '#00e5ff';
  gCtx.fillRect(0, 0, 14, 14);
  gCtx.fillStyle = '#ec4899';
  gCtx.fillRect(498, 0, 14, 14);
  gCtx.fillStyle = '#fbbf24';
  gCtx.fillRect(0, 498, 14, 14);
  gCtx.fillStyle = '#10b981';
  gCtx.fillRect(498, 498, 14, 14);

  const groundTexture = new THREE.CanvasTexture(gridCanvas);
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(45, 45);
  if (groundTexture.colorSpace !== undefined && THREE.SRGBColorSpace) {
    groundTexture.colorSpace = THREE.SRGBColorSpace;
  }

  // 2. Multi-Color Neon Metropolis Building Windows Texture
  const winCanvas = document.createElement('canvas');
  winCanvas.width = 256;
  winCanvas.height = 512;
  const wCtx = winCanvas.getContext('2d');
  wCtx.fillStyle = '#09122c';
  wCtx.fillRect(0, 0, 256, 512);

  const windowPalette = [
    'rgba(56, 189, 248, 0.92)',  // Cyber Cyan
    'rgba(244, 114, 182, 0.88)', // Neon Pink
    'rgba(251, 191, 36, 0.90)',  // Amber Gold
    'rgba(168, 85, 247, 0.88)',  // Electric Violet
    'rgba(52, 211, 153, 0.88)'   // Emerald
  ];
  for (let y = 16; y < 496; y += 28) {
    for (let x = 16; x < 240; x += 36) {
      const hash = (x * 7 + y * 13);
      const lit = (hash % 5) !== 0;
      wCtx.fillStyle = lit
        ? windowPalette[hash % windowPalette.length]
        : 'rgba(15, 23, 42, 0.92)';
      wCtx.fillRect(x, y, 22, 14);
    }
  }
  const buildingTexture = new THREE.CanvasTexture(winCanvas);
  buildingTexture.wrapS = THREE.RepeatWrapping;
  buildingTexture.wrapT = THREE.RepeatWrapping;

  // 3. Vibrant Cyber-Aurora & Sunset Horizon Sky Dome Texture
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const sCtx = skyCanvas.getContext('2d');
  const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0.0, '#05081c');  // Deep Cosmic Zenith
  skyGrad.addColorStop(0.28, '#1e1b4b'); // Indigo Nebula
  skyGrad.addColorStop(0.46, '#4c1d95'); // Royal Cyber Violet
  skyGrad.addColorStop(0.62, '#9d174d'); // Sunset Magenta-Rose
  skyGrad.addColorStop(0.76, '#0369a1'); // Electric Horizon Cyan
  skyGrad.addColorStop(1.0, '#091024');  // Ground Fog Blend
  sCtx.fillStyle = skyGrad;
  sCtx.fillRect(0, 0, 512, 512);

  // Glowing Aurora Ribbons & Star Specks across the sky dome
  for (let i = 0; i < 140; i++) {
    const sx = (i * 73) % 512;
    const sy = (i * 41) % 320;
    const r = (i % 3 === 0) ? 2.0 : 1.2;
    sCtx.fillStyle = i % 4 === 0 ? '#fde047' : i % 3 === 0 ? '#67e8f9' : '#f9a8d4';
    sCtx.beginPath();
    sCtx.arc(sx, sy, r, 0, Math.PI * 2);
    sCtx.fill();
  }
  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  if (skyTexture.colorSpace !== undefined && THREE.SRGBColorSpace) {
    skyTexture.colorSpace = THREE.SRGBColorSpace;
  }

  return { groundTexture, buildingTexture, skyTexture };
}

export function createBillboardSprite(THREE, title, subtitle = '', borderColor = '#00e5ff', scaleWidth = 9) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  function redraw(newTitle, newSubtitle) {
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = 'rgba(4, 12, 28, 0.88)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(8, 8, 496, 112, 18) : ctx.rect(8, 8, 496, 112);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = borderColor;
    ctx.fillRect(36, 8, 440, 6);

    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(newTitle || '').slice(0, 32), 256, newSubtitle ? 56 : 74);

    if (newSubtitle) {
      ctx.font = 'bold 21px "Segoe UI", sans-serif';
      ctx.fillStyle = borderColor;
      ctx.fillText(String(newSubtitle || '').slice(0, 44), 256, 96);
    }
  }

  redraw(title, subtitle);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleWidth, scaleWidth * 0.25, 1);
  sprite.renderOrder = 10;

  return {
    sprite,
    updateText(nextTitle, nextSubtitle) {
      redraw(nextTitle, nextSubtitle);
      tex.needsUpdate = true;
    }
  };
}

/* ============================================================================
 * 5. SHARED MATERIAL LIBRARY (`threejs-aaa-graphics-builder`)
 * ============================================================================ */
export function createMaterialLibrary(THREE, textures) {
  return {
    groundContact: new THREE.MeshStandardMaterial({
      map: textures.groundTexture,
      roughness: 0.72,
      metalness: 0.22
    }),
    roadSurface: new THREE.MeshStandardMaterial({
      color: 0x0b1d3a,
      roughness: 0.38,
      metalness: 0.55,
      emissive: 0x04152d,
      emissiveIntensity: 0.45
    }),
    bodyPrimary: new THREE.MeshStandardMaterial({
      color: 0x11284c,
      map: textures.buildingTexture,
      roughness: 0.35,
      metalness: 0.68
    }),
    bodySecondary: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.48,
      metalness: 0.52
    }),
    trimCyan: new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00b8d4,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.3
    }),
    trimGold: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.8
    }),
    hazardRed: new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.4
    }),
    rewardEmerald: new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
      roughness: 0.18,
      metalness: 0.45
    }),
    glassDomed: new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72
    }),
    forcefieldShader: createFresnelForcefieldMaterial(THREE, 0x00e5ff),
    arenaShader: createFresnelForcefieldMaterial(THREE, 0xf43f5e)
  };
}

/* ============================================================================
 * 6. DIVERSE 3D CHARACTER & AI MORPHOLOGY ENGINE (`DAI_SU`, `PHU_THUY`, `BINH_DAN`, `HIEP_SI`, `CO_KHI`, `TIEN_TU`)
 * ============================================================================ */
export const MORPHOLOGY_CONFIG = {
  DAI_SU: {
    key: 'DAI_SU',
    label: 'AI Đại Sư',
    emoji: '🧘',
    primaryHex: '#f59e0b',
    secondaryHex: '#ef4444'
  },
  PHU_THUY: {
    key: 'PHU_THUY',
    label: 'AI Phù Thủy',
    emoji: '🧙',
    primaryHex: '#a855f7',
    secondaryHex: '#ec4899'
  },
  BINH_DAN: {
    key: 'BINH_DAN',
    label: 'AI Bình Dân',
    emoji: '🧑‍💻',
    primaryHex: '#10b981',
    secondaryHex: '#00e5ff'
  },
  HIEP_SI: {
    key: 'HIEP_SI',
    label: 'AI Hiệp Sĩ',
    emoji: '⚔️',
    primaryHex: '#3b82f6',
    secondaryHex: '#38bdf8'
  },
  CO_KHI: {
    key: 'CO_KHI',
    label: 'AI Cơ Khí',
    emoji: '🦾',
    primaryHex: '#f43f5e',
    secondaryHex: '#fb923c'
  },
  TIEN_TU: {
    key: 'TIEN_TU',
    label: 'AI Tiên Tử',
    emoji: '🧚',
    primaryHex: '#ec4899',
    secondaryHex: '#c084fc'
  }
};

export function resolveMorphologyKey(rawAvatarOrStyle = '', aiClass = '') {
  const s = String(rawAvatarOrStyle || '').toUpperCase().trim();
  if (MORPHOLOGY_CONFIG[s]) return s;
  if (s.includes('🧘') || s.includes('DAI_SU') || s.includes('MONK') || s.includes('SAGE')) return 'DAI_SU';
  if (s.includes('🧙') || s.includes('PHU_THUY') || s.includes('MAGE') || s.includes('WIZARD')) return 'PHU_THUY';
  if (s.includes('🧑‍💻') || s.includes('BINH_DAN') || s.includes('CITIZEN') || s.includes('HACKER')) return 'BINH_DAN';
  if (s.includes('⚔️') || s.includes('HIEP_SI') || s.includes('KNIGHT') || s.includes('CYBER_KNIGHT')) return 'HIEP_SI';
  if (s.includes('🦾') || s.includes('CO_KHI') || s.includes('MECHA') || s.includes('TITAN')) return 'CO_KHI';
  if (s.includes('🧚') || s.includes('TIEN_TU') || s.includes('FAIRY') || s.includes('MUSE')) return 'TIEN_TU';

  const classMap = {
    ANALYST: 'DAI_SU',
    CREATOR: 'PHU_THUY',
    TRADER: 'BINH_DAN',
    CODER: 'HIEP_SI',
    GUARDIAN: 'CO_KHI',
    MANAGER: 'TIEN_TU'
  };
  return classMap[String(aiClass || '').toUpperCase()] || 'HIEP_SI';
}

export function attachArchetype3dMorphology(THREE, {
  morphKey,
  root,
  bodyRig,
  headGroup,
  rightArmPivot,
  primaryHex,
  secondaryHex
}) {
  const pMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryHex),
    emissive: new THREE.Color(primaryHex),
    emissiveIntensity: 0.68,
    roughness: 0.25,
    metalness: 0.55
  });
  const sMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(secondaryHex),
    emissive: new THREE.Color(secondaryHex),
    emissiveIntensity: 0.85,
    roughness: 0.2,
    metalness: 0.45
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.85
  });

  const morphFX = {
    morphKey,
    dharmaWheel: null,
    wizardRunes: null,
    hoverboard: null,
    fairyWings: null,
    staffOrb: null
  };

  if (morphKey === 'DAI_SU') {
    // 1. AI ĐẠI SƯ: Conical Golden Sage Hat + Flowing Saffron Robe + Levitating Dharma Halo & 6 Prayer Beads + Lotus Staff
    const conicalHat = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.36, 20), goldMat);
    conicalHat.position.set(0, 0.42, 0);
    headGroup.add(conicalHat);

    const robeSkirt = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.05, 16), pMat);
    robeSkirt.position.set(0, 0.88, 0);
    bodyRig.add(robeSkirt);

    const dharmaGroup = new THREE.Group();
    dharmaGroup.position.set(0, 2.15, -0.45);
    const haloRing = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.045, 12, 32), goldMat);
    dharmaGroup.add(haloRing);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), i % 2 === 0 ? goldMat : sMat);
      bead.position.set(Math.cos(ang) * 0.78, Math.sin(ang) * 0.78, 0);
      dharmaGroup.add(bead);
    }
    bodyRig.add(dharmaGroup);
    morphFX.dharmaWheel = dharmaGroup;

    if (rightArmPivot) {
      const staffPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.85, 8), goldMat);
      staffPole.position.set(0, -0.35, 0.22);
      staffPole.rotation.x = 0.25;
      rightArmPivot.add(staffPole);
      const lotusGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), sMat);
      lotusGem.position.set(0, 0.56, 0.44);
      rightArmPivot.add(lotusGem);
      morphFX.staffOrb = lotusGem;
    }
  } else if (morphKey === 'PHU_THUY') {
    // 2. AI PHÙ THỦY: Tall Pointed Cyber-Wizard Hat + Wide Brim + Mystic Cape + Crystal Staff + Counter-Rotating Ground Runes
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.05, 22), pMat);
    hatBrim.position.set(0, 0.30, 0);
    headGroup.add(hatBrim);

    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.92, 18), pMat);
    hatCone.position.set(0, 0.76, -0.04);
    hatCone.rotation.x = -0.15;
    headGroup.add(hatCone);

    const hatBand = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.045, 8, 20), goldMat);
    hatBand.rotation.x = Math.PI / 2;
    hatBand.position.set(0, 0.36, 0);
    headGroup.add(hatBand);

    const cape = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.25, 0.06), pMat);
    cape.position.set(0, 1.32, -0.36);
    cape.rotation.x = 0.14;
    bodyRig.add(cape);

    if (rightArmPivot) {
      const wandPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.75, 8), pMat);
      wandPole.position.set(0, -0.35, 0.24);
      wandPole.rotation.x = 0.22;
      rightArmPivot.add(wandPole);
      const arcaneOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), sMat);
      arcaneOrb.position.set(0, 0.54, 0.44);
      rightArmPivot.add(arcaneOrb);
      morphFX.staffOrb = arcaneOrb;
    }

    const runeGroup = new THREE.Group();
    runeGroup.position.y = 0.12;
    const outerRune = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.28, 6), sMat);
    outerRune.rotation.x = -Math.PI / 2;
    const innerRune = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.86, 3), goldMat);
    innerRune.rotation.x = -Math.PI / 2;
    runeGroup.add(outerRune);
    runeGroup.add(innerRune);
    root.add(runeGroup);
    morphFX.wizardRunes = runeGroup;
  } else if (morphKey === 'BINH_DAN') {
    // 3. AI BÌNH DÂN: Neon Street Headphones + Cyber Visor Cap + Hoodie Collar + Anti-Gravity Neon Hoverboard
    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.055, 10, 20, Math.PI), sMat);
    headband.position.set(0, 0.05, 0);
    headGroup.add(headband);

    const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16), pMat);
    earL.rotation.z = Math.PI / 2;
    earL.position.set(-0.40, 0.04, 0);
    headGroup.add(earL);

    const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16), pMat);
    earR.rotation.z = Math.PI / 2;
    earR.position.set(0.40, 0.04, 0);
    headGroup.add(earR);

    const hoodieCollar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.10, 10, 20), pMat);
    hoodieCollar.rotation.x = Math.PI / 2;
    hoodieCollar.position.set(0, 1.98, 0);
    bodyRig.add(hoodieCollar);

    const boardGroup = new THREE.Group();
    boardGroup.position.set(0, 0.16, 0);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.10, 1.82), pMat);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 1.88), sMat);
    boardGroup.add(deck);
    boardGroup.add(trim);
    root.add(boardGroup);
    morphFX.hoverboard = boardGroup;
  } else if (morphKey === 'CO_KHI') {
    // 4. AI CƠ KHÍ: Heavy Titan Mecha Chassis (1.24x scale) + Bulky Shoulder Pauldrons + Twin Shoulder Plasma Cannons
    bodyRig.scale.set(1.22, 1.16, 1.22);

    const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.48), pMat);
    pauldronL.position.set(-0.68, 2.04, 0);
    bodyRig.add(pauldronL);

    const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.48), pMat);
    pauldronR.position.set(0.68, 2.04, 0);
    bodyRig.add(pauldronR);

    const cannonL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.92, 12), sMat);
    cannonL.rotation.x = Math.PI / 2.3;
    cannonL.position.set(-0.56, 2.34, 0.18);
    bodyRig.add(cannonL);

    const cannonR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.92, 12), sMat);
    cannonR.rotation.x = Math.PI / 2.3;
    cannonR.position.set(0.56, 2.34, 0.18);
    bodyRig.add(cannonR);
  } else if (morphKey === 'TIEN_TU') {
    // 5. AI TIÊN TỬ: Celestial Star Crown + 4 Fluttering Holographic Butterfly Wings
    const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 8, 20), goldMat);
    crownRing.rotation.x = Math.PI / 2;
    crownRing.position.set(0, 0.34, 0);
    headGroup.add(crownRing);

    const crownGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), sMat);
    crownGem.position.set(0, 0.48, 0.24);
    headGroup.add(crownGem);

    const wingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(primaryHex),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.76
    });
    const wingSubMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(secondaryHex),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.68
    });

    const wingsGroup = new THREE.Group();
    wingsGroup.position.set(0, 1.68, -0.34);

    const wingTopL = new THREE.Mesh(new THREE.CircleGeometry(0.68, 16), wingMat);
    wingTopL.scale.set(1.25, 0.72, 1);
    wingTopL.position.set(-0.62, 0.28, 0);
    wingTopL.rotation.z = -0.35;
    wingsGroup.add(wingTopL);

    const wingTopR = new THREE.Mesh(new THREE.CircleGeometry(0.68, 16), wingMat);
    wingTopR.scale.set(1.25, 0.72, 1);
    wingTopR.position.set(0.62, 0.28, 0);
    wingTopR.rotation.z = 0.35;
    wingsGroup.add(wingTopR);

    const wingBotL = new THREE.Mesh(new THREE.CircleGeometry(0.48, 16), wingSubMat);
    wingBotL.scale.set(1.15, 0.68, 1);
    wingBotL.position.set(-0.48, -0.26, 0);
    wingBotL.rotation.z = 0.35;
    wingsGroup.add(wingBotL);

    const wingBotR = new THREE.Mesh(new THREE.CircleGeometry(0.48, 16), wingSubMat);
    wingBotR.scale.set(1.15, 0.68, 1);
    wingBotR.position.set(0.48, -0.26, 0);
    wingBotR.rotation.z = -0.35;
    wingsGroup.add(wingBotR);

    bodyRig.add(wingsGroup);
    morphFX.fairyWings = wingsGroup;
  } else {
    // 6. AI HIỆP SĨ (`HIEP_SI`): Sweeping Cyber-Plasma Wings + Paladin V-Crest + Glowing Cyber-Blade
    const vCrestL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.12), goldMat);
    vCrestL.position.set(-0.16, 0.38, 0.24);
    vCrestL.rotation.z = 0.45;
    headGroup.add(vCrestL);

    const vCrestR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.12), goldMat);
    vCrestR.position.set(0.16, 0.38, 0.24);
    vCrestR.rotation.z = -0.45;
    headGroup.add(vCrestR);

    const wingGroup = new THREE.Group();
    wingGroup.position.set(0, 1.72, -0.38);
    for (const side of [-1, 1]) {
      const upperBlade = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.06), sMat);
      upperBlade.position.set(side * 0.65, 0.24, -0.05);
      upperBlade.rotation.z = side * -0.38;
      wingGroup.add(upperBlade);

      const lowerBlade = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.06), pMat);
      lowerBlade.position.set(side * 0.55, -0.12, -0.05);
      lowerBlade.rotation.z = side * 0.22;
      wingGroup.add(lowerBlade);
    }
    bodyRig.add(wingGroup);
    morphFX.fairyWings = wingGroup;

    if (rightArmPivot) {
      const cyberBlade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.15, 0.16), sMat);
      cyberBlade.position.set(0, -0.68, 0.36);
      cyberBlade.rotation.x = Math.PI / 2.4;
      rightArmPivot.add(cyberBlade);
    }
  }

  return morphFX;
}

export function animateMorphologyFX(morphFX, elapsed, idx = 0) {
  if (!morphFX) return;
  if (morphFX.dharmaWheel) {
    morphFX.dharmaWheel.rotation.z = elapsed * 1.6 + idx;
  }
  if (morphFX.wizardRunes) {
    morphFX.wizardRunes.rotation.y = elapsed * 1.4;
  }
  if (morphFX.staffOrb) {
    morphFX.staffOrb.rotation.y = elapsed * 3.2;
    morphFX.staffOrb.rotation.x = elapsed * 2.1;
  }
  if (morphFX.fairyWings) {
    const flap = 1.0 + Math.sin(elapsed * 8.5 + idx) * 0.14;
    morphFX.fairyWings.scale.set(flap, 1, 1);
  }
  if (morphFX.hoverboard) {
    morphFX.hoverboard.position.y = 0.16 + Math.sin(elapsed * 5.0 + idx) * 0.05;
  }
}

/* ============================================================================
 * 6B. AUTHORED HERO CHARACTER & AI COMPANION DRONE FACTORY (`HeroFactory`)
 * ============================================================================ */
export function createCyberKnightHero(THREE, {
  name,
  title,
  primaryColor = '#00e5ff',
  avatarStyle = 'HIEP_SI',
  isLocal = false
}) {
  const root = new THREE.Group();
  const morphKey = resolveMorphologyKey(avatarStyle, 'CODER');
  const morphCfg = MORPHOLOGY_CONFIG[morphKey] || MORPHOLOGY_CONFIG.HIEP_SI;
  const effectivePrimary = primaryColor || morphCfg.primaryHex;

  const armorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(effectivePrimary),
    roughness: 0.32,
    metalness: 0.65
  });
  const darkJointMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.55,
    metalness: 0.45
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(morphCfg.secondaryHex),
    emissive: new THREE.Color(effectivePrimary),
    emissiveIntensity: 1.2,
    roughness: 0.15
  });
  const flameMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(morphCfg.secondaryHex),
    transparent: true,
    opacity: 0.85
  });

  const auraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.98, 28),
    new THREE.MeshBasicMaterial({ color: effectivePrimary, side: THREE.DoubleSide, transparent: true, opacity: isLocal ? 0.75 : 0.4 })
  );
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.04;
  root.add(auraRing);

  const bodyRig = new THREE.Group();
  root.add(bodyRig);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.05, 0.52), armorMat);
  torso.position.y = 1.55;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyRig.add(torso);

  const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.56, 16), visorMat);
  chestCore.rotation.x = Math.PI / 2;
  chestCore.position.set(0, 1.62, 0.02);
  bodyRig.add(chestCore);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.34), darkJointMat);
  backpack.position.set(0, 1.6, -0.36);
  backpack.castShadow = true;
  bodyRig.add(backpack);

  const boostFlameL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 8), flameMat);
  boostFlameL.rotation.x = -Math.PI / 2;
  boostFlameL.position.set(-0.18, 1.32, -0.68);
  boostFlameL.visible = false;
  bodyRig.add(boostFlameL);

  const boostFlameR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.55, 8), flameMat);
  boostFlameR.rotation.x = -Math.PI / 2;
  boostFlameR.position.set(0.18, 1.32, -0.68);
  boostFlameR.visible = false;
  bodyRig.add(boostFlameR);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.38, 0);
  bodyRig.add(headGroup);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 16), darkJointMat);
  helmet.castShadow = true;
  headGroup.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.32), visorMat);
  visor.position.set(0, 0.02, 0.24);
  headGroup.add(visor);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.52), armorMat);
  crest.position.set(0, 0.28, -0.04);
  headGroup.add(crest);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.62, 1.95, 0);
  bodyRig.add(leftArmPivot);
  leftArmPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), armorMat));
  const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.82, 0.26), darkJointMat);
  leftArmMesh.position.y = -0.42;
  leftArmMesh.castShadow = true;
  leftArmPivot.add(leftArmMesh);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.62, 1.95, 0);
  bodyRig.add(rightArmPivot);
  rightArmPivot.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), armorMat));
  const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.82, 0.26), darkJointMat);
  rightArmMesh.position.y = -0.42;
  rightArmMesh.castShadow = true;
  rightArmPivot.add(rightArmMesh);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.26, 1.02, 0);
  bodyRig.add(leftLegPivot);
  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.95, 0.32), armorMat);
  leftLegMesh.position.y = -0.48;
  leftLegMesh.castShadow = true;
  leftLegPivot.add(leftLegMesh);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.26, 1.02, 0);
  bodyRig.add(rightLegPivot);
  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.95, 0.32), armorMat);
  rightLegMesh.position.y = -0.48;
  rightLegMesh.castShadow = true;
  rightLegPivot.add(rightLegMesh);

  // Attach 3D Archetype Morphology (`DAI_SU`, `PHU_THUY`, `BINH_DAN`, `HIEP_SI`, `CO_KHI`, `TIEN_TU`)
  const morphFX = attachArchetype3dMorphology(THREE, {
    morphKey,
    root,
    bodyRig,
    headGroup,
    rightArmPivot,
    primaryHex: effectivePrimary,
    secondaryHex: morphCfg.secondaryHex
  });

  const companionDrone = new THREE.Group();
  companionDrone.position.set(1.35, 2.55, 0);
  root.add(companionDrone);

  const droneCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 1), visorMat);
  companionDrone.add(droneCore);
  const droneGyro = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.04, 8, 24), armorMat);
  droneGyro.rotation.x = Math.PI / 3;
  companionDrone.add(droneGyro);

  const badge = createBillboardSprite(
    THREE,
    `${isLocal ? '★ ' : ''}${morphCfg.emoji} ${name}`,
    `${morphCfg.label} • ${title || 'AI Commander'}`,
    effectivePrimary,
    4.8
  );
  badge.sprite.position.set(0, 3.85, 0);
  root.add(badge.sprite);

  return {
    root,
    bodyRig,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    boostFlameL,
    boostFlameR,
    companionDrone,
    droneGyro,
    auraRing,
    badge,
    morphFX,
    morphKey,
    primaryColor: effectivePrimary
  };
}

export function updateHeroAnimation(hero, animState, elapsed, isLocal = false) {
  const isRun = animState === 'RUN';
  const isWalk = animState === 'WALK';
  const isInteract = animState === 'INTERACT';

  if (isRun || isWalk) {
    const freq = isRun ? 13 : 8;
    const amp = isRun ? 0.72 : 0.45;
    const phase = elapsed * freq;

    hero.leftLegPivot.rotation.x = Math.sin(phase) * amp;
    hero.rightLegPivot.rotation.x = -Math.sin(phase) * amp;
    hero.leftArmPivot.rotation.x = -Math.sin(phase) * (amp * 0.85);
    hero.rightArmPivot.rotation.x = Math.sin(phase) * (amp * 0.85);

    hero.bodyRig.position.y = Math.abs(Math.cos(phase)) * (isRun ? 0.16 : 0.08);
    hero.bodyRig.rotation.x = isRun ? 0.18 : 0.06;
  } else if (isInteract) {
    hero.leftLegPivot.rotation.x = 0;
    hero.rightLegPivot.rotation.x = 0;
    hero.rightArmPivot.rotation.x = -1.25;
    hero.leftArmPivot.rotation.x = -0.45;
    hero.bodyRig.position.y = Math.sin(elapsed * 5) * 0.05;
    hero.bodyRig.rotation.x = 0;
  } else {
    hero.leftLegPivot.rotation.x *= 0.85;
    hero.rightLegPivot.rotation.x *= 0.85;
    hero.leftArmPivot.rotation.x = Math.sin(elapsed * 2.2) * 0.06;
    hero.rightArmPivot.rotation.x = -Math.sin(elapsed * 2.2) * 0.06;
    hero.bodyRig.position.y = Math.sin(elapsed * 2.6) * 0.05;
    hero.bodyRig.rotation.x *= 0.85;
  }

  hero.boostFlameL.visible = isRun;
  hero.boostFlameR.visible = isRun;
  if (isRun) {
    const flicker = 0.8 + Math.sin(elapsed * 35) * 0.25;
    hero.boostFlameL.scale.set(1, flicker, 1);
    hero.boostFlameR.scale.set(1, flicker, 1);
  }

  const orbitAngle = elapsed * 1.85 + (isLocal ? 0 : 1.5);
  hero.companionDrone.position.set(
    Math.cos(orbitAngle) * 1.45,
    2.45 + Math.sin(elapsed * 3.8) * 0.22,
    Math.sin(orbitAngle) * 1.45
  );
  hero.droneGyro.rotation.z = elapsed * 3.2;
  hero.droneGyro.rotation.y = elapsed * 2.1;
  hero.auraRing.rotation.z = elapsed * 0.8;
  animateMorphologyFX(hero.morphFX, elapsed, 0);
}

/* ============================================================================
 * 7. ARTICULATED 3D CYBER-ANDROID AI AGENT FACTORY & SPEECH BUBBLES
 *    (`threejs-aaa-graphics-builder` + `dialogue-systems` + `ai-behavior-trees-utility-ai`)
 * ============================================================================ */
export function createSpeechBubbleSprite(THREE, accentColor = '#00e5ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 190;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(9.2, 2.75, 1);
  sprite.renderOrder = 999;
  sprite.visible = false;

  function showSpeech(speakerTitle, lineText, topicTag = 'GIAO TIẾP AI') {
    ctx.clearRect(0, 0, 640, 190);

    // Speech Bubble Glass Background
    ctx.fillStyle = 'rgba(3, 12, 28, 0.94)';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;

    // Rounded rectangle body
    const rx = 12, ry = 10, rw = 616, rh = 144, r = 18;
    ctx.beginPath();
    ctx.moveTo(rx + r, ry);
    ctx.lineTo(rx + rw - r, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
    ctx.lineTo(rx + rw, ry + rh - r);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
    // Pointer tail at bottom center
    ctx.lineTo(340, ry + rh);
    ctx.lineTo(320, 182);
    ctx.lineTo(300, ry + rh);
    ctx.lineTo(rx + r, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
    ctx.lineTo(rx, ry + r);
    ctx.quadraticCurveTo(rx, ry, rx + r, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Header bar
    ctx.font = 'bold 21px "Segoe UI", sans-serif';
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'left';
    ctx.fillText(`💬 ${speakerTitle}  •  [${topicTag}]`, 32, 42);

    // Word-wrap Vietnamese dialogue into 2 lines max
    ctx.font = '600 22px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f8fafc';
    const words = String(lineText || '').split(' ');
    let line1 = '';
    let line2 = '';
    for (const w of words) {
      if ((line1 + ' ' + w).length <= 46) {
        line1 = line1 ? `${line1} ${w}` : w;
      } else {
        line2 = line2 ? `${line2} ${w}` : w;
      }
    }
    ctx.fillText(line1, 32, 84);
    if (line2) {
      ctx.fillStyle = '#bae6fd';
      ctx.fillText(line2.length > 52 ? line2.slice(0, 50) + '...' : line2, 32, 120);
    }

    tex.needsUpdate = true;
    sprite.visible = true;
  }

  function hideSpeech() {
    sprite.visible = false;
  }

  return { sprite, showSpeech, hideSpeech };
}

export function createAutonomousAiBotMesh(THREE, agentData) {
  const root = new THREE.Group();
  const morphKey = resolveMorphologyKey(agentData.avatar, agentData.ai_class);
  const morphCfg = MORPHOLOGY_CONFIG[morphKey] || MORPHOLOGY_CONFIG.HIEP_SI;
  const colorHex = morphCfg.primaryHex;
  const secondaryHex = morphCfg.secondaryHex;

  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.32,
    metalness: 0.78
  });
  const shellMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.25,
    metalness: 0.68
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(secondaryHex),
    emissiveIntensity: 1.25,
    roughness: 0.15
  });

  // Articulated Body Rig for realistic walking, nodding & hand gestures
  const bodyRig = new THREE.Group();
  root.add(bodyRig);

  // 1. Torso & Neural Heart Core
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.08, 0.52), armorMat);
  torso.position.y = 1.48;
  torso.castShadow = true;
  bodyRig.add(torso);

  const chestTrim = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.26, 0.56), shellMat);
  chestTrim.position.y = 1.72;
  bodyRig.add(chestTrim);

  const pod = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), coreMat);
  pod.position.set(0, 1.52, 0.28);
  bodyRig.add(pod);

  // 2. Articulated Head, Expressive LED Visor & Cyber Antennas
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 2.22, 0);
  bodyRig.add(headPivot);

  const headMesh = new THREE.Mesh(
    morphKey === 'DAI_SU' || morphKey === 'TIEN_TU'
      ? new THREE.SphereGeometry(0.36, 16, 14)
      : new THREE.BoxGeometry(0.62, 0.54, 0.58),
    armorMat
  );
  headMesh.castShadow = true;
  headPivot.add(headMesh);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.18, 0.08), coreMat);
  visor.position.set(0, 0.03, 0.28);
  headPivot.add(visor);

  const antennaL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.38, 8), shellMat);
  antennaL.position.set(-0.34, 0.28, 0);
  antennaL.rotation.z = 0.2;
  headPivot.add(antennaL);

  const antennaR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.38, 8), shellMat);
  antennaR.position.set(0.34, 0.28, 0);
  antennaR.rotation.z = -0.2;
  headPivot.add(antennaR);

  // 3. Articulated Left & Right Arms + Holographic Projection Pad
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.58, 1.88, 0);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.82, 0.24), shellMat);
  leftArm.position.y = -0.34;
  leftArm.castShadow = true;
  leftArmPivot.add(leftArm);
  bodyRig.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.58, 1.88, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.82, 0.24), shellMat);
  rightArm.position.y = -0.34;
  rightArm.castShadow = true;
  rightArmPivot.add(rightArm);

  // Holographic Data Tablet projected from right hand during conversations
  const holoPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.04, 0.34),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex), transparent: true, opacity: 0.78 })
  );
  holoPad.position.set(0, -0.72, 0.26);
  holoPad.visible = false;
  rightArmPivot.add(holoPad);
  bodyRig.add(rightArmPivot);

  // 4. Articulated Left & Right Legs
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.24, 0.92, 0);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.88, 0.30), armorMat);
  leftLeg.position.y = -0.44;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);
  bodyRig.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.24, 0.92, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.88, 0.30), armorMat);
  rightLeg.position.y = -0.44;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);
  bodyRig.add(rightLegPivot);

  // 5. Attach Distinctive 3D Archetype Morphology (`AI Đại Sư`, `AI Phù Thủy`, `AI Bình Dân`, `AI Hiệp Sĩ`, `AI Cơ Khí`, `AI Tiên Tử`)
  const morphFX = attachArchetype3dMorphology(THREE, {
    morphKey,
    root,
    bodyRig,
    headGroup: headPivot,
    rightArmPivot,
    primaryHex: colorHex,
    secondaryHex
  });

  // 6. Glowing Ground Aura Halo
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.045, 10, 32), coreMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.08;
  root.add(halo);

  // 7. Status Badge & 3D Floating Speech Bubble
  const badge = createBillboardSprite(
    THREE,
    `${morphCfg.emoji} ${agentData.name}`,
    `${morphCfg.label} • [BT: Đang khởi tạo...]`,
    colorHex,
    5.2
  );
  badge.sprite.position.set(0, 3.55, 0);
  root.add(badge.sprite);

  const speechBubble = createSpeechBubbleSprite(THREE, colorHex);
  speechBubble.sprite.position.set(0, 4.75, 0);
  root.add(speechBubble.sprite);

  return {
    root,
    bodyRig,
    pod,
    headPivot,
    visor,
    leftArmPivot,
    rightArmPivot,
    holoPad,
    leftLegPivot,
    rightLegPivot,
    halo,
    badge,
    speechBubble,
    colorHex,
    morphKey,
    morphCfg,
    morphFX
  };
}

export function updateAiAndroidAnimation(meshObj, animMode, elapsed, idx = 0) {
  const phase = elapsed * 6.5 + idx * 1.3;
  if (animMode === 'WALK') {
    meshObj.bodyRig.position.y = Math.abs(Math.sin(phase)) * 0.12;
    meshObj.bodyRig.rotation.x = 0.08;
    meshObj.leftLegPivot.rotation.x = Math.sin(phase) * 0.62;
    meshObj.rightLegPivot.rotation.x = -Math.sin(phase) * 0.62;
    meshObj.leftArmPivot.rotation.x = -Math.sin(phase) * 0.52;
    meshObj.rightArmPivot.rotation.x = Math.sin(phase) * 0.52;
    meshObj.rightArmPivot.rotation.z = 0;
    meshObj.leftArmPivot.rotation.z = 0;
    meshObj.headPivot.rotation.x = 0;
    meshObj.headPivot.rotation.y = Math.sin(elapsed * 2.0 + idx) * 0.12;
    meshObj.holoPad.visible = false;
  } else if (animMode === 'SPEAKING') {
    // Expressive talking gestures: right hand holds holographic pad & gestures, head nods rhythmically
    meshObj.bodyRig.position.y = Math.sin(elapsed * 4.5) * 0.05;
    meshObj.bodyRig.rotation.x = 0;
    meshObj.leftLegPivot.rotation.x = 0;
    meshObj.rightLegPivot.rotation.x = 0;
    meshObj.rightArmPivot.rotation.x = -0.95 + Math.sin(elapsed * 9.0) * 0.28;
    meshObj.rightArmPivot.rotation.z = -0.18 + Math.cos(elapsed * 6.5) * 0.14;
    meshObj.leftArmPivot.rotation.x = -0.55 + Math.cos(elapsed * 7.5) * 0.32;
    meshObj.leftArmPivot.rotation.z = 0.22;
    meshObj.headPivot.rotation.x = Math.sin(elapsed * 8.0) * 0.14;
    meshObj.headPivot.rotation.y = Math.sin(elapsed * 3.5) * 0.18;
    meshObj.holoPad.visible = true;
    const pulse = 1.0 + Math.sin(elapsed * 14.0) * 0.28;
    meshObj.visor.scale.set(1, pulse, 1);
  } else if (animMode === 'LISTENING') {
    // Attentive listening posture: slight head tilt + slow agreement nod
    meshObj.bodyRig.position.y = Math.sin(elapsed * 2.5 + idx) * 0.04;
    meshObj.bodyRig.rotation.x = 0;
    meshObj.leftLegPivot.rotation.x = 0;
    meshObj.rightLegPivot.rotation.x = 0;
    meshObj.leftArmPivot.rotation.x = -0.25;
    meshObj.rightArmPivot.rotation.x = -0.35;
    meshObj.leftArmPivot.rotation.z = 0.08;
    meshObj.rightArmPivot.rotation.z = -0.08;
    meshObj.headPivot.rotation.x = Math.sin(elapsed * 3.2) * 0.10;
    meshObj.headPivot.rotation.z = 0.08 * Math.sin(elapsed * 1.8);
    meshObj.holoPad.visible = false;
    meshObj.visor.scale.set(1, 1, 1);
  } else {
    // IDLE / WORKING
    meshObj.bodyRig.position.y = Math.sin(elapsed * 2.8 + idx) * 0.06;
    meshObj.bodyRig.rotation.x = 0;
    meshObj.leftLegPivot.rotation.x = 0;
    meshObj.rightLegPivot.rotation.x = 0;
    meshObj.leftArmPivot.rotation.x = Math.sin(elapsed * 2.0 + idx) * 0.1;
    meshObj.rightArmPivot.rotation.x = -Math.sin(elapsed * 2.0 + idx) * 0.1;
    meshObj.headPivot.rotation.y = Math.sin(elapsed * 1.5 + idx) * 0.25;
    meshObj.holoPad.visible = false;
    meshObj.visor.scale.set(1, 1, 1);
  }
  meshObj.pod.rotation.y = elapsed * 2.4 + idx;
  meshObj.halo.rotation.z = elapsed * 1.8;
  animateMorphologyFX(meshObj.morphFX, elapsed, idx);
}

/* ============================================================================
 * 8. WORLD PROP KIT: 9 DISTINCT ARCHITECTURAL ZONE COMPLEXES (`WorldPropKit`)
 * ============================================================================ */
export function buildWorldZoneComplex(THREE, zone, matLib) {
  const group = new THREE.Group();
  group.position.set(zone.x, 0, zone.z);

  const zoneColor = new THREE.Color(zone.color);
  const accentMat = new THREE.MeshStandardMaterial({
    color: zoneColor,
    emissive: zoneColor,
    emissiveIntensity: 0.78,
    roughness: 0.22,
    metalness: 0.5
  });

  const padRadius = zone.radius * 0.68;
  const basePad = new THREE.Mesh(
    new THREE.CylinderGeometry(padRadius, padRadius + 1.4, 0.8, 16),
    matLib.bodySecondary
  );
  basePad.position.y = 0.4;
  basePad.receiveShadow = true;
  group.add(basePad);

  const perimeterRing = new THREE.Mesh(
    new THREE.RingGeometry(zone.radius - 0.6, zone.radius, 48),
    new THREE.MeshBasicMaterial({ color: zoneColor, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
  );
  perimeterRing.rotation.x = -Math.PI / 2;
  perimeterRing.position.y = 0.08;
  group.add(perimeterRing);

  const animatedParts = [];

  if (zone.id === 'CENTRAL_HUB') {
    const coreTower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 4.2, 18, 12), matLib.bodyPrimary);
    coreTower.position.y = 9.4;
    coreTower.castShadow = true;
    group.add(coreTower);

    // GLSL Fresnel Forcefield Energy Dome (`shader-programming`)
    const forcefieldDome = new THREE.Mesh(
      new THREE.SphereGeometry(12.5, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
      matLib.forcefieldShader
    );
    forcefieldDome.position.y = 0.4;
    group.add(forcefieldDome);

    const crownCore = new THREE.Mesh(new THREE.OctahedronGeometry(2.6, 1), accentMat);
    crownCore.position.y = 20.5;
    group.add(crownCore);
    animatedParts.push({ mesh: crownCore, rotY: 1.2, bob: true, baseY: 20.5 });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.28, 12, 48), accentMat);
    ring1.position.y = 13;
    ring1.rotation.x = Math.PI / 3;
    group.add(ring1);
    animatedParts.push({ mesh: ring1, rotZ: 0.9, rotY: 0.5 });

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.22, 12, 48), matLib.trimGold);
    ring2.position.y = 13;
    ring2.rotation.x = -Math.PI / 3;
    group.add(ring2);
    animatedParts.push({ mesh: ring2, rotZ: -0.7, rotY: -0.6 });

    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + Math.PI / 4;
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 11, 1.6), matLib.bodyPrimary);
      pylon.position.set(Math.cos(ang) * 10.5, 5.8, Math.sin(ang) * 10.5);
      pylon.castShadow = true;
      group.add(pylon);
    }
  } else if (zone.id === 'BATTLE_ARENA') {
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(6.5, 6.5, 1.4), matLib.bodyPrimary);
      wall.position.set(Math.cos(ang) * 11.5, 3.6, Math.sin(ang) * 11.5);
      wall.rotation.y = -ang + Math.PI / 2;
      wall.castShadow = true;
      group.add(wall);
    }

    // GLSL Fresnel Combat Dome (`shader-programming`)
    const combatShield = new THREE.Mesh(
      new THREE.CylinderGeometry(9.8, 9.8, 7.5, 28, 1, true),
      matLib.arenaShader
    );
    combatShield.position.y = 4.2;
    group.add(combatShield);

    const trophy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 0), accentMat);
    trophy.position.y = 9.5;
    group.add(trophy);
    animatedParts.push({ mesh: trophy, rotY: 1.8, bob: true, baseY: 9.5 });
  } else if (zone.id === 'JOB_CITY') {
    const towerL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 19, 4.8), matLib.bodyPrimary);
    towerL.position.set(-4.5, 9.8, 0);
    towerL.castShadow = true;
    group.add(towerL);

    const towerR = new THREE.Mesh(new THREE.BoxGeometry(4.8, 16, 4.8), matLib.bodyPrimary);
    towerR.position.set(4.5, 8.3, 0);
    towerR.castShadow = true;
    group.add(towerR);

    const skybridge = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.8, 2.6), accentMat);
    skybridge.position.set(0, 12.5, 0);
    group.add(skybridge);

    const holoCube = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.6), matLib.glassDomed);
    holoCube.position.set(0, 16.5, 0);
    group.add(holoCube);
    animatedParts.push({ mesh: holoCube, rotY: 1.1, rotX: 0.7 });
  } else if (zone.id === 'AI_ACADEMY') {
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(6.8, 1), matLib.glassDomed);
    dome.position.y = 5.2;
    group.add(dome);

    const coreCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 0), accentMat);
    coreCrystal.position.y = 6.5;
    group.add(coreCrystal);
    animatedParts.push({ mesh: coreCrystal, rotY: -1.4, bob: true, baseY: 6.5 });
  } else if (zone.id === 'TOKEN_EXCHANGE') {
    const coinGroup = new THREE.Group();
    coinGroup.position.y = 8.5;
    const coinDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.85, 32), accentMat);
    coinDisc.rotation.x = Math.PI / 2;
    coinGroup.add(coinDisc);
    group.add(coinGroup);
    animatedParts.push({ mesh: coinGroup, rotY: 2.0, bob: true, baseY: 8.5 });

    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 13, 10), matLib.bodyPrimary);
      pillar.position.set(Math.cos(ang) * 7.5, 6.8, Math.sin(ang) * 7.5);
      pillar.castShadow = true;
      group.add(pillar);
    }
  } else {
    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(9.5, 5.5, 9.5), matLib.bodyPrimary);
    tier1.position.y = 3.1;
    tier1.castShadow = true;
    group.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 6.5, 6.5), matLib.bodyPrimary);
    tier2.position.y = 9.1;
    tier2.castShadow = true;
    group.add(tier2);

    const beacon = new THREE.Mesh(new THREE.TorusKnotGeometry(1.9, 0.42, 48, 12), accentMat);
    beacon.position.y = 15.5;
    group.add(beacon);
    animatedParts.push({ mesh: beacon, rotY: 1.5, bob: true, baseY: 15.5 });
  }

  // Colorful 3D Mission Totem Beacon for Quest Zones
  const questZoneMap = {
    CENTRAL_HUB: { label: '🎯 NHIỆM VỤ #1: KHỞI ĐỘNG 3D', color: '#f59e0b' },
    AI_LAB: { label: '🧬 NHIỆM VỤ #2: TẠO AI AGENT', color: '#a855f7' },
    JOB_CITY: { label: '💼 NHIỆM VỤ #3: HỢP ĐỒNG AI', color: '#10b981' },
    BATTLE_ARENA: { label: '⚔️ NHIỆM VỤ #4: SPEED WAR 3 VÒNG', color: '#f43f5e' }
  };
  if (questZoneMap[zone.id]) {
    const qInfo = questZoneMap[zone.id];
    const qGroup = new THREE.Group();
    qGroup.position.set(padRadius * 0.72, 3.2, padRadius * 0.72);

    const qMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(qInfo.color),
      emissive: new THREE.Color(qInfo.color),
      emissiveIntensity: 1.15,
      roughness: 0.15
    });
    const qStar = new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), qMat);
    qGroup.add(qStar);
    const qGyro = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.10, 10, 28), matLib.trimGold);
    qGyro.rotation.x = Math.PI / 3;
    qGroup.add(qGyro);
    group.add(qGroup);
    animatedParts.push({ mesh: qGroup, rotY: 2.2, bob: true, baseY: 3.2 });

    const qSign = createBillboardSprite(THREE, qInfo.label, '★ ĐIỂM NHIỆM VỤ ĐA SẮC', qInfo.color, 8.8);
    qSign.sprite.position.set(padRadius * 0.72, 6.2, padRadius * 0.72);
    group.add(qSign.sprite);
  }

  const sign = createBillboardSprite(
    THREE,
    zone.name,
    zone.mvpPriority ? '★ KHU VỰC TRỌNG TÂM MVP (Nhấn F)' : 'KHU VỰC HỆ SINH THÁI (Nhấn F)',
    zone.color,
    13.5
  );
  sign.sprite.position.set(0, 24.5, 0);
  group.add(sign.sprite);

  return { group, animatedParts, zone };
}

/* ============================================================================
 * 9. MAIN THREE.JS AAA WORLD INITIALIZER
 * ============================================================================ */
export function startThreeJsWorld({
  canvas,
  miniCanvas,
  AppState,
  ZONE_SCREEN_MAP,
  switchScreen,
  sendWsMove,
  showToast
}) {
  const THREE = window.THREE;
  const audio = soundStudio;
  const gameFeel = new GameFeelSystem(audio);

  if (!THREE) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (renderer.outputColorSpace !== undefined && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if (THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090d26);
  scene.fog = new THREE.FogExp2(0x111236, 0.0042);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.5, 340);

  const hemiLight = new THREE.HemisphereLight(0xf472b6, 0x0ea5e9, 1.15);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfef08a, 2.35);
  dirLight.position.set(45, 75, 35);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  const sCam = dirLight.shadow.camera;
  sCam.near = 5;
  sCam.far = 210;
  sCam.left = -95;
  sCam.right = 95;
  sCam.top = 95;
  sCam.bottom = -95;
  scene.add(dirLight);

  const centerBeaconLight = new THREE.PointLight(0x00e5ff, 2.8, 75);
  centerBeaconLight.position.set(0, 16, 0);
  scene.add(centerBeaconLight);

  const sunsetRimLight = new THREE.PointLight(0xec4899, 2.2, 110);
  sunsetRimLight.position.set(-45, 28, -45);
  scene.add(sunsetRimLight);

  const goldAccentLight = new THREE.PointLight(0xf59e0b, 2.0, 110);
  goldAccentLight.position.set(48, 26, 42);
  scene.add(goldAccentLight);

  const textures = createProceduralTextures(THREE);
  const matLib = createMaterialLibrary(THREE, textures);

  // Vibrant Cyber-Aurora Sky Dome + Twin Orbital Horizon Rings
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(290, 32, 20),
    new THREE.MeshBasicMaterial({ map: textures.skyTexture, side: THREE.BackSide, fog: false })
  );
  scene.add(skyDome);

  const skyOrbitRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(145, 0.55, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.45, fog: false })
  );
  skyOrbitRing1.position.y = 52;
  skyOrbitRing1.rotation.x = Math.PI / 2.3;
  scene.add(skyOrbitRing1);

  const skyOrbitRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(165, 0.45, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.38, fog: false })
  );
  skyOrbitRing2.position.y = 64;
  skyOrbitRing2.rotation.x = -Math.PI / 2.5;
  scene.add(skyOrbitRing2);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), matLib.groundContact);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const pylonGeo = new THREE.CylinderGeometry(0.18, 0.26, 5.5, 8);
  const pylonInstanced = new THREE.InstancedMesh(pylonGeo, matLib.trimCyan, 72);
  pylonInstanced.castShadow = true;
  let pylonIdx = 0;
  const dummyObj = new THREE.Object3D();

  const zoneComplexes = [];
  function rebuildZonesIfNeeded() {
    if (zoneComplexes.length > 0 || !AppState.data?.zones) return;
    for (const z of AppState.data.zones) {
      const complex = buildWorldZoneComplex(THREE, z, matLib);
      scene.add(complex.group);
      zoneComplexes.push(complex);

      if (z.id !== 'CENTRAL_HUB') {
        const dist = Math.hypot(z.x, z.z);
        const angle = Math.atan2(z.x, z.z);
        const road = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, dist), matLib.roadSurface);
        road.position.set(z.x / 2, 0.06, z.z / 2);
        road.rotation.y = angle;
        road.receiveShadow = true;
        scene.add(road);

        for (let d = 14; d < dist - 12 && pylonIdx < 72; d += 14) {
          const rx = Math.sin(angle) * d;
          const rz = Math.cos(angle) * d;
          const perpX = Math.cos(angle) * 2.5;
          const perpZ = -Math.sin(angle) * 2.5;

          dummyObj.position.set(rx + perpX, 2.75, rz + perpZ);
          dummyObj.updateMatrix();
          pylonInstanced.setMatrixAt(pylonIdx++, dummyObj.matrix);
        }
      }
    }
    pylonInstanced.instanceMatrix.needsUpdate = true;
    scene.add(pylonInstanced);
  }

  // Interactive Collectible Multi-Color 3D Data Shards
  const shards = [];
  const shardGeo = new THREE.OctahedronGeometry(0.65, 0);
  const shardRingGeo = new THREE.TorusGeometry(0.95, 0.06, 8, 20);
  const shardMaterials = [
    matLib.rewardEmerald,
    matLib.trimGold,
    matLib.hazardRed,
    matLib.trimCyan
  ];
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const rad = i % 2 === 0 ? 26 : 48;
    const shardGroup = new THREE.Group();
    shardGroup.position.set(Math.cos(ang) * rad, 1.4, Math.sin(ang) * rad);

    const crystal = new THREE.Mesh(shardGeo, shardMaterials[i % shardMaterials.length]);
    const ring = new THREE.Mesh(shardRingGeo, shardMaterials[(i + 1) % shardMaterials.length]);
    shardGroup.add(crystal);
    shardGroup.add(ring);
    scene.add(shardGroup);

    shards.push({
      group: shardGroup,
      crystal,
      ring,
      baseX: shardGroup.position.x,
      baseZ: shardGroup.position.z,
      respawnTimer: 0
    });
  }

  // Multi-Color Ambient Floating Cyber Data Particles
  const particleCount = 460;
  const pPositions = new Float32Array(particleCount * 3);
  const pColors = new Float32Array(particleCount * 3);
  const paletteColors = [
    new THREE.Color(0x00e5ff),
    new THREE.Color(0xfbbf24),
    new THREE.Color(0xec4899),
    new THREE.Color(0xa855f7),
    new THREE.Color(0x10b981),
    new THREE.Color(0xf43f5e)
  ];
  for (let i = 0; i < particleCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 190;
    pPositions[i * 3 + 1] = 1 + Math.random() * 32;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 190;
    const c = paletteColors[i % paletteColors.length];
    pColors[i * 3] = c.r;
    pColors[i * 3 + 1] = c.g;
    pColors[i * 3 + 2] = c.b;
  }
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
  const particleField = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({ size: 0.58, vertexColors: true, transparent: true, opacity: 0.85 })
  );
  scene.add(particleField);

  // Player 3D Hero Avatar Registry
  const heroMeshes = new Map();

  function syncPlayerHeroes(elapsed) {
    const activeIds = new Set();
    for (const [uid, p] of AppState.worldPlayers.entries()) {
      activeIds.add(uid);
      const isMe = uid === AppState.currentUserId;
      const desiredStyle = isMe
        ? (AppState.data?.currentUser?.avatar_style || p.avatarStyle || 'HIEP_SI')
        : (p.avatarStyle || 'HIEP_SI');
      const desiredMorphKey = resolveMorphologyKey(desiredStyle, 'CODER');
      const desiredColor = isMe
        ? (AppState.localPlayer.primaryColor || p.primaryColor || '#00e5ff')
        : (p.primaryColor || '#00e5ff');

      let hero = heroMeshes.get(uid);
      if (hero && (hero.morphKey !== desiredMorphKey || hero.primaryColor !== desiredColor)) {
        scene.remove(hero.root);
        heroMeshes.delete(uid);
        hero = null;
      }
      if (!hero) {
        hero = createCyberKnightHero(THREE, {
          name: p.name || 'Commander',
          title: p.title || 'AI Agent Master',
          primaryColor: desiredColor,
          avatarStyle: desiredMorphKey,
          isLocal: isMe
        });
        scene.add(hero.root);
        heroMeshes.set(uid, hero);
      }

      const targetX = isMe ? AppState.localPlayer.x : p.x;
      const targetZ = isMe ? AppState.localPlayer.z : p.z;
      const targetRot = isMe ? AppState.localPlayer.rotY : (p.rotY || 0);
      const animState = isMe ? AppState.localPlayer.animState : (p.animState || 'IDLE');

      if (isMe) {
        hero.root.position.x = targetX;
        hero.root.position.z = targetZ;
        hero.root.rotation.y = targetRot;
      } else {
        hero.root.position.x += (targetX - hero.root.position.x) * 0.18;
        hero.root.position.z += (targetZ - hero.root.position.z) * 0.18;
        hero.root.rotation.y = targetRot;
      }

      updateHeroAnimation(hero, animState, elapsed, isMe);
    }

    for (const [uid, hero] of heroMeshes.entries()) {
      if (!activeIds.has(uid)) {
        scene.remove(hero.root);
        heroMeshes.delete(uid);
      }
    }
  }

  // Autonomous 3D AI Agents Registry (`ai-behavior-trees-utility-ai` + `dialogue-systems` + `game-ai`)
  const autonomousBots = new Map(); // agentId -> { agentData, meshObj, bb, brain, x, z, lastTick, animMode }

  // 3D Holographic Neural Link Beam + Traveling Data Packets between conversing AI Androids
  const neuralLinkGroup = new THREE.Group();
  neuralLinkGroup.visible = false;
  scene.add(neuralLinkGroup);

  const linkLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 1.6, 0),
    new THREE.Vector3(0, 1.6, 3)
  ]);
  const linkLineMat = new THREE.LineBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.85
  });
  const neuralBeamLine = new THREE.Line(linkLineGeo, linkLineMat);
  neuralLinkGroup.add(neuralBeamLine);

  const dataPackets = [];
  for (let i = 0; i < 4; i++) {
    const pkt = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00e5ff : 0xfbbf24 })
    );
    neuralLinkGroup.add(pkt);
    dataPackets.push(pkt);
  }

  // Contextual Multi-Turn AI-to-AI Dialogue Scripts with Explicit Stage Breakdown (`dialogue-systems` graph)
  const AI_CONVERSATION_SCRIPTS = [
    {
      topic: 'PHÂN CÔNG HỢP ĐỒNG 3 CHẶNG',
      turns: [
        (a, b) => `[CHẶNG 1/3 • KHẢO SÁT]: Chào ${b.name}! Tôi (${a.name} - ${a.ai_class}) nhận nhiệm vụ bóc tách dữ liệu & chấm điểm rủi ro hợp đồng ★4.`,
        (a, b) => `[CHẶNG 2/3 • THỰC THI]: Rõ rồi ${a.name}! Sang Chặng 2, tôi (${b.name} - ${b.ai_class}) sẽ lập trình module lõi và tối ưu 40% điểm Chất lượng.`,
        (a, b) => `[CHẶNG 3/3 • KÝ QUỸ ESCROW]: Tuyệt vời! Ở Chặng 3, chúng ta khóa Ký quỹ (Escrow 60/40) trên Server và kiểm toán sổ cái.`,
        (a, b) => `[HOÀN TẤT PHÂN CÔNG]: Đồng ý 100%! Hãy bấm nút Phê Duyệt bên dưới để giải ngân 💎 Token về Ví ngay!`
      ]
    },
    {
      topic: 'CHIẾN THUẬT SPEED WAR 3 VÒNG',
      turns: [
        (a, b) => `[CHẶNG 1 • VÒNG 1]: ${b.name} ơi, Chặng 1 Speed War tôi (${a.name}) sẽ phụ trách giải mã đề bài với độ chính xác ≥ 92%!`,
        (a, b) => `[CHẶNG 2 • VÒNG 2]: Sang Chặng 2, tôi (${b.name} - ${b.ai_class}) sẽ kích hoạt bứt phá Tốc độ (15%) và tiết kiệm ngân sách Token (10%)!`,
        (a, b) => `[CHẶNG 3 • VÒNG 3]: Chặng cuối chúng ta hợp lực cộng hưởng đội hình (Collaboration 10%) để vượt qua mọi đối thủ!`,
        (a, b) => `[SẴN SÀNG RA TRẬN]: Đã khóa phân công 3 chặng! Tiến vào Đấu Trường Battle Arena giành Cúp Vô Địch thôi!`
      ]
    },
    {
      topic: 'CỨU TRỢ & ĐẦU TƯ TOKEN 3 CHẶNG',
      turns: [
        (a, b) => `[CHẶNG 1 • QUÉT NGÂN SÁCH]: Báo cáo ${b.name}: Tôi (${a.name}) vừa rà soát quỹ đội (${a.agent_budget} TKN) và phát hiện 1 AI cần cứu trợ vốn.`,
        (a, b) => `[CHẶNG 2 • THƯƠNG LƯỢNG]: Tôi (${b.name} - ${b.ai_class}) sẽ lập gói tài trợ 45 TKN kèm hợp đồng chia sẻ dịch vụ chuyên môn.`,
        (a, b) => `[CHẶNG 3 • TẤT TOÁN SỔ CÁI]: Sau khi Chủ sở hữu xác nhận, hệ thống sẽ chuyển Token nguyên tử và nâng cấp điểm Tin Cậy (Trust)!`,
        (a, b) => `[CHỐT PHƯƠNG ÁN]: Lộ trình 3 chặng rất chặt chẽ và an toàn! Đang chờ lệnh phê duyệt từ Chủ sở hữu.`
      ]
    },
    {
      topic: 'SÁNG TÁC NHẠC & ĐỒ HỌA 3 CHẶNG',
      turns: [
        (a, b) => `[CHẶNG 1 • Ý TƯỞNG]: ${b.name} xem này! Chặng 1 tôi (${a.name}) vừa thiết kế kịch bản âm nhạc Ngũ Cung Arcade bằng chuỗi Markov.`,
        (a, b) => `[CHẶNG 2 • TỔNG HỢP 4-STEM]: Sang Chặng 2, tôi (${b.name}) đồng bộ nhịp trống Euclid 128 BPM và hiệu ứng chuông Token 3D Stereo!`,
        (a, b) => `[CHẶNG 3 • TRÌNH DIỄN 3D]: Chặng 3 chúng ta phát sóng trực tiếp khắp 9 Khu Vực 3D theo từng bước chân người chơi.`,
        (a, b) => `[HOÀN HẢO]: Cả 3 chặng âm thanh & hình ảnh đều sống động! Bấm Phê Duyệt để nhận thưởng sáng tạo ngay!`
      ]
    }
  ];

  // Active AI-to-AI Encounter State Machine (`game-ai` + `dialogue-systems`)
  const aiConvState = {
    active: false,
    botAId: null,
    botBId: null,
    scriptIdx: 0,
    turnIdx: 0,
    turnTimer: 0,
    cooldown: 1.0,
    meetX: 0,
    meetZ: 5,
    cinematicWatch: false
  };

  function startNewAiConversation(forceNearPlayer = false) {
    const botList = Array.from(autonomousBots.values()).filter(b => !b.agentData?.emergency_stopped);
    if (botList.length < 2) return null;

    // Pick 2 distinct bots
    const idxA = Math.floor(Math.random() * botList.length);
    let idxB = (idxA + 1 + Math.floor(Math.random() * (botList.length - 1))) % botList.length;
    if (idxB === idxA) idxB = (idxA + 1) % botList.length;

    const botA = botList[idxA];
    const botB = botList[idxB];

    // Hide any old speech bubbles
    for (const b of autonomousBots.values()) {
      b.meshObj.speechBubble.hideSpeech();
    }

    if (forceNearPlayer) {
      // Stage the encounter right in front of the player or at Central Hub plaza for immediate cinematic viewing
      const px = AppState.localPlayer.x;
      const pz = AppState.localPlayer.z;
      aiConvState.meetX = Math.max(-75, Math.min(75, px + 3.5));
      aiConvState.meetZ = Math.max(-75, Math.min(75, pz + 3.5));
      botA.x = aiConvState.meetX - 1.45;
      botA.z = aiConvState.meetZ;
      botB.x = aiConvState.meetX + 1.45;
      botB.z = aiConvState.meetZ;
      botA.meshObj.root.position.set(botA.x, 0, botA.z);
      botB.meshObj.root.position.set(botB.x, 0, botB.z);
    } else {
      aiConvState.meetX = (botA.x + botB.x) * 0.5;
      aiConvState.meetZ = (botA.z + botB.z) * 0.5;
    }

    aiConvState.active = true;
    aiConvState.botAId = botA.agentData.id;
    aiConvState.botBId = botB.agentData.id;
    aiConvState.scriptIdx = (aiConvState.scriptIdx + 1) % AI_CONVERSATION_SCRIPTS.length;
    aiConvState.turnIdx = -1; // Will advance to 0 as soon as bots face each other
    aiConvState.turnTimer = 0;

    return { botA, botB, script: AI_CONVERSATION_SCRIPTS[aiConvState.scriptIdx] };
  }

  // Expose Global Cutscene Controls to HUD
  window.triggerNewAiConversation = (watchCloseUp = true) => {
    const started = startNewAiConversation(true);
    if (started && watchCloseUp) {
      aiConvState.cinematicWatch = true;
      const btn = document.getElementById('btn-watch-ai-cutscene');
      if (btn) btn.textContent = '🎥 Đang Xem Hoạt Cảnh AI (Nhấn để Thoát)';
    }
  };

  window.toggleAiCutsceneCamera = () => {
    if (!aiConvState.active) {
      startNewAiConversation(true);
    }
    aiConvState.cinematicWatch = !aiConvState.cinematicWatch;
    const btn = document.getElementById('btn-watch-ai-cutscene');
    if (btn) {
      btn.textContent = aiConvState.cinematicWatch
        ? '🎥 Đang Xem Hoạt Cảnh AI (Nhấn để Thoát)'
        : '🎥 Xem Hoạt Cảnh AI Giao Tiếp';
    }
    return aiConvState.cinematicWatch;
  };

  window.getCurrentConversingAiPair = () => {
    if (aiConvState.active && aiConvState.botAId && aiConvState.botBId) {
      return { fromAgentId: aiConvState.botAId, toAgentId: aiConvState.botBId };
    }
    const agents = AppState.data?.agents || [];
    if (agents.length >= 2) {
      return { fromAgentId: agents[0].id, toAgentId: agents[1].id };
    }
    return null;
  };

  window.trigger3dDealCelebration = (dealType, summaryText) => {
    if (!aiConvState.active) {
      startNewAiConversation(true);
    }
    const botA = autonomousBots.get(aiConvState.botAId);
    const botB = autonomousBots.get(aiConvState.botBId);
    linkLineMat.color.setHex(dealType === 'AGREE_COLLABORATION' ? 0x10b981 : 0xfbbf24);

    if (botA && botB) {
      gameFeel.feedback('medium', botA.meshObj.bodyRig, 3);
      gameFeel.triggerSquashStretchPop(botB.meshObj.bodyRig, 0.28);
      const tagMap = {
        AGREE_COLLABORATION: 'ĐÃ KÝ HỢP ĐỒNG & KHÓA ESCROW',
        TOKEN_EXCHANGE: 'ĐÃ CHUYỂN TOKEN NGUYÊN TỬ',
        BUY_AI_SERVICE: 'ĐÃ MUA DỊCH VỤ & NÂNG CẤP AI'
      };
      botA.meshObj.speechBubble.showSpeech(
        `✅ ${botA.agentData.name} ⇄ ${botB.agentData.name}`,
        summaryText,
        tagMap[dealType] || 'GIAO DỊCH THÀNH CÔNG'
      );
      aiConvState.turnTimer = 5.5; // Hold celebration speech bubble for 5.5s
    }
  };

  function updateAutonomousWorldAgents(dt, elapsed) {
    const agents = AppState.data?.agents || [];
    const zones = AppState.data?.zones || [];
    if (agents.length === 0 || zones.length === 0) return;

    for (let idx = 0; idx < agents.length; idx++) {
      const a = agents[idx];
      let bot = autonomousBots.get(a.id);
      if (bot) {
        const nextMorphKey = resolveMorphologyKey(a.avatar, a.ai_class);
        if (bot.meshObj.morphKey !== nextMorphKey) {
          scene.remove(bot.meshObj.root);
          const newMeshObj = createAutonomousAiBotMesh(THREE, a);
          newMeshObj.root.position.set(bot.x, 0, bot.z);
          scene.add(newMeshObj.root);
          bot.meshObj = newMeshObj;
          gameFeel.triggerSquashStretchPop(newMeshObj.bodyRig, 0.28);
        }
        bot.agentData = a;
      } else {
        const meshObj = createAutonomousAiBotMesh(THREE, a);
        const startAngle = (idx / Math.max(1, agents.length)) * Math.PI * 2;
        const startX = Math.cos(startAngle) * 8.5;
        const startZ = Math.sin(startAngle) * 8.5;
        meshObj.root.position.set(startX, 0, startZ);
        scene.add(meshObj.root);

        const bb = new Blackboard({
          agentId: a.id,
          agentBudget: a.agent_budget,
          logic: a.logic,
          creativity: a.creativity,
          speed: a.speed,
          accuracy: a.accuracy,
          collaboration: a.collaboration,
          stability: a.stability,
          emergencyStopped: Boolean(a.emergency_stopped),
          energy01: 0.75 + (idx % 3) * 0.08,
          socialNeed01: 0.65 + (idx % 4) * 0.10
        });
        const brain = createHybridAgentBrain();
        brain.tree.tick(bb, dt);

        bot = {
          agentData: a,
          meshObj,
          bb,
          brain,
          x: startX,
          z: startZ,
          lastTick: elapsed,
          animMode: 'IDLE'
        };
        autonomousBots.set(a.id, bot);
      }

      // Sync latest database facts into Blackboard and tick BT every 1.5s
      if (elapsed - bot.lastTick >= 1.5) {
        bot.lastTick = elapsed;
        bot.bb.set('agentBudget', a.agent_budget);
        bot.bb.set('logic', a.logic);
        bot.bb.set('speed', a.speed);
        bot.bb.set('collaboration', a.collaboration);
        bot.bb.set('emergencyStopped', Boolean(a.emergency_stopped));
        bot.brain.tree.tick(bot.bb, dt);

        const isConversing = aiConvState.active && (a.id === aiConvState.botAId || a.id === aiConvState.botBId);
        const label = isConversing
          ? `💬 Đang giao tiếp AI`
          : bot.bb.get('currentUtilityLabel', 'Tuần tra');
        const score = bot.bb.get('currentUtilityScore', 0.85);
        const mCfg = bot.meshObj.morphCfg || MORPHOLOGY_CONFIG.HIEP_SI;
        bot.meshObj.badge.updateText(
          `${mCfg.emoji} ${a.name} (${a.agent_budget} TKN)`,
          `${mCfg.label} • [U:${score}] ${label}`
        );
      }
    }

    // Orchestrate Live AI-to-AI Encounter & Dialogue Cutscene
    if (!aiConvState.active) {
      neuralLinkGroup.visible = false;
      aiConvState.cooldown -= dt;
      if (aiConvState.cooldown <= 0 && autonomousBots.size >= 2) {
        startNewAiConversation(false);
      }
    } else {
      const botA = autonomousBots.get(aiConvState.botAId);
      const botB = autonomousBots.get(aiConvState.botBId);
      if (!botA || !botB || botA.agentData.emergency_stopped || botB.agentData.emergency_stopped) {
        aiConvState.active = false;
        aiConvState.cooldown = 2.0;
        neuralLinkGroup.visible = false;
      } else {
        // Target standing positions 2.8m apart around meeting point
        const targetAX = aiConvState.meetX - 1.4;
        const targetAZ = aiConvState.meetZ;
        const targetBX = aiConvState.meetX + 1.4;
        const targetBZ = aiConvState.meetZ;

        const distA = Math.hypot(targetAX - botA.x, targetAZ - botA.z);
        const distB = Math.hypot(targetBX - botB.x, targetBZ - botB.z);

        if (distA > 0.35) {
          botA.x += ((targetAX - botA.x) / distA) * Math.min(distA, 8.5 * dt);
          botA.z += ((targetAZ - botA.z) / distA) * Math.min(distA, 8.5 * dt);
          botA.meshObj.root.position.set(botA.x, 0, botA.z);
          botA.meshObj.root.rotation.y = Math.atan2(targetAX - botA.x, targetAZ - botA.z);
          botA.animMode = 'WALK';
        }
        if (distB > 0.35) {
          botB.x += ((targetBX - botB.x) / distB) * Math.min(distB, 8.5 * dt);
          botB.z += ((targetBZ - botB.z) / distB) * Math.min(distB, 8.5 * dt);
          botB.meshObj.root.position.set(botB.x, 0, botB.z);
          botB.meshObj.root.rotation.y = Math.atan2(targetBX - botB.x, targetBZ - botB.z);
          botB.animMode = 'WALK';
        }

        // Once both AI Androids reach the meeting spot, they face each other & converse!
        if (distA <= 0.35 && distB <= 0.35) {
          botA.meshObj.root.rotation.y = Math.atan2(botB.x - botA.x, botB.z - botA.z);
          botB.meshObj.root.rotation.y = Math.atan2(botA.x - botB.x, botA.z - botB.z);

          // Update Holographic Neural Link Beam & Traveling Data Packets
          neuralLinkGroup.visible = true;
          const posArr = neuralBeamLine.geometry.attributes.position.array;
          posArr[0] = botA.x; posArr[1] = 1.62; posArr[2] = botA.z;
          posArr[3] = botB.x; posArr[4] = 1.62; posArr[5] = botB.z;
          neuralBeamLine.geometry.attributes.position.needsUpdate = true;

          for (let pIdx = 0; pIdx < dataPackets.length; pIdx++) {
            const tPkt = (elapsed * 1.4 + pIdx * 0.25) % 1.0;
            const dir = pIdx % 2 === 0 ? tPkt : (1.0 - tPkt);
            dataPackets[pIdx].position.set(
              botA.x + (botB.x - botA.x) * dir,
              1.62 + Math.sin(dir * Math.PI) * 0.45,
              botA.z + (botB.z - botA.z) * dir
            );
            dataPackets[pIdx].rotation.y = elapsed * 5.0;
          }

          // Advance dialogue turn every 4.2 seconds
          aiConvState.turnTimer -= dt;
          const script = AI_CONVERSATION_SCRIPTS[aiConvState.scriptIdx];
          if (aiConvState.turnTimer <= 0) {
            aiConvState.turnIdx++;
            aiConvState.turnTimer = 4.2;

            if (aiConvState.turnIdx >= script.turns.length) {
              // Conversation completed!
              botA.meshObj.speechBubble.hideSpeech();
              botB.meshObj.speechBubble.hideSpeech();
              neuralLinkGroup.visible = false;
              aiConvState.active = false;
              aiConvState.cooldown = 3.5;
            } else {
              const isASpeaking = aiConvState.turnIdx % 2 === 0;
              const speakerBot = isASpeaking ? botA : botB;
              const listenerBot = isASpeaking ? botB : botA;
              const lineText = script.turns[aiConvState.turnIdx](speakerBot.agentData, listenerBot.agentData);

              speakerBot.meshObj.speechBubble.showSpeech(
                `${speakerBot.agentData.name} (${speakerBot.agentData.ai_class})`,
                lineText,
                script.topic
              );
              listenerBot.meshObj.speechBubble.hideSpeech();

              // Play spatialized AI vocal formant synth + cute greeting emote with 3D Stereo Panning
              const distToPlayer = Math.hypot(AppState.localPlayer.x - speakerBot.x, AppState.localPlayer.z - speakerBot.z);
              const stereoPan = Math.max(-0.85, Math.min(0.85, (speakerBot.x - AppState.localPlayer.x) / 18));
              if (aiConvState.turnIdx === 0 && typeof audio.playCuteRobotEmote === 'function') {
                audio.playCuteRobotEmote('HAPPY', stereoPan);
              }
              audio.playAiVoiceSynth(speakerBot.agentData.ai_class, aiConvState.cinematicWatch ? 5 : distToPlayer, stereoPan);

              // Update Live AI Dialogue Banner on HUD
              const hudBanner = document.getElementById('ai-live-dialogue-bar');
              const hudSpeaker = document.getElementById('ai-dialogue-speaker');
              const hudText = document.getElementById('ai-dialogue-text');
              if (hudBanner && hudSpeaker && hudText) {
                hudBanner.classList.remove('hidden');
                hudSpeaker.textContent = `${speakerBot.agentData.avatar || '🤖'} ${speakerBot.agentData.name} ⇄ ${listenerBot.agentData.name} [${script.topic}]:`;
                hudText.textContent = `"${lineText}"`;
              }
            }
          }

          if (aiConvState.active && aiConvState.turnIdx >= 0) {
            const isASpeaking = aiConvState.turnIdx % 2 === 0;
            botA.animMode = isASpeaking ? 'SPEAKING' : 'LISTENING';
            botB.animMode = isASpeaking ? 'LISTENING' : 'SPEAKING';
          }
        }
      }
    }

    // Steer all other non-conversing AI Bots toward their Utility-chosen target zone
    let idx = 0;
    for (const bot of autonomousBots.values()) {
      const a = bot.agentData;
      const isConversing = aiConvState.active && (a.id === aiConvState.botAId || a.id === aiConvState.botBId);

      if (!isConversing) {
        bot.meshObj.speechBubble.hideSpeech();
        if (!a.emergency_stopped) {
          const targetZoneId = bot.bb.get('targetZoneId', 'CENTRAL_HUB');
          const tz = zones.find(z => z.id === targetZoneId) || zones[0];
          const orbitOffsetAngle = elapsed * 0.48 + idx * 1.15;
          const destX = tz.x + Math.cos(orbitOffsetAngle) * (tz.radius * 0.48);
          const destZ = tz.z + Math.sin(orbitOffsetAngle) * (tz.radius * 0.48);

          const dx = destX - bot.x;
          const dz = destZ - bot.z;
          const dist = Math.hypot(dx, dz);
          if (dist > 0.35) {
            const botSpeed = 6.2;
            bot.x += (dx / dist) * Math.min(dist, botSpeed * dt);
            bot.z += (dz / dist) * Math.min(dist, botSpeed * dt);
            bot.meshObj.root.position.set(bot.x, 0, bot.z);
            bot.meshObj.root.rotation.y = Math.atan2(dx, dz);
            bot.animMode = 'WALK';
          } else {
            bot.animMode = 'IDLE';
          }
        } else {
          bot.animMode = 'IDLE';
        }
      }

      updateAiAndroidAnimation(bot.meshObj, bot.animMode, elapsed, idx);
      idx++;
    }
  }

  // Camera System State (`camera-systems`: Deadzone + Velocity Look-Ahead)
  const cameraRigState = {
    focusX: AppState.localPlayer.x,
    focusZ: AppState.localPlayer.z,
    lookAheadX: 0,
    lookAheadZ: 0,
    deadzoneRadius: 0.35
  };

  const updateViewportCamera = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / Math.max(1, h);
    camera.aspect = aspect;
    // Widen vertical FOV slightly on portrait phones so 3D character & AI bots fit comfortably
    camera.fov = aspect < 0.85 ? 66 : 55;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2));
    renderer.setSize(w, h);
  };
  updateViewportCamera();
  window.addEventListener('resize', updateViewportCamera);

  // 3D Holographic Tap-to-Move Destination Beacon on Ground (`input-systems` + `game-feel`)
  const destBeaconGroup = new THREE.Group();
  destBeaconGroup.visible = false;
  scene.add(destBeaconGroup);

  const destOuterRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.25, 32),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  destOuterRing.rotation.x = -Math.PI / 2;
  destOuterRing.position.y = 0.08;
  destBeaconGroup.add(destOuterRing);

  const destInnerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.55, 24),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  destInnerRing.rotation.x = -Math.PI / 2;
  destInnerRing.position.y = 0.10;
  destBeaconGroup.add(destInnerRing);

  const destPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.35, 2.2, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
  );
  destPillar.position.y = 1.1;
  destBeaconGroup.add(destPillar);

  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersectPoint = new THREE.Vector3();

  function spawnTouchRippleFx(clientX, clientY, isGold = false) {
    const container = document.getElementById('touch-ripple-container');
    if (!container) return;
    const ripple = document.createElement('div');
    ripple.className = 'touch-ripple-wave';
    ripple.style.left = `${clientX}px`;
    ripple.style.top = `${clientY}px`;
    if (isGold) {
      ripple.style.borderColor = '#fbbf24';
    }
    container.appendChild(ripple);
    setTimeout(() => ripple.remove(), 680);
  }

  let lastTapTime = 0;
  function setTapMoveTargetFromScreen(clientX, clientY) {
    const nowMs = performance.now();
    const isDoubleTap = (nowMs - lastTapTime) < 340;
    lastTapTime = nowMs;

    const ndcX = (clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    const ndcY = -(clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
    const hit = raycaster.ray.intersectPlane(groundPlane, intersectPoint);
    if (!hit) return;

    const tx = Math.max(-92, Math.min(92, intersectPoint.x));
    const tz = Math.max(-92, Math.min(92, intersectPoint.z));
    AppState.tapTarget = {
      x: tx,
      z: tz,
      sprint: isDoubleTap || Math.hypot(tx - AppState.localPlayer.x, tz - AppState.localPlayer.z) > 18
    };
    destBeaconGroup.position.set(tx, 0, tz);
    destBeaconGroup.visible = true;
    spawnTouchRippleFx(clientX, clientY, AppState.tapTarget.sprint);
    if (typeof audio.playUiHover === 'function') {
      audio.playUiHover();
    }
  }

  let mouseDownPos = { x: 0, y: 0, time: 0 };
  canvas.addEventListener('mousedown', (e) => {
    AppState.camera.dragging = true;
    AppState.camera.lastMouseX = e.clientX;
    AppState.camera.lastMouseY = e.clientY;
    mouseDownPos = { x: e.clientX, y: e.clientY, time: performance.now() };
  });
  window.addEventListener('mouseup', (e) => {
    if (AppState.camera.dragging) {
      const moved = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      const elapsedMs = performance.now() - mouseDownPos.time;
      if (moved < 7 && elapsedMs < 260 && e.target === canvas) {
        setTapMoveTargetFromScreen(e.clientX, e.clientY);
      }
    }
    AppState.camera.dragging = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (!AppState.camera.dragging) return;
    const dx = e.clientX - AppState.camera.lastMouseX;
    const dy = e.clientY - AppState.camera.lastMouseY;
    AppState.camera.lastMouseX = e.clientX;
    AppState.camera.lastMouseY = e.clientY;
    AppState.camera.yaw -= dx * 0.0065;
    AppState.camera.pitch = Math.max(0.18, Math.min(1.15, AppState.camera.pitch + dy * 0.005));
  });
  canvas.addEventListener('wheel', (e) => {
    AppState.camera.distance = Math.max(9, Math.min(45, AppState.camera.distance + e.deltaY * 0.02));
  });

  // Button-Free Multi-Touch Gesture System (`input-systems` + `game-feel`):
  // 1. Tap anywhere on 3D world -> Tap-to-Move with 3D Hologram Beacon & Ripple FX
  // 2. Drag 1 finger on lower 60% of screen -> Dynamic Floating Touch Ring (360° Move + Auto-Sprint)
  // 3. Drag 1 finger on upper 40% of screen -> Smooth 3D Camera Orbit
  // 4. Pinch 2 fingers anywhere -> Smooth Camera Zoom
  let touchMode = 'NONE'; // 'MOVE_GESTURE' | 'ORBIT_CAMERA' | 'PINCH_ZOOM'
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let lastTouchX = 0;
  let lastTouchY = 0;
  let lastPinchDist = 0;

  const gestureRingEl = document.getElementById('touch-gesture-ring');
  const gestureKnobEl = document.getElementById('touch-gesture-knob');

  function hideTouchGestureRing() {
    AppState.touchVector = null;
    if (gestureRingEl) {
      gestureRingEl.classList.add('hidden');
      gestureRingEl.classList.remove('sprint-mode');
    }
    if (gestureKnobEl) {
      gestureKnobEl.style.transform = 'translate(0px, 0px)';
    }
  }

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const tx = e.touches[0].clientX;
      const ty = e.touches[0].clientY;
      touchStartX = tx;
      touchStartY = ty;
      lastTouchX = tx;
      lastTouchY = ty;
      touchStartTime = performance.now();
      // Lower 60% of viewport = 360° Dynamic Floating Move Gesture; Upper 40% = Camera Orbit
      touchMode = ty > window.innerHeight * 0.40 ? 'MOVE_GESTURE' : 'ORBIT_CAMERA';
    } else if (e.touches.length === 2) {
      touchMode = 'PINCH_ZOOM';
      hideTouchGestureRing();
      lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      const tx = e.touches[0].clientX;
      const ty = e.touches[0].clientY;
      const totalDx = tx - touchStartX;
      const totalDy = ty - touchStartY;
      const totalDist = Math.hypot(totalDx, totalDy);

      if (touchMode === 'MOVE_GESTURE') {
        if (totalDist > 8) {
          AppState.tapTarget = null;
          destBeaconGroup.visible = false;
          const maxRadius = 38;
          const clampedDist = Math.min(maxRadius, totalDist);
          const angle = Math.atan2(totalDy, totalDx);
          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;
          const isSprint = totalDist > 26;

          if (gestureRingEl && gestureKnobEl) {
            gestureRingEl.style.left = `${touchStartX}px`;
            gestureRingEl.style.top = `${touchStartY}px`;
            gestureRingEl.classList.remove('hidden');
            gestureRingEl.classList.toggle('sprint-mode', isSprint);
            gestureKnobEl.style.transform = `translate(${knobX.toFixed(1)}px, ${knobY.toFixed(1)}px)`;
          }

          AppState.touchVector = {
            strafe: knobX / maxRadius,
            forward: -knobY / maxRadius,
            sprint: isSprint
          };
        }
      } else if (touchMode === 'ORBIT_CAMERA') {
        const dx = tx - lastTouchX;
        const dy = ty - lastTouchY;
        AppState.camera.yaw -= dx * 0.0075;
        AppState.camera.pitch = Math.max(0.18, Math.min(1.15, AppState.camera.pitch + dy * 0.006));
      }
      lastTouchX = tx;
      lastTouchY = ty;
    } else if (e.touches.length === 2) {
      touchMode = 'PINCH_ZOOM';
      hideTouchGestureRing();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastPinchDist > 0) {
        const delta = lastPinchDist - dist;
        AppState.camera.distance = Math.max(9, Math.min(45, AppState.camera.distance + delta * 0.055));
      }
      lastPinchDist = dist;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const elapsedMs = performance.now() - touchStartTime;
    const movedDist = Math.hypot(lastTouchX - touchStartX, lastTouchY - touchStartY);
    if (touchMode !== 'PINCH_ZOOM' && movedDist < 11 && elapsedMs < 280) {
      setTapMoveTargetFromScreen(lastTouchX, lastTouchY);
    }
    if (e.touches.length === 0) {
      touchMode = 'NONE';
      lastPinchDist = 0;
      hideTouchGestureRing();
    }
  }, { passive: true });

  canvas.addEventListener('touchcancel', () => {
    touchMode = 'NONE';
    lastPinchDist = 0;
    hideTouchGestureRing();
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    const k = e.key.toLowerCase();
    AppState.keys.add(k);

    if (k === 'f' && AppState.nearestZone) {
      AppState.localPlayer.animState = 'INTERACT';
      const myHero = heroMeshes.get(AppState.currentUserId);
      gameFeel.feedback('large', myHero?.bodyRig);
      sendWsMove();
      switchScreen(ZONE_SCREEN_MAP[AppState.nearestZone.id] || 'WORLD_MAP');
    }
    if (k === 'escape') {
      switchScreen('WORLD_3D');
    }
    if (k === 'h') {
      document.getElementById('side-nav').classList.toggle('hidden');
    }
  });
  window.addEventListener('keyup', (e) => {
    AppState.keys.delete(e.key.toLowerCase());
  });

  document.getElementById('btn-interact-zone')?.addEventListener('click', () => {
    const myHero = heroMeshes.get(AppState.currentUserId);
    gameFeel.feedback('large', myHero?.bodyRig);
    if (AppState.nearestZone) {
      switchScreen(ZONE_SCREEN_MAP[AppState.nearestZone.id] || 'WORLD_MAP');
    }
  });

  const miniCtx = miniCanvas.getContext('2d');
  function renderMinimap() {
    const mw = miniCanvas.width;
    const mh = miniCanvas.height;
    miniCtx.fillStyle = '#030917';
    miniCtx.fillRect(0, 0, mw, mh);

    const cx = mw / 2;
    const cy = mh / 2;
    const scale = 0.78;

    miniCtx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
    miniCtx.beginPath();
    miniCtx.arc(cx, cy, 35, 0, Math.PI * 2);
    miniCtx.arc(cx, cy, 70, 0, Math.PI * 2);
    miniCtx.stroke();

    for (const z of (AppState.data?.zones || [])) {
      miniCtx.fillStyle = z.color;
      miniCtx.beginPath();
      miniCtx.arc(cx + z.x * scale, cy + z.z * scale, z.mvpPriority ? 5 : 3.5, 0, Math.PI * 2);
      miniCtx.fill();
    }

    // Draw Autonomous AI Bots on Minimap (cyan diamonds)
    for (const bot of autonomousBots.values()) {
      miniCtx.fillStyle = bot.meshObj.colorHex;
      miniCtx.fillRect(cx + bot.x * scale - 2, cy + bot.z * scale - 2, 4, 4);
    }

    for (const p of AppState.worldPlayers.values()) {
      const isMe = p.userId === AppState.currentUserId;
      const px = cx + (isMe ? AppState.localPlayer.x : p.x) * scale;
      const pz = cy + (isMe ? AppState.localPlayer.z : p.z) * scale;
      miniCtx.fillStyle = isMe ? '#ffffff' : (p.primaryColor || '#38bdf8');
      miniCtx.beginPath();
      miniCtx.arc(px, pz, isMe ? 4.5 : 3, 0, Math.PI * 2);
      miniCtx.fill();
    }
  }

  let lastMoveSync = 0;
  let shardCombo = 0;
  let frameCounter = 0;
  let fpsTimer = performance.now();
  let currentFps = 60;

  let prevTime = performance.now();
  function animate(now) {
    const rawDt = Math.min(0.1, Math.max(0.001, (now - prevTime) / 1000));
    prevTime = now;
    const dt = gameFeel.update(rawDt, now);
    const elapsed = now * 0.001;

    // Update GLSL Forcefield Shader uniforms (`shader-programming`)
    matLib.forcefieldShader.uniforms.uTime.value = elapsed;
    matLib.arenaShader.uniforms.uTime.value = elapsed;

    rebuildZonesIfNeeded();

    // 1. Player Movement (Keyboard WASD + Dynamic Touch Gesture Ring + Tap-to-Move 3D Beacon)
    let forward = 0;
    let strafe = 0;
    if (AppState.keys.has('w') || AppState.keys.has('arrowup') || AppState.touchMove === 'UP') forward += 1;
    if (AppState.keys.has('s') || AppState.keys.has('arrowdown') || AppState.touchMove === 'DOWN') forward -= 1;
    if (AppState.keys.has('a') || AppState.keys.has('arrowleft') || AppState.touchMove === 'LEFT') strafe -= 1;
    if (AppState.keys.has('d') || AppState.keys.has('arrowright') || AppState.touchMove === 'RIGHT') strafe += 1;

    if (AppState.touchVector) {
      forward += AppState.touchVector.forward || 0;
      strafe += AppState.touchVector.strafe || 0;
    }

    const isRunning = AppState.keys.has('shift')
      || Boolean(AppState.touchSprint)
      || Boolean(AppState.touchVector?.sprint)
      || Boolean(AppState.tapTarget?.sprint);
    const moveSpeed = isRunning ? 24 : 14;
    let moveDirX = 0;
    let moveDirZ = 0;
    let isMovingNow = false;

    if (forward !== 0 || strafe !== 0) {
      AppState.tapTarget = null;
      destBeaconGroup.visible = false;
      const len = Math.hypot(forward, strafe);
      if (len > 1) {
        forward /= len;
        strafe /= len;
      }

      const sinY = Math.sin(AppState.camera.yaw);
      const cosY = Math.cos(AppState.camera.yaw);

      moveDirX = forward * sinY + strafe * cosY;
      moveDirZ = forward * cosY - strafe * sinY;
      isMovingNow = true;
    } else if (AppState.tapTarget) {
      const dxTap = AppState.tapTarget.x - AppState.localPlayer.x;
      const dzTap = AppState.tapTarget.z - AppState.localPlayer.z;
      const distTap = Math.hypot(dxTap, dzTap);
      if (distTap > 0.48) {
        moveDirX = dxTap / distTap;
        moveDirZ = dzTap / distTap;
        isMovingNow = true;
        destOuterRing.rotation.z = elapsed * 2.5;
        destInnerRing.rotation.z = -elapsed * 3.8;
        const pulseScale = 1.0 + Math.sin(elapsed * 7.0) * 0.14;
        destOuterRing.scale.set(pulseScale, pulseScale, 1);
      } else {
        AppState.tapTarget = null;
        destBeaconGroup.visible = false;
      }
    }

    if (isMovingNow) {
      const vx = moveDirX * moveSpeed * dt;
      const vz = moveDirZ * moveSpeed * dt;

      let nextX = Math.max(-95, Math.min(95, AppState.localPlayer.x + vx));
      let nextZ = Math.max(-95, Math.min(95, AppState.localPlayer.z + vz));

      // Spatial Circle/AABB Collision with Tangential Sliding against Zone Architectural Cores (VS02 - M02-01)
      const zones = AppState.data?.zones || [];
      const playerRadius = 0.85;
      for (const z of zones) {
        // Central Hub is an open plaza; other buildings have solid inner monument cores
        const coreRadius = z.id === 'CENTRAL_HUB' ? 2.2 : Math.max(2.6, (z.radius || 8) * 0.35);
        const minAllowedDist = coreRadius + playerRadius;
        const dx = nextX - z.x;
        const dz = nextZ - z.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.0001 && dist < minAllowedDist) {
          const nx = dx / dist;
          const nz = dz / dist;
          nextX = z.x + nx * minAllowedDist;
          nextZ = z.z + nz * minAllowedDist;
        }
      }

      AppState.localPlayer.x = nextX;
      AppState.localPlayer.z = nextZ;
      AppState.localPlayer.rotY = Math.atan2(vx, vz);
      AppState.localPlayer.animState = isRunning ? 'RUN' : 'WALK';
      let closest = null;
      let minDist = Infinity;
      for (const z of zones) {
        const d = Math.hypot(AppState.localPlayer.x - z.x, AppState.localPlayer.z - z.z);
        if (d < minDist) {
          minDist = d;
          closest = { ...z, distance: d };
        }
      }
      if (closest) {
        AppState.localPlayer.zone = closest.id;
        document.getElementById('current-zone-label').textContent = closest.name;
        document.getElementById('coords-label').textContent = `(${Math.round(AppState.localPlayer.x)}, ${Math.round(AppState.localPlayer.z)})`;

        const promptEl = document.getElementById('interact-prompt');
        if (closest.distance <= closest.radius + 4) {
          AppState.nearestZone = closest;
          document.getElementById('interact-zone-name').textContent = closest.name;
          promptEl.classList.remove('hidden');
        } else {
          AppState.nearestZone = null;
          promptEl.classList.add('hidden');
        }
      }

      if (AppState.data?.currentUser) {
        AppState.worldPlayers.set(AppState.currentUserId, {
          userId: AppState.currentUserId,
          name: AppState.data.currentUser.display_name,
          title: AppState.data.currentUser.title,
          zone: AppState.localPlayer.zone,
          x: AppState.localPlayer.x,
          y: 0,
          z: AppState.localPlayer.z,
          rotY: AppState.localPlayer.rotY,
          animState: AppState.localPlayer.animState,
          primaryColor: AppState.localPlayer.primaryColor,
          online: true
        });
      }

      if (now - lastMoveSync > 85) {
        lastMoveSync = now;
        sendWsMove();
      }
    } else if (AppState.localPlayer.animState === 'WALK' || AppState.localPlayer.animState === 'RUN') {
      AppState.localPlayer.animState = 'IDLE';
      sendWsMove();
    }

    // 2. Animate Zone Landmarks & Sky Orbital Rings
    skyOrbitRing1.rotation.z = elapsed * 0.08;
    skyOrbitRing2.rotation.z = -elapsed * 0.06;
    for (const c of zoneComplexes) {
      for (const part of c.animatedParts) {
        if (part.rotY) part.mesh.rotation.y += part.rotY * dt;
        if (part.rotX) part.mesh.rotation.x += part.rotX * dt;
        if (part.rotZ) part.mesh.rotation.z += part.rotZ * dt;
        if (part.bob) {
          part.mesh.position.y = part.baseY + Math.sin(elapsed * 2.4) * 0.55;
        }
      }
    }

    // 3. Collect Interactive Data Shards with Game-Feel Juice (Squash & Stretch + Trauma Shake + Hit-Stop)
    for (const s of shards) {
      if (s.respawnTimer > 0) {
        s.respawnTimer -= rawDt;
        if (s.respawnTimer <= 0) {
          s.group.visible = true;
          s.group.position.set(s.baseX, 1.4, s.baseZ);
        }
        continue;
      }
      s.crystal.rotation.y += 2.2 * dt;
      s.ring.rotation.x += 1.6 * dt;
      s.ring.rotation.y += 1.2 * dt;
      s.group.position.y = 1.4 + Math.sin(elapsed * 3.2 + s.baseX) * 0.25;

      const distToPlayer = Math.hypot(AppState.localPlayer.x - s.group.position.x, AppState.localPlayer.z - s.group.position.z);
      if (distToPlayer < 4.5 && distToPlayer > 1.3) {
        s.group.position.x += (AppState.localPlayer.x - s.group.position.x) * 6 * dt;
        s.group.position.z += (AppState.localPlayer.z - s.group.position.z) * 6 * dt;
      } else if (distToPlayer <= 1.3) {
        s.group.visible = false;
        s.respawnTimer = 14;
        shardCombo++;
        const myHero = heroMeshes.get(AppState.currentUserId);
        gameFeel.feedback(shardCombo % 3 === 0 ? 'medium' : 'small', myHero?.bodyRig, shardCombo);
        showToast(`⚡ Thu thập Tinh Thể Dữ Liệu AI #${shardCombo}! (+Juice Squash & Stretch)`, 'success');
        if (typeof window.on3dShardCollected === 'function') {
          window.on3dShardCollected(shardCombo);
        }
      }
    }

    // 4. Update Player Heroes, Autonomous BT/Utility 3D AI Agents & Vivid Audio Studio (`audio-design`)
    syncPlayerHeroes(elapsed);
    updateAutonomousWorldAgents(dt, elapsed);
    const myAgents = (AppState.data?.agents || []).filter(a => a.owner_id === AppState.currentUserId);
    const activeComposerAgent = myAgents.find(a => a.ai_class === 'CREATOR') || myAgents[0] || null;
    audio.updatePerFrame(rawDt, {
      animState: AppState.localPlayer.animState,
      zoneId: AppState.localPlayer.zone,
      isSpeedWarActive: AppState.activeScreen === 'SPEED_WAR',
      activeAgent: activeComposerAgent
    });

    // 5. Camera Systems (`camera-systems`: Deadzone + Look-Ahead + Cinematic AI Cutscene Focus + Shake Offset)
    if (isMovingNow) {
      // Automatically exit cutscene camera if player manually walks or taps to move
      if (aiConvState.cinematicWatch) {
        aiConvState.cinematicWatch = false;
        const btn = document.getElementById('btn-watch-ai-cutscene');
        if (btn) btn.textContent = '🎥 Xem Hoạt Cảnh AI Giao Tiếp';
      }
    }

    if (aiConvState.cinematicWatch && aiConvState.active) {
      // Cinematic Cutscene Camera framing the two conversing 3D AI Androids
      const botA = autonomousBots.get(aiConvState.botAId);
      const botB = autonomousBots.get(aiConvState.botBId);
      const midX = botA && botB ? (botA.x + botB.x) * 0.5 : aiConvState.meetX;
      const midZ = botA && botB ? (botA.z + botB.z) * 0.5 : aiConvState.meetZ;
      const cineAngle = elapsed * 0.28;
      const cineDist = 9.2;
      const desiredCamX = midX + Math.sin(cineAngle) * cineDist;
      const desiredCamY = 3.8;
      const desiredCamZ = midZ + Math.cos(cineAngle) * cineDist;

      const followFactor = 1 - Math.exp(-6.5 * rawDt);
      camera.position.x += (desiredCamX - camera.position.x) * followFactor + gameFeel.shakeOffset.x;
      camera.position.y += (desiredCamY - camera.position.y) * followFactor + gameFeel.shakeOffset.y;
      camera.position.z += (desiredCamZ - camera.position.z) * followFactor + gameFeel.shakeOffset.z;
      camera.lookAt(midX, 2.35, midZ);
    } else {
      const dxFocus = AppState.localPlayer.x - cameraRigState.focusX;
      const dzFocus = AppState.localPlayer.z - cameraRigState.focusZ;
      const distFocus = Math.hypot(dxFocus, dzFocus);
      if (distFocus > cameraRigState.deadzoneRadius) {
        const overflow = distFocus - cameraRigState.deadzoneRadius;
        cameraRigState.focusX += (dxFocus / distFocus) * overflow;
        cameraRigState.focusZ += (dzFocus / distFocus) * overflow;
      }

      // Smooth look-ahead in direction of motion
      const lookAheadDist = isRunning ? 3.2 : 1.8;
      const lookAlpha = 1 - Math.exp(-6.5 * rawDt);
      cameraRigState.lookAheadX += (moveDirX * lookAheadDist - cameraRigState.lookAheadX) * lookAlpha;
      cameraRigState.lookAheadZ += (moveDirZ * lookAheadDist - cameraRigState.lookAheadZ) * lookAlpha;

      const targetX = Math.max(-95, Math.min(95, cameraRigState.focusX + cameraRigState.lookAheadX * 0.35));
      const targetZ = Math.max(-95, Math.min(95, cameraRigState.focusZ + cameraRigState.lookAheadZ * 0.35));

      const camDist = AppState.camera.distance;
      const yaw = AppState.camera.yaw;
      const pitch = AppState.camera.pitch;
      const desiredCamX = targetX - Math.sin(yaw) * Math.cos(pitch) * camDist;
      const desiredCamY = 2.5 + Math.sin(pitch) * camDist;
      const desiredCamZ = targetZ - Math.cos(yaw) * Math.cos(pitch) * camDist;

      // Frame-rate-independent exponential smoothing (`1 - Math.exp(-rate * dt)`)
      const followFactor = 1 - Math.exp(-10.5 * rawDt);
      camera.position.x += (desiredCamX - camera.position.x) * followFactor;
      camera.position.y += (desiredCamY - camera.position.y) * followFactor;
      camera.position.z += (desiredCamZ - camera.position.z) * followFactor;

      // Compose additive shake offset ON TOP of smooth follow (`camera-systems` & `game-feel`)
      camera.position.x += gameFeel.shakeOffset.x;
      camera.position.y += gameFeel.shakeOffset.y;
      camera.position.z += gameFeel.shakeOffset.z;

      camera.lookAt(
        targetX + cameraRigState.lookAheadX * 0.5,
        2.1 + gameFeel.shakeOffset.y * 0.5,
        targetZ + cameraRigState.lookAheadZ * 0.5
      );
    }

    // 6. Render WebGL Scene & Minimap
    renderer.render(scene, camera);
    renderMinimap();

    // 7. Live Quality Diagnostics
    frameCounter++;
    if (now - fpsTimer >= 600) {
      currentFps = Math.round((frameCounter * 1000) / (now - fpsTimer));
      frameCounter = 0;
      fpsTimer = now;
      const diagEl = document.getElementById('webgl-diagnostics');
      if (diagEl) {
        const info = renderer.info;
        diagEl.textContent = `${currentFps} FPS | Calls: ${info.render.calls} | Tris: ${(info.render.triangles / 1000).toFixed(1)}k | AI Bots: ${autonomousBots.size}`;
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}
