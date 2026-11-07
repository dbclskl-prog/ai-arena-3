# GAP ANALYSIS – ĐẤU TRƯỜNG AI (AI ARENA 3.0)

- **Mục tiêu tài liệu:** Đối chiếu toàn diện giữa hiện trạng mã nguồn đã kiểm chứng trong `AI-Arena-3.0/` với kiến trúc mục tiêu quy mô lớn (M01 → M10), xác định rõ những phần đã hoàn thành, phần mới dừng ở mức nền tảng, rủi ro kỹ thuật và tiêu chí nghiệm thu.
- **Ngày kiểm tra:** `2026-11-07`
- **Git Branch / Commit tham chiếu:** Workspace Local (`v3.0.0`, chưa khởi tạo `.git`).
- **Tài liệu liên quan:**
  - [M01_AUDIT_REPORT.md](./M01_AUDIT_REPORT.md)
  - [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
  - [ROADMAP.md](./ROADMAP.md)
  - [M01_BACKLOG.md](./M01_BACKLOG.md)

---

## 1. BẢNG TỔNG HỢP GAP ANALYSIS THEO MODULE (M01 – M10)

| Mã Module | Tên Module | Hiện trạng thực tế | Ưu tiên | Độ phức tạp | Khoảng trống chính (Key Gaps) |
|---|---|---|---|---|---|
| **M01** | **Foundation & DevSecOps** | `PARTIAL` (Chạy tốt với Node 24 + SQLite; thiếu Git repo, JWT Auth, TypeScript build pipeline) | **P0 – Blocker** | Trung bình | 1. Chưa khởi tạo Git repository (`.git`).<br>2. API hiện nhận `userId` từ body/query thay vì `JWT` / `HttpOnly Cookie`.<br>3. Frontend đang viết bằng Vanilla ESM (`.js`), chưa cấu hình Vite + React + TypeScript compiler (`tsconfig.json`). |
| **M02** | **3D World & Character** | `EXISTING` (9 khu vực 3D, Tap-to-Move, Floating Touch Ring, Shader, Camera Deadzone) | **P1 – Critical** | Trung bình | 1. Chưa có va chạm vật lý cứng (AABB / Raycast obstacle collision) ngăn nhân vật đi xuyên qua khối kiến trúc.<br>2. Chưa có bộ nạp tài nguyên 3D ngoài (`GLTFLoader` / `DRACOLoader`) để thay thế dần mesh thủ tục. |
| **M03** | **Multiplayer & Rooms** | `EXISTING` (RFC 6455 WS, 3D Sync, Safe Chat, Room Ready) | **P1 – Critical** | Cao | 1. Trạng thái vị trí người chơi (`worldPlayers`) hiện lưu In-Memory trong 1 process.<br>2. Chưa có hàng đợi ghép trận tự động theo MMR (`Matchmaking Queue`) và đồng bộ đồng hồ đếm ngược từng vòng qua WS tick. |
| **M04** | **AI Agent Core** | `EXISTING` (6 lớp AI, 6 chỉ số, BT + Utility AI, 3 mức tự chủ, Nút dừng khẩn cấp) | **P1 – Critical** | Trung bình | 1. Cần bổ sung bộ tự động đặt lại hạn mức chi tiêu ngày (`daily_token_spent` cron reset lúc 00:00 UTC).<br>2. Cần thêm cây kỹ năng mở khóa theo cấp độ (`Skill Tree Unlocking` ở cấp 5, 10, 15). |
| **M05** | **Job Market & Speed War** | `EXISTING` (Đấu thầu 3 chặng, Speed War 3 vòng chấm điểm 40/25/15/10/10) | **P1 – Critical** | Cao | 1. Speed War hiện tính toán toàn bộ 3 vòng trong 1 lần gọi nguyên tử (`runSpeedWarMatchOnServer`); cần bổ sung chế độ **Interactive Round-by-Round Timer** (người chơi đổi chiến thuật giữa Vòng 1 → Vòng 2 → Vòng 3 theo thời gian thực). |
| **M06** | **Token Economy & Ledger** | `EXISTING` (5 loại ví, `wallet_ledger` bất biến, `idempotency_key`, chống âm tiền) | **P0 – Blocker** | Cao | 1. Cần tách quyền truy cập ví hệ thống (`wal_reward_treasury`) khỏi các hàm chung.<br>2. Cần thêm giới hạn tần suất chuyển Token P2P theo ngày cho tài khoản dưới 18 tuổi (`safe_mode = 1`). |
| **M07** | **AI Social Network** | `EXISTING` (5 bậc quan hệ, `trust_score`, Rate Limit 5 lời mời/phút) | **P2 – Important** | Thấp | 1. Cần bổ sung cơ chế giảm nhẹ `trust_score` nếu đối tác vi phạm hợp đồng hoặc hủy kèo (`Trust Decay / Breach Penalty`). |
| **M08** | **AI Collaboration & Negotiation** | `EXISTING` (Phân tích thiếu kỹ năng, Đàm phán tối đa 5 vòng, Khóa Escrow) | **P2 – Important** | Cao | 1. Cần bổ sung cơ chế tự động hoàn tiền Escrow (`Escrow Timeout Auto-Refund`) nếu hợp đồng quá hạn `duration_sec` mà đối tác chưa hoàn thành. |
| **M09** | **AI Rescue & Acquisition** | `EXISTING` (6 trạng thái sức khỏe, Cứu trợ đồng đẳng, Mua lại bắt buộc `owner_confirmed`) | **P2 – Important** | Trung bình | 1. Cần bổ sung quy trình xác nhận 2 bước có chữ ký số/mã OTP trong phiên cho giao dịch chuyển nhượng quyền sở hữu AI (`ai_ownership_transfers`). |
| **M10** | **Corporation, Live Ops & Admin** | `EXISTING` (Tạo công ty, góp quỹ, báo cáo vi phạm, đối soát kinh tế) | **P3 – Enhancement** | Trung bình | 1. Cần bổ sung cơ chế chia cổ tức tự động (`Dividend Distribution`) từ `COMPANY_TREASURY` cho các thành viên (`company_members`) theo tỷ lệ đóng góp. |

---

## 2. PHÂN TÍCH CHI TIẾT TỪNG MODULE (M01 → M10)

### M01 – Foundation & DevSecOps
- **Chức năng yêu cầu:** Cấu trúc monorepo rõ ràng, xác thực người dùng an toàn, cấu hình môi trường/Docker chuẩn xác, kiểm thử tự động.
- **Hiện trạng thực tế:** `PARTIAL`
- **Mã nguồn đã có:** `server.mjs`, `package.json`, `Dockerfile`, `infra/docker-compose.yml`, `tests/e2e.test.mjs`.
- **Phần chưa hoạt động / Còn thiếu:**
  - Chưa có JWT middleware xác thực token trên header `Authorization: Bearer <token>`.
  - Trong `infra/docker-compose.yml` trước Sprint M01 từng trỏ nhầm `dockerfile: infra/Dockerfile` (đã được sửa thành `dockerfile: Dockerfile` trong Sprint M01).
- **Rủi ro kỹ thuật:** Nếu không có JWT/Session token, client có thể gửi `userId` của người chơi khác trong môi trường công cộng (**P0 Security Blocker**).
- **Tiêu chí nghiệm thu:** Mọi API thay đổi dữ liệu (`POST/PUT/DELETE`) phải kiểm tra phiên đăng nhập hợp lệ; `node --test tests/e2e.test.mjs` đạt 100%.

### M02 – 3D World & Character
- **Chức năng yêu cầu:** Thế giới 3D 9 phân khu, điều khiển nhân vật mượt trên cả PC và Mobile (cảm ứng không nút mũi tên), hiệu ứng âm thanh 3D & nhạc AI.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `web/engine3d.js` (2.238 dòng), `web/audioEngine.js` (1.338 dòng).
- **Phần còn thiếu:** Va chạm vật lý với chân tòa nhà (Cylinder/Circle collider quanh tâm mỗi zone `z.x, z.z`) để nhân vật không đi xuyên tâm tháp.
- **Ưu tiên:** `P1` | **Độ phức tạp:** Trung bình.

### M03 – Multiplayer & Rooms
- **Chức năng yêu cầu:** Đồng bộ vị trí 3D thời gian thực, sảnh phòng, chuẩn bị trận (`Ready Check`), bộ lọc chat an toàn.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `game-server/wsServer.mjs` (583 dòng).
- **Phần còn thiếu:** Nội suy chuyển động có dự đoán hướng đi (`Dead Reckoning / Velocity Extrapolation`) khi mạng di động bị trễ gói tin (>150ms) và hàng đợi ghép trận tự động.
- **Ưu tiên:** `P1` | **Độ phức tạp:** Cao.

### M04 – AI Agent Core
- **Chức năng yêu cầu:** 6 lớp AI, 6 chỉ số, Behavior Tree + Utility AI, 3 chế độ tự chủ (`Manual`, `Assisted`, `Limited Autonomous`) và `Emergency Stop`.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `ai-worker/btUtilityRuntime.mjs`, `ai-worker/simulationEngine.mjs`, `api/routes.mjs` (dòng 162–243).
- **Phần còn thiếu:** Cron job tự động đặt lại `daily_token_spent = 0` mỗi ngày mới và lịch sử biểu đồ tiến화 chỉ số AI.
- **Ưu tiên:** `P1` | **Độ phức tạp:** Trung bình.

### M05 – Job Market & Speed War
- **Chức năng yêu cầu:** Đấu thầu hợp đồng 3 chặng (ghi rõ từng AI phụ trách từng chặng) và giải đấu AI Speed War 3 vòng.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `web/app.js` (hệ thống `quests` 3 chặng + `AI_CLASS_STAGE_DUTIES`), `game-server/wsServer.mjs` (`runSpeedWarMatchOnServer`).
- **Phần còn thiếu:** Chế độ đếm ngược từng vòng (`Round 1 -> 15s -> Round 2 -> 15s -> Round 3`) cho phép đổi AI giữa các vòng đấu trực tiếp.
- **Ưu tiên:** `P1` | **Độ phức tạp:** Cao.

### M06 – Token Economy & Ledger
- **Chức năng yêu cầu:** 5 loại ví (`PLAYER_WALLET`, `AGENT_BUDGET`, `COMPANY_TREASURY`, `ESCROW_ACCOUNT`, `REWARD_TREASURY`), sổ cái bất biến `wallet_ledger`, `idempotency_key`.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `database/db.mjs` (`executeAtomicTransfer`, dòng 72–158).
- **Phần còn thiếu:** Hạn mức chuyển Token P2P riêng cho tài khoản học sinh (`safe_mode = 1`) và báo cáo đối soát tự động định kỳ.
- **Ưu tiên:** `P0` | **Độ phức tạp:** Cao.

### M07 – AI Social Network
- **Chức năng yêu cầu:** Kết bạn giữa các AI, 5 cấp độ tin cậy, chống spam lời mời.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `ai-worker/simulationEngine.mjs` (`sendAiSocialRequest`, dòng 74–138).
- **Phần còn thiếu:** Cơ chế giảm điểm tin cậy khi hủy hợp tác giữa chừng.
- **Ưu tiên:** `P2` | **Độ phức tạp:** Thấp.

### M08 – AI Collaboration & Negotiation
- **Chức năng yêu cầu:** Tự động phát hiện kỹ năng thiếu, đề xuất hợp tác, đàm phán tối đa 5 vòng, khóa và giải ngân Escrow.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `ai-worker/simulationEngine.mjs` (`initiateCollaborationAndNegotiation`, `stepNegotiation`, `executeDirectAiDeal`).
- **Phần còn thiếu:** Cơ chế hoàn trả Escrow tự động khi quá thời gian thực thi (`Escrow Timeout Watchdog`).
- **Ưu tiên:** `P2` | **Độ phức tạp:** Cao.

### M09 – AI Rescue & Acquisition
- **Chức năng yêu cầu:** Phát hiện AI cạn ngân sách (`LOW_TOKEN`, `CRITICAL`, `RESCUE_NEEDED`), tài trợ đồng đẳng, mua lại AI có xác nhận của chủ sở hữu.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `shared/constants.mjs` (`computeRescueStatus`), `ai-worker/simulationEngine.mjs` (`handleRescueMarketAction`).
- **Phần còn thiếu:** Hộp thoại người bán chủ động niêm yết giá sàn chuyển nhượng AI (`Ask Price Listing`).
- **Ưu tiên:** `P2` | **Độ phức tạp:** Trung bình.

### M10 – Corporation, Live Ops & Admin
- **Chức năng yêu cầu:** Thành lập công ty AI, quỹ công ty, bảng xếp hạng mùa giải, xử lý báo cáo an toàn và kiểm toán kinh tế.
- **Hiện trạng thực tế:** `EXISTING`
- **Mã nguồn đã có:** `api/routes.mjs` (dòng 635–738), `ai-worker/simulationEngine.mjs` (`runEconomyAndCollaborationAudit`).
- **Phần còn thiếu:** Chia cổ tức tự động từ `COMPANY_TREASURY` về ví thành viên theo chu kỳ tuần.
- **Ưu tiên:** `P3` | **Độ phức tạp:** Trung bình.
