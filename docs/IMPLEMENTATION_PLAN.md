# IMPLEMENTATION PLAN – KẾ HOẠCH TRIỂN KHAI KỸ THUẬT (AI ARENA 3.0)

- **Mục tiêu tài liệu:** Quy định kế hoạch triển khai kỹ thuật chi tiết cho từng phân hệ của **AI Arena 3.0**, bao gồm nguyên tắc nâng cấp an toàn không gây gián đoạn (Zero-Regression Strangler Pattern), quy trình kiểm thử và khả năng rollback.
- **Ngày kiểm tra:** `2026-11-07`
- **Tài liệu liên quan:**
  - [M01_AUDIT_REPORT.md](./M01_AUDIT_REPORT.md)
  - [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
  - [ROADMAP.md](./ROADMAP.md)
  - [M01_BACKLOG.md](./M01_BACKLOG.md)

---

## 1. CẤU TRÚC THƯ MỤC CHUẨN HÓA (`AI-Arena-3.0/`)

```text
AI-Arena-3.0/
├── package.json                    # Cấu hình Node >= 22.0.0, scripts start/dev/test/publish:live
├── server.mjs                      # HTTP + Gzip Compression + WebSocket Upgrade Entrypoint
├── publish-live.mjs                # Cấp phát đa tên miền HTTPS công khai (Serveo / Pinggy / LHR)
├── Dockerfile                      # Container hóa ứng dụng trên nền node:22-alpine
├── render.yaml                     # Cấu hình triển khai đám mây Render.com
├── vercel.json                     # Cấu hình định tuyến Serverless + Static trên Vercel
├── shared/
│   └── constants.mjs               # 9 Khu vực 3D, 6 Lớp AI, công thức chấm điểm Speed War (40/25/15/10/10)
├── database/
│   ├── migrations/001_init.sql     # DDL SQL đầy đủ 18 bảng thuộc 14 nhóm nghiệp vụ
│   ├── schema.prisma               # Prisma Schema tương đương cho PostgreSQL
│   ├── db.mjs                      # Native ACID SQLite Engine (WAL, Savepoints, Atomic Transfer)
│   └── seed.mjs                    # Dữ liệu khởi tạo thực tế
├── api/
│   ├── index.mjs                   # Vercel Serverless Function Adapter
│   └── routes.mjs                  # 24 REST API Endpoints (Server-Authoritative)
├── game-server/
│   └── wsServer.mjs                # RFC 6455 Native WebSocket Server & 3-Round Speed War Engine
├── ai-worker/
│   ├── btUtilityRuntime.mjs        # Behavior Tree (Selector/Sequence/Blackboard) & Utility AI
│   └── simulationEngine.mjs        # Đàm phán 5 vòng, Ký quỹ Escrow, Mạng xã hội AI & Cứu trợ
├── web/
│   ├── index.html                  # Giao diện 3D + 19 màn hình HUD + Touch Gesture Layer
│   ├── styles.css                  # Hệ thống thiết kế Cyberpunk + Responsive Mobile/Tablet
│   ├── app.js                      # Quản lý trạng thái 19 màn hình, Nhiệm vụ 3 chặng & Đồng bộ WS
│   ├── engine3d.js                 # Three.js WebGL Engine, Tap-to-Move, Touch Ring & AI Cutscenes
│   ├── audioEngine.js              # Nhạc AI Ngũ Cung / Arcade 4-Stem & Hiệu ứng âm thanh 3D Stereo
│   └── btUtilityRuntime.js         # Bản ES Module cho trình duyệt của Behavior Tree & Utility AI
├── tests/
│   └── e2e.test.mjs                # 14 bài kiểm thử End-to-End & Integration tự động
├── infra/
│   └── docker-compose.yml          # PostgreSQL 16 + Redis 7 + App Container
└── docs/                           # Bộ 12 tài liệu chuẩn hóa Sprint M01
```

---

## 2. CÁC SỬA CHỮA NỀN TẢNG AN TOÀN ĐÃ THỰC HIỆN TRONG SPRINT M01

Tuân thủ nguyên tắc M01 (*"Chỉ thực hiện những sửa chữa nền tảng nhỏ, an toàn, có bằng chứng cần thiết"*):

| Mã thay đổi | File chỉnh sửa | Lý do kỹ thuật (Evidence) | Kết quả kiểm thử | Cách thức Rollback |
|---|---|---|---|---|
| **FIX-M01-01** | `AI-Arena-3.0/server.mjs` (dòng 4, 58–77) | Bổ sung nén `zlib.gzipSync` cho các tệp `.html/.css/.js/.mjs`, giảm dung lượng truyền qua Tunnel từ `~285 KB` xuống `~48 KB` (nhanh gấp 6 lần). | `node --test tests/e2e.test.mjs` đạt `14/14 PASS` | Khôi phục khối `res.end(content)` không nén trong `server.mjs`. |
| **FIX-M01-02** | `AI-Arena-3.0/web/app.js` (dòng 7–79, 2712–2950) & `web/index.html` (dòng 8–11) | Nạp sẵn `DEFAULT_BOOT_STATE` ngay tại **Frame 1 (0ms chờ mạng)** và sửa lỗi `DOMContentLoaded` không bắn ra khi chuỗi ES Module tải trễ qua mạng. | Thế giới 3D, Radar và 4 Chiến dịch 3 chặng hiển thị tức thì trên cả iPhone & PC | Đưa `AppState.data` về `null` và giữ listener `DOMContentLoaded` cũ. |
| **FIX-M01-03** | `AI-Arena-3.0/web/index.html` (dòng 77–84), `web/styles.css` (dòng 586–648), `web/engine3d.js` (dòng 1658–2095) | Loại bỏ cụm nút mũi tên D-Pad cố định theo yêu cầu người dùng; thay bằng **Tap-to-Move 3D Raycast** (kèm cột đích Hologram 3D & sóng cảm ứng `.touch-ripple-wave`) và **Floating Touch Ring** 360° ẩn/hiện động dưới ngón tay. | `node --check web/engine3d.js` đạt `0 lỗi`, `14/14 E2E PASS` | Khôi phục thẻ `#touch-controls` D-Pad trong `index.html`. |
| **FIX-M01-04** | `AI-Arena-3.0/infra/docker-compose.yml` (dòng 27–34) | Sửa đường dẫn sai `dockerfile: infra/Dockerfile` thành `dockerfile: Dockerfile` và chuyển mật khẩu mẫu sang biến môi trường `${DATABASE_URL}`. | Cấu trúc `docker-compose.yml` khớp 100% với vị trí `AI-Arena-3.0/Dockerfile` | Đổi lại dòng `dockerfile` trong `infra/docker-compose.yml`. |
| **FIX-M01-05** | `AI-Arena-3.0/database/db.mjs` (dòng 10–31), `api/index.mjs`, `vercel.json` | Tự động chuyển đường dẫn SQLite sang `os.tmpdir()` khi chạy trên môi trường Serverless Read-Only (`process.env.VERCEL`). | `14/14 E2E PASS` | Giữ `defaultDbPath = path.join(__dirname, 'ai_arena_3.sqlite')`. |

---

## 3. LỘ TRÌNH CHUYỂN ĐỔI SANG REACT + TYPESCRIPT + R3F (STRANGLER FIG PATTERN)

Để chuyển đổi giao diện từ Vanilla ES Modules (`web/app.js`, `web/engine3d.js`) sang **React + TypeScript + React Three Fiber** ở Sprint M02–M04 mà **không làm hỏng bất kỳ tính năng nào đang chạy**:

1. **Bước 1 (Sprint M02):** Thiết lập `tsconfig.json` với `allowJs: true` và cấu hình Vite build song song, giữ nguyên các module lõi đã ổn định (`audioEngine.js`, `btUtilityRuntime.js`, `shared/constants.mjs`) và bổ sung tệp khai báo kiểu `shared/types.d.ts`.
2. **Bước 2 (Sprint M03):** Bọc `startThreeJsWorld` (`web/engine3d.js`) trong một `<ArenaThreeCanvas />` React wrapper trước khi tách từng tòa nhà khu vực (`ZoneComplex`) và nhân vật (`CyberKnightHero`, `AutonomousAiBot`) thành các R3F declarative components.
3. **Bước 3 (Sprint M04):** Chuyển đổi tuần tự 19 màn hình trong `renderActiveScreen()` (`web/app.js`) thành 19 React Components độc lập sử dụng Zustand/Context store.
