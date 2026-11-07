# ROBLOX SKILLS MAPPING – CHUYỂN ĐỔI NGUYÊN TẮC SANG AI ARENA 3.0 (WEB 3D)

- **Mục tiêu tài liệu:** Nghiên cứu hệ thống kỹ năng phát triển game từ `https://github.com/AshExplained/roblox-skills` và bộ kỹ năng `.agents/skills/roblox-*` trong workspace, phân loại và ánh xạ các nguyên tắc kỹ thuật cốt lõi sang kiến trúc **Web 3D (React/ESM + Three.js + Node.js + WebSocket + SQLite/PostgreSQL)** của **AI Arena 3.0**.
- **Ngày kiểm tra:** `2026-11-07`
- **Cam kết nền tảng:** **Tuyệt đối không dùng Luau hay Roblox Studio API**. Chỉ trích xuất các mẫu thiết kế hệ thống (Server Authority, Economy Pacing, Safe UI Insets, Replaceable Character Lifecycle, Playtest Verification) sang Web 3D.
- **Tài liệu liên quan:**
  - [M01_AUDIT_REPORT.md](./M01_AUDIT_REPORT.md)
  - [5D_METHOD_MAPPING.md](./5D_METHOD_MAPPING.md)
  - [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)

---

## 1. PHÂN LOẠI CÁC NHÓM ROBLOX SKILLS (CLASSIFICATION)

Theo tiêu chuẩn Phase B1:
- **A – Directly Adaptable:** Áp dụng trực tiếp quy trình, công thức toán học và tiêu chuẩn kiểm thử.
- **B – Requires Translation:** Giữ nguyên kiến trúc bảo mật/luồng dữ liệu nhưng chuyển đổi API từ Roblox sang Web 3D (Three.js + WebSocket + SQL).
- **C – Reference Only:** Tham khảo tư duy tổ chức vòng đời sản phẩm.
- **D – Not Applicable:** Đặc thù riêng của Roblox Studio / Luau / Rojo, không áp dụng cho Web 3D.

| STT | Tên Skill (`AshExplained/roblox-skills` & `.agents/skills/roblox-*`) | Phân loại | Lý do phân loại |
|---|---|---|---|
| 1 | `roblox-game-development-lifecycle` | **A – Directly Adaptable** | Quy trình điều phối từ PRD → Vertical Slice → Playtest → Live Ops áp dụng trực tiếp cho lộ trình M01–M10. |
| 2 | `roblox-to-prd` & `roblox-to-issues` | **A – Directly Adaptable** | Chuyển hóa ý tưởng gameplay thành PRD có công thức định lượng và chia nhỏ thành Vertical Slice Issues (`VS01`–`VS14`). |
| 3 | `roblox-triage` | **A – Directly Adaptable** | Phân loại lỗi theo mức độ nghiêm trọng (`P0 Blocker` → `P3 Enhancement`) kèm bằng chứng tái hiện lỗi. |
| 4 | `roblox-world-level-design` | **B – Requires Translation** | Nguyên tắc thiết kế Sảnh Trung Tâm (`Hub & Spoke`), khoảng cách di chuyển và điểm thu hút thị giác (`Landmarks`) chuyển sang `Three.js Scene`. |
| 5 | `roblox-asset-pipeline` | **B – Requires Translation** | Ngân sách đa giác (Triangle Budget), nén texture và Instancing chuyển sang `THREE.InstancedMesh` & `GLTFLoader`. |
| 6 | `roblox-game-ux` & `roblox-ui-implementation` (`.agents/skills/roblox-ui/SKILL.md`) | **B – Requires Translation** | Nguyên tắc `CoreUISafeInsets`, không để HUD che tầm nhìn 3D, điều khiển cảm ứng đa điểm chuyển sang CSS `env(safe-area-inset-*)` và Touch Gesture Ring. |
| 7 | `roblox-characters` (`.agents/skills/roblox-characters/SKILL.md`) | **B – Requires Translation** | Tách biệt danh tính bền vững (`Player/User`) với phiên thực thể 3D (`Character Mesh/Rig`), quản lý vòng đời animation sạch sẽ khi chuyển khu vực. |
| 8 | `roblox-physics` (`.agents/skills/roblox-physics/SKILL.md`) | **B – Requires Translation** | Phân biệt rõ chuyển động trang trí (client-only) với truy vấn va chạm có thẩm quyền (`Raycaster` / `Distance Check` trên server). |
| 9 | `roblox-social-systems` | **B – Requires Translation** | Hệ thống kết bạn có giới hạn tần suất (Rate Limit), bậc tin cậy (`Trust Score`) và bộ lọc chat an toàn cho người dưới 18 tuổi. |
| 10 | `roblox-quest-progression-systems` | **A – Directly Adaptable** | Cấu trúc nhiệm vụ đa chặng (`Chặng 1 → Chặng 2 → Chặng 3`), hiển thị rõ phần thưởng và phản hồi tức thì khi hoàn thành từng chặng. |
| 11 | `roblox-economy-balancing` (`.agents/skills/roblox-simulator-economy/SKILL.md`) | **A – Directly Adaptable** | Công thức chi phí nâng cấp theo cấp số nhân `floor(baseCost * costGrowth ^ level)`, kiểm soát lạm phát (`Token Faucets vs Sinks`). |
| 12 | `roblox-security-economy` & `roblox-networking` (`.agents/skills/roblox-networking/SKILL.md`) | **B – Requires Translation** | Nguyên tắc tối thượng: **Never trust the client**; client chỉ gửi `intent` (ý định), Server kiểm tra quyền, cooldown, số dư và thực thi giao dịch nguyên tử. |
| 13 | `roblox-datastores` (`.agents/skills/roblox-datastores/SKILL.md`) | **B – Requires Translation** | Thay `UpdateAsync` bằng giao dịch ACID SQL (`BEGIN IMMEDIATE` / `SAVEPOINT`) + `idempotency_key`; không bao giờ ghi đè dữ liệu mặc định khi đọc lỗi. |
| 14 | `roblox-performance-optimization` | **A – Directly Adaptable** | Giám sát `FPS`, `Draw Calls`, `Triangles`, gộp geometry (`InstancedMesh`) và nén gói tin mạng. |
| 15 | `roblox-playtest-qa` & `roblox-mobile-playtest` | **B – Requires Translation** | Kiểm thử đa người chơi đồng thời, kiểm thử giả mạo gói tin và kiểm thử khung nhìn dọc trên điện thoại di động. |
| 16 | `roblox-code-maintenance-refactor` & `roblox-release-operations` | **A – Directly Adaptable** | Tách ranh giới module rõ ràng, kiểm tra E2E trước khi phát hành và quy trình rollback an toàn. |
| 17 | `roblox-luau` & `roblox-studio-workflow` | **D – Not Applicable** | Cú pháp Luau, `Instance.new`, Rojo sourcemap và Roblox Studio Explorer không áp dụng cho Web 3D. |

---

## 2. BẢNG ÁNH XẠ CHI TIẾT SANG AI ARENA 3.0 (PHASE B2 MAPPING MATRIX)

| Skill Name | Source File | Nguyên tắc cốt lõi (Core Principle) | Roblox-Specific Scope | Web 3D Equivalent (AI Arena 3.0) | AI Arena Module | Phương pháp triển khai (Implementation Approach) | Risk | Priority | Acceptance Criteria |
|---|---|---|---|---|---|---|---|---|---|
| `roblox-networking` / `roblox-security-economy` | `.agents/skills/roblox-networking/SKILL.md` (dòng 28–58) | Client chỉ gửi `Intent` (ID hợp đồng, hướng di chuyển); Server quyết định toàn bộ số dư, điểm số và kết quả. | `RemoteEvent:FireServer`, kiểm tra `typeof(arg)` và khoảng cách `Character`. | REST API (`api/routes.mjs`) + RFC 6455 WebSocket (`game-server/wsServer.mjs`). | **M01, M03, M06** | Mọi gói tin giả mạo số dư (`tamper-balance`, `CLIENT_FORCE_WIN`) bị chặn với mã `403 SECURITY_VIOLATION` và ghi vào `audit_logs`. | Cao | **P0** | Test #9 trong `tests/e2e.test.mjs` chặn 100% hành vi client tự cộng Token hoặc tự nhận thắng. |
| `roblox-datastores` | `.agents/skills/roblox-datastores/SKILL.md` (dòng 35–47) | Cập nhật nguyên tử Read-Modify-Write (`UpdateAsync`), chống mất dữ liệu khi rời phòng/tắt server. | `DataStoreService:UpdateAsync`, `OrderedDataStore`. | Giao dịch SQLite ACID (`runInTransaction` với `SAVEPOINT` tại `database/db.mjs`) & bảng `rankings`. | **M01, M06** | Sử dụng `executeAtomicTransfer` có khóa `UNIQUE(idempotency_key)` và ràng buộc `CHECK(balance >= 0)`. | Cao | **P0** | Test #6 chứng minh gửi trùng `idempotencyKey` hoặc chuyển quá số dư đều bị chặn an toàn. |
| `roblox-simulator-economy` | `.agents/skills/roblox-simulator-economy/SKILL.md` (dòng 34–60) | Cân bằng kinh tế bằng bảng tham số tập trung (`baseCost * costGrowth ^ level`) trước khi viết code. | ModuleScript `economy_math.luau` + Lune CLI. | `shared/constants.mjs` & `api/routes.mjs` (chi phí huấn luyện AI tăng theo cấp độ `40 + level * 15`). | **M04, M06** | Cân bằng giữa nguồn sinh Token (`Contract Rewards`, `Speed War`) và nguồn tiêu thụ Token (`AI Training`, `Agent Creation`, `Escrow`). | Trung bình | **P1** | Đối soát tổng cung Token qua `/api/admin/audit-economy` luôn khớp 100% với sổ cái. |
| `roblox-ui` & `roblox-mobile-playtest` | `.agents/skills/roblox-ui/SKILL.md` (dòng 28–53) | Tôn trọng vùng an toàn (`Safe Insets`), không để nút điều khiển che khuất thế giới 3D trên màn hình dọc. | `ScreenGui.ScreenInsets = CoreUISafeInsets`, `UDim2`, `Activated`. | CSS `env(safe-area-inset-*)`, `#mobile-bottom-nav`, **Tap-to-Move 3D Beacon** & **Floating Touch Ring** (`web/engine3d.js`). | **M02** | Loại bỏ cụm phím mũi tên D-Pad cố định; dùng cảm ứng chạm điểm đích 3D + vòng cảm ứng ẩn/hiện động dưới ngón tay. | Thấp | **P1** | Hiển thị gọn gàng trên màn hình dọc iPhone (`<= 480px`), không chồng lấp HUD. |
| `roblox-characters` | `.agents/skills/roblox-characters/SKILL.md` (dòng 26–45) | Tách biệt `Player` (tài khoản bền vững) và `Character` (mô hình 3D trong thế giới); dọn dẹp tài nguyên khi đổi trạng thái. | `Players.PlayerAdded`, `CharacterAdded`, `Humanoid`, `Animator`. | Bảng `users` tách biệt với bảng `characters`; bộ đồng bộ `syncPlayerHeroes()` trong `web/engine3d.js` (dòng 1179–1220). | **M02, M03** | Tự động tạo/xóa `THREE.Group` trong `heroMeshes` theo danh sách `worldPlayers` và cập nhật hoạt ảnh `IDLE/WALK/RUN/INTERACT`. | Thấp | **P1** | Chuyển đổi tài khoản hoặc nhiều người chơi di chuyển cùng lúc không rò rỉ bộ nhớ WebGL. |
| `roblox-quest-progression-systems` | `AshExplained/roblox-skills` (`quest-progression`) | Chia nhiệm vụ lớn thành từng chặng rõ ràng, gắn liền với phần thưởng và phản hồi thị giác/âm thanh tức thì. | Quest Tracker GUI + Server Quest Service. | Hệ thống `AppState.quests` 3 chặng (`Chặng 1 → Chặng 2 → Chặng 3`) gắn với từng AI Agent cụ thể (`web/app.js` dòng 38–240). | **M04, M05** | Mỗi chặng ghi rõ tên AI phụ trách, nhiệm vụ cụ thể và thưởng Token riêng; bấm hoàn thành kích hoạt mưa Token 3D + âm thanh fanfare. | Thấp | **P1** | Người chơi nhìn thấy ngay lộ trình 3 chặng trên cả HUD 3D và trong màn hình Quản lý AI / Thị trường. |
| `roblox-social-systems` | `AshExplained/roblox-skills` (`social-systems`) | Mạng xã hội trong game phải có kiểm duyệt nội dung trẻ em (`Safe Chat`) và giới hạn tần suất chống spam. | `TextChatService`, `PolicyService` cho người chơi `<13/<18`. | `sanitizeSafeChat()` (`wsServer.mjs` dòng 98–105) + Rate Limit kết bạn AI (`simulationEngine.mjs` dòng 83–92). | **M03, M07** | Tự động ẩn số điện thoại, email, từ ngữ xấu trong Room Chat và chặn spam lời mời kết bạn quá 5 lần/phút. | Trung bình | **P1** | Test #2 và Test #4 xác nhận lọc sạch SĐT và chặn request thứ 6 trong cùng 1 phút. |
