# 5D METHOD MAPPING – ÁP DỤNG SPEC-DRIVEN DEVELOPMENT (5D-SDD) CHO AI ARENA 3.0

- **Mục tiêu tài liệu:** Chuyển hóa phương pháp luận **5D Spec-Driven Development (`https://github.com/tapania/5d-skills`)** thành quy trình kỹ thuật chuẩn hóa cho dự án **Đấu Trường AI – AI Arena 3.0** trên Antigravity (không phụ thuộc vào slash command riêng của Claude Code).
- **Ngày kiểm tra:** `2026-11-07`
- **Tài liệu liên quan:**
  - [M01_AUDIT_REPORT.md](./M01_AUDIT_REPORT.md)
  - [GAP_ANALYSIS.md](./GAP_ANALYSIS.md)
  - [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
  - [ROADMAP.md](./ROADMAP.md)
  - [M01_BACKLOG.md](./M01_BACKLOG.md)

---

## 1. TỔNG QUAN 10 BƯỚC 5D-SDD TRONG AI ARENA 3.0

Phương pháp `tapania/5d-skills` giải quyết 4 căn bệnh phổ biến khi phát triển hệ thống phức tạp bằng AI: **viết code trước khi hiểu rõ hệ thống**, **tư duy một chiều**, **giả định ngầm không kiểm chứng** và **trôi lệch đặc tả (Spec Drift)**.

| Giai đoạn 5D | Lệnh gốc (`5d-skills`) | Quy trình tương đương trong AI Arena 3.0 | Đầu ra đã thực hiện trong Sprint M01 |
|---|---|---|---|
| **1. Orient** | `/5d-orient` | Kiểm kê thực tế mã nguồn, môi trường, các bên liên quan (Học sinh THPT `<18`, Người chơi chuẩn, Chủ công ty AI, Admin). | Phần I–V trong [M01_AUDIT_REPORT.md](./M01_AUDIT_REPORT.md) |
| **2. Spar** | `/5d-spar` | Phản biện các giả định ngầm về kiến trúc, bảo mật, hiệu năng mạng Tunnel và trải nghiệm di động. | Mục 2 bên dưới (Bảng Phản Biện Giả Định – SPAR Matrix) |
| **3. Plan** | `/5d-plan` | Lập lộ trình phát triển theo 14 Vertical Slices (`VS01` → `VS14`) đảm bảo luồng chơi khép kín trước khi mở rộng. | [ROADMAP.md](./ROADMAP.md) & [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) |
| **4. Refine** | `/5d-refine` | Kiểm tra khả năng chịu lỗi (Edge Cases): mất kết nối WS, spam giao dịch, AI cạn ngân sách, màn hình dọc điện thoại. | Mục 3 bên dưới (Adversarial Edge-Case Matrix) |
| **5. Spec** | `/5d-spec` | Chuẩn hóa đặc tả Game Design, Kiến trúc Hệ thống và Thiết kế Cơ sở dữ liệu 14 phân nhóm. | [GAME_DESIGN.md](./GAME_DESIGN.md), [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md), [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) |
| **6. Gap Analysis** | `/5d-gap-analysis` | Đối chiếu từng module `M01`–`M10` giữa mã nguồn thực tế và kiến trúc mục tiêu. | [GAP_ANALYSIS.md](./GAP_ANALYSIS.md) |
| **7. Tasks** | `/5d-tasks` | Phân rã thành các hạng mục công việc nhỏ có mã định danh, độ ưu tiên và tiêu chí nghiệm thu rõ ràng. | [M01_BACKLOG.md](./M01_BACKLOG.md) |
| **8. Build** | `/5d-build` | Chỉ thực hiện các sửa chữa nền tảng nhỏ, an toàn, có kiểm chứng trong phạm vi M01 (nén Gzip, sửa `docker-compose.yml`, khởi tạo Frame 1 tức thì, cảm ứng không nút mũi tên). | Các bản vá nền tảng trong `server.mjs`, `infra/docker-compose.yml`, `web/app.js`, `web/engine3d.js` |
| **9. Verify** | `/5d-verify` | Chạy bộ kiểm thử tự động 14 bài E2E (`node --test tests/e2e.test.mjs`) và kiểm tra cú pháp toàn bộ module. | [M01_TEST_REPORT.md](./M01_TEST_REPORT.md) |
| **10. Reflect** | `/5d-reflect` | Đúc kết bài học kỹ thuật và bàn giao rõ ràng cho Sprint M02. | [M01_HANDOFF.md](./M01_HANDOFF.md) |

---

## 2. KẾT QUẢ PHASE 1 & 2: ORIENT & SPAR (PHẢN BIỆN GIẢ ĐỊNH NGẦM)

Trong quá trình thực hiện `Orient` và `Spar` trên repository `AI-Arena-3.0/`, nhóm kiến trúc đã phát hiện và bác bỏ 5 giả định sai lầm nguy hiểm:

| STT | Giả định ban đầu (Hidden Assumption) | Phản biện kỹ thuật (5D Sparring Challenge) | Giải pháp chuẩn hóa (Verified Decision) |
|---|---|---|---|
| **S1** | *"Chỉ cần dùng `window.addEventListener('DOMContentLoaded', ...)` trong `app.js` là giao diện và thế giới 3D sẽ luôn khởi chạy."* | Khi chạy qua đường truyền SSH Tunnel hoặc mạng di động 4G, chuỗi ES Modules (`app.js` → `engine3d.js` → `audioEngine.js` → `btUtilityRuntime.js`) có thể tải xong **sau khi** sự kiện `DOMContentLoaded` đã bắn ra, khiến hàm khởi tạo không bao giờ chạy (màn hình 3D đen, nhiệm vụ `0/4`). | Kiểm tra `document.readyState === 'loading'` trước khi gắn listener; nếu đã qua `loading` thì gọi `bootAiArenaClient()` ngay lập tức, đồng thời bật nén `zlib.gzipSync` tại `server.mjs` và thêm `<link rel="modulepreload">` tại `index.html`. |
| **S2** | *"Có thể đợi `await apiCall('/api/state')` trả về rồi mới vẽ các tòa nhà 3D, nhân vật và danh sách nhiệm vụ."* | Nếu mạng trễ 1–2 giây, người chơi sẽ nhìn thấy khung cảnh trống rỗng và Radar đen tuyền. | Khởi tạo sẵn `DEFAULT_BOOT_STATE` trong `web/app.js` để ngay tại **Frame 1 (0ms chờ mạng)**, cả 9 Khu vực 3D, 6 AI Android, Nhân vật chính và 4 Chiến dịch 3 chặng đều hiển thị tức thì; sau đó đồng bộ mượt khi `/api/state` phản hồi. |
| **S3** | *"Trên điện thoại di động chỉ cần thu nhỏ cụm nút mũi tên D-Pad ở góc dưới bên trái là đủ."* | Thực tế kiểm thử trên iPhone cho thấy cụm 6 nút mũi tên cố định chiếm mất diện tích góc trái dưới, gây chật chội khi hiển thị cùng thanh hội thoại AI 3D. | Loại bỏ hoàn toàn cụm nút mũi tên cố định; thay bằng **Tap-to-Move 3D Raycast** (chạm điểm bất kỳ trên mặt đất hiện cột sóng Hologram 3D) kết hợp **Floating Touch Gesture Ring** (chỉ hiện dưới ngón tay khi kéo và tự ẩn khi nhấc tay). |
| **S4** | *"AI trong game bắt buộc phải gọi OpenAI / Gemini API ở mọi nhịp suy nghĩ."* | Nếu 20 người chơi × 6 AI gọi LLM thương mại mỗi giây, chi phí API sẽ bùng nổ và độ trễ mạng làm hỏng trải nghiệm thời gian thực. | Tách bạch hoàn toàn **AI Simulation Engine** (`btUtilityRuntime.mjs` + `simulationEngine.mjs` dùng Behavior Tree & Utility AI chạy dưới `1ms`) với tầng **External AI Adapter** tùy chọn ở các Sprint sau. |
| **S5** | *"Giao diện đã khóa nút bấm thì người chơi không thể chuyển lố số dư hoặc tự mua lại AI của người khác."* | Kẻ tấn công có thể gọi trực tiếp `fetch('/api/rescue/action')` hoặc gửi khung WebSocket giả mạo mà không qua giao diện. | Mọi kiểm tra số dư (`balance >= amount`), kiểm tra trùng lặp (`idempotency_key`) và xác nhận chủ sở hữu (`ownerConfirmed === true`) đều được cưỡng chế trong giao dịch ACID SQL tại `database/db.mjs` và `simulationEngine.mjs`. |

---

## 3. KẾT QUẢ PHASE 3 & 4: PLAN & REFINE (KIỂM TRA TÌNH HUỐNG KHÓ / EDGE CASES)

| Tình huống biên (Edge Case) | Kịch bản lỗi tiềm ẩn | Cơ chế phòng vệ đã thiết kế / xác minh |
|---|---|---|
| **EC-01: Double-Click / Mạng lag gửi trùng lệnh thưởng** | Người chơi bấm liên tục nút nhận thưởng hoặc đấu thầu khiến cộng Token 2 lần. | Cột `idempotency_key TEXT NOT NULL UNIQUE` trong bảng `wallet_ledger` (`001_init.sql:209`) chặn đứng giao dịch trùng lặp ở tầng cơ sở dữ liệu. |
| **EC-02: Hai AI thương lượng vòng lặp vô tận** | Hai AI tự chủ trả giá qua lại không hồi kết làm treo tiến trình worker. | Bảng `negotiations` giới hạn cứng `max_rounds = 5` (`001_init.sql:231`) và kiểm tra tại `stepNegotiation()` (`simulationEngine.mjs:218`). |
| **EC-03: AI tự chủ tiêu sạch ngân sách trong 1 phút** | AI ở chế độ `LIMITED_AUTONOMOUS` tự ý ký hàng loạt hợp đồng vượt khả năng tài chính. | Cưỡng chế 3 chốt chặn: `max_token_per_tx`, `daily_token_limit` và nút **Emergency Stop** (`emergency_stopped = 1`) dừng tức thì mọi hành động của AI. |
| **EC-04: Môi trường Serverless (Vercel) có hệ thống tệp Read-Only** | Khi chạy trên Vercel, thư mục `/var/task/database` chỉ cho phép đọc nên SQLite báo lỗi `SQLITE_READONLY`. | `database/db.mjs` (dòng 10–31) tự động chuyển đường dẫn cơ sở dữ liệu sang `os.tmpdir()` khi phát hiện `process.env.VERCEL` hoặc khi thư mục gốc không cho phép ghi. |
| **EC-05: Người chơi dưới 18 tuổi bị lộ thông tin cá nhân trong Chat** | Học sinh THPT gõ số điện thoại hoặc email cá nhân lên kênh Room Chat công cộng. | Hàm `sanitizeSafeChat()` (`wsServer.mjs:98–105`) tự động che số điện thoại (`[SĐT ĐÃ ẨN]`), email (`[EMAIL ĐÃ ẨN]`) và từ ngữ độc hại trước khi phát sóng cho phòng chơi. |
