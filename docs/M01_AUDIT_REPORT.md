# M01 AUDIT REPORT – ĐẤU TRƯỜNG AI (AI ARENA 3.0)

- **Mục tiêu tài liệu:** Kiểm kê toàn diện thực trạng mã nguồn, môi trường, frontend, backend, cơ sở dữ liệu và độ hoàn thiện thực tế của từng chức năng trong repository `AI-Arena-3.0/`.
- **Ngày kiểm tra:** `2026-11-07`
- **Git Branch / Commit tham chiếu:** Workspace chưa khởi tạo `.git` (`fatal: not a git repository` – đã xác minh qua `git status --short`); phiên bản ứng dụng định danh tại `AI-Arena-3.0/package.json` là `3.0.0`.
- **Tài liệu liên quan:**
  - [GAP_ANALYSIS.md](./GAP_ANALYSIS.md)
  - [ROBLOX_SKILLS_MAPPING.md](./ROBLOX_SKILLS_MAPPING.md)
  - [5D_METHOD_MAPPING.md](./5D_METHOD_MAPPING.md)
  - [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
  - [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)
  - [M01_TEST_REPORT.md](./M01_TEST_REPORT.md)

---

## 1. PHASE A1 – KIỂM TRA MÔI TRƯỜNG (ENVIRONMENT INVENTORY)

| Hạng mục | Trạng thái thực tế (Đã xác minh) | Bằng chứng (File / Lệnh / Log) |
|---|---|---|
| **Thư mục gốc dự án** | `c:/Users/Windows 11/Desktop/OneDrive - skylineschool.edu.vn/Sky-Line/AI-Arena-3.0` | Đã kiểm chứng cây thư mục gồm 9 phân khu: `ai-worker/`, `api/`, `database/`, `docs/`, `game-server/`, `infra/`, `shared/`, `tests/`, `web/` |
| **Git Repository** | `MISSING` (Chưa `git init` ở thư mục gốc) | Lệnh `git status --short` trả về `fatal: not a git repository (or any of the parent directories): .git` |
| **Node.js & Package Manager** | **Node.js `v24.14.1`** (tích hợp sẵn `node:sqlite`, `node:test`, `node:http`, `node:crypto`, `node:zlib`) & **npm `11.11.0`** | Kết quả chạy `node -v` → `v24.14.1`, `npm -v` → `11.11.0` |
| **Module System & Framework** | Native ES Modules (`"type": "module"`), Zero-dependency Node.js HTTP/WS Backend + Three.js `r128` WebGL Frontend | `AI-Arena-3.0/package.json` (dòng 1–19), `AI-Arena-3.0/web/index.html` (dòng 8) |
| **Scripts hiện có** | `start`, `dev`, `publish:live`, `vercel:deploy`, `seed`, `test` | `AI-Arena-3.0/package.json` (dòng 6–13) |
| **Cấu hình Docker & Cloud** | Đã có `Dockerfile`, `infra/docker-compose.yml` (PostgreSQL 16 + Redis 7 + App), `render.yaml`, `vercel.json`, `publish-live.mjs` | `AI-Arena-3.0/Dockerfile`, `AI-Arena-3.0/infra/docker-compose.yml` (đã sửa lỗi đường dẫn `dockerfile: Dockerfile` trong Sprint M01), `AI-Arena-3.0/render.yaml`, `AI-Arena-3.0/vercel.json` |
| **Database Runtime & Target ORM** | **Runtime hiện tại:** Native ACID SQLite (`node:sqlite` với `WAL` & `SAVEPOINT` tại `database/db.mjs`). **Target mở rộng:** Prisma + PostgreSQL (`database/schema.prisma`) | `AI-Arena-3.0/database/db.mjs` (dòng 1–75), `AI-Arena-3.0/database/migrations/001_init.sql` (317 dòng), `AI-Arena-3.0/database/schema.prisma` (254 dòng) |
| **Test Framework** | Native Node.js Test Runner (`node --test tests/e2e.test.mjs`) | `AI-Arena-3.0/tests/e2e.test.mjs` (14/14 bài kiểm thử E2E & Integration đạt `PASS` trong `929ms`) |

---

## 2. PHASE A2 – KIỂM KÊ FRONTEND (`AI-Arena-3.0/web/`)

> **Lưu ý kiến trúc quan trọng (Đã xác minh):**
> Frontend hiện tại đang chạy tốt dưới dạng **Vanilla ES Modules + Three.js `r128` WebGL + 19-Screen Holographic DOM HUD** (`web/index.html`, `web/app.js`, `web/engine3d.js`, `web/audioEngine.js`, `web/btUtilityRuntime.js`, `web/styles.css`). Tuy nhiên, đối chiếu với **Kiến trúc mục tiêu (Target Stack)** yêu cầu **React + TypeScript + React Three Fiber (R3F)**, tầng component React/TypeScript hiện ở trạng thái `MISSING` (cần lộ trình nâng cấp không phá vỡ tính năng hiện hữu).

| Hạng mục Frontend | Phân loại trạng thái | Chi tiết thực tế & Bằng chứng mã nguồn |
|---|---|---|
| **React / TypeScript / R3F Architecture** | `PARTIAL` (Đang dùng Vanilla ESM + Three.js trực tiếp; chưa tách sang React + TS) | Hiện dùng `web/app.js` (2.950 dòng) và `web/engine3d.js` (2.238 dòng). Hoạt động 100% trên trình duyệt nhưng chưa dùng React/TSX/Vite bundler. |
| **Three.js Scene Management** | `EXISTING` | `web/engine3d.js` (dòng 1029–1175): `THREE.WebGLRenderer`, `ACESFilmicToneMapping`, `PCFSoftShadowMap`, 3-Light Rig, sương mù `FogExp2`, 9 khu vực kiến trúc 3D (`buildWorldZoneComplex` dòng 860–1024), `InstancedMesh` cho 72 cột đèn neon. |
| **Character Controller & Tap-to-Move** | `EXISTING` | `web/engine3d.js` (dòng 1658–2095): Điều khiển đa phương thức gồm bàn phím (`WASD`/Arrows/Shift), **Tap-to-Move 3D Raycast** (`raycaster.ray.intersectPlane` + Cột đích Hologram 3D `destBeaconGroup`), và **Floating Touch Gesture Ring** 360° (`#touch-gesture-ring`). |
| **Camera Systems** | `EXISTING` | `web/engine3d.js` (dòng 1635–1656, 2146–2215): Camera góc nhìn thứ 3 mượt theo hàm mũ (`1 - Math.exp(-10.5 * rawDt)`), Deadzone (`0.35m`), Velocity Look-Ahead, tự động mở rộng FOV dọc trên màn hình điện thoại (`aspect < 0.85 ? 66 : 55`), và chế độ **Cinematic AI Cutscene Camera**. |
| **Physics / Collision** | `PARTIAL` | `web/engine3d.js` (dòng 1955–2088): Đã có giới hạn biên bản đồ (`[-95, 95]`), phát hiện bán kính tương tác 9 khu vực (`closest.distance <= closest.radius + 4`), hút nam châm & nhặt Tinh thể 3D (`distToPlayer <= 1.3`). **Chưa có** va chạm vật lý cứng (Rigid-body/AABB obstacle collision) ngăn nhân vật đi xuyên qua tường tòa nhà. |
| **Animation System** | `EXISTING` | `web/engine3d.js` (dòng 357–558, 646–855): Khớp xương thủ tục (Procedural Articulated Rig) cho cả Nhân vật `CyberKnightHero` (`IDLE`, `WALK`, `RUN` kèm lửa phản lực Jetpack, `INTERACT`) và 6 lớp Robot AI Android (`WALK`, `SPEAKING` cầm máy tính bảng Hologram + gật đầu, `LISTENING`). |
| **Assets 3D & Shaders** | `EXISTING` (Procedural) / `PARTIAL` (GLTF) | `web/engine3d.js` (dòng 23–66, 205–352): Đã có GLSL Fresnel Forcefield Shader (`createFresnelForcefieldMaterial`), Procedural CanvasTextures và Procedural 3D Meshes. Chưa tích hợp bộ nạp mô hình ngoài `GLTFLoader` / `DRACOLoader`. |
| **Routing & 19-Screen Game HUD** | `EXISTING` | `web/app.js` (dòng 1150–2480): Chuyển đổi tức thì toàn bộ 19 màn hình chức năng (`WORLD_3D`, `LANDING`, `AUTH`, `CHARACTER`, `ROOM_LOBBY`, `WORLD_MAP`, `AI_MANAGER`, `AI_SOCIAL`, `AI_COLLAB`, `JOB_MARKET`, `BATTLE_PREP`, `SPEED_WAR`, `WALLET`, `TOKEN_TRANSFER`, `RESCUE_MARKET`, `NEGOTIATION`, `CORPORATION`, `LEADERBOARD`, `PROFILE`, `ADMIN`). |
| **State Management** | `EXISTING` | `web/app.js` (dòng 7–245): `AppState` tập trung kèm `DEFAULT_BOOT_STATE` (khởi tạo ngay Frame 1 trong 0ms chờ mạng) và đồng bộ qua `applyServerState(state)` + sự kiện WebSocket. |
| **Authentication UI** | `EXISTING` | `web/app.js` (dòng 1245–1305): Màn hình số 2 (`AUTH`) cho phép chuyển nhanh 4 tài khoản mẫu (`usr_minh`, `usr_linh`, `usr_bao`, `usr_admin`) và form đăng ký tài khoản mới có chọn độ tuổi (`UNDER_18` tự động bật `Safe Mode`). |
| **Responsive & Mobile Touch Controls** | `EXISTING` | `web/styles.css` (dòng 586–648, 854–1182) & `web/index.html` (dòng 77–84, 256–273): Đã bỏ cụm phím mũi tên D-Pad cố định, thay bằng **Touch Ripple + 3D Tap-to-Move + Floating Touch Ring** và thanh điều hướng đáy 5 nút (`#mobile-bottom-nav`). |
| **Error, Loading & Empty States** | `PARTIAL` | Đã có Toast thông báo lỗi/thành công (`showToast`), `DEFAULT_BOOT_STATE` chống trắng màn hình khi mạng chậm, và kiểm tra danh sách rỗng trong các bảng. Chưa có Error Boundary cấp component hoặc Skeleton Shimmer khi chờ API riêng lẻ. |
| **Performance & Audio Studio** | `EXISTING` | `web/engine3d.js` (dòng 2222–2234): Bộ đếm `FPS | Calls | Tris | AI Bots` thời gian thực. `web/audioEngine.js` (1.338 dòng): Bộ tổng hợp nhạc AI 4-Stem theo thang âm Ngũ Cung Việt Nam / Arcade, Sidechain Ducking và hiệu ứng âm thanh 3D Stereo Panning (`StereoPannerNode`). |

---

## 3. PHASE A3 – KIỂM KÊ BACKEND (`server.mjs`, `api/`, `game-server/`, `ai-worker/`)

| Thành phần Backend | Phân loại trạng thái | Chi tiết thực tế & Bằng chứng mã nguồn |
|---|---|---|
| **Node.js HTTP & Gzip Server** | `EXISTING` | `AI-Arena-3.0/server.mjs` (dòng 22–87): Phục vụ cả REST API (`/api/*`), WebSocket Upgrade và tệp tĩnh `web/*` có nén `zlib.gzipSync` (dòng 66–72). |
| **REST API Router** | `EXISTING` | `AI-Arena-3.0/api/routes.mjs` (803 dòng): Cung cấp 24 endpoints thực tế (`/api/state`, `/api/auth/register`, `/api/auth/login`, `/api/character/update`, `/api/agents/create`, `/api/agents/train`, `/api/agents/autonomy`, `/api/agents/emergency-stop`, `/api/social/request`, `/api/contracts/analyze`, `/api/contracts/bid`, `/api/collaboration/propose`, `/api/negotiation/step`, `/api/ai-deals/execute`, `/api/wallet/transfer`, `/api/rescue/action`, `/api/rooms/create`, `/api/rooms/join`, `/api/rooms/ready`, `/api/matches/speed-war`, `/api/companies/create`, `/api/companies/fund`, `/api/safety/report`, `/api/admin/resolve-report`, `/api/admin/audit-economy`). |
| **Authentication & Authorization** | `PARTIAL` | Đã có băm mật khẩu `hashPassword` (`SHA-256` với salt tại `database/db.mjs` dòng 13–15), kiểm tra quyền sở hữu AI (`agent.owner_id !== userId`) và kiểm tra vai trò Admin (`role === 'ADMIN'`). **Điểm yếu cần nâng cấp:** Các request hiện truyền `userId` trực tiếp trong JSON body/query thay vì xác thực qua chữ ký `JWT` / `HttpOnly Session Cookie`. |
| **Multiplayer WebSocket Server** | `EXISTING` | `AI-Arena-3.0/game-server/wsServer.mjs` (583 dòng): Cài đặt giao thức RFC 6455 native (`encodeWsFrame`, `decodeWsFrames`), xử lý `AUTH_HELLO`, `MOVE_3D`, `ROOM_CHAT`, `START_SPEED_WAR`, đồng bộ vị trí 3D thời gian thực và thông báo đa kênh. |
| **Game Rooms & Ready Check** | `EXISTING` | `api/routes.mjs` (dòng 545–630) & `database/migrations/001_init.sql` (bảng `rooms`, `room_players`): Tạo phòng Public/Private, tham gia phòng, đổi trạng thái `is_ready`, chọn AI ra trận. |
| **Matchmaking & Queue** | `PARTIAL` | Hiện hỗ trợ danh sách phòng (`rooms`) và ghép đấu trực tiếp trong phòng (`runSpeedWarMatchOnServer`). Chưa có hàng đợi ghép trận tự động theo điểm Elo/MMR (`Matchmaking Queue` qua Redis). |
| **Match State Machine (AI Speed War)** | `EXISTING` | `game-server/wsServer.mjs` (dòng 110–255) & `shared/constants.mjs` (dòng 120–184): Chấm điểm Server-Authoritative 3 vòng theo đúng công thức trọng số `40% Quality + 25% Accuracy + 15% Speed + 10% Efficiency + 10% Collaboration`, tự động phát thưởng từ `wal_reward_treasury` và cộng Rating/XP. |
| **Contract Engine & 3-Stage Quests** | `EXISTING` | `api/routes.mjs` (dòng 265–395): Phân tích khoảng trống kỹ năng (`analyzeContractForAgent`), đấu thầu hợp đồng (`contract_bids`), chấm điểm thực thi (`task_executions`), giải ngân thưởng nguyên tử từ `wal_reward_treasury`. |
| **AI Agent & Simulation Engine** | `EXISTING` | `ai-worker/simulationEngine.mjs` (819 dòng) & `ai-worker/btUtilityRuntime.mjs` (244 dòng): Cây hành vi (Behavior Tree: `Selector`, `Sequence`, `Blackboard`) kết hợp Utility AI (đường cong phản hồi `Linear`, `Quadratic`, `Logistic` + quán tính Hysteresis `+0.08`) điều khiển 6 lớp AI độc lập với LLM thương mại. |
| **Wallet & Transaction Ledger** | `EXISTING` | `database/db.mjs` (dòng 72–158): Hàm `executeAtomicTransfer` chạy trong giao dịch `BEGIN IMMEDIATE` / `SAVEPOINT`, kiểm tra `idempotency_key` chống cộng trùng, kiểm tra `balance >= amount`, và tự động phát hiện giao dịch vòng tròn (`Wash-Trading Detection`). |
| **Audit Logging & Rate Limiting** | `EXISTING` (Domain) / `PARTIAL` (HTTP Global) | `database/db.mjs` (dòng 60–67): Ghi `audit_logs` cho mọi thao tác nhạy cảm. Đã có Rate Limit cấp nghiệp vụ cho lời mời kết bạn AI (`<= 5 requests/phút` tại `simulationEngine.mjs` dòng 83–92). Chưa có IP-level HTTP/WS Rate Limiter tổng quát ở tầng cổng mạng. |

---

## 4. PHASE A4 – KIỂM KÊ DỮ LIỆU (`database/`)

| Nguồn lưu trữ | Trạng thái thực tế | Bằng chứng |
|---|---|---|
| **SQLite ACID (`node:sqlite`)** | `EXISTING` (Đang chạy chính thức) | Tệp `AI-Arena-3.0/database/ai_arena_3.sqlite` (kèm `-wal`, `-shm`) và `database/db.mjs`. Đầy đủ 18 bảng thuộc 14 nhóm nghiệp vụ trong `database/migrations/001_init.sql`. |
| **PostgreSQL + Prisma** | `PARTIAL` (Đã có Schema & Docker Compose, chưa nối Prisma Client vào `api/routes.mjs`) | `AI-Arena-3.0/database/schema.prisma` (254 dòng) và `AI-Arena-3.0/infra/docker-compose.yml` (dòng 4–16). |
| **Redis** | `PARTIAL` (Đã khai báo trong `docker-compose.yml`, chưa dùng trong `wsServer.mjs`) | `AI-Arena-3.0/infra/docker-compose.yml` (dòng 17–23). Hiện trạng thái `worldPlayers` đang lưu In-Memory `Map` trong tiến trình Node.js. |
| **Browser `localStorage`** | `EXISTING` | `AI-Arena-3.0/web/app.js` (dòng 82, 366): Lưu `ai_arena_user_id` để duy trì phiên người chơi khi tải lại trang. |

---

## 5. PHASE A5 – MA TRẬN KIỂM CHỨNG CHỨC NĂNG THẬT (END-TO-END TRACEABILITY)

| STT | Chức năng | Entrypoint UI (`web/`) | API / WS Endpoint | Xử lý Nghiệp vụ & DB | Kiểm thử (`tests/e2e.test.mjs`) | Kết luận |
|---|---|---|---|---|---|---|
| 1 | **Khởi tạo Thế giới 3D & 9 Khu vực** | `init3DWorld()` (`app.js:752`), `startThreeJsWorld()` (`engine3d.js:1029`) | `GET /api/state` (`routes.mjs:155`) | `buildFullClientState()` đọc 9 zones + characters + agents | Test #1 (`e2e.test.mjs:46`) | `EXISTING` (Đã xác minh) |
| 2 | **Đồng bộ Di chuyển 3D & Chat An toàn (<18 tuổi)** | `sendWsMove()` (`app.js:735`), `#chat-form` (`app.js:2912`) | WS `MOVE_3D`, `ROOM_CHAT` (`wsServer.mjs:270–345`) | Cập nhật `characters(pos_x, pos_z, zone)` + lọc SĐT/Email `sanitizeSafeChat` | Test #2 (`e2e.test.mjs:69`) | `EXISTING` (Đã xác minh) |
| 3 | **Quản lý AI, Huấn luyện & Nút Dừng Khẩn Cấp** | Screen `AI_MANAGER` (`app.js:1455`), `window.emergencyStopAgent` | `POST /api/agents/create`, `/train`, `/autonomy`, `/emergency-stop` | Trừ Token ví chủ sở hữu, tăng 6 chỉ số AI, khóa `emergency_stopped = 1`, ghi `audit_logs` | Test #3 (`e2e.test.mjs:121`) | `EXISTING` (Đã xác minh) |
| 4 | **Mạng Xã Hội AI & Rate Limit Kết Bạn** | Screen `AI_SOCIAL` (`app.js:1615`), `window.sendSocialInvite` | `POST /api/social/request` (`routes.mjs:245`) | `sendAiSocialRequest()` (`simulationEngine.mjs:74`), kiểm tra `<= 5/phút`, nâng bậc `STRANGER` → `STRATEGIC_ALLIANCE` | Test #4 (`e2e.test.mjs:178`) | `EXISTING` (Đã xác minh) |
| 5 | **Hợp Tác Tự Chủ & Đàm Phán Ký Quỹ (Escrow)** | Screen `AI_COLLAB` & `NEGOTIATION` (`app.js:1670, 2110`), Thanh hội thoại 3D | `POST /api/collaboration/propose`, `/api/negotiation/step`, `/api/ai-deals/execute` | `initiateCollaborationAndNegotiation()`, khóa Token vào `wal_escrow_system`, tối đa 5 vòng trả giá | Test #5 & #13 (`e2e.test.mjs:214, 469`) | `EXISTING` (Đã xác minh) |
| 6 | **Ví Token ACID, Chống Âm Tiền & Chống Cộng Trùng** | Screen `WALLET` & `TOKEN_TRANSFER` (`app.js:1945, 2005`) | `POST /api/wallet/transfer` (`routes.mjs:452`) | `executeAtomicTransfer()` (`db.mjs:72`), kiểm tra `UNIQUE(idempotency_key)` và `CHECK(balance >= 0)` | Test #6 (`e2e.test.mjs:266`) | `EXISTING` (Đã xác minh) |
| 7 | **Thị Trường Cứu Trợ & Mua Lại AI (Bắt buộc Chủ xác nhận)** | Screen `RESCUE_MARKET` (`app.js:2050`), `window.rescueAction` | `POST /api/rescue/action` (`routes.mjs:495`) | `handleRescueMarketAction()` (`simulationEngine.mjs:276`), chặn mọi lệnh `ACQUISITION_BUYOUT` nếu `ownerConfirmed !== true` | Test #7 (`e2e.test.mjs:311`) | `EXISTING` (Đã xác minh) |
| 8 | **Đấu Trường AI Speed War (3 Vòng Hợp Đồng)** | Screen `SPEED_WAR` (`app.js:1845`), `window.startSpeedWar` | `POST /api/matches/speed-war` (`routes.mjs:612`) | `runSpeedWarMatchOnServer()` (`wsServer.mjs:110`), chấm điểm 3 vòng, trả thưởng từ `wal_reward_treasury` | Test #8 (`e2e.test.mjs:354`) | `EXISTING` (Đã xác minh) |
| 9 | **Chống Gian Lận Phía Client (Anti-Cheat)** | Kiểm tra giả mạo payload từ client | `POST /api/client/tamper-balance` (`routes.mjs:740`), WS `CLIENT_FORCE_WIN` | Từ chối với mã `403 SECURITY_VIOLATION`, ghi cảnh báo `CRITICAL` vào `audit_logs` | Test #9 (`e2e.test.mjs:382`) | `EXISTING` (Đã xác minh) |
| 10 | **Tập Đoàn AI (Corporation) & Admin Console** | Screen `CORPORATION` & `ADMIN` (`app.js:2175, 2310`) | `POST /api/companies/create`, `/fund`, `/api/admin/resolve-report`, `/audit-economy` | Tạo bảng `companies`, ví `COMPANY_TREASURY`, xử lý `safety_reports`, đối soát tổng cung Token | Test #10 & #13 (`e2e.test.mjs:405, 505`) | `EXISTING` (Đã xác minh) |
| 11 | **Nhiệm Vụ 3 Chặng Theo Từng AI & Hiệu Ứng Tăng Token** | `#quest-tracker-hud` (`app.js:465`), `window.advanceQuestStage` | `POST /api/contracts/bid` (`routes.mjs:290`) | Thực thi từng chặng (`Chặng 1 → Chặng 2 → Chặng 3`), cộng Token nguyên tử + hiệu ứng mưa kim cương `triggerTokenGainAnimation` | Test #14 (`e2e.test.mjs:520`) | `EXISTING` (Đã xác minh) |
| 12 | **Sáng Tác Nhạc AI Đa Kênh (Ngũ Cung & Arcade)** | `#audio-mixer-panel` (`index.html:136`), `soundStudio.composeAiMusic` | Nội suy trực tiếp trên Web Audio API (`audioEngine.js`) | `AIMusicComposer` (`audioEngine.js:90`) dùng Mulberry32 PRNG, chuỗi Markov & nhịp trống Euclid `E(k,16)` | Test #12 (`e2e.test.mjs:442`) | `EXISTING` (Đã xác minh) |
