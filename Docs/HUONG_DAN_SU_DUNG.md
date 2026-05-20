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

### 2.2 Xử lý dữ liệu (QUAN TRỌNG)
Sau khi cả 3 ô đều hiện trạng thái màu xanh (Đã tải xong), nút **"Xử Lý Dữ Liệu"** sẽ sáng lên.
- Bạn **bắt buộc phải bấm vào "Xử Lý Dữ Liệu"** để hệ thống bắt đầu quy trình dọn dẹp, chuẩn hóa font chữ (NFC) và ánh xạ từ khóa. Nếu chỉ nhấn `F5` tải lại trang, hệ thống sẽ sử dụng dữ liệu cũ lưu trong bộ nhớ tạm.

---

## 3. Khai Thác Dashboard & Báo Cáo

Giao diện báo cáo được chia làm 3 phần chính:

### Phần 1: Biểu Đồ Thống Kê (Dashboard)
- **Biểu đồ Đường (Xu Hướng Hư Hỏng):** Hiển thị số lượng lỗi phát sinh theo từng tuần vận hành.
- **Top 10 KTC/KCT & Top 10 Kho Giao:** Lọc riêng các lỗi có nhãn chứa từ khóa **"damage"**.
- **Biểu đồ Tròn & Biểu đồ Ngang:** Thể hiện tỉ trọng các loại lỗi và Top 5 khách hàng B2B chịu thiệt hại.

### Phần 2: Báo Cáo Chi Tiết B2B (Text Report)
Hệ thống AI tự động tổng hợp câu chữ báo cáo để bạn có thể Copy và gửi trực tiếp cho khối Vận Hành (Operations), chỉ ra rõ đâu là "điểm nóng" cần khắc phục.

### Phần 3: Bảng Dữ Liệu & Bộ Lọc Đa Lớp (Data Filter)
Bảng hiển thị chi tiết tất cả các đơn hàng sau khi hệ thống đã "làm sạch" và tự động gán nhãn.
- **Bộ Lọc Excel-Style:** Ngay dưới tiêu đề của các cột (Mã Đơn, Tuần, Khách Hàng, GXT, KTC, Chi Tiết Lỗi...) là các ô tìm kiếm hoặc danh sách thả xuống. Bạn có thể gõ trực tiếp vào các ô này để lọc dữ liệu chéo nhau giống y hệt tính năng Data Filter của Excel.
- **Chỉnh sửa Nhãn Thủ Công:** Click thẳng vào cột Label trong bảng để chọn lại nhãn từ danh sách. Biểu đồ sẽ tự động thay đổi theo.
- **Xuất Excel:** Bấm "Xuất Báo Cáo" để tải toàn bộ dữ liệu (đã kèm nhãn Label) về máy.

---

## 4. Cơ Chế Nhận Diện Cột Nâng Cao (Dual-Scan)

Hệ thống được trang bị bộ máy tự động nhận diện tên cột cực mạnh:
1. Nó có khả năng tự động hiểu được các tên cột biến thể. Ví dụ: cột Chi tiết lỗi có thể được đặt tên là *"Chi tiết, Ghi chú, Mô tả, Tình trạng, Nội dung, Lỗi, Vấn đề, Nguyên nhân..."*
2. **Dual-Scan:** Nếu Google Sheets bị lỗi định dạng khiến dòng tiêu đề bị đẩy xuống thành dòng dữ liệu đầu tiên, hệ thống vẫn sẽ tự động quét xuống dòng dữ liệu để tìm ra đúng cột cần lấy.

---

## 5. Xử Lý Sự Cố (Troubleshooting)

**1. Bảng dữ liệu trống trơn ở một số cột (ví dụ: Chi tiết lỗi bị trống)**
- Nguyên nhân 1: Dữ liệu bị lưu Cache. -> **Cách sửa:** Quay về tab Nhập Dữ Liệu và bấm lại nút **"Xử Lý Dữ Liệu"**.
- Nguyên nhân 2: Tên cột trong Google Sheets của bạn không chứa bất kỳ từ khóa nào mà hệ thống nhận diện được. -> **Cách sửa:** Đổi tên cột trong Google Sheets thành "Chi tiết lỗi" hoặc "Ghi chú".

**2. Toàn bộ đơn hàng đều bị gán nhãn "Khác"**
- Kéo xuống cuối trang Báo cáo và xem **Bảng Gỡ Lỗi (Debug Log)**. Nếu phần "Số lượng từ khóa đọc được" là **0 từ**, nghĩa là file Keyword của bạn đang trống hoặc bạn dán nhầm link Data vào ô Keyword.
- **Cách sửa:** Lấy đúng link của sheet Keyword và tải lại, sau đó bấm "Xử Lý Dữ Liệu".

**3. Web bị treo "Đang xử lý dữ liệu..."**
- Do lỗi kết nối mạng khiến việc lấy dữ liệu từ Google Sheets bị Timeout (vượt quá 15s).
- **Cách sửa:** Nhấn F5 để tải lại trang web và thử lại. Công cụ có bộ nhớ đệm (Persistent Session) nên bạn sẽ không bị mất các link đã nhập.
