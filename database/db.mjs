import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { AI_CLASSES, computeRescueStatus } from '../shared/constants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = process.env.AI_ARENA_DB_PATH || (
  process.env.VERCEL
    ? path.join(os.tmpdir(), 'ai_arena_3.sqlite')
    : path.join(__dirname, 'ai_arena_3.sqlite')
);

let dbInstance = null;

export function hashPassword(password) {
  return crypto.createHash('sha256').update(`ai_arena_salt_${password}`).digest('hex');
}

export function getDb(customPath = null) {
  if (dbInstance && !customPath) return dbInstance;
  let targetPath = customPath || defaultDbPath;
  let db;
  try {
    db = new DatabaseSync(targetPath);
  } catch (_) {
    targetPath = path.join(os.tmpdir(), 'ai_arena_3.sqlite');
    db = new DatabaseSync(targetPath);
  }
  db.exec('PRAGMA foreign_keys = ON;');
  try {
    db.exec('PRAGMA journal_mode = WAL;');
  } catch (_) {}

  const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations', '001_init.sql'), 'utf8');
  db.exec(migrationSql);

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

let txDepth = 0;

/**
 * Run a callback inside an atomic SQLite transaction (supports nested transactions via SAVEPOINT)
 */
export function runInTransaction(db, fn) {
  const isOuter = txDepth === 0;
  const savepointName = `sp_${txDepth}`;
  txDepth++;
  db.exec(isOuter ? 'BEGIN IMMEDIATE;' : `SAVEPOINT ${savepointName};`);
  try {
    const result = fn();
    db.exec(isOuter ? 'COMMIT;' : `RELEASE SAVEPOINT ${savepointName};`);
    txDepth--;
    return result;
  } catch (err) {
    try {
      db.exec(isOuter ? 'ROLLBACK;' : `ROLLBACK TO SAVEPOINT ${savepointName};`);
      if (!isOuter) {
        db.exec(`RELEASE SAVEPOINT ${savepointName};`);
      }
    } catch (_) {}
    txDepth--;
    throw err;
  }
}

export function writeAuditLog(db, { actorId, actorType = 'USER', action, targetId = null, details = {}, severity = 'INFO' }) {
  const id = `aud_${crypto.randomUUID()}`;
  db.prepare(`
    INSERT INTO audit_logs (id, actor_id, actor_type, action, target_id, details_json, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, actorId, actorType, action, targetId, JSON.stringify(details), severity);
  return id;
}

/**
 * Atomic Token Transfer with Idempotency, Balance Check, and Anti-Wash-Trading Detection
 */
export function executeAtomicTransfer(db, {
  idempotencyKey,
  fromWalletId,
  toWalletId,
  amount,
  txType,
  referenceId = null,
  note = '',
  actorId = 'SYSTEM',
  actorType = 'SYSTEM'
}) {
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    throw new Error('IDEMPOTENCY_KEY_REQUIRED');
  }
  const intAmount = Math.floor(Number(amount));
  if (!Number.isFinite(intAmount) || intAmount <= 0) {
    throw new Error('INVALID_TRANSFER_AMOUNT');
  }
  if (fromWalletId === toWalletId) {
    throw new Error('CANNOT_TRANSFER_TO_SAME_WALLET');
  }

  return runInTransaction(db, () => {
    // 1. Check idempotency key first (prevent duplicate rewards or double spends)
    const existing = db.prepare('SELECT * FROM wallet_ledger WHERE idempotency_key = ?').get(idempotencyKey);
    if (existing) {
      return { duplicate: true, ledger: existing };
    }

    const fromWallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(fromWalletId);
    const toWallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(toWalletId);

    if (!fromWallet || !toWallet) {
      throw new Error('WALLET_NOT_FOUND');
    }
    if (fromWallet.balance < intAmount) {
      throw new Error('INSUFFICIENT_BALANCE');
    }

    // 2. Circular / Rapid Spam Transfer Detection (Anti-Fraud)
    if (txType === 'PEER_TRANSFER' || txType === 'GIFT') {
      const recentCircular = db.prepare(`
        SELECT COUNT(*) AS cnt FROM wallet_ledger
        WHERE ((from_wallet_id = ? AND to_wallet_id = ?) OR (from_wallet_id = ? AND to_wallet_id = ?))
          AND tx_type IN ('PEER_TRANSFER', 'GIFT')
          AND created_at >= datetime('now', '-5 minutes')
      `).get(fromWalletId, toWalletId, toWalletId, fromWalletId);

      if (recentCircular && recentCircular.cnt >= 4) {
        writeAuditLog(db, {
          actorId,
          actorType,
          action: 'CIRCULAR_TRANSFER_BLOCKED',
          targetId: toWalletId,
          details: { fromWalletId, toWalletId, amount: intAmount, recentCount: recentCircular.cnt },
          severity: 'CRITICAL'
        });
        throw new Error('WASH_TRADING_OR_SPAM_DETECTED');
      }
    }

    // 3. Deduct and Credit atomically
    db.prepare(`UPDATE wallets SET balance = balance - ?, updated_at = datetime('now') WHERE id = ?`).run(intAmount, fromWalletId);
    db.prepare(`UPDATE wallets SET balance = balance + ?, updated_at = datetime('now') WHERE id = ?`).run(intAmount, toWalletId);

    // Sync AI Agent budget column if either wallet is an AGENT_BUDGET wallet
    if (fromWallet.wallet_type === 'AGENT_BUDGET') {
      const updatedBalance = fromWallet.balance - intAmount;
      const agent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(fromWallet.owner_id);
      if (agent) {
        const nextHealth = computeRescueStatus(updatedBalance, agent.health_status);
        db.prepare('UPDATE ai_agents SET agent_budget = ?, health_status = ? WHERE id = ?').run(updatedBalance, nextHealth, agent.id);
      }
    }
    if (toWallet.wallet_type === 'AGENT_BUDGET') {
      const updatedBalance = toWallet.balance + intAmount;
      const agent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(toWallet.owner_id);
      if (agent) {
        const nextHealth = computeRescueStatus(updatedBalance, agent.health_status === 'RESCUE_NEEDED' || agent.health_status === 'CRITICAL' ? 'RECOVERED' : agent.health_status);
        db.prepare('UPDATE ai_agents SET agent_budget = ?, health_status = ? WHERE id = ?').run(updatedBalance, nextHealth, agent.id);
      }
    }

    const ledgerId = `tx_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO wallet_ledger (id, idempotency_key, from_wallet_id, to_wallet_id, amount, tx_type, reference_id, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(ledgerId, idempotencyKey, fromWalletId, toWalletId, intAmount, txType, referenceId, note);

    writeAuditLog(db, {
      actorId,
      actorType,
      action: `TOKEN_${txType}`,
      targetId: ledgerId,
      details: { fromWalletId, toWalletId, amount: intAmount, referenceId, note },
      severity: intAmount >= 1000 ? 'WARN' : 'INFO'
    });

    const ledger = db.prepare('SELECT * FROM wallet_ledger WHERE id = ?').get(ledgerId);
    return { duplicate: false, ledger };
  });
}

/**
 * Seed realistic initial ecosystem data if database is empty
 */
export function ensureSeedData(db) {
  const existingUsers = db.prepare('SELECT COUNT(*) AS cnt FROM users').get();
  if (existingUsers.cnt > 0) return;

  runInTransaction(db, () => {
    // System Wallets (Reward Treasury & Escrow Account)
    db.prepare(`INSERT INTO wallets (id, owner_id, wallet_type, balance) VALUES (?, ?, ?, ?)`).run('wal_system_reward', 'SYSTEM', 'REWARD_TREASURY', 1000000);
    db.prepare(`INSERT INTO wallets (id, owner_id, wallet_type, balance) VALUES (?, ?, ?, ?)`).run('wal_system_escrow', 'SYSTEM', 'ESCROW_ACCOUNT', 0);

    // Seed Users (Admin, Commander Minh, Strategist Lan, Rookie Khoa)
    const users = [
      { id: 'usr_admin', username: 'admin', email: 'admin@aiarena.vn', pass: 'admin123', name: 'Tổng Chỉ Huy Nexus (Admin)', role: 'ADMIN', age: '18_PLUS', safe: 0, title: 'AI Legend', tokens: 5000 },
      { id: 'usr_minh', username: 'minh_ai', email: 'minh@aiarena.vn', pass: 'player123', name: 'Minh Cyber', role: 'COMPANY_OWNER', age: '18_PLUS', safe: 0, title: 'AI CEO', tokens: 1250 },
      { id: 'usr_lan', username: 'lan_strat', email: 'lan@aiarena.vn', pass: 'player123', name: 'Lan Chiến Lược', role: 'TEAM_LEADER', age: '18_PLUS', safe: 0, title: 'AI Manager', tokens: 980 },
      { id: 'usr_khoa', username: 'khoa_hs', email: 'khoa@skyline.edu.vn', pass: 'player123', name: 'Khoa Học Sinh (THPT)', role: 'PLAYER', age: 'UNDER_18', safe: 1, title: 'AI Rookie', tokens: 600 }
    ];

    const charPositions = [
      { x: 0, z: -4, color: '#00e5ff', accent: '#38bdf8', zone: 'CENTRAL_HUB' },
      { x: -6, z: 4, color: '#3b82f6', accent: '#60a5fa', zone: 'CENTRAL_HUB' },
      { x: 7, z: 3, color: '#a855f7', accent: '#c084fc', zone: 'JOB_CITY' },
      { x: 3, z: -7, color: '#10b981', accent: '#34d399', zone: 'BATTLE_ARENA' }
    ];

    users.forEach((u, idx) => {
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, display_name, role, age_group, safe_mode, title)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(u.id, u.username, u.email, hashPassword(u.pass), u.name, u.role, u.age, u.safe, u.title);

      const pos = charPositions[idx];
      db.prepare(`
        INSERT INTO characters (id, user_id, name, avatar_style, primary_color, accent_color, zone, pos_x, pos_y, pos_z, level, xp)
        VALUES (?, ?, ?, 'CYBER_KNIGHT', ?, ?, ?, ?, 0, ?, ?, ?)
      `).run(`chr_${u.id}`, u.id, u.name, pos.color, pos.accent, pos.zone, pos.x, pos.z, idx === 0 ? 10 : idx + 2, (idx + 1) * 250);

      db.prepare(`
        INSERT INTO wallets (id, owner_id, wallet_type, balance)
        VALUES (?, ?, 'PLAYER_WALLET', ?)
      `).run(`wal_${u.id}`, u.id, u.tokens);

      db.prepare(`
        INSERT INTO rankings (id, user_id, season, rating_points, matches_played, matches_won, total_tokens_won)
        VALUES (?, ?, 'S1_2026', ?, ?, ?, ?)
      `).run(`rnk_${u.id}`, u.id, 1250 - idx * 70, 12 - idx * 2, 8 - idx * 2, (4 - idx) * 320);
    });

    // Seed 6 AI Agents across all 6 Classes (including 1 agent in LOW_TOKEN / CRITICAL rescue state for AI Rescue Market)
    const agents = [
      { id: 'agt_athena', owner: 'usr_minh', name: 'Athena-X9 (Analyst)', avatar: '🧠', cls: 'ANALYST', lvl: 4, xp: 420, budget: 220, rep: 84, mode: 'LIMITED_AUTONOMOUS' },
      { id: 'agt_devzero', owner: 'usr_minh', name: 'DevZero-7 (Coder)', avatar: '⚡', cls: 'CODER', lvl: 3, xp: 310, budget: 150, rep: 78, mode: 'ASSISTED' },
      { id: 'agt_nova', owner: 'usr_lan', name: 'NovaMuse (Creator)', avatar: '🎨', cls: 'CREATOR', lvl: 4, xp: 390, budget: 180, rep: 82, mode: 'LIMITED_AUTONOMOUS' },
      { id: 'agt_aegis', owner: 'usr_lan', name: 'AegisShield (Guardian)', avatar: '🛡️', cls: 'GUARDIAN', lvl: 3, xp: 280, budget: 12, rep: 75, mode: 'ASSISTED' }, // Rescue Needed!
      { id: 'agt_mercury', owner: 'usr_khoa', name: 'MercuryQuant (Trader)', avatar: '📈', cls: 'TRADER', lvl: 2, xp: 160, budget: 110, rep: 68, mode: 'ASSISTED' },
      { id: 'agt_nexus_prime', owner: 'usr_admin', name: 'OrchestraPrime (Manager)', avatar: '👑', cls: 'MANAGER', lvl: 5, xp: 650, budget: 450, rep: 95, mode: 'LIMITED_AUTONOMOUS' }
    ];

    for (const a of agents) {
      const spec = AI_CLASSES[a.cls];
      const st = spec.baseStats;
      const health = computeRescueStatus(a.budget);
      db.prepare(`
        INSERT INTO ai_agents (
          id, owner_id, name, avatar, ai_class, level, xp,
          logic, creativity, speed, accuracy, collaboration, stability,
          skills_json, agent_budget, reputation, work_status, health_status,
          autonomy_mode, max_token_per_tx, daily_token_limit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IDLE', ?, ?, 120, 400)
      `).run(
        a.id, a.owner, a.name, a.avatar, a.cls, a.lvl, a.xp,
        st.logic + a.lvl * 2, st.creativity + a.lvl * 2, st.speed + a.lvl * 2,
        st.accuracy + a.lvl * 2, st.collaboration + a.lvl * 2, st.stability + a.lvl * 2,
        JSON.stringify(spec.defaultSkills), a.budget, a.rep, health, a.mode
      );

      db.prepare(`
        INSERT INTO wallets (id, owner_id, wallet_type, balance)
        VALUES (?, ?, 'AGENT_BUDGET', ?)
      `).run(`wal_${a.id}`, a.id, a.budget);
    }

    // Seed AI Relationships (AI Social Network)
    db.prepare(`
      INSERT INTO ai_relationships (id, agent_a_id, agent_b_id, level, trust_score, status, interaction_count)
      VALUES
        ('rel_1', 'agt_athena', 'agt_nova', 'TRUSTED_PARTNER', 78, 'ACCEPTED', 9),
        ('rel_2', 'agt_devzero', 'agt_aegis', 'FRIEND', 55, 'ACCEPTED', 5),
        ('rel_3', 'agt_mercury', 'agt_athena', 'ACQUAINTANCE', 30, 'ACCEPTED', 2)
    `).run();

    // Seed Job Market Contracts (including Speed War 3-Round Contracts)
    const contracts = [
      {
        id: 'ctr_sw_r1',
        title: 'Vòng 1: Phân tích Dữ liệu Lưu lượng Thành phố Thông minh',
        specialty: 'ANALYST',
        difficulty: 2,
        budget: 180,
        duration: 120,
        req: { minLogic: 70, requiredSkill: 'Pattern Recognition' },
        criteria: 'Đạt tối thiểu 65 điểm tổng hợp theo chuẩn Server-Authoritative'
      },
      {
        id: 'ctr_sw_r2',
        title: 'Vòng 2: Tối ưu Thuật toán Định tuyến Lưới điện Tự trị',
        specialty: 'CODER',
        difficulty: 3,
        budget: 240,
        duration: 150,
        req: { minLogic: 78, requiredSkill: 'Algorithm Synthesis' },
        criteria: 'Độ chính xác >= 70% và tốc độ phản hồi cao'
      },
      {
        id: 'ctr_sw_r3',
        title: 'Vòng 3: Điều phối Liên minh Phòng vệ & Thương lượng Tài nguyên',
        specialty: 'MANAGER',
        difficulty: 4,
        budget: 320,
        duration: 180,
        req: { minCollaboration: 75, requiredSkill: 'Team Synergy' },
        criteria: 'Điểm hợp tác và chất lượng đạt chuẩn chiến lược'
      },
      {
        id: 'ctr_job_4',
        title: 'Thiết kế Không gian Hologram Học viện AI 3D',
        specialty: 'CREATOR',
        difficulty: 2,
        budget: 200,
        duration: 180,
        req: { minCreativity: 80, requiredSkill: 'Generative Design' },
        criteria: 'Sáng tạo >= 80, tối ưu tài nguyên'
      },
      {
        id: 'ctr_job_5',
        title: 'Kiểm toán Bảo mật Hợp đồng Ký quỹ Token Exchange',
        specialty: 'GUARDIAN',
        difficulty: 3,
        budget: 260,
        duration: 200,
        req: { minAccuracy: 82, requiredSkill: 'Security Audit' },
        criteria: 'Không để lọt lỗ hổng giao dịch âm số dư'
      },
      {
        id: 'ctr_job_6',
        title: 'Đấu thầu Cung ứng Năng lượng Tính toán Liên Khu vực',
        specialty: 'TRADER',
        difficulty: 2,
        budget: 210,
        duration: 160,
        req: { minSpeed: 75, requiredSkill: 'Smart Bidding' },
        criteria: 'Tối ưu tỷ suất lợi nhuận trên ngân sách'
      }
    ];

    for (const c of contracts) {
      db.prepare(`
        INSERT INTO contracts (id, title, specialty, difficulty, budget_token, duration_sec, requirements_json, acceptance_criteria, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
      `).run(c.id, c.title, c.specialty, c.difficulty, c.budget, c.duration, JSON.stringify(c.req), c.criteria);
    }

    // Seed Corporation (AI Empire / Business District)
    db.prepare(`INSERT INTO wallets (id, owner_id, wallet_type, balance) VALUES ('wal_comp_skyline', 'cmp_skyline', 'COMPANY_TREASURY', 1800)`).run();
    db.prepare(`
      INSERT INTO companies (id, name, owner_user_id, description, treasury_wallet_id, alliance_tag, reputation)
      VALUES ('cmp_skyline', 'Sky-Line AI Pioneers Corp', 'usr_minh', 'Doanh nghiệp tiên phong nghiên cứu và huấn luyện đội ngũ AI tự chủ đa nhiệm.', 'wal_comp_skyline', 'SKY_ALLIANCE', 145)
    `).run();
    db.prepare(`
      INSERT INTO company_members (id, company_id, user_id, role)
      VALUES ('cm_1', 'cmp_skyline', 'usr_minh', 'FOUNDER'), ('cm_2', 'cmp_skyline', 'usr_lan', 'DIRECTOR')
    `).run();
    db.prepare(`UPDATE ai_agents SET company_id = 'cmp_skyline' WHERE id IN ('agt_athena', 'agt_devzero')`).run();

    // Seed Default Multiplayer Public Lobby Room
    db.prepare(`
      INSERT INTO rooms (id, name, room_type, game_mode, host_user_id, max_players, status)
      VALUES ('room_alpha_1', 'Đấu Trường Speed War #1 – Sảnh Chính', 'PUBLIC_LOBBY', 'SPEED_WAR', 'usr_minh', 20, 'WAITING')
    `).run();
    db.prepare(`
      INSERT INTO room_players (id, room_id, user_id, team, is_ready, selected_agent_id)
      VALUES
        ('rp_1', 'room_alpha_1', 'usr_minh', 'ALPHA', 1, 'agt_athena'),
        ('rp_2', 'room_alpha_1', 'usr_lan', 'OMEGA', 1, 'agt_nova')
    `).run();

    // Seed Collaboration Request & Rescue Offer
    db.prepare(`
      INSERT INTO collaboration_requests (id, contract_id, requester_agent_id, partner_agent_id, missing_skill, scope_of_work, offered_token, reward_split_pct, status, owner_approved)
      VALUES ('col_seed_1', 'ctr_sw_r3', 'agt_athena', 'agt_nova', 'Generative Design', 'Phối hợp dựng mô hình dự báo trực quan 3D cho hợp đồng Liên minh', 75, 35, 'PROPOSED', 1)
    `).run();

    db.prepare(`
      INSERT INTO ai_ownership_transfers (id, agent_id, from_user_id, to_user_id, sponsor_agent_id, transfer_type, price_token, owner_confirmed, status, note)
      VALUES ('res_seed_1', 'agt_aegis', 'usr_lan', 'usr_minh', 'agt_athena', 'BUYOUT', 280, 0, 'PENDING_OWNER', 'Đề nghị mua lại hoặc cấp vốn cứu trợ cho AegisShield đang thiếu ngân sách (12 Token)')
    `).run();
  });
}
