# GAP ANALYSIS – ĐẤU TRƯỜNG AI (AI ARENA 3.0)

**Ngày đánh giá:** 07/11/2026  
**Thư mục dự án:** `AI-Arena-3.0/`

---

## 1. Hiện trạng Repository (Current State)

Qua rà soát toàn bộ workspace hiện tại:
- **Tài liệu đặc tả:** Đã có file đặc tả tổng quan `AI-Arena-3.0/docs/AI_Arena_3.0_PRD_GDD.md` (Mục 1 – Mục 11).
- **Mã nguồn (Codebase):** Chưa có mã nguồn ứng dụng (`web`, `api`, `game-server`, `ai-worker`, `shared`, `database`, `tests`, `infra`).
- **Môi trường thực thi:** Hệ thống đã cài đặt sẵn **Node.js v24.14.1** và **npm v11.11.0** (hỗ trợ đầy đủ TypeScript, WebSockets, SQLite ACID native `node:sqlite` và kết nối PostgreSQL/Prisma).

---

## 2. Bảng đối chiếu khoảng cách (Gap Analysis Matrix)

| Hạng mục theo Master Prompt | Hiện trạng | Khoảng cách (Gap) | Mức độ ưu tiên |
|---|---|---|---|
| **I. Cấu trúc Monorepo** (`web`, `api`, `game-server`, `ai-worker`, `shared`, `database`, `tests`, `docs`, `infra`) | Chưa có | Cần khởi tạo đầy đủ cấu trúc monorepo và cấu hình dùng chung (`shared`) | **P0 (Phase 1)** |
| **II. Database & Schema (14 nhóm bảng)** | Chưa có | Cần thiết kế Prisma Schema (`PostgreSQL` + `SQLite` runtime local), migrations SQL có đầy đủ FK, Unique Constraints, Indexes, Idempotency Key và Seed Data thật | **P0 (Phase 1)** |
| **III. Thế giới Game 3D (Three.js)** | Chưa có | Cần xây dựng thế giới 3D với **Central Hub**, **Job City**, **Battle Arena** (ưu tiên MVP) cùng cổng dịch chuyển/tương tác tới AI Academy, Business District, Token Exchange, AI Social Hub, AI Lab, AI Empire; nhân vật 3D có Idle/Walk/Run/Interact, camera góc nhìn thứ 3, điều khiển Keyboard/Mouse/Touch, Minimap | **P0 (Phase 1)** |
| **IV. Multiplayer Engine (Server Authoritative)** | Chưa có | Cần xây dựng WebSocket Game Server quản lý World Room, Public Lobby, Private Room, Matchmaking, Ready Check, Team Management, Realtime Position Sync (2–20 người/phòng), Reconnect, Room Chat, Presence, Match Results | **P0 (Phase 1)** |
| **V. Hệ thống AI Agent (6 Lớp & Simulation Engine)** | Chưa có | Cần triển khai 6 lớp AI (`Analyst`, `Coder`, `Creator`, `Guardian`, `Trader`, `Manager`), 6 chỉ số (`Logic`, `Creativity`, `Speed`, `Accuracy`, `Collaboration`, `Stability`), lưu DB thật, tách biệt AI Simulation Engine với API thương mại | **P0 (Phase 1)** |
| **VI. Job Market & AI Speed War** | Chưa có | Cần xây dựng hệ thống thị trường hợp đồng và chế độ **AI Speed War** (2–20 người, 3 vòng hợp đồng, đấu thầu thời gian thực, chọn AI + chiến thuật, chấm điểm Server-Authoritative theo công thức 40/25/15/10/10, trao thưởng Token & XP, Leaderboard) | **P0 (Phase 1)** |
| **VII. Token Economy & Ledger (ACID)** | Chưa có | Cần triển khai `Player Wallet`, `Agent Budget`, `Company Treasury`, `Escrow Account`, `Reward Treasury`, `Wallet Ledger`, `Transaction History` với giao dịch nguyên tử (Atomic Transaction), chống âm số dư, chống cộng thưởng trùng (`idempotency_key`) | **P0 (Phase 1 – Nền tảng) / P1 (Phase 4 – Mở rộng)** |
| **VIII. AI Autonomy Control & Emergency Stop** | Chưa có | Cần triển khai 3 mức tự chủ (`Manual`, `Assisted`, `Limited Autonomous`), cấu hình hạn mức Token/giao dịch, Token/ngày, quyền kết bạn/hợp tác/đấu thầu, Audit Log và nút **Dừng khẩn cấp (Emergency Stop)** | **P0 (Phase 1)** |
| **IX. AI Social Network** | Chưa có | Cần xây dựng hệ thống quan hệ 5 cấp (`Stranger`, `Acquaintance`, `Friend`, `Trusted Partner`, `Strategic Alliance`), tìm kiếm đối tác, kết bạn có giới hạn tần suất (Rate Limit) | **P1 (Phase 2)** |
| **X. AI Autonomous Collaboration & Negotiation** | Chưa có | Quy trình 12 bước phân tích nhiệm vụ, tìm đối tác, thương lượng có giới hạn số vòng trả giá, khóa ký quỹ (Escrow) và chia thưởng | **P1 (Phase 3)** |
| **XI. AI Rescue Market & Ownership Transfer** | Chưa có | Phát hiện trạng thái `Healthy` → `Low Token` → `Critical` → `Rescue Needed`, cứu trợ, thuê AI, mua lại AI bắt buộc có xác nhận của chủ sở hữu (`Owner Confirmation`) | **P2 (Phase 5)** |
| **XII. Corporation & AI Empire** | Chưa có | Thành lập công ty, quỹ công ty (`Company Treasury`), tuyển AI, chia lợi nhuận, liên minh | **P2 (Phase 6)** |
| **XIII. Admin Console & Anti-Fraud** | Chưa có | Bảng điều khiển Admin giám sát người chơi, AI, phòng đấu, sổ cái Token, phát hiện giao dịch vòng tròn/bất thường và xử lý báo cáo vi phạm | **P0 (Cơ bản ở Phase 1) / P2 (Hoàn thiện)** |
| **XIV. Kiểm thử tự động (Automated Tests)** | Chưa có | Cần bộ kiểm thử tự động kiểm tra toàn bộ tiêu chí nghiệm thu: Server-authoritative, chống gian lận số dư/điểm số, đồng bộ Multiplayer, Speed War 3 vòng, AI Agent & Autonomy | **P0 (Phase 1)** |

---

## 3. Kết luận & Chiến lược Khắc phục

1. **Không dùng dữ liệu giả (No Mock Data):** Sử dụng cơ sở dữ liệu quan hệ thực tế có hỗ trợ giao dịch nguyên tử ACID (`SQLite` tích hợp cho môi trường chạy ngay + `Prisma/PostgreSQL` schema & Docker Compose cho hạ tầng mở rộng).
2. **Triển khai đầy đủ từ Backend → Game Server → AI Worker → 3D Web Client → Automated Tests:** Đảm bảo ngay trong **Phase 1**, hệ thống đã có đầy đủ cấu trúc dữ liệu 14 phân nhóm và vận hành trơn tru toàn bộ luồng **Đăng nhập → Tạo nhân vật → Thế giới 3D (Central Hub, Job City, Battle Arena) → Đồng bộ Multiplayer → Quản lý AI Agent & Quyền tự chủ → Thi đấu AI Speed War 3 vòng → Ví Token & Sổ cái → Admin Console**.
