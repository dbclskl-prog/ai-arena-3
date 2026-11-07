import crypto from 'node:crypto';
import { evaluateSpeedWarExecution } from '../shared/constants.mjs';
import { executeAtomicTransfer, runInTransaction, writeAuditLog } from '../database/db.mjs';

/**
 * RFC 6455 Native WebSocket Server + Server-Authoritative Multiplayer Engine
 * Supports:
 * - World Room 3D Position & Animation Sync (2-20+ players)
 * - Lobby / Private Room / Matchmaking / Ready Check / Team Management
 * - Safe-Mode Filtered Room Chat (Protects Under-18 Players)
 * - 3-Round AI Speed War Engine (Server-Authoritative Scoring & Rewards)
 * - Reconnect & Player Presence
 */

const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function encodeWsFrame(payloadObj) {
  const str = typeof payloadObj === 'string' ? payloadObj : JSON.stringify(payloadObj);
  const payload = Buffer.from(str, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + Text frame
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function decodeWsFrames(buffer) {
  const messages = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const byte1 = buffer[offset];
    const byte2 = buffer[offset + 1];
    const opcode = byte1 & 0x0f;
    const isMasked = (byte2 & 0x80) !== 0;
    let payloadLen = byte2 & 0x7f;
    let headerLen = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      payloadLen = Number(buffer.readBigUInt64BE(offset + 2));
      headerLen = 10;
    }

    const maskLen = isMasked ? 4 : 0;
    const frameTotal = headerLen + maskLen + payloadLen;
    if (offset + frameTotal > buffer.length) break;

    if (opcode === 0x8) {
      messages.push({ type: 'CLOSE' });
      offset += frameTotal;
      continue;
    }

    if (opcode === 0x9) {
      messages.push({ type: 'PING' });
      offset += frameTotal;
      continue;
    }

    const payloadStart = offset + headerLen + maskLen;
    const payload = Buffer.alloc(payloadLen);
    if (isMasked) {
      const mask = buffer.subarray(offset + headerLen, offset + headerLen + 4);
      for (let i = 0; i < payloadLen; i++) {
        payload[i] = buffer[payloadStart + i] ^ mask[i % 4];
      }
    } else {
      buffer.copy(payload, 0, payloadStart, payloadStart + payloadLen);
    }

    if (opcode === 0x1) {
      messages.push({ type: 'TEXT', data: payload.toString('utf8') });
    }
    offset += frameTotal;
  }

  return { messages, remaining: buffer.subarray(offset) };
}

function sanitizeSafeChat(text) {
  let clean = String(text || '').slice(0, 280);
  // Mask phone numbers / emails / bad words for under-18 protection
  clean = clean.replace(/\b\d{9,11}\b/g, '[SĐT ĐÃ ẨN]');
  clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL ĐÃ ẨN]');
  clean = clean.replace(/\b(hack|cheat|lừa đảo|scam|ngu)\b/gi, '***');
  return clean;
}

/**
 * Execute a full 3-Round Server-Authoritative AI Speed War Match
 */
export function runSpeedWarMatchOnServer(db, { roomId, playerConfigs = [] }) {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) throw new Error('ROOM_NOT_FOUND');

  const roomPlayers = db.prepare(`
    SELECT rp.*, u.display_name, u.username
    FROM room_players rp
    JOIN users u ON u.id = rp.user_id
    WHERE rp.room_id = ?
  `).all(roomId);

  if (roomPlayers.length === 0) {
    throw new Error('NO_PLAYERS_IN_ROOM');
  }

  // Ensure at least 2 competitors (if solo player in room, pair with arena defender AI)
  const competitors = [...roomPlayers];
  if (competitors.length === 1) {
    const rivalUser = db.prepare(`SELECT * FROM users WHERE id != ? LIMIT 1`).get(competitors[0].user_id);
    if (rivalUser) {
      const rivalAgent = db.prepare(`SELECT * FROM ai_agents WHERE owner_id = ? LIMIT 1`).get(rivalUser.id);
      competitors.push({
        user_id: rivalUser.id,
        display_name: rivalUser.display_name,
        team: 'OMEGA',
        selected_agent_id: rivalAgent ? rivalAgent.id : 'agt_nova'
      });
    }
  }

  // Load 3 Speed War round contracts
  const roundContracts = db.prepare(`
    SELECT * FROM contracts
    WHERE id IN ('ctr_sw_r1', 'ctr_sw_r2', 'ctr_sw_r3')
    ORDER BY id ASC
  `).all();

  const matchId = `mtc_${crypto.randomUUID()}`;

  return runInTransaction(db, () => {
    db.prepare(`UPDATE rooms SET status = 'IN_MATCH' WHERE id = ?`).run(roomId);

    const playerTotals = new Map();
    const roundsReport = [];

    for (let rIdx = 0; rIdx < roundContracts.length; rIdx++) {
      const contract = roundContracts[rIdx];
      const roundNumber = rIdx + 1;
      const roundEntries = [];

      for (const comp of competitors) {
        const customCfg = playerConfigs.find(c => c.userId === comp.user_id) || {};
        const agentId = customCfg.agentId || comp.selected_agent_id;
        let agent = agentId
          ? db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(agentId)
          : db.prepare('SELECT * FROM ai_agents WHERE owner_id = ? LIMIT 1').get(comp.user_id);

        if (!agent) {
          agent = db.prepare('SELECT * FROM ai_agents LIMIT 1').get();
        }

        const strategy = customCfg.strategy || (roundNumber === 1 ? 'SPEED_FOCUS' : roundNumber === 2 ? 'QUALITY_FIRST' : 'COLLABORATIVE');
        const bidAmount = customCfg.bidAmount
          ? Math.max(50, Math.min(contract.budget_token * 1.5, Number(customCfg.bidAmount)))
          : contract.budget_token;

        // Check if agent has a trusted partner for round 3 synergy
        const rel = db.prepare(`
          SELECT * FROM ai_relationships
          WHERE (agent_a_id = ? OR agent_b_id = ?) AND status = 'ACCEPTED'
          ORDER BY trust_score DESC LIMIT 1
        `).get(agent.id, agent.id);

        let partnerAgent = null;
        if (rel) {
          const partnerId = rel.agent_a_id === agent.id ? rel.agent_b_id : rel.agent_a_id;
          partnerAgent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(partnerId);
        }

        const scoreBreakdown = evaluateSpeedWarExecution({
          agent,
          contract,
          strategy,
          partnerAgent,
          bidAmount
        });

        const execId = `exe_${crypto.randomUUID()}`;
        db.prepare(`
          INSERT INTO task_executions (
            id, contract_id, agent_id, partner_agent_id, match_id, strategy,
            quality_score, accuracy_score, speed_score, resource_efficiency, collaboration_score,
            total_score, reward_earned, xp_earned
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 35)
        `).run(
          execId, contract.id, agent.id, partnerAgent ? partnerAgent.id : null, matchId, strategy,
          scoreBreakdown.quality, scoreBreakdown.accuracy, scoreBreakdown.speed,
          scoreBreakdown.resourceEfficiency, scoreBreakdown.collaboration, scoreBreakdown.totalScore
        );

        const prev = playerTotals.get(comp.user_id) || {
          userId: comp.user_id,
          displayName: comp.display_name,
          agentId: agent.id,
          agentName: agent.name,
          agentClass: agent.ai_class,
          team: comp.team || 'ALPHA',
          totalScore: 0,
          roundScores: []
        };

        prev.totalScore = Number((prev.totalScore + scoreBreakdown.totalScore).toFixed(2));
        prev.roundScores.push({
          round: roundNumber,
          contractTitle: contract.title,
          strategy,
          bidAmount,
          ...scoreBreakdown
        });
        playerTotals.set(comp.user_id, prev);

        roundEntries.push({
          userId: comp.user_id,
          displayName: comp.display_name,
          agentName: agent.name,
          strategy,
          ...scoreBreakdown
        });
      }

      roundsReport.push({
        round: roundNumber,
        contractId: contract.id,
        contractTitle: contract.title,
        specialty: contract.specialty,
        budgetToken: contract.budget_token,
        entries: roundEntries.sort((a, b) => b.totalScore - a.totalScore)
      });
    }

    // Sort final standings by totalScore descending
    const standings = Array.from(playerTotals.values()).sort((a, b) => b.totalScore - a.totalScore);
    const winner = standings[0];

    // Distribute Token rewards & XP atomically from REWARD_TREASURY
    standings.forEach((st, idx) => {
      const rank = idx + 1;
      const tokenReward = rank === 1 ? 250 : rank === 2 ? 140 : 80;
      const xpGain = rank === 1 ? 120 : 70;
      const ratingDelta = rank === 1 ? 28 : idx === standings.length - 1 ? -10 : 8;

      st.rank = rank;
      st.tokenReward = tokenReward;
      st.xpGain = xpGain;
      st.ratingDelta = ratingDelta;

      const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(st.userId);
      if (userWallet) {
        executeAtomicTransfer(db, {
          idempotencyKey: `match_reward_${matchId}_${st.userId}`,
          fromWalletId: 'wal_system_reward',
          toWalletId: userWallet.id,
          amount: tokenReward,
          txType: 'SPEED_WAR_REWARD',
          referenceId: matchId,
          note: `Thưởng hạng #${rank} đấu trường AI Speed War`,
          actorId: 'SYSTEM',
          actorType: 'SYSTEM'
        });
      }

      // Update AI Agent XP & Level
      const ag = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(st.agentId);
      if (ag) {
        const newXp = ag.xp + xpGain;
        const newLevel = Math.max(ag.level, 1 + Math.floor(newXp / 200));
        db.prepare(`
          UPDATE ai_agents
          SET xp = ?, level = ?, reputation = reputation + ?,
              logic = MIN(150, logic + 1), speed = MIN(150, speed + 1)
          WHERE id = ?
        `).run(newXp, newLevel, rank === 1 ? 5 : 2, ag.id);
      }

      // Update Character XP & Ranking
      db.prepare(`UPDATE characters SET xp = xp + ?, level = MAX(level, 1 + CAST((xp + ?) / 300 AS INTEGER)) WHERE user_id = ?`)
        .run(xpGain, xpGain, st.userId);

      db.prepare(`
        UPDATE rankings
        SET rating_points = MAX(100, rating_points + ?),
            matches_played = matches_played + 1,
            matches_won = matches_won + ?,
            total_tokens_won = total_tokens_won + ?,
            updated_at = datetime('now')
        WHERE user_id = ?
      `).run(ratingDelta, rank === 1 ? 1 : 0, tokenReward, st.userId);
    });

    const matchResultsPayload = {
      matchId,
      roomId,
      winnerUserId: winner.userId,
      winnerName: winner.displayName,
      standings,
      rounds: roundsReport
    };

    db.prepare(`
      INSERT INTO matches (id, room_id, game_mode, status, current_round, total_rounds, winner_user_id, results_json, ended_at)
      VALUES (?, ?, 'SPEED_WAR', 'COMPLETED', 3, 3, ?, ?, datetime('now'))
    `).run(matchId, roomId, winner.userId, JSON.stringify(matchResultsPayload));

    db.prepare(`UPDATE rooms SET status = 'WAITING' WHERE id = ?`).run(roomId);

    return matchResultsPayload;
  });
}

export function attachMultiplayerWsServer(httpServer, db) {
  const clients = new Map(); // clientId -> { socket, userId, username, displayName, roomId, zone, x, y, z, rotY, animState, color }

  function broadcast(payload, filterFn = null) {
    const frame = encodeWsFrame(payload);
    for (const client of clients.values()) {
      if (client.socket.destroyed) continue;
      if (filterFn && !filterFn(client)) continue;
      try {
        client.socket.write(frame);
      } catch (_) {}
    }
  }

  function getWorldPresenceSnapshot() {
    const dbChars = db.prepare(`
      SELECT c.*, u.display_name, u.title, u.role
      FROM characters c
      JOIN users u ON u.id = c.user_id
    `).all();

    const onlineUserIds = new Set();
    for (const c of clients.values()) {
      if (c.userId) onlineUserIds.add(c.userId);
    }

    return dbChars.map(ch => ({
      userId: ch.user_id,
      name: ch.display_name || ch.name,
      title: ch.title,
      zone: ch.zone,
      x: ch.pos_x,
      y: ch.pos_y,
      z: ch.pos_z,
      rotY: ch.rot_y,
      animState: ch.anim_state,
      primaryColor: ch.primary_color,
      accentColor: ch.accent_color,
      online: onlineUserIds.has(ch.user_id)
    }));
  }

  httpServer.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const accept = crypto.createHash('sha1').update(key + WS_MAGIC).digest('base64');
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    const clientId = `ws_${crypto.randomUUID()}`;
    const clientState = {
      id: clientId,
      socket,
      userId: null,
      displayName: 'Guest',
      roomId: 'room_alpha_1',
      zone: 'CENTRAL_HUB',
      x: 0,
      y: 0,
      z: 0,
      rotY: 0,
      animState: 'IDLE',
      primaryColor: '#00e5ff'
    };
    clients.set(clientId, clientState);

    let recvBuffer = Buffer.alloc(0);

    // Send initial welcome & world snapshot
    socket.write(encodeWsFrame({
      type: 'WELCOME',
      clientId,
      worldPlayers: getWorldPresenceSnapshot()
    }));

    socket.on('data', (chunk) => {
      recvBuffer = Buffer.concat([recvBuffer, chunk]);
      const { messages, remaining } = decodeWsFrames(recvBuffer);
      recvBuffer = remaining;

      for (const msg of messages) {
        if (msg.type === 'CLOSE') {
          socket.end();
          return;
        }
        if (msg.type === 'PING') {
          const pong = Buffer.from([0x8a, 0x00]);
          socket.write(pong);
          continue;
        }
        if (msg.type === 'TEXT') {
          try {
            const data = JSON.parse(msg.data);
            handleWsMessage(clientState, data);
          } catch (err) {
            socket.write(encodeWsFrame({ type: 'ERROR', error: err.message }));
          }
        }
      }
    });

    socket.on('close', () => {
      clients.delete(clientId);
      broadcast({
        type: 'PLAYER_PRESENCE',
        worldPlayers: getWorldPresenceSnapshot()
      });
    });

    socket.on('error', () => {
      clients.delete(clientId);
    });
  });

  function handleWsMessage(client, msg) {
    // 1. Server-Authoritative Anti-Cheat Guard: Reject direct client writes of tokens/scores
    if (msg.type === 'CLIENT_SET_TOKEN' || msg.type === 'CLIENT_SET_SCORE' || msg.type === 'FORCE_WIN') {
      writeAuditLog(db, {
        actorId: client.userId || client.id,
        actorType: 'USER',
        action: 'WS_CHEAT_ATTEMPT_BLOCKED',
        details: msg,
        severity: 'CRITICAL'
      });
      client.socket.write(encodeWsFrame({
        type: 'SECURITY_VIOLATION',
        error: 'SERVER_AUTHORITATIVE_VIOLATION: Client không có quyền tự ghi số dư Token hoặc điểm số!'
      }));
      return;
    }

    if (msg.type === 'AUTH_HELLO' || msg.type === 'RECONNECT') {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(msg.userId);
      if (user) {
        client.userId = user.id;
        client.displayName = user.display_name;
        const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(user.id);
        if (char) {
          client.zone = char.zone;
          client.x = char.pos_x;
          client.y = char.pos_y;
          client.z = char.pos_z;
          client.rotY = char.rot_y;
          client.animState = char.anim_state;
          client.primaryColor = char.primary_color;
        }
      }
      broadcast({
        type: 'PLAYER_PRESENCE',
        worldPlayers: getWorldPresenceSnapshot()
      });
      return;
    }

    if (msg.type === 'MOVE_3D') {
      // Clamp coordinates to valid 3D world bounds (-120 to +120)
      const x = Math.max(-120, Math.min(120, Number(msg.x) || 0));
      const y = Math.max(0, Math.min(20, Number(msg.y) || 0));
      const z = Math.max(-120, Math.min(120, Number(msg.z) || 0));
      const rotY = Number(msg.rotY) || 0;
      const zone = String(msg.zone || client.zone || 'CENTRAL_HUB');
      const animState = ['IDLE', 'WALK', 'RUN', 'INTERACT'].includes(msg.animState) ? msg.animState : 'WALK';

      client.x = x;
      client.y = y;
      client.z = z;
      client.rotY = rotY;
      client.zone = zone;
      client.animState = animState;

      if (client.userId) {
        db.prepare(`
          UPDATE characters
          SET pos_x = ?, pos_y = ?, pos_z = ?, rot_y = ?, zone = ?, anim_state = ?, updated_at = datetime('now')
          WHERE user_id = ?
        `).run(x, y, z, rotY, zone, animState, client.userId);
      }

      broadcast({
        type: 'PLAYER_MOVED',
        userId: client.userId || client.id,
        name: client.displayName,
        x,
        y,
        z,
        rotY,
        zone,
        animState,
        primaryColor: client.primaryColor
      });
      return;
    }

    if (msg.type === 'ROOM_CHAT') {
      const cleanMessage = sanitizeSafeChat(msg.message);
      if (!cleanMessage.trim()) return;
      broadcast({
        type: 'ROOM_CHAT_MSG',
        roomId: msg.roomId || client.roomId || 'WORLD',
        userId: client.userId || client.id,
        senderName: client.displayName,
        message: cleanMessage,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (msg.type === 'READY_CHECK') {
      if (!client.userId || !msg.roomId) return;
      const isReady = msg.isReady ? 1 : 0;
      db.prepare(`
        UPDATE room_players
        SET is_ready = ?, team = COALESCE(?, team), selected_agent_id = COALESCE(?, selected_agent_id)
        WHERE room_id = ? AND user_id = ?
      `).run(isReady, msg.team || null, msg.agentId || null, msg.roomId, client.userId);

      const players = db.prepare(`
        SELECT rp.*, u.display_name
        FROM room_players rp
        JOIN users u ON u.id = rp.user_id
        WHERE rp.room_id = ?
      `).all(msg.roomId);

      broadcast({
        type: 'ROOM_STATE_SYNC',
        roomId: msg.roomId,
        players
      });
      return;
    }

    if (msg.type === 'START_SPEED_WAR') {
      const roomId = msg.roomId || 'room_alpha_1';
      const result = runSpeedWarMatchOnServer(db, {
        roomId,
        playerConfigs: msg.playerConfigs || []
      });
      broadcast({
        type: 'MATCH_RESULTS',
        roomId,
        result
      });
    }
  }

  return { broadcast, getWorldPresenceSnapshot };
}
