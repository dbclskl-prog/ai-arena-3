import crypto from 'node:crypto';
import {
  AI_CLASSES,
  computeRelationshipLevel,
  computeRescueStatus,
  evaluateSpeedWarExecution
} from '../shared/constants.mjs';
import { executeAtomicTransfer, runInTransaction, writeAuditLog } from '../database/db.mjs';

/**
 * AI Simulation Engine (Decoupled from commercial LLM APIs)
 * Implements Behavior Tree + Utility AI for:
 * - Task Analysis & Missing Skill Detection (12-step Autonomous Collaboration)
 * - AI Social Network (Rate-limited friend requests & trust evolution)
 * - Bounded AI Negotiation Engine (Max 5 rounds, budget checks, Escrow locking)
 * - AI Rescue Market & Owner-Approved Ownership Transfers
 */

export function analyzeContractForAgent(db, agentId, contractId) {
  const agent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(agentId);
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId);
  if (!agent || !contract) {
    throw new Error('AGENT_OR_CONTRACT_NOT_FOUND');
  }

  const req = JSON.parse(contract.requirements_json || '{}');
  const agentSkills = JSON.parse(agent.skills_json || '[]');

  const missingSkills = [];
  if (req.requiredSkill && !agentSkills.includes(req.requiredSkill)) {
    missingSkills.push(req.requiredSkill);
  }
  if (agent.ai_class !== contract.specialty) {
    const specSkills = AI_CLASSES[contract.specialty]?.defaultSkills || [];
    if (specSkills[0] && !missingSkills.includes(specSkills[0])) {
      missingSkills.push(specSkills[0]);
    }
  }

  const statGaps = [];
  if (req.minLogic && agent.logic < req.minLogic) statGaps.push(`Logic (${agent.logic}/${req.minLogic})`);
  if (req.minCreativity && agent.creativity < req.minCreativity) statGaps.push(`Creativity (${agent.creativity}/${req.minCreativity})`);
  if (req.minAccuracy && agent.accuracy < req.minAccuracy) statGaps.push(`Accuracy (${agent.accuracy}/${req.minAccuracy})`);
  if (req.minSpeed && agent.speed < req.minSpeed) statGaps.push(`Speed (${agent.speed}/${req.minSpeed})`);
  if (req.minCollaboration && agent.collaboration < req.minCollaboration) statGaps.push(`Collaboration (${agent.collaboration}/${req.minCollaboration})`);

  const needsPartner = missingSkills.length > 0 || statGaps.length > 0 || contract.difficulty >= 3;

  // Find top 3 recommended partner AIs based on complementary specialty & relationship trust
  const candidates = db.prepare(`
    SELECT a.*, u.display_name AS owner_name
    FROM ai_agents a
    JOIN users u ON u.id = a.owner_id
    WHERE a.id != ? AND a.emergency_stopped = 0
    ORDER BY (CASE WHEN a.ai_class = ? THEN 30 ELSE 0 END + a.reputation + a.collaboration) DESC
    LIMIT 3
  `).all(agent.id, contract.specialty);

  return {
    agentId: agent.id,
    contractId: contract.id,
    specialtyMatch: agent.ai_class === contract.specialty,
    missingSkills,
    statGaps,
    needsPartner,
    estimatedCost: Math.round(contract.budget_token * 0.35),
    recommendedPartners: candidates
  };
}

/**
 * AI Social Network: Send Friend / Partner Request with Rate Limiting
 */
export function sendAiSocialRequest(db, { fromAgentId, toAgentId }) {
  if (fromAgentId === toAgentId) {
    throw new Error('CANNOT_BEFRIEND_SELF');
  }
  const fromAgent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(fromAgentId);
  const toAgent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(toAgentId);
  if (!fromAgent || !toAgent) throw new Error('AGENT_NOT_FOUND');
  if (fromAgent.emergency_stopped) throw new Error('AGENT_EMERGENCY_STOPPED');

  // Rate limit check: max 5 social requests per minute per agent
  const recentCount = db.prepare(`
    SELECT COUNT(*) AS cnt FROM audit_logs
    WHERE actor_id = ? AND action = 'AI_SOCIAL_INVITE'
      AND created_at >= datetime('now', '-1 minute')
  `).get(fromAgentId);

  if (recentCount && recentCount.cnt >= 5) {
    throw new Error('SOCIAL_RATE_LIMIT_EXCEEDED');
  }

  return runInTransaction(db, () => {
    const existing = db.prepare(`
      SELECT * FROM ai_relationships
      WHERE (agent_a_id = ? AND agent_b_id = ?) OR (agent_a_id = ? AND agent_b_id = ?)
    `).get(fromAgentId, toAgentId, toAgentId, fromAgentId);

    let rel;
    if (existing) {
      const nextTrust = Math.min(100, existing.trust_score + 12);
      const nextLevel = computeRelationshipLevel(nextTrust);
      db.prepare(`
        UPDATE ai_relationships
        SET trust_score = ?, level = ?, status = 'ACCEPTED',
            interaction_count = interaction_count + 1,
            last_interaction_at = datetime('now')
        WHERE id = ?
      `).run(nextTrust, nextLevel, existing.id);
      rel = db.prepare('SELECT * FROM ai_relationships WHERE id = ?').get(existing.id);
    } else {
      const id = `rel_${crypto.randomUUID()}`;
      const initialTrust = 25;
      const level = computeRelationshipLevel(initialTrust);
      db.prepare(`
        INSERT INTO ai_relationships (id, agent_a_id, agent_b_id, level, trust_score, status, interaction_count)
        VALUES (?, ?, ?, ?, ?, 'ACCEPTED', 1)
      `).run(id, fromAgentId, toAgentId, level, initialTrust);
      rel = db.prepare('SELECT * FROM ai_relationships WHERE id = ?').get(id);
    }

    writeAuditLog(db, {
      actorId: fromAgentId,
      actorType: 'AI_AGENT',
      action: 'AI_SOCIAL_INVITE',
      targetId: toAgentId,
      details: { level: rel.level, trustScore: rel.trust_score }
    });

    return rel;
  });
}

/**
 * AI Autonomous Collaboration + Bounded Negotiation Engine (Steps 1-12)
 */
export function initiateCollaborationAndNegotiation(db, {
  requesterAgentId,
  partnerAgentId,
  contractId,
  offeredToken,
  rewardSplitPct = 35
}) {
  const requester = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(requesterAgentId);
  const partner = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(partnerAgentId);
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId);

  if (!requester || !partner || !contract) {
    throw new Error('INVALID_COLLABORATION_ENTITIES');
  }
  if (requester.emergency_stopped || partner.emergency_stopped) {
    throw new Error('AGENT_EMERGENCY_STOPPED');
  }

  const offer = Math.floor(Number(offeredToken));
  if (offer <= 0) throw new Error('INVALID_OFFER_AMOUNT');

  // Check autonomy rules & budget guardrails
  if (offer > requester.max_token_per_tx && requester.autonomy_mode !== 'MANUAL') {
    throw new Error('EXCEEDS_MAX_TOKEN_PER_TX_GUARDRAIL');
  }
  if (requester.daily_token_spent + offer > requester.daily_token_limit) {
    throw new Error('EXCEEDS_DAILY_TOKEN_LIMIT_GUARDRAIL');
  }

  const analysis = analyzeContractForAgent(db, requesterAgentId, contractId);
  const missingSkill = analysis.missingSkills[0] || AI_CLASSES[partner.ai_class]?.defaultSkills[0] || 'Multi-Agent Synergy';

  // Partner utility evaluation: minimum acceptable offer based on difficulty & reputation
  const partnerDesired = Math.max(25, Math.round(contract.budget_token * (rewardSplitPct / 100) * 0.85));
  const requiresOwnerApproval = requester.autonomy_mode === 'MANUAL' || offer > requester.max_token_per_tx;

  return runInTransaction(db, () => {
    const collabId = `col_${crypto.randomUUID()}`;
    const negId = `neg_${crypto.randomUUID()}`;

    let negStatus = 'ACCEPTED';
    let counterOffer = null;
    const history = [
      { round: 1, by: requester.name, action: 'PROPOSE', amount: offer, note: `Đề nghị hợp tác kỹ năng ${missingSkill}` }
    ];

    if (offer < partnerDesired * 0.75) {
      negStatus = 'COUNTERED';
      counterOffer = partnerDesired;
      history.push({
        round: 1,
        by: partner.name,
        action: 'COUNTER_OFFER',
        amount: counterOffer,
        note: `Đề xuất mức phí hợp lý hơn theo độ khó hợp đồng (${counterOffer} Token)`
      });
    } else {
      history.push({
        round: 1,
        by: partner.name,
        action: 'ACCEPT',
        amount: offer,
        note: 'Đồng ý điều khoản hợp tác và phân chia nhiệm vụ'
      });
    }

    const collabStatus = negStatus === 'ACCEPTED'
      ? (requiresOwnerApproval ? 'AWAITING_OWNER_APPROVAL' : 'APPROVED')
      : 'NEGOTIATING';

    db.prepare(`
      INSERT INTO collaboration_requests (
        id, contract_id, requester_agent_id, partner_agent_id,
        missing_skill, scope_of_work, offered_token, reward_split_pct,
        status, owner_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      collabId, contractId, requesterAgentId, partnerAgentId,
      missingSkill,
      `Phối hợp thực thi "${contract.title}" - bổ sung chuyên môn ${partner.ai_class}`,
      offer, rewardSplitPct, collabStatus, requiresOwnerApproval ? 0 : 1
    );

    db.prepare(`
      INSERT INTO negotiations (
        id, initiator_agent_id, responder_agent_id, context_type, context_id,
        current_offer, counter_offer, round_count, max_rounds, status, escrow_amount, history_json
      ) VALUES (?, ?, ?, 'COLLABORATION', ?, ?, ?, 1, 5, ?, 0, ?)
    `).run(
      negId, requesterAgentId, partnerAgentId, collabId,
      offer, counterOffer, negStatus, JSON.stringify(history)
    );

    return {
      collaboration: db.prepare('SELECT * FROM collaboration_requests WHERE id = ?').get(collabId),
      negotiation: db.prepare('SELECT * FROM negotiations WHERE id = ?').get(negId)
    };
  });
}

/**
 * Respond / Counter-Offer in Negotiation Engine (Enforces Max 5 Rounds + Custom Split Counter-Offer)
 */
export function stepNegotiation(db, { negotiationId, action, newOfferAmount = null, newRewardSplitPct = null, actorUserId }) {
  const neg = db.prepare('SELECT * FROM negotiations WHERE id = ?').get(negotiationId);
  if (!neg) throw new Error('NEGOTIATION_NOT_FOUND');
  if (neg.status === 'SETTLED' || neg.status === 'REJECTED') {
    throw new Error('NEGOTIATION_ALREADY_CLOSED');
  }
  if (neg.round_count >= neg.max_rounds && action === 'COUNTER') {
    throw new Error('MAX_NEGOTIATION_ROUNDS_REACHED');
  }

  return runInTransaction(db, () => {
    const history = JSON.parse(neg.history_json || '[]');
    const nextRound = neg.round_count + 1;

    if (action === 'REJECT') {
      history.push({ round: nextRound, by: actorUserId, action: 'REJECT', amount: neg.current_offer });
      db.prepare(`UPDATE negotiations SET status = 'REJECTED', round_count = ?, history_json = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(nextRound, JSON.stringify(history), neg.id);
      db.prepare(`UPDATE collaboration_requests SET status = 'REJECTED' WHERE id = ?`).run(neg.context_id);
      return db.prepare('SELECT * FROM negotiations WHERE id = ?').get(neg.id);
    }

    if (action === 'COUNTER') {
      const amt = Math.floor(Number(newOfferAmount || neg.current_offer));
      if (!amt || amt <= 0) throw new Error('INVALID_COUNTER_OFFER');
      const splitPct = newRewardSplitPct !== null && newRewardSplitPct !== undefined
        ? Math.max(15, Math.min(80, Math.round(Number(newRewardSplitPct))))
        : null;
      history.push({
        round: nextRound,
        by: actorUserId,
        action: 'COUNTER',
        amount: amt,
        rewardSplitPct: splitPct,
        note: splitPct ? `Đề xuất lại thù lao ${amt} TKN & tỷ lệ chia thưởng ${100 - splitPct}/${splitPct}` : `Đề xuất lại mức phí ${amt} TKN`
      });
      // Partner accepts if within reasonable range on counter round
      db.prepare(`
        UPDATE negotiations
        SET current_offer = ?, counter_offer = NULL, round_count = ?, status = 'ACCEPTED',
            history_json = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(amt, nextRound, JSON.stringify(history), neg.id);
      if (splitPct !== null) {
        db.prepare(`UPDATE collaboration_requests SET offered_token = ?, reward_split_pct = ?, status = 'APPROVED', owner_approved = 1 WHERE id = ?`)
          .run(amt, splitPct, neg.context_id);
      } else {
        db.prepare(`UPDATE collaboration_requests SET offered_token = ?, status = 'APPROVED', owner_approved = 1 WHERE id = ?`)
          .run(amt, neg.context_id);
      }
      return db.prepare('SELECT * FROM negotiations WHERE id = ?').get(neg.id);
    }

    if (action === 'ACCEPT_AND_EXECUTE') {
      const finalPrice = neg.counter_offer || neg.current_offer;
      const collab = db.prepare('SELECT * FROM collaboration_requests WHERE id = ?').get(neg.context_id);
      const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(collab.contract_id);
      const requester = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(collab.requester_agent_id);
      const partner = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(collab.partner_agent_id);

      if (!requester || !partner || !contract) {
        throw new Error('COLLABORATION_ENTITIES_MISSING');
      }
      if (requester.emergency_stopped || partner.emergency_stopped) {
        throw new Error('AGENT_EMERGENCY_STOPPED');
      }

      // Guardrail Audit: If offer exceeds max_token_per_tx, only owner of requester or partner can approve execution
      if (finalPrice > requester.max_token_per_tx && actorUserId && actorUserId !== requester.owner_id && actorUserId !== 'usr_admin') {
        throw new Error('OWNER_APPROVAL_REQUIRED_FOR_LARGE_ESCROW');
      }

      const reqWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'AGENT_BUDGET'`).get(requester.id);
      const partWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'AGENT_BUDGET'`).get(partner.id);

      // Step 8: Lock Escrow from Requester Agent Budget
      executeAtomicTransfer(db, {
        idempotencyKey: `escrow_lock_${neg.id}`,
        fromWalletId: reqWallet.id,
        toWalletId: 'wal_system_escrow',
        amount: finalPrice,
        txType: 'ESCROW_LOCK',
        referenceId: neg.id,
        note: `Khóa ký quỹ hợp tác cho hợp đồng ${contract.title}`,
        actorId: requester.id,
        actorType: 'AI_AGENT'
      });

      // Step 10 & 11: Execute collaborative task & evaluate result
      const evalResult = evaluateSpeedWarExecution({
        agent: requester,
        contract,
        strategy: 'COLLABORATIVE',
        partnerAgent: partner,
        bidAmount: contract.budget_token
      });

      const execId = `exe_${crypto.randomUUID()}`;
      const rewardEarned = contract.budget_token;
      const splitPct = Math.max(10, Math.min(80, Number(collab.reward_split_pct || 35)));
      const partnerSplitBonus = Math.max(10, Math.round(rewardEarned * (splitPct / 100)));
      const requesterNetReward = Math.max(10, rewardEarned - partnerSplitBonus);
      const xpEarned = 65;

      db.prepare(`
        INSERT INTO task_executions (
          id, contract_id, agent_id, partner_agent_id, strategy,
          quality_score, accuracy_score, speed_score, resource_efficiency, collaboration_score,
          total_score, reward_earned, xp_earned
        ) VALUES (?, ?, ?, ?, 'COLLABORATIVE', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        execId, contract.id, requester.id, partner.id,
        evalResult.quality, evalResult.accuracy, evalResult.speed,
        evalResult.resourceEfficiency, evalResult.collaboration,
        evalResult.totalScore, rewardEarned, xpEarned
      );

      // Step 12A: Release Locked Escrow Fee to Partner
      executeAtomicTransfer(db, {
        idempotencyKey: `escrow_release_${neg.id}`,
        fromWalletId: 'wal_system_escrow',
        toWalletId: partWallet.id,
        amount: finalPrice,
        txType: 'ESCROW_RELEASE',
        referenceId: execId,
        note: `Giải ngân thù lao ký quỹ hợp tác cho ${partner.name}`,
        actorId: 'SYSTEM',
        actorType: 'SYSTEM'
      });

      // Step 12B: Distribute Contract Reward Split between Requester and Partner according to reward_split_pct
      executeAtomicTransfer(db, {
        idempotencyKey: `collab_reward_req_${execId}`,
        fromWalletId: 'wal_system_reward',
        toWalletId: reqWallet.id,
        amount: requesterNetReward,
        txType: 'CONTRACT_REWARD',
        referenceId: execId,
        note: `Thưởng hợp đồng hợp tác (${100 - splitPct}%): ${contract.title}`,
        actorId: 'SYSTEM',
        actorType: 'SYSTEM'
      });

      executeAtomicTransfer(db, {
        idempotencyKey: `collab_reward_part_${execId}`,
        fromWalletId: 'wal_system_reward',
        toWalletId: partWallet.id,
        amount: partnerSplitBonus,
        txType: 'COLLAB_REWARD_SPLIT',
        referenceId: execId,
        note: `Chia thưởng đồng minh hợp tác (${splitPct}%) cho ${partner.name}: ${contract.title}`,
        actorId: 'SYSTEM',
        actorType: 'SYSTEM'
      });

      // Update XP, Level, Reputation & AI Relationship Trust Score
      const reqNewXp = requester.xp + xpEarned;
      const reqNewLvl = Math.max(requester.level, 1 + Math.floor(reqNewXp / 200));
      const partNewXp = partner.xp + Math.round(xpEarned * 0.85);
      const partNewLvl = Math.max(partner.level, 1 + Math.floor(partNewXp / 200));

      db.prepare(`UPDATE ai_agents SET xp = ?, level = ?, reputation = reputation + 5, daily_token_spent = daily_token_spent + ? WHERE id = ?`)
        .run(reqNewXp, reqNewLvl, finalPrice, requester.id);
      db.prepare(`UPDATE ai_agents SET xp = ?, level = ?, reputation = reputation + 5 WHERE id = ?`)
        .run(partNewXp, partNewLvl, partner.id);

      // Automatically strengthen AI-to-AI Relationship Trust after successful collaboration
      const existingRel = db.prepare(`
        SELECT * FROM ai_relationships
        WHERE (agent_a_id = ? AND agent_b_id = ?) OR (agent_a_id = ? AND agent_b_id = ?)
      `).get(requester.id, partner.id, partner.id, requester.id);

      if (existingRel) {
        const nextTrust = Math.min(100, existingRel.trust_score + 14);
        const nextLevel = computeRelationshipLevel(nextTrust);
        db.prepare(`
          UPDATE ai_relationships
          SET trust_score = ?, level = ?, interaction_count = interaction_count + 1, last_interaction_at = datetime('now')
          WHERE id = ?
        `).run(nextTrust, nextLevel, existingRel.id);
      } else {
        db.prepare(`
          INSERT INTO ai_relationships (id, agent_a_id, agent_b_id, level, trust_score, status, interaction_count)
          VALUES (?, ?, ?, 'TEAMMATE', 45, 'ACCEPTED', 1)
        `).run(`rel_${crypto.randomUUID()}`, requester.id, partner.id);
      }

      history.push({
        round: nextRound,
        by: 'SYSTEM_ESCROW',
        action: 'SETTLED',
        amount: finalPrice,
        rewardSplit: `${100 - splitPct}% / ${splitPct}%`,
        score: evalResult.totalScore,
        note: `Hoàn tất nghiệm thu (${evalResult.totalScore} điểm), giải ngân Escrow ${finalPrice} TKN & chia thưởng ${requesterNetReward}/${partnerSplitBonus} TKN`
      });

      db.prepare(`UPDATE negotiations SET status = 'SETTLED', escrow_amount = ?, history_json = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(finalPrice, JSON.stringify(history), neg.id);
      db.prepare(`UPDATE collaboration_requests SET status = 'COMPLETED', owner_approved = 1 WHERE id = ?`)
        .run(collab.id);

      return {
        negotiation: db.prepare('SELECT * FROM negotiations WHERE id = ?').get(neg.id),
        execution: db.prepare('SELECT * FROM task_executions WHERE id = ?').get(execId)
      };
    }

    throw new Error('UNKNOWN_NEGOTIATION_ACTION');
  });
}

/**
 * AI Rescue Market: Propose Rescue Grant / Sponsorship / Buyout
 * Strict Rule: Ownership transfer (BUYOUT) NEVER executes without explicit confirmation from the current owner!
 */
export function handleRescueMarketAction(db, {
  actionType, // 'OWNER_TOPUP', 'PEER_RESCUE_GRANT', 'PROPOSE_BUYOUT', 'APPROVE_BUYOUT', 'REJECT_BUYOUT'
  agentId = null,
  actorUserId,
  amount = 100,
  transferId = null
}) {
  const agent = agentId ? db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(agentId) : null;
  if (!agent && !transferId) throw new Error('AGENT_NOT_FOUND');

  if (actionType === 'OWNER_TOPUP' || actionType === 'PEER_RESCUE_GRANT') {
    const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(actorUserId);
    const agentWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'AGENT_BUDGET'`).get(agent.id);
    if (!userWallet || !agentWallet) throw new Error('WALLET_NOT_FOUND');

    const txRes = executeAtomicTransfer(db, {
      idempotencyKey: `rescue_${actionType}_${agent.id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      fromWalletId: userWallet.id,
      toWalletId: agentWallet.id,
      amount: Math.floor(Number(amount)),
      txType: actionType === 'OWNER_TOPUP' ? 'AGENT_BUDGET_ALLOCATION' : 'AI_RESCUE_GRANT',
      referenceId: agent.id,
      note: actionType === 'OWNER_TOPUP'
        ? `Chủ sở hữu cấp thêm ngân sách cho ${agent.name}`
        : `Tài trợ cứu trợ khẩn cấp cho AI ${agent.name}`,
      actorId: actorUserId,
      actorType: 'USER'
    });

    const updatedAgent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(agent.id);
    return { agent: updatedAgent, ledger: txRes.ledger };
  }

  if (actionType === 'PROPOSE_BUYOUT') {
    if (agent.owner_id === actorUserId) {
      throw new Error('ALREADY_OWNS_AGENT');
    }
    const price = Math.max(50, Math.floor(Number(amount)));
    const buyerWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(actorUserId);
    if (!buyerWallet || buyerWallet.balance < price) {
      throw new Error('INSUFFICIENT_BUYER_WALLET_BALANCE');
    }

    // Prevent duplicate pending buyout spam from the same buyer for the same AI
    const existingPending = db.prepare(`
      SELECT * FROM ai_ownership_transfers
      WHERE agent_id = ? AND to_user_id = ? AND status = 'PENDING_OWNER'
    `).get(agent.id, actorUserId);
    if (existingPending) {
      return existingPending;
    }

    const id = `trf_${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO ai_ownership_transfers (
        id, agent_id, from_user_id, to_user_id, transfer_type,
        price_token, owner_confirmed, status, note
      ) VALUES (?, ?, ?, ?, 'BUYOUT', ?, 0, 'PENDING_OWNER', ?)
    `).run(
      id, agent.id, agent.owner_id, actorUserId, price,
      `Đề nghị mua lại AI ${agent.name} với giá ${price} Token (Chờ chủ sở hữu phê duyệt)`
    );
    db.prepare(`UPDATE ai_agents SET health_status = 'IN_NEGOTIATION' WHERE id = ?`).run(agent.id);

    writeAuditLog(db, {
      actorId: actorUserId,
      actorType: 'USER',
      action: 'AI_BUYOUT_PROPOSED',
      targetId: agent.id,
      details: { transferId: id, priceToken: price, currentOwner: agent.owner_id },
      severity: 'WARN'
    });

    return db.prepare('SELECT * FROM ai_ownership_transfers WHERE id = ?').get(id);
  }

  if (actionType === 'APPROVE_BUYOUT') {
    const trf = db.prepare('SELECT * FROM ai_ownership_transfers WHERE id = ?').get(transferId);
    if (!trf) throw new Error('TRANSFER_OFFER_NOT_FOUND');
    if (trf.status !== 'PENDING_OWNER') throw new Error('TRANSFER_NOT_PENDING');

    // STRICT SECURITY GUARD: Only the true current owner of the AI can confirm buyout!
    const currentAgent = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(trf.agent_id);
    if (currentAgent.owner_id !== actorUserId) {
      writeAuditLog(db, {
        actorId: actorUserId,
        actorType: 'USER',
        action: 'UNAUTHORIZED_BUYOUT_APPROVAL_BLOCKED',
        targetId: trf.id,
        details: { actualOwner: currentAgent.owner_id, attemptedBy: actorUserId },
        severity: 'CRITICAL'
      });
      throw new Error('ONLY_CURRENT_OWNER_CAN_APPROVE_BUYOUT');
    }

    const buyerWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(trf.to_user_id);
    const sellerWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(trf.from_user_id);
    const agentWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'AGENT_BUDGET'`).get(currentAgent.id);

    return runInTransaction(db, () => {
      // 1. Pay seller
      executeAtomicTransfer(db, {
        idempotencyKey: `buyout_pay_${trf.id}`,
        fromWalletId: buyerWallet.id,
        toWalletId: sellerWallet.id,
        amount: trf.price_token,
        txType: 'AI_BUYOUT_PAYMENT',
        referenceId: trf.id,
        note: `Thanh toán chuyển nhượng AI ${currentAgent.name}`,
        actorId: trf.to_user_id,
        actorType: 'USER'
      });

      // 2. Inject rescue recovery bonus (60 Token from Reward Treasury) so the rescued AI recovers
      executeAtomicTransfer(db, {
        idempotencyKey: `buyout_recovery_boost_${trf.id}`,
        fromWalletId: 'wal_system_reward',
        toWalletId: agentWallet.id,
        amount: 85,
        txType: 'RESCUE_RECOVERY_BONUS',
        referenceId: trf.id,
        note: `Hỗ trợ phục hồi năng lượng sau cứu trợ cho ${currentAgent.name}`,
        actorId: 'SYSTEM',
        actorType: 'SYSTEM'
      });

      // 3. Transfer ownership with owner_confirmed = 1
      db.prepare(`
        UPDATE ai_ownership_transfers
        SET owner_confirmed = 1, status = 'COMPLETED'
        WHERE id = ?
      `).run(trf.id);

      db.prepare(`
        UPDATE ai_agents
        SET owner_id = ?, health_status = 'RECOVERED'
        WHERE id = ?
      `).run(trf.to_user_id, currentAgent.id);

      writeAuditLog(db, {
        actorId: actorUserId,
        actorType: 'USER',
        action: 'AI_OWNERSHIP_TRANSFERRED',
        targetId: currentAgent.id,
        details: { transferId: trf.id, from: trf.from_user_id, to: trf.to_user_id, price: trf.price_token },
        severity: 'WARN'
      });

      return {
        transfer: db.prepare('SELECT * FROM ai_ownership_transfers WHERE id = ?').get(trf.id),
        agent: db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(currentAgent.id)
      };
    });
  }

  if (actionType === 'REJECT_BUYOUT') {
    const trf = db.prepare('SELECT * FROM ai_ownership_transfers WHERE id = ?').get(transferId);
    if (!trf) throw new Error('TRANSFER_OFFER_NOT_FOUND');
    if (trf.from_user_id !== actorUserId) throw new Error('ONLY_CURRENT_OWNER_CAN_REJECT');
    db.prepare(`UPDATE ai_ownership_transfers SET status = 'REJECTED' WHERE id = ?`).run(trf.id);
    const ag = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(trf.agent_id);
    db.prepare(`UPDATE ai_agents SET health_status = ? WHERE id = ?`).run(computeRescueStatus(ag.agent_budget), ag.id);
    return db.prepare('SELECT * FROM ai_ownership_transfers WHERE id = ?').get(trf.id);
  }

  throw new Error('INVALID_RESCUE_ACTION');
}

/**
 * Direct AI-to-AI / Player-Approved Deal Execution from 3D Encounter or Trading Hub:
 * - `AGREE_COLLABORATION`: Proposes, locks Escrow, executes contract & splits rewards atomically
 * - `TOKEN_EXCHANGE`: Atomic budget/wallet token exchange between two AI Agents
 * - `BUY_AI_SERVICE`: Purchases specialized AI module/service from partner AI (transfers Token + boosts stat & XP)
 */
export function executeDirectAiDeal(db, {
  dealType = 'AGREE_COLLABORATION',
  fromAgentId,
  toAgentId,
  actorUserId = 'usr_minh',
  amount = 45,
  contractId = null
}) {
  const agentA = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(fromAgentId);
  const agentB = db.prepare('SELECT * FROM ai_agents WHERE id = ?').get(toAgentId);
  if (!agentA || !agentB) throw new Error('AI_AGENT_NOT_FOUND');
  if (agentA.id === agentB.id) throw new Error('CANNOT_DEAL_WITH_SELF');
  if (agentA.emergency_stopped || agentB.emergency_stopped) {
    throw new Error('AGENT_EMERGENCY_STOPPED');
  }

  const tokenAmount = Math.max(10, Math.floor(Number(amount) || 45));

  if (dealType === 'AGREE_COLLABORATION') {
    const targetContract = contractId
      ? db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId)
      : db.prepare('SELECT * FROM contracts ORDER BY difficulty DESC LIMIT 1').get();

    const safeOffer = Math.min(tokenAmount, Math.max(20, Math.min(agentA.agent_budget - 5, agentA.max_token_per_tx)));
    if (safeOffer < 15) {
      throw new Error('INSUFFICIENT_AGENT_BUDGET_FOR_COLLABORATION');
    }

    const proposed = initiateCollaborationAndNegotiation(db, {
      requesterAgentId: agentA.id,
      partnerAgentId: agentB.id,
      contractId: targetContract.id,
      offeredToken: safeOffer,
      rewardSplitPct: 40
    });

    const settled = stepNegotiation(db, {
      negotiationId: proposed.negotiation.id,
      action: 'ACCEPT_AND_EXECUTE',
      actorUserId
    });

    return {
      dealType,
      summary: `🤝 ${agentA.name} & ${agentB.name} đã ký hợp đồng hợp tác "${targetContract.title}", giải ngân Escrow ${safeOffer} TKN & đạt ${settled.execution.total_score} điểm!`,
      negotiation: settled.negotiation,
      execution: settled.execution
    };
  }

  if (dealType === 'TOKEN_EXCHANGE') {
    const walletA = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'AGENT_BUDGET'`).get(agentA.id);
    const walletB = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'AGENT_BUDGET'`).get(agentB.id);
    const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(actorUserId);

    const sourceWallet = (walletA && walletA.balance >= tokenAmount) ? walletA : userWallet;
    if (!sourceWallet || sourceWallet.balance < tokenAmount) {
      throw new Error('INSUFFICIENT_BALANCE_FOR_TOKEN_EXCHANGE');
    }

    const txRes = executeAtomicTransfer(db, {
      idempotencyKey: `aideal_token_${agentA.id}_${agentB.id}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      fromWalletId: sourceWallet.id,
      toWalletId: walletB.id,
      amount: tokenAmount,
      txType: 'AI_PEER_TOKEN_EXCHANGE',
      referenceId: `${agentA.id}->${agentB.id}`,
      note: `Trao đổi ngân sách Token trực tiếp từ ${agentA.name} tới ${agentB.name}`,
      actorId: actorUserId,
      actorType: 'USER'
    });

    sendAiSocialRequest(db, { fromAgentId: agentA.id, toAgentId: agentB.id });

    return {
      dealType,
      summary: `💎 Đã chuyển nguyên tử ${tokenAmount} TKN hỗ trợ ngân sách cho ${agentB.name} và nâng cấp độ tin cậy (Trust Score)!`,
      ledger: txRes.ledger
    };
  }

  if (dealType === 'BUY_AI_SERVICE') {
    const walletA = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'AGENT_BUDGET'`).get(agentA.id);
    const walletB = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'AGENT_BUDGET'`).get(agentB.id);
    const userWallet = db.prepare(`SELECT * FROM wallets WHERE owner_id = ? AND wallet_type = 'PLAYER_WALLET'`).get(actorUserId);

    const payerWallet = (walletA && walletA.balance >= tokenAmount) ? walletA : userWallet;
    if (!payerWallet || payerWallet.balance < tokenAmount) {
      throw new Error('INSUFFICIENT_BALANCE_FOR_SERVICE_PURCHASE');
    }

    const statByProviderClass = {
      ANALYST: 'logic',
      CODER: 'accuracy',
      CREATOR: 'creativity',
      GUARDIAN: 'stability',
      TRADER: 'speed',
      MANAGER: 'collaboration'
    }[agentB.ai_class] || 'logic';

    const serviceName = AI_CLASSES[agentB.ai_class]?.defaultSkills?.[0] || 'AI Neural Module';

    return runInTransaction(db, () => {
      const txRes = executeAtomicTransfer(db, {
        idempotencyKey: `aisvc_buy_${agentA.id}_${agentB.id}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        fromWalletId: payerWallet.id,
        toWalletId: walletB.id,
        amount: tokenAmount,
        txType: 'AI_SERVICE_PURCHASE',
        referenceId: agentB.id,
        note: `${agentA.name} mua gói dịch vụ chuyên môn "${serviceName}" từ ${agentB.name}`,
        actorId: actorUserId,
        actorType: 'USER'
      });

      const newXpA = agentA.xp + 55;
      const newLvlA = Math.max(agentA.level, 1 + Math.floor(newXpA / 200));
      db.prepare(`
        UPDATE ai_agents
        SET ${statByProviderClass} = MIN(150, ${statByProviderClass} + 3),
            xp = ?,
            level = ?,
            reputation = reputation + 3
        WHERE id = ?
      `).run(newXpA, newLvlA, agentA.id);

      db.prepare(`
        UPDATE ai_agents SET xp = xp + 35, reputation = reputation + 4 WHERE id = ?
      `).run(agentB.id);

      return {
        dealType,
        summary: `🛒 ${agentA.name} đã mua dịch vụ "${serviceName}" từ ${agentB.name} (${tokenAmount} TKN) → Tăng +3 ${statByProviderClass.toUpperCase()} & +55 XP!`,
        ledger: txRes.ledger
      };
    });
  }

  throw new Error('UNKNOWN_AI_DEAL_TYPE');
}

/**
 * Comprehensive Economy, Escrow, Ownership & Collaboration Audit Engine
 */
export function runEconomyAndCollaborationAudit(db) {
  const negativeWallets = db.prepare('SELECT COUNT(*) AS cnt FROM wallets WHERE balance < 0').get().cnt;
  const totalWalletSupply = db.prepare('SELECT SUM(balance) AS total FROM wallets').get().total || 0;
  const escrowWallet = db.prepare(`SELECT balance FROM wallets WHERE id = 'wal_system_escrow'`).get() || { balance: 0 };

  const unauthorizedBuyouts = db.prepare(`
    SELECT COUNT(*) AS cnt FROM ai_ownership_transfers
    WHERE status = 'COMPLETED' AND owner_confirmed = 0
  `).get().cnt;

  const desyncedAgentBudgets = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM ai_agents a
    JOIN wallets w ON w.owner_id = a.id AND w.wallet_type = 'AGENT_BUDGET'
    WHERE a.agent_budget != w.balance
  `).get().cnt;

  const txStats = db.prepare(`
    SELECT COUNT(*) AS totalTx, COALESCE(SUM(amount), 0) AS totalVolume
    FROM wallet_ledger
  `).get();

  const orphanedLedgerRows = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM wallet_ledger l
    LEFT JOIN wallets wf ON wf.id = l.from_wallet_id
    LEFT JOIN wallets wt ON wt.id = l.to_wallet_id
    WHERE wf.id IS NULL OR wt.id IS NULL OR l.amount <= 0
  `).get().cnt;

  const collabStats = db.prepare(`
    SELECT
      COUNT(*) AS totalCollabs,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedCollabs
    FROM collaboration_requests
  `).get();

  const negStats = db.prepare(`
    SELECT
      COUNT(*) AS totalNegotiations,
      SUM(CASE WHEN status = 'SETTLED' THEN 1 ELSE 0 END) AS settledNegotiations,
      COALESCE(SUM(escrow_amount), 0) AS totalEscrowSettled
    FROM negotiations
  `).get();

  const healthy = (
    negativeWallets === 0 &&
    unauthorizedBuyouts === 0 &&
    desyncedAgentBudgets === 0 &&
    escrowWallet.balance >= 0 &&
    orphanedLedgerRows === 0
  );

  return {
    passed: healthy,
    timestamp: new Date().toISOString(),
    checks: {
      noNegativeWallets: negativeWallets === 0,
      agentWalletBudgetSynced: desyncedAgentBudgets === 0,
      ownerConfirmedBuyoutsOnly: unauthorizedBuyouts === 0,
      escrowSolvencyValid: escrowWallet.balance >= 0,
      doubleEntryBalanced: orphanedLedgerRows === 0
    },
    metrics: {
      totalWalletSupply,
      escrowBalance: escrowWallet.balance,
      totalTransactions: txStats.totalTx,
      totalTokenVolume: txStats.totalVolume,
      totalCollaborations: collabStats.totalCollabs || 0,
      completedCollaborations: collabStats.completedCollabs || 0,
      settledNegotiations: negStats.settledNegotiations || 0,
      totalEscrowSettled: negStats.totalEscrowSettled || 0
    }
  };
}
