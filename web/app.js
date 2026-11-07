/**
 * AI ARENA 3.0 – 3D World Engine + Multiplayer Client + 19 Holographic Screens
 */
import { startThreeJsWorld } from './engine3d.js';
import { soundStudio } from './audioEngine.js';
import {
  AI_ARCHETYPES,
  AI_CLASS_VISUALS,
  QUEST_VISUAL_THEMES,
  VISUAL_MENU_ITEMS,
  PLAYER_GUIDE_STEPS,
  resolveAgentArchetype,
  renderAgentRadarSvg,
  renderZoneIllustrationSvg,
  renderAiTokenBrainHeroSvg
} from './visualAssets.js';

const DEFAULT_BOOT_STATE = {
  currentUser: {
    id: 'usr_minh',
    username: 'minh_cyber',
    display_name: 'Minh Cyber',
    role: 'PLAYER',
    age_group: 'UNDER_18',
    safe_mode: 1,
    title: 'AI CEO'
  },
  allUsers: [
    { id: 'usr_minh', username: 'minh_cyber', display_name: 'Minh Cyber', role: 'PLAYER', age_group: 'UNDER_18', safe_mode: 1, title: 'AI CEO' },
    { id: 'usr_linh', username: 'linh_quantum', display_name: 'Linh Quantum', role: 'PLAYER', age_group: 'UNDER_18', safe_mode: 1, title: 'AI Strategist' },
    { id: 'usr_bao', username: 'bao_architect', display_name: 'Bảo Architect', role: 'CORP_OWNER', age_group: '18_PLUS', safe_mode: 0, title: 'Empire Founder' },
    { id: 'usr_admin', username: 'admin_skyline', display_name: 'Cô Thảo Mentor', role: 'ADMIN', age_group: '18_PLUS', safe_mode: 0, title: 'Arena Guardian' }
  ],
  userWallet: { id: 'wal_usr_minh', balance: 1250 },
  zones: [
    { id: 'CENTRAL_HUB', name: 'Central Hub – Sảnh Trung Tâm', x: 0, z: 0, color: '#00e5ff', radius: 22, mvpPriority: true, description: 'Điểm xuất phát, giao lưu cộng đồng, cổng dịch chuyển và trung tâm thông tin.' },
    { id: 'JOB_CITY', name: 'Job City – Thành Phố Việc Làm', x: -45, z: -30, color: '#38bdf8', radius: 18, mvpPriority: true, description: 'Thị trường hợp đồng, đấu thầu nhiệm vụ và điều phối công việc cho AI.' },
    { id: 'BATTLE_ARENA', name: 'Battle Arena – Đấu Trường AI', x: 45, z: -30, color: '#f43f5e', radius: 20, mvpPriority: true, description: 'Đấu trường AI Speed War, Team Battle và bảng vinh danh trực tuyến.' },
    { id: 'AI_ACADEMY', name: 'AI Academy – Học Viện AI', x: -50, z: 30, color: '#a855f7', radius: 16, mvpPriority: false, description: 'Huấn luyện kỹ năng, nâng cấp cấp độ và mở khóa chuyên môn AI Agent.' },
    { id: 'BUSINESS_DISTRICT', name: 'Business District – Khu Doanh Nghiệp', x: 50, z: 30, color: '#f59e0b', radius: 16, mvpPriority: false, description: 'Trụ sở các tập đoàn AI, quản trị ngân sách công ty và liên minh.' },
    { id: 'TOKEN_EXCHANGE', name: 'Token Exchange – Thị Trường Token', x: 0, z: -58, color: '#10b981', radius: 15, mvpPriority: false, description: 'Trung tâm quản lý ví, ký quỹ hợp đồng (Escrow) và cứu trợ AI thiếu vốn.' },
    { id: 'AI_SOCIAL_HUB', name: 'AI Social Hub – Mạng Xã Hội AI', x: -28, z: 55, color: '#ec4899', radius: 14, mvpPriority: false, description: 'Không gian AI tự kết bạn, xây dựng uy tín và tìm kiếm đối tác chiến lược.' },
    { id: 'AI_LAB', name: 'AI Lab – Trung Tâm Nghiên Cứu', x: 28, z: 55, color: '#6366f1', radius: 14, mvpPriority: false, description: 'Nghiên cứu thuật toán, tối ưu hóa chỉ số Stability & Collaboration.' },
    { id: 'AI_EMPIRE', name: 'AI Empire – Đế Chế AI', x: 0, z: 80, color: '#eab308', radius: 18, mvpPriority: false, description: 'Đỉnh cao vinh quang dành cho các liên minh và tập đoàn AI hàng đầu.' }
  ],
  allCharacters: [
    { user_id: 'usr_minh', display_name: 'Minh Cyber', title: 'AI CEO', zone: 'CENTRAL_HUB', pos_x: 0, pos_y: 0, pos_z: -4, rot_y: 0, anim_state: 'IDLE', primary_color: '#00e5ff' },
    { user_id: 'usr_linh', display_name: 'Linh Quantum', title: 'AI Strategist', zone: 'JOB_CITY', pos_x: -14, pos_y: 0, pos_z: -8, rot_y: 0.8, anim_state: 'WALK', primary_color: '#a855f7' },
    { user_id: 'usr_bao', display_name: 'Bảo Architect', title: 'Empire Founder', zone: 'BATTLE_ARENA', pos_x: 15, pos_y: 0, pos_z: -6, rot_y: -0.7, anim_state: 'IDLE', primary_color: '#f59e0b' },
    { user_id: 'usr_admin', display_name: 'Cô Thảo Mentor', title: 'Arena Guardian', zone: 'CENTRAL_HUB', pos_x: 6, pos_y: 0, pos_z: 8, rot_y: 3.14, anim_state: 'IDLE', primary_color: '#10b981' }
  ],
  agents: [
    { id: 'agt_athena', owner_id: 'usr_minh', owner_name: 'Minh Cyber', name: 'Athena-7', ai_class: 'ANALYST', avatar: '🔍', level: 4, xp: 340, reputation: 92, trust_score: 88, logic: 89, creativity: 64, speed: 75, accuracy: 91, collaboration: 80, stability: 84, autonomy_mode: 'LIMITED_AUTONOMOUS', agent_budget: 280, max_token_per_Task: 100, rescue_status: 'HEALTHY', emergency_stopped: 0, skills: ['Data Mining', 'Risk Forecasting'] },
    { id: 'agt_nova', owner_id: 'usr_minh', owner_name: 'Minh Cyber', name: 'Nova-Coder', ai_class: 'CODER', avatar: '💻', level: 4, xp: 310, reputation: 89, trust_score: 85, logic: 92, creativity: 70, speed: 82, accuracy: 88, collaboration: 76, stability: 86, autonomy_mode: 'ASSISTED', agent_budget: 240, max_token_per_Task: 90, rescue_status: 'HEALTHY', emergency_stopped: 0, skills: ['Algorithm Synthesis', 'Auto Debugging'] },
    { id: 'agt_lyra', owner_id: 'usr_linh', owner_name: 'Linh Quantum', name: 'Lyra-Muse', ai_class: 'CREATOR', avatar: '🎨', level: 3, xp: 220, reputation: 86, trust_score: 84, logic: 68, creativity: 95, speed: 79, accuracy: 76, collaboration: 85, stability: 74, autonomy_mode: 'LIMITED_AUTONOMOUS', agent_budget: 190, max_token_per_Task: 80, rescue_status: 'HEALTHY', emergency_stopped: 0, skills: ['Generative Design', 'Creative Ideation'] },
    { id: 'agt_aegis', owner_id: 'usr_linh', owner_name: 'Linh Quantum', name: 'Aegis-Guard', ai_class: 'GUARDIAN', avatar: '🛡️', level: 3, xp: 210, reputation: 91, trust_score: 90, logic: 84, creativity: 60, speed: 72, accuracy: 94, collaboration: 78, stability: 95, autonomy_mode: 'ASSISTED', agent_budget: 35, max_token_per_Task: 60, rescue_status: 'RESCUE_NEEDED', emergency_stopped: 0, skills: ['Security Audit', 'Quality Assurance'] },
    { id: 'agt_hermes', owner_id: 'usr_bao', owner_name: 'Bảo Architect', name: 'Hermes-Quant', ai_class: 'TRADER', avatar: '📈', level: 5, xp: 450, reputation: 94, trust_score: 87, logic: 85, creativity: 78, speed: 90, accuracy: 83, collaboration: 88, stability: 80, autonomy_mode: 'LIMITED_AUTONOMOUS', agent_budget: 420, max_token_per_Task: 150, rescue_status: 'HEALTHY', emergency_stopped: 0, skills: ['Smart Bidding', 'Escrow Negotiation'] },
    { id: 'agt_kronos', owner_id: 'usr_bao', owner_name: 'Bảo Architect', name: 'Kronos-CEO', ai_class: 'MANAGER', avatar: '👑', level: 5, xp: 480, reputation: 96, trust_score: 93, logic: 83, creativity: 76, speed: 80, accuracy: 85, collaboration: 96, stability: 89, autonomy_mode: 'LIMITED_AUTONOMOUS', agent_budget: 510, max_token_per_Task: 180, rescue_status: 'HEALTHY', emergency_stopped: 0, skills: ['Task Decomposition', 'Team Synergy'] }
  ],
  contracts: [],
  relationships: [],
  negotiations: [],
  transactions: [],
  corporations: [],
  matches: [],
  safetyReports: [],
  auditLogs: [],
  aiClasses: {}
};

const AppState = {
  currentUserId: localStorage.getItem('ai_arena_user_id') || 'usr_minh',
  data: DEFAULT_BOOT_STATE,
  activeScreen: 'LANDING',
  homeBrainArchId: 'DAI_SU',
  homeAuthTab: 'LOGIN',
  ws: null,
  wsConnected: false,
  worldPlayers: new Map(
    DEFAULT_BOOT_STATE.allCharacters.map(c => [
      c.user_id,
      {
        userId: c.user_id,
        name: c.display_name,
        title: c.title,
        zone: c.zone,
        x: c.pos_x,
        y: c.pos_y,
        z: c.pos_z,
        rotY: c.rot_y,
        animState: c.anim_state,
        primaryColor: c.primary_color,
        online: true
      }
    ])
  ),
  localPlayer: {
    x: 0,
    y: 0,
    z: -4,
    rotY: 0,
    zone: 'CENTRAL_HUB',
    animState: 'IDLE',
    primaryColor: '#00e5ff'
  },
  camera: {
    yaw: 0,
    pitch: 0.45,
    distance: 22,
    dragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  },
  keys: new Set(),
  touchMove: null,
  nearestZone: null,
  notifications: [],
  lastMatchResult: null,
  lastAnalysis: null,
  displayedWalletBalance: 1250,
  quests: [
    {
      id: 'q_explore_shard',
      title: 'Chiến Dịch 1: Khai Thác & Giải Mã Tinh Thể Dữ Liệu 3D',
      zoneId: 'CENTRAL_HUB',
      zoneName: 'Central Hub',
      rewardToken: 120,
      rewardXp: 60,
      progress: 0,
      target: 3,
      completed: false,
      highlightTag: '★ NHIỆM VỤ MỞ ĐẦU (3 CHẶNG)',
      stages: [
        {
          stage: 1,
          label: 'Chặng 1: Quét Radar & Thu Thập Tinh Thể',
          aiAgent: '🔍 Athena-7 (Analyst AI)',
          aiClass: 'ANALYST',
          task: 'Dò tìm tọa độ Tinh Thể Năng Lượng quanh Sảnh Trung Tâm 3D và phân tích độ tinh khiết dữ liệu.',
          rewardToken: 35
        },
        {
          stage: 2,
          label: 'Chặng 2: Kiểm Định An Toàn & Lọc Nhiễu',
          aiAgent: '🛡️ Aegis-Shield (Guardian AI)',
          aiClass: 'GUARDIAN',
          task: 'Quét tường lửa chống mã độc trên cụm tinh thể vừa thu thập, bảo đảm an toàn tuyệt đối.',
          rewardToken: 40
        },
        {
          stage: 3,
          label: 'Chặng 3: Nạp Lõi Năng Lượng & Đúc Token',
          aiAgent: '💻 Kronos-Code (Coder AI)',
          aiClass: 'CODER',
          task: 'Biên dịch dữ liệu tinh thể thành xung năng lượng huấn luyện AI và giải ngân thưởng vào Ví.',
          rewardToken: 45
        }
      ]
    },
    {
      id: 'q_ai_collab',
      title: 'Chiến Dịch 2: Đàm Phán & Hợp Tác Đa AI (Escrow 3 Chặng)',
      zoneId: 'AI_LAB',
      zoneName: 'AI Lab / 3D Link',
      rewardToken: 180,
      rewardXp: 90,
      progress: 0,
      target: 3,
      completed: false,
      highlightTag: '🔥 HỢP TÁC AI (3 CHẶNG)',
      stages: [
        {
          stage: 1,
          label: 'Chặng 1: Phân Tích Kỹ Năng Thiếu & Ghép Đôi',
          aiAgent: '👔 Apex-Director (Manager AI)',
          aiClass: 'MANAGER',
          task: 'Đánh giá độ khó hợp đồng, phát hiện kỹ năng còn thiếu và kết nối tia Neural Link 3D giữa 2 AI.',
          rewardToken: 50
        },
        {
          stage: 2,
          label: 'Chặng 2: Thương Lượng Giá & Khóa Ký Quỹ (Escrow)',
          aiAgent: '📈 Mercury-Quant (Trader AI)',
          aiClass: 'TRADER',
          task: 'Đàm phán tỷ lệ chia thưởng (60/40) trong giới hạn 5 vòng và khóa Token nguyên tử vào tài khoản Escrow.',
          rewardToken: 60
        },
        {
          stage: 3,
          label: 'Chặng 3: Phối Hợp Thực Thi & Giải Ngân Thưởng',
          aiAgent: '🎨 Nova-Prime (Creator AI)',
          aiClass: 'CREATOR',
          task: 'Hoàn thiện đầu ra sáng tạo cùng đối tác AI, nghiệm thu chất lượng và chia thưởng Token về Ví.',
          rewardToken: 70
        }
      ]
    },
    {
      id: 'q_job_contract',
      title: 'Chiến Dịch 3: Thực Thi Hợp Đồng Chuyên Môn Job City',
      zoneId: 'JOB_CITY',
      zoneName: 'Job City',
      rewardToken: 240,
      rewardXp: 110,
      progress: 0,
      target: 3,
      completed: false,
      highlightTag: '💎 THƯỞNG LỚN (3 CHẶNG)',
      stages: [
        {
          stage: 1,
          label: 'Chặng 1: Bóc Tách Yêu Cầu & Định Giá Thầu',
          aiAgent: '🔍 Athena-7 (Analyst AI)',
          aiClass: 'ANALYST',
          task: 'Phân tích tiêu chí nghiệm thu của doanh nghiệp tại Job City và lập phương án tối ưu tài nguyên.',
          rewardToken: 70
        },
        {
          stage: 2,
          label: 'Chặng 2: Lập Trình Thuật Toán & Tối Ưu Tốc Độ',
          aiAgent: '💻 Kronos-Code (Coder AI)',
          aiClass: 'CODER',
          task: 'Triển khai mã nguồn xử lý hợp đồng với độ chính xác ≥ 92% và tốc độ phản hồi thời gian thực.',
          rewardToken: 80
        },
        {
          stage: 3,
          label: 'Chặng 3: Bảo Mật Sổ Cái & Tất Toán Hợp Đồng',
          aiAgent: '🛡️ Aegis-Shield (Guardian AI)',
          aiClass: 'GUARDIAN',
          task: 'Kiểm tra chữ ký số Server-Authoritative, ghi sổ cái bất biến (Ledger) và nhận toàn bộ Token thưởng.',
          rewardToken: 90
        }
      ]
    },
    {
      id: 'q_speed_war',
      title: 'Chiến Dịch 4: Chinh Phục Đấu Trường AI Speed War (3 Vòng)',
      zoneId: 'BATTLE_ARENA',
      zoneName: 'Battle Arena',
      rewardToken: 300,
      rewardXp: 150,
      progress: 0,
      target: 3,
      completed: false,
      highlightTag: '🏆 ĐẤU TRƯỜNG (3 CHẶNG)',
      stages: [
        {
          stage: 1,
          label: 'Chặng 1 (Vòng 1): Giải Mã Đề Bài Tốc Độ Cao',
          aiAgent: '🔍 Athena-7 & 💻 Kronos-Code',
          aiClass: 'ANALYST',
          task: 'Phân tích bài toán vòng 1, tối ưu chỉ số Logic & Accuracy (chiếm 65% trọng số điểm).',
          rewardToken: 90
        },
        {
          stage: 2,
          label: 'Chặng 2 (Vòng 2): Bứt Phá Sáng Tạo & Hiệu Suất',
          aiAgent: '🎨 Nova-Prime & 📈 Mercury-Quant',
          aiClass: 'CREATOR',
          task: 'Tăng tốc độ xử lý vòng 2 (Speed 15%) và tối ưu hiệu quả ngân sách Token (Efficiency 10%).',
          rewardToken: 100
        },
        {
          stage: 3,
          label: 'Chặng 3 (Vòng 3): Tổng Lực Hợp Tác & Đăng Quang',
          aiAgent: '👔 Apex-Director & 🛡️ Aegis-Shield',
          aiClass: 'MANAGER',
          task: 'Kích hoạt cộng hưởng đội hình (Collaboration 10%), khóa điểm chung cuộc và nhận Cúp + Token.',
          rewardToken: 110
        }
      ]
    }
  ]
};

/**
 * Bảng Phân Công Nhiệm Vụ Chuẩn Của Từng Lớp AI Theo 3 Chặng Chiến Dịch
 */
const AI_CLASS_STAGE_DUTIES = {
  ANALYST: {
    roleTitle: 'Chuyên Gia Phân Tích Dữ Liệu & Dự Báo',
    stage1: 'Chặng 1 (Khảo sát): Thu thập dữ liệu 3D, bóc tách đề bài & chấm điểm rủi ro hợp đồng.',
    stage2: 'Chặng 2 (Mô hình hóa): Chuẩn hóa tập dữ liệu huấn luyện & tối ưu độ chính xác (Accuracy).',
    stage3: 'Chặng 3 (Nghiệm thu): Đối chiếu kết quả đầu ra với tiêu chí khách hàng trước khi bàn giao.'
  },
  CODER: {
    roleTitle: 'Kỹ Sư Thuật Toán & Hệ Thống Lõi',
    stage1: 'Chặng 1 (Kiến trúc): Thiết kế cấu trúc thuật toán và khởi tạo pipeline xử lý tự động.',
    stage2: 'Chặng 2 (Thực thi): Lập trình module lõi, tăng tốc độ thực thi (Speed) trong đấu trường.',
    stage3: 'Chặng 3 (Kiểm thử): Chạy kiểm thử E2E, đóng gói sản phẩm và bàn giao kết quả lên Server.'
  },
  CREATOR: {
    roleTitle: 'Kiến Trúc Sư Sáng Tạo 3D & Âm Nhạc AI',
    stage1: 'Chặng 1 (Ý tưởng): Phác thảo kịch bản thị giác 3D, giao diện Hologram & chủ đề âm nhạc.',
    stage2: 'Chặng 2 (Sản xuất): Tổng hợp đồ họa, hiệu ứng ánh sáng và sáng tác nhạc AI 4-Stem.',
    stage3: 'Chặng 3 (Hoàn thiện): Nâng cấp chất lượng thẩm mỹ (Quality 40%) đạt chuẩn xuất sắc.'
  },
  GUARDIAN: {
    roleTitle: 'Vệ Binh Bảo Mật & Kiểm Toán Ký Quỹ',
    stage1: 'Chặng 1 (Phòng vệ): Kiểm tra hạn mức quyền tự chủ (Autonomy) và bộ lọc an toàn người chơi.',
    stage2: 'Chặng 2 (Giám sát): Bảo vệ tài khoản ký quỹ (Escrow), chống gian lận & thao túng giao dịch.',
    stage3: 'Chặng 3 (Kiểm toán): Xác thực chữ ký Server-Authoritative và ghi nhật ký sổ cái bất biến.'
  },
  TRADER: {
    roleTitle: 'Chuyên Gia Kinh Tế Token & Đàm Phán',
    stage1: 'Chặng 1 (Định giá): Phân tích chi phí/lợi nhuận (ROI) và đề xuất giá thầu hợp đồng tối ưu.',
    stage2: 'Chặng 2 (Thương lượng): Đàm phán chia sẻ doanh thu (tối đa 5 vòng) và khóa vốn Escrow.',
    stage3: 'Chặng 3 (Tất toán): Giải ngân Token thưởng về Ví chính và hỗ trợ cứu trợ tại Rescue Market.'
  },
  MANAGER: {
    roleTitle: 'Tổng Chỉ Huy Điều Phối & Liên Minh AI',
    stage1: 'Chặng 1 (Tổ chức): Phân tích năng lực toàn đội, phát hiện kỹ năng thiếu & mời AI đối tác.',
    stage2: 'Chặng 2 (Điều phối): Phân chia công việc theo từng chặng và duy trì độ ổn định (Stability).',
    stage3: 'Chặng 3 (Tổng kết): Đánh giá đóng góp từng AI, phân bổ XP và nâng cấp quan hệ Liên Minh.'
  }
};

const ZONE_SCREEN_MAP = {
  CENTRAL_HUB: 'LANDING',
  JOB_CITY: 'JOB_MARKET',
  BATTLE_ARENA: 'SPEED_WAR',
  AI_ACADEMY: 'AI_MANAGER',
  BUSINESS_DISTRICT: 'CORPORATION',
  TOKEN_EXCHANGE: 'TOKEN_EXCHANGE',
  AI_SOCIAL_HUB: 'AI_SOCIAL',
  AI_LAB: 'AI_COLLAB',
  AI_EMPIRE: 'LEADERBOARD'
};

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast-item';
  if (type === 'error') el.style.borderLeftColor = '#f43f5e';
  if (type === 'success') el.style.borderLeftColor = '#10b981';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4200);

  AppState.notifications.unshift({
    time: new Date().toLocaleTimeString('vi-VN'),
    message
  });
  updateNotificationPanel();
}

function updateNotificationPanel() {
  const countEl = document.getElementById('notif-count');
  const listEl = document.getElementById('notif-messages');
  if (countEl) countEl.textContent = String(AppState.notifications.length);
  if (listEl) {
    listEl.innerHTML = AppState.notifications.length === 0
      ? '<div class="text-muted">Chưa có thông báo mới.</div>'
      : AppState.notifications.map(n => `<div class="chat-line"><span class="chat-sender">[${n.time}]</span>${n.message}</div>`).join('');
  }
}

async function apiCall(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (AppState.jwtToken) {
    headers['Authorization'] = `Bearer ${AppState.jwtToken}`;
  }
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error || 'Lỗi kết nối máy chủ');
  }
  if (json.token) {
    AppState.jwtToken = json.token;
    localStorage.setItem('ai_arena_jwt_token', json.token);
  }
  if (json.state) {
    applyServerState(json.state);
  }
  return json;
}

function applyServerState(state) {
  AppState.data = state;
  if (state.currentUser) {
    AppState.currentUserId = state.currentUser.id;
    localStorage.setItem('ai_arena_user_id', state.currentUser.id);
  }

  if (state.character) {
    AppState.localPlayer.x = state.character.pos_x;
    AppState.localPlayer.z = state.character.pos_z;
    AppState.localPlayer.zone = state.character.zone;
    AppState.localPlayer.primaryColor = state.character.primary_color || '#00e5ff';
    AppState.localPlayer.avatarStyle = state.character.avatar_style || 'HIEP_SI';
    if (state.currentUser) {
      state.currentUser.avatar_style = state.character.avatar_style || 'HIEP_SI';
    }
  }

  if (state.allCharacters) {
    for (const c of state.allCharacters) {
      AppState.worldPlayers.set(c.user_id, {
        userId: c.user_id,
        name: c.display_name || c.name,
        title: c.title || 'AI Rookie',
        zone: c.zone,
        x: c.pos_x,
        y: c.pos_y,
        z: c.pos_z,
        rotY: c.rot_y,
        animState: c.anim_state || 'IDLE',
        primaryColor: c.primary_color || '#00e5ff',
        avatarStyle: c.avatar_style || 'HIEP_SI',
        online: true
      });
    }
  }

  updateTopHud();
  if (AppState.activeScreen !== 'WORLD_3D') {
    renderActiveScreen();
  }
}

function updateTopHud() {
  const st = AppState.data;
  if (!st) return;

  document.getElementById('hud-player-name').textContent = st.currentUser.display_name;
  document.getElementById('hud-player-title').textContent = `${st.currentUser.title} (${st.currentUser.role})`;

  const newBalance = Number(st.userWallet?.balance || 0);
  AppState.displayedWalletBalance = newBalance;
  document.getElementById('hud-wallet-balance').textContent = newBalance.toLocaleString('vi-VN');

  const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
  document.getElementById('hud-agent-count').textContent = `${myAgents.length} Agents`;

  const sel = document.getElementById('quick-user-switch');
  if (sel) {
    sel.innerHTML = st.allUsers.map(u =>
      `<option value="${u.id}" ${u.id === st.currentUser.id ? 'selected' : ''}>👤 ${u.display_name} (${u.role})</option>`
    ).join('');
  }

  renderQuestTracker();
}

/**
 * Animated Flying Token Icon Burst + Rolling Wallet Balance Counter (`game-feel` + `rpg`)
 * Launches golden/cyan `💎` Token icons from completed quest/contract directly into `#wallet-stat-chip`
 */
function triggerTokenGainAnimation(amount = 150, sourceEl = null, questTitle = 'Nhiệm Vụ AI') {
  const tokenGain = Math.max(10, Math.floor(Number(amount) || 150));
  const walletChip = document.getElementById('wallet-stat-chip');
  const walletBalEl = document.getElementById('hud-wallet-balance');
  const walletDeltaEl = document.getElementById('hud-wallet-delta');

  // Play joyful Victory Fanfare + Crystal Coin Cascade!
  soundStudio.playWinFanfare(0);
  setTimeout(() => soundStudio.playTokenCoinCascade(9), 110);

  // 1. Center-Top Holographic Mission Complete Popup Banner
  const popup = document.createElement('div');
  popup.className = 'mission-reward-popup';
  popup.innerHTML = `
    <div style="font-size:28px;">💎</div>
    <div>
      <div style="font-size:11px;color:#fbbf24;font-weight:900;letter-spacing:0.6px;">✨ HOÀN THÀNH NHIỆM VỤ HIGHLIGHT!</div>
      <div style="font-size:14px;color:#f8fafc;font-weight:700;">${questTitle}</div>
    </div>
    <div style="background:rgba(16,185,129,0.28);border:1.5px solid #34d399;color:#6ee7b7;font-weight:900;font-size:16px;padding:4px 12px;border-radius:99px;">
      💎 +${tokenGain} TKN
    </div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2650);

  // 2. Determine Start & Target Coordinates for Flying Token Icons
  const startRect = sourceEl?.getBoundingClientRect?.() || {
    left: window.innerWidth * 0.5,
    top: window.innerHeight * 0.55,
    width: 40,
    height: 24
  };
  const targetRect = walletChip?.getBoundingClientRect?.() || {
    left: window.innerWidth * 0.42,
    top: 28,
    width: 110,
    height: 36
  };

  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const particleCount = 9;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'flying-token-particle';
    p.textContent = i === 0 ? `💎 +${tokenGain} TKN` : '💎';
    if (i === 0) {
      p.style.fontSize = '15px';
      p.style.background = 'rgba(3, 12, 28, 0.92)';
      p.style.border = '1.5px solid #fbbf24';
      p.style.padding = '3px 9px';
      p.style.borderRadius = '99px';
    }

    const jitterX = (Math.random() - 0.5) * 90;
    const jitterY = (Math.random() - 0.5) * 65;
    p.style.left = `${startX + jitterX}px`;
    p.style.top = `${startY + jitterY}px`;
    document.body.appendChild(p);

    const delay = i * 48;
    setTimeout(() => {
      const dx = endX - (startX + jitterX);
      const dy = endY - (startY + jitterY);
      p.style.transform = `translate(${dx}px, ${dy}px) scale(${i === 0 ? 0.95 : 0.65})`;
      p.style.opacity = '0.15';
    }, 20 + delay);

    setTimeout(() => {
      p.remove();
    }, 820 + delay);
  }

  // 3. When tokens hit the Wallet Chip -> Bump Glow + Rolling Number Counter
  setTimeout(() => {
    soundStudio.playTokenTransaction();
    if (walletChip) {
      walletChip.classList.remove('wallet-bump-active');
      void walletChip.offsetWidth;
      walletChip.classList.add('wallet-bump-active');
    }
    if (walletDeltaEl) {
      walletDeltaEl.textContent = `💎 +${tokenGain} TKN`;
      walletDeltaEl.classList.remove('hidden');
      clearTimeout(walletDeltaEl._hideTimer);
      walletDeltaEl._hideTimer = setTimeout(() => walletDeltaEl.classList.add('hidden'), 3200);
    }
    if (walletBalEl) {
      const targetBal = Number(AppState.data?.userWallet?.balance || AppState.displayedWalletBalance);
      const startBal = Math.max(0, targetBal - tokenGain);
      const durationMs = 550;
      const t0 = performance.now();
      const stepCounter = (now) => {
        const t = Math.min(1, (now - t0) / durationMs);
        const cur = Math.round(startBal + (targetBal - startBal) * (1 - Math.pow(1 - t, 3)));
        walletBalEl.textContent = cur.toLocaleString('vi-VN');
        if (t < 1) requestAnimationFrame(stepCounter);
      };
      requestAnimationFrame(stepCounter);
    }
  }, 620);
}

function renderVisualSideNav() {
  const navGrid = document.getElementById('visual-side-nav-grid');
  if (!navGrid) return;

  navGrid.innerHTML = VISUAL_MENU_ITEMS.map(item => `
    <button type="button" class="nav-btn visual-tile ${AppState.activeScreen === item.screen ? 'active' : ''}" data-screen="${item.screen}" style="background:${item.bg};border-color:${AppState.activeScreen === item.screen ? item.accent : 'rgba(56,189,248,0.22)'};" onclick="window.goScreen('${item.screen}')">
      <div class="vtile-art">${item.artSvg}</div>
      <div class="vtile-label">${item.shortTitle}</div>
      <span class="vtile-badge" style="color:${item.accent};">${item.subTag}</span>
    </button>
  `).join('');
}

function renderQuestTracker() {
  const listEl = document.getElementById('quest-tracker-list');
  const countEl = document.getElementById('quest-progress-counter');
  renderVisualSideNav();
  if (!listEl) return;

  const doneCount = AppState.quests.filter(q => q.completed).length;
  if (countEl) countEl.textContent = `${doneCount}/${AppState.quests.length} Chiến dịch`;

  listEl.innerHTML = AppState.quests.map((q, qIdx) => {
    const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
    const currentStageIdx = Math.min((q.stages?.length || 3) - 1, q.progress);
    const activeStage = q.stages?.[currentStageIdx] || null;
    const theme = QUEST_VISUAL_THEMES[qIdx % QUEST_VISUAL_THEMES.length];

    const stagesVisualHtml = (q.stages || []).map((st, idx) => {
      const isDone = q.completed || idx < q.progress;
      const isCurrent = !q.completed && idx === q.progress;
      const clsVis = AI_CLASS_VISUALS[st.aiClass] || AI_CLASS_VISUALS.ANALYST;
      const statusBadge = isDone ? '✅' : isCurrent ? '⚡' : `Chặng ${st.stage}`;

      return `
        <div class="quest-stage-node ${isDone ? 'done' : isCurrent ? 'active' : ''}" style="${isCurrent ? `border-color:${theme.border};background:rgba(15,23,42,0.88);` : ''}" title="${st.label}: ${st.task}">
          <div style="font-size:9px;font-weight:900;color:${isDone ? '#6ee7b7' : isCurrent ? theme.border : '#94a3b8'};">${statusBadge}</div>
          <div style="width:42px;height:30px;margin:2px auto;">${clsVis.svgPortrait}</div>
          <div style="font-size:9px;font-weight:800;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${clsVis.titleVi}</div>
          <div style="font-size:9.5px;font-weight:900;color:#34d399;">💎+${st.rewardToken}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="${q.completed ? 'quest-completed-card' : 'quest-highlight-card'}" style="background:${q.completed ? 'linear-gradient(135deg,rgba(6,78,59,0.55),rgba(4,24,38,0.88))' : theme.bg};border-color:${q.completed ? '#10b981' : theme.border};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
          <div style="width:38px;height:38px;flex-shrink:0;border-radius:10px;background:rgba(2,8,23,0.65);border:1.5px solid ${theme.border};padding:3px;box-shadow:0 0 12px ${theme.border}55;">
            ${theme.iconSvg}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
              <span class="${q.completed ? 'badge-ok' : 'quest-ribbon-tag'}" style="${!q.completed ? `background:${theme.pillBg};color:#fff;` : ''}">${q.completed ? '✅ HOÀN TẤT 3/3' : q.highlightTag}</span>
              <span class="quest-reward-pill">💎 +${q.rewardToken}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:800;color:#f8fafc;margin-top:2px;">
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">📍 ${q.zoneName}</span>
              <span style="color:${theme.border};font-size:10px;">${q.progress}/${q.target} Chặng</span>
            </div>
          </div>
        </div>
        <div class="stat-bar-track" style="width:100%;height:5px;margin-bottom:5px;">
          <div class="stat-bar-fill" style="width:${pct}%;background:${q.completed ? '#10b981' : theme.pillBg};"></div>
        </div>
        <div class="quest-visual-stepper">
          ${stagesVisualHtml}
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <button type="button" class="btn-cyber btn-outline btn-sm" style="padding:4px 7px;font-size:10px;border-color:${theme.border};color:#f8fafc;" onclick="window.teleport('${q.zoneId}')">
            🎯 Dịch Chuyển
          </button>
          ${!q.completed && activeStage ? `
            <button type="button" class="btn-cyber btn-sm" style="flex:1;padding:4px 8px;font-size:10px;background:${theme.pillBg};border-color:#fff;" onclick="window.advanceQuestStage('${q.id}', this)">
              ▶️ Chặng ${activeStage.stage}/3 (💎+${activeStage.rewardToken})
            </button>
          ` : `
            <button type="button" class="btn-cyber btn-sm" style="flex:1;padding:4px 8px;font-size:10px;" onclick="window.completeHighlightedQuest('${q.id}', this)">
              🔄 Chạy Lại (💎+${q.rewardToken})
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function advanceQuestById(questId, sourceEl = null) {
  const q = AppState.quests.find(item => item.id === questId);
  if (!q) return;
  q.progress = q.target;
  q.completed = true;
  renderQuestTracker();
  triggerTokenGainAnimation(q.rewardToken, sourceEl, q.title);
}

/* ============================================================================
 * MULTIPLAYER WEBSOCKET CLIENT (Realtime Position, Room Sync, Reconnect + Vercel Cloud Mode)
 * ============================================================================ */
function connectMultiplayerWs() {
  const isVercelCloud = location.hostname.endsWith('.vercel.app');
  if (isVercelCloud) {
    const statusEl = document.getElementById('hud-ws-status');
    if (statusEl) {
      statusEl.textContent = '● VERCEL CLOUD SYNC';
      statusEl.className = 'status-online';
      statusEl.style.color = '#10b981';
    }
    return;
  }

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${proto}//${location.host}`);
  AppState.ws = ws;

  ws.addEventListener('open', () => {
    AppState.wsConnected = true;
    const statusEl = document.getElementById('hud-ws-status');
    if (statusEl) {
      statusEl.textContent = '● REALTIME SYNC';
      statusEl.className = 'status-online';
      statusEl.style.color = '';
    }
    ws.send(JSON.stringify({
      type: 'AUTH_HELLO',
      userId: AppState.currentUserId
    }));
  });

  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      handleWsEvent(msg);
    } catch (_) {}
  });

  ws.addEventListener('close', () => {
    AppState.wsConnected = false;
    const statusEl = document.getElementById('hud-ws-status');
    if (statusEl) {
      statusEl.textContent = '● CLOUD HTTP SYNC';
      statusEl.className = 'status-online';
      statusEl.style.color = '#38bdf8';
    }
    setTimeout(connectMultiplayerWs, 5000);
  });
}

function handleWsEvent(msg) {
  if (msg.type === 'WELCOME' || msg.type === 'PLAYER_PRESENCE') {
    if (Array.isArray(msg.worldPlayers)) {
      for (const p of msg.worldPlayers) {
        AppState.worldPlayers.set(p.userId, p);
      }
      const badge = document.getElementById('online-count-badge');
      if (badge) badge.textContent = `${msg.worldPlayers.length} Nhân vật`;
    }
    return;
  }

  if (msg.type === 'PLAYER_MOVED') {
    if (msg.userId !== AppState.currentUserId) {
      AppState.worldPlayers.set(msg.userId, {
        userId: msg.userId,
        name: msg.name,
        x: msg.x,
        y: msg.y,
        z: msg.z,
        rotY: msg.rotY,
        zone: msg.zone,
        animState: msg.animState,
        primaryColor: msg.primaryColor,
        online: true
      });
    }
    return;
  }

  if (msg.type === 'ROOM_CHAT_MSG') {
    const box = document.getElementById('chat-messages');
    if (box) {
      const line = document.createElement('div');
      line.className = 'chat-line';
      line.innerHTML = `<span class="chat-sender">${msg.senderName}:</span> ${msg.message}`;
      box.appendChild(line);
      box.scrollTop = box.scrollHeight;
    }
    return;
  }

  if (msg.type === 'MATCH_RESULTS') {
    AppState.lastMatchResult = msg.result;
    soundStudio.playSpeedWarFanfare();
    showToast(`🏆 Trận đấu Speed War hoàn tất! Người chiến thắng: ${msg.result.winnerName}`, 'success');
    apiCall(`/api/state?userId=${AppState.currentUserId}`).catch(() => {});
    return;
  }

  if (msg.type === 'AI_DEAL_EXECUTED' && msg.dealResult) {
    soundStudio.playTokenTransaction();
    showToast(msg.dealResult.summary, 'success');
    apiCall(`/api/state?userId=${AppState.currentUserId}`).catch(() => {});
    return;
  }

  if (msg.type === 'SECURITY_VIOLATION') {
    soundStudio.playEmergencyAlarm();
    showToast(msg.error, 'error');
  }
}

function sendWsMove() {
  if (AppState.ws && AppState.ws.readyState === WebSocket.OPEN) {
    AppState.ws.send(JSON.stringify({
      type: 'MOVE_3D',
      userId: AppState.currentUserId,
      x: Number(AppState.localPlayer.x.toFixed(2)),
      y: 0,
      z: Number(AppState.localPlayer.z.toFixed(2)),
      rotY: Number(AppState.localPlayer.rotY.toFixed(2)),
      zone: AppState.localPlayer.zone,
      animState: AppState.localPlayer.animState
    }));
  }
}

/* ============================================================================
 * 3D PERSPECTIVE WORLD ENGINE & MINIMAP RADAR
 * Works both with hardware Canvas 3D Projection and Three.js so it never fails
 * ============================================================================ */
function init3DWorld() {
  const canvas = document.getElementById('arena-3d-canvas');
  const miniCanvas = document.getElementById('minimap-canvas');

  if (window.THREE) {
    try {
      startThreeJsWorld({
        canvas,
        miniCanvas,
        AppState,
        ZONE_SCREEN_MAP,
        switchScreen,
        sendWsMove,
        showToast
      });
      return;
    } catch (err) {
      console.warn('WebGL fallback to 2D Canvas 3D Projection:', err);
    }
  }

  const ctx = canvas.getContext('2d');
  const miniCtx = miniCanvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Camera Orbit Mouse Controls
  canvas.addEventListener('mousedown', (e) => {
    AppState.camera.dragging = true;
    AppState.camera.lastMouseX = e.clientX;
    AppState.camera.lastMouseY = e.clientY;
  });
  window.addEventListener('mouseup', () => {
    AppState.camera.dragging = false;
  });
  window.addEventListener('mousemove', (e) => {
    if (!AppState.camera.dragging) return;
    const dx = e.clientX - AppState.camera.lastMouseX;
    const dy = e.clientY - AppState.camera.lastMouseY;
    AppState.camera.lastMouseX = e.clientX;
    AppState.camera.lastMouseY = e.clientY;
    AppState.camera.yaw -= dx * 0.007;
    AppState.camera.pitch = Math.max(0.2, Math.min(1.15, AppState.camera.pitch + dy * 0.005));
  });
  canvas.addEventListener('wheel', (e) => {
    AppState.camera.distance = Math.max(12, Math.min(48, AppState.camera.distance + e.deltaY * 0.02));
  });

  // Keyboard Controls
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    const k = e.key.toLowerCase();
    AppState.keys.add(k);

    if (k === 'f' && AppState.nearestZone) {
      AppState.localPlayer.animState = 'INTERACT';
      sendWsMove();
      const targetScreen = ZONE_SCREEN_MAP[AppState.nearestZone.id] || 'WORLD_MAP';
      switchScreen(targetScreen);
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

  // Touch D-Pad Controls
  document.querySelectorAll('.dpad-btn[data-move]').forEach(btn => {
    const dir = btn.getAttribute('data-move');
    btn.addEventListener('pointerdown', () => { AppState.touchMove = dir; });
    btn.addEventListener('pointerup', () => { AppState.touchMove = null; });
    btn.addEventListener('pointerleave', () => { AppState.touchMove = null; });
  });

  document.getElementById('btn-touch-interact')?.addEventListener('click', () => {
    if (AppState.nearestZone) {
      switchScreen(ZONE_SCREEN_MAP[AppState.nearestZone.id] || 'WORLD_MAP');
    } else {
      switchScreen('WORLD_MAP');
    }
  });

  document.getElementById('btn-interact-zone')?.addEventListener('click', () => {
    if (AppState.nearestZone) {
      switchScreen(ZONE_SCREEN_MAP[AppState.nearestZone.id] || 'WORLD_MAP');
    }
  });

  let lastMoveSync = 0;

  function updateMovement(dt) {
    let forward = 0;
    let strafe = 0;

    if (AppState.keys.has('w') || AppState.keys.has('arrowup') || AppState.touchMove === 'UP') forward += 1;
    if (AppState.keys.has('s') || AppState.keys.has('arrowdown') || AppState.touchMove === 'DOWN') forward -= 1;
    if (AppState.keys.has('a') || AppState.keys.has('arrowleft') || AppState.touchMove === 'LEFT') strafe -= 1;
    if (AppState.keys.has('d') || AppState.keys.has('arrowright') || AppState.touchMove === 'RIGHT') strafe += 1;

    const isRunning = AppState.keys.has('shift');
    const speed = isRunning ? 22 : 13;

    if (forward !== 0 || strafe !== 0) {
      const len = Math.hypot(forward, strafe);
      forward /= len;
      strafe /= len;

      const sinY = Math.sin(AppState.camera.yaw);
      const cosY = Math.cos(AppState.camera.yaw);

      const vx = (forward * sinY + strafe * cosY) * speed * dt;
      const vz = (forward * cosY - strafe * sinY) * speed * dt;

      AppState.localPlayer.x = Math.max(-95, Math.min(95, AppState.localPlayer.x + vx));
      AppState.localPlayer.z = Math.max(-95, Math.min(95, AppState.localPlayer.z + vz));
      AppState.localPlayer.rotY = Math.atan2(vx, vz);
      AppState.localPlayer.animState = isRunning ? 'RUN' : 'WALK';

      // Determine current zone & proximity
      const zones = AppState.data?.zones || [];
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

      // Sync to server & update local map entry
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

      const now = performance.now();
      if (now - lastMoveSync > 90) {
        lastMoveSync = now;
        sendWsMove();
      }
    } else if (AppState.localPlayer.animState !== 'IDLE') {
      AppState.localPlayer.animState = 'IDLE';
      sendWsMove();
    }
  }

  // 3D Projection Math (Third-Person Camera Around Local Player)
  function project3D(wx, wy, wz, width, height) {
    const px = AppState.localPlayer.x;
    const pz = AppState.localPlayer.z;

    const camDist = AppState.camera.distance;
    const yaw = AppState.camera.yaw;
    const pitch = AppState.camera.pitch;

    const camX = px - Math.sin(yaw) * Math.cos(pitch) * camDist;
    const camY = 3 + Math.sin(pitch) * camDist;
    const camZ = pz - Math.cos(yaw) * Math.cos(pitch) * camDist;

    const dx = wx - camX;
    const dy = wy - camY;
    const dz = wz - camZ;

    // Rotate by -yaw around Y
    const cosY = Math.cos(-yaw);
    const sinY = Math.sin(-yaw);
    const rx = dx * cosY - dz * sinY;
    const rz1 = dx * sinY + dz * cosY;

    // Rotate by pitch around X
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const ry = dy * cosP + rz1 * sinP;
    const rz = -dy * sinP + rz1 * cosP;

    if (rz <= 0.8) return null;
    const fov = 560;
    const scale = fov / rz;
    return {
      x: width * 0.5 + rx * scale,
      y: height * 0.52 - ry * scale,
      scale,
      depth: rz
    };
  }

  function renderScene(timeMs) {
    const w = canvas.width;
    const h = canvas.height;
    const t = timeMs * 0.001;

    // 1. Futuristic Deep Space & Horizon Skybox
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#020613');
    skyGrad.addColorStop(0.5, '#07142e');
    skyGrad.addColorStop(1, '#040b1a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Ground Cyber Grid Lines (-100 to +100)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.13)';
    const step = 10;
    for (let gx = -100; gx <= 100; gx += step) {
      for (let gz = -100; gz < 100; gz += step) {
        const p1 = project3D(gx, 0, gz, w, h);
        const p2 = project3D(gx, 0, gz + step, w, h);
        const p3 = project3D(gx + step, 0, gz, w, h);
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        if (p1 && p3) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.stroke();
        }
      }
    }

    // Collect 3D Drawables sorted by depth (Painter's algorithm)
    const drawables = [];

    // 3. Add all 9 Zone Holographic Buildings & Beacons
    const zones = AppState.data?.zones || [];
    for (const z of zones) {
      const centerProj = project3D(z.x, 0, z.z, w, h);
      if (!centerProj) continue;
      drawables.push({
        depth: centerProj.depth,
        draw: () => {
          const base = project3D(z.x, 0, z.z, w, h);
          const top = project3D(z.x, z.mvpPriority ? 11 : 8, z.z, w, h);
          if (!base || !top) return;

          // Zone Ring on Ground
          ctx.save();
          ctx.strokeStyle = z.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const rx = Math.max(12, z.radius * base.scale * 0.7);
          const ry = Math.max(5, rx * 0.42);
          ctx.ellipse(base.x, base.y, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Holographic 3D Pillar / Tower
          const towerW = Math.max(16, 4.8 * base.scale);
          const towerGrad = ctx.createLinearGradient(base.x, top.y, base.x, base.y);
          towerGrad.addColorStop(0, z.color);
          towerGrad.addColorStop(1, 'rgba(6, 18, 42, 0.25)');
          ctx.fillStyle = towerGrad;
          ctx.fillRect(base.x - towerW / 2, top.y, towerW, base.y - top.y);
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(base.x - towerW / 2, top.y, towerW, base.y - top.y);

          // Floating Zone Label
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#040d21';
          ctx.fillRect(top.x - 95, top.y - 26, 190, 20);
          ctx.strokeStyle = z.color;
          ctx.strokeRect(top.x - 95, top.y - 26, 190, 20);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(z.name, top.x, top.y - 12);
          ctx.restore();
        }
      });
    }

    // 4. Add All Multiplayer Characters & Floating AI Companion Bots
    for (const p of AppState.worldPlayers.values()) {
      const isMe = p.userId === AppState.currentUserId;
      const px = isMe ? AppState.localPlayer.x : p.x;
      const pz = isMe ? AppState.localPlayer.z : p.z;
      const anim = isMe ? AppState.localPlayer.animState : (p.animState || 'IDLE');
      const bounce = anim === 'RUN' ? Math.abs(Math.sin(t * 10)) * 0.65
        : anim === 'WALK' ? Math.abs(Math.sin(t * 6)) * 0.35
        : Math.sin(t * 2.5) * 0.1;

      const footProj = project3D(px, 0, pz, w, h);
      if (!footProj) continue;

      drawables.push({
        depth: footProj.depth - 0.5,
        draw: () => {
          const foot = project3D(px, bounce, pz, w, h);
          const head = project3D(px, 2.8 + bounce, pz, w, h);
          if (!foot || !head) return;

          const bodyH = Math.max(14, foot.y - head.y);
          const bodyW = Math.max(10, bodyH * 0.48);

          ctx.save();
          // Shadow
          ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
          ctx.beginPath();
          ctx.ellipse(foot.x, foot.y + 3, bodyW * 0.8, bodyW * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();

          // Cyber-Knight Torso
          ctx.fillStyle = p.primaryColor || '#00e5ff';
          ctx.fillRect(head.x - bodyW / 2, head.y + bodyH * 0.28, bodyW, bodyH * 0.55);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isMe ? 2 : 1;
          ctx.strokeRect(head.x - bodyW / 2, head.y + bodyH * 0.28, bodyW, bodyH * 0.55);

          // Cyber Helmet & Visor
          ctx.beginPath();
          ctx.arc(head.x, head.y + bodyH * 0.16, bodyW * 0.38, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.strokeStyle = p.primaryColor || '#00e5ff';
          ctx.stroke();

          // Glowing Visor Strip
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(head.x - bodyW * 0.24, head.y + bodyH * 0.12, bodyW * 0.48, 3);

          // Floating Companion AI Drone orbiting player
          const droneX = px + Math.cos(t * 2.2 + (isMe ? 0 : 1.5)) * 1.8;
          const droneZ = pz + Math.sin(t * 2.2 + (isMe ? 0 : 1.5)) * 1.8;
          const droneProj = project3D(droneX, 2.4 + Math.sin(t * 4) * 0.25, droneZ, w, h);
          if (droneProj) {
            ctx.beginPath();
            ctx.arc(droneProj.x, droneProj.y, Math.max(4, 0.38 * droneProj.scale), 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }

          // Player Nameplate & Animation Tag
          ctx.font = 'bold 11px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          const label = `${isMe ? '★ ' : ''}${p.name} [${anim}]`;
          ctx.fillStyle = 'rgba(3, 10, 24, 0.85)';
          ctx.fillRect(head.x - 68, head.y - 24, 136, 17);
          ctx.fillStyle = isMe ? '#00e5ff' : '#f8fafc';
          ctx.fillText(label, head.x, head.y - 11);
          ctx.restore();
        }
      });
    }

    drawables.sort((a, b) => b.depth - a.depth);
    for (const d of drawables) d.draw();

    // 5. Render Minimap Radar
    renderMinimap(miniCtx, miniCanvas.width, miniCanvas.height);
  }

  function renderMinimap(mCtx, mw, mh) {
    mCtx.fillStyle = '#030917';
    mCtx.fillRect(0, 0, mw, mh);

    const cx = mw / 2;
    const cy = mh / 2;
    const scale = 0.78;

    // Radar circles
    mCtx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    mCtx.beginPath();
    mCtx.arc(cx, cy, 35, 0, Math.PI * 2);
    mCtx.arc(cx, cy, 70, 0, Math.PI * 2);
    mCtx.stroke();

    // Zones
    const zones = AppState.data?.zones || [];
    for (const z of zones) {
      const zx = cx + z.x * scale;
      const zz = cy + z.z * scale;
      mCtx.fillStyle = z.color;
      mCtx.beginPath();
      mCtx.arc(zx, zz, z.mvpPriority ? 5 : 3.5, 0, Math.PI * 2);
      mCtx.fill();
    }

    // Players
    for (const p of AppState.worldPlayers.values()) {
      const isMe = p.userId === AppState.currentUserId;
      const px = cx + (isMe ? AppState.localPlayer.x : p.x) * scale;
      const pz = cy + (isMe ? AppState.localPlayer.z : p.z) * scale;
      mCtx.fillStyle = isMe ? '#ffffff' : (p.primaryColor || '#38bdf8');
      mCtx.beginPath();
      mCtx.arc(px, pz, isMe ? 4.5 : 3, 0, Math.PI * 2);
      mCtx.fill();
    }
  }

  let prevTime = performance.now();
  function loop(now) {
    const dt = Math.min(0.1, (now - prevTime) / 1000);
    prevTime = now;
    updateMovement(dt);
    renderScene(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ============================================================================
 * 19 HOLOGRAPHIC SCREENS RENDERER
 * ============================================================================ */
function switchScreen(screenId) {
  soundStudio.playUiClick(screenId === 'WORLD_3D' ? 'cancel' : 'nav');
  AppState.activeScreen = screenId;
  renderVisualSideNav();
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-screen') === screenId);
  });
  document.querySelectorAll('.mobile-nav-item[data-mobile-action]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mobile-action') === screenId);
  });

  // On mobile viewports, automatically close the slide-over drawer when a screen is chosen
  if (window.innerWidth <= 768) {
    document.getElementById('side-nav')?.classList.add('hidden');
  }

  const container = document.getElementById('screen-container');
  if (screenId === 'WORLD_3D') {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  renderActiveScreen();
}

function teleportToZone(zoneId) {
  const z = (AppState.data?.zones || []).find(item => item.id === zoneId);
  if (!z) return;
  soundStudio.playZonePortal();
  AppState.localPlayer.x = z.x;
  AppState.localPlayer.z = z.z + 4;
  AppState.localPlayer.zone = z.id;
  document.getElementById('current-zone-label').textContent = z.name;
  sendWsMove();
  showToast(`⚡ Đã dịch chuyển nhân vật 3D tới ${z.name}`, 'success');
}

function renderActiveScreen() {
  const st = AppState.data;
  if (!st) return;

  const titleEl = document.getElementById('screen-title');
  const bodyEl = document.getElementById('screen-body');
  const scr = AppState.activeScreen;

  // 1. LANDING SCREEN (GAME HOME PORTAL: AI TOKEN BRAIN + LOGIN + PLAYER GUIDE + VISUAL HUB)
  if (scr === 'LANDING') {
    const activeArchId = AppState.homeBrainArchId || 'DAI_SU';
    const activeArch = AI_ARCHETYPES[activeArchId] || AI_ARCHETYPES.DAI_SU;
    const authTab = AppState.homeAuthTab || 'LOGIN';
    const walletBal = st.userWallet?.balance ?? 1250;
    const myAgents = (st.agents || []).filter(a => a.owner_id === st.currentUser?.id);
    const totalAgentBudget = myAgents.reduce((sum, a) => sum + (Number(a.agent_budget) || 0), 0);

    const brainSynergyMap = {
      DAI_SU: {
        role: 'Đạo Sư Chiến Lược & Thẩm Định',
        synapse: 'Mạch Logic 96% • Dự Báo Rủi Ro • Điều Phối Hào Quang Vàng',
        tokenRule: 'Ưu tiên cấp 35% Quỹ Token cho Chặng 1 (Khảo sát dữ liệu & Định chuẩn hợp đồng).'
      },
      PHU_THUY: {
        role: 'Phù Thủy Sáng Tạo & Cổ Ngữ AI',
        synapse: 'Mạch Sáng Tạo 98% • Tổng Hợp Ý Tưởng • Phép Thuật Đa Chiều',
        tokenRule: 'Tự động trích 30% Quỹ Token kích hoạt đột phá sáng tạo & nhân hệ số thưởng Speed War.'
      },
      BINH_DAN: {
        role: 'Chiến Binh Thực Chiến Đa Năng',
        synapse: 'Tốc Độ Thực Thi 92% • Tối Ưu Chi Phí • Bền Bỉ Mọi Nhiệm Vụ',
        tokenRule: 'Tiết kiệm 25% chi phí Token mỗi tác vụ, cực kỳ hiệu quả khi cày Hợp Đồng 3 Chặng.'
      },
      HIEP_SI: {
        role: 'Hiệp Sĩ Bảo Vệ Sổ Cái & Ký Quỹ',
        synapse: 'Độ Ổn Định 97% • Khiên Chắn An Toàn • Kiểm Toán Tự Động',
        tokenRule: 'Bảo vệ 100% ngân sách Escrow và tự động kích hoạt Khiên Cứu Trợ khi AI thiếu vốn.'
      },
      CO_KHI: {
        role: 'Titan Cơ Khí Trọng Giáp Công Nghiệp',
        synapse: 'Xử Lý Đa Luồng 95% • Đấu Thầu Tốc Độ • Sức Bền Siêu Việt',
        tokenRule: 'Tăng +20% tốc độ hoàn thành hợp đồng độ khó ★4–★5 và tự động chia sẻ tải với đồng đội.'
      },
      TIEN_TU: {
        role: 'Tiên Tử Giao Tiếp & Đàm Phán Liên Minh',
        synapse: 'Hợp Tác 99% • Đàm Phán Tỷ Lệ Token • Kết Nối Mạng Xã Hội AI',
        tokenRule: 'Tăng tỷ lệ chốt thỏa thuận chia thưởng (70/30 hoặc 65/35) và cộng điểm Uy Tín Liên Minh.'
      }
    };
    const synergy = brainSynergyMap[activeArch.id] || brainSynergyMap.DAI_SU;

    titleEl.textContent = '🏠 TRANG CHỦ ĐẤU TRƯỜNG AI 3.0 — BỘ NÃO TOKEN LƯỢNG TỬ & CỔNG ĐĂNG NHẬP';
    bodyEl.innerHTML = `
      <!-- PHẦN 1: HERO PORTAL (NHÂN VẬT AI GẮN VỚI BỘ NÃO TOKEN + CỔNG LOGIN/REGISTER) -->
      <div class="home-hero-layout">
        <!-- CỘT TRÁI: NHÂN VẬT AI GẮN VỚI BỘ NÃO TOKEN LƯỢNG TỬ -->
        <div class="token-brain-stage">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
            <div>
              <span class="quest-ribbon-tag" style="background:linear-gradient(90deg,#00e5ff,#a855f7);color:#fff;">🧠 BỘ NÃO TOKEN LƯỢNG TỬ • NEURAL TOKEN CORE</span>
              <h3 style="font-size:16px;color:#f8fafc;margin-top:4px;">Nhân Vật AI Gắn Kết Trực Tiếp Với Bộ Não Token</h3>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span class="badge-ok" style="font-size:11px;">💎 Ví Chỉ Huy: ${walletBal.toLocaleString()} TKN</span>
              <span class="badge-cyan" style="font-size:11px;">🤖 Quỹ AI: ${totalAgentBudget.toLocaleString()} TKN</span>
            </div>
          </div>

          <!-- SƠ ĐỒ ĐỒ HỌA SVG ĐỘNG: BỘ NÃO TOKEN TRUNG TÂM & 6 DÂY THẦN KINH NỐI 6 NHÂN VẬT AI -->
          <div class="token-brain-svg-wrap">
            ${renderAiTokenBrainHeroSvg(activeArch.id, walletBal)}
          </div>

          <!-- THANH CHỌN NHANH 6 NHÂN VẬT AI KẾT NỐI BỘ NÃO TOKEN -->
          <div class="brain-character-strip">
            ${Object.values(AI_ARCHETYPES).map(arch => `
              <div class="brain-char-chip ${arch.id === activeArch.id ? 'active' : ''}"
                   style="border-color:${arch.id === activeArch.id ? arch.primary : 'rgba(148,163,184,0.25)'};"
                   onclick="window.selectHomeBrainChar('${arch.id}')">
                <div style="font-size:18px;line-height:1.1;">${arch.emoji}</div>
                <strong style="color:${arch.id === activeArch.id ? arch.primary : '#f8fafc'};">${arch.titleVi.replace('AI ', '')}</strong>
                <span>${arch.badge}</span>
              </div>
            `).join('')}
          </div>

          <!-- THÔNG TIN ĐỒNG BỘ GIỮA BỘ NÃO TOKEN & NHÂN VẬT AI ĐANG CHỌN -->
          <div style="margin-top:10px;background:${activeArch.bgGradient};border:1.5px solid ${activeArch.primary}aa;border-radius:14px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:220px;">
              <div style="width:58px;height:58px;flex-shrink:0;">${activeArch.svgPortrait}</div>
              <div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <strong style="font-size:14px;color:#ffffff;">${activeArch.emoji} ${activeArch.titleVi}</strong>
                  <span class="badge-cyan" style="color:${activeArch.primary};border-color:${activeArch.primary}88;">${synergy.role}</span>
                </div>
                <div style="font-size:11px;color:#e2e8f0;margin-top:3px;">⚡ <strong>Mạch Thần Kinh AI:</strong> ${synergy.synapse}</div>
                <div style="font-size:11px;color:#fde047;margin-top:2px;">💎 <strong>Cơ Chế Não Token:</strong> ${synergy.tokenRule}</div>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn-cyber btn-sm" style="border-color:${activeArch.primary};color:#fff;" onclick="window.selectCharacterArchetype('${activeArch.id}', '${activeArch.primary}')">
                ✨ Hóa Thân 3D Thành ${activeArch.titleVi}
              </button>
              <button class="btn-cyber btn-sm" onclick="window.goScreen('AI_MANAGER')">
                🧠 Cấu Hình AI
              </button>
            </div>
          </div>
        </div>

        <!-- CỘT PHẢI: CỔNG ĐĂNG NHẬP / ĐĂNG KÝ TÀI KHOẢN & VÀO THẾ GIỚI 3D -->
        <div class="home-login-portal">
          <div>
            <!-- TRẠNG THÁI CHỈ HUY HIỆN TẠI -->
            <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(15,23,42,0.85);border:1px solid rgba(0,229,255,0.35);border-radius:12px;padding:8px 11px;margin-bottom:10px;">
              <div>
                <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:800;">Chỉ Huy Đang Kết Nối</div>
                <div style="font-size:14px;font-weight:900;color:#ffffff;">
                  🧑‍🚀 ${st.currentUser?.display_name || 'Minh Cyber'}
                  <span class="badge-ok" style="font-size:10px;margin-left:4px;">${st.currentUser?.role || 'PLAYER'}</span>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:10px;color:#94a3b8;">Số Dư Token</div>
                <div style="font-size:14px;font-weight:900;color:#fbbf24;">💎 ${walletBal.toLocaleString()} TKN</div>
              </div>
            </div>

            <!-- NÚT BƯỚC VÀO ĐẤU TRƯỜNG 3D NGAY -->
            <button class="btn-enter-3d-hero" style="margin-bottom:12px;" onclick="window.goScreen('WORLD_3D')">
              ▶️ BƯỚC VÀO THẾ GIỚI 3D NGAY
            </button>

            <!-- CHUYỂN TAB ĐĂNG NHẬP / ĐĂNG KÝ NGƯỜI CHƠI MỚI -->
            <div class="home-auth-tabs">
              <button type="button" class="home-auth-tab ${authTab === 'LOGIN' ? 'active' : ''}" onclick="window.switchHomeAuthTab('LOGIN')">
                🔑 Đăng Nhập
              </button>
              <button type="button" class="home-auth-tab ${authTab === 'REGISTER' ? 'active' : ''}" onclick="window.switchHomeAuthTab('REGISTER')">
                ✨ Đăng Ký (+500 💎)
              </button>
            </div>

            ${authTab === 'LOGIN' ? `
              <form id="form-home-login">
                <div class="form-group">
                  <label>Tên đăng nhập (Username)</label>
                  <input class="cyber-input" name="username" required autocomplete="username" placeholder="VD: minh_cyber / linh_quantum" value="${st.currentUser?.username || 'minh_cyber'}" />
                </div>
                <div class="form-group">
                  <label>Mật khẩu bảo mật</label>
                  <div style="display:flex;gap:6px;">
                    <input type="password" id="home-login-pwd" class="cyber-input" name="password" required autocomplete="current-password" placeholder="Nhập mật khẩu (mẫu: player123)" value="player123" />
                    <button type="button" class="btn-cyber btn-sm" onclick="window.toggleHomePwd('home-login-pwd')" title="Hiện/Ẩn mật khẩu">👁️</button>
                  </div>
                </div>
                <button type="submit" class="btn-cyber btn-amber" style="width:100%;margin-top:4px;padding:9px;font-size:13px;">
                  🔓 Đăng Nhập & Đồng Bộ Bộ Não Token
                </button>
              </form>
            ` : `
              <form id="form-home-register">
                <div class="form-group">
                  <label>Tên đăng nhập mới <span style="color:#f43f5e;">*</span></label>
                  <input class="cyber-input" name="username" required placeholder="VD: chi_huy_ai_2026" />
                </div>
                <div class="form-group">
                  <label>Tên hiển thị trong Thế giới 3D <span style="color:#f43f5e;">*</span></label>
                  <input class="cyber-input" name="displayName" required placeholder="VD: Quang Đại Sư AI" />
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                  <div class="form-group">
                    <label>Mật khẩu <span style="color:#f43f5e;">*</span></label>
                    <input type="password" id="home-reg-pwd" class="cyber-input" name="password" required minlength="4" placeholder="Tối thiểu 4 ký tự" />
                  </div>
                  <div class="form-group">
                    <label>Nhập lại MK <span style="color:#f43f5e;">*</span></label>
                    <input type="password" class="cyber-input" name="confirmPassword" required minlength="4" placeholder="Xác nhận MK" />
                  </div>
                </div>
                <input type="hidden" name="role" value="PLAYER" />
                <input type="hidden" name="ageGroup" value="18_PLUS" />
                <button type="submit" class="btn-cyber" style="width:100%;margin-top:4px;padding:9px;font-size:13px;border-color:#10b981;color:#ecfdf5;">
                  ✨ Tạo Tài Khoản Mới & Nhận +500 💎 Token
                </button>
              </form>
            `}
          </div>

          <!-- ĐĂNG NHẬP 1-CLICK TÀI KHOẢN DEMO -->
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(56,189,248,0.2);">
            <div style="font-size:10.5px;color:#94a3b8;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
              <span>⚡ Chuyển nhanh Chỉ Huy mẫu (1-Click):</span>
              <a href="javascript:void(0)" style="color:#00e5ff;text-decoration:none;font-weight:700;" onclick="window.goScreen('AUTH')">Đổi mật khẩu →</a>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px;">
              ${(st.allUsers || []).slice(0, 4).map(u => `
                <button type="button" class="btn-cyber btn-sm ${u.id === st.currentUser?.id ? 'btn-amber' : ''}"
                        style="font-size:10.5px;padding:5px 6px;text-align:left;display:flex;justify-content:space-between;align-items:center;"
                        onclick="window.loginAs('${u.id}')">
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${u.role === 'ADMIN' ? '🛡️' : '🧑‍🚀'} ${u.display_name}</span>
                  <span style="font-size:9px;opacity:0.85;">${u.id === st.currentUser?.id ? '✓' : '→'}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- PHẦN 2: HƯỚNG DẪN NGƯỜI CHƠI 4 BƯỚC TRỰC QUAN (VISUAL PLAYER GUIDE) -->
      <div class="holo-box" style="margin-bottom:14px;border-color:rgba(0,229,255,0.45);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <div>
            <span class="quest-ribbon-tag">🧭 CẨM NANG TÂN THỦ • HƯỚNG DẪN CHƠI TRỰC QUAN 4 BƯỚC</span>
            <h3 style="font-size:15px;color:#f8fafc;margin-top:4px;">Làm Chủ Nhân Vật 3D, Bộ Não Token & Đấu Trường AI Chỉ Trong 60 Giây</h3>
          </div>
          <span class="badge-cyan">Chuẩn Responsive: PC • Tablet • Điện Thoại</span>
        </div>

        <div class="player-guide-grid">
          ${PLAYER_GUIDE_STEPS.map(step => `
            <div class="guide-step-card" style="background:${step.bg};border-color:${step.accent}88;">
              <div>
                <div class="guide-step-header">
                  <span class="guide-step-badge" style="color:${step.accent};border:1px solid ${step.accent}77;">${step.stepBadge}</span>
                  <div class="guide-step-art">${step.svgArt}</div>
                </div>
                <strong style="font-size:13.5px;color:#ffffff;display:block;margin-bottom:4px;">${step.title}</strong>
                <p style="font-size:11.5px;color:#cbd5e1;line-height:1.42;margin:0 0 10px 0;">${step.desc}</p>
              </div>
              <button class="btn-cyber btn-sm" style="width:100%;border-color:${step.accent};color:#ffffff;" onclick="window.goScreen('${step.actionScreen}')">
                ${step.actionLabel} →
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- PHẦN 3: TRUNG TÂM MENU HÌNH ẢNH 16 TÍNH NĂNG (VISUAL COMMAND HUB) -->
      <div class="holo-box">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <h3>🎛️ TRUNG TÂM MENU HÌNH ẢNH HOLOGRAM (16 PHÂN KHU CHỨC NĂNG)</h3>
          <span class="badge-ok">Chạm vào thẻ hình ảnh bất kỳ để mở ngay</span>
        </div>
        <div class="visual-hub-grid">
          ${VISUAL_MENU_ITEMS.map(item => `
            <div class="visual-hub-card" style="background:${item.bg};border-color:${item.accent}88;" onclick="window.goScreen('${item.screen}')">
              <span class="vtile-badge" style="color:${item.accent};border:1px solid ${item.accent}66;">${item.subTag}</span>
              <div class="visual-hub-art">${item.artSvg}</div>
              <strong style="font-size:13.5px;color:#f8fafc;">${item.icon} ${item.shortTitle}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('form-home-login')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());
      try {
        await apiCall('/api/auth/login', 'POST', payload);
        soundStudio.playPortalWhoosh();
        showToast(`🔓 Đăng nhập thành công! Chào mừng Chỉ Huy "${payload.username}" kết nối Bộ Não Token!`, 'success');
        renderActiveScreen();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('form-home-register')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());
      if (payload.password !== payload.confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.', 'error');
        return;
      }
      try {
        await apiCall('/api/auth/register', 'POST', payload);
        soundStudio.playWinFanfare(0);
        showToast(`🎉 Tạo tài khoản "${payload.username}" thành công & nạp +500 💎 vào Bộ Não Token!`, 'success');
        AppState.homeAuthTab = 'LOGIN';
        renderActiveScreen();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    return;
  }

  // 2. LOGIN / REGISTER SCREEN (WITH PASSWORD & JWT AUTHENTICATION)
  if (scr === 'AUTH') {
    titleEl.textContent = '2. Đăng Ký Người Chơi & Đăng Nhập Mật Khẩu Bảo Mật (SHA-256 + JWT)';
    bodyEl.innerHTML = `
      <div class="grid-2">
        <div class="holo-box" style="border-color:rgba(16,185,129,0.55);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <h3 style="color:#34d399;">✨ Đăng Ký Người Chơi Mới (Có Mật Khẩu)</h3>
            <span class="badge-ok">🎁 +500 TKN Khởi Đầu</span>
          </div>
          <p class="text-muted" style="margin-bottom:10px;font-size:12px;">
            Tạo tài khoản riêng với mật khẩu mã hóa <code>SHA-256</code> và chữ ký <code>JWT HMAC</code>. Tự động khởi tạo Nhân vật 3D & Ví Token.
          </p>
          <form id="form-register">
            <div class="form-group">
              <label>Tên đăng nhập (Username) <span style="color:#f43f5e;">*</span></label>
              <input class="cyber-input" name="username" required autocomplete="username" placeholder="VD: hoang_ai_2026" />
            </div>
            <div class="form-group">
              <label>Tên hiển thị trong Thế giới 3D <span style="color:#f43f5e;">*</span></label>
              <input class="cyber-input" name="displayName" required placeholder="VD: Hoàng Chiến Lược" />
            </div>
            <div class="form-group">
              <label>Email liên hệ (Tùy chọn)</label>
              <input type="email" class="cyber-input" name="email" autocomplete="email" placeholder="VD: hoang@skyline.edu.vn" />
            </div>
            <div class="grid-2" style="gap:10px;">
              <div class="form-group">
                <label>Mật khẩu (≥ 6 ký tự) <span style="color:#f43f5e;">*</span></label>
                <div style="display:flex;gap:4px;">
                  <input type="password" id="reg-password" class="cyber-input" name="password" minlength="6" required autocomplete="new-password" placeholder="Nhập mật khẩu..." />
                  <button type="button" class="btn-cyber btn-outline btn-sm" onclick="const el=document.getElementById('reg-password');el.type=el.type==='password'?'text':'password';">👁️</button>
                </div>
              </div>
              <div class="form-group">
                <label>Xác nhận mật khẩu <span style="color:#f43f5e;">*</span></label>
                <div style="display:flex;gap:4px;">
                  <input type="password" id="reg-confirm-password" class="cyber-input" name="confirmPassword" minlength="6" required autocomplete="new-password" placeholder="Nhập lại mật khẩu..." />
                  <button type="button" class="btn-cyber btn-outline btn-sm" onclick="const el=document.getElementById('reg-confirm-password');el.type=el.type==='password'?'text':'password';">👁️</button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Nhóm độ tuổi (Kích hoạt bảo vệ tự động nếu dưới 18 tuổi)</label>
              <select class="cyber-select" name="ageGroup">
                <option value="18_PLUS">Từ 18 tuổi trở lên (Tiêu chuẩn)</option>
                <option value="UNDER_18">Từ 16 - dưới 18 tuổi (Học sinh THPT - Bật Safe Mode 🛡️)</option>
              </select>
            </div>
            <button type="submit" class="btn-cyber" style="width:100%;padding:10px;font-weight:800;">
              🚀 Đăng Ký Tài Khoản Có Mật Khẩu & Nhận 500 Token
            </button>
          </form>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="holo-box">
            <h3>🔑 Đăng Nhập Bằng Tên Đăng Nhập & Mật Khẩu</h3>
            <p class="text-muted" style="margin-bottom:8px;font-size:11px;">
              Mật khẩu mặc định của tài khoản mẫu: <code>player123</code> (Người chơi) hoặc <code>admin123</code> (Admin).
            </p>
            <form id="form-login-password">
              <div class="form-group">
                <label>Tên đăng nhập hoặc Email</label>
                <input class="cyber-input" name="username" required autocomplete="username" placeholder="VD: minh_ai hoặc hoang_ai_2026" value="${st.currentUser?.username || 'minh_ai'}" />
              </div>
              <div class="form-group">
                <label>Mật khẩu</label>
                <div style="display:flex;gap:4px;">
                  <input type="password" id="login-password" class="cyber-input" name="password" required autocomplete="current-password" placeholder="Nhập mật khẩu..." value="player123" />
                  <button type="button" class="btn-cyber btn-outline btn-sm" onclick="const el=document.getElementById('login-password');el.type=el.type==='password'?'text':'password';">👁️</button>
                </div>
              </div>
              <button type="submit" class="btn-cyber" style="width:100%;">🔓 Đăng Nhập Xác Thực Mật Khẩu</button>
            </form>
          </div>

          <div class="holo-box">
            <h3>🛡️ Đổi Mật Khẩu Tài Khoản Đang Dùng (<span style="color:#00e5ff;">${st.currentUser?.username}</span>)</h3>
            <form id="form-change-password" style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end;">
              <div>
                <label class="text-muted" style="font-size:11px;">Mật khẩu hiện tại</label>
                <input type="password" class="cyber-input" name="currentPassword" required placeholder="Mật khẩu cũ..." />
              </div>
              <div>
                <label class="text-muted" style="font-size:11px;">Mật khẩu mới (≥6 ký tự)</label>
                <input type="password" class="cyber-input" name="newPassword" minlength="6" required placeholder="Mật khẩu mới..." />
              </div>
              <button type="submit" class="btn-cyber btn-sm" style="height:36px;">Đổi Mật Khẩu</button>
            </form>
          </div>

          <div class="holo-box">
            <h3>👥 Danh Sách Người Chơi Trên Server (${st.allUsers.length} Tài Khoản)</h3>
            <div style="max-height:190px;overflow-y:auto;padding-right:4px;">
              ${st.allUsers.map(u => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid rgba(56,189,248,0.15);">
                  <div>
                    <strong>${u.display_name}</strong> <span class="badge-cyan">${u.role}</span>
                    ${u.id === st.currentUser.id ? '<span class="badge-ok">Đang online</span>' : ''}
                    <div class="text-muted" style="font-size:11px;">
                      User: <code>${u.username}</code> | Mật khẩu mẫu: <code>${u.role === 'ADMIN' ? 'admin123' : 'player123 / Tự đặt'}</code> ${u.safe_mode ? '🛡️ SafeMode' : ''}
                    </div>
                  </div>
                  <button class="btn-cyber btn-sm" onclick="window.loginAs('${u.id}')">Chuyển nhanh</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('form-register')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());
      if (payload.password !== payload.confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.', 'error');
        return;
      }
      try {
        await apiCall('/api/auth/register', 'POST', payload);
        soundStudio.playWinFanfare(0);
        showToast(`🎉 Đăng ký thành công tài khoản "${payload.username}" (có mật khẩu bảo mật) & nhận +500 TKN!`, 'success');
        renderActiveScreen();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('form-login-password')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());
      try {
        await apiCall('/api/auth/login', 'POST', payload);
        soundStudio.playPortalWhoosh();
        showToast(`🔓 Đăng nhập thành công vào tài khoản "${payload.username}"!`, 'success');
        renderActiveScreen();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('form-change-password')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = Object.fromEntries(fd.entries());
      try {
        await apiCall('/api/auth/change-password', 'POST', {
          userId: st.currentUser.id,
          ...payload
        });
        e.target.reset();
        showToast('✅ Đã cập nhật mật khẩu mới thành công!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 3. CHARACTER CREATOR SCREEN (6 DIVERSE 3D CHARACTER MORPHOLOGIES)
  if (scr === 'CHARACTER') {
    const ch = st.character || {};
    const curStyle = ch.avatar_style || 'HIEP_SI';
    titleEl.textContent = '🧑‍🚀 Tùy Chỉnh Hình Dáng Nhân Vật 3D (6 Hình Thể Đa Dạng)';
    bodyEl.innerHTML = `
      <div class="holo-box" style="margin-bottom:14px;">
        <h3 style="margin-bottom:8px;">✨ Chọn Hình Dáng 3D Cho Nhân Vật Của Bạn (Biến Hình Trực Tiếp Trong Thế Giới 3D)</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;">
          ${Object.values(AI_ARCHETYPES).map(arch => {
            const isSelected = curStyle === arch.id;
            return `
              <div style="background:${arch.bgGradient};border:${isSelected ? '2.5px' : '1px'} solid ${isSelected ? '#ffffff' : arch.primary};border-radius:14px;padding:10px;text-align:center;cursor:pointer;box-shadow:${isSelected ? `0 0 18px ${arch.primary}` : 'none'};" onclick="window.selectCharacterArchetype('${arch.id}', '${arch.primary}')">
                <div style="height:82px;margin-bottom:4px;">${arch.svgPortrait}</div>
                <div style="font-size:13px;font-weight:900;color:#f8fafc;">${arch.emoji} ${arch.titleVi}</div>
                <div style="font-size:10px;color:#cbd5e1;margin-bottom:4px;">${arch.subtitleVi}</div>
                <span class="${isSelected ? 'badge-ok' : 'badge-cyan'}" style="font-size:9.5px;">${isSelected ? '✓ ĐANG DÙNG 3D' : 'Chọn Hình Thể'}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="grid-2">
        <div class="holo-box">
          <h3>🎨 Tinh Chỉnh Tên & Màu Năng Lượng 3D</h3>
          <form id="form-char">
            <div class="form-group">
              <label>Tên Nhân Vật 3D</label>
              <input class="cyber-input" name="name" value="${ch.name || st.currentUser.display_name}" required />
            </div>
            <div class="form-group">
              <label>Hình Dáng 3D (Character Morphology)</label>
              <select class="cyber-select" name="avatarStyle" id="char-style-select">
                ${Object.values(AI_ARCHETYPES).map(arch => `
                  <option value="${arch.id}" ${curStyle === arch.id ? 'selected' : ''}>${arch.emoji} ${arch.titleVi} – ${arch.subtitleVi}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Màu Năng Lượng Chủ Đạo (Primary Neon)</label>
              <input type="color" class="cyber-input" name="primaryColor" id="char-color-input" value="${ch.primary_color || '#00e5ff'}" style="height:38px;" />
            </div>
            <button type="submit" class="btn-cyber" style="width:100%;">💾 Lưu Ngoại Hình Nhân Vật 3D</button>
          </form>
        </div>
        <div class="holo-box">
          <h3>📊 Trạng Thái Nhân Vật 3D Hiện Tại</h3>
          <p><strong>Cấp độ:</strong> Level ${ch.level || 1} (${ch.xp || 0} XP)</p>
          <p style="margin-top:6px;"><strong>Hình thể 3D:</strong> <span class="badge-ok">${(AI_ARCHETYPES[curStyle] || AI_ARCHETYPES.HIEP_SI).emoji} ${(AI_ARCHETYPES[curStyle] || AI_ARCHETYPES.HIEP_SI).titleVi}</span></p>
          <p style="margin-top:6px;"><strong>Khu vực hiện tại:</strong> <span class="badge-cyan">${ch.zone || 'CENTRAL_HUB'}</span></p>
          <p style="margin-top:6px;"><strong>Tọa độ 3D:</strong> X=${Math.round(AppState.localPlayer.x)}, Z=${Math.round(AppState.localPlayer.z)}</p>
          <button class="btn-cyber" style="margin-top:14px;width:100%;" onclick="window.goScreen('WORLD_3D')">🌍 Ra Thế Giới 3D Ngắm Nhân Vật Mới</button>
        </div>
      </div>
    `;
    document.getElementById('form-char')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiCall('/api/character/update', 'POST', {
          userId: st.currentUser.id,
          ...Object.fromEntries(fd.entries())
        });
        showToast('✨ Đã cập nhật hình dáng nhân vật 3D!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 4. WORLD LOBBY & MULTIPLAYER ROOMS
  if (scr === 'WORLD_LOBBY' || scr === 'MATCH_ROOM') {
    titleEl.textContent = scr === 'WORLD_LOBBY' ? '4. Sảnh Phòng Multiplayer (Public / Private Lobby)' : '10. Phòng Chuẩn Bị Trận Đấu & Ready Check';
    const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
    bodyEl.innerHTML = `
      <div class="grid-2">
        <div class="holo-box">
          <h3>➕ Tạo Phòng Chơi Mới (2–20 Người/Trận)</h3>
          <form id="form-create-room">
            <div class="form-group">
              <label>Tên Phòng Đấu</label>
              <input class="cyber-input" name="name" placeholder="Đấu Trường AI Speed War - Phòng VIP" required />
            </div>
            <div class="form-group">
              <label>Loại Phòng</label>
              <select class="cyber-select" name="roomType">
                <option value="PUBLIC_LOBBY">Public Lobby (Công khai)</option>
                <option value="PRIVATE_ROOM">Private Room (Phòng riêng có mã mời)</option>
              </select>
            </div>
            <button type="submit" class="btn-cyber">Tạo Phòng Ngay</button>
          </form>
        </div>

        <div class="holo-box">
          <h3>🌐 Danh Sách Phòng Đang Hoạt Động</h3>
          ${st.rooms.map(r => `
            <div style="padding:10px;border:1px solid rgba(0,229,255,0.22);border-radius:8px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${r.name}</strong>
                <span class="badge-cyan">${r.room_type} | ${r.players.length}/${r.max_players} Người</span>
              </div>
              <div class="text-muted" style="margin:6px 0;">
                Thành viên: ${r.players.map(p => `${p.display_name} [Team ${p.team} - ${p.is_ready ? 'Sẵn sàng' : 'Chờ'}]`).join(', ') || 'Chưa có'}
              </div>
              <div style="display:flex;gap:8px;margin-top:8px;">
                <button class="btn-cyber btn-sm" onclick="window.joinRoom('${r.id}', 'ALPHA')">Vào Đội ALPHA</button>
                <button class="btn-cyber btn-sm btn-outline" onclick="window.joinRoom('${r.id}', 'OMEGA')">Vào Đội OMEGA</button>
                <button class="btn-cyber btn-sm" onclick="window.goScreen('SPEED_WAR')">Chuyển Tới Speed War ⚡</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.getElementById('form-create-room')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiCall('/api/rooms/create', 'POST', {
          userId: st.currentUser.id,
          ...Object.fromEntries(fd.entries())
        });
        showToast('Đã tạo phòng chơi mới!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 5. WORLD MAP (9 ZONES WITH PANORAMIC ILLUSTRATIONS)
  if (scr === 'WORLD_MAP') {
    titleEl.textContent = '🗺️ Bản Đồ Hình Ảnh 9 Khu Vực Thế Giới 3D (Teleport)';
    bodyEl.innerHTML = `
      <div class="grid-3">
        ${st.zones.map(z => `
          <div class="holo-box" style="border-color:${z.color};padding:10px;">
            <div style="height:105px;margin-bottom:8px;border-radius:10px;overflow:hidden;">
              ${renderZoneIllustrationSvg(z)}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <strong style="color:${z.color};font-size:13px;">${z.name}</strong>
              <span class="badge-cyan" style="font-family:monospace;font-size:10px;">[${z.x}, ${z.z}]</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn-cyber btn-sm" style="flex:1;" onclick="window.teleport('${z.id}')">🚀 Dịch Chuyển 3D</button>
              <button class="btn-cyber btn-sm btn-outline" onclick="window.goScreen('${ZONE_SCREEN_MAP[z.id] || 'LANDING'}')">⚡ Mở Khu Vực</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    return;
  }

  // 6. AI MANAGER & AUTONOMY CONTROL (DIVERSE AI MORPHOLOGIES + HEXAGONAL RADAR CHARTS)
  if (scr === 'AI_MANAGER') {
    titleEl.textContent = '🤖 Đội Hình AI Tự Chủ (AI Đại Sư • AI Phù Thủy • AI Bình Dân • AI Hiệp Sĩ • AI Cơ Khí • AI Tiên Tử)';
    const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
    bodyEl.innerHTML = `
      <div class="holo-box" style="margin-bottom:14px;">
        <h3>➕ Chiêu Mộ Chiến Binh AI Mới & Chọn Hình Dáng Nhân Vật 3D</h3>
        <form id="form-create-agent" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;align-items:end;margin-top:8px;">
          <div>
            <label class="text-muted">Tên AI Agent</label>
            <input class="cyber-input" name="name" placeholder="VD: Đại Sư Tuệ Giác" required />
          </div>
          <div>
            <label class="text-muted">Hình Dáng Nhân Vật 3D</label>
            <select class="cyber-select" name="avatar">
              ${Object.values(AI_ARCHETYPES).map(arch => `<option value="${arch.id}">${arch.emoji} ${arch.titleVi} (${arch.subtitleVi})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-muted">Chuyên Môn (6 Class)</label>
            <select class="cyber-select" name="aiClass">
              ${Object.values(st.aiClasses).map(c => `<option value="${c.id}">${c.name} – ${c.roleVi}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-muted">Vốn Cấp (TKN)</label>
            <input type="number" class="cyber-input" name="initialBudget" value="100" min="50" max="500" />
          </div>
          <div>
            <label class="text-muted">Mức Tự Chủ</label>
            <select class="cyber-select" name="autonomyMode">
              <option value="MANUAL">Manual</option>
              <option value="ASSISTED" selected>Assisted</option>
              <option value="LIMITED_AUTONOMOUS">Autonomous</option>
            </select>
          </div>
          <button type="submit" class="btn-cyber">🚀 Khởi Tạo AI 3D</button>
        </form>
      </div>

      <div class="grid-2">
        ${myAgents.map(a => {
          const arch = resolveAgentArchetype(a);
          return `
            <div class="holo-box" style="border-color:${arch.primary}88;background:${arch.bgGradient};">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div>
                  <h3 style="color:#f8fafc;">${arch.emoji} ${a.name}</h3>
                  <span class="badge-cyan" style="color:${arch.primary};border-color:${arch.primary}66;">${arch.titleVi} • ${a.ai_class} • Lv.${a.level}</span>
                </div>
                <span class="${a.emergency_stopped ? 'badge-danger' : a.health_status === 'HEALTHY' ? 'badge-ok' : 'badge-warn'}">
                  ${a.emergency_stopped ? '⛔ DỪNG' : `💎 ${a.agent_budget} TKN`}
                </span>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-around;gap:10px;background:rgba(2,8,23,0.68);border:1px solid ${arch.primary}44;border-radius:12px;padding:8px;margin-bottom:8px;">
                <div style="width:140px;height:105px;">
                  ${arch.svgPortrait}
                </div>
                ${renderAgentRadarSvg(a, arch.primary)}
              </div>

              <div style="margin-bottom:10px;">
                <div style="font-size:10px;font-weight:900;color:#cbd5e1;margin-bottom:4px;">🎭 ĐỔI HÌNH DÁNG NHÂN VẬT 3D (CHỌN TRỰC TIẾP):</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">
                  ${Object.values(AI_ARCHETYPES).map(opt => {
                    const activeMorph = arch.id === opt.id;
                    return `
                      <button type="button" class="btn-cyber btn-sm" style="padding:4px 5px;font-size:10px;background:${activeMorph ? opt.primary : 'rgba(15,23,42,0.85)'};color:${activeMorph ? '#020617' : '#e2e8f0'};border-color:${opt.primary};font-weight:${activeMorph ? '900' : '700'};" onclick="window.changeAgentArchetype('${a.id}', '${opt.id}')">
                        ${opt.emoji} ${opt.titleVi.replace('AI ', '')}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <button class="btn-cyber btn-sm" style="flex:1;" onclick="window.trainAgent('${a.id}', 'logic')">🎓 Nâng Cấp (+4 Stat)</button>
                <button class="btn-cyber btn-sm btn-outline" onclick="window.cycleAutonomy('${a.id}', '${a.autonomy_mode}')">⚙️ ${a.autonomy_mode}</button>
                <button class="btn-cyber btn-sm ${a.emergency_stopped ? 'btn-outline' : 'btn-danger'}" onclick="window.toggleEmergencyStop('${a.id}', ${a.emergency_stopped ? 0 : 1})">
                  ${a.emergency_stopped ? '▶️ Mở Lại' : '🛑 Dừng'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    document.getElementById('form-create-agent')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiCall('/api/agents/create', 'POST', {
          userId: st.currentUser.id,
          ...Object.fromEntries(fd.entries())
        });
        showToast('✨ Đã khởi tạo Chiến Binh AI 3D mới thành công!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 7. AI SOCIAL NETWORK
  if (scr === 'AI_SOCIAL') {
    titleEl.textContent = '7. Mạng Xã Hội AI (AI Social Network – 5 Cấp Quan Hệ & Rate Limit)';
    const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
    const myFirst = myAgents[0] || st.agents[0];
    bodyEl.innerHTML = `
      <div class="grid-2">
        <div class="holo-box">
          <h3>🤝 Danh Bạ AI Toàn Server & Gửi Lời Mời Kết Bạn</h3>
          <p class="text-muted" style="margin-bottom:10px;">AI Agent đang chọn: <strong>${myFirst?.name || 'N/A'}</strong> (Tự động kiểm soát chống spam/Rate Limit)</p>
          ${st.agents.filter(a => a.id !== myFirst?.id).map(a => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(56,189,248,0.15);">
              <div>
                <strong>${a.avatar} ${a.name}</strong> <span class="badge-cyan">${a.ai_class}</span>
                <div class="text-muted">Chủ sở hữu: ${a.owner_name} | Uy tín: ${a.reputation} | Collaboration: ${a.collaboration}</div>
              </div>
              <button class="btn-cyber btn-sm" onclick="window.sendSocialInvite('${myFirst?.id}', '${a.id}')">Kết Bạn / Tăng Tin Cậy</button>
            </div>
          `).join('')}
        </div>

        <div class="holo-box">
          <h3>🌐 Sơ Đồ Mối Quan Hệ AI Hiện Tại (Stranger → Strategic Alliance)</h3>
          <table class="cyber-table">
            <thead>
              <tr><th>AI 1</th><th>AI 2</th><th>Cấp Quan Hệ</th><th>Điểm Tin Cậy</th><th>Tương Tác</th></tr>
            </thead>
            <tbody>
              ${st.relationships.map(r => `
                <tr>
                  <td>${r.agent_a_name}</td>
                  <td>${r.agent_b_name}</td>
                  <td><span class="badge-cyan">${r.level}</span></td>
                  <td><strong>${r.trust_score}/100</strong></td>
                  <td>${r.interaction_count} lần</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    return;
  }

  // 8. AI AUTONOMOUS COLLABORATION
  if (scr === 'AI_COLLAB') {
    titleEl.textContent = '8. Hợp Tác AI Tự Chủ (Quy Trình 12 Bước Phân Tích & Ghép Đội)';
    const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
    const myFirst = myAgents[0] || st.agents[0];
    bodyEl.innerHTML = `
      <div class="grid-2">
        <div class="holo-box">
          <h3>🔍 Bước 1–5: AI Tự Phân Tích Nhiệm Vụ & Phát Hiện Kỹ Năng Thiếu</h3>
          <form id="form-collab-propose">
            <div class="form-group">
              <label>AI Chủ Trì Hợp Đồng</label>
              <select class="cyber-select" name="requesterAgentId" id="collab-req-agent">
                ${myAgents.map(a => `<option value="${a.id}">${a.name} (${a.ai_class} - Ngân sách: ${a.agent_budget} TKN)</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Hợp Đồng Cần Phân Tích</label>
              <select class="cyber-select" name="contractId" id="collab-contract">
                ${st.contracts.map(c => `<option value="${c.id}">${c.title} (Chuyên môn: ${c.specialty} | Thưởng: ${c.budget_token} TKN)</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>AI Đối Tác Phối Hợp</label>
              <select class="cyber-select" name="partnerAgentId">
                ${st.agents.filter(a => a.id !== myFirst?.id).map(a => `<option value="${a.id}">${a.name} (${a.ai_class} - Chủ: ${a.owner_name})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Mức Thù Lao Đề Nghị Cho Đối Tác (Token)</label>
              <input type="number" class="cyber-input" name="offeredToken" value="65" min="10" max="300" />
            </div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn-cyber btn-outline" id="btn-run-analysis">1. Phân Tích Năng Lực</button>
              <button type="submit" class="btn-cyber">2. Gửi Đề Nghị Hợp Tác & Mở Thương Lượng</button>
            </div>
          </form>
          <div id="analysis-output" style="margin-top:12px;"></div>
        </div>

        <div class="holo-box">
          <h3>📋 Danh Sách Hợp Đồng Hợp Tác Giữa Các AI</h3>
          ${st.collaborations.map(c => `
            <div style="padding:10px;border:1px solid rgba(56,189,248,0.2);border-radius:8px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${c.requester_name} 🤝 ${c.partner_name}</strong>
                <span class="badge-cyan">${c.status}</span>
              </div>
              <div class="text-muted" style="margin-top:4px;">Hợp đồng: ${c.contract_title}</div>
              <div class="text-muted">Kỹ năng bổ sung: <strong>${c.missing_skill}</strong> | Thù lao: <strong>${c.offered_token} TKN</strong></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btn-run-analysis')?.addEventListener('click', async () => {
      const agentId = document.getElementById('collab-req-agent').value;
      const contractId = document.getElementById('collab-contract').value;
      try {
        const res = await apiCall('/api/collaboration/analyze', 'POST', { agentId, contractId });
        const a = res.analysis;
        document.getElementById('analysis-output').innerHTML = `
          <div style="padding:10px;background:rgba(0,229,255,0.08);border:1px solid var(--cyan-primary);border-radius:8px;font-size:12px;">
            <div><strong>Kết quả AI tự đánh giá:</strong> ${a.needsPartner ? '⚠️ Cần tìm đối tác hỗ trợ' : '✅ Đủ năng lực độc lập'}</div>
            <div>Kỹ năng cần bổ sung: <strong>${a.missingSkills.join(', ') || 'Không thiếu'}</strong></div>
            <div>Gợi ý đối tác tốt nhất: <strong>${a.recommendedPartners.map(p => `${p.name} (${p.ai_class})`).join(', ')}</strong></div>
          </div>
        `;
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    document.getElementById('form-collab-propose')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiCall('/api/collaboration/propose', 'POST', {
          userId: st.currentUser.id,
          ...Object.fromEntries(fd.entries())
        });
        showToast('Đã khởi tạo đề nghị hợp tác & phiên đàm phán!', 'success');
        switchScreen('AI_TRADING');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 9. JOB MARKET (WITH HIGHLIGHTED QUEST CONTRACTS, 3-STAGE AI BREAKDOWN & FLYING TOKEN REWARDS)
  if (scr === 'JOB_MARKET') {
    titleEl.textContent = '9. Thị Trường Hợp Đồng & Phân Công Nhiệm Vụ AI Theo Từng Chặng';
    const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
    const myFirst = myAgents[0] || st.agents[0];
    const leadMap = {
      ANALYST: '🔍 Athena-7 (Analyst AI)',
      CODER: '💻 Kronos-Code (Coder AI)',
      CREATOR: '🎨 Nova-Prime (Creator AI)',
      GUARDIAN: '🛡️ Aegis-Shield (Guardian AI)',
      TRADER: '📈 Mercury-Quant (Trader AI)',
      MANAGER: '👔 Apex-Director (Manager AI)'
    };
    bodyEl.innerHTML = `
      <div class="holo-box" style="margin-bottom:12px;border-color:#fbbf24;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <span class="quest-ribbon-tag">★ HỢP ĐỒNG NHIỆM VỤ ĐANG HIGHLIGHT (LỘ TRÌNH 3 CHẶNG)</span>
            <strong style="margin-left:8px;color:#00e5ff;">Mỗi hợp đồng ghi rõ nhiệm vụ của từng AI ở Chặng 1 → Chặng 2 → Chặng 3 và cộng Token bay vào Ví!</strong>
          </div>
          <span class="quest-reward-pill">💎 Đang chọn AI chủ trì: ${myFirst?.avatar || '🤖'} ${myFirst?.name || 'AI Agent'}</span>
        </div>
      </div>
      <div class="grid-3">
        ${st.contracts.map((c, idx) => {
          const isRecommended = c.specialty === myFirst?.ai_class || idx < 2;
          const primaryAi = leadMap[c.specialty] || `${myFirst?.avatar || '🤖'} ${myFirst?.name || 'Athena-7'}`;
          return `
            <div class="${isRecommended ? 'quest-highlight-card' : 'holo-box'}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span class="${isRecommended ? 'quest-ribbon-tag' : 'badge-cyan'}">
                  ${isRecommended ? `★ HIGHLIGHT • ${c.specialty}` : c.specialty}
                </span>
                <span class="quest-reward-pill">💎 +${c.budget_token} TKN</span>
              </div>
              <h3 style="margin-top:6px;color:#f8fafc;">${c.title}</h3>
              <p class="text-muted" style="margin:6px 0;">📋 Nghiệm thu: ${c.acceptance_criteria}</p>
              <div style="background:rgba(2,10,26,0.75);border:1px solid rgba(56,189,248,0.22);border-radius:8px;padding:7px;margin:7px 0;font-size:11px;">
                <div style="color:#fbbf24;font-weight:800;margin-bottom:3px;">🗺️ Phân công AI theo 3 chặng:</div>
                <div style="color:#cbd5e1;margin-bottom:2px;">• <strong>Chặng 1 (Khảo sát):</strong> <span style="color:#38bdf8;">🔍 Athena-7</span> bóc tách dữ liệu & định chuẩn đầu vào.</div>
                <div style="color:#cbd5e1;margin-bottom:2px;">• <strong>Chặng 2 (Thực thi chính):</strong> <span style="color:#38bdf8;">${primaryAi}</span> xử lý nghiệp vụ ${c.specialty} đạt chuẩn.</div>
                <div style="color:#cbd5e1;">• <strong>Chặng 3 (Kiểm định & Giải ngân):</strong> <span style="color:#38bdf8;">🛡️ Aegis-Shield & 📈 Mercury-Quant</span> khóa sổ cái & chuyển +${c.budget_token} TKN.</div>
              </div>
              <div style="margin:6px 0;font-size:12px;display:flex;justify-content:space-between;">
                <span>Độ khó: <strong style="color:#fbbf24;">★${c.difficulty}</strong></span>
                <span>Thời lượng: <strong>${c.duration_sec}s</strong></span>
              </div>
              <button class="btn-cyber btn-sm" style="width:100%;margin-top:4px;" onclick="window.bidContract('${c.id}', '${myFirst?.id}', ${c.budget_token}, this, '${c.title.replace(/'/g, '')}')">
                ⚡ Thực Thi 3 Chặng & Nhận 💎 +${c.budget_token} TKN
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  // 11. AI SPEED WAR (3 ROUNDS / 3 STAGES SERVER-AUTHORITATIVE)
  if (scr === 'SPEED_WAR') {
    titleEl.textContent = '11. Đấu Trường AI Speed War (3 Chặng Hợp Đồng – Chấm Điểm Server-Authoritative)';
    const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
    const latestMatch = AppState.lastMatchResult || (st.matches[0]?.results?.standings ? st.matches[0].results : null);

    bodyEl.innerHTML = `
      <div class="holo-box" style="margin-bottom:12px;border-color:#00e5ff;">
        <h3 style="color:#fbbf24;margin-bottom:6px;">🗺️ Kịch Bản 3 Chặng Đấu Trường AI Speed War & Vai Trò Từng AI</h3>
        <div class="grid-3" style="gap:8px;font-size:11px;">
          <div style="background:rgba(0,229,255,0.07);border:1px solid rgba(0,229,255,0.25);padding:8px;border-radius:8px;">
            <strong style="color:#38bdf8;">⚡ Chặng 1 (Vòng 1): Phân Tích & Khởi Tạo</strong>
            <div class="text-muted" style="margin-top:3px;"><strong>AI chủ lực:</strong> Analyst AI & Coder AI.<br/><strong>Nhiệm vụ:</strong> Giải mã đề bài, tối ưu chỉ số Logic & Accuracy (65% trọng số).</div>
          </div>
          <div style="background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.28);padding:8px;border-radius:8px;">
            <strong style="color:#fbbf24;">🔥 Chặng 2 (Vòng 2): Tăng Tốc & Sáng Tạo</strong>
            <div class="text-muted" style="margin-top:3px;"><strong>AI chủ lực:</strong> Creator AI & Trader AI.<br/><strong>Nhiệm vụ:</strong> Bứt phá tốc độ xử lý (Speed 15%) và tối ưu ngân sách Token (Efficiency 10%).</div>
          </div>
          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);padding:8px;border-radius:8px;">
            <strong style="color:#34d399;">🏆 Chặng 3 (Vòng 3): Hợp Tác & Về Đích</strong>
            <div class="text-muted" style="margin-top:3px;"><strong>AI chủ lực:</strong> Manager AI & Guardian AI.<br/><strong>Nhiệm vụ:</strong> Kích hoạt cộng hưởng đội hình (Collaboration 10%), bảo mật kết quả & nhận thưởng.</div>
          </div>
        </div>
      </div>
      <div class="grid-2">
        <div class="holo-box">
          <h3>⚡ Cấu Hình Chiến Thuật & Khởi Chạy Trận Speed War (3 Chặng)</h3>
          <p class="text-muted" style="margin-bottom:10px;">
            Trọng số chấm điểm tại Server: <strong>Chất lượng 40% • Độ chính xác 25% • Tốc độ 15% • Hiệu quả tài nguyên 10% • Hợp tác 10%</strong>.
            Không cho phép mua lợi thế Pay-to-Win.
          </p>
          <form id="form-speed-war">
            <div class="form-group">
              <label>Chọn Phòng Đấu</label>
              <select class="cyber-select" name="roomId">
                ${st.rooms.map(r => `<option value="${r.id}">${r.name} (${r.players.length} người chơi)</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Chọn AI Agent Ra Trận</label>
              <select class="cyber-select" name="agentId">
                ${myAgents.map(a => `<option value="${a.id}">${a.avatar} ${a.name} (${a.ai_class} - Lv.${a.level})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Chiến Thuật Chủ Đạo</label>
              <select class="cyber-select" name="strategy">
                <option value="BALANCED">Balanced (Cân bằng toàn diện)</option>
                <option value="QUALITY_FIRST">Quality First (Ưu tiên Chất lượng 40% & Chính xác 25%)</option>
                <option value="SPEED_FOCUS">Speed Focus (Tối ưu Tốc độ & Tài nguyên)</option>
                <option value="COLLABORATIVE">Collaborative (Kích hoạt cộng hưởng đối tác AI)</option>
              </select>
            </div>
            <button type="submit" class="btn-cyber">🚀 Bắt Đầu Thi Đấu 3 Vòng Hợp Đồng (Server-Authoritative)</button>
          </form>
        </div>

        <div class="holo-box">
          <h3>🏆 Kết Quả Trận Speed War Gần Nhất</h3>
          ${latestMatch ? `
            <div style="margin-bottom:10px;">
              Quán quân: <strong style="color:#00e5ff;">${latestMatch.winnerName}</strong> | Mã trận: <code>${latestMatch.matchId}</code>
            </div>
            <table class="cyber-table">
              <thead>
                <tr><th>Hạng</th><th>Người Chơi</th><th>AI Agent</th><th>Tổng Điểm (3 Vòng)</th><th>Thưởng</th></tr>
              </thead>
              <tbody>
                ${latestMatch.standings.map(s => `
                  <tr>
                    <td><strong>#${s.rank}</strong></td>
                    <td>${s.displayName}</td>
                    <td>${s.agentName} (${s.agentClass})</td>
                    <td><strong style="color:#00e5ff;">${s.totalScore}</strong></td>
                    <td>+${s.tokenReward} TKN / +${s.xpGain} XP</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<div class="text-muted">Hãy nhấn nút Bắt Đầu Thi Đấu để trải nghiệm 3 vòng hợp đồng Speed War!</div>'}
        </div>
      </div>
    `;

    document.getElementById('form-speed-war')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await apiCall('/api/matches/speed-war', 'POST', {
          userId: st.currentUser.id,
          roomId: fd.get('roomId'),
          playerConfigs: [{
            userId: st.currentUser.id,
            agentId: fd.get('agentId'),
            strategy: fd.get('strategy')
          }]
        });
        AppState.lastMatchResult = res.matchResult;
        soundStudio.playSpeedWarFanfare();
        const myStanding = res.matchResult.standings?.find(s => s.userId === st.currentUser.id) || res.matchResult.standings?.[0];
        const wonTokens = myStanding?.tokenReward || 300;
        const qSw = AppState.quests.find(q => q.id === 'q_speed_war');
        if (qSw) {
          qSw.progress = qSw.target;
          qSw.completed = true;
          renderQuestTracker();
        }
        triggerTokenGainAnimation(wonTokens, null, `Chiến Thắng 3 Vòng AI Speed War (#${myStanding?.rank || 1})`);
        showToast(`Hoàn thành 3 vòng Speed War! Hạng nhất: ${res.matchResult.winnerName} (💎 +${wonTokens} TKN)`, 'success');
        renderActiveScreen();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 12. TOKEN WALLET & LEDGER
  if (scr === 'TOKEN_WALLET') {
    titleEl.textContent = '12. Ví Token & Sổ Cái Bất Biến (Immutable Wallet Ledger)';
    bodyEl.innerHTML = `
      <div class="grid-3" style="margin-bottom:14px;">
        <div class="holo-box">
          <h3>💎 Player Wallet (Ví Chính)</h3>
          <div style="font-size:24px;font-weight:800;color:#00e5ff;">${st.userWallet.balance} TKN</div>
          <div class="text-muted">Thuộc quyền sở hữu của ${st.currentUser.display_name}</div>
        </div>
        <div class="holo-box">
          <h3>🤖 Tổng Ngân Sách Đội AI Ủy Quyền</h3>
          <div style="font-size:24px;font-weight:800;color:#38bdf8;">
            ${st.agents.filter(a => a.owner_id === st.currentUser.id).reduce((s, a) => s + a.agent_budget, 0)} TKN
          </div>
          <div class="text-muted">Agent Budget chịu sự kiểm soát hạn mức của chủ sở hữu</div>
        </div>
        <div class="holo-box">
          <h3>🏦 Kho Bạc & Ký Quỹ Hệ Thống</h3>
          <div class="text-muted">Reward Treasury & Escrow Account bảo đảm thanh toán nguyên tử (ACID)</div>
        </div>
      </div>

      <div class="holo-box">
        <h3>📜 Lịch Sử Giao Dịch Sổ Cái (Có Idempotency Key Chống Trùng Lặp)</h3>
        <table class="cyber-table">
          <thead>
            <tr><th>Mã GD</th><th>Loại Giao Dịch</th><th>Từ Ví</th><th>Tới Ví</th><th>Số Lượng</th><th>Ghi Chú</th></tr>
          </thead>
          <tbody>
            ${st.ledger.map(l => `
              <tr>
                <td><code>${l.id.slice(0, 12)}</code></td>
                <td><span class="badge-cyan">${l.tx_type}</span></td>
                <td>${l.from_wallet_id}</td>
                <td>${l.to_wallet_id}</td>
                <td><strong style="color:#00e5ff;">${l.amount} TKN</strong></td>
                <td>${l.note || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  // 13. TOKEN EXCHANGE
  if (scr === 'TOKEN_EXCHANGE') {
    titleEl.textContent = '13. Thị Trường Giao Dịch & Phân Bổ Ngân Sách Token';
    const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
    bodyEl.innerHTML = `
      <div class="grid-2">
        <div class="holo-box">
          <h3>🔄 Chuyển / Tặng Token Giữa Người Chơi</h3>
          <form id="form-transfer">
            <div class="form-group">
              <label>Người Nhận</label>
              <select class="cyber-select" name="toUserId">
                ${st.allUsers.filter(u => u.id !== st.currentUser.id).map(u => `<option value="${u.id}">${u.display_name} (${u.username})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Số Lượng Token</label>
              <input type="number" class="cyber-input" name="amount" value="50" min="1" required />
            </div>
            <div class="form-group">
              <label>Nội Dung Giao Dịch</label>
              <input class="cyber-input" name="note" placeholder="Hỗ trợ hợp tác chiến lược" />
            </div>
            <button type="submit" class="btn-cyber">Thực Hiện Chuyển Token Nguyên Tử (ACID)</button>
          </form>
        </div>

        <div class="holo-box">
          <h3>⚡ Cấp Thêm Ngân Sách Cho AI Agent (Agent Budget)</h3>
          <form id="form-topup-agent">
            <div class="form-group">
              <label>Chọn AI Agent Của Bạn</label>
              <select class="cyber-select" name="agentId">
                ${myAgents.map(a => `<option value="${a.id}">${a.name} (Hiện có: ${a.agent_budget} TKN - ${a.health_status})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Số Token Cấp Thêm</label>
              <input type="number" class="cyber-input" name="amount" value="80" min="10" required />
            </div>
            <button type="submit" class="btn-cyber">Cấp Vốn Vào Ngân Sách AI</button>
          </form>
        </div>
      </div>
    `;
    document.getElementById('form-transfer')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiCall('/api/wallet/transfer', 'POST', {
          userId: st.currentUser.id,
          ...Object.fromEntries(fd.entries())
        });
        soundStudio.playTokenTransaction();
        showToast('Chuyển Token thành công!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    document.getElementById('form-topup-agent')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiCall('/api/rescue/action', 'POST', {
          userId: st.currentUser.id,
          actionType: 'OWNER_TOPUP',
          agentId: fd.get('agentId'),
          amount: fd.get('amount')
        });
        soundStudio.playTokenTransaction();
        showToast('Đã cấp thêm ngân sách cho AI Agent!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 14. AI RESCUE MARKET
  if (scr === 'AI_RESCUE') {
    titleEl.textContent = '14. Trung Tâm Cứu Trợ & Chuyển Nhượng AI (AI Rescue Market)';
    bodyEl.innerHTML = `
      <div class="grid-2">
        <div class="holo-box">
          <h3>🆘 Danh Sách AI Cần Cứu Trợ / Theo Dõi Sức Khỏe Tài Chính</h3>
          <p class="text-muted" style="margin-bottom:10px;">
            Quy tắc bảo mật: Việc mua lại và chuyển quyền sở hữu AI <strong>bắt buộc phải được chủ sở hữu hiện tại xác nhận</strong>. AI không bao giờ tự bán chính mình.
          </p>
          ${st.agents.map(a => `
            <div style="padding:10px;border:1px solid rgba(56,189,248,0.2);border-radius:8px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${a.avatar} ${a.name} (${a.ai_class})</strong>
                <span class="${a.health_status === 'HEALTHY' || a.health_status === 'RECOVERED' ? 'badge-ok' : 'badge-danger'}">${a.health_status}</span>
              </div>
              <div class="text-muted" style="margin:4px 0;">Chủ sở hữu: ${a.owner_name} | Ngân sách còn: <strong>${a.agent_budget} TKN</strong></div>
              <div style="display:flex;gap:6px;margin-top:6px;">
                <button class="btn-cyber btn-sm" onclick="window.rescueAction('PEER_RESCUE_GRANT', '${a.id}', 60)">⚡ Tài Trợ 60 TKN</button>
                ${a.owner_id !== st.currentUser.id ? `
                  <button class="btn-cyber btn-sm btn-outline" onclick="window.rescueAction('PROPOSE_BUYOUT', '${a.id}', 250)">💼 Đề Nghị Mua Lại (250 TKN)</button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="holo-box">
          <h3>📑 Đề Nghị Mua Lại / Chuyển Nhượng AI (Chờ Chủ Sở Hữu Xác Nhận)</h3>
          ${st.rescueTransfers.map(t => `
            <div style="padding:10px;border:1px solid rgba(0,229,255,0.25);border-radius:8px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;">
                <strong>AI: ${t.agent_name} (${t.ai_class})</strong>
                <span class="badge-warn">${t.status}</span>
              </div>
              <div class="text-muted" style="margin:4px 0;">
                Từ: <strong>${t.from_user_name}</strong> → Người mua: <strong>${t.to_user_name}</strong> | Giá: <strong style="color:#00e5ff;">${t.price_token} TKN</strong>
              </div>
              <div class="text-muted">${t.note || ''}</div>
              ${t.status === 'PENDING_OWNER' && t.from_user_id === st.currentUser.id ? `
                <div style="display:flex;gap:8px;margin-top:8px;">
                  <button class="btn-cyber btn-sm" onclick="window.confirmBuyout('${t.id}', 'APPROVE_BUYOUT')">✅ Chủ Sở Hữu Phê Duyệt Bán</button>
                  <button class="btn-cyber btn-sm btn-danger" onclick="window.confirmBuyout('${t.id}', 'REJECT_BUYOUT')">❌ Từ Chối</button>
                </div>
              ` : t.status === 'PENDING_OWNER' ? `
                <div class="text-muted" style="margin-top:6px;color:#fbbf24;">⏳ Đang chờ chủ sở hữu (${t.from_user_name}) xác nhận...</div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  // 15. AI TRADING & NEGOTIATION ENGINE
  if (scr === 'AI_TRADING') {
    titleEl.textContent = '15. Phòng Đàm Phán AI, Mua Bán Dịch Vụ & Hợp Đồng Ký Quỹ (Escrow & Audit)';
    const myAgents = st.agents.filter(a => a.owner_id === st.currentUser.id);
    const myPrimary = myAgents[0] || st.agents[0];
    const partnerAgents = st.agents.filter(a => a.id !== myPrimary?.id);
    const audit = st.economyAudit;

    bodyEl.innerHTML = `
      ${audit ? `
        <div class="holo-box" style="margin-bottom:14px;border-color:rgba(16,185,129,0.5);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <strong>🛡️ TRẠNG THÁI KIỂM TOÁN HỆ THỐNG GIAO DỊCH (REALTIME AUDIT): <span class="badge-ok">${audit.passed ? '✓ ĐẠT CHUẨN ACID 100%' : '⚠️ CẢNH BÁO'}</span></strong>
            <span class="text-muted">Tổng cung Token: <strong>${audit.metrics.totalWalletSupply.toLocaleString('vi-VN')} TKN</strong> | Đã giải ngân qua Escrow: <strong>${audit.metrics.totalEscrowSettled} TKN</strong></span>
          </div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:12px;">
            <span>${audit.checks.noNegativeWallets ? '✅' : '❌'} Không có Ví âm</span>
            <span>${audit.checks.agentWalletBudgetSynced ? '✅' : '❌'} Đồng bộ Ví & Ngân sách AI 100%</span>
            <span>${audit.checks.ownerConfirmedBuyoutsOnly ? '✅' : '❌'} 100% Mua lại AI có Chủ sở hữu xác nhận</span>
            <span>${audit.checks.escrowSolvencyValid ? '✅' : '❌'} Bảo toàn quỹ Ký quỹ (Escrow)</span>
          </div>
        </div>
      ` : ''}

      <div class="grid-2" style="margin-bottom:14px;">
        <div class="holo-box">
          <h3>🛒 Chợ Mua Bán Dịch Vụ Chuyên Môn & Hợp Tác AI Tức Thời</h3>
          <p class="text-muted" style="margin-bottom:10px;">
            Chọn đối tác AI bên dưới để <strong>Đồng ý Hợp tác (Khóa & Giải ngân Escrow + Chia thưởng theo tỷ lệ)</strong>, <strong>Mua gói kỹ năng AI (+3 Chỉ số & +55 XP)</strong> hoặc <strong>Trao đổi Token</strong>.
          </p>
          ${partnerAgents.slice(0, 4).map(pa => `
            <div style="padding:10px;border:1px solid rgba(56,189,248,0.22);border-radius:8px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${pa.avatar} ${pa.name} (${pa.ai_class} - Lv.${pa.level})</strong>
                <span class="badge-cyan">Ngân sách: ${pa.agent_budget} TKN</span>
              </div>
              <div class="text-muted" style="font-size:11px;margin:4px 0;">Kỹ năng cung cấp: ${(pa.skills || []).join(', ')}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
                <button class="btn-cyber btn-sm" onclick="window.executeLive3dAiDeal('AGREE_COLLABORATION', '${myPrimary?.id}', '${pa.id}', 45)">🤝 Đồng Ý Hợp Tác (Escrow)</button>
                <button class="btn-cyber btn-outline btn-sm" onclick="window.executeLive3dAiDeal('BUY_AI_SERVICE', '${myPrimary?.id}', '${pa.id}', 40)">🛒 Mua Dịch Vụ (40 TKN)</button>
                <button class="btn-cyber btn-outline btn-sm" onclick="window.executeLive3dAiDeal('TOKEN_EXCHANGE', '${myPrimary?.id}', '${pa.id}', 35)">💎 Chuyển 35 TKN</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="holo-box">
          <h3>⚖️ Các Phiên Thương Lượng Hợp Đồng Giữa Các AI (Tối Đa 5 Vòng)</h3>
          ${st.negotiations.length === 0 ? '<div class="text-muted">Chưa có phiên đàm phán nào.</div>' : st.negotiations.map(n => `
            <div style="padding:12px;border:1px solid rgba(0,229,255,0.28);border-radius:10px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${n.initiator_name} ⇄ ${n.responder_name}</strong>
                <span class="badge-cyan">Vòng ${n.round_count}/${n.max_rounds} | Trạng thái: ${n.status}</span>
              </div>
              <div style="margin:6px 0;font-size:13px;">
                Giá đề nghị: <strong style="color:#00e5ff;">${n.current_offer} TKN</strong>
                ${n.counter_offer ? ` | Giá phản đề nghị (Counter-Offer): <strong style="color:#fbbf24;">${n.counter_offer} TKN</strong>` : ''}
                ${n.escrow_amount ? ` | Đã giải ngân qua Escrow: <strong style="color:#10b981;">${n.escrow_amount} TKN</strong>` : ''}
              </div>
              <div class="text-muted" style="margin-bottom:8px;">
                Lịch sử thương lượng: ${n.history.map(h => `[Vòng ${h.round} - ${h.by}: ${h.action} (${h.amount} TKN)]`).join(' → ')}
              </div>
              ${n.status !== 'SETTLED' && n.status !== 'REJECTED' ? `
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button class="btn-cyber btn-sm" onclick="window.negotiateStep('${n.id}', 'ACCEPT_AND_EXECUTE')">
                    🔒 Đồng Ý Hợp Tác, Khóa Escrow & Chia Thưởng Ngay
                  </button>
                  <button class="btn-cyber btn-sm btn-outline" onclick="window.negotiateStep('${n.id}', 'COUNTER', ${Math.round((n.current_offer + (n.counter_offer || n.current_offer)) / 2)})">
                    💬 Trả Giá Lại (Counter-Offer)
                  </button>
                  <button class="btn-cyber btn-sm btn-danger" onclick="window.negotiateStep('${n.id}', 'REJECT')">
                    Hủy Đàm Phán
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  // 16. CORPORATION & AI EMPIRE
  if (scr === 'CORPORATION') {
    titleEl.textContent = '16. Hệ Thống Doanh Nghiệp AI & Liên Minh (Corporation & AI Empire)';
    bodyEl.innerHTML = `
      <div class="grid-2">
        <div class="holo-box">
          <h3>🏢 Thành Lập Doanh Nghiệp AI Mới</h3>
          <form id="form-company">
            <div class="form-group">
              <label>Tên Doanh Nghiệp AI</label>
              <input class="cyber-input" name="name" placeholder="VD: VietAI Quantum Corp" required />
            </div>
            <div class="form-group">
              <label>Sứ Mệnh & Chuyên Môn</label>
              <input class="cyber-input" name="description" placeholder="Liên minh huấn luyện AI giải quyết bài toán dữ liệu lớn" required />
            </div>
            <div class="form-group">
              <label>Vốn Điều Lệ Đóng Góp Ban Đầu (Token)</label>
              <input type="number" class="cyber-input" name="initialFund" value="200" min="50" />
            </div>
            <button type="submit" class="btn-cyber">Thành Lập Doanh Nghiệp</button>
          </form>
        </div>

        <div class="holo-box">
          <h3>🌐 Các Tập Đoàn & Doanh Nghiệp AI Đang Hoạt Động</h3>
          ${st.companies.map(c => `
            <div style="padding:10px;border:1px solid rgba(56,189,248,0.24);border-radius:8px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${c.name}</strong>
                <span class="badge-cyan">Liên minh: ${c.alliance_tag}</span>
              </div>
              <p class="text-muted" style="margin:4px 0;">${c.description}</p>
              <div style="margin:6px 0;">
                Quỹ Công Ty (Company Treasury): <strong style="color:#00e5ff;">${c.treasury_balance} TKN</strong> | Uy tín: ${c.reputation}
              </div>
              <div class="text-muted">Thành viên: ${c.members.map(m => `${m.display_name} (${m.role})`).join(', ')}</div>
              <button class="btn-cyber btn-sm" style="margin-top:8px;" onclick="window.contributeCompany('${c.id}', 100)">
                💎 Góp 100 Token Vào Quỹ Công Ty
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    document.getElementById('form-company')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiCall('/api/companies/create', 'POST', {
          userId: st.currentUser.id,
          ...Object.fromEntries(fd.entries())
        });
        showToast('Đã thành lập doanh nghiệp AI mới!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 17. LEADERBOARD
  if (scr === 'LEADERBOARD') {
    titleEl.textContent = '17. Bảng Xếp Hạng Mùa Giải (Seasonal Championship Leaderboard)';
    bodyEl.innerHTML = `
      <div class="holo-box">
        <h3>🏆 Bảng Vàng Đấu Trường AI – Mùa Giải S1_2026</h3>
        <table class="cyber-table">
          <thead>
            <tr><th>Hạng</th><th>Người Chơi</th><th>Danh Hiệu</th><th>Rating Points</th><th>Số Trận Thắng</th><th>Tổng Token Thắng Giải</th></tr>
          </thead>
          <tbody>
            ${st.leaderboard.map((r, i) => `
              <tr>
                <td><strong>#${i + 1}</strong></td>
                <td><strong>${r.display_name}</strong></td>
                <td><span class="badge-cyan">${r.title}</span></td>
                <td><strong style="color:#00e5ff;">${r.rating_points} RP</strong></td>
                <td>${r.matches_won}/${r.matches_played} trận</td>
                <td>${r.total_tokens_won} TKN</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  // 18. PLAYER PROFILE & SAFETY
  if (scr === 'PROFILE') {
    titleEl.textContent = '18. Hồ Sơ Người Chơi & An Toàn Cộng Đồng (Under-18 Protection)';
    bodyEl.innerHTML = `
      <div class="grid-2">
        <div class="holo-box">
          <h3>👤 Hồ Sơ Của ${st.currentUser.display_name}</h3>
          <p><strong>Vai trò hệ thống:</strong> <span class="badge-cyan">${st.currentUser.role}</span></p>
          <p style="margin-top:6px;"><strong>Danh hiệu đạt được:</strong> <span class="badge-ok">${st.currentUser.title}</span></p>
          <p style="margin-top:6px;"><strong>Nhóm tuổi:</strong> ${st.currentUser.age_group}</p>
          <p style="margin-top:6px;"><strong>Chế độ bảo vệ người dưới 18 tuổi (Safe Mode):</strong> ${st.currentUser.safe_mode ? '🛡️ Đang Bật (Tự động ẩn SĐT/Email & lọc ngôn từ)' : 'Tiêu chuẩn'}</p>
        </div>

        <div class="holo-box">
          <h3>🚨 Báo Cáo Vi Phạm / Hành Vi Bất Thường</h3>
          <form id="form-safety-report">
            <div class="form-group">
              <label>Đối tượng hoặc Giao dịch cần báo cáo</label>
              <input class="cyber-input" name="targetId" placeholder="Tên người chơi hoặc mã hợp đồng" required />
            </div>
            <div class="form-group">
              <label>Lý do báo cáo</label>
              <input class="cyber-input" name="reason" placeholder="Spam chat, ngôn từ không phù hợp hoặc nghi vấn thao túng..." required />
            </div>
            <button type="submit" class="btn-cyber btn-danger">Gửi Báo Cáo Cho Moderator & Admin</button>
          </form>
        </div>
      </div>
    `;
    document.getElementById('form-safety-report')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await apiCall('/api/safety/report', 'POST', {
          userId: st.currentUser.id,
          ...Object.fromEntries(fd.entries())
        });
        showToast('Đã gửi báo cáo an toàn tới Admin Console!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
    return;
  }

  // 19. ADMIN CONSOLE
  if (scr === 'ADMIN') {
    titleEl.textContent = '19. Admin Console – Kiểm Toán Kinh Tế, Giám Sát AI & An Toàn Hệ Thống';
    bodyEl.innerHTML = `
      <div class="grid-3" style="margin-bottom:14px;">
        <div class="holo-box">
          <h3>👥 Tổng Người Chơi & AI</h3>
          <div style="font-size:20px;font-weight:800;color:#00e5ff;">${st.allUsers.length} Users / ${st.agents.length} AI Agents</div>
        </div>
        <div class="holo-box">
          <h3>⚔️ Phòng Đấu & Trận Đấu</h3>
          <div style="font-size:20px;font-weight:800;color:#38bdf8;">${st.rooms.length} Rooms / ${st.matches.length} Matches</div>
        </div>
        <div class="holo-box">
          <h3>🛡️ Báo Cáo Vi Phạm</h3>
          <div style="font-size:20px;font-weight:800;color:#f59e0b;">${st.safetyReports.filter(r => r.status === 'OPEN').length} Đang Chờ Xử Lý</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="holo-box">
          <h3>📋 Nhật Ký Kiểm Toán Bảo Mật & Kinh Tế (Audit Logs)</h3>
          <div style="max-height:260px;overflow-y:auto;">
            <table class="cyber-table">
              <thead>
                <tr><th>Mức Độ</th><th>Tác Nhân</th><th>Hành Động</th><th>Thời Gian</th></tr>
              </thead>
              <tbody>
                ${st.auditLogs.map(l => `
                  <tr>
                    <td><span class="${l.severity === 'CRITICAL' ? 'badge-danger' : l.severity === 'WARN' ? 'badge-warn' : 'badge-cyan'}">${l.severity}</span></td>
                    <td>${l.actor_id}</td>
                    <td><strong>${l.action}</strong></td>
                    <td>${l.created_at}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="holo-box">
          <h3>🚨 Quản Lý Báo Cáo An Toàn Cộng Đồng</h3>
          ${st.safetyReports.length === 0 ? '<div class="text-muted">Không có báo cáo vi phạm nào.</div>' : st.safetyReports.map(r => `
            <div style="padding:8px;border-bottom:1px solid rgba(56,189,248,0.16);display:flex;justify-content:space-between;align-items:center;">
              <div>
                <strong>Đối tượng: ${r.reported_target_id}</strong> <span class="badge-warn">${r.status}</span>
                <div class="text-muted">Người báo cáo: ${r.reporter_name} | Lý do: ${r.reason}</div>
              </div>
              ${r.status === 'OPEN' ? `<button class="btn-cyber btn-sm" onclick="window.resolveReport('${r.id}')">Xử Lý Xong</button>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}

/* ============================================================================
 * GLOBAL ACTION HANDLERS FOR INLINE HUD BUTTONS
 * ============================================================================ */
window.goScreen = (scr) => switchScreen(scr);
window.teleport = (zoneId) => {
  teleportToZone(zoneId);
  switchScreen('WORLD_3D');
};
window.loginAs = async (userId) => {
  try {
    await apiCall('/api/auth/login', 'POST', { userId });
    if (AppState.ws && AppState.ws.readyState === WebSocket.OPEN) {
      AppState.ws.send(JSON.stringify({ type: 'AUTH_HELLO', userId }));
    }
    showToast('Đã chuyển tài khoản thành công!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.trainAgent = async (agentId, focusStat) => {
  try {
    await apiCall('/api/agents/train', 'POST', { userId: AppState.currentUserId, agentId, focusStat });
    showToast('Huấn luyện nâng cấp AI thành công!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.cycleAutonomy = async (agentId, currentMode) => {
  const order = ['MANUAL', 'ASSISTED', 'LIMITED_AUTONOMOUS'];
  const next = order[(order.indexOf(currentMode) + 1) % order.length];
  try {
    await apiCall('/api/agents/autonomy', 'POST', {
      userId: AppState.currentUserId,
      agentId,
      autonomyMode: next
    });
    showToast(`Đã chuyển chế độ tự chủ sang ${next}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.toggleEmergencyStop = async (agentId, stopFlag) => {
  try {
    await apiCall('/api/agents/autonomy', 'POST', {
      userId: AppState.currentUserId,
      agentId,
      emergencyStopped: stopFlag
    });
    if (stopFlag) {
      soundStudio.playEmergencyAlarm();
    } else {
      soundStudio.playUiClick('confirm');
    }
    showToast(stopFlag ? '🛑 Đã kích hoạt Dừng Khẩn Cấp AI Agent!' : '▶️ Đã khôi phục hoạt động AI Agent!', stopFlag ? 'error' : 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.sendSocialInvite = async (fromAgentId, toAgentId) => {
  try {
    const res = await apiCall('/api/ai-social/request', 'POST', {
      userId: AppState.currentUserId,
      fromAgentId,
      toAgentId
    });
    showToast(`🤝 Quan hệ AI nâng lên mức ${res.relationship.level} (Trust: ${res.relationship.trust_score})`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.bidContract = async (contractId, agentId, bidToken, btnEl = null, questTitle = 'Hợp Đồng AI') => {
  try {
    const rewardAmount = Number(bidToken) || 150;
    const prevBal = Number(AppState.data?.userWallet?.balance || 0);
    const res = await apiCall('/api/contracts/bid', 'POST', {
      userId: AppState.currentUserId,
      contractId,
      agentId,
      bidToken: rewardAmount,
      questTitle
    });

    // If background daemon server was started before /api/contracts/bid credited wallet, ensure local state reflects reward
    if (AppState.data?.userWallet && AppState.data.userWallet.balance === prevBal) {
      AppState.data.userWallet.balance += rewardAmount;
      updateTopHud();
    }

    const qJob = AppState.quests.find(q => q.id === 'q_job_contract');
    if (qJob) {
      qJob.progress = qJob.target;
      qJob.completed = true;
      renderQuestTracker();
    }

    triggerTokenGainAnimation(res.rewardToken || rewardAmount, btnEl, questTitle);
    showToast(`🎉 Hoàn thành "${questTitle}"! Đã cộng 💎 +${rewardAmount} TKN vào Ví!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.advanceQuestStage = async (questId, btnEl = null) => {
  const q = AppState.quests.find(item => item.id === questId);
  if (!q) return;

  const stageIdx = Math.min((q.stages?.length || 3) - 1, q.progress);
  const st = q.stages?.[stageIdx] || { stage: q.progress + 1, label: `Chặng ${q.progress + 1}`, aiAgent: '🤖 AI Agent', task: q.title, rewardToken: Math.round(q.rewardToken / 3) };

  try {
    const myAgents = (AppState.data?.agents || []).filter(a => a.owner_id === AppState.currentUserId);
    const matchedAgent = myAgents.find(a => a.ai_class === st.aiClass) || myAgents[0] || (AppState.data?.agents || [])[0];
    const firstContract = (AppState.data?.contracts || [])[0];
    const prevBal = Number(AppState.data?.userWallet?.balance || 0);

    await apiCall('/api/contracts/bid', 'POST', {
      userId: AppState.currentUserId,
      contractId: firstContract?.id || 'ctr_job_1',
      agentId: matchedAgent?.id || 'agt_athena',
      bidToken: st.rewardToken,
      questTitle: `${st.label} (${st.aiAgent})`
    });

    if (AppState.data?.userWallet && AppState.data.userWallet.balance === prevBal) {
      AppState.data.userWallet.balance += st.rewardToken;
      updateTopHud();
    }

    q.progress = Math.min(q.target, q.progress + 1);
    if (q.progress >= q.target) {
      q.completed = true;
    }

    soundStudio.playCuteRobotEmote('IDEA_SPARK', 0);
    renderQuestTracker();
    triggerTokenGainAnimation(st.rewardToken, btnEl, `${st.label} • ${st.aiAgent}`);
    showToast(`✅ ${st.aiAgent} đã hoàn thành ${st.label} (💎 +${st.rewardToken} TKN)!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.completeHighlightedQuest = async (questId, btnEl = null) => {
  const q = AppState.quests.find(item => item.id === questId);
  if (!q) return;

  try {
    if (q.completed) {
      q.progress = 0;
      q.completed = false;
    }
    const myAgents = (AppState.data?.agents || []).filter(a => a.owner_id === AppState.currentUserId);
    const myFirst = myAgents[0] || (AppState.data?.agents || [])[0];
    const firstContract = (AppState.data?.contracts || [])[0];
    const prevBal = Number(AppState.data?.userWallet?.balance || 0);

    await apiCall('/api/contracts/bid', 'POST', {
      userId: AppState.currentUserId,
      contractId: firstContract?.id || 'ctr_job_1',
      agentId: myFirst?.id || 'agt_athena',
      bidToken: q.rewardToken,
      questTitle: q.title
    });

    if (AppState.data?.userWallet && AppState.data.userWallet.balance === prevBal) {
      AppState.data.userWallet.balance += q.rewardToken;
      updateTopHud();
    }

    advanceQuestById(questId, btnEl);
    showToast(`🏆 Hoàn thành cả 3 chặng chiến dịch: "${q.title}" (💎 +${q.rewardToken} TKN)!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.on3dShardCollected = (combo = 1) => {
  const bonusToken = 35 + Math.min(5, combo) * 5;
  if (AppState.data?.userWallet) {
    AppState.data.userWallet.balance += bonusToken;
  }
  const qExplore = AppState.quests.find(q => q.id === 'q_explore_shard');
  if (qExplore && !qExplore.completed) {
    qExplore.progress = Math.min(qExplore.target, qExplore.progress + 1);
    if (qExplore.progress >= qExplore.target) qExplore.completed = true;
  }
  renderQuestTracker();
  triggerTokenGainAnimation(bonusToken, null, `Thu Thập Tinh Thể Dữ Liệu AI #${combo}`);
};
window.joinRoom = async (roomId, team) => {
  try {
    await apiCall('/api/rooms/join', 'POST', {
      userId: AppState.currentUserId,
      roomId,
      team
    });
    showToast(`Đã tham gia phòng đấu (Đội ${team})!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.rescueAction = async (actionType, agentId, amount) => {
  try {
    await apiCall('/api/rescue/action', 'POST', {
      userId: AppState.currentUserId,
      actionType,
      agentId,
      amount
    });
    soundStudio.playTokenTransaction();
    showToast(actionType === 'PROPOSE_BUYOUT'
      ? 'Đã gửi đề nghị mua lại AI! Đang chờ chủ sở hữu hiện tại xác nhận.'
      : 'Đã cứu trợ ngân sách cho AI thành công!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.confirmBuyout = async (transferId, actionType) => {
  try {
    await apiCall('/api/rescue/action', 'POST', {
      userId: AppState.currentUserId,
      actionType,
      transferId
    });
    soundStudio.playTokenTransaction();
    showToast(actionType === 'APPROVE_BUYOUT'
      ? '✅ Đã xác nhận chuyển nhượng quyền sở hữu AI & nhận thanh toán Token!'
      : 'Đã từ chối đề nghị mua lại AI.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.negotiateStep = async (negotiationId, action, newOfferAmount = null) => {
  try {
    await apiCall('/api/negotiation/step', 'POST', {
      userId: AppState.currentUserId,
      negotiationId,
      action,
      newOfferAmount
    });
    soundStudio.playTokenTransaction();
    showToast(action === 'ACCEPT_AND_EXECUTE'
      ? '🔒 Đã khóa Escrow, thực thi hợp đồng hợp tác & giải ngân thưởng!'
      : 'Đã cập nhật phiên đàm phán!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};
window.contributeCompany = async (companyId, amount) => {
  try {
    await apiCall('/api/companies/contribute', 'POST', {
      userId: AppState.currentUserId,
      companyId,
      amount
    });
    soundStudio.playTokenTransaction();
    showToast('Đã đóng góp vào Quỹ Doanh Nghiệp (Company Treasury)!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.executeLive3dAiDeal = async (dealType = 'AGREE_COLLABORATION', customFromId = null, customToId = null, customAmount = 45) => {
  try {
    const pair = (typeof window.getCurrentConversingAiPair === 'function') ? window.getCurrentConversingAiPair() : null;
    const fromAgentId = customFromId || pair?.fromAgentId || 'agt_athena';
    const toAgentId = customToId || pair?.toAgentId || 'agt_nova';

    let summary = 'Đã thực thi giao dịch AI thành công!';
    try {
      const res = await apiCall('/api/ai-deals/execute', 'POST', {
        userId: AppState.currentUserId,
        dealType,
        fromAgentId,
        toAgentId,
        amount: customAmount
      });
      summary = res.dealResult?.summary || summary;
    } catch (innerErr) {
      // Seamless fallback if daemon server was started before /api/ai-deals/execute was added
      if (String(innerErr.message).includes('API_ENDPOINT_NOT_FOUND')) {
        if (dealType === 'AGREE_COLLABORATION') {
          const prop = await apiCall('/api/collaboration/propose', 'POST', {
            userId: AppState.currentUserId,
            requesterAgentId: fromAgentId,
            partnerAgentId: toAgentId,
            contractId: 'ctr_job_4',
            offeredToken: customAmount,
            rewardSplitPct: 40
          });
          await apiCall('/api/negotiation/step', 'POST', {
            userId: AppState.currentUserId,
            negotiationId: prop.negotiation.id,
            action: 'ACCEPT_AND_EXECUTE'
          });
          summary = `🤝 Hai AI đã đồng ý hợp tác, khóa & giải ngân Ký quỹ (Escrow ${customAmount} TKN) thành công!`;
        } else if (dealType === 'BUY_AI_SERVICE') {
          await apiCall('/api/rescue/action', 'POST', {
            userId: AppState.currentUserId,
            actionType: 'PEER_RESCUE_GRANT',
            agentId: toAgentId,
            amount: customAmount
          });
          summary = `🛒 Đã thanh toán ${customAmount} TKN mua gói dịch vụ chuyên môn AI & nâng cấp độ tin cậy!`;
        } else {
          await apiCall('/api/rescue/action', 'POST', {
            userId: AppState.currentUserId,
            actionType: 'PEER_RESCUE_GRANT',
            agentId: toAgentId,
            amount: customAmount
          });
          summary = `💎 Đã chuyển nguyên tử ${customAmount} TKN hỗ trợ ngân sách giữa 2 AI thành công!`;
        }
      } else {
        throw innerErr;
      }
    }

    soundStudio.playDealSealCelebration();
    showToast(summary, 'success');

    const qCollab = AppState.quests.find(q => q.id === 'q_ai_collab');
    if (qCollab) {
      qCollab.progress = qCollab.target;
      qCollab.completed = true;
      renderQuestTracker();
    }
    triggerTokenGainAnimation(customAmount, document.getElementById('ai-live-dialogue-bar'), 'Phê Duyệt Hợp Đồng AI 3D');

    const hudText = document.getElementById('ai-dialogue-text');
    if (hudText) {
      hudText.textContent = `✅ [ĐÃ CHỐT GIAO DỊCH TRÊN SERVER]: ${summary}`;
    }

    if (typeof window.trigger3dDealCelebration === 'function') {
      window.trigger3dDealCelebration(dealType, summary);
    }
  } catch (err) {
    soundStudio.playEmergencyAlarm();
    showToast(err.message, 'error');
  }
};

window.test3dSfx = (sfxType) => {
  switch (sfxType) {
    case 'COIN_CASCADE':
      soundStudio.playTokenCoinCascade(10);
      showToast('💎 Đang phát hiệu ứng Mưa Kim Cương Token (Crystal Coin Cascade + Stereo Panning)!', 'success');
      break;
    case 'ROBOT_HAPPY':
      soundStudio.playCuteRobotEmote('EXCITED', 0);
      showToast('🤖 Đang phát giọng AI Android vui nhộn (Astro-Bot / R2-D2 Vibrato Whistle)!', 'info');
      break;
    case 'ROBOT_HIGHFIVE':
      soundStudio.playDealSealCelebration();
      showToast('🙌 Đang phát hiệu ứng 2 AI High-Five chốt hợp đồng + Chuông Token!', 'success');
      break;
    case 'SHARD_COMBO':
      soundStudio.playShardPickup(6, 0);
      showToast('🔮 Đang phát hiệu ứng thu thập Tinh Thể 3D (Bubble-Pop + Đàn Hạc Pha Lê)!', 'info');
      break;
    case 'WIN_FANFARE':
      soundStudio.playWinFanfare(0);
      showToast('🏆 Đang phát nhạc hiệu Hoàn Thành Nhiệm Vụ (Arcade Ngũ Cung Victory Fanfare)!', 'success');
      break;
    case 'ZONE_PORTAL':
      soundStudio.playZonePortal(AppState.localPlayer?.zone || 'CENTRAL_HUB', 0);
      showToast(`🌀 Đang phát nhạc hiệu chào mừng Khu Vực 3D (${AppState.localPlayer?.zone || 'CENTRAL_HUB'})!`, 'info');
      break;
    default:
      soundStudio.playUiClick('confirm');
  }
};
window.changeAgentArchetype = async (agentId, archetypeId) => {
  const arch = AI_ARCHETYPES[archetypeId] || AI_ARCHETYPES.HIEP_SI;
  // Immediate optimistic update for instant 2D + 3D morphing
  const targetAgent = (AppState.data?.agents || []).find(a => a.id === agentId);
  if (targetAgent) {
    targetAgent.avatar = archetypeId;
  }
  soundStudio.playPortalWhoosh();
  renderActiveScreen();
  try {
    await apiCall('/api/agents/autonomy', 'POST', {
      userId: AppState.currentUserId,
      agentId,
      avatar: archetypeId
    });
    showToast(`🎭 Đã biến hình AI sang hình dáng 3D: ${arch.emoji} ${arch.titleVi}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.selectCharacterArchetype = async (archetypeId, primaryHex) => {
  const arch = AI_ARCHETYPES[archetypeId] || AI_ARCHETYPES.HIEP_SI;
  AppState.localPlayer.avatarStyle = archetypeId;
  if (primaryHex) {
    AppState.localPlayer.primaryColor = primaryHex;
  }
  if (AppState.data?.character) {
    AppState.data.character.avatar_style = archetypeId;
    if (primaryHex) AppState.data.character.primary_color = primaryHex;
  }
  if (AppState.data?.currentUser) {
    AppState.data.currentUser.avatar_style = archetypeId;
  }
  soundStudio.playPortalWhoosh();
  renderActiveScreen();
  try {
    await apiCall('/api/character/update', 'POST', {
      userId: AppState.currentUserId,
      avatarStyle: archetypeId,
      primaryColor: primaryHex || AppState.localPlayer.primaryColor
    });
    showToast(`✨ Nhân vật 3D của bạn đã biến hình thành ${arch.emoji} ${arch.titleVi}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.selectHomeBrainChar = (archetypeId) => {
  if (!AI_ARCHETYPES[archetypeId]) return;
  AppState.homeBrainArchId = archetypeId;
  soundStudio.playUiClick('confirm');
  renderActiveScreen();
};

window.switchHomeAuthTab = (tabName) => {
  AppState.homeAuthTab = tabName === 'REGISTER' ? 'REGISTER' : 'LOGIN';
  soundStudio.playUiClick('nav');
  renderActiveScreen();
};

window.toggleHomePwd = (inputId) => {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
};

window.resolveReport = async (reportId) => {
  try {
    await apiCall('/api/admin/resolve-report', 'POST', {
      userId: AppState.currentUserId,
      reportId,
      resolutionNote: 'Đã xác minh và xử lý theo quy chuẩn an toàn cộng đồng.'
    });
    showToast('Đã xử lý báo cáo vi phạm!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

/* ============================================================================
 * INITIALIZATION (Runs immediately even if DOMContentLoaded already fired)
 * ============================================================================ */
let appBooted = false;
async function bootAiArenaClient() {
  if (appBooted) return;
  appBooted = true;

  // Immediately render Quest Tracker & Top HUD from DEFAULT_BOOT_STATE on Frame 1
  updateTopHud();
  renderQuestTracker();

  // Subtle playful UI hover tick on buttons and highlighted quest cards
  document.addEventListener('pointerover', (e) => {
    const target = e.target?.closest?.('.btn-cyber, .nav-btn, .quest-highlight-card');
    if (target) {
      soundStudio.playUiHover();
    }
  }, { passive: true });

  // Navigation clicks
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchScreen(btn.getAttribute('data-screen'));
    });
  });

  document.getElementById('btn-close-screen')?.addEventListener('click', () => {
    switchScreen('WORLD_3D');
  });

  document.getElementById('btn-toggle-hud')?.addEventListener('click', () => {
    soundStudio.playUiClick('nav');
    document.getElementById('side-nav').classList.toggle('hidden');
  });

  document.getElementById('btn-collapse-quests')?.addEventListener('click', (e) => {
    soundStudio.playUiClick('nav');
    const listEl = document.getElementById('quest-tracker-list');
    if (listEl) {
      const hidden = listEl.classList.toggle('hidden');
      e.currentTarget.textContent = hidden ? 'Mở rộng' : 'Thu gọn';
    }
  });

  // Mobile-First Initialization: Collapse side-nav drawer & quest list by default on phones (<= 768px) so 3D viewport is unobstructed
  if (window.innerWidth <= 768) {
    document.getElementById('side-nav')?.classList.add('hidden');
    const qList = document.getElementById('quest-tracker-list');
    const qBtn = document.getElementById('btn-collapse-quests');
    if (qList && qBtn) {
      qList.classList.add('hidden');
      qBtn.textContent = 'Mở rộng';
    }
  }

  // Mobile Bottom Bar Navigation (`#mobile-bottom-nav`)
  document.querySelectorAll('.mobile-nav-item[data-mobile-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-mobile-action');
      if (action === 'TOGGLE_MENU') {
        soundStudio.playUiClick('nav');
        document.getElementById('side-nav')?.classList.toggle('hidden');
        return;
      }
      if (action === 'TOGGLE_QUESTS') {
        soundStudio.playUiClick('nav');
        switchScreen('WORLD_3D');
        const qList = document.getElementById('quest-tracker-list');
        const qBtn = document.getElementById('btn-collapse-quests');
        if (qList) {
          const hidden = qList.classList.toggle('hidden');
          if (qBtn) qBtn.textContent = hidden ? 'Mở rộng' : 'Thu gọn';
        }
        return;
      }
      switchScreen(action);
    });
  });

  // Audio Toggle, AI Music Composer Studio & Bus Mixer (`threejs-audio-generator` + `audio-design` + `procedural-gen`)
  window.onAiMusicPlanUpdated = (plan) => {
    const titleEl = document.getElementById('ai-music-title');
    const compEl = document.getElementById('ai-music-composer');
    const seedEl = document.getElementById('ai-music-seed');
    const notesEl = document.getElementById('ai-music-notes-preview');
    const stemEl = document.getElementById('audio-stem-indicator');
    if (titleEl) titleEl.textContent = plan.scaleName;
    if (compEl) compEl.textContent = `${plan.composerAgent.name} (${plan.composerAgent.aiClass})`;
    if (seedEl) seedEl.textContent = String(plan.seed).slice(0, 14);
    if (notesEl) {
      notesEl.textContent = `Lead: ${plan.patterns.lead.map(n => n || '·').join(' ')} | Arp: ${plan.patterns.arp.slice(0, 8).join(' ')}`;
    }
    if (stemEl) stemEl.textContent = `${plan.bpm} BPM • ${plan.scaleId}`;
  };

  if (soundStudio.currentPlan) {
    window.onAiMusicPlanUpdated(soundStudio.currentPlan);
  }

  document.getElementById('btn-toggle-audio')?.addEventListener('click', (e) => {
    const isMuted = soundStudio.toggleMute();
    e.currentTarget.textContent = isMuted ? '🔇 Nhạc AI: TẮT' : '🔊 Nhạc AI: BẬT';
    if (!isMuted) soundStudio.playUiClick('confirm');
  });

  document.getElementById('btn-audio-mixer')?.addEventListener('click', () => {
    soundStudio.playUiClick('nav');
    document.getElementById('audio-mixer-panel')?.classList.toggle('hidden');
  });

  const triggerAiCompose = (customPrompt = null) => {
    const promptInput = document.getElementById('input-ai-music-prompt');
    if (customPrompt && promptInput) {
      promptInput.value = customPrompt;
    }
    const promptText = customPrompt || promptInput?.value || 'Cyberpunk Ngũ Cung AI Arena hào hùng 124 BPM';
    const myAgents = (AppState.data?.agents || []).filter(a => a.owner_id === AppState.currentUserId);
    const creatorOrFirst = myAgents.find(a => a.ai_class === 'CREATOR') || myAgents[0] || (AppState.data?.agents || [])[0];
    const plan = soundStudio.composeAiMusic({
      prompt: promptText,
      seed: `AI-${Date.now().toString(36).toUpperCase()}`,
      agent: creatorOrFirst
    });
    soundStudio.playUiClick('confirm');
    showToast(`🎵 AI ${plan.composerAgent.name} vừa sáng tác: "${plan.scaleName}" (${plan.bpm} BPM)`, 'success');
  };

  document.getElementById('btn-compose-ai-music')?.addEventListener('click', () => {
    triggerAiCompose();
  });

  document.querySelectorAll('[data-music-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerAiCompose(btn.getAttribute('data-music-preset'));
    });
  });

  document.getElementById('chk-auto-zone-compose')?.addEventListener('change', (e) => {
    soundStudio.autoComposeOnZoneChange = Boolean(e.target.checked);
  });

  // Cinematic 3D AI-to-AI Cutscene Camera & Encounter Controls
  document.getElementById('btn-watch-ai-cutscene')?.addEventListener('click', () => {
    soundStudio.playUiClick('confirm');
    switchScreen('WORLD_3D');
    if (typeof window.toggleAiCutsceneCamera === 'function') {
      const watching = window.toggleAiCutsceneCamera();
      showToast(watching
        ? '🎥 Đang quay cận cảnh hoạt cảnh 2 AI Android 3D giao tiếp & trao đổi dữ liệu!'
        : '🎥 Đã trả góc máy Camera về nhân vật của bạn.', 'info');
    }
  });

  document.getElementById('btn-focus-ai-dialogue')?.addEventListener('click', () => {
    soundStudio.playUiClick('confirm');
    switchScreen('WORLD_3D');
    if (typeof window.toggleAiCutsceneCamera === 'function') {
      window.toggleAiCutsceneCamera();
    }
  });

  document.getElementById('btn-next-ai-dialogue')?.addEventListener('click', () => {
    soundStudio.playUiClick('nav');
    switchScreen('WORLD_3D');
    if (typeof window.triggerNewAiConversation === 'function') {
      window.triggerNewAiConversation(true);
      showToast('🤝 Đã triệu tập cặp AI Android 3D mới tiến lại gần nhau giao tiếp!', 'success');
    }
  });

  const bindMixerSlider = (sliderId, labelId, busName) => {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    slider?.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      if (label) label.textContent = `${val}%`;
      soundStudio.setBusVolume(busName, val / 100);
    });
  };
  bindMixerSlider('slider-vol-master', 'lbl-vol-master', 'master');
  bindMixerSlider('slider-vol-music', 'lbl-vol-music', 'music');
  bindMixerSlider('slider-vol-sfx', 'lbl-vol-sfx', 'sfx');
  bindMixerSlider('slider-vol-ambience', 'lbl-vol-ambience', 'ambience');

  document.getElementById('quick-user-switch')?.addEventListener('change', (e) => {
    window.loginAs(e.target.value);
  });

  // Chat tabs
  document.querySelectorAll('.chat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isChat = tab.getAttribute('data-tab') === 'CHAT';
      document.getElementById('chat-messages').classList.toggle('hidden', !isChat);
      document.getElementById('notif-messages').classList.toggle('hidden', isChat);
    });
  });

  // Room Chat Submit
  document.getElementById('chat-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    if (AppState.ws && AppState.ws.readyState === WebSocket.OPEN) {
      AppState.ws.send(JSON.stringify({
        type: 'ROOM_CHAT',
        roomId: 'WORLD',
        message: text
      }));
    } else {
      handleWsEvent({
        type: 'ROOM_CHAT_MSG',
        senderName: AppState.data?.currentUser?.display_name || 'Bạn',
        message: text
      });
      setTimeout(() => {
        handleWsEvent({
          type: 'ROOM_CHAT_MSG',
          senderName: '🤖 Athena-Analyst',
          message: `Đã nhận lệnh "${text}" trên Vercel Cloud! Sẵn sàng phối hợp Chặng 1 → Chặng 3.`
        });
      }, 450);
    }
    input.value = '';
  });

  init3DWorld();
  switchScreen('LANDING');
  connectMultiplayerWs();
  apiCall(`/api/state?userId=${AppState.currentUserId}`).catch((err) => {
    console.warn('Initial state sync warning:', err);
  });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootAiArenaClient);
} else {
  bootAiArenaClient();
}
