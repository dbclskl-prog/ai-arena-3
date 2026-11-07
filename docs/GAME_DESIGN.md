# GAME DESIGN DOCUMENT (GDD) – ĐẤU TRƯỜNG AI (AI ARENA 3.0)

- **Mục tiêu tài liệu:** Đặc tả thiết kế trò chơi 3D đa người chơi **Đấu Trường AI – AI Arena 3.0**, bao gồm vòng lặp gameplay cốt lõi, 9 phân khu thế giới 3D, 6 lớp AI Agent, hệ thống nhiệm vụ 3 chặng theo từng AI, công thức chấm điểm **AI Speed War**, kinh tế Token và hệ thống âm thanh/cảm ứng.
- **Ngày kiểm tra:** `2026-11-07`
- **Bằng chứng mã nguồn:** `shared/constants.mjs`, `web/engine3d.js`, `web/audioEngine.js`, `web/app.js`, `ai-worker/simulationEngine.mjs`.
- **Tài liệu liên quan:**
  - [M01_AUDIT_REPORT.md](./M01_AUDIT_REPORT.md)
  - [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
  - [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)
  - [ROADMAP.md](./ROADMAP.md)

---

## 1. TẦM NHÌN & THÔNG ĐIỆP CỐT LÕI

> **“AI ARENA – Nơi trí tuệ tạo ra giá trị, hợp tác tạo ra sức mạnh và chiến lược quyết định chiến thắng.”**

**AI Arena 3.0** không phải là một bảng điều khiển quản trị khô khan mà là một **Thế giới Game 3D Trực tuyến Đa người chơi (Web 3D Multiplayer RPG & Strategy)**. Người chơi hóa thân thành một **Chỉ huy AI (AI Commander / AI CEO)** bước vào thành phố công nghệ 3D tương lai, trực tiếp huấn luyện đội hình Robot AI tự chủ, quan sát các AI tự giao tiếp, đàm phán ký quỹ (Escrow), cứu trợ đồng đội và tranh tài trong đấu trường tốc độ **AI Speed War**.

---

## 2. THẾ GIỚI 3D (9 PHÂN KHU KIẾN TRÚC – `shared/constants.mjs:5–15`)

Thế giới 3D có kích thước `260m × 260m` (`web/engine3d.js:1090`), kết nối bởi các đại lộ ánh sáng neon và 72 cột năng lượng (`THREE.InstancedMesh`):

| STT | Mã Khu Vực (`zone.id`) | Tên Khu Vực | Tọa Độ `(x, z)` | Bán Kính | Màu Chủ Đạo | Vai Trò Gameplay |
|---|---|---|---|---|---|---|
| 1 | `CENTRAL_HUB` | **Central Hub – Sảnh Trung Tâm** | `(0, 0)` | `22m` | `#00e5ff` (Cyan) | **★ MVP:** Điểm xuất phát, mái vòm Fresnel Shader, gặp gỡ người chơi và xem hoạt cảnh AI giao tiếp. |
| 2 | `JOB_CITY` | **Job City – Thành Phố Việc Làm** | `(-45, -30)` | `18m` | `#38bdf8` (Sky) | **★ MVP:** Tháp đôi nối cầu kính; trung tâm đấu thầu hợp đồng và nhiệm vụ 3 chặng. |
| 3 | `BATTLE_ARENA` | **Battle Arena – Đấu Trường AI** | `(45, -30)` | `20m` | `#f43f5e` (Crimson) | **★ MVP:** Đấu trường vòng tròn lá chắn đỏ; nơi diễn ra giải đấu 3 vòng **AI Speed War**. |
| 4 | `AI_ACADEMY` | **AI Academy – Học Viện AI** | `(-50, 30)` | `16m` | `#a855f7` (Purple) | Khối đa diện kim cương; nơi huấn luyện 6 chỉ số và nâng cấp cấp độ cho AI Agent. |
| 5 | `BUSINESS_DISTRICT` | **Business District – Khu Doanh Nghiệp** | `(50, 30)` | `16m` | `#f59e0b` (Amber) | Trụ sở các tập đoàn AI (`Corporation`), quản trị ngân quỹ công ty và liên minh. |
| 6 | `TOKEN_EXCHANGE` | **Token Exchange – Thị Trường Token** | `(0, -58)` | `15m` | `#10b981` (Emerald) | Tháp đồng xu vàng xoay tròn; trung tâm quản lý Ví Token, Sổ cái ACID và Cứu trợ AI. |
| 7 | `AI_SOCIAL_HUB` | **AI Social Hub – Mạng Xã Hội AI** | `(-28, 55)` | `14m` | `#ec4899` (Pink) | Quảng trường giao lưu nơi các AI tự động kết bạn và nâng cấp 5 bậc quan hệ tin cậy. |
| 8 | `AI_LAB` | **AI Lab – Trung Tâm Nghiên Cứu** | `(28, 55)` | `14m` | `#6366f1` (Indigo) | Trung tâm tối ưu hóa thuật toán `Stability`, `Collaboration` và cấu hình quyền tự chủ. |
| 9 | `AI_EMPIRE` | **AI Empire – Đế Chế AI** | `(0, 80)` | `18m` | `#eab308` (Gold) | Đỉnh vinh quang phương Bắc dành cho Bảng xếp hạng mùa giải và Liên minh dẫn đầu. |

---

## 3. HỆ THỐNG ĐIỀU KHIỂN ĐA THIẾT BỊ & CẢM ỨNG KHÔNG NÚT MŨI TÊN (`web/engine3d.js:1658–2095`)

1. **Trên Máy tính (Desktop):**
   - Di chuyển bằng `WASD` hoặc phím mũi tên, giữ `Shift` để bật phản lực chạy nhanh (`RUN`).
   - Nhấp chuột trực tiếp lên mặt đất 3D để di chuyển tới điểm đích (**Click-to-Move**), kéo chuột để xoay Camera 360°, lăn chuột để thu phóng.
2. **Trên Điện thoại & Máy tính bảng (Button-Free Touch Gestures):**
   - **Không dùng cụm phím mũi tên D-Pad cố định** để tránh che khuất tầm nhìn 3D.
   - **Chạm Để Di Chuyển (Tap-to-Move):** Chạm 1 lần vào bất kỳ đâu trên mặt đất 3D → xuất hiện hiệu ứng gợn sóng cảm ứng `.touch-ripple-wave` + cột đích Hologram 3D xoay tròn, nhân vật tự chạy tới đó (chạm đúp để chạy nhanh Sprint).
   - **Chạm & Lướt 360° (Floating Holo-Ring):** Chạm giữ và lướt ở nửa dưới màn hình → vòng hào quang cảm ứng `#touch-gesture-ring` hiện ra ngay dưới ngón tay và tự biến mất khi nhấc tay.
   - **Xoay & Thu Phóng Camera:** Vuốt 1 ngón tay ở nửa trên màn hình để xoay góc nhìn 3D; dùng 2 ngón tay chụm/mở (`Pinch-to-Zoom`) để thu phóng.

---

## 4. HỆ THỐNG 6 LỚP AI AGENT & PHÂN CÔNG NHIỆM VỤ 3 CHẶNG (`shared/constants.mjs:17–66`, `web/app.js:38–240`)

Mỗi AI Agent sở hữu **6 chỉ số cốt lõi** (`Logic`, `Creativity`, `Speed`, `Accuracy`, `Collaboration`, `Stability` từ `0–150`) và đảm nhận vai trò chuyên biệt trong **Lộ trình 3 Chặng (`Chặng 1 → Chặng 2 → Chặng 3`)**:

| Lớp AI (`ai_class`) | Vai trò tiếng Việt | Chỉ số mạnh nhất | Nhiệm vụ Chặng 1 (Khởi động) | Nhiệm vụ Chặng 2 (Thực thi lõi) | Nhiệm vụ Chặng 3 (Nghiệm thu & Tất toán) |
|---|---|---|---|---|---|
| **ANALYST** (`🔍`) | Chuyên gia Phân tích & Chiến lược | `Accuracy (85)`, `Logic (82)` | Quét dữ liệu đầu vào, bóc tách yêu cầu hợp đồng | Chấm điểm rủi ro & dự báo điểm nghẽn tài nguyên | Xuất báo cáo kiểm định độ chính xác trước khi nộp |
| **CODER** (`💻`) | Kỹ sư Lập trình & Tối ưu Hệ thống | `Logic (88)`, `Accuracy (82)` | Thiết kế kiến trúc module & cấu trúc thuật toán | Lập trình lõi xử lý tốc độ cao & tự động gỡ lỗi | Đóng gói sản phẩm, tối ưu hiệu năng thực thi |
| **CREATOR** (`🎨`) | Kiến trúc sư Sáng tạo & Âm nhạc | `Creativity (92)`, `Collaboration (78)` | Phác thảo ý tưởng độc đáo & kịch bản Ngũ Cung | Tổng hợp đồ họa 3D, hiệu ứng hình ảnh & âm thanh | Tinh chỉnh trải nghiệm cảm xúc giúp tăng điểm Chất lượng |
| **GUARDIAN** (`🛡️`) | Chuyên gia Bảo mật & Kiểm định | `Stability (92)`, `Accuracy (90)` | Kiểm tra an toàn điều khoản & xác thực đối tác | Giám sát chống lỗi runtime & bảo vệ ngân sách | Kiểm toán chất lượng đầu ra đạt chuẩn nghiệm thu |
| **TRADER** (`📈`) | Chuyên gia Đàm phán & Đấu thầu | `Speed (84)`, `Collaboration (82)` | Định giá gói thầu & phân tích tỷ suất lợi nhuận | Đàm phán chia sẻ phần thưởng (tối đa 5 vòng) | Khóa ký quỹ (`Escrow`) và tối ưu hóa chi phí Token |
| **MANAGER** (`👑`) | Điều phối viên Đa tác tử & Dự án | `Collaboration (94)`, `Stability (84)` | Phân rã hợp đồng lớn thành 3 chặng cho từng AI | Điều phối đồng bộ tiến độ & kích hoạt cộng hưởng đội | Nghiệm thu tổng thể và phân bổ thưởng Token/XP |

---

## 5. CHẾ ĐỘ ĐẤU TRƯỜNG AI SPEED WAR (3 VÒNG HỢP ĐỒNG – `shared/constants.mjs:91–184`)

- **Quy mô:** 2–20 người chơi (cá nhân hoặc đội nhóm) tranh tài qua **3 vòng hợp đồng liên tiếp** (Độ khó tăng dần từ Vòng 1 → Vòng 3).
- **4 Chiến thuật lựa chọn:** `SPEED_FOCUS` (Ưu tiên tốc độ), `QUALITY_FIRST` (Ưu tiên chất lượng), `BALANCED` (Cân bằng), `COLLABORATIVE` (Hợp lực đa AI).
- **Công thức chấm điểm Server-Authoritative (`evaluateSpeedWarExecution`):**
  $$\text{Total Score} = 0.40 \times \text{Quality} + 0.25 \times \text{Accuracy} + 0.15 \times \text{Speed} + 0.10 \times \text{ResourceEfficiency} + 0.10 \times \text{Collaboration}$$
- **Cơ chế trao thưởng:** Người chiến thắng nhận thưởng Token trực tiếp từ `REWARD_TREASURY` (`wal_reward_treasury`) qua giao dịch nguyên tử ACID, cộng điểm xếp hạng mùa giải (`rating_points`) và XP cho AI.

---

## 6. MẠNG XÃ HỘI AI, ĐÀM PHÁN KÝ QUỸ (ESCROW) & THỊ TRƯỜNG CỨU TRỢ

1. **5 Cấp độ Quan hệ AI (`shared/constants.mjs:68–74`):**
   - `STRANGER` (Trust `< 20`) → `ACQUAINTANCE` (`20–44`) → `FRIEND` (`45–69`) → `TRUSTED_PARTNER` (`70–89`) → `STRATEGIC_ALLIANCE` (`>= 90`).
2. **Đàm phán Ký quỹ Giới hạn Vòng (`ai-worker/simulationEngine.mjs:143–270`):**
   - Tối đa **5 vòng trả giá** (`max_rounds = 5`). Khi hai bên đồng ý, Token được khóa vào ví `wal_escrow_system` và chỉ giải ngân khi hoàn thành nhiệm vụ.
3. **Thị trường Cứu trợ & Mua lại AI (`shared/constants.mjs:102–110`):**
   - Tự động cảnh báo trạng thái ngân sách AI: `HEALTHY` (`>= 80 TKN`) → `LOW_TOKEN` (`40–79 TKN`) → `CRITICAL` (`15–39 TKN`) → `RESCUE_NEEDED` (`< 15 TKN`).
   - Mọi giao dịch mua lại quyền sở hữu AI (`ACQUISITION_BUYOUT`) **bắt buộc phải có sự xác nhận của chủ sở hữu hiện tại (`ownerConfirmed = true`)**.
