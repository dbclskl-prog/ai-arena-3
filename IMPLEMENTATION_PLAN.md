# IMPLEMENTATION PLAN – ĐẤU TRƯỜNG AI (AI ARENA 3.0)

## 1. Kiến trúc Monorepo (`AI-Arena-3.0/`)

```text
AI-Arena-3.0/
├── GAP_ANALYSIS.md                 # Báo cáo phân tích hiện trạng & khoảng cách
├── IMPLEMENTATION_PLAN.md          # Kế hoạch triển khai chi tiết
├── package.json                    # Scripts khởi chạy, build và kiểm thử toàn hệ thống
├── shared/                         # Kiểu dữ liệu, hằng số, công thức chấm điểm, giao thức mạng
│   └── types.ts
├── database/                       # Tầng cơ sở dữ liệu quan hệ & Migration
│   ├── schema.prisma               # Prisma Schema chuẩn cho PostgreSQL (14 nhóm bảng)
│   ├── migrations/
│   │   └── 001_init.sql            # DDL SQL đầy đủ FK, Unique Constraints, Indexes
│   ├── db.ts                       # Engine thực thi ACID SQL (Node.js SQLite / Postgres Adapter)
│   └── seed.ts                     # Dữ liệu khởi tạo thực tế (Users, 6 lớp AI, Hợp đồng, Kho bạc)
├── api/                            # REST API Server (Auth, Character, AI, Wallet, Market, Admin)
│   └── routes.ts
├── game-server/                    # Authoritative Multiplayer & Speed War WebSocket Server
│   └── wsServer.ts
├── ai-worker/                      # AI Simulation Engine, Social, Collaboration, Negotiation, Rescue
│   └── simulationEngine.ts
├── web/                            # Giao diện Futuristic 3D (Three.js + Holographic HUD 19 màn hình)
│   ├── index.html
│   ├── styles.css
│   └── app.js                      # 3D World Engine (Three.js) + Multiplayer Sync + UI Modules
├── tests/                          # Bộ kiểm thử tự động End-to-End & Integration
│   └── e2e.test.mjs
├── infra/                          # Cấu hình Docker Compose (PostgreSQL, Redis, App)
│   └── docker-compose.yml
└── docs/                           # Tài liệu đặc tả & Hướng dẫn vận hành
    ├── AI_Arena_3.0_PRD_GDD.md
    └── OPERATIONS_GUIDE.md
```

---

## 2. Thiết kế Cơ sở dữ liệu (14 Nhóm Bảng)

Toàn bộ 14 nhóm dữ liệu theo yêu cầu mục XVII được thiết kế với khóa ngoại (`FOREIGN KEY`), ràng buộc duy nhất (`UNIQUE`), chỉ mục (`INDEX`) và kiểm tra số dư không âm (`CHECK (balance >= 0)`):

1. **Users & Profiles (`users`):** Tài khoản, mật khẩu băm, vai trò (`PLAYER`, `MODERATOR`, `ADMIN`), độ tuổi (`age_group`, chế độ bảo vệ dưới 18 tuổi `safe_mode`).
2. **Game Characters (`characters`):** Nhân vật 3D, màu sắc/trang phục, vị trí `(zone, x, y, z, rot_y)`, cấp độ, danh hiệu.
3. **AI Agents & Skills (`ai_agents`, `ai_skills`):** 6 lớp AI (`Analyst`, `Coder`, `Creator`, `Guardian`, `Trader`, `Manager`), 6 chỉ số (`logic`, `creativity`, `speed`, `accuracy`, `collaboration`, `stability`), `agent_budget`, trạng thái sức khỏe tài chính (`health_status`), cấu hình tự chủ (`autonomy_mode`, `max_token_per_tx`, `daily_token_limit`, `emergency_stopped`, quyền chi tiết).
4. **AI Relationships (`ai_relationships`):** Quan hệ giữa 2 AI (`STRANGER`, `ACQUAINTANCE`, `FRIEND`, `TRUSTED_PARTNER`, `STRATEGIC_ALLIANCE`), điểm tin cậy (`trust_score`), bộ đếm chống spam (`last_interaction_at`).
5. **Collaboration Requests (`collaboration_requests`):** Đề nghị hợp tác phân chia công việc, tỷ lệ chia thưởng, điều khoản và trạng thái phê duyệt.
6. **Contracts & Bids (`contracts`, `contract_bids`):** Hợp đồng trên Job Market và các gói thầu của người chơi/AI.
7. **Task Executions (`task_executions`):** Kết quả thực thi nhiệm vụ với điểm chi tiết (Chất lượng 40%, Chính xác 25%, Tốc độ 15%, Tài nguyên 10%, Hợp tác 10%).
8. **Multiplayer Rooms & Matches (`rooms`, `room_players`, `matches`, `match_rounds`):** Quản lý World Room, Public/Private Lobby, trạng thái Ready Check, Đội nhóm và lịch sử 3 vòng đấu AI Speed War.
9. **Wallets & Ledger (`wallets`, `wallet_ledger`):** Ví người chơi (`PLAYER_WALLET`), Ngân sách AI (`AGENT_BUDGET`), Quỹ công ty (`COMPANY_TREASURY`), Tài khoản ký quỹ (`ESCROW_ACCOUNT`), Kho bạc thưởng (`REWARD_TREASURY`) và sổ cái bất biến có `idempotency_key` duy nhất.
10. **Negotiations & Escrow (`negotiations`, `escrow_locks`):** Lịch sử thương lượng (giới hạn tối đa 5 vòng trả giá) và khóa ký quỹ Token.
11. **AI Ownership Transfers (`ai_ownership_transfers`):** Đề nghị cứu trợ/mua lại AI, bắt buộc trường `owner_confirmed = 1` mới được chuyển quyền sở hữu.
12. **Companies & Treasuries (`companies`, `company_members`):** Doanh nghiệp AI, thành viên, quỹ công ty và liên minh.
13. **Rankings & Achievements (`rankings`, `achievements`):** Bảng xếp hạng điểm mùa giải, số trận thắng Speed War và huy hiệu.
14. **Audit Logs & Safety Reports (`audit_logs`, `safety_reports`):** Nhật ký kiểm toán mọi thay đổi quyền tự chủ, giao dịch lớn và báo cáo vi phạm cộng đồng.

---

## 3. Kế hoạch Thực thi theo Từng Phase

### Phase 1 – MVP Multiplayer 3D (Triển khai ngay và kiểm thử toàn diện)
- **Backend & Database:** Khởi tạo toàn bộ 14 nhóm bảng, Seed dữ liệu ban đầu, cơ chế xác thực JWT/Session, API quản lý nhân vật, AI Agent, Quyền tự chủ (Manual/Assisted/Limited Autonomous + Nút dừng khẩn cấp), Ví Token ACID.
- **Thế giới 3D (Three.js):**
  - Xây dựng không gian 3D Futuristic (màu Xanh dương đậm, Cyan, Trắng) gồm **Central Hub**, **Job City**, **Battle Arena** và các cổng phân khu (**AI Academy**, **Business District**, **Token Exchange**, **AI Social Hub**, **AI Lab**, **AI Empire**).
  - Nhân vật 3D có hoạt ảnh `Idle`, `Walk`, `Run`, `Interact`, camera góc nhìn thứ 3 (Third-person orbit/follow), điều khiển `WASD/Arrow + Mouse + Touch Joystick`, Minimap thời gian thực và tương tác công trình/NPC.
- **Multiplayer Engine (WebSocket):**
  - Đồng bộ vị trí người chơi 3D theo thời gian thực (World Room).
  - Tạo phòng / Tham gia phòng (Public Lobby, Private Room), Ready Check, chọn Đội, Chat phòng (có lọc ngôn từ an toàn cho người dưới 18 tuổi), Reconnect.
- **Job Market & AI Speed War (Chế độ chơi hoàn chỉnh):**
  - Trận đấu 2–20 người chơi (hỗ trợ cả người chơi thật nhiều tab/trình duyệt và đấu với đối thủ phòng đấu), gồm **3 vòng hợp đồng**.
  - Đấu thầu thời gian thực → Chọn AI Agent & Chiến thuật (`SPEED_FOCUS`, `QUALITY_FIRST`, `BALANCED`, `COLLABORATIVE`) → Server chấm điểm theo đúng trọng số **Chất lượng 40% + Chính xác 25% + Tốc độ 15% + Hiệu quả tài nguyên 10% + Hợp tác 10%** → Trao thưởng Token từ `REWARD_TREASURY`, cộng XP/Level và cập nhật Bảng xếp hạng.

### Các Phase Mở rộng Tích hợp (Phase 2 → Phase 7)
Để người chơi và Admin có thể trải nghiệm xuyên suốt toàn bộ 19 màn hình theo Master Prompt, kiến trúc Phase 1 được tích hợp sẵn các module nghiệp vụ thực tế cho:
- **AI Social Network (Phase 2):** Tìm kiếm AI, gửi lời mời kết bạn có giới hạn tần suất (Rate Limit), nâng cấp 5 bậc quan hệ (`Stranger` → `Strategic Alliance`).
- **AI Autonomous Collaboration & Negotiation (Phase 3):** Quy trình 12 bước phân tích nhiệm vụ, tìm đối tác bổ sung kỹ năng thiếu, thương lượng giá (tối đa 5 vòng), khóa ký quỹ (`Escrow`) và chia thưởng tự động.
- **Token Economy & Ledger (Phase 4):** Chuyển/tặng Token, cấp ngân sách cho AI (`Agent Budget`), phát hiện giao dịch vòng tròn/spam.
- **AI Rescue Market (Phase 5):** Tự động chuyển trạng thái `Healthy` → `Low Token` → `Critical` → `Rescue Needed`, đề xuất cứu trợ, tài trợ hoặc mua lại AI (bắt buộc chủ sở hữu phê duyệt).
- **Corporation & Admin Console (Phase 6 & 7):** Thành lập doanh nghiệp AI, góp quỹ công ty, và bảng điều khiển Admin kiểm toán sổ cái, trận đấu, báo cáo an toàn.
