-- AI ARENA 3.0 - Complete Relational Schema Migration (14 Domain Groups)
PRAGMA foreign_keys = ON;

-- 1. Users & Profiles
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PLAYER',
  age_group TEXT NOT NULL DEFAULT '18_PLUS',
  safe_mode INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL DEFAULT 'AI Rookie',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Game Characters (3D World Avatar & Position)
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_style TEXT NOT NULL DEFAULT 'CYBER_KNIGHT',
  primary_color TEXT NOT NULL DEFAULT '#00e5ff',
  accent_color TEXT NOT NULL DEFAULT '#3b82f6',
  zone TEXT NOT NULL DEFAULT 'CENTRAL_HUB',
  pos_x REAL NOT NULL DEFAULT 0,
  pos_y REAL NOT NULL DEFAULT 0,
  pos_z REAL NOT NULL DEFAULT 0,
  rot_y REAL NOT NULL DEFAULT 0,
  anim_state TEXT NOT NULL DEFAULT 'IDLE',
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_characters_zone ON characters(zone);

-- 3. AI Agents & Skills
CREATE TABLE IF NOT EXISTS ai_agents (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🤖',
  ai_class TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  logic INTEGER NOT NULL CHECK (logic >= 0 AND logic <= 150),
  creativity INTEGER NOT NULL CHECK (creativity >= 0 AND creativity <= 150),
  speed INTEGER NOT NULL CHECK (speed >= 0 AND speed <= 150),
  accuracy INTEGER NOT NULL CHECK (accuracy >= 0 AND accuracy <= 150),
  collaboration INTEGER NOT NULL CHECK (collaboration >= 0 AND collaboration <= 150),
  stability INTEGER NOT NULL CHECK (stability >= 0 AND stability <= 150),
  skills_json TEXT NOT NULL DEFAULT '[]',
  agent_budget INTEGER NOT NULL DEFAULT 100 CHECK (agent_budget >= 0),
  reputation INTEGER NOT NULL DEFAULT 50,
  work_status TEXT NOT NULL DEFAULT 'IDLE',
  health_status TEXT NOT NULL DEFAULT 'HEALTHY',
  autonomy_mode TEXT NOT NULL DEFAULT 'ASSISTED',
  max_token_per_tx INTEGER NOT NULL DEFAULT 100,
  daily_token_limit INTEGER NOT NULL DEFAULT 300,
  daily_token_spent INTEGER NOT NULL DEFAULT 0,
  allowed_partners_json TEXT NOT NULL DEFAULT '["ALL"]',
  allowed_contract_types_json TEXT NOT NULL DEFAULT '["ALL"]',
  allow_auto_friend INTEGER NOT NULL DEFAULT 1,
  allow_auto_collab INTEGER NOT NULL DEFAULT 1,
  allow_auto_bid INTEGER NOT NULL DEFAULT 1,
  allow_auto_hire INTEGER NOT NULL DEFAULT 0,
  emergency_stopped INTEGER NOT NULL DEFAULT 0,
  company_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_agents_owner ON ai_agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_class ON ai_agents(ai_class);
CREATE INDEX IF NOT EXISTS idx_ai_agents_health ON ai_agents(health_status);

-- 4. AI Relationships (Social Network)
CREATE TABLE IF NOT EXISTS ai_relationships (
  id TEXT PRIMARY KEY,
  agent_a_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  agent_b_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'STRANGER',
  trust_score INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'PENDING',
  interaction_count INTEGER NOT NULL DEFAULT 1,
  last_interaction_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(agent_a_id, agent_b_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_rel_a ON ai_relationships(agent_a_id);
CREATE INDEX IF NOT EXISTS idx_ai_rel_b ON ai_relationships(agent_b_id);

-- 5. Collaboration Requests
CREATE TABLE IF NOT EXISTS collaboration_requests (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  requester_agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  partner_agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  missing_skill TEXT NOT NULL,
  scope_of_work TEXT NOT NULL,
  offered_token INTEGER NOT NULL CHECK (offered_token >= 0),
  reward_split_pct INTEGER NOT NULL DEFAULT 35,
  acceptance_criteria TEXT NOT NULL DEFAULT 'Đạt tối thiểu 65 điểm chất lượng',
  failure_policy TEXT NOT NULL DEFAULT 'Hoàn trả 100% Token ký quỹ cho bên thuê',
  status TEXT NOT NULL DEFAULT 'PROPOSED',
  owner_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_collab_contract ON collaboration_requests(contract_id);

-- 6. Contracts & Bids (Job Market)
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  budget_token INTEGER NOT NULL CHECK (budget_token > 0),
  duration_sec INTEGER NOT NULL DEFAULT 180,
  requirements_json TEXT NOT NULL DEFAULT '{}',
  acceptance_criteria TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_by TEXT NOT NULL DEFAULT 'SYSTEM',
  assigned_agent_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

CREATE TABLE IF NOT EXISTS contract_bids (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_token INTEGER NOT NULL CHECK (bid_token > 0),
  strategy TEXT NOT NULL DEFAULT 'BALANCED',
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(contract_id, agent_id)
);

-- 7. Task Executions
CREATE TABLE IF NOT EXISTS task_executions (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  partner_agent_id TEXT,
  match_id TEXT,
  strategy TEXT NOT NULL DEFAULT 'BALANCED',
  quality_score INTEGER NOT NULL,
  accuracy_score INTEGER NOT NULL,
  speed_score INTEGER NOT NULL,
  resource_efficiency INTEGER NOT NULL,
  collaboration_score INTEGER NOT NULL,
  total_score REAL NOT NULL,
  reward_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_executions_agent ON task_executions(agent_id);

-- 8. Multiplayer Rooms & Matches
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'PUBLIC_LOBBY',
  game_mode TEXT NOT NULL DEFAULT 'SPEED_WAR',
  host_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_players INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'WAITING',
  invite_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS room_players (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team TEXT NOT NULL DEFAULT 'ALPHA',
  is_ready INTEGER NOT NULL DEFAULT 0,
  selected_agent_id TEXT,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  game_mode TEXT NOT NULL DEFAULT 'SPEED_WAR',
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  current_round INTEGER NOT NULL DEFAULT 1,
  total_rounds INTEGER NOT NULL DEFAULT 3,
  winner_user_id TEXT,
  results_json TEXT NOT NULL DEFAULT '[]',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT
);

-- 9. Wallets & Immutable Ledger
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(owner_id, wallet_type)
);
CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets(owner_id);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  from_wallet_id TEXT NOT NULL REFERENCES wallets(id),
  to_wallet_id TEXT NOT NULL REFERENCES wallets(id),
  amount INTEGER NOT NULL CHECK (amount > 0),
  tx_type TEXT NOT NULL,
  reference_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ledger_from ON wallet_ledger(from_wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_to ON wallet_ledger(to_wallet_id);

-- 10. Negotiations & Escrow
CREATE TABLE IF NOT EXISTS negotiations (
  id TEXT PRIMARY KEY,
  initiator_agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  responder_agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL,
  context_id TEXT NOT NULL,
  current_offer INTEGER NOT NULL CHECK (current_offer >= 0),
  counter_offer INTEGER,
  round_count INTEGER NOT NULL DEFAULT 1,
  max_rounds INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'OPEN',
  escrow_amount INTEGER NOT NULL DEFAULT 0,
  history_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 11. AI Ownership Transfers & Rescue Market
CREATE TABLE IF NOT EXISTS ai_ownership_transfers (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  from_user_id TEXT NOT NULL REFERENCES users(id),
  to_user_id TEXT NOT NULL REFERENCES users(id),
  sponsor_agent_id TEXT,
  transfer_type TEXT NOT NULL,
  price_token INTEGER NOT NULL CHECK (price_token >= 0),
  owner_confirmed INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING_OWNER',
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 12. Companies & Treasuries
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  treasury_wallet_id TEXT NOT NULL REFERENCES wallets(id),
  alliance_tag TEXT DEFAULT 'NEXUS',
  reputation INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS company_members (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(company_id, user_id)
);

-- 13. Rankings & Achievements
CREATE TABLE IF NOT EXISTS rankings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  season TEXT NOT NULL DEFAULT 'S1_2026',
  rating_points INTEGER NOT NULL DEFAULT 1000,
  matches_played INTEGER NOT NULL DEFAULT 0,
  matches_won INTEGER NOT NULL DEFAULT 0,
  total_tokens_won INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rankings_points ON rankings(rating_points DESC);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  title TEXT NOT NULL,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, badge_code)
);

-- 14. Audit Logs & Safety Reports
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'INFO',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS safety_reports (
  id TEXT PRIMARY KEY,
  reporter_user_id TEXT NOT NULL REFERENCES users(id),
  reported_target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  resolution_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
