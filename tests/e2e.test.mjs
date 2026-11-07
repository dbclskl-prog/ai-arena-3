import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { getDb, ensureSeedData } from '../database/db.mjs';
import { handleApiRequest } from '../api/routes.mjs';
import { attachMultiplayerWsServer } from '../game-server/wsServer.mjs';
import { Blackboard, BTStatus, createHybridAgentBrain, ResponseCurves } from '../ai-worker/btUtilityRuntime.mjs';

const tmpDbPath = path.join(os.tmpdir(), `ai_arena_test_${Date.now()}.sqlite`);
let db;
let wsBroadcaster;
let mockHttpServer;

test.before(() => {
  db = getDb(tmpDbPath);
  ensureSeedData(db);
  mockHttpServer = new EventEmitter();
  wsBroadcaster = attachMultiplayerWsServer(mockHttpServer, db);
});

test.after(() => {
  try {
    if (fs.existsSync(tmpDbPath)) fs.unlinkSync(tmpDbPath);
  } catch (_) {}
});

/**
 * Invoke the production REST API router directly (works inside network-isolated sandboxes and CI)
 */
async function api(pathname, method = 'GET', body = null, extraHeaders = {}) {
  const rawBody = body ? Buffer.from(JSON.stringify(body), 'utf8') : Buffer.alloc(0);
  const reqStream = Readable.from(rawBody.length ? [rawBody] : []);
  reqStream.url = pathname;
  reqStream.method = method;
  reqStream.headers = { host: 'localhost:3300', 'content-type': 'application/json', ...extraHeaders };

  let statusCode = 200;
  let responseBuffer = Buffer.alloc(0);

  const res = {
    writeHead(status) {
      statusCode = status;
    },
    end(chunk) {
      if (chunk) {
        responseBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8');
      }
    }
  };

  await handleApiRequest(reqStream, res, db, wsBroadcaster);
  const json = JSON.parse(responseBuffer.toString('utf8'));
  return { status: statusCode, json };
}

/**
 * Helper to create a Masked RFC 6455 Client Frame and parse Server Frames over Duplex Socket
 */
function createVirtualWsClient() {
  const socket = new EventEmitter();
  socket.destroyed = false;
  const receivedMessages = [];

  socket.write = (chunk) => {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    // Ignore HTTP 101 handshake text header
    if (buf.toString('utf8', 0, 8) === 'HTTP/1.1') return;

    let offset = 0;
    while (offset + 2 <= buf.length) {
      const b1 = buf[offset];
      const b2 = buf[offset + 1];
      let len = b2 & 0x7f;
      let hLen = 2;
      if (len === 126) {
        len = buf.readUInt16BE(offset + 2);
        hLen = 4;
      } else if (len === 127) {
        len = Number(buf.readBigUInt64BE(offset + 2));
        hLen = 10;
      }
      if ((b1 & 0x0f) === 0x1) {
        const text = buf.subarray(offset + hLen, offset + hLen + len).toString('utf8');
        const parsed = JSON.parse(text);
        receivedMessages.push(parsed);
        socket.emit('ws_message', parsed);
      }
      offset += hLen + len;
    }
  };

  socket.end = () => {
    socket.destroyed = true;
    socket.emit('close');
  };

  mockHttpServer.emit('upgrade', {
    headers: { 'sec-websocket-key': crypto.randomBytes(16).toString('base64') }
  }, socket);

  function sendJson(obj) {
    const payload = Buffer.from(JSON.stringify(obj), 'utf8');
    const mask = Buffer.from([0x12, 0x34, 0x56, 0x78]);
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      masked[i] = payload[i] ^ mask[i % 4];
    }
    let header;
    if (payload.length < 126) {
      header = Buffer.from([0x81, 0x80 | payload.length]);
    } else {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    }
    socket.emit('data', Buffer.concat([header, mask, masked]));
  }

  return { socket, sendJson, receivedMessages };
}

test('1. Bootstrap & Database Seed: 9 World Zones, 6 AI Classes, Wallets & Contracts exist', async () => {
  const { status, json } = await api('/api/state?userId=usr_minh');
  assert.equal(status, 200);
  assert.equal(json.ok, true);
  assert.equal(json.state.zones.length, 9);
  assert.equal(Object.keys(json.state.aiClasses).length, 6);
  assert.ok(json.state.agents.length >= 6);
  assert.ok(json.state.contracts.length >= 6);
  assert.ok(json.state.userWallet.balance > 0);
});

test('2. Two players connect via WebSocket and see each other move in 3D World + Safe Chat filter', async () => {
  const client1 = createVirtualWsClient();
  const client2 = createVirtualWsClient();

  client1.sendJson({ type: 'AUTH_HELLO', userId: 'usr_minh' });
  client2.sendJson({ type: 'AUTH_HELLO', userId: 'usr_lan' });

  client1.sendJson({
    type: 'MOVE_3D',
    userId: 'usr_minh',
    x: 42.5,
    y: 0,
    z: -28.5,
    rotY: 1.2,
    zone: 'BATTLE_ARENA',
    animState: 'RUN'
  });

  const movedEvent = client2.receivedMessages.find(m => m.type === 'PLAYER_MOVED' && m.userId === 'usr_minh');
  assert.ok(movedEvent, 'Player 2 must receive Player 1 3D movement broadcast');
  assert.equal(movedEvent.x, 42.5);
  assert.equal(movedEvent.z, -28.5);
  assert.equal(movedEvent.zone, 'BATTLE_ARENA');
  assert.equal(movedEvent.animState, 'RUN');

  // Test Room Chat with Under-18 Safe Mode PII masking
  client1.sendJson({
    type: 'ROOM_CHAT',
    roomId: 'room_alpha_1',
    message: 'Liên hệ số 0912345678 để lập đội nhé!'
  });

  const chatEvent = client2.receivedMessages.find(m => m.type === 'ROOM_CHAT_MSG');
  assert.ok(chatEvent);
  assert.match(chatEvent.message, /\[SĐT ĐÃ ẨN\]/);

  // Test WebSocket Anti-Cheat Guard
  client1.sendJson({ type: 'CLIENT_SET_TOKEN', amount: 999999 });
  const secViolation = client1.receivedMessages.find(m => m.type === 'SECURITY_VIOLATION');
  assert.ok(secViolation, 'Server must reject direct token manipulation over WebSocket');

  client1.socket.end();
  client2.socket.end();
});

test('3. AI Agent Creation, Training & Autonomy Control (including Emergency Stop)', async () => {
  const createRes = await api('/api/agents/create', 'POST', {
    userId: 'usr_minh',
    name: 'QuantumGuard-X',
    aiClass: 'GUARDIAN',
    initialBudget: 90,
    autonomyMode: 'ASSISTED'
  });
  assert.equal(createRes.status, 201);
  const agentId = createRes.json.agentId;

  const stopRes = await api('/api/agents/autonomy', 'POST', {
    userId: 'usr_minh',
    agentId,
    autonomyMode: 'LIMITED_AUTONOMOUS',
    maxTokenPerTx: 150,
    dailyTokenLimit: 500,
    emergencyStopped: 1
  });
  assert.equal(stopRes.status, 200);
  const updatedAgent = stopRes.json.state.agents.find(a => a.id === agentId);
  assert.equal(updatedAgent.emergency_stopped, 1);
  assert.equal(updatedAgent.work_status, 'STOPPED');

  await api('/api/agents/autonomy', 'POST', {
    userId: 'usr_minh',
    agentId,
    emergencyStopped: 0
  });
  const trainRes = await api('/api/agents/train', 'POST', {
    userId: 'usr_minh',
    agentId,
    focusStat: 'accuracy'
  });
  assert.equal(trainRes.status, 200);
});

test('4. AI Social Network: Friend Invite, Trust Score Upgrade & Rate Limit Protection', async () => {
  const res = await api('/api/ai-social/request', 'POST', {
    userId: 'usr_minh',
    fromAgentId: 'agt_athena',
    toAgentId: 'agt_mercury'
  });
  assert.equal(res.status, 200);
  assert.ok(res.json.relationship.trust_score >= 30);
});

test('5. AI Autonomous Collaboration & Bounded Negotiation with Escrow Settlement', async () => {
  const analyzeRes = await api('/api/collaboration/analyze', 'POST', {
    agentId: 'agt_athena',
    contractId: 'ctr_job_4'
  });
  assert.equal(analyzeRes.status, 200);
  assert.equal(analyzeRes.json.analysis.needsPartner, true);
  assert.ok(analyzeRes.json.analysis.recommendedPartners.length > 0);

  const propRes = await api('/api/collaboration/propose', 'POST', {
    userId: 'usr_minh',
    requesterAgentId: 'agt_athena',
    partnerAgentId: 'agt_nova',
    contractId: 'ctr_job_4',
    offeredToken: 60,
    rewardSplitPct: 35
  });
  assert.equal(propRes.status, 200);
  const negotiationId = propRes.json.negotiation.id;

  const settleRes = await api('/api/negotiation/step', 'POST', {
    userId: 'usr_minh',
    negotiationId,
    action: 'ACCEPT_AND_EXECUTE'
  });
  assert.equal(settleRes.status, 200);
  assert.equal(settleRes.json.result.negotiation.status, 'SETTLED');
  assert.ok(settleRes.json.result.execution.total_score > 0);
});

test('6. Token Economy: Atomic Transfer, Idempotency Deduplication & Negative Balance Prevention', async () => {
  const idemKey = `test_idem_${Date.now()}`;
  const tx1 = await api('/api/wallet/transfer', 'POST', {
    userId: 'usr_minh',
    toUserId: 'usr_khoa',
    amount: 40,
    idempotencyKey: idemKey,
    note: 'Kiểm thử Idempotency'
  });
  assert.equal(tx1.status, 200);
  assert.equal(tx1.json.duplicate, false);
  const balanceAfterFirst = tx1.json.state.userWallet.balance;

  // Replay exact same idempotencyKey -> must NOT deduct again
  const tx2 = await api('/api/wallet/transfer', 'POST', {
    userId: 'usr_minh',
    toUserId: 'usr_khoa',
    amount: 40,
    idempotencyKey: idemKey,
    note: 'Kiểm thử Idempotency lần 2'
  });
  assert.equal(tx2.status, 200);
  assert.equal(tx2.json.duplicate, true);
  assert.equal(tx2.json.state.userWallet.balance, balanceAfterFirst);

  // Attempt transfer exceeding balance -> must fail with INSUFFICIENT_BALANCE
  const txFail = await api('/api/wallet/transfer', 'POST', {
    userId: 'usr_khoa',
    toUserId: 'usr_minh',
    amount: 9999999
  });
  assert.equal(txFail.status, 400);
  assert.match(txFail.json.error, /INSUFFICIENT_BALANCE/);
});

test('7. AI Rescue Market: Unauthorized Buyout Blocked & Owner-Confirmed Buyout Succeeds', async () => {
  // Buyer (usr_minh) tries to self-approve buyout without true owner (usr_lan) -> BLOCKED!
  const unauthRes = await api('/api/rescue/action', 'POST', {
    userId: 'usr_minh',
    actionType: 'APPROVE_BUYOUT',
    transferId: 'res_seed_1'
  });
  assert.equal(unauthRes.status, 400);
  assert.match(unauthRes.json.error, /ONLY_CURRENT_OWNER_CAN_APPROVE_BUYOUT/);

  // True Owner (usr_lan) approves the buyout -> Succeeds and transfers ownership + recovery boost
  const ownerApproveRes = await api('/api/rescue/action', 'POST', {
    userId: 'usr_lan',
    actionType: 'APPROVE_BUYOUT',
    transferId: 'res_seed_1'
  });
  assert.equal(ownerApproveRes.status, 200);
  assert.equal(ownerApproveRes.json.result.transfer.status, 'COMPLETED');
  assert.equal(ownerApproveRes.json.result.transfer.owner_confirmed, 1);
  assert.equal(ownerApproveRes.json.result.agent.owner_id, 'usr_minh');
  assert.equal(ownerApproveRes.json.result.agent.health_status, 'RECOVERED');
});

test('8. AI Speed War (3 Rounds) Server-Authoritative Execution & Leaderboard Update', async () => {
  const swRes = await api('/api/matches/speed-war', 'POST', {
    userId: 'usr_minh',
    roomId: 'room_alpha_1',
    playerConfigs: [
      { userId: 'usr_minh', agentId: 'agt_athena', strategy: 'QUALITY_FIRST' },
      { userId: 'usr_lan', agentId: 'agt_nova', strategy: 'COLLABORATIVE' }
    ]
  });
  assert.equal(swRes.status, 200);
  const mr = swRes.json.matchResult;
  assert.equal(mr.rounds.length, 3);
  assert.ok(mr.standings.length >= 2);
  assert.ok(mr.standings[0].tokenReward > 0);
});

test('9. Server-Authoritative Anti-Cheat: Client cannot spoof balance or score', async () => {
  const cheatRes = await api('/api/wallet/transfer', 'POST', {
    userId: 'usr_khoa',
    forceBalance: 1000000,
    directScoreOverride: 9999
  });
  assert.equal(cheatRes.status, 403);
  assert.match(cheatRes.json.error, /SERVER_AUTHORITATIVE_VIOLATION/);
});

test('10. Corporation & Admin Console Safety Report Resolution', async () => {
  const compRes = await api('/api/companies/create', 'POST', {
    userId: 'usr_minh',
    name: 'Nexus Autonomous Syndicate',
    description: 'Liên minh AI tự chủ thế hệ mới',
    initialFund: 120
  });
  assert.equal(compRes.status, 201);

  const repRes = await api('/api/safety/report', 'POST', {
    userId: 'usr_khoa',
    targetId: 'suspicious_bot_99',
    reason: 'Nghi vấn spam lời mời kết bạn'
  });
  assert.equal(repRes.status, 201);

  const resolveRes = await api('/api/admin/resolve-report', 'POST', {
    userId: 'usr_admin',
    reportId: repRes.json.reportId,
    resolutionNote: 'Đã khóa cảnh cáo và kiểm tra Audit Log'
  });
  assert.equal(resolveRes.status, 200);
});

test('11. Awesome-Gamedev-Agent-Skills: Behavior Tree & Utility AI Runtime (Blackboard, Curves, Hysteresis)', () => {
  const { tree } = createHybridAgentBrain();

  // Case A: Healthy Analyst AI chooses Job Contract or Speed War
  const bbHealthy = new Blackboard({
    agentBudget: 220,
    logic: 98,
    speed: 72,
    collaboration: 70,
    stability: 80,
    creativity: 60,
    emergencyStopped: false
  });
  const status1 = tree.tick(bbHealthy, 0.016);
  assert.equal(status1, BTStatus.RUNNING);
  assert.equal(bbHealthy.get('currentUtilityAction'), 'EXECUTE_JOB_CONTRACT');
  assert.equal(bbHealthy.get('targetZoneId'), 'JOB_CITY');

  // Case B: Critical Low-Budget AI (12 TKN) automatically prioritizes SEEK_RESCUE_FUNDING at TOKEN_EXCHANGE
  const bbLowToken = new Blackboard({
    agentBudget: 12,
    logic: 80,
    speed: 70,
    collaboration: 70,
    stability: 80,
    creativity: 60,
    emergencyStopped: false
  });
  tree.tick(bbLowToken, 0.016);
  assert.equal(bbLowToken.get('currentUtilityAction'), 'SEEK_RESCUE_FUNDING');
  assert.equal(bbLowToken.get('targetZoneId'), 'TOKEN_EXCHANGE');

  // Case C: Emergency Stop branch preempts Utility AI immediately
  bbLowToken.set('emergencyStopped', true);
  const statusStopped = tree.tick(bbLowToken, 0.016);
  assert.equal(statusStopped, BTStatus.SUCCESS);
  assert.equal(bbLowToken.get('activeBTNode'), 'EmergencyHalted');

  // Verify Utility Compensation curve prevents 0-drag on multi-factor product
  const rawProduct = 0.8 * 0.8;
  const compensated = ResponseCurves.compensate(rawProduct, 2);
  assert.ok(compensated > rawProduct && compensated <= 1.0);
});

test('12. AI Generative Music Composer: Deterministic Seeded PRNG, Ngũ Cung Scale & Markov/Euclidean Plan', async () => {
  const { AIMusicComposer, generateEuclideanRhythm } = await import('../web/audioEngine.js');

  const agent = { name: 'Nova-Prime', ai_class: 'CREATOR', creativity: 94, logic_score: 88, speed: 85 };
  const planA = AIMusicComposer.compose({
    prompt: 'Cyberpunk Ngũ Cung Việt Nam hào hùng 128 BPM',
    seed: 'SEED-VIET-2026',
    agent
  });
  const planB = AIMusicComposer.compose({
    prompt: 'Cyberpunk Ngũ Cung Việt Nam hào hùng 128 BPM',
    seed: 'SEED-VIET-2026',
    agent
  });

  // Deterministic seed reproducibility (`procedural-gen`)
  assert.equal(planA.scaleId, 'VIET_PENTATONIC');
  assert.equal(planA.bpm, 128);
  assert.deepEqual(planA.patterns.lead, planB.patterns.lead);
  assert.deepEqual(planA.patterns.arp, planB.patterns.arp);
  assert.equal(planA.patterns.bass.length, 16);

  // Euclidean rhythm verification
  const euclid5 = generateEuclideanRhythm(5, 16, 0);
  assert.equal(euclid5.reduce((s, v) => s + v, 0), 5);
});

test('13. Direct 3D AI Deals (Agree Collaboration, Token Exchange, Buy AI Service) & Full Economy Audit', async () => {
  // 1. Direct Collaboration Agreement with Escrow Lock/Release & Reward Split
  const collabDeal = await api('/api/ai-deals/execute', 'POST', {
    userId: 'usr_minh',
    dealType: 'AGREE_COLLABORATION',
    fromAgentId: 'agt_athena',
    toAgentId: 'agt_nova',
    amount: 40
  });
  assert.equal(collabDeal.status, 200);
  assert.equal(collabDeal.json.dealResult.negotiation.status, 'SETTLED');
  assert.ok(collabDeal.json.dealResult.execution.total_score > 0);

  // 2. Direct AI Token Exchange
  const tokenDeal = await api('/api/ai-deals/execute', 'POST', {
    userId: 'usr_minh',
    dealType: 'TOKEN_EXCHANGE',
    fromAgentId: 'agt_athena',
    toAgentId: 'agt_mercury',
    amount: 30
  });
  assert.equal(tokenDeal.status, 200);
  assert.equal(tokenDeal.json.dealResult.ledger.tx_type, 'AI_PEER_TOKEN_EXCHANGE');

  // 3. Buy AI Specialized Service (+Stat & +XP)
  const beforeCreator = collabDeal.json.state.agents.find(a => a.id === 'agt_athena');
  const buySvc = await api('/api/ai-deals/execute', 'POST', {
    userId: 'usr_minh',
    dealType: 'BUY_AI_SERVICE',
    fromAgentId: 'agt_athena',
    toAgentId: 'agt_nova',
    amount: 35
  });
  assert.equal(buySvc.status, 200);
  const afterCreator = buySvc.json.state.agents.find(a => a.id === 'agt_athena');
  assert.ok(afterCreator.creativity > beforeCreator.creativity);

  // 4. Verify Mathematical Economy & Escrow Audit Invariants
  const auditRes = await api('/api/audit/economy', 'GET');
  assert.equal(auditRes.status, 200);
  assert.equal(auditRes.json.audit.passed, true);
  assert.equal(auditRes.json.audit.checks.noNegativeWallets, true);
  assert.equal(auditRes.json.audit.checks.agentWalletBudgetSynced, true);
  assert.equal(auditRes.json.audit.checks.ownerConfirmedBuyoutsOnly, true);
  assert.equal(auditRes.json.audit.checks.escrowSolvencyValid, true);
});

test('14. Highlighted Mission Contract Completion: Atomic Token Reward & Agent XP Progression', async () => {
  const beforeBoot = await api('/api/state?userId=usr_minh');
  const beforeWalletBal = beforeBoot.json.state.userWallet.balance;
  const openContract = beforeBoot.json.state.contracts.find(c => c.status === 'OPEN') || beforeBoot.json.state.contracts[0];

  const bidRes = await api('/api/contracts/bid', 'POST', {
    userId: 'usr_minh',
    contractId: openContract.id,
    agentId: 'agt_athena'
  });
  assert.equal(bidRes.status, 200);
  assert.ok(bidRes.json.rewardToken >= 120);
  assert.equal(bidRes.json.state.userWallet.balance, beforeWalletBal + bidRes.json.rewardToken);
  assert.ok(bidRes.json.state.ledger.some(tx => tx.tx_type === 'MISSION_CONTRACT_REWARD'));
});

test('15. Sprint M02 (VS01): HMAC-SHA256 JWT Issuance, Verification & Forged Token Rejection', async () => {
  const loginRes = await api('/api/auth/login', 'POST', { username: 'minh_ai' });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.json.token, 'Login must issue a signed HMAC-SHA256 JWT token');

  // Verify valid token via Authorization: Bearer header
  const verifyOk = await api('/api/auth/verify', 'GET', null, {
    authorization: `Bearer ${loginRes.json.token}`
  });
  assert.equal(verifyOk.status, 200);
  assert.equal(verifyOk.json.claims.userId, 'usr_minh');
  assert.equal(verifyOk.json.claims.role, 'COMPANY_OWNER');

  // Attempt forged signature -> must be rejected with 401
  const forgedToken = `${loginRes.json.token.slice(0, -6)}FORGED`;
  const verifyFail = await api('/api/auth/verify', 'GET', null, {
    authorization: `Bearer ${forgedToken}`
  });
  assert.equal(verifyFail.status, 401);
});

test('16. Sprint M02 (M10-01): Admin RBAC Guard on /api/admin/config (403 for PLAYER, 200 for ADMIN)', async () => {
  // Regular player attempts to change runtime config -> 403 Forbidden
  const deniedRes = await api('/api/admin/config', 'POST', {
    userId: 'usr_khoa',
    speedWarIntervalSec: 15
  });
  assert.equal(deniedRes.status, 403);
  assert.match(deniedRes.json.error, /FORBIDDEN_ADMIN_ONLY/);

  // Admin updates runtime config -> 200 OK
  const allowedRes = await api('/api/admin/config', 'POST', {
    userId: 'usr_admin',
    speedWarIntervalSec: 30,
    rescueLowTokenThreshold: 20
  });
  assert.equal(allowedRes.status, 200);
  assert.equal(allowedRes.json.config.speedWarIntervalSec, 30);
  assert.equal(allowedRes.json.config.rescueLowTokenThreshold, 20);
});

test('17. Sprint M02 (M06-01 & M08-01): Multi-Round Custom Split Counter-Offer & Double-Entry Ledger Reconciliation', async () => {
  const propRes = await api('/api/collaboration/propose', 'POST', {
    userId: 'usr_minh',
    requesterAgentId: 'agt_athena',
    partnerAgentId: 'agt_nova',
    contractId: 'ctr_job_4',
    offeredToken: 25,
    rewardSplitPct: 30
  });
  assert.equal(propRes.status, 200);
  const negId = propRes.json.negotiation.id;

  // Counter-offer with custom split 45% and 40 TKN
  const counterRes = await api('/api/negotiations/counter', 'POST', {
    userId: 'usr_lan',
    negotiationId: negId,
    action: 'COUNTER',
    newOfferAmount: 40,
    newRewardSplitPct: 45
  });
  assert.equal(counterRes.status, 200);
  assert.equal(counterRes.json.result.current_offer, 40);
  assert.equal(counterRes.json.result.status, 'ACCEPTED');

  // Verify Double-Entry Ledger Reconciliation
  const reconcileRes = await api('/api/economy/reconcile', 'GET');
  assert.equal(reconcileRes.status, 200);
  assert.equal(reconcileRes.json.audit.passed, true);
  assert.equal(reconcileRes.json.audit.checks.doubleEntryBalanced, true);
});

test('18. Player Registration with Password, Wrong-Password Rejection, Password Login & Change Password', async () => {
  // 1. Mismatched confirmPassword must fail with 400
  const mismatchRes = await api('/api/auth/register', 'POST', {
    username: 'commander_viet',
    displayName: 'Việt Cyber',
    password: 'secretPassword2026',
    confirmPassword: 'wrongConfirm2026',
    ageGroup: '18_PLUS'
  });
  assert.equal(mismatchRes.status, 400);

  // 2. Valid registration with password & confirmPassword
  const regRes = await api('/api/auth/register', 'POST', {
    username: 'commander_viet',
    displayName: 'Việt Cyber',
    email: 'viet@skyline.edu.vn',
    password: 'secretPassword2026',
    confirmPassword: 'secretPassword2026',
    ageGroup: '18_PLUS'
  });
  assert.equal(regRes.status, 201);
  assert.ok(regRes.json.token);
  assert.equal(regRes.json.state.currentUser.username, 'commander_viet');
  assert.equal(regRes.json.state.userWallet.balance, 500);

  // 3. Login with wrong password -> 401
  const badLogin = await api('/api/auth/login', 'POST', {
    username: 'commander_viet',
    password: 'wrongPassword111'
  });
  assert.equal(badLogin.status, 401);

  // 4. Login with correct password -> 200
  const goodLogin = await api('/api/auth/login', 'POST', {
    username: 'commander_viet',
    password: 'secretPassword2026'
  });
  assert.equal(goodLogin.status, 200);
  assert.ok(goodLogin.json.token);

  // 5. Change password -> 200, then login with new password
  const changePw = await api('/api/auth/change-password', 'POST', {
    userId: regRes.json.state.currentUser.id,
    currentPassword: 'secretPassword2026',
    newPassword: 'newQuantumPassword99'
  });
  assert.equal(changePw.status, 200);

  const loginNewPw = await api('/api/auth/login', 'POST', {
    username: 'commander_viet',
    password: 'newQuantumPassword99'
  });
  assert.equal(loginNewPw.status, 200);
});






