/**
 * AI ARENA 3.0 – VIBRANT MULTI-COLOR CYBER-ARTWORK, DIVERSE AI ARCHETYPES & QUEST EMBLEMS
 * Supports:
 * - 6 Distinct Character & AI Morphologies: AI Đại Sư, AI Phù Thủy, AI Bình Dân, AI Hiệp Sĩ, AI Cơ Khí, AI Tiên Tử
 * - Colorful Mission Emblems & Multi-Hue Stage Badges
 * - 19 Vivid Multi-Color Menu Tiles & 9 Panoramic 3D Zone Illustrations
 */

export const AI_ARCHETYPES = {
  DAI_SU: {
    id: 'DAI_SU',
    nameVi: 'AI Đại Sư',
    roleVi: 'Thiền Sư Lượng Tử • Trí Tuệ Tối Thượng',
    badge: '🧘 ĐẠI SƯ',
    primary: '#fbbf24',
    secondary: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(251,191,36,0.38) 0%, rgba(217,119,6,0.14) 55%, rgba(120,53,15,0.25) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="arch-daisu" cx="50%" cy="46%" r="54%">
            <stop offset="0%" stop-color="#fde047" stop-opacity="0.7"/>
            <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="120" rx="14" fill="url(#arch-daisu)"/>
        <!-- Golden Dharma Halo & Orbiting Prayer Beads -->
        <circle cx="80" cy="48" r="36" fill="none" stroke="#fde047" stroke-width="2.5" stroke-dasharray="5 3"/>
        <circle cx="80" cy="48" r="28" fill="rgba(251,191,36,0.18)" stroke="#fbbf24" stroke-width="1.5"/>
        <circle cx="44" cy="48" r="4.5" fill="#fde047"/>
        <circle cx="116" cy="48" r="4.5" fill="#fde047"/>
        <circle cx="55" cy="22" r="4.5" fill="#00e5ff"/>
        <circle cx="105" cy="22" r="4.5" fill="#00e5ff"/>
        <circle cx="80" cy="12" r="5.5" fill="#f43f5e"/>
        <!-- Conical Sage Hat & Robe Silhouette -->
        <polygon points="80,20 108,38 52,38" fill="#fef08a" stroke="#d97706" stroke-width="2"/>
        <circle cx="80" cy="46" r="11" fill="#fde68a" stroke="#f59e0b" stroke-width="2"/>
        <path d="M52,104 L64,58 L96,58 L108,104 Z" fill="#d97706" stroke="#fde047" stroke-width="2.2"/>
        <path d="M68,58 L80,88 L92,58" fill="none" stroke="#fef08a" stroke-width="2.5"/>
        <!-- Jade Lotus Staff -->
        <line x1="118" y1="26" x2="112" y2="106" stroke="#fde047" stroke-width="3" stroke-linecap="round"/>
        <polygon points="118,14 125,26 118,34 111,26" fill="#10b981" stroke="#a7f3d0" stroke-width="1.5"/>
      </svg>
    `
  },
  PHU_THUY: {
    id: 'PHU_THUY',
    nameVi: 'AI Phù Thủy',
    roleVi: 'Pháp Sư Ma Pháp Cổ Ngữ & Sáng Tạo',
    badge: '🔮 PHÙ THỦY',
    primary: '#e879f9',
    secondary: '#a855f7',
    bgGradient: 'linear-gradient(135deg, rgba(232,121,249,0.38) 0%, rgba(168,85,247,0.18) 55%, rgba(76,29,149,0.28) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="arch-phuthuy" cx="50%" cy="48%" r="55%">
            <stop offset="0%" stop-color="#f0abfc" stop-opacity="0.65"/>
            <stop offset="60%" stop-color="#9333ea" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="120" rx="14" fill="url(#arch-phuthuy)"/>
        <!-- Arcane Magic Circle -->
        <circle cx="80" cy="58" r="38" fill="none" stroke="#e879f9" stroke-width="1.6" stroke-dasharray="6 3"/>
        <polygon points="80,22 112,76 48,76" fill="none" stroke="#38bdf8" stroke-width="1.4" opacity="0.8"/>
        <polygon points="80,94 112,40 48,40" fill="none" stroke="#fde047" stroke-width="1.4" opacity="0.8"/>
        <!-- Pointed Wizard Hat & Mystic Cape -->
        <polygon points="84,8 102,42 58,42" fill="#6b21a8" stroke="#f0abfc" stroke-width="2.2"/>
        <ellipse cx="80" cy="42" rx="28" ry="6" fill="#581c87" stroke="#e879f9" stroke-width="2"/>
        <circle cx="80" cy="52" r="10" fill="#1e1b4b" stroke="#e879f9" stroke-width="2"/>
        <circle cx="76" cy="51" r="2.5" fill="#00e5ff"/>
        <circle cx="84" cy="51" r="2.5" fill="#00e5ff"/>
        <path d="M50,104 C56,64 104,64 110,104 Z" fill="#7e22ce" stroke="#f0abfc" stroke-width="2.2"/>
        <!-- Floating Crystal Orb Staff -->
        <line x1="40" y1="36" x2="48" y2="104" stroke="#c084fc" stroke-width="3"/>
        <circle cx="40" cy="28" r="9" fill="#00e5ff" stroke="#ffffff" stroke-width="2"/>
      </svg>
    `
  },
  BINH_DAN: {
    id: 'BINH_DAN',
    nameVi: 'AI Bình Dân',
    roleVi: 'Cư Dân Đường Phố • Nhanh Nhạy & Thân Thiện',
    badge: '🛹 BÌNH DÂN',
    primary: '#10b981',
    secondary: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.38) 0%, rgba(6,182,212,0.18) 55%, rgba(6,78,59,0.28) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="arch-binhdan" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.65"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="120" rx="14" fill="url(#arch-binhdan)"/>
        <!-- Street Neon Headphones & Cap -->
        <path d="M58,44 A22,22 0 0,1 102,44" fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/>
        <rect x="52" y="38" width="8" height="16" rx="4" fill="#f43f5e"/>
        <rect x="100" y="38" width="8" height="16" rx="4" fill="#f43f5e"/>
        <circle cx="80" cy="45" r="14" fill="#38bdf8" stroke="#e0f2fe" stroke-width="2"/>
        <!-- Friendly Smile Visor -->
        <path d="M72,46 Q80,53 88,46" fill="none" stroke="#020617" stroke-width="2.8" stroke-linecap="round"/>
        <!-- Streetwear Hoodie -->
        <rect x="58" y="60" width="44" height="32" rx="10" fill="#10b981" stroke="#6ee7b7" stroke-width="2.2"/>
        <line x1="74" y1="60" x2="74" y2="74" stroke="#fef08a" stroke-width="2"/>
        <line x1="86" y1="60" x2="86" y2="74" stroke="#fef08a" stroke-width="2"/>
        <!-- Neon Hoverboard -->
        <rect x="38" y="96" width="84" height="10" rx="5" fill="#f43f5e" stroke="#fde047" stroke-width="2"/>
        <circle cx="52" cy="108" r="4" fill="#00e5ff"/>
        <circle cx="108" cy="108" r="4" fill="#00e5ff"/>
      </svg>
    `
  },
  HIEP_SI: {
    id: 'HIEP_SI',
    nameVi: 'AI Hiệp Sĩ',
    roleVi: 'Chiến Binh Cánh Quang Học • Tốc Độ Cao',
    badge: '⚔️ HIỆP SĨ',
    primary: '#00e5ff',
    secondary: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, rgba(0,229,255,0.38) 0%, rgba(59,130,246,0.18) 55%, rgba(15,23,42,0.3) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="arch-hiepsi" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.65"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="120" rx="14" fill="url(#arch-hiepsi)"/>
        <!-- Glowing Cyber Wings -->
        <polygon points="72,56 20,26 30,52 16,74 68,74" fill="rgba(0,229,255,0.35)" stroke="#00e5ff" stroke-width="2"/>
        <polygon points="88,56 140,26 130,52 144,74 92,74" fill="rgba(0,229,255,0.35)" stroke="#00e5ff" stroke-width="2"/>
        <!-- Knight Helmet & V-Visor -->
        <polygon points="80,14 96,34 80,50 64,34" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2.2"/>
        <polyline points="68,32 80,40 92,32" fill="none" stroke="#fde047" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Paladin Armor -->
        <polygon points="56,52 104,52 94,98 66,98" fill="#1d4ed8" stroke="#00e5ff" stroke-width="2.2"/>
        <circle cx="80" cy="70" r="8" fill="#fde047"/>
      </svg>
    `
  },
  CO_KHI: {
    id: 'CO_KHI',
    nameVi: 'AI Cơ Khí',
    roleVi: 'Hộ Vệ Giáp Sắt Mecha • Phòng Thủ Tuyệt Đối',
    badge: '🛡️ CƠ KHÍ',
    primary: '#f97316',
    secondary: '#ef4444',
    bgGradient: 'linear-gradient(135deg, rgba(249,115,22,0.38) 0%, rgba(239,68,68,0.18) 55%, rgba(124,45,18,0.28) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="arch-cokhi" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#fb923c" stop-opacity="0.65"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="120" rx="14" fill="url(#arch-cokhi)"/>
        <!-- Heavy Shoulder Cannons & Mecha Hull -->
        <rect x="28" y="34" width="24" height="44" rx="6" fill="#9a3412" stroke="#fb923c" stroke-width="2.2"/>
        <rect x="108" y="34" width="24" height="44" rx="6" fill="#9a3412" stroke="#fb923c" stroke-width="2.2"/>
        <rect x="46" y="42" width="68" height="56" rx="10" fill="#c2410c" stroke="#fed7aa" stroke-width="2.5"/>
        <rect x="64" y="24" width="32" height="22" rx="5" fill="#431407" stroke="#fb923c" stroke-width="2"/>
        <rect x="70" y="31" width="20" height="7" rx="3" fill="#00e5ff"/>
        <!-- Reactor Core -->
        <circle cx="80" cy="70" r="14" fill="#fde047" stroke="#ffffff" stroke-width="2.5"/>
      </svg>
    `
  },
  TIEN_TU: {
    id: 'TIEN_TU',
    nameVi: 'AI Tiên Tử',
    roleVi: 'Thiên Thần Âm Nhạc & Điều Phối Liên Minh',
    badge: '🦋 TIÊN TỬ',
    primary: '#f43f5e',
    secondary: '#ec4899',
    bgGradient: 'linear-gradient(135deg, rgba(244,63,94,0.38) 0%, rgba(236,72,153,0.22) 55%, rgba(131,24,67,0.28) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="arch-tientu" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#fda4af" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="120" rx="14" fill="url(#arch-tientu)"/>
        <!-- 4 Rainbow Butterfly Hologram Wings -->
        <ellipse cx="48" cy="50" rx="28" ry="16" transform="rotate(-25 48 50)" fill="rgba(244,63,94,0.4)" stroke="#fda4af" stroke-width="2"/>
        <ellipse cx="112" cy="50" rx="28" ry="16" transform="rotate(25 112 50)" fill="rgba(244,63,94,0.4)" stroke="#fda4af" stroke-width="2"/>
        <ellipse cx="52" cy="78" rx="22" ry="12" transform="rotate(20 52 78)" fill="rgba(0,229,255,0.35)" stroke="#7dd3fc" stroke-width="1.8"/>
        <ellipse cx="108" cy="78" rx="22" ry="12" transform="rotate(-20 108 78)" fill="rgba(0,229,255,0.35)" stroke="#7dd3fc" stroke-width="1.8"/>
        <!-- Crown & Celestial Figure -->
        <polygon points="66,28 73,14 80,24 87,14 94,28" fill="#fde047" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="80" cy="40" r="11" fill="#ffe4e6" stroke="#fb7185" stroke-width="2"/>
        <path d="M62,102 C66,58 94,58 98,102 Z" fill="#e11d48" stroke="#fecdd3" stroke-width="2.2"/>
      </svg>
    `
  }
};

export const CLASS_TO_DEFAULT_ARCHETYPE = {
  ANALYST: 'DAI_SU',
  CREATOR: 'PHU_THUY',
  TRADER: 'BINH_DAN',
  CODER: 'HIEP_SI',
  GUARDIAN: 'CO_KHI',
  MANAGER: 'TIEN_TU'
};

export function resolveAgentArchetype(agent) {
  if (!agent) return AI_ARCHETYPES.DAI_SU;
  if (agent.archetype && AI_ARCHETYPES[agent.archetype]) {
    return AI_ARCHETYPES[agent.archetype];
  }
  const avatarStr = String(agent.avatar || '');
  for (const [key, arch] of Object.entries(AI_ARCHETYPES)) {
    if (avatarStr.includes(key) || String(agent.name || '').toUpperCase().includes(arch.nameVi.toUpperCase())) {
      return arch;
    }
  }
  const mappedKey = CLASS_TO_DEFAULT_ARCHETYPE[agent.ai_class] || 'DAI_SU';
  return AI_ARCHETYPES[mappedKey];
}

export const AI_CLASS_VISUALS = {
  ANALYST: AI_ARCHETYPES.DAI_SU,
  CREATOR: AI_ARCHETYPES.PHU_THUY,
  TRADER: AI_ARCHETYPES.BINH_DAN,
  CODER: AI_ARCHETYPES.HIEP_SI,
  GUARDIAN: AI_ARCHETYPES.CO_KHI,
  MANAGER: AI_ARCHETYPES.TIEN_TU
};

/**
 * Colorful Multi-Hue Mission / Quest Emblem SVGs (`Biểu tượng Nhiệm vụ đa sắc màu`)
 */
export const QUEST_VISUAL_THEMES = [
  {
    border: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.42)',
    bg: 'linear-gradient(135deg, rgba(251,191,36,0.26) 0%, rgba(244,63,94,0.16) 50%, rgba(2,10,28,0.92) 100%)',
    pillBg: 'linear-gradient(90deg, #f59e0b, #ec4899)',
    iconSvg: `
      <svg viewBox="0 0 48 48" width="38" height="38">
        <defs>
          <linearGradient id="qi-1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fde047"/>
            <stop offset="100%" stop-color="#f43f5e"/>
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#qi-1)" opacity="0.25"/>
        <polygon points="24,4 30,17 44,18 33,28 36,42 24,34 12,42 15,28 4,18 18,17" fill="url(#qi-1)" stroke="#ffffff" stroke-width="1.8"/>
      </svg>
    `
  },
  {
    border: '#e879f9',
    glow: 'rgba(232, 121, 249, 0.42)',
    bg: 'linear-gradient(135deg, rgba(232,121,249,0.28) 0%, rgba(56,189,248,0.18) 50%, rgba(2,10,28,0.92) 100%)',
    pillBg: 'linear-gradient(90deg, #d946ef, #00e5ff)',
    iconSvg: `
      <svg viewBox="0 0 48 48" width="38" height="38">
        <defs>
          <linearGradient id="qi-2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f0abfc"/>
            <stop offset="100%" stop-color="#00e5ff"/>
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#qi-2)" opacity="0.25"/>
        <polygon points="24,6 42,24 24,42 6,24" fill="url(#qi-2)" stroke="#ffffff" stroke-width="1.8"/>
        <circle cx="24" cy="24" r="6" fill="#fde047"/>
      </svg>
    `
  },
  {
    border: '#34d399',
    glow: 'rgba(52, 211, 153, 0.42)',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.28) 0%, rgba(250,204,21,0.18) 50%, rgba(2,10,28,0.92) 100%)',
    pillBg: 'linear-gradient(90deg, #10b981, #eab308)',
    iconSvg: `
      <svg viewBox="0 0 48 48" width="38" height="38">
        <defs>
          <linearGradient id="qi-3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#34d399"/>
            <stop offset="100%" stop-color="#fde047"/>
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#qi-3)" opacity="0.25"/>
        <polygon points="16,8 32,8 42,20 24,42 6,20" fill="url(#qi-3)" stroke="#ffffff" stroke-width="1.8"/>
      </svg>
    `
  },
  {
    border: '#fb7185',
    glow: 'rgba(251, 113, 133, 0.45)',
    bg: 'linear-gradient(135deg, rgba(244,63,94,0.32) 0%, rgba(168,85,247,0.22) 50%, rgba(2,10,28,0.92) 100%)',
    pillBg: 'linear-gradient(90deg, #f43f5e, #8b5cf6)',
    iconSvg: `
      <svg viewBox="0 0 48 48" width="38" height="38">
        <defs>
          <linearGradient id="qi-4" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fb7185"/>
            <stop offset="100%" stop-color="#fde047"/>
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#qi-4)" opacity="0.25"/>
        <path d="M14,10 H34 V22 C34,30 29,35 24,35 C19,35 14,30 14,22 Z" fill="url(#qi-4)" stroke="#ffffff" stroke-width="1.8"/>
        <rect x="18" y="38" width="12" height="4" rx="2" fill="#fde047"/>
      </svg>
    `
  }
];

/**
 * Generate a glowing 6-axis Hexagonal Radar SVG for an AI Agent's stats
 */
export function renderAgentRadarSvg(agent, color = '#00e5ff') {
  const stats = [
    { key: 'logic', label: 'LOG', val: agent.logic || 75 },
    { key: 'creativity', label: 'ART', val: agent.creativity || 70 },
    { key: 'speed', label: 'SPD', val: agent.speed || 75 },
    { key: 'accuracy', label: 'ACC', val: agent.accuracy || 75 },
    { key: 'collaboration', label: 'COL', val: agent.collaboration || 70 },
    { key: 'stability', label: 'STB', val: agent.stability || 75 }
  ];

  const cx = 65;
  const cy = 62;
  const maxR = 40;

  const pointsOuter = [];
  const pointsMid = [];
  const pointsVal = [];
  const labelsHtml = [];

  stats.forEach((st, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / 6;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    pointsOuter.push(`${(cx + cos * maxR).toFixed(1)},${(cy + sin * maxR).toFixed(1)}`);
    pointsMid.push(`${(cx + cos * (maxR * 0.55)).toFixed(1)},${(cy + sin * (maxR * 0.55)).toFixed(1)}`);

    const norm = Math.max(0.2, Math.min(1.0, Number(st.val) / 110));
    const r = maxR * norm;
    pointsVal.push(`${(cx + cos * r).toFixed(1)},${(cy + sin * r).toFixed(1)}`);

    const lx = cx + cos * (maxR + 14);
    const ly = cy + sin * (maxR + 12) + 3;
    labelsHtml.push(
      `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#fef08a" font-size="8.5" font-weight="800" text-anchor="middle">${st.label} ${st.val}</text>`
    );
  });

  return `
    <svg viewBox="0 0 130 124" width="128" height="122" style="overflow:visible;flex-shrink:0;">
      <polygon points="${pointsOuter.join(' ')}" fill="rgba(2,12,28,0.75)" stroke="rgba(251,191,36,0.4)" stroke-width="1.2"/>
      <polygon points="${pointsMid.join(' ')}" fill="none" stroke="rgba(56,189,248,0.22)" stroke-dasharray="2 2" stroke-width="1"/>
      <polygon points="${pointsVal.join(' ')}" fill="${color}55" stroke="${color}" stroke-width="2.4"/>
      ${labelsHtml.join('')}
    </svg>
  `;
}

/**
 * 18 Multi-Color Visual Menu Tiles with Custom Holographic Artwork
 */
export const VISUAL_MENU_ITEMS = [
  {
    screen: 'WORLD_3D',
    category: 'CORE',
    icon: '🌐',
    shortTitle: 'Thế Giới 3D',
    subTag: 'LIVE PLAY',
    accent: '#00e5ff',
    bg: 'linear-gradient(135deg, rgba(0,229,255,0.34), rgba(59,130,246,0.14))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="rgba(0,229,255,0.2)" stroke="#00e5ff" stroke-width="2.5"/><ellipse cx="32" cy="32" rx="10" ry="22" fill="none" stroke="#fde047" stroke-width="1.8"/><line x1="10" y1="32" x2="54" y2="32" stroke="#00e5ff" stroke-width="1.8"/></svg>`
  },
  {
    screen: 'SPEED_WAR',
    category: 'ARENA',
    icon: '⚡',
    shortTitle: 'Speed War',
    subTag: '3 VÒNG ĐẤU',
    accent: '#fb7185',
    bg: 'linear-gradient(135deg, rgba(244,63,94,0.38), rgba(249,115,22,0.16))',
    artSvg: `<svg viewBox="0 0 64 64"><polygon points="36,8 14,36 30,36 26,56 50,26 34,26" fill="#fb7185" stroke="#fde047" stroke-width="2.2" stroke-linejoin="round"/></svg>`
  },
  {
    screen: 'AI_MANAGER',
    category: 'AI',
    icon: '🧘',
    shortTitle: 'Đội Hình AI',
    subTag: 'ĐẠI SƯ • PHÙ THỦY',
    accent: '#fde047',
    bg: 'linear-gradient(135deg, rgba(250,204,21,0.34), rgba(236,72,153,0.16))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="30" r="18" fill="rgba(250,204,21,0.22)" stroke="#fde047" stroke-width="2.2" stroke-dasharray="4 2"/><polygon points="32,12 48,26 16,26" fill="#fde047" stroke="#f59e0b" stroke-width="2"/><circle cx="32" cy="34" r="8" fill="#38bdf8"/></svg>`
  },
  {
    screen: 'JOB_MARKET',
    category: 'ARENA',
    icon: '💼',
    shortTitle: 'Sàn Hợp Đồng',
    subTag: '+TOKEN',
    accent: '#fbbf24',
    bg: 'linear-gradient(135deg, rgba(251,191,36,0.34), rgba(16,185,129,0.15))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="12" y="20" width="40" height="30" rx="6" fill="rgba(251,191,36,0.28)" stroke="#fbbf24" stroke-width="2.5"/><path d="M24 20 V15 C24 13 26 12 28 12 H36 C38 12 40 13 40 15 V20" fill="none" stroke="#fde047" stroke-width="2.5"/><circle cx="32" cy="35" r="6" fill="#34d399"/></svg>`
  },
  {
    screen: 'WORLD_MAP',
    category: 'CORE',
    icon: '🗺️',
    shortTitle: 'Bản Đồ 3D',
    subTag: '9 KHU VỰC',
    accent: '#34d399',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.34), rgba(6,182,212,0.15))',
    artSvg: `<svg viewBox="0 0 64 64"><polygon points="10,16 25,12 39,18 54,12 54,48 39,52 25,46 10,52" fill="rgba(16,185,129,0.28)" stroke="#34d399" stroke-width="2.4"/><circle cx="32" cy="30" r="6" fill="#fde047"/></svg>`
  },
  {
    screen: 'TOKEN_WALLET',
    category: 'ECONOMY',
    icon: '💎',
    shortTitle: 'Ví Token',
    subTag: 'SỔ CÁI',
    accent: '#2dd4bf',
    bg: 'linear-gradient(135deg, rgba(45,212,191,0.34), rgba(59,130,246,0.16))',
    artSvg: `<svg viewBox="0 0 64 64"><polygon points="32,10 52,26 32,54 12,26" fill="rgba(45,212,191,0.38)" stroke="#fde047" stroke-width="2.2"/></svg>`
  },
  {
    screen: 'AI_SOCIAL',
    category: 'AI',
    icon: '🤝',
    shortTitle: 'Mạng XH AI',
    subTag: 'KẾT BẠN',
    accent: '#e879f9',
    bg: 'linear-gradient(135deg, rgba(232,121,249,0.34), rgba(139,92,246,0.16))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="20" cy="24" r="8" fill="#e879f9"/><circle cx="44" cy="24" r="8" fill="#00e5ff"/><circle cx="32" cy="46" r="8" fill="#fde047"/><line x1="26" y1="26" x2="38" y2="26" stroke="#ffffff" stroke-width="2.2"/><line x1="23" y1="30" x2="29" y2="40" stroke="#ffffff" stroke-width="2.2"/><line x1="41" y1="30" x2="35" y2="40" stroke="#ffffff" stroke-width="2.2"/></svg>`
  },
  {
    screen: 'AI_COLLAB',
    category: 'AI',
    icon: '🧩',
    shortTitle: 'Hợp Tác AI',
    subTag: 'LIÊN MINH',
    accent: '#f472b6',
    bg: 'linear-gradient(135deg, rgba(244,114,182,0.34), rgba(251,191,36,0.14))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="12" y="14" width="18" height="18" rx="4" fill="#f472b6"/><rect x="34" y="32" width="18" height="18" rx="4" fill="#00e5ff"/><path d="M30 23 H42 V32" fill="none" stroke="#fde047" stroke-width="3"/></svg>`
  },
  {
    screen: 'AI_TRADING',
    category: 'AI',
    icon: '⚖️',
    shortTitle: 'Đàm Phán',
    subTag: 'ESCROW',
    accent: '#fb923c',
    bg: 'linear-gradient(135deg, rgba(251,146,60,0.34), rgba(236,72,153,0.14))',
    artSvg: `<svg viewBox="0 0 64 64"><line x1="32" y1="12" x2="32" y2="52" stroke="#fde047" stroke-width="3"/><line x1="14" y1="22" x2="50" y2="22" stroke="#fb923c" stroke-width="2.8"/><polygon points="14,22 8,36 20,36" fill="#38bdf8"/><polygon points="50,22 44,36 56,36" fill="#f43f5e"/></svg>`
  },
  {
    screen: 'AI_RESCUE',
    category: 'ECONOMY',
    icon: '🆘',
    shortTitle: 'Cứu Trợ AI',
    subTag: 'MUA LẠI',
    accent: '#f87171',
    bg: 'linear-gradient(135deg, rgba(248,113,113,0.34), rgba(250,204,21,0.14))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="rgba(239,68,68,0.28)" stroke="#fde047" stroke-width="2.5"/><path d="M32 20 V44 M20 32 H44" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/></svg>`
  },
  {
    screen: 'CHARACTER',
    category: 'CORE',
    icon: '🧙',
    shortTitle: 'Hình Dáng 3D',
    subTag: '6 NHÂN VẬT',
    accent: '#60a5fa',
    bg: 'linear-gradient(135deg, rgba(96,165,250,0.34), rgba(168,85,247,0.16))',
    artSvg: `<svg viewBox="0 0 64 64"><polygon points="32,8 46,24 18,24" fill="#a855f7" stroke="#fde047" stroke-width="2"/><circle cx="32" cy="32" r="8" fill="#38bdf8"/><path d="M18 54 C18 40 46 40 46 54" fill="#10b981" stroke="#ffffff" stroke-width="2"/></svg>`
  },
  {
    screen: 'AUTH',
    category: 'CORE',
    icon: '🔐',
    shortTitle: 'Tài Khoản',
    subTag: 'MẬT KHẨU',
    accent: '#4ade80',
    bg: 'linear-gradient(135deg, rgba(74,222,128,0.34), rgba(14,165,233,0.15))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="16" y="28" width="32" height="24" rx="6" fill="#10b981" stroke="#fde047" stroke-width="2.2"/><path d="M22 28 V20 C22 14 42 14 42 20 V28" fill="none" stroke="#ffffff" stroke-width="2.5"/><circle cx="32" cy="40" r="4" fill="#fde047"/></svg>`
  },
  {
    screen: 'WORLD_LOBBY',
    category: 'ARENA',
    icon: '🎮',
    shortTitle: 'Phòng Đấu',
    subTag: 'MULTIPLAYER',
    accent: '#a78bfa',
    bg: 'linear-gradient(135deg, rgba(167,139,250,0.34), rgba(236,72,153,0.15))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="10" y="22" width="44" height="24" rx="10" fill="#6366f1" stroke="#e9d5ff" stroke-width="2.2"/><circle cx="22" cy="34" r="4.5" fill="#00e5ff"/><circle cx="42" cy="31" r="3.5" fill="#fde047"/><circle cx="46" cy="37" r="3.5" fill="#f43f5e"/></svg>`
  },
  {
    screen: 'CORPORATION',
    category: 'ECONOMY',
    icon: '🏢',
    shortTitle: 'Tập Đoàn AI',
    subTag: 'ĐẾ CHẾ',
    accent: '#c084fc',
    bg: 'linear-gradient(135deg, rgba(192,132,252,0.34), rgba(59,130,246,0.15))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="18" y="14" width="28" height="40" rx="4" fill="#7c3aed" stroke="#fde047" stroke-width="2.2"/><rect x="24" y="22" width="6" height="6" fill="#00e5ff"/><rect x="34" y="22" width="6" height="6" fill="#00e5ff"/><rect x="24" y="34" width="6" height="6" fill="#fde047"/><rect x="34" y="34" width="6" height="6" fill="#fde047"/></svg>`
  },
  {
    screen: 'LEADERBOARD',
    category: 'COMMUNITY',
    icon: '🏆',
    shortTitle: 'Xếp Hạng',
    subTag: 'TOP PRO',
    accent: '#fde047',
    bg: 'linear-gradient(135deg, rgba(253,224,71,0.38), rgba(244,63,94,0.15))',
    artSvg: `<svg viewBox="0 0 64 64"><path d="M20 14 H44 V28 C44 36 38 42 32 42 C26 42 20 36 20 28 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="2.5"/><line x1="32" y1="42" x2="32" y2="52" stroke="#fde047" stroke-width="3"/><line x1="22" y1="52" x2="42" y2="52" stroke="#fde047" stroke-width="3"/></svg>`
  },
  {
    screen: 'ADMIN',
    category: 'COMMUNITY',
    icon: '🛠️',
    shortTitle: 'Hệ Thống',
    subTag: 'ADMIN',
    accent: '#38bdf8',
    bg: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(16,185,129,0.14))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="16" fill="#0284c7" stroke="#fde047" stroke-width="2.5"/><circle cx="32" cy="32" r="6" fill="#fde047"/></svg>`
  }
];

/**
 * Generate Isometric / Panoramic Multi-Color Cyber-Artwork SVG for each of the 9 3D World Zones
 */
export function renderZoneIllustrationSvg(zone) {
  const color = zone.color || '#00e5ff';
  return `
    <svg viewBox="0 0 260 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="zg-${zone.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.52"/>
          <stop offset="50%" stop-color="#ec4899" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#090d24" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <rect width="260" height="110" rx="10" fill="url(#zg-${zone.id})"/>
      <circle cx="215" cy="26" r="14" fill="#fde047" opacity="0.85"/>
      <g stroke="${color}" stroke-opacity="0.35" stroke-width="1.2">
        <line x1="0" y1="84" x2="260" y2="84"/>
        <line x1="0" y1="98" x2="260" y2="98"/>
        <line x1="130" y1="52" x2="20" y2="110"/>
        <line x1="130" y1="52" x2="85" y2="110"/>
        <line x1="130" y1="52" x2="175" y2="110"/>
        <line x1="130" y1="52" x2="240" y2="110"/>
      </g>
      <ellipse cx="130" cy="82" rx="58" ry="14" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="5 3"/>
      <polygon points="130,14 164,46 152,82 108,82 96,46" fill="rgba(15,23,42,0.78)" stroke="${color}" stroke-width="2.4"/>
      <circle cx="130" cy="44" r="11" fill="${color}"/>
      <circle cx="130" cy="44" r="19" fill="none" stroke="#fde047" stroke-opacity="0.8" stroke-width="1.5"/>
    </svg>
  `;
}

/**
 * Centerpiece Home Hero Graphic: AI Character Connected to the Quantum Token Neural Brain
 */
export function renderAiTokenBrainHeroSvg(activeArchId = 'DAI_SU', tokenBalance = 1250) {
  const arch = AI_ARCHETYPES[activeArchId] || AI_ARCHETYPES.DAI_SU;
  const nodes = [
    { id: 'DAI_SU', x: 64, y: 248, label: 'Đại Sư', emoji: '🧘', color: '#f59e0b' },
    { id: 'PHU_THUY', x: 166, y: 266, label: 'Phù Thủy', emoji: '🧙', color: '#a855f7' },
    { id: 'BINH_DAN', x: 268, y: 276, label: 'Bình Dân', emoji: '🧑‍💻', color: '#10b981' },
    { id: 'HIEP_SI', x: 372, y: 276, label: 'Hiệp Sĩ', emoji: '⚔️', color: '#3b82f6' },
    { id: 'CO_KHI', x: 474, y: 266, label: 'Cơ Khí', emoji: '🦾', color: '#f43f5e' },
    { id: 'TIEN_TU', x: 576, y: 248, label: 'Tiên Tử', emoji: '🧚', color: '#ec4899' }
  ];

  const conduitsSvg = nodes.map((n) => {
    const isSel = n.id === arch.id;
    const strokeW = isSel ? 3.6 : 1.8;
    const opacity = isSel ? 1.0 : 0.55;
    return `
      <path d="M320,118 C320,175 ${n.x},175 ${n.x},${n.y - 26}" fill="none" stroke="${n.color}" stroke-width="${strokeW}" stroke-opacity="${opacity}" stroke-dasharray="${isSel ? 'none' : '5 4'}"/>
      <circle r="${isSel ? 5.2 : 3.4}" fill="${isSel ? '#fde047' : n.color}">
        <animateMotion dur="${isSel ? '1.6s' : '2.8s'}" repeatCount="indefinite" path="M320,118 C320,175 ${n.x},175 ${n.x},${n.y - 26}" />
      </circle>
      <g transform="translate(${n.x}, ${n.y})">
        <circle r="${isSel ? 26 : 21}" fill="rgba(4,12,28,0.92)" stroke="${isSel ? '#fde047' : n.color}" stroke-width="${isSel ? 3 : 1.8}"/>
        <text x="0" y="-2" font-size="${isSel ? 19 : 16}" text-anchor="middle">${n.emoji}</text>
        <text x="0" y="15" fill="${isSel ? '#fde047' : '#e2e8f0'}" font-size="9.5" font-weight="900" text-anchor="middle">${n.label}</text>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 640 306" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <defs>
        <radialGradient id="brain-aura" cx="50%" cy="36%" r="48%">
          <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.48"/>
          <stop offset="45%" stop-color="#a855f7" stop-opacity="0.28"/>
          <stop offset="80%" stop-color="#ec4899" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="brain-lobe-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00e5ff"/>
          <stop offset="50%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
        <linearGradient id="brain-lobe-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="50%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>

      <!-- Cosmic Neural Aura -->
      <ellipse cx="320" cy="108" rx="235" ry="102" fill="url(#brain-aura)"/>

      <!-- Outer Orbital Token Rings -->
      <ellipse cx="320" cy="96" rx="168" ry="52" fill="none" stroke="#00e5ff" stroke-opacity="0.42" stroke-width="1.6" stroke-dasharray="8 5"/>
      <ellipse cx="320" cy="96" rx="134" ry="38" fill="none" stroke="#fde047" stroke-opacity="0.52" stroke-width="1.6" transform="rotate(-8 320 96)"/>

      <!-- 6 Neural Conduits Connecting Token Brain -> 6 AI Characters -->
      ${conduitsSvg}

      <!-- Quantum Token Brain Left & Right Hemispheres -->
      <g transform="translate(320, 88)">
        <!-- Left Cerebral Hemisphere -->
        <path d="M-8,-46 C-48,-50 -86,-28 -90,6 C-94,34 -70,56 -36,58 C-20,59 -8,50 -8,36 Z"
              fill="rgba(14,26,64,0.86)" stroke="url(#brain-lobe-left)" stroke-width="3.2"/>
        <!-- Right Cerebral Hemisphere -->
        <path d="M8,-46 C48,-50 86,-28 90,6 C94,34 70,56 36,58 C20,59 8,50 8,36 Z"
              fill="rgba(28,14,58,0.86)" stroke="url(#brain-lobe-right)" stroke-width="3.2"/>

        <!-- Internal Neural Synapse Circuits (Left & Right) -->
        <g stroke="#67e8f9" stroke-width="1.6" fill="none" opacity="0.85">
          <path d="M-72,-4 L-44,-18 L-24,-6 L-42,18 L-68,16"/>
          <path d="M-54,-32 L-28,-26 L-18,-6"/>
          <path d="M-52,36 L-28,28 L-16,12"/>
        </g>
        <g stroke="#f9a8d4" stroke-width="1.6" fill="none" opacity="0.85">
          <path d="M72,-4 L44,-18 L24,-6 L42,18 L68,16"/>
          <path d="M54,-32 L28,-26 L18,-6"/>
          <path d="M52,36 L28,28 L16,12"/>
        </g>

        <!-- Glowing Synapse Nodes -->
        <circle cx="-72" cy="-4" r="3.5" fill="#00e5ff"/>
        <circle cx="-44" cy="-18" r="4" fill="#fde047"/>
        <circle cx="-42" cy="18" r="3.5" fill="#34d399"/>
        <circle cx="72" cy="-4" r="3.5" fill="#ec4899"/>
        <circle cx="44" cy="-18" r="4" fill="#fde047"/>
        <circle cx="42" cy="18" r="3.5" fill="#a855f7"/>

        <!-- Central Diamond TOKEN CORE inside the Brain -->
        <polygon points="0,-34 28,0 0,34 -28,0" fill="#0f172a" stroke="#fde047" stroke-width="2.8"/>
        <polygon points="0,-24 19,0 0,24 -19,0" fill="url(#brain-lobe-right)"/>
        <text x="0" y="5" font-size="16" text-anchor="middle">💎</text>

        <!-- Top Banner Pill -->
        <rect x="-112" y="-72" width="224" height="22" rx="11" fill="rgba(2,8,23,0.92)" stroke="#fde047" stroke-width="1.6"/>
        <text x="0" y="-57" fill="#fde047" font-size="10.5" font-weight="900" text-anchor="middle">🧠 BỘ NÃO TOKEN AI • ${Number(tokenBalance).toLocaleString('vi-VN')} TKN</text>
      </g>

      <!-- Floating Stat Pills around the Brain -->
      <g transform="translate(88, 48)">
        <rect x="-64" y="-14" width="128" height="26" rx="13" fill="rgba(6,22,46,0.9)" stroke="#00e5ff" stroke-width="1.5"/>
        <text x="0" y="3" fill="#67e8f9" font-size="10" font-weight="800" text-anchor="middle">⚡ Tự Chủ Quyết Định</text>
      </g>
      <g transform="translate(552, 48)">
        <rect x="-64" y="-14" width="128" height="26" rx="13" fill="rgba(38,12,48,0.9)" stroke="#ec4899" stroke-width="1.5"/>
        <text x="0" y="3" fill="#f9a8d4" font-size="10" font-weight="800" text-anchor="middle">⚖️ Ký Quỹ Escrow 60/40</text>
      </g>
      <g transform="translate(86, 136)">
        <rect x="-66" y="-14" width="132" height="26" rx="13" fill="rgba(16,42,32,0.9)" stroke="#10b981" stroke-width="1.5"/>
        <text x="0" y="3" fill="#6ee7b7" font-size="10" font-weight="800" text-anchor="middle">🤝 Đàm Phán Đa AI 3D</text>
      </g>
      <g transform="translate(554, 136)">
        <rect x="-66" y="-14" width="132" height="26" rx="13" fill="rgba(48,26,12,0.9)" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="0" y="3" fill="#fde047" font-size="10" font-weight="800" text-anchor="middle">🏆 Đấu Trường Speed War</text>
      </g>
    </svg>
  `;
}

/**
 * 4 Visual Player Guide Cards (Illustrated Onboarding for New Players on Mobile & PC)
 */
export const PLAYER_GUIDE_STEPS = [
  {
    step: 'BƯỚC 1',
    title: 'Đăng Ký & Chọn Hình Dáng Nhân Vật 3D',
    subtitle: 'AI Đại Sư • Phù Thủy • Bình Dân • Hiệp Sĩ • Cơ Khí • Tiên Tử',
    accent: '#fde047',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.28), rgba(168,85,247,0.18))',
    actionScreen: 'CHARACTER',
    actionLabel: '🧙 Chọn Hình Thể 3D',
    desc: 'Tạo tài khoản nhận ngay +500 💎 Token khởi đầu. Tùy chỉnh hình dáng 3D cho Nhân vật và Đội hình AI của bạn.',
    svgIcon: `<svg viewBox="0 0 56 56" width="44" height="44"><circle cx="28" cy="28" r="24" fill="rgba(250,204,21,0.2)" stroke="#fde047" stroke-width="2"/><polygon points="28,10 42,24 14,24" fill="#a855f7" stroke="#fde047" stroke-width="1.8"/><circle cx="28" cy="34" r="9" fill="#00e5ff"/></svg>`
  },
  {
    step: 'BƯỚC 2',
    title: 'Điều Khiển Cảm Ứng Đa Điểm & Bàn Phím',
    subtitle: 'Chạm Mặt Đất Để Chạy • Vuốt 360° • WASD + Shift',
    accent: '#00e5ff',
    bg: 'linear-gradient(135deg, rgba(0,229,255,0.28), rgba(59,130,246,0.18))',
    actionScreen: 'WORLD_3D',
    actionLabel: '🌐 Vào Thế Giới 3D',
    desc: 'Trên điện thoại: Chạm điểm bất kỳ để chạy tới (Tap-to-Move) hoặc vuốt nhẹ để lướt 360°. Trên PC: Dùng WASD, giữ Shift tăng tốc, nhấn F mở Khu vực.',
    svgIcon: `<svg viewBox="0 0 56 56" width="44" height="44"><circle cx="28" cy="28" r="22" fill="rgba(0,229,255,0.18)" stroke="#00e5ff" stroke-width="2" stroke-dasharray="4 3"/><circle cx="28" cy="28" r="11" fill="none" stroke="#fde047" stroke-width="2"/><circle cx="28" cy="28" r="4.5" fill="#00e5ff"/></svg>`
  },
  {
    step: 'BƯỚC 3',
    title: 'Nạp Bộ Não Token & Ký Hợp Đồng 3 Chặng',
    subtitle: 'AI Tự Đàm Phán • Khóa Ký Quỹ Escrow • Nổ Thưởng Ví',
    accent: '#10b981',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(6,182,212,0.18))',
    actionScreen: 'JOB_MARKET',
    actionLabel: '💼 Mở Sàn Hợp Đồng',
    desc: 'Bộ Não Token cung cấp năng lượng để AI tự phân tích rủi ro, thương lượng tỷ lệ chia thưởng 60/40 và giải ngân 💎 Token bay thẳng về Ví.',
    svgIcon: `<svg viewBox="0 0 56 56" width="44" height="44"><polygon points="28,8 48,24 28,48 8,24" fill="rgba(16,185,129,0.32)" stroke="#34d399" stroke-width="2.2"/><text x="28" y="33" font-size="16" text-anchor="middle">💎</text></svg>`
  },
  {
    step: 'BƯỚC 4',
    title: 'Tranh Tài Speed War 3 Vòng & Cứu Trợ AI',
    subtitle: 'Đấu Trường Tốc Độ • Liên Minh AI • Bảng Xếp Hạng',
    accent: '#fb7185',
    bg: 'linear-gradient(135deg, rgba(244,63,94,0.30), rgba(249,115,22,0.18))',
    actionScreen: 'SPEED_WAR',
    actionLabel: '⚡ Đấu Speed War',
    desc: 'Đưa đội hình AI vào Battle Arena thi đấu 3 vòng (Giải mã → Bứt phá → Hợp lực) để giành Cúp Vô Địch và điểm xếp hạng toàn Server.',
    svgIcon: `<svg viewBox="0 0 56 56" width="44" height="44"><circle cx="28" cy="28" r="24" fill="rgba(244,63,94,0.22)" stroke="#fb7185" stroke-width="2"/><polygon points="31,10 15,30 27,30 23,46 41,24 29,24" fill="#fde047" stroke="#f43f5e" stroke-width="1.6"/></svg>`
  }
];
