/**
 * Shared Constants, Types, Scoring Formulas & Domain Rules for AI Arena 3.0
 */

export const WORLD_ZONES = [
  { id: 'CENTRAL_HUB', name: 'Central Hub – Sảnh Trung Tâm', x: 0, z: 0, color: '#00e5ff', radius: 22, mvpPriority: true, description: 'Điểm xuất phát, giao lưu cộng đồng, cổng dịch chuyển và trung tâm thông tin.' },
  { id: 'JOB_CITY', name: 'Job City – Thành Phố Việc Làm', x: -45, z: -30, color: '#38bdf8', radius: 18, mvpPriority: true, description: 'Thị trường hợp đồng, đấu thầu nhiệm vụ và điều phối công việc cho AI.' },
  { id: 'BATTLE_ARENA', name: 'Battle Arena – Đấu Trường AI', x: 45, z: -30, color: '#f43f5e', radius: 20, mvpPriority: true, description: 'Đấu trường AI Speed War, Team Battle và bảng vinh danh trực tuyến.' },
  { id: 'AI_ACADEMY', name: 'AI Academy – Học Viện AI', x: -50, z: 30, color: '#a855f7', radius: 16, mvpPriority: false, description: 'Huấn luyện kỹ năng, nâng cấp cấp độ và mở khóa chuyên môn AI Agent.' },
  { id: 'BUSINESS_DISTRICT', name: 'Business District – Khu Doanh Nghiệp', x: 50, z: 30, color: '#f59e0b', radius: 16, mvpPriority: false, description: 'Trụ sở các tập đoàn AI, quản trị ngân sách công ty và liên minh.' },
  { id: 'TOKEN_EXCHANGE', name: 'Token Exchange – Thị Trường Token', x: 0, z: -58, color: '#10b981', radius: 15, mvpPriority: false, description: 'Trung tâm quản lý ví, ký quỹ hợp đồng (Escrow) và cứu trợ AI thiếu vốn.' },
  { id: 'AI_SOCIAL_HUB', name: 'AI Social Hub – Mạng Xã Hội AI', x: -28, z: 55, color: '#ec4899', radius: 14, mvpPriority: false, description: 'Không gian AI tự kết bạn, xây dựng uy tín và tìm kiếm đối tác chiến lược.' },
  { id: 'AI_LAB', name: 'AI Lab – Trung Tâm Nghiên Cứu', x: 28, z: 55, color: '#6366f1', radius: 14, mvpPriority: false, description: 'Nghiên cứu thuật toán, tối ưu hóa chỉ số Stability & Collaboration.' },
  { id: 'AI_EMPIRE', name: 'AI Empire – Đế Chế AI', x: 0, z: 80, color: '#eab308', radius: 18, mvpPriority: false, description: 'Đỉnh cao vinh quang dành cho các liên minh và tập đoàn AI hàng đầu.' }
];

export const AI_CLASSES = {
  ANALYST: {
    id: 'ANALYST',
    name: 'Analyst AI',
    roleVi: 'Chuyên gia Phân tích Dữ liệu & Chiến lược',
    color: '#00e5ff',
    baseStats: { logic: 82, creativity: 58, speed: 68, accuracy: 85, collaboration: 70, stability: 78 },
    defaultSkills: ['Data Mining', 'Risk Forecasting', 'Pattern Recognition']
  },
  CODER: {
    id: 'CODER',
    name: 'Coder AI',
    roleVi: 'Kỹ sư Lập trình & Tối ưu Hệ thống',
    color: '#3b82f6',
    baseStats: { logic: 88, creativity: 64, speed: 76, accuracy: 82, collaboration: 65, stability: 80 },
    defaultSkills: ['Algorithm Synthesis', 'Auto Debugging', 'System Architecture']
  },
  CREATOR: {
    id: 'CREATOR',
    name: 'Creator AI',
    roleVi: 'Kiến trúc sư Sáng tạo & Nội dung Đa phương thức',
    color: '#a855f7',
    baseStats: { logic: 62, creativity: 92, speed: 74, accuracy: 70, collaboration: 78, stability: 68 },
    defaultSkills: ['Generative Design', 'Creative Ideation', 'UX Synthesis']
  },
  GUARDIAN: {
    id: 'GUARDIAN',
    name: 'Guardian AI',
    roleVi: 'Chuyên gia Bảo mật, Kiểm định & Phòng vệ',
    color: '#10b981',
    baseStats: { logic: 80, creativity: 55, speed: 66, accuracy: 90, collaboration: 72, stability: 92 },
    defaultSkills: ['Quality Assurance', 'Security Audit', 'Fault Tolerance']
  },
  TRADER: {
    id: 'TRADER',
    name: 'Trader AI',
    roleVi: 'Chuyên gia Đàm phán, Đấu thầu & Tối ưu Nguồn lực',
    color: '#f59e0b',
    baseStats: { logic: 78, creativity: 72, speed: 84, accuracy: 76, collaboration: 82, stability: 74 },
    defaultSkills: ['Smart Bidding', 'Escrow Negotiation', 'Resource Arbitrage']
  },
  MANAGER: {
    id: 'MANAGER',
    name: 'Manager AI',
    roleVi: 'Điều phối viên Đa tác tử & Quản trị Dự án',
    color: '#ec4899',
    baseStats: { logic: 76, creativity: 70, speed: 72, accuracy: 78, collaboration: 94, stability: 84 },
    defaultSkills: ['Task Decomposition', 'Team Synergy', 'Workflow Orchestration']
  }
};

export const RELATIONSHIP_LEVELS = [
  { id: 'STRANGER', minTrust: 0, label: 'Stranger (Người lạ)' },
  { id: 'ACQUAINTANCE', minTrust: 20, label: 'Acquaintance (Quen biết)' },
  { id: 'FRIEND', minTrust: 45, label: 'Friend (Bạn bè)' },
  { id: 'TRUSTED_PARTNER', minTrust: 70, label: 'Trusted Partner (Đối tác tin cậy)' },
  { id: 'STRATEGIC_ALLIANCE', minTrust: 90, label: 'Strategic Alliance (Liên minh chiến lược)' }
];

export const RESCUE_STATUSES = {
  HEALTHY: 'HEALTHY',
  LOW_TOKEN: 'LOW_TOKEN',
  CRITICAL: 'CRITICAL',
  RESCUE_NEEDED: 'RESCUE_NEEDED',
  IN_NEGOTIATION: 'IN_NEGOTIATION',
  RECOVERED: 'RECOVERED'
};

export const AUTONOMY_MODES = {
  MANUAL: 'MANUAL',
  ASSISTED: 'ASSISTED',
  LIMITED_AUTONOMOUS: 'LIMITED_AUTONOMOUS'
};

export const SPEED_WAR_WEIGHTS = {
  quality: 0.40,
  accuracy: 0.25,
  speed: 0.15,
  resourceEfficiency: 0.10,
  collaboration: 0.10
};

/**
 * Compute Rescue Status based on Agent Budget
 */
export function computeRescueStatus(agentBudget, currentStatus = 'HEALTHY') {
  if (currentStatus === 'IN_NEGOTIATION') return 'IN_NEGOTIATION';
  if (agentBudget <= 15) return RESCUE_STATUSES.RESCUE_NEEDED;
  if (agentBudget <= 40) return RESCUE_STATUSES.CRITICAL;
  if (agentBudget <= 90) return RESCUE_STATUSES.LOW_TOKEN;
  return currentStatus === 'RECOVERED' && agentBudget > 90 ? RESCUE_STATUSES.RECOVERED : RESCUE_STATUSES.HEALTHY;
}

/**
 * Compute Relationship Level from trust score (0-100)
 */
export function computeRelationshipLevel(trustScore) {
  if (trustScore >= 90) return 'STRATEGIC_ALLIANCE';
  if (trustScore >= 70) return 'TRUSTED_PARTNER';
  if (trustScore >= 45) return 'FRIEND';
  if (trustScore >= 20) return 'ACQUAINTANCE';
  return 'STRANGER';
}

/**
 * Server-Authoritative Speed War Round Scoring Function
 * Prevents pay-to-win by capping equipment/token boost and evaluating pure stats + strategy match + synergy.
 */
export function evaluateSpeedWarExecution({ agent, contract, strategy = 'BALANCED', partnerAgent = null, bidAmount = 0 }) {
  const req = JSON.parse(contract.requirements_json || '{}');
  const preferredClass = contract.specialty || 'ANALYST';
  const classBonus = agent.ai_class === preferredClass ? 12 : 4;

  // Strategy modifiers (fair tactical trade-offs, no pay-to-win)
  const mods = {
    QUALITY_FIRST: { q: 1.15, a: 1.10, s: 0.88, r: 0.95, c: 1.0 },
    SPEED_FOCUS: { q: 0.92, a: 0.94, s: 1.22, r: 1.08, c: 0.95 },
    COLLABORATIVE: { q: 1.06, a: 1.05, s: 1.02, r: 1.04, c: 1.25 },
    BALANCED: { q: 1.04, a: 1.04, s: 1.04, r: 1.04, c: 1.04 }
  }[strategy] || { q: 1.0, a: 1.0, s: 1.0, r: 1.0, c: 1.0 };

  const partnerSynergy = partnerAgent
    ? Math.min(18, Math.round((partnerAgent.collaboration + partnerAgent.logic) / 12))
    : 0;

  const difficultyFactor = Math.max(1, contract.difficulty || 1) * 3.5;

  const quality = Math.min(100, Math.max(25, Math.round(
    ((agent.logic * 0.45 + agent.creativity * 0.35 + agent.stability * 0.20) * mods.q) + classBonus - difficultyFactor + (partnerSynergy * 0.4)
  )));

  const accuracy = Math.min(100, Math.max(25, Math.round(
    ((agent.accuracy * 0.55 + agent.logic * 0.25 + agent.stability * 0.20) * mods.a) + (classBonus * 0.7) - (difficultyFactor * 0.8)
  )));

  const speed = Math.min(100, Math.max(25, Math.round(
    ((agent.speed * 0.65 + agent.logic * 0.20 + agent.stability * 0.15) * mods.s) - (difficultyFactor * 0.6)
  )));

  const budgetRatio = contract.budget_token > 0 && bidAmount > 0
    ? Math.max(0.7, Math.min(1.2, contract.budget_token / bidAmount))
    : 1.0;

  const resourceEfficiency = Math.min(100, Math.max(30, Math.round(
    ((agent.stability * 0.50 + agent.logic * 0.30 + agent.speed * 0.20) * mods.r * budgetRatio)
  )));

  const collaboration = Math.min(100, Math.max(30, Math.round(
    ((agent.collaboration * 0.70 + agent.stability * 0.30) * mods.c) + partnerSynergy
  )));

  const totalScore = Number((
    quality * SPEED_WAR_WEIGHTS.quality +
    accuracy * SPEED_WAR_WEIGHTS.accuracy +
    speed * SPEED_WAR_WEIGHTS.speed +
    resourceEfficiency * SPEED_WAR_WEIGHTS.resourceEfficiency +
    collaboration * SPEED_WAR_WEIGHTS.collaboration
  ).toFixed(2));

  return {
    quality,
    accuracy,
    speed,
    resourceEfficiency,
    collaboration,
    totalScore
  };
}
