/**
 * AI ARENA 3.0 – Behavior Tree & Utility AI Runtime
 * Built from `awesome-gamedev-agent-skills`:
 * - Skill: `ai-behavior-trees-utility-ai`
 *   - Three-state Status enum: SUCCESS, FAILURE, RUNNING
 *   - Blackboard key/value memory per agent
 *   - Composites: Selector (OR / fallback with Running memory), Sequence (AND), ReactiveSequence
 *   - Decorators: Inverter, Cooldown (persists readyTime across Reset)
 *   - Utility AI: Normalized 0..1 Response Curves (Linear, Quadratic, Sigmoid, InverseLerp01)
 *   - Compensation factor `Compensate(product, count)` + Hysteresis bonus to prevent action thrashing
 */

export const BTStatus = Object.freeze({
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RUNNING: 'RUNNING'
});

export class Blackboard {
  constructor(initial = {}) {
    this.store = new Map(Object.entries(initial));
  }
  get(key, fallback = undefined) {
    return this.store.has(key) ? this.store.get(key) : fallback;
  }
  set(key, value) {
    this.store.set(key, value);
  }
}

export class BTNode {
  tick(_bb, _dt) {
    return BTStatus.FAILURE;
  }
  reset() {}
}

export class ConditionNode extends BTNode {
  constructor(name, predicateFn) {
    super();
    this.name = name;
    this.predicateFn = predicateFn;
  }
  tick(bb) {
    return this.predicateFn(bb) ? BTStatus.SUCCESS : BTStatus.FAILURE;
  }
}

export class ActionNode extends BTNode {
  constructor(name, actionFn) {
    super();
    this.name = name;
    this.actionFn = actionFn;
  }
  tick(bb, dt) {
    bb.set('activeBTNode', this.name);
    return this.actionFn(bb, dt);
  }
}

export class Selector extends BTNode {
  constructor(name, children = [], reactive = true) {
    super();
    this.name = name;
    this.children = children;
    this.current = 0;
    this.reactive = reactive;
  }
  tick(bb, dt) {
    const startIdx = this.reactive ? 0 : this.current;
    for (let i = startIdx; i < this.children.length; i++) {
      const status = this.children[i].tick(bb, dt);
      if (status === BTStatus.RUNNING) {
        if (this.current !== i && this.children[this.current]) {
          this.children[this.current].reset();
        }
        this.current = i;
        return BTStatus.RUNNING;
      }
      if (status === BTStatus.SUCCESS) {
        if (this.current !== i && this.children[this.current]) {
          this.children[this.current].reset();
        }
        this.current = 0;
        return BTStatus.SUCCESS;
      }
    }
    this.current = 0;
    return BTStatus.FAILURE;
  }
  reset() {
    this.current = 0;
    for (const c of this.children) c.reset();
  }
}

export class Sequence extends BTNode {
  constructor(name, children = []) {
    super();
    this.name = name;
    this.children = children;
    this.current = 0;
  }
  tick(bb, dt) {
    for (; this.current < this.children.length; this.current++) {
      const status = this.children[this.current].tick(bb, dt);
      if (status === BTStatus.RUNNING) return BTStatus.RUNNING;
      if (status === BTStatus.FAILURE) {
        this.current = 0;
        return BTStatus.FAILURE;
      }
    }
    this.current = 0;
    return BTStatus.SUCCESS;
  }
  reset() {
    this.current = 0;
    for (const c of this.children) c.reset();
  }
}

export class CooldownDecorator extends BTNode {
  constructor(child, durationSec = 3.0) {
    super();
    this.child = child;
    this.durationSec = durationSec;
    this.readyAt = 0;
  }
  tick(bb, dt) {
    const now = bb.get('elapsedTime', 0);
    if (now < this.readyAt) return BTStatus.FAILURE;
    const status = this.child.tick(bb, dt);
    if (status === BTStatus.SUCCESS) {
      this.readyAt = now + this.durationSec;
    }
    return status;
  }
  // Deliberately do NOT clear readyAt on reset() so rapid branch switching cannot bypass cooldown
  reset() {
    this.child.reset();
  }
}

/* ============================================================================
 * UTILITY AI RESPONSE CURVES (Normalized 0..1 + Product Compensation)
 * ============================================================================ */
export const ResponseCurves = {
  clamp01(v) {
    return Math.max(0, Math.min(1, v));
  },
  inverseLerp01(val, min, max) {
    if (Math.abs(max - min) < 1e-6) return 0;
    return this.clamp01((val - min) / (max - min));
  },
  linear(x, slope = 1, intercept = 0) {
    return this.clamp01(slope * x + intercept);
  },
  quadratic(x, exponent = 2) {
    return Math.pow(this.clamp01(x), exponent);
  },
  sigmoid(x, k = 8, mid = 0.5) {
    const v = 1 / (1 + Math.exp(-k * (x - mid)));
    return this.clamp01(v);
  },
  /**
   * Dave Mark / Infinite Axis Utility System compensation factor:
   * Prevents multiplying N (0..1) considerations from dragging the score unfairly toward 0.
   */
  compensate(scoreProduct, count) {
    if (count <= 1 || scoreProduct <= 0) return this.clamp01(scoreProduct);
    const modFactor = 1 - (1 / count);
    const makeUpValue = (1 - scoreProduct) * modFactor;
    return this.clamp01(scoreProduct + scoreProduct * makeUpValue);
  }
};

export class UtilityEvaluator {
  constructor(actions = [], hysteresisBonus = 0.08) {
    this.actions = actions; // [{ id, label, targetZone, scoreFn(bb) }]
    this.hysteresisBonus = hysteresisBonus;
  }

  evaluate(bb) {
    const currentActionId = bb.get('currentUtilityAction', null);
    let bestAction = null;
    let bestScore = -1;
    const allScores = {};

    for (const act of this.actions) {
      let score = ResponseCurves.clamp01(act.scoreFn(bb));
      if (act.id === currentActionId) {
        score = ResponseCurves.clamp01(score + this.hysteresisBonus);
      }
      allScores[act.id] = Number(score.toFixed(2));
      if (score > bestScore) {
        bestScore = score;
        bestAction = act;
      }
    }

    if (bestAction) {
      bb.set('currentUtilityAction', bestAction.id);
      bb.set('currentUtilityLabel', bestAction.label);
      bb.set('currentUtilityScore', Number(bestScore.toFixed(2)));
      bb.set('utilityScores', allScores);
    }

    return { action: bestAction, score: Number(bestScore.toFixed(2)), allScores };
  }
}

/**
 * Build a Hybrid BT-Drives-Utility Controller for an AI Agent in AI Arena 3.0
 */
export function createHybridAgentBrain() {
  const utilityEvaluator = new UtilityEvaluator([
    {
      id: 'SEEK_RESCUE_FUNDING',
      label: 'Cầu cứu Ngân sách (Token Exchange)',
      targetZone: 'TOKEN_EXCHANGE',
      scoreFn: (bb) => {
        // High urgency when agentBudget <= 45
        const lowBudget01 = ResponseCurves.inverseLerp01(bb.get('agentBudget', 100), 120, 10);
        return ResponseCurves.quadratic(lowBudget01, 1.4);
      }
    },
    {
      id: 'EXECUTE_JOB_CONTRACT',
      label: 'Nhận & Giải quyết Hợp đồng (Job City)',
      targetZone: 'JOB_CITY',
      scoreFn: (bb) => {
        const budgetHealthy01 = ResponseCurves.inverseLerp01(bb.get('agentBudget', 100), 20, 180);
        const logic01 = ResponseCurves.inverseLerp01(bb.get('logic', 75), 40, 110);
        return ResponseCurves.compensate(budgetHealthy01 * logic01, 2);
      }
    },
    {
      id: 'COMPETE_SPEED_WAR',
      label: 'Thi đấu Đấu trường (Battle Arena)',
      targetZone: 'BATTLE_ARENA',
      scoreFn: (bb) => {
        const speed01 = ResponseCurves.inverseLerp01(bb.get('speed', 75), 45, 115);
        const stability01 = ResponseCurves.inverseLerp01(bb.get('stability', 75), 45, 115);
        const energy01 = ResponseCurves.sigmoid(bb.get('energy01', 0.85), 6, 0.45);
        return ResponseCurves.compensate(speed01 * stability01 * energy01, 3);
      }
    },
    {
      id: 'BUILD_AI_SOCIAL_TRUST',
      label: 'Kết bạn & Tìm Đối tác (AI Social Hub)',
      targetZone: 'AI_SOCIAL_HUB',
      scoreFn: (bb) => {
        const collab01 = ResponseCurves.inverseLerp01(bb.get('collaboration', 75), 40, 110);
        const socialNeed01 = bb.get('socialNeed01', 0.65);
        return ResponseCurves.compensate(collab01 * socialNeed01, 2);
      }
    },
    {
      id: 'TRAIN_AT_ACADEMY',
      label: 'Huấn luyện Kỹ năng (AI Academy)',
      targetZone: 'AI_ACADEMY',
      scoreFn: (bb) => {
        const creativity01 = ResponseCurves.inverseLerp01(bb.get('creativity', 75), 40, 115);
        return creativity01 * 0.72;
      }
    }
  ]);

  // Hybrid Behavior Tree:
  // Root Selector:
  //  1. Sequence [IsEmergencyStopped? -> HaltAction]
  //  2. Sequence [IsCriticalBudget? -> NavigateToRescueAction]
  //  3. Action   [UtilityDrivenDecisionAndMove]
  const tree = new Selector('RootSelector', [
    new Sequence('EmergencyStopBranch', [
      new ConditionNode('IsEmergencyStopped', (bb) => Boolean(bb.get('emergencyStopped', false))),
      new ActionNode('EmergencyHalted', (bb) => {
        bb.set('currentUtilityLabel', '⛔ Đã Dừng Khẩn Cấp');
        bb.set('currentUtilityScore', 1.0);
        return BTStatus.SUCCESS;
      })
    ]),
    new ActionNode('UtilityHybridDecision', (bb, dt) => {
      const { action } = utilityEvaluator.evaluate(bb);
      if (!action) return BTStatus.FAILURE;
      bb.set('targetZoneId', action.targetZone);
      return BTStatus.RUNNING;
    })
  ]);

  return { tree, utilityEvaluator };
}
