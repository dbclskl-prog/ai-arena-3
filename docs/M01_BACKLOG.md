# M01 BACKLOG – DANH SÁCH VERTICAL SLICE ISSUES (`VS01` – `VS14`)

- **Mục tiêu tài liệu:** Cung cấp danh mục Backlog chi tiết theo từng Vertical Slice (`VS01` → `VS14`) có thể bàn giao trực tiếp cho đội ngũ kỹ thuật triển khai từ Sprint M02 đến Sprint M10.
- **Ngày kiểm tra:** `2026-11-07`
- **Tài liệu liên quan:**
  - [ROADMAP.md](./ROADMAP.md)
  - [GAP_ANALYSIS.md](./GAP_ANALYSIS.md)
  - [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
  - [M01_HANDOFF.md](./M01_HANDOFF.md)

---

## CHI TIẾT 14 VERTICAL SLICES (`VS01` → `VS14`)

### VS01 – Login, Character & 3D World Collision (Sprint M02 | Ưu tiên: `P0`)
- **Mục tiêu:** Bảo mật phiên đăng nhập bằng chữ ký `HMAC-SHA256 JWT` và bổ sung va chạm vật lý quanh chân 9 tòa nhà 3D.
- **User Story:** *Là một người chơi, tôi muốn tài khoản của mình được bảo vệ bằng khóa phiên an toàn và nhân vật 3D không đi xuyên qua tường các tòa nhà khi di chuyển bằng cảm ứng Tap-to-Move.*
- **Functional Requirements:**
  1. Cấp phát `sessionToken` (`JWT`) khi gọi `POST /api/auth/login` và `/api/auth/register`.
  2. Kiểm tra va chạm hình trụ (`Circle Collider`) quanh tâm mỗi tòa nhà 3D (`zone.x, zone.z`) với bán kính lõi `r_core = 5.5m`.
- **Technical Tasks:**
  - `TASK-VS01-1`: Viết hàm `signJwt` và `verifyJwt` bằng `node:crypto` trong `database/db.mjs`.
  - `TASK-VS01-2`: Thêm hàm `resolveBuildingCollisions(x, z, zones)` trong `web/engine3d.js` trước khi gán `AppState.localPlayer.x/z`.
- **Dependencies:** Không.
- **Data / API Changes:** Trả thêm trường `token` trong response của `/api/auth/login` và `/api/auth/register`.
- **Test Cases:** Gửi request giả mạo `userId` không khớp `token` → nhận `401 Unauthorized`; nhân vật đi thẳng vào tâm tòa nhà dừng lại ở rìa `5.5m`.
- **Acceptance Criteria & DoD:** Toàn bộ 14 bài test cũ + 2 bài test mới đạt `PASS`.
- **Risks:** Phải giữ tương thích ngược cho chế độ chuyển nhanh tài khoản Demo trên thanh Header.

---

### VS02 – Multiplayer Presence & Velocity Extrapolation (Sprint M02 | Ưu tiên: `P1`)
- **Mục tiêu:** Làm mượt chuyển động của người chơi khác trên mạng 4G di động và chống spam gói tin `MOVE_3D`.
- **User Story:** *Là người chơi trên điện thoại, tôi muốn thấy các nhân vật khác di chuyển mượt mà ngay cả khi mạng 4G dao động.*
- **Functional Requirements:**
  1. Giới hạn tần suất `MOVE_3D` trên server tối đa `25 gói/giây/người chơi`.
  2. Nội suy vị trí kết hợp vận tốc hướng đi (`vx, vz`) trong `syncPlayerHeroes()` (`web/engine3d.js`).
- **Technical Tasks:** Thêm bộ đếm `lastMoveAt` trong `wsServer.mjs`; gửi kèm `vx, vz` trong gói `PLAYER_MOVED`.
- **Dependencies:** `VS01`.
- **Data / API Changes:** Thêm trường `vx, vz` vào payload `MOVE_3D` và `PLAYER_MOVED`.
- **Test Cases & DoD:** Kiểm thử 2 client WebSocket gửi 50 gói/giây không làm nghẽn server.

---

### VS03 – Rooms, Auto-Matchmaking & Ready Countdown (Sprint M03 | Ưu tiên: `P1`)
- **Mục tiêu:** Tự động ghép 2–20 người chơi có điểm `rating_points` tương đương vào phòng đấu và đếm ngược 5 giây khi tất cả đã `Ready`.
- **User Story:** *Là người chơi, tôi muốn bấm 1 nút "Ghép Trận Nhanh" để hệ thống tự tìm phòng phù hợp.*
- **Functional Requirements:** API `POST /api/rooms/matchmake` tìm phòng `WAITING` có chênh lệch Rating `<= 250` hoặc tạo phòng mới.
- **Dependencies:** `VS02`.
- **Data / API Changes:** Thêm endpoint `POST /api/rooms/matchmake` và sự kiện WS `ROOM_COUNTDOWN`.
- **Test Cases & DoD:** 2 người chơi bấm `Ready` tự động kích hoạt đếm ngược vào trận.

---

### VS04 – AI Manager, Skill Tree & Daily Limit Reset (Sprint M04 | Ưu tiên: `P1`)
- **Mục tiêu:** Mở khóa kỹ năng chuyên sâu khi AI đạt cấp 5/10/15 và tự động đặt lại hạn mức chi tiêu ngày (`daily_token_spent`).
- **User Story:** *Là chỉ huy AI, tôi muốn AI của mình mở khóa kỹ năng đặc biệt khi lên cấp và hạn mức Token hàng ngày tự động làm mới.*
- **Functional Requirements:** Khi `agent.level` vượt mốc `5`, tự động thêm kỹ năng cấp cao vào `skills_json`; tự động reset `daily_token_spent = 0` khi qua ngày mới.
- **Dependencies:** `VS01`.
- **Data / API Changes:** Thêm cột `last_daily_reset TEXT` vào bảng `ai_agents` (hoặc kiểm tra theo ngày trong `db.mjs`).
- **Test Cases & DoD:** Huấn luyện AI lên cấp 5 tự động nhận kỹ năng mới trong `skills`.

---

### VS05 – Custom Contract Publishing & 3-Stage Quest Engine (Sprint M05 | Ưu tiên: `P1`)
- **Mục tiêu:** Cho phép người chơi và tập đoàn tự đăng hợp đồng 3 chặng mới lên `Job City` kèm khóa ngân sách thưởng vào Escrow.
- **User Story:** *Là chủ doanh nghiệp AI, tôi muốn đăng hợp đồng 3 chặng lên Thị trường Việc làm để thuê các AI giỏi nhất thực hiện.*
- **Functional Requirements:** Endpoint `POST /api/contracts/create` trừ `budget_token` từ ví người tạo, khóa vào `wal_escrow_system` và tạo bản ghi trong bảng `contracts`.
- **Dependencies:** `VS04`, `VS07`.
- **Data / API Changes:** Thêm `POST /api/contracts/create`.
- **Test Cases & DoD:** Tạo hợp đồng mới thành công, hiển thị ngay trên màn hình `JOB_MARKET`.

---

### VS06 – Interactive Round-by-Round AI Speed War (Sprint M05 | Ưu tiên: `P1`)
- **Mục tiêu:** Cho phép người chơi điều chỉnh chiến thuật (`SPEED_FOCUS`, `QUALITY_FIRST`, `BALANCED`, `COLLABORATIVE`) giữa từng vòng trong 3 vòng đấu Speed War.
- **User Story:** *Là tuyển thủ Speed War, tôi muốn xem điểm số sau Vòng 1 để đổi chiến thuật ở Vòng 2 và Vòng 3 nhằm lật ngược thế cờ.*
- **Functional Requirements:** Hỗ trợ cả chế độ **Instant 3-Round Match** (hiện có) và **Interactive Step-by-Step Round** (`/api/matches/speed-war/round`).
- **Dependencies:** `VS03`, `VS05`.
- **Data / API Changes:** Thêm `POST /api/matches/speed-war/round` cập nhật `matches.current_round`.
- **Test Cases & DoD:** Chạy 3 vòng tuần tự cho kết quả tổng điểm và trao thưởng chính xác từ `wal_reward_treasury`.

---

### VS07 – Wallet Statement Export & Immutable Reward Ledger (Sprint M06 | Ưu tiên: `P0`)
- **Mục tiêu:** Cho phép xuất sao kê sổ cái `wallet_ledger` ra định dạng JSON/CSV có mã kiểm chứng `idempotency_key`.
- **User Story:** *Là người chơi, tôi muốn kiểm tra minh bạch từng đồng Token vào/ra ví của mình và ngân sách của từng AI.*
- **Functional Requirements:** Endpoint `GET /api/wallet/export?userId=...` trả về toàn bộ lịch sử giao dịch kèm tổng đối soát đầu kỳ/cuối kỳ.
- **Dependencies:** `VS01`.
- **Test Cases & DoD:** Tổng `credit - debit` khớp 100% với `wallets.balance`.

---

### VS08 – Safe-Mode P2P Token Transfer Caps (Sprint M06 | Ưu tiên: `P1`)
- **Mục tiêu:** Bảo vệ người chơi dưới 18 tuổi (`safe_mode = 1`) khỏi rủi ro chuyển nhầm hoặc bị lừa chuyển quá nhiều Token trong ngày.
- **User Story:** *Là học sinh THPT chơi chế độ Safe Mode, hệ thống cần giới hạn tổng số Token chuyển P2P mỗi ngày không vượt quá 200 TKN.*
- **Functional Requirements:** Trong `POST /api/wallet/transfer`, nếu `user.safe_mode === 1` và tổng `P2P_TRANSFER` trong 24h qua `> 200 TKN`, từ chối giao dịch với thông báo bảo vệ độ tuổi.
- **Dependencies:** `VS07`.
- **Test Cases & DoD:** Tài khoản `usr_minh` (`safe_mode = 1`) chuyển P2P vượt 200 TKN/ngày bị chặn an toàn.

---

### VS09 – AI Social Alliance Synergy Bonus (Sprint M07 | Ưu tiên: `P2`)
- **Mục tiêu:** Khi 2 AI đạt cấp quan hệ `TRUSTED_PARTNER` hoặc `STRATEGIC_ALLIANCE`, tự động cộng thưởng điểm `Collaboration` (`+8%` đến `+15%`) khi làm nhiệm vụ chung.
- **User Story:** *Là người chơi, tôi muốn việc kết bạn và xây dựng lòng tin giữa các AI mang lại lợi thế thực sự khi thi đấu và làm hợp đồng.*
- **Dependencies:** `VS04`, `VS05`.
- **Test Cases & DoD:** Hai AI có `trust_score >= 70` đạt điểm `collaboration_score` cao hơn rõ rệt trong `task_executions`.

---

### VS10 – Visual 3-Stage AI Collaboration Composer (Sprint M08 | Ưu tiên: `P2`)
- **Mục tiêu:** Cho phép người chơi chọn đích danh AI phụ trách Chặng 1, Chặng 2 và Chặng 3 trước khi gửi đề nghị hợp tác.
- **Dependencies:** `VS05`, `VS09`.
- **Test Cases & DoD:** Lưu phân công 3 chặng vào `collaboration_requests.scope_of_work` và hiển thị trên HUD.

---

### VS11 – Escrow Timeout Watchdog & Auto-Refund (Sprint M08 | Ưu tiên: `P2`)
- **Mục tiêu:** Tự động hoàn trả 100% Token đang khóa trong `wal_escrow_system` về ví người thuê nếu thương lượng/hợp tác hết hạn mà chưa hoàn tất.
- **Dependencies:** `VS07`, `VS10`.
- **Data / API Changes:** Thêm hàm `refundExpiredEscrows(db)` trong `simulationEngine.mjs`.
- **Test Cases & DoD:** Hợp đồng quá hạn hoàn tiền nguyên tử về đúng ví gốc, không thất thoát Token.

---

### VS12 – 3D Central Hub Rescue Beacon Alert (Sprint M09 | Ưu tiên: `P2`)
- **Mục tiêu:** Hiển thị tín hiệu cầu cứu Hologram màu Đỏ/Cam trên đỉnh đầu các AI Android trong thế giới 3D khi `rescue_status === 'RESCUE_NEEDED'`.
- **Dependencies:** `VS04`.
- **Test Cases & DoD:** AI có `agent_budget < 15` hiển thị nhãn `[CẦN CỨU TRỢ]` trong thế giới 3D và cho phép bấm cứu trợ nhanh.

---

### VS13 – AI Public Ask-Price Listing & 2-Step Buyout (Sprint M09 | Ưu tiên: `P2`)
- **Mục tiêu:** Cho phép chủ sở hữu niêm yết giá chào bán AI công khai trên `RESCUE_MARKET` và xác nhận chuyển nhượng 2 bước.
- **Dependencies:** `VS07`, `VS12`.
- **Test Cases & DoD:** Mọi lệnh mua lại thiếu `ownerConfirmed: true` đều bị chặn bởi Test #7.

---

### VS14 – Corporation Weekly Dividends & Admin Live Ops (Sprint M10 | Ưu tiên: `P3`)
- **Mục tiêu:** Cho phép Chủ tịch Tập đoàn (`CORP_OWNER`) phân phối lợi nhuận từ `COMPANY_TREASURY` cho các thành viên (`company_members`) và cung cấp bộ công cụ Admin Live Ops.
- **Dependencies:** `VS07`.
- **Data / API Changes:** Thêm endpoint `POST /api/companies/distribute-dividends`.
- **Test Cases & DoD:** Chia cổ tức nguyên tử từ `wal_comp_nexus` về ví các thành viên và ghi nhận đầy đủ trong `audit_logs`.
