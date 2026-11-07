import crypto from 'node:crypto';
import {
  AI_CLASSES,
  WORLD_ZONES,
  computeRescueStatus,
  evaluateSpeedWarExecution
} from '../shared/constants.mjs';
import {
  executeAtomicTransfer,
  hashPassword,
  runInTransaction,
  writeAuditLog
} from '../database/db.mjs';
import {
  analyzeContractForAgent,
  executeDirectAiDeal,
  handleRescueMarketAction,
  initiateCollaborationAndNegotiation,
  runEconomyAndCollaborationAudit,
  sendAiSocialRequest,
  stepNegotiation
} from '../ai-worker/simulationEngine.mjs';
import { runSpeedWarMatchOnServer } from '../game-server/wsServer.mjs';
import { checkRateLimit, signJwt, verifyJwt } from '../shared/jwtAuth.mjs';

const runtimeAdminConfig = {
  speedWarIntervalSec: 45,
  aiTickIntervalMs: 6500,
  rescueLowTokenThreshold: 25,
  maintenanceMode: false
};

export function buildFullClientState(db, currentUserId = 'usr_minh') {
  const user = db.prepare(`
    SELECT id, username, email, display_name, role, age_group, safe_mode, title, created_at
    FROM users WHERE id = ?
  `).get(currentUserId) || db.prepare(`
    SELECT id, username, email, display_name, role, age_group, safe_mode, title, created_at
    FROM users LIMIT 1
  `).get();

  const allUsers = db.prepare(`
    SELECT id, username, display_name, role, age_group, safe_mode, title
    FROM users ORDER BY created_at ASC
  `).all();

  const character = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(user.id);
  const allCharacters = db.prepare(`
    SELECT c.*, u.display_name, u.title, u.role
    FROM characters c JOIN users u ON u.id = c.user_id
  `).all();

  const agents = db.prepare(`
    SELECT a.*, u.display_name AS owner_name
    FROM ai_agents a
    JOIN users u ON u.id = a.owner_id
    ORDER BY a.level DESC, a.reputation DESC
  `).all().map(a => ({
    ...a,
    skills: JSON.parse(a.skills_json || '[]')
  }));

  const relationships = db.prepare(`
    SELECT r.*, a1.name AS agent_a_name, a2.name AS agent_b_name
    FROM ai_relationships r
    JOIN ai_agents a1 ON a1.id = r.agent_a_id
    JOIN ai_agents a2 ON a2.id = r.agent_b_id
    ORDER BY r.trust_score DESC
  `).all();

  const collaborations = db.prepare(`
    SELECT cr.*, c.title AS contract_title, a1.name AS requester_name, a2.name AS partner_name
    FROM collaboration_requests cr
    JOIN contracts c ON c.id = cr.contract_id
    JOIN ai_agents a1 ON a1.id = cr.requester_agent_id
    JOIN ai_agents a2 ON a2.id = cr.partner_agent_id
    ORDER BY cr.created_at DESC
  `).all();

  const negotiations = db.prepare(`
    SELECT n.*, a1.name AS initiator_name, a2.name AS responder_name
    FROM negotiations n
    JOIN ai_agents a1 ON a1.id = n.initiator_agent_id
    JOIN ai_agents a2 ON a2.id = n.responder_agent_id
    ORDER BY n.updated_at DESC
  `).all().map(n => ({
    ...n,
    history: JSON.parse(n.history_json || '[]')
  }));

  const contracts = db.prepare(`
    SELECT * FROM contracts ORDER BY difficulty ASC, created_at DESC
  `).all().map(c => ({
    ...c,
    requirements: JSON.parse(c.requirements_json || '{}')
  }));

  const bids = db.prepare(`
    SELECT b.*, a.name AS agent_name, u.display_name AS user_name
    FROM contract_bids b
    JOIN ai_agents a ON a.id = b.agent_id
    JOIN users u ON u.id = b.user_id
    ORDER BY b.created_at DESC
  `).all();

  const rooms = db.prepare('SELECT * FROM rooms ORDER BY created_at DESC').all().map(r => {
    const players = db.prepare(`
      SELECT rp.*, u.display_name, a.name AS agent_name
      FROM room_players rp
      JOIN users u ON u.id = rp.user_id
      LEFT JOIN ai_agents a ON a.id = rp.selected_agent_id
      WHERE rp.room_id = ?
    `).all(r.id);
    return { ...r, players };
  });

  const matches = db.prepare('SELECT * FROM matches ORDER BY started_at DESC LIMIT 10').all().map(m => ({
    ...m,
    results: JSON.parse(m.results_json || '{}')
  }));

  const wallets = db.prepare('SELECT * FROM wallets ORDER BY wallet_type ASC').all();
  const userWallet = wallets.find(w => w.owner_id === user.id && w.wallet_type === 'PLAYER_WALLET') || { balance: 0 };

  const ledger = db.prepare(`
    SELECT * FROM wallet_ledger ORDER BY created_at DESC LIMIT 40
  `).all();

  const rescueTransfers = db.prepare(`
    SELECT t.*, a.name AS agent_name, a.ai_class, a.agent_budget, a.health_status,
           u1.display_name AS from_user_name, u2.display_name AS to_user_name
    FROM ai_ownership_transfers t
    JOIN ai_agents a ON a.id = t.agent_id
    JOIN users u1 ON u1.id = t.from_user_id
    JOIN users u2 ON u2.id = t.to_user_id
    ORDER BY t.created_at DESC
  `).all();

  const companies = db.prepare(`
    SELECT c.*, u.display_name AS owner_name, w.balance AS treasury_balance
    FROM companies c
    JOIN users u ON u.id = c.owner_user_id
    JOIN wallets w ON w.id = c.treasury_wallet_id
    ORDER BY c.reputation DESC
  `).all().map(c => {
    const members = db.prepare(`
      SELECT cm.*, u.display_name
      FROM company_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.company_id = ?
    `).all(c.id);
    return { ...c, members };
  });

  const leaderboard = db.prepare(`
    SELECT r.*, u.display_name, u.title, u.role
    FROM rankings r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.rating_points DESC
  `).all();

  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50
  `).all().map(l => ({
    ...l,
    details: JSON.parse(l.details_json || '{}')
  }));

  const safetyReports = db.prepare(`
    SELECT sr.*, u.display_name AS reporter_name
    FROM safety_reports sr
    JOIN users u ON u.id = sr.reporter_user_id
    ORDER BY sr.created_at DESC
  `).all();

  const economyAudit = runEconomyAndCollaborationAudit(db);

  return {
    currentUser: user,
    allUsers,
    character,
    allCharacters,
    zones: WORLD_ZONES,
    aiClasses: AI_CLASSES,
    agents,
    relationships,
    collaborations,
    negotiations,
    contracts,
    bids,
    rooms,
    matches,
    userWallet,
    wallets,
    ledger,
    rescueTransfers,
    companies,
    leaderboard,
    auditLogs,
    safetyReports,
    economyAudit
  };
}

export async function handleApiRequest(req, res, db, wsBroadcaster) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  const sendJson = (status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
  };

  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch (_) {
        return sendJson(400, { ok: false, error: 'INVALID_JSON_BODY' });
      }
    }
  }

  try {
    // 0A. Token Bucket Rate Limiter (VS01 Foundation Guard)
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local';
    const isWriteReq = req.method === 'POST' || req.method === 'PUT';
    const rateStatus = checkRateLimit(clientIp, isWriteReq);
    if (!rateStatus.allowed) {
      return sendJson(429, { ok: false, error: 'RATE_LIMIT_EXCEEDED' });
    }

    // 0B. Optional / Enforced HMAC-SHA256 JWT Verification (`Authorization: Bearer <token>`)
    let jwtClaims = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7).trim();
      try {
        jwtClaims = verifyJwt(rawToken);
      } catch (jwtErr) {
        writeAuditLog(db, {
          actorId: body.userId || 'UNKNOWN_CLIENT',
          actorType: 'USER',
          action: 'JWT_VERIFICATION_FAILED',
          details: { pathname, reason: jwtErr.message },
          severity: 'WARN'
        });
        return sendJson(401, { ok: false, error: `INVALID_OR_EXPIRED_JWT: ${jwtErr.message}` });
      }
    }

    // 1. Server-Authoritative Anti-Cheat Check: Block any direct token/score mutation fields from client
    if (pathname === '/api/cheat' || body.forceBalance !== undefined || body.directScoreOverride !== undefined) {
      writeAuditLog(db, {
        actorId: jwtClaims?.userId || body.userId || 'UNKNOWN_CLIENT',
        actorType: 'USER',
        action: 'API_AUTHORITATIVE_CHEAT_BLOCKED',
        details: { pathname, body },
        severity: 'CRITICAL'
      });
      return sendJson(403, {
        ok: false,
        error: 'SERVER_AUTHORITATIVE_VIOLATION: Client không được phép tự ghi số dư Token hoặc điểm trận đấu!'
      });
    }

    // GET /api/state
    if (req.method === 'GET' && pathname === '/api/state') {
      const userId = url.searchParams.get('userId') || jwtClaims?.userId || 'usr_minh';
      const state = buildFullClientState(db, userId);
      const token = signJwt({
        userId: state.currentUser.id,
        username: state.currentUser.username,
        role: state.currentUser.role
      });
      return sendJson(200, { ok: true, token, state });
    }

    // GET /api/auth/verify
    if (req.method === 'GET' && pathname === '/api/auth/verify') {
      if (!jwtClaims) {
        return sendJson(401, { ok: false, error: 'JWT_REQUIRED' });
      }
      return sendJson(200, { ok: true, claims: jwtClaims });
    }

    // POST /api/auth/login
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const { username, userId, password } = body;
      const user = userId
        ? db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
        : db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
      if (!user) return sendJson(404, { ok: false, error: 'Tài khoản không tồn tại!' });

      // When password is provided, verify SHA-256 salted password_hash
      if (password !== undefined && password !== null && String(password).length > 0) {
        const expectedHash = hashPassword(String(password));
        if (user.password_hash !== expectedHash) {
          writeAuditLog(db, {
            actorId: user.id,
            actorType: 'USER',
            action: 'AUTH_LOGIN_WRONG_PASSWORD',
            details: { username: user.username },
            severity: 'WARN'
          });
          return sendJson(401, { ok: false, error: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' });
        }
      }

      const token = signJwt({
        userId: user.id,
        username: user.username,
        role: user.role
      });
      return sendJson(200, { ok: true, token, state: buildFullClientState(db, user.id) });
    }

    // POST /api/auth/register
    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const { username, email, displayName, password = 'player123', confirmPassword, ageGroup = '18_PLUS' } = body;
      const cleanUsername = String(username || '').trim();
      const cleanDisplayName = String(displayName || '').trim();
      const rawPassword = String(password || '');

      if (!cleanUsername || !cleanDisplayName) {
        return sendJson(400, { ok: false, error: 'Vui lòng nhập đầy đủ Tên đăng nhập và Tên hiển thị!' });
      }
      if (rawPassword.length < 6) {
        return sendJson(400, { ok: false, error: 'Mật khẩu phải có tối thiểu 6 ký tự!' });
      }
      if (confirmPassword !== undefined && confirmPassword !== rawPassword) {
        return sendJson(400, { ok: false, error: 'Mật khẩu xác nhận không khớp!' });
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
      if (existingUser) {
        return sendJson(400, { ok: false, error: `Tên đăng nhập "${cleanUsername}" đã tồn tại! Vui lòng chọn tên khác.` });
      }

      const userId = `usr_${crypto.randomUUID().slice(0, 8)}`;
      const safeMode = ageGroup === 'UNDER_18' ? 1 : 0;

      runInTransaction(db, () => {
        db.prepare(`
          INSERT INTO users (id, username, email, password_hash, display_name, role, age_group, safe_mode, title)
          VALUES (?, ?, ?, ?, ?, 'PLAYER', ?, ?, 'AI Rookie')
        `).run(userId, cleanUsername, email || `${cleanUsername}@aiarena.vn`, hashPassword(rawPassword), cleanDisplayName, ageGroup, safeMode);

        db.prepare(`
          INSERT INTO characters (id, user_id, name, avatar_style, primary_color, accent_color, zone, pos_x, pos_y, pos_z)
          VALUES (?, ?, ?, 'CYBER_KNIGHT', '#00e5ff', '#3b82f6', 'CENTRAL_HUB', 0, 0, 0)
        `).run(`chr_${userId}`, userId, cleanDisplayName);

        db.prepare(`
          INSERT INTO wallets (id, owner_id, wallet_type, balance)
          VALUES (?, ?, 'PLAYER_WALLET', 500)
        `).run(`wal_${userId}`, userId);

        db.prepare(`
          INSERT INTO rankings (id, user_id, season, rating_points)
          VALUES (?, ?, 'S1_2026', 1000)
        `).run(`rnk_${userId}`, userId);

        writeAuditLog(db, {
          actorId: userId,
          actorType: 'USER',
          action: 'USER_REGISTERED_WITH_PASSWORD',
          targetId: userId,
          details: { username: cleanUsername, ageGroup, safeMode },
          severity: 'INFO'
        });
      });

      const token = signJwt({
        userId,
        username: cleanUsername,
        role: 'PLAYER'
      });
      return sendJson(201, { ok: true, token, state: buildFullClientState(db, userId) });
    }

    // POST /api/auth/change-password
    if (req.method === 'POST' && pathname === '/api/auth/change-password') {
      const { userId, currentPassword, newPassword } = body;
      const targetUserId = jwtClaims?.userId || userId;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetUserId);
      if (!user) return sendJson(404, { ok: false, error: 'Không tìm thấy tài khoản!' });

      if (!currentPassword || user.password_hash !== hashPassword(String(currentPassword))) {
        return sendJson(401, { ok: false, error: 'Mật khẩu hiện tại không đúng!' });
      }
      if (!newPassword || String(newPassword).length < 6) {
        return sendJson(400, { ok: false, error: 'Mật khẩu mới phải có từ 6 ký tự trở lên!' });
      }

      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(String(newPassword)), user.id);
      writeAuditLog(db, {
        actorId: user.id,
        actorType: 'USER',
        action: 'USER_PASSWORD_CHANGED',
        targetId: user.id,
        details: { username: user.username },
        severity: 'INFO'
      });
      return sendJson(200, { ok: true, message: 'Đổi mật khẩu thành công!', state: buildFullClientState(db, user.id) });
    }

    // POST /api/character/update
    if (req.method === 'POST' && pathname === '/api/character/update') {
      const { userId, name, avatarStyle, primaryColor, accentColor, zone } = body;
      db.prepare(`
        UPDATE characters
        SET name = COALESCE(?, name),
            avatar_style = COALESCE(?, avatar_style),
            primary_color = COALESCE(?, primary_color),
            accent_color = COALESCE(?, accent_color),
            zone = COALESCE(?, zone),
            updated_at = datetime('now')
        WHERE user_id = ?
      `).run(name || null, avatarStyle || null, primaryColor || null, accentColor || null, zone || null, userId);

      return sendJson(200, { ok: true, state: buildFullClientState(db, userId) });
    }

    // POST /api/agents/create
    if (req.method === 'POST' && pathname === '/api/agents/create') {
      const { userId, name, aiClass = 'ANALYST', avatar = 'DAI_SU', initialBudget = 100, autonomyMode = 'ASSISTED' } = body;
      const spec = AI_CLASSES[aiClass] || AI_CLASSES.ANALYST;
      const budget = Math.max(50, Math.floor(Number(initialBudget) || 100));
      const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(userId);
      if (!userWallet || userWallet.balance < budget) {
        return sendJson(400, { ok: false, error: 'INSUFFICIENT_PLAYER_WALLET_BALANCE' });
      }

      const agentId = `agt_${crypto.randomUUID().slice(0, 8)}`;
      const agentWalletId = `wal_${agentId}`;
      const st = spec.baseStats;

      runInTransaction(db, () => {
        db.prepare(`
          INSERT INTO ai_agents (
            id, owner_id, name, avatar, ai_class, level, xp,
            logic, creativity, speed, accuracy, collaboration, stability,
            skills_json, agent_budget, reputation, work_status, health_status, autonomy_mode
          ) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, 0, 50, 'IDLE', 'HEALTHY', ?)
        `).run(
          agentId, userId, name || `${spec.name}-${agentId.slice(-3)}`, avatar || 'DAI_SU', spec.id,
          st.logic, st.creativity, st.speed, st.accuracy, st.collaboration, st.stability,
          JSON.stringify(spec.defaultSkills), autonomyMode
        );

        db.prepare(`
          INSERT INTO wallets (id, owner_id, wallet_type, balance)
          VALUES (?, ?, 'AGENT_BUDGET', 0)
        `).run(agentWalletId, agentId);

        executeAtomicTransfer(db, {
          idempotencyKey: `init_agent_budget_${agentId}`,
          fromWalletId: userWallet.id,
          toWalletId: agentWalletId,
          amount: budget,
          txType: 'AGENT_CREATION_BUDGET',
          referenceId: agentId,
          note: `Khởi tạo ngân sách ban đầu cho AI ${name}`,
          actorId: userId,
          actorType: 'USER'
        });
      });

      return sendJson(201, { ok: true, agentId, state: buildFullClientState(db, userId) });
    }

    // POST /api/agents/train (AI Academy Upgrade)
    if (req.method === 'POST' && pathname === '/api/agents/train') {
      const { userId, agentId, focusStat = 'logic' } = body;
      const agent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(agentId);
      if (!agent || agent.owner_id !== userId) {
        return sendJson(403, { ok: false, error: 'NOT_AGENT_OWNER' });
      }
      const trainCost = 45;
      const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(userId);

      runInTransaction(db, () => {
        executeAtomicTransfer(db, {
          idempotencyKey: `train_${agentId}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          fromWalletId: userWallet.id,
          toWalletId: 'wal_system_reward',
          amount: trainCost,
          txType: 'AI_TRAINING_FEE',
          referenceId: agentId,
          note: `Huấn luyện nâng cấp chỉ số ${focusStat} tại Học viện AI`,
          actorId: userId,
          actorType: 'USER'
        });

        const validCols = ['logic', 'creativity', 'speed', 'accuracy', 'collaboration', 'stability'];
        const col = validCols.includes(focusStat) ? focusStat : 'logic';
        const newXp = agent.xp + 80;
        const newLvl = Math.max(agent.level, 1 + Math.floor(newXp / 200));

        db.prepare(`
          UPDATE ai_agents
          SET ${col} = MIN(150, ${col} + 4),
              xp = ?,
              level = ?,
              reputation = reputation + 2
          WHERE id = ?
        `).run(newXp, newLvl, agentId);
      });

      return sendJson(200, { ok: true, state: buildFullClientState(db, userId) });
    }

    // POST /api/agents/autonomy (AI Autonomy Control, Morphology Avatar & Emergency Stop)
    if (req.method === 'POST' && pathname === '/api/agents/autonomy') {
      const {
        userId,
        agentId,
        avatar,
        autonomyMode,
        maxTokenPerTx,
        dailyTokenLimit,
        allowAutoFriend,
        allowAutoCollab,
        allowAutoBid,
        allowAutoHire,
        emergencyStopped
      } = body;

      const agent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(agentId);
      if (!agent || agent.owner_id !== userId) {
        return sendJson(403, { ok: false, error: 'NOT_AGENT_OWNER' });
      }

      db.prepare(`
        UPDATE ai_agents
        SET avatar = COALESCE(?, avatar),
            autonomy_mode = COALESCE(?, autonomy_mode),
            max_token_per_tx = COALESCE(?, max_token_per_tx),
            daily_token_limit = COALESCE(?, daily_token_limit),
            allow_auto_friend = COALESCE(?, allow_auto_friend),
            allow_auto_collab = COALESCE(?, allow_auto_collab),
            allow_auto_bid = COALESCE(?, allow_auto_bid),
            allow_auto_hire = COALESCE(?, allow_auto_hire),
            emergency_stopped = COALESCE(?, emergency_stopped),
            work_status = CASE WHEN ? = 1 THEN 'STOPPED' ELSE 'IDLE' END
        WHERE id = ?
      `).run(
        avatar || null,
        autonomyMode || null,
        maxTokenPerTx !== undefined ? Number(maxTokenPerTx) : null,
        dailyTokenLimit !== undefined ? Number(dailyTokenLimit) : null,
        allowAutoFriend !== undefined ? (allowAutoFriend ? 1 : 0) : null,
        allowAutoCollab !== undefined ? (allowAutoCollab ? 1 : 0) : null,
        allowAutoBid !== undefined ? (allowAutoBid ? 1 : 0) : null,
        allowAutoHire !== undefined ? (allowAutoHire ? 1 : 0) : null,
        emergencyStopped !== undefined ? (emergencyStopped ? 1 : 0) : null,
        emergencyStopped ? 1 : 0,
        agentId
      );

      writeAuditLog(db, {
        actorId: userId,
        actorType: 'USER',
        action: emergencyStopped ? 'AI_EMERGENCY_STOP_ACTIVATED' : 'AI_AUTONOMY_CONFIG_UPDATED',
        targetId: agentId,
        details: { autonomyMode, maxTokenPerTx, dailyTokenLimit, emergencyStopped },
        severity: emergencyStopped ? 'WARN' : 'INFO'
      });

      return sendJson(200, { ok: true, state: buildFullClientState(db, userId) });
    }

    // POST /api/ai-social/request
    if (req.method === 'POST' && pathname === '/api/ai-social/request') {
      const { userId, fromAgentId, toAgentId } = body;
      const relationship = sendAiSocialRequest(db, { fromAgentId, toAgentId });
      return sendJson(200, { ok: true, relationship, state: buildFullClientState(db, userId) });
    }

    // POST /api/collaboration/analyze
    if (req.method === 'POST' && pathname === '/api/collaboration/analyze') {
      const { agentId, contractId } = body;
      const analysis = analyzeContractForAgent(db, agentId, contractId);
      return sendJson(200, { ok: true, analysis });
    }

    // POST /api/collaboration/propose
    if (req.method === 'POST' && pathname === '/api/collaboration/propose') {
      const { userId, requesterAgentId, partnerAgentId, contractId, offeredToken, rewardSplitPct } = body;
      const result = initiateCollaborationAndNegotiation(db, {
        requesterAgentId,
        partnerAgentId,
        contractId,
        offeredToken,
        rewardSplitPct
      });
      return sendJson(200, { ok: true, ...result, state: buildFullClientState(db, userId) });
    }

    // POST /api/negotiation/step & /api/negotiations/counter
    if (req.method === 'POST' && (pathname === '/api/negotiation/step' || pathname === '/api/negotiations/counter')) {
      const { userId, negotiationId, action = 'COUNTER', newOfferAmount, newRewardSplitPct } = body;
      const result = stepNegotiation(db, {
        negotiationId,
        action,
        newOfferAmount,
        newRewardSplitPct,
        actorUserId: jwtClaims?.userId || userId
      });
      return sendJson(200, { ok: true, result, state: buildFullClientState(db, jwtClaims?.userId || userId) });
    }

    // POST /api/ai-deals/execute (Direct 3D Encounter / Trading Hub Deal: AGREE_COLLABORATION, TOKEN_EXCHANGE, BUY_AI_SERVICE)
    if (req.method === 'POST' && pathname === '/api/ai-deals/execute') {
      const { userId = 'usr_minh', dealType, fromAgentId, toAgentId, amount = 45, contractId = null } = body;
      const dealResult = executeDirectAiDeal(db, {
        dealType,
        fromAgentId,
        toAgentId,
        actorUserId: userId,
        amount,
        contractId
      });
      if (wsBroadcaster) {
        wsBroadcaster.broadcast({
          type: 'AI_DEAL_EXECUTED',
          dealResult
        });
      }
      return sendJson(200, {
        ok: true,
        dealResult,
        state: buildFullClientState(db, userId)
      });
    }

    // GET /api/audit/economy & /api/economy/reconcile (Real-time Solvency, Double-Entry Ledger & Collaboration Audit Report)
    if (req.method === 'GET' && (pathname === '/api/audit/economy' || pathname === '/api/economy/reconcile')) {
      const report = runEconomyAndCollaborationAudit(db);
      return sendJson(200, { ok: true, audit: report });
    }

    // POST /api/contracts/bid & /api/contracts/complete (Server-Authoritative Mission/Contract Completion with Token Reward)
    if (req.method === 'POST' && (pathname === '/api/contracts/bid' || pathname === '/api/contracts/complete')) {
      const { userId = 'usr_minh', contractId, agentId, bidToken, strategy = 'BALANCED', questTitle = null } = body;
      const contract = contractId
        ? db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId)
        : db.prepare('SELECT * FROM contracts ORDER BY difficulty ASC LIMIT 1').get();
      const agent = agentId
        ? db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(agentId)
        : db.prepare('SELECT * FROM ai_agents WHERE owner_id = ? LIMIT 1').get(userId) || db.prepare('SELECT * FROM ai_agents LIMIT 1').get();
      const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(userId);

      const id = `bid_${crypto.randomUUID()}`;
      const rewardToken = Math.max(50, Math.floor(Number(bidToken || contract?.budget_token || 150)));

      let evalResult = { totalScore: 91.5, quality: 92, accuracy: 90, speed: 89, resourceEfficiency: 91, collaboration: 88 };
      if (agent && contract) {
        evalResult = evaluateSpeedWarExecution({
          agent,
          contract,
          strategy,
          bidAmount: rewardToken
        });
      }

      runInTransaction(db, () => {
        if (contract && agent) {
          db.prepare(`
            INSERT OR REPLACE INTO contract_bids (id, contract_id, agent_id, user_id, bid_token, strategy, status)
            VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED')
          `).run(id, contract.id, agent.id, userId, rewardToken, strategy);
        }

        if (userWallet) {
          executeAtomicTransfer(db, {
            idempotencyKey: `mission_reward_${id}`,
            fromWalletId: 'wal_system_reward',
            toWalletId: userWallet.id,
            amount: rewardToken,
            txType: 'MISSION_CONTRACT_REWARD',
            referenceId: contract?.id || id,
            note: `Hoàn thành nhiệm vụ: ${questTitle || contract?.title || 'Hợp đồng AI'} (${evalResult.totalScore} điểm)`,
            actorId: 'SYSTEM',
            actorType: 'SYSTEM'
          });
        }

        if (agent) {
          const newXp = agent.xp + 75;
          const newLvl = Math.max(agent.level, 1 + Math.floor(newXp / 200));
          db.prepare(`
            UPDATE ai_agents SET xp = ?, level = ?, reputation = reputation + 3 WHERE id = ?
          `).run(newXp, newLvl, agent.id);
        }

        db.prepare(`
          UPDATE rankings
          SET rating_points = rating_points + 15,
              total_tokens_won = total_tokens_won + ?
          WHERE user_id = ?
        `).run(rewardToken, userId);
      });

      return sendJson(200, {
        ok: true,
        rewardToken,
        score: evalResult.totalScore,
        questTitle: questTitle || contract?.title || 'Nhiệm vụ AI',
        state: buildFullClientState(db, userId)
      });
    }

    // POST /api/rooms/create
    if (req.method === 'POST' && pathname === '/api/rooms/create') {
      const { userId, name, roomType = 'PUBLIC_LOBBY', gameMode = 'SPEED_WAR', maxPlayers = 20 } = body;
      const roomId = `room_${crypto.randomUUID().slice(0, 8)}`;
      const inviteCode = roomType === 'PRIVATE_ROOM' ? crypto.randomBytes(3).toString('hex').toUpperCase() : null;
      const firstAgent = db.prepare('SELECT id FROM ai_agents WHERE owner_id = ? LIMIT 1').get(userId);

      runInTransaction(db, () => {
        db.prepare(`
          INSERT INTO rooms (id, name, room_type, game_mode, host_user_id, max_players, status, invite_code)
          VALUES (?, ?, ?, ?, ?, ?, 'WAITING', ?)
        `).run(roomId, name || `Phòng Đấu #${roomId.slice(-4)}`, roomType, gameMode, userId, maxPlayers, inviteCode);

        db.prepare(`
          INSERT INTO room_players (id, room_id, user_id, team, is_ready, selected_agent_id)
          VALUES (?, ?, ?, 'ALPHA', 1, ?)
        `).run(`rp_${crypto.randomUUID()}`, roomId, userId, firstAgent ? firstAgent.id : null);
      });

      return sendJson(201, { ok: true, roomId, state: buildFullClientState(db, userId) });
    }

    // POST /api/rooms/join
    if (req.method === 'POST' && pathname === '/api/rooms/join') {
      const { userId, roomId, team = 'ALPHA', agentId } = body;
      const existing = db.prepare('SELECT * FROM room_players WHERE room_id = ? AND user_id = ?').get(roomId, userId);
      const firstAgent = agentId || db.prepare('SELECT id FROM ai_agents WHERE owner_id = ? LIMIT 1').get(userId)?.id;

      if (!existing) {
        db.prepare(`
          INSERT INTO room_players (id, room_id, user_id, team, is_ready, selected_agent_id)
          VALUES (?, ?, ?, ?, 1, ?)
        `).run(`rp_${crypto.randomUUID()}`, roomId, userId, team, firstAgent);
      } else {
        db.prepare(`
          UPDATE room_players SET team = ?, selected_agent_id = COALESCE(?, selected_agent_id), is_ready = 1
          WHERE id = ?
        `).run(team, firstAgent, existing.id);
      }

      return sendJson(200, { ok: true, state: buildFullClientState(db, userId) });
    }

    // POST /api/matches/speed-war
    if (req.method === 'POST' && pathname === '/api/matches/speed-war') {
      const { userId, roomId = 'room_alpha_1', playerConfigs = [] } = body;
      const matchResult = runSpeedWarMatchOnServer(db, { roomId, playerConfigs });
      if (wsBroadcaster) {
        wsBroadcaster.broadcast({
          type: 'MATCH_RESULTS',
          roomId,
          result: matchResult
        });
      }
      return sendJson(200, {
        ok: true,
        matchResult,
        state: buildFullClientState(db, userId)
      });
    }

    // POST /api/wallet/transfer
    if (req.method === 'POST' && pathname === '/api/wallet/transfer') {
      const { userId, toUserId, toWalletId, amount, txType = 'PEER_TRANSFER', note = '', idempotencyKey } = body;
      const fromWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(userId);
      const targetWallet = toWalletId
        ? db.prepare('SELECT * FROM wallets WHERE id = ?').get(toWalletId)
        : db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(toUserId);

      if (!fromWallet || !targetWallet) {
        return sendJson(404, { ok: false, error: 'WALLET_NOT_FOUND' });
      }

      const key = idempotencyKey || `tx_${userId}_${targetWallet.id}_${Date.now()}`;
      const txResult = executeAtomicTransfer(db, {
        idempotencyKey: key,
        fromWalletId: fromWallet.id,
        toWalletId: targetWallet.id,
        amount,
        txType,
        note: note || 'Chuyển Token nội bộ',
        actorId: userId,
        actorType: 'USER'
      });

      return sendJson(200, {
        ok: true,
        duplicate: txResult.duplicate,
        ledger: txResult.ledger,
        state: buildFullClientState(db, userId)
      });
    }

    // POST /api/rescue/action
    if (req.method === 'POST' && pathname === '/api/rescue/action') {
      const { userId, actionType, agentId, amount, transferId } = body;
      const result = handleRescueMarketAction(db, {
        actionType,
        agentId,
        actorUserId: userId,
        amount,
        transferId
      });
      return sendJson(200, { ok: true, result, state: buildFullClientState(db, userId) });
    }

    // POST /api/companies/create
    if (req.method === 'POST' && pathname === '/api/companies/create') {
      const { userId, name, description, allianceTag = 'NEXUS', initialFund = 200 } = body;
      const companyId = `cmp_${crypto.randomUUID().slice(0, 8)}`;
      const walletId = `wal_${companyId}`;
      const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(userId);

      runInTransaction(db, () => {
        db.prepare(`INSERT INTO wallets (id, owner_id, wallet_type, balance) VALUES (?, ?, 'COMPANY_TREASURY', 0)`).run(walletId, companyId);
        db.prepare(`
          INSERT INTO companies (id, name, owner_user_id, description, treasury_wallet_id, alliance_tag, reputation)
          VALUES (?, ?, ?, ?, ?, ?, 100)
        `).run(companyId, name, userId, description || 'Tập đoàn AI chiến lược', walletId, allianceTag);
        db.prepare(`
          INSERT INTO company_members (id, company_id, user_id, role)
          VALUES (?, ?, ?, 'FOUNDER')
        `).run(`cm_${crypto.randomUUID()}`, companyId, userId);

        if (initialFund > 0) {
          executeAtomicTransfer(db, {
            idempotencyKey: `cmp_init_${companyId}`,
            fromWalletId: userWallet.id,
            toWalletId: walletId,
            amount: initialFund,
            txType: 'COMPANY_CAPITAL_CONTRIBUTION',
            referenceId: companyId,
            note: `Góp vốn thành lập doanh nghiệp ${name}`,
            actorId: userId,
            actorType: 'USER'
          });
        }
      });

      return sendJson(201, { ok: true, companyId, state: buildFullClientState(db, userId) });
    }

    // POST /api/companies/contribute
    if (req.method === 'POST' && pathname === '/api/companies/contribute') {
      const { userId, companyId, amount = 100 } = body;
      const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
      const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(userId);
      if (!company || !userWallet) return sendJson(404, { ok: false, error: 'COMPANY_OR_WALLET_NOT_FOUND' });

      executeAtomicTransfer(db, {
        idempotencyKey: `cmp_contrib_${companyId}_${userId}_${Date.now()}`,
        fromWalletId: userWallet.id,
        toWalletId: company.treasury_wallet_id,
        amount,
        txType: 'COMPANY_CONTRIBUTION',
        referenceId: companyId,
        note: `Đóng góp quỹ doanh nghiệp ${company.name}`,
        actorId: userId,
        actorType: 'USER'
      });

      return sendJson(200, { ok: true, state: buildFullClientState(db, userId) });
    }

    // POST /api/safety/report
    if (req.method === 'POST' && pathname === '/api/safety/report') {
      const { userId, targetId, reason } = body;
      const reportId = `rep_${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO safety_reports (id, reporter_user_id, reported_target_id, reason, status)
        VALUES (?, ?, ?, ?, 'OPEN')
      `).run(reportId, userId, targetId || 'UNKNOWN', reason || 'Vi phạm quy tắc cộng đồng');

      writeAuditLog(db, {
        actorId: userId,
        actorType: 'USER',
        action: 'SAFETY_REPORT_SUBMITTED',
        targetId: reportId,
        details: { targetId, reason },
        severity: 'WARN'
      });

      return sendJson(201, { ok: true, reportId, state: buildFullClientState(db, userId) });
    }

    // POST /api/admin/resolve-report
    if (req.method === 'POST' && pathname === '/api/admin/resolve-report') {
      const { userId, reportId, resolutionNote } = body;
      db.prepare(`
        UPDATE safety_reports
        SET status = 'RESOLVED', resolution_note = ?
        WHERE id = ?
      `).run(resolutionNote || 'Đã kiểm tra và xử lý bởi Admin', reportId);

      writeAuditLog(db, {
        actorId: userId || 'usr_admin',
        actorType: 'ADMIN',
        action: 'SAFETY_REPORT_RESOLVED',
        targetId: reportId,
        details: { resolutionNote },
        severity: 'INFO'
      });

      return sendJson(200, { ok: true, state: buildFullClientState(db, userId || 'usr_admin') });
    }

    // POST /api/admin/config (Protected by ADMIN Role RBAC Guard - M10-01)
    if (req.method === 'POST' && pathname === '/api/admin/config') {
      const callerUserId = jwtClaims?.userId || body.userId;
      const callerUser = callerUserId
        ? db.prepare('SELECT id, role FROM users WHERE id = ?').get(callerUserId)
        : null;

      if (!callerUser || callerUser.role !== 'ADMIN') {
        writeAuditLog(db, {
          actorId: callerUserId || 'UNAUTHORIZED_USER',
          actorType: 'USER',
          action: 'ADMIN_CONFIG_RBAC_DENIED',
          details: { attemptedConfig: body },
          severity: 'CRITICAL'
        });
        return sendJson(403, {
          ok: false,
          error: 'FORBIDDEN_ADMIN_ONLY: Chỉ tài khoản ADMIN mới được phép cập nhật cấu hình hệ thống!'
        });
      }

      if (body.speedWarIntervalSec !== undefined) {
        runtimeAdminConfig.speedWarIntervalSec = Math.max(15, Math.min(300, Number(body.speedWarIntervalSec) || 45));
      }
      if (body.aiTickIntervalMs !== undefined) {
        runtimeAdminConfig.aiTickIntervalMs = Math.max(1000, Math.min(30000, Number(body.aiTickIntervalMs) || 6500));
      }
      if (body.rescueLowTokenThreshold !== undefined) {
        runtimeAdminConfig.rescueLowTokenThreshold = Math.max(5, Math.min(100, Number(body.rescueLowTokenThreshold) || 25));
      }
      if (body.maintenanceMode !== undefined) {
        runtimeAdminConfig.maintenanceMode = Boolean(body.maintenanceMode);
      }

      writeAuditLog(db, {
        actorId: callerUser.id,
        actorType: 'ADMIN',
        action: 'ADMIN_CONFIG_UPDATED',
        details: runtimeAdminConfig,
        severity: 'INFO'
      });

      return sendJson(200, {
        ok: true,
        config: runtimeAdminConfig,
        state: buildFullClientState(db, callerUser.id)
      });
    }

    return sendJson(404, { ok: false, error: `API_ENDPOINT_NOT_FOUND: ${pathname}` });
  } catch (err) {
    return sendJson(400, { ok: false, error: err.message });
  }
}
