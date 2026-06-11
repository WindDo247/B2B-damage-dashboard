# 📘 Hướng Dẫn Sử Dụng — B2B Damage Analysis Dashboard

## 1. Đăng Nhập
- Đăng nhập bằng tài khoản Google (@ghn.vn)
- Tài khoản phải nằm trong danh sách whitelist (kiểm tra server-side)
- Session tự hết hạn sau 24 giờ → cần đăng nhập lại
- Logout sẽ xóa toàn bộ dữ liệu trong trình duyệt

## 2. Giao Diện Chính
Gồm 4 tab chính trong sidebar:
- 📡 **Collect Data** — Thu thập dữ liệu
- 🔀 **Mapping Table** — Bảng dữ liệu đã mapping
- 📊 **Dashboard** — Biểu đồ phân tích
- 💡 **Insights & Alerts** — Báo cáo thông minh

## 3. Tab Collect Data
- Dữ liệu tự động sync từ Google Sheets API khi đăng nhập
- 4 nguồn dữ liệu:
  1. Data Hư Hỏng (Damage) — sheet chính chứa đơn hàng
  2. Keyword Map — bảng từ khóa → nhãn (damage/Khác)
  3. Danh sách KTC/KCT — mapping kho
  4. Data Đơn Lấy (Pickup) — dữ liệu sản lượng lấy hàng
- Thanh progress bar hiển thị tiến trình tải
- Nút "Xử Lý Dữ Liệu" sáng khi 3 file đầu tải xong
- ✅ Tự động đồng bộ mỗi 60 phút (bật/tắt bằng checkbox)

## 4. Tab Dashboard
### 4.1 KPI Cards (3 thẻ)
| Icon | Thẻ | Ý nghĩa |
|------|------|----------|
| 📦 | Tổng Đơn Lấy | Tổng pickup từ tất cả kho |
| 💥 | Tổng Đơn Bể Vỡ | Đơn được label "damage" (unique order_code) |
| 📊 | Tỷ lệ bể vỡ | = Đơn Bể Vỡ / Đơn Lấy × 100% |

### 4.2 Bộ lọc toàn cục
- Multi-select dropdown: Tuần, Khách hàng, Ngành hàng
- Chọn/bỏ chọn → tất cả biểu đồ + KPI cập nhật real-time

### 4.3 Biểu đồ (8 loại)
1. Sản Lượng Đơn Lấy Theo Ngày (bar chart)
2. Xu Hướng Bể Vỡ (Damage Rate %) — line chart theo tuần
3. Top KTC Nhiều Đơn Hư Hỏng (absolute) — bar chart
4. Top KTC Tỷ Lệ Hư Hỏng Cao (rate %) — bar chart
5. Top Kho GXT Nhiều Đơn Hư Hỏng (absolute) — bar chart
6. Top Kho GXT Tỷ Lệ Hư Hỏng Cao (rate %) — bar chart
7. Phân Loại Hư Hỏng — doughnut chart
8. Đơn Lấy Theo Khách Hàng — bar chart

- Hover tooltip hiển thị số tuyệt đối + tỷ lệ
- Click vào bar/segment → cross-filter toàn dashboard
- Click lại hoặc click biểu đồ khác → reset filter

### 4.4 Bảng Chi Tiết
- Click header cột → sắp xếp tăng/giảm
- Nút "📥 Xuất CSV" để export
- Phân trang (20 dòng/trang)

## 5. Tab Mapping Table
- Hiển thị toàn bộ dữ liệu đã mapping (label, keyword hit, KTC...)
- Lọc theo từng cột (dropdown Excel-style)
- Sắp xếp, phân trang
- Dữ liệu tự động push ngược về Google Sheet "Mapped"

## 6. Tab Insights & Alerts
- Báo cáo AI tự động: tổng hợp xu hướng, top KTC/GXT, cảnh báo
- Nút "Xuất Báo Cáo PDF" để tải về

## 7. Cơ Chế Nhận Dạng Cột (Dual-Scan)
- Quét header: tìm cột chứa keyword "mã đơn", "loại lỗi", "chi tiết"...
- Quét nội dung: nếu header không rõ, dò pattern trong dữ liệu
- Hỗ trợ nhiều tên cột khác nhau

## 8. Logic Nhận Dạng Damage
- Gom tất cả dòng cùng order_code → ghép text Type + Detail
- Normalize: NFC + lowercase + fix typo tiếng Việt (VD: "Uớt"→"ướt")
- Match keyword (ưu tiên dài nhất trước)
- Chỉ đếm label "damage", mỗi order_code đếm 1 lần

## 9. Xử Lý Sự Cố
| Vấn đề | Giải pháp |
|--------|----------|
| Timeout 15s khi tải API | Thử lại hoặc kiểm tra kết nối |
| Session hết hạn | Đăng nhập lại (tự động sau 24h) |
| Dữ liệu cũ | Bật auto-sync hoặc reload trang |
| Biểu đồ trống | Kiểm tra bộ lọc + chờ pickup data tải xong |
| Debug đơn hàng | F12 → Console → gõ debugOrder('MÃ_ĐƠN') |
