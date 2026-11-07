# HƯỚNG DẪN TRIỂN KHAI & VẬN HÀNH – AI ARENA 3.0

## 1. Yêu cầu Hệ thống

- **Node.js:** `>= 22.5.0` (Đang vận hành trên **Node.js v24.14.1** với `node:sqlite` ACID tích hợp và `WebSocket` chuẩn RFC 6455).
- **Trình duyệt hỗ trợ:** Chrome, Edge, Firefox, Safari (PC, Tablet, Mobile Android/iOS).

## 2. Các Lệnh Khởi Chạy & Kiểm Thử

Tại thư mục `AI-Arena-3.0`:

```powershell
# 1. Khởi tạo cơ sở dữ liệu 14 nhóm bảng và dữ liệu mẫu (Seed Data)
npm run seed

# 2. Chạy bộ kiểm thử tự động End-to-End (12 bài kiểm thử nghiệm thu thực tế)
npm test

# 3. Khởi động Server (Web 3D Client + REST API + Multiplayer WebSocket)
npm start
```

Sau khi chạy `npm start`, truy cập:
- **Giao diện Thế giới 3D & 19 Màn hình chức năng:** `http://localhost:3300`
- **WebSocket Multiplayer Endpoint:** `ws://localhost:3300`

## 3. Tài Khoản Thử Nghiệm Có Sẵn (Seed Accounts)

| Username | Vai trò | Đặc điểm |
|---|---|---|
| `minh_ai` (`usr_minh`) | `COMPANY_OWNER` (AI CEO) | Sở hữu `Athena-X9 (Analyst)` & `DevZero-7 (Coder)`, Chủ tịch `Sky-Line AI Pioneers Corp` |
| `lan_strat` (`usr_lan`) | `TEAM_LEADER` (AI Manager) | Sở hữu `NovaMuse (Creator)` & `AegisShield (Guardian - Đang ở trạng thái cần cứu trợ 12 TKN)` |
| `khoa_hs` (`usr_khoa`) | `PLAYER` (Học sinh THPT <18 tuổi) | Tự động bật `Safe Mode` bảo vệ thông tin cá nhân & lọc ngôn từ chat |
| `admin` (`usr_admin`) | `ADMIN` (Tổng Chỉ Huy) | Quyền truy cập đầy đủ Admin Console, kiểm toán sổ cái Token và xử lý báo cáo an toàn |
