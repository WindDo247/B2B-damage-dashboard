# Hướng Dẫn Sử Dụng B2B Logistics Dashboard

Chào mừng bạn đến với tài liệu hướng dẫn sử dụng Hệ thống B2B Logistics Dashboard. Công cụ này được thiết kế đặc biệt dành riêng cho việc phân tích, thống kê tỉ lệ bể vỡ/hư hỏng hàng điện máy.

---

## 1. Tổng Quan Giao Diện
Công cụ bao gồm hai thẻ (Tab) chính nằm ở cột điều hướng bên trái:
- **Nhập Dữ Liệu:** Nơi bạn cung cấp các file dữ liệu đầu vào.
- **Dashboard & Report:** Nơi hệ thống hiển thị biểu đồ phân tích và bảng dữ liệu chuyên sâu.

---

## 2. Quy Trình Nhập Dữ Liệu Đầu Vào

Hệ thống yêu cầu 3 nguồn dữ liệu bắt buộc:
1. **File Database Tổng (Data):** File chứa toàn bộ đơn hàng và thông tin vận hành (có các cột mã đơn, tuần, loại hư hỏng, chi tiết lỗi, v.v.).
2. **File Mapping Keyword:** Chứa từ khóa để hệ thống tự động nhận diện và gán nhãn (Label) cho các lỗi (ví dụ: "rách", "móp", "bể").
3. **Danh Sách Kho GXT & KTC:** Chứa cấu trúc mạng lưới (Kho Giao và các Kho Trung Chuyển liền kề trước đó).

### 2.1 Cách thức tải dữ liệu
Tại mỗi ô tương ứng, bạn có 2 cách tải dữ liệu:
- **Tải File:** Bấm **"Chọn File"** và trỏ đến file `.csv` hoặc `.xlsx` trên máy tính.
- **Nhập Link:** 
  - Chuyển sang Tab "Nhập Link" và dán đường dẫn Google Sheets/Google Drive vào. 
  - (Lưu ý: Link Google cần được mở quyền chia sẻ *"Bất kỳ ai có đường liên kết - Anyone with the link"*).
  - Bấm **"Tải Link"**. Hệ thống sẽ tự động lưu lại link này để tự động điền trong các lần sử dụng tiếp theo.

### 2.2 Xử lý dữ liệu
Sau khi cả 3 ô đều hiện trạng thái màu xanh (Đã tải xong), nút **"Xử Lý Dữ Liệu"** sẽ sáng lên.
- Bấm vào **Xử Lý Dữ Liệu**. Hệ thống sẽ tự động tổng hợp, dọn dẹp data và tự động chuyển trang sang phần Báo Cáo.

---

## 3. Khai Thác Dashboard & Báo Cáo

Giao diện báo cáo được chia làm 3 phần chính:

### Phần 1: Biểu Đồ Thống Kê (Dashboard)
- **Biểu đồ Đường (Xu Hướng Hư Hỏng):** Hiển thị số lượng lỗi phát sinh theo từng tuần vận hành.
- **Top 10 KTC/KCT & Top 10 Kho Giao:** 
  - Chỉ lọc và hiển thị những đơn vị phát sinh nhóm lỗi có chứa từ khóa **"damage"**.
  - Bạn có thể dùng bộ lọc **"Chọn Tuần"** ở góc trên mỗi biểu đồ để xem riêng cho từng khoảng thời gian.
- **Biểu đồ Tròn (Tỉ Lệ Loại Lỗi):** Phân tích tỉ trọng các loại nhãn lỗi (Label) đã được tự động phân loại.
- **Biểu đồ Ngang (Khách Hàng):** Top 5 khách hàng B2B chịu ảnh hưởng hư hỏng nhiều nhất.

*(Ghi chú: Đưa chuột vào biểu đồ để xem chi tiết tỉ lệ % và số lượng tuyệt đối).*

### Phần 2: Báo Cáo Chi Tiết B2B (Text Report)
Đây là phần trí tuệ nhân tạo tổng hợp dữ liệu thành văn bản báo cáo. 
Hệ thống sẽ chỉ ra cụ thể Kho Trung Chuyển (KTC) và Kho Giao (GXT) nào đang là "điểm nóng" cần được kiểm tra quy trình chất xếp. Bạn có thể copy phần báo cáo này để gửi trực tiếp cho khối Vận Hành (Operations).

### Phần 3: Bảng Dữ Liệu Đã Mapping (Data Table)
Bảng hiển thị chi tiết tất cả các đơn hàng sau khi hệ thống đã "làm sạch" và tự động gán nhãn.
- **Chỉnh sửa Nhãn (Adhoc Edit):** Nếu công cụ tự động gán nhãn chưa đúng ý, bạn có thể **click thẳng vào cột Label** trong bảng và chọn lại từ danh sách thả xuống (Droplist).
  - Khi bạn chọn nhãn mới, mọi biểu đồ và báo cáo phía trên sẽ **ngay lập tức cập nhật lại**.
- **Xuất Báo Cáo (Export):** Để lấy dữ liệu tổng hợp về máy, bấm nút **"Xuất Báo Cáo"**. Hệ thống sẽ tải về một file Excel (`.xlsx`) chứa đầy đủ các trường dữ liệu kể cả các nhãn bạn vừa chỉnh tay.

---

## 4. Tính Năng "Tự Động Khôi Phục" (Persistent Session)
Công cụ sở hữu bộ nhớ ngầm độc lập:
- Nếu bạn lỡ tay nhấn F5 (Tải lại trang) hoặc đóng nhầm tab trình duyệt, **đừng lo lắng**.
- Khi mở lại, hệ thống sẽ **tự động khôi phục 100% dữ liệu** và nhảy thẳng lại trang Dashboard cuối cùng bạn đang xem.
- Bạn không cần phải tải lại file hay dán lại link từ đầu.
