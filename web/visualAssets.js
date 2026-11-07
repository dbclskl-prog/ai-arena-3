/**
 * AI ARENA 3.0 – VISUAL CYBER-ARTWORK & HOLOGRAPHIC UI ENGINE (`create-game-assets` + `threejs-game-ui-designer`)
 * Provides vivid, animated SVG illustrations, AI class portraits, hexagonal radar charts,
 * 3D zone panoramic cards, and visual menu tiles so the game prioritizes graphics over text.
 */

export const AI_CLASS_VISUALS = {
  ANALYST: {
    titleVi: 'PHÂN TÍCH',
    badge: 'LOGIC 98',
    primary: '#00e5ff',
    secondary: '#0284c7',
    bgGradient: 'linear-gradient(135deg, rgba(0,229,255,0.28) 0%, rgba(2,132,199,0.08) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g-ana" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#00e5ff" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="110" rx="12" fill="url(#g-ana)"/>
        <circle cx="80" cy="55" r="38" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>
        <circle cx="80" cy="55" r="26" fill="rgba(0,229,255,0.12)" stroke="#38bdf8" stroke-width="2"/>
        <!-- Neural Nodes -->
        <g stroke="#00e5ff" stroke-width="1.6" opacity="0.9">
          <line x1="80" y1="29" x2="58" y2="48"/>
          <line x1="80" y1="29" x2="102" y2="48"/>
          <line x1="58" y1="48" x2="102" y2="48"/>
          <line x1="58" y1="48" x2="68" y2="74"/>
          <line x1="102" y1="48" x2="92" y2="74"/>
          <line x1="68" y1="74" x2="92" y2="74"/>
          <line x1="80" y1="29" x2="80" y2="74"/>
        </g>
        <circle cx="80" cy="29" r="5" fill="#e0f2fe" stroke="#00e5ff" stroke-width="2"/>
        <circle cx="58" cy="48" r="5" fill="#00e5ff"/>
        <circle cx="102" cy="48" r="5" fill="#00e5ff"/>
        <circle cx="68" cy="74" r="4.5" fill="#38bdf8"/>
        <circle cx="92" cy="74" r="4.5" fill="#38bdf8"/>
        <circle cx="80" cy="53" r="7" fill="#fbbf24"/>
      </svg>
    `
  },
  CODER: {
    titleVi: 'LẬP TRÌNH',
    badge: 'SPEED 95',
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    bgGradient: 'linear-gradient(135deg, rgba(59,130,246,0.32) 0%, rgba(29,78,216,0.08) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g-cod" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="110" rx="12" fill="url(#g-cod)"/>
        <rect x="34" y="20" width="92" height="70" rx="10" fill="rgba(15,23,42,0.85)" stroke="#60a5fa" stroke-width="2"/>
        <circle cx="46" cy="30" r="3" fill="#f43f5e"/>
        <circle cx="56" cy="30" r="3" fill="#fbbf24"/>
        <circle cx="66" cy="30" r="3" fill="#10b981"/>
        <path d="M58 48 L44 58 L58 68" fill="none" stroke="#00e5ff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M102 48 L116 58 L102 68" fill="none" stroke="#00e5ff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="86" y1="44" x2="74" y2="72" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `
  },
  CREATOR: {
    titleVi: 'SÁNG TẠO 3D',
    badge: 'ART 96',
    primary: '#ec4899',
    secondary: '#a855f7',
    bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.30) 0%, rgba(168,85,247,0.08) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g-cre" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#f472b6" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="110" rx="12" fill="url(#g-cre)"/>
        <polygon points="80,18 116,78 44,78" fill="rgba(236,72,153,0.18)" stroke="#f472b6" stroke-width="2.2"/>
        <polygon points="80,90 116,32 44,32" fill="rgba(168,85,247,0.16)" stroke="#c084fc" stroke-width="1.8"/>
        <circle cx="80" cy="55" r="14" fill="#fbbf24" opacity="0.9"/>
        <circle cx="80" cy="55" r="24" fill="none" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="4 3"/>
      </svg>
    `
  },
  GUARDIAN: {
    titleVi: 'BẢO MẬT',
    badge: 'SHIELD 95',
    primary: '#10b981',
    secondary: '#059669',
    bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.30) 0%, rgba(5,150,105,0.08) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g-gua" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="110" rx="12" fill="url(#g-gua)"/>
        <path d="M80 16 L118 30 L118 58 C118 78 100 92 80 98 C60 92 42 78 42 58 L42 30 Z" fill="rgba(16,185,129,0.20)" stroke="#34d399" stroke-width="2.5"/>
        <path d="M66 56 L76 66 L96 44" fill="none" stroke="#a7f3d0" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  },
  TRADER: {
    titleVi: 'GIAO DỊCH',
    badge: 'TOKEN 94',
    primary: '#f59e0b',
    secondary: '#d97706',
    bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.32) 0%, rgba(217,119,6,0.08) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g-tra" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="110" rx="12" fill="url(#g-tra)"/>
        <rect x="42" y="58" width="12" height="28" rx="3" fill="#34d399"/>
        <rect x="64" y="44" width="12" height="42" rx="3" fill="#38bdf8"/>
        <rect x="86" y="34" width="12" height="52" rx="3" fill="#fbbf24"/>
        <rect x="108" y="22" width="12" height="64" rx="3" fill="#00e5ff"/>
        <polyline points="42,52 68,38 92,28 116,16" fill="none" stroke="#fde047" stroke-width="3" stroke-linecap="round"/>
        <circle cx="116" cy="16" r="5" fill="#fde047"/>
      </svg>
    `
  },
  MANAGER: {
    titleVi: 'CHỈ HUY',
    badge: 'COMMAND 99',
    primary: '#a855f7',
    secondary: '#6366f1',
    bgGradient: 'linear-gradient(135deg, rgba(168,85,247,0.32) 0%, rgba(99,102,241,0.08) 100%)',
    svgPortrait: `
      <svg viewBox="0 0 160 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g-man" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#c084fc" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="160" height="110" rx="12" fill="url(#g-man)"/>
        <polygon points="44,74 52,36 80,54 108,36 116,74" fill="rgba(168,85,247,0.28)" stroke="#fde047" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="52" cy="32" r="4.5" fill="#00e5ff"/>
        <circle cx="80" cy="24" r="5.5" fill="#fde047"/>
        <circle cx="108" cy="32" r="4.5" fill="#00e5ff"/>
        <rect x="44" y="78" width="72" height="7" rx="3.5" fill="#fde047"/>
      </svg>
    `
  }
};

/**
 * Generate a glowing 6-axis Hexagonal Radar SVG for an AI Agent's stats (Replaces text stat lists!)
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
      `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#bae6fd" font-size="8.5" font-weight="800" text-anchor="middle">${st.label} ${st.val}</text>`
    );
  });

  return `
    <svg viewBox="0 0 130 124" width="128" height="122" style="overflow:visible;flex-shrink:0;">
      <polygon points="${pointsOuter.join(' ')}" fill="rgba(2,12,28,0.75)" stroke="rgba(56,189,248,0.35)" stroke-width="1.2"/>
      <polygon points="${pointsMid.join(' ')}" fill="none" stroke="rgba(56,189,248,0.18)" stroke-dasharray="2 2" stroke-width="1"/>
      <polygon points="${pointsVal.join(' ')}" fill="${color}44" stroke="${color}" stroke-width="2.2"/>
      ${labelsHtml.join('')}
    </svg>
  `;
}

/**
 * 19 Visual Menu Tiles with Custom Holographic Artwork, Short Visual Titles & Color-Coded Glows
 */
export const VISUAL_MENU_ITEMS = [
  {
    screen: 'WORLD_3D',
    category: 'CORE',
    icon: '🌐',
    shortTitle: 'Thế Giới 3D',
    subTag: 'LIVE PLAY',
    accent: '#00e5ff',
    bg: 'linear-gradient(135deg, rgba(0,229,255,0.28), rgba(2,132,199,0.08))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="none" stroke="#00e5ff" stroke-width="2.5"/><ellipse cx="32" cy="32" rx="10" ry="22" fill="none" stroke="#38bdf8" stroke-width="1.8"/><line x1="10" y1="32" x2="54" y2="32" stroke="#00e5ff" stroke-width="1.8"/></svg>`
  },
  {
    screen: 'SPEED_WAR',
    category: 'ARENA',
    icon: '⚡',
    shortTitle: 'Speed War',
    subTag: '3 VÒNG ĐẤU',
    accent: '#f43f5e',
    bg: 'linear-gradient(135deg, rgba(244,63,94,0.32), rgba(159,18,57,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><polygon points="36,8 14,36 30,36 26,56 50,26 34,26" fill="rgba(244,63,94,0.35)" stroke="#fb7185" stroke-width="2.5" stroke-linejoin="round"/></svg>`
  },
  {
    screen: 'AI_MANAGER',
    category: 'AI',
    icon: '🤖',
    shortTitle: 'Đội Hình AI',
    subTag: '6 CLASS',
    accent: '#38bdf8',
    bg: 'linear-gradient(135deg, rgba(56,189,248,0.28), rgba(30,64,175,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="14" y="18" width="36" height="30" rx="8" fill="rgba(56,189,248,0.25)" stroke="#38bdf8" stroke-width="2.5"/><circle cx="25" cy="32" r="4" fill="#00e5ff"/><circle cx="39" cy="32" r="4" fill="#00e5ff"/><line x1="32" y1="8" x2="32" y2="18" stroke="#fbbf24" stroke-width="2.5"/><circle cx="32" cy="8" r="3.5" fill="#fbbf24"/></svg>`
  },
  {
    screen: 'JOB_MARKET',
    category: 'ARENA',
    icon: '💼',
    shortTitle: 'Sàn Hợp Đồng',
    subTag: '+TOKEN',
    accent: '#fbbf24',
    bg: 'linear-gradient(135deg, rgba(251,191,36,0.28), rgba(180,83,9,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="12" y="20" width="40" height="30" rx="6" fill="rgba(251,191,36,0.22)" stroke="#fbbf24" stroke-width="2.5"/><path d="M24 20 V15 C24 13 26 12 28 12 H36 C38 12 40 13 40 15 V20" fill="none" stroke="#fde047" stroke-width="2.5"/><circle cx="32" cy="35" r="5" fill="#fde047"/></svg>`
  },
  {
    screen: 'WORLD_MAP',
    category: 'CORE',
    icon: '🗺️',
    shortTitle: 'Bản Đồ 3D',
    subTag: '9 KHU VỰC',
    accent: '#10b981',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(6,95,70,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><polygon points="10,16 25,12 39,18 54,12 54,48 39,52 25,46 10,52" fill="rgba(16,185,129,0.22)" stroke="#34d399" stroke-width="2.4"/><circle cx="32" cy="30" r="5" fill="#fbbf24"/></svg>`
  },
  {
    screen: 'TOKEN_WALLET',
    category: 'ECONOMY',
    icon: '💎',
    shortTitle: 'Ví Token',
    subTag: 'SỔ CÁI',
    accent: '#2dd4bf',
    bg: 'linear-gradient(135deg, rgba(45,212,191,0.28), rgba(15,118,110,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><polygon points="32,10 52,26 32,54 12,26" fill="rgba(45,212,191,0.3)" stroke="#5eead4" stroke-width="2.5"/></svg>`
  },
  {
    screen: 'AI_SOCIAL',
    category: 'AI',
    icon: '🤝',
    shortTitle: 'Mạng XH AI',
    subTag: 'KẾT BẠN',
    accent: '#a855f7',
    bg: 'linear-gradient(135deg, rgba(168,85,247,0.28), rgba(107,33,168,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="20" cy="24" r="8" fill="rgba(168,85,247,0.35)" stroke="#c084fc" stroke-width="2.2"/><circle cx="44" cy="24" r="8" fill="rgba(0,229,255,0.35)" stroke="#38bdf8" stroke-width="2.2"/><circle cx="32" cy="46" r="8" fill="rgba(251,191,36,0.35)" stroke="#fbbf24" stroke-width="2.2"/><line x1="26" y1="28" x2="38" y2="28" stroke="#e9d5ff" stroke-width="2"/><line x1="23" y1="31" x2="29" y2="40" stroke="#e9d5ff" stroke-width="2"/><line x1="41" y1="31" x2="35" y2="40" stroke="#e9d5ff" stroke-width="2"/></svg>`
  },
  {
    screen: 'AI_COLLAB',
    category: 'AI',
    icon: '🧩',
    shortTitle: 'Hợp Tác AI',
    subTag: 'LIÊN MINH',
    accent: '#ec4899',
    bg: 'linear-gradient(135deg, rgba(236,72,153,0.28), rgba(157,23,77,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="14" y="14" width="18" height="18" rx="4" fill="rgba(236,72,153,0.3)" stroke="#f472b6" stroke-width="2.2"/><rect x="32" y="32" width="18" height="18" rx="4" fill="rgba(0,229,255,0.3)" stroke="#00e5ff" stroke-width="2.2"/><path d="M32 23 H42 V32" fill="none" stroke="#fbbf24" stroke-width="2.5"/></svg>`
  },
  {
    screen: 'AI_TRADING',
    category: 'AI',
    icon: '⚖️',
    shortTitle: 'Đàm Phán',
    subTag: 'ESCROW',
    accent: '#f97316',
    bg: 'linear-gradient(135deg, rgba(249,115,22,0.28), rgba(154,52,18,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><line x1="32" y1="12" x2="32" y2="52" stroke="#fdba74" stroke-width="2.8"/><line x1="14" y1="22" x2="50" y2="22" stroke="#fb923c" stroke-width="2.5"/><polygon points="14,22 8,36 20,36" fill="rgba(249,115,22,0.35)" stroke="#fdba74" stroke-width="1.8"/><polygon points="50,22 44,36 56,36" fill="rgba(249,115,22,0.35)" stroke="#fdba74" stroke-width="1.8"/></svg>`
  },
  {
    screen: 'AI_RESCUE',
    category: 'ECONOMY',
    icon: '🆘',
    shortTitle: 'Cứu Trợ AI',
    subTag: 'MUA LẠI',
    accent: '#ef4444',
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.28), rgba(153,27,27,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="rgba(239,68,68,0.22)" stroke="#f87171" stroke-width="2.5"/><path d="M32 20 V44 M20 32 H44" stroke="#fca5a5" stroke-width="4" stroke-linecap="round"/></svg>`
  },
  {
    screen: 'CHARACTER',
    category: 'CORE',
    icon: '🧑‍🚀',
    shortTitle: 'Giáp 3D',
    subTag: 'SKIN NEON',
    accent: '#60a5fa',
    bg: 'linear-gradient(135deg, rgba(96,165,250,0.28), rgba(30,58,138,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="20" r="9" fill="rgba(96,165,250,0.35)" stroke="#60a5fa" stroke-width="2.2"/><path d="M16 52 C16 38 48 38 48 52" fill="rgba(96,165,250,0.25)" stroke="#38bdf8" stroke-width="2.5"/></svg>`
  },
  {
    screen: 'AUTH',
    category: 'CORE',
    icon: '🔐',
    shortTitle: 'Tài Khoản',
    subTag: 'MẬT KHẨU',
    accent: '#34d399',
    bg: 'linear-gradient(135deg, rgba(52,211,153,0.28), rgba(6,78,59,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="16" y="28" width="32" height="24" rx="6" fill="rgba(52,211,153,0.25)" stroke="#34d399" stroke-width="2.5"/><path d="M22 28 V20 C22 14 42 14 42 20 V28" fill="none" stroke="#6ee7b7" stroke-width="2.5"/><circle cx="32" cy="40" r="3.5" fill="#fde047"/></svg>`
  },
  {
    screen: 'WORLD_LOBBY',
    category: 'ARENA',
    icon: '🎮',
    shortTitle: 'Phòng Đấu',
    subTag: 'MULTIPLAYER',
    accent: '#818cf8',
    bg: 'linear-gradient(135deg, rgba(129,140,248,0.28), rgba(49,46,129,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="10" y="22" width="44" height="24" rx="10" fill="rgba(129,140,248,0.25)" stroke="#818cf8" stroke-width="2.5"/><circle cx="22" cy="34" r="4" fill="#38bdf8"/><circle cx="42" cy="31" r="3" fill="#fbbf24"/><circle cx="46" cy="37" r="3" fill="#f43f5e"/></svg>`
  },
  {
    screen: 'MATCH_ROOM',
    category: 'ARENA',
    icon: '⚔️',
    shortTitle: 'Dàn Trận',
    subTag: 'READY',
    accent: '#fb7185',
    bg: 'linear-gradient(135deg, rgba(251,113,133,0.28), rgba(136,19,55,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><line x1="14" y1="50" x2="50" y2="14" stroke="#fb7185" stroke-width="3.5" stroke-linecap="round"/><line x1="50" y1="50" x2="14" y2="14" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/></svg>`
  },
  {
    screen: 'TOKEN_EXCHANGE',
    category: 'ECONOMY',
    icon: '🔄',
    shortTitle: 'Cấp Vốn AI',
    subTag: 'EXCHANGE',
    accent: '#fbbf24',
    bg: 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(120,53,15,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><path d="M16 24 H46 L38 16 M48 40 H18 L26 48" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  {
    screen: 'CORPORATION',
    category: 'ECONOMY',
    icon: '🏢',
    shortTitle: 'Tập Đoàn AI',
    subTag: 'CLAN',
    accent: '#c084fc',
    bg: 'linear-gradient(135deg, rgba(192,132,252,0.28), rgba(88,28,135,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><rect x="18" y="14" width="28" height="40" rx="4" fill="rgba(192,132,252,0.25)" stroke="#c084fc" stroke-width="2.4"/><rect x="24" y="22" width="6" height="6" fill="#00e5ff"/><rect x="34" y="22" width="6" height="6" fill="#00e5ff"/><rect x="24" y="34" width="6" height="6" fill="#fbbf24"/><rect x="34" y="34" width="6" height="6" fill="#fbbf24"/></svg>`
  },
  {
    screen: 'LEADERBOARD',
    category: 'COMMUNITY',
    icon: '🏆',
    shortTitle: 'Xếp Hạng',
    subTag: 'TOP PRO',
    accent: '#fde047',
    bg: 'linear-gradient(135deg, rgba(253,224,71,0.28), rgba(161,98,7,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><path d="M20 14 H44 V28 C44 36 38 42 32 42 C26 42 20 36 20 28 Z" fill="rgba(253,224,71,0.3)" stroke="#fde047" stroke-width="2.5"/><line x1="32" y1="42" x2="32" y2="52" stroke="#fde047" stroke-width="3"/><line x1="22" y1="52" x2="42" y2="52" stroke="#fde047" stroke-width="3"/></svg>`
  },
  {
    screen: 'PROFILE',
    category: 'COMMUNITY',
    icon: '🛡️',
    shortTitle: 'An Toàn',
    subTag: 'HỒ SƠ',
    accent: '#38bdf8',
    bg: 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(12,74,110,0.10))',
    artSvg: `<svg viewBox="0 0 64 64"><path d="M32 10 L50 18 V34 C50 45 42 52 32 56 C22 52 14 45 14 34 V18 Z" fill="rgba(56,189,248,0.25)" stroke="#38bdf8" stroke-width="2.4"/></svg>`
  },
  {
    screen: 'ADMIN',
    category: 'COMMUNITY',
    icon: '🛠️',
    shortTitle: 'Hệ Thống',
    subTag: 'ADMIN',
    accent: '#94a3b8',
    bg: 'linear-gradient(135deg, rgba(148,163,184,0.25), rgba(30,41,59,0.15))',
    artSvg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="14" fill="rgba(148,163,184,0.25)" stroke="#cbd5e1" stroke-width="2.5"/><circle cx="32" cy="32" r="5" fill="#00e5ff"/></svg>`
  }
];

/**
 * Generate Isometric / Panoramic Cyber-Artwork SVG for each of the 9 3D World Zones
 */
export function renderZoneIllustrationSvg(zone) {
  const color = zone.color || '#00e5ff';
  return `
    <svg viewBox="0 0 260 110" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="zg-${zone.id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.38"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0.92"/>
        </linearGradient>
      </defs>
      <rect width="260" height="110" rx="10" fill="url(#zg-${zone.id})"/>
      <!-- Perspective Cyber Grid -->
      <g stroke="${color}" stroke-opacity="0.24" stroke-width="1">
        <line x1="0" y1="84" x2="260" y2="84"/>
        <line x1="0" y1="98" x2="260" y2="98"/>
        <line x1="130" y1="52" x2="20" y2="110"/>
        <line x1="130" y1="52" x2="85" y2="110"/>
        <line x1="130" y1="52" x2="175" y2="110"/>
        <line x1="130" y1="52" x2="240" y2="110"/>
      </g>
      <!-- 3D Architectural Silhouette -->
      <ellipse cx="130" cy="82" rx="58" ry="14" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="5 3"/>
      <polygon points="130,16 164,46 152,82 108,82 96,46" fill="rgba(2,12,27,0.75)" stroke="${color}" stroke-width="2.2"/>
      <circle cx="130" cy="44" r="11" fill="${color}" opacity="0.88"/>
      <circle cx="130" cy="44" r="19" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="1.2"/>
    </svg>
  `;
}
