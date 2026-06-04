/**
 * ===================================================================
 * GOOGLE APPS SCRIPT — AUTO FORMAT FILE BÀN GIAO KHÁCH HÀNG
 * ===================================================================
 * 
 * HƯỚNG DẪN SỬ DỤNG:
 * 1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/14Stw4eozrTDf9EZ07N9p8Rp-DgJPvfJ0p3Kagfk4Lkg/edit
 * 2. Vào menu Extensions → Apps Script
 * 3. Xóa toàn bộ code mặc định, paste toàn bộ code này vào
 * 4. Nhấn nút ▶️ Run (chọn hàm "setupEntireWorkbook")
 * 5. Cho phép quyền truy cập khi được hỏi
 * 6. Chờ khoảng 10-15 giây để script format xong
 * 
 * Script sẽ tự động:
 * - Tạo 3 sheets (Phân công PIC, Liên hệ PIC, Quy trình Escalation)
 * - Format header, data rows, conditional formatting
 * - Thêm data validation (dropdown)
 * - Freeze rows, set column widths
 * - Áp dụng color scheme chuyên nghiệp
 */

// ========== COLOR PALETTE ==========
const COLORS = {
  // Primary
  PRIMARY: '#1a73e8',
  PRIMARY_LIGHT: '#e8f0fe',
  PRIMARY_DARK: '#1557b0',
  
  // Status
  SUCCESS: '#137333',
  SUCCESS_BG: '#e6f4ea',
  WARNING: '#e37400',
  WARNING_BG: '#fef7e0',
  DANGER: '#c5221f',
  DANGER_BG: '#fce8e6',
  INFO: '#0b57d0',
  INFO_BG: '#d3e3fd',
  
  // Neutral
  WHITE: '#ffffff',
  GRAY_50: '#f8f9fa',
  GRAY_100: '#f1f3f4',
  GRAY_200: '#e8eaed',
  GRAY_300: '#dadce0',
  GRAY_700: '#5f6368',
  GRAY_800: '#3c4043',
  GRAY_900: '#202124',
  
  // Teams
  TEAM_CT_BG: '#e8f0fe',
  TEAM_CT_TEXT: '#1a73e8',
  TEAM_SD_BG: '#fef7e0',
  TEAM_SD_TEXT: '#e37400',
  TEAM_CO_BG: '#f3e8fd',
  TEAM_CO_TEXT: '#7b1fa2',
  TEAM_CS_BG: '#fce8e6',
  TEAM_CS_TEXT: '#c5221f',
  
  // Highlight
  NEED_FILL: '#fff3e0',
  NEED_FILL_TEXT: '#bf360c',
};

// ========== MAIN FUNCTION ==========
function setupEntireWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Step 1: Setup Sheet 1 — Phân công PIC
  setupSheet1_PhanCongPIC(ss);
  
  // Step 2: Setup Sheet 2 — Liên hệ PIC
  setupSheet2_LienHePIC(ss);
  
  // Step 3: Setup Sheet 3 — Quy trình Escalation
  setupSheet3_Escalation(ss);
  
  // Step 4: Delete default empty sheets
  cleanupSheets(ss);
  
  SpreadsheetApp.flush();
  
  // Show completion message
  SpreadsheetApp.getUi().alert(
    '✅ Format hoàn tất!\n\n' +
    '📋 Sheet 1: Bảng Phân Công PIC — 13 khách hàng\n' +
    '📞 Sheet 2: Danh Sách Liên Hệ PIC — cần bổ sung tên, email, SĐT\n' +
    '🚨 Sheet 3: Quy Trình Escalation — 5 tình huống\n\n' +
    '⚠️ Lưu ý: Wind cần bổ sung tên PIC cụ thể, ngành hàng chính xác, và thông tin liên hệ.'
  );
}

// ========== SHEET 1: PHÂN CÔNG PIC ==========
function setupSheet1_PhanCongPIC(ss) {
  // Get or create sheet
  let sheet = ss.getSheetByName('📋 Phân Công PIC');
  if (!sheet) {
    // Rename first sheet or create new
    const sheets = ss.getSheets();
    if (sheets.length > 0 && sheets[0].getLastRow() <= 20) {
      sheet = sheets[0];
      sheet.setName('📋 Phân Công PIC');
    } else {
      sheet = ss.insertSheet('📋 Phân Công PIC', 0);
    }
  }
  
  // Clear existing content
  sheet.clear();
  sheet.clearConditionalFormatRules();
  
  // ----- ROW 1: TITLE -----
  sheet.getRange('A1:J1').merge()
    .setValue('BẢNG PHÂN CÔNG PIC KHÁCH HÀNG — TEAM CHỨNG TỪ & CLIENT OPS')
    .setBackground(COLORS.GRAY_900)
    .setFontColor(COLORS.WHITE)
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 48);
  
  // ----- ROW 2: SUBTITLE -----
  sheet.getRange('A2:J2').merge()
    .setValue('Mục đích: Thống nhất người phụ trách (PIC) cho từng khách hàng. Khi có sự vụ phát sinh → tra bảng này để biết liên hệ ai.    |    📅 Hiệu lực: 02/06/2026    |    ✏️ v1.0')
    .setBackground(COLORS.PRIMARY_LIGHT)
    .setFontColor(COLORS.PRIMARY)
    .setFontSize(10)
    .setFontStyle('italic')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(2, 36);
  
  // ----- ROW 3: HEADER -----
  const headers = ['STT', 'Khách hàng', 'Ngành hàng', 'PIC Chứng từ', 'Team Chứng từ', 'PIC Daily Ops', 'Team Daily Ops', 'Trạng thái', 'Timeline', 'Ghi chú'];
  const headerRange = sheet.getRange('A3:J3');
  headerRange.setValues([headers])
    .setBackground(COLORS.GRAY_800)
    .setFontColor(COLORS.WHITE)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, COLORS.GRAY_900, SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(3, 36);
  
  // ----- DATA ROWS (Row 4-16) -----
  const data = [
    [1, 'AQUA B2B',      '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [2, 'CJ | PALDO',    '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [3, 'SCF x KFM',     '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [4, 'SF | WILMAR',   '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [5, 'LG',            'Điện máy',      '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [6, 'NTF',           '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [7, 'SF | AUX',      '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [8, 'MDLz',          '(cần bổ sung)', '(cần bổ sung)', 'Team Solution Design', '(cần bổ sung)', 'Team Solution Design', '✅ Đã bàn giao',    '—', '⚠️ Cả chứng từ & ops đều do SD phụ trách'],
    [9, 'LocknLock',     '(cần bổ sung)', '(cần bổ sung)', 'Team CS → Team Chứng từ', '(cần bổ sung)', 'Team Solution Design', '🔄 Đang bàn giao', 'Trong T06/2026', '⚠️ Đang bàn giao chứng từ từ CS → Chứng từ'],
    [10, 'Phê La',       '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [11, 'KEC Uniqlo',   '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [12, 'UNICOMMER',    '(cần bổ sung)', '(cần bổ sung)', 'Team Chứng từ',       '(cần bổ sung)', 'Team Solution Design',  '✅ Đã bàn giao',    '—', ''],
    [13, 'Honor',        'Điện máy',      '(cần bổ sung)', '(chưa phân công)',    '(cần bổ sung)', 'Team Client Ops',       '❓ Cần xác nhận',   '—', '⚠️ Chưa có PIC chứng từ — cần xác nhận'],
  ];
  
  const dataRange = sheet.getRange(4, 1, data.length, 10);
  dataRange.setValues(data)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, COLORS.GRAY_300, SpreadsheetApp.BorderStyle.SOLID);
  
  // Set STT column center
  sheet.getRange(4, 1, data.length, 1).setHorizontalAlignment('center').setFontWeight('bold').setFontColor(COLORS.GRAY_700);
  
  // Set client name bold
  sheet.getRange(4, 2, data.length, 1).setFontWeight('bold');
  
  // Set status column center
  sheet.getRange(4, 8, data.length, 1).setHorizontalAlignment('center');
  
  // Set timeline column center
  sheet.getRange(4, 9, data.length, 1).setHorizontalAlignment('center').setFontSize(9);
  
  // Set note column style
  sheet.getRange(4, 10, data.length, 1).setFontSize(9).setFontColor(COLORS.GRAY_700);
  
  // Zebra striping
  for (let i = 0; i < data.length; i++) {
    const rowRange = sheet.getRange(4 + i, 1, 1, 10);
    if (i % 2 === 1) {
      rowRange.setBackground(COLORS.GRAY_50);
    } else {
      rowRange.setBackground(COLORS.WHITE);
    }
    sheet.setRowHeight(4 + i, 32);
  }
  
  // ----- CONDITIONAL FORMATTING -----
  const rules = sheet.getConditionalFormatRules();
  
  // Status: Đã bàn giao → green
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Đã bàn giao')
    .setBackground(COLORS.SUCCESS_BG)
    .setFontColor(COLORS.SUCCESS)
    .setBold(true)
    .setRanges([sheet.getRange('H4:H100')])
    .build());
  
  // Status: Đang bàn giao → orange
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Đang bàn giao')
    .setBackground(COLORS.WARNING_BG)
    .setFontColor(COLORS.WARNING)
    .setBold(true)
    .setRanges([sheet.getRange('H4:H100')])
    .build());
  
  // Status: Cần xác nhận → blue
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Cần xác nhận')
    .setBackground(COLORS.INFO_BG)
    .setFontColor(COLORS.INFO)
    .setBold(true)
    .setRanges([sheet.getRange('H4:H100')])
    .build());
  
  // Cells containing "cần bổ sung" → highlight
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('cần bổ sung')
    .setBackground(COLORS.NEED_FILL)
    .setFontColor(COLORS.NEED_FILL_TEXT)
    .setItalic(true)
    .setRanges([sheet.getRange('A4:J100')])
    .build());
  
  // Cells containing "chưa phân công" → highlight red
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('chưa phân công')
    .setBackground(COLORS.DANGER_BG)
    .setFontColor(COLORS.DANGER)
    .setItalic(true)
    .setRanges([sheet.getRange('A4:J100')])
    .build());
  
  sheet.setConditionalFormatRules(rules);
  
  // ----- DATA VALIDATION: Status dropdown -----
  const statusValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['✅ Đã bàn giao', '🔄 Đang bàn giao', '⏳ Chưa bàn giao', '❓ Cần xác nhận'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('H4:H100').setDataValidation(statusValidation);
  
  // ----- DATA VALIDATION: Ngành hàng dropdown -----
  const industryValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['FMCG', 'Điện máy', 'F&B', 'Thời trang', 'Khác'], true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('C4:C100').setDataValidation(industryValidation);
  
  // ----- COLUMN WIDTHS -----
  sheet.setColumnWidth(1, 45);   // STT
  sheet.setColumnWidth(2, 150);  // Khách hàng
  sheet.setColumnWidth(3, 110);  // Ngành hàng
  sheet.setColumnWidth(4, 150);  // PIC Chứng từ
  sheet.setColumnWidth(5, 180);  // Team Chứng từ
  sheet.setColumnWidth(6, 150);  // PIC Daily Ops
  sheet.setColumnWidth(7, 170);  // Team Daily Ops
  sheet.setColumnWidth(8, 140);  // Trạng thái
  sheet.setColumnWidth(9, 130);  // Timeline
  sheet.setColumnWidth(10, 300); // Ghi chú
  
  // ----- FREEZE -----
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(2);
  
  // ----- FILTER -----
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getRange('A3:J16').createFilter();
  
  // Set tab color
  sheet.setTabColor(COLORS.PRIMARY);
}

// ========== SHEET 2: LIÊN HỆ PIC ==========
function setupSheet2_LienHePIC(ss) {
  let sheet = ss.getSheetByName('📞 Liên Hệ PIC');
  if (!sheet) {
    sheet = ss.insertSheet('📞 Liên Hệ PIC');
  }
  
  sheet.clear();
  sheet.clearConditionalFormatRules();
  
  // Title
  sheet.getRange('A1:G1').merge()
    .setValue('DANH SÁCH LIÊN HỆ PIC — THÔNG TIN NHANH')
    .setBackground(COLORS.PRIMARY)
    .setFontColor(COLORS.WHITE)
    .setFontSize(13)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 44);
  
  // Subtitle
  sheet.getRange('A2:G2').merge()
    .setValue('💡 Tra cứu nhanh thông tin liên hệ PIC khi cần xử lý sự vụ    |    Cập nhật: 02/06/2026')
    .setBackground(COLORS.PRIMARY_LIGHT)
    .setFontColor(COLORS.PRIMARY_DARK)
    .setFontSize(9)
    .setFontStyle('italic')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(2, 30);
  
  // Header
  const headers = ['STT', 'Họ tên', 'Team', 'Vai trò', 'Khách hàng phụ trách', 'Email', 'Số điện thoại'];
  sheet.getRange('A3:G3').setValues([headers])
    .setBackground(COLORS.PRIMARY)
    .setFontColor(COLORS.WHITE)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, COLORS.PRIMARY_DARK, SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(3, 34);
  
  // Sample data
  const data = [
    [1, '(cần bổ sung)', 'Team Chứng từ', 'PIC Chứng từ', 'AQUA, CJ|PALDO, SCF, SF|WILMAR, LG, NTF, SF|AUX, Phê La, KEC Uniqlo, UNICOMMER', '(email)', '(SĐT)'],
    [2, '(cần bổ sung)', 'Team Solution Design', 'PIC Daily Ops', 'AQUA, CJ|PALDO, SCF, SF|WILMAR, LG, NTF, SF|AUX, MDLz, LocknLock, Phê La, KEC Uniqlo, UNICOMMER', '(email)', '(SĐT)'],
    [3, '(cần bổ sung)', 'Team Solution Design', 'PIC Chứng từ (MDLz)', 'MDLz', '(email)', '(SĐT)'],
    [4, '(cần bổ sung)', 'Team Client Ops', 'PIC Daily Ops', 'Honor', '(email)', '(SĐT)'],
    [5, '(cần bổ sung)', 'Team CS', 'PIC Chứng từ (tạm - LocknLock)', 'LocknLock (đang bàn giao → Chứng từ)', '(email)', '(SĐT)'],
  ];
  
  sheet.getRange(4, 1, data.length, 7).setValues(data)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, COLORS.GRAY_300, SpreadsheetApp.BorderStyle.SOLID);
  
  // Zebra + formatting
  for (let i = 0; i < data.length; i++) {
    const row = sheet.getRange(4 + i, 1, 1, 7);
    row.setBackground(i % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_50);
    sheet.setRowHeight(4 + i, 34);
  }
  
  // Bold name column
  sheet.getRange(4, 2, data.length, 1).setFontWeight('bold');
  sheet.getRange(4, 1, data.length, 1).setHorizontalAlignment('center').setFontColor(COLORS.GRAY_700);
  
  // Conditional formatting for "cần bổ sung"
  const rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('cần bổ sung')
    .setBackground(COLORS.NEED_FILL)
    .setFontColor(COLORS.NEED_FILL_TEXT)
    .setItalic(true)
    .setRanges([sheet.getRange('A4:G100')])
    .build());
  sheet.setConditionalFormatRules(rules);
  
  // Column widths
  sheet.setColumnWidth(1, 45);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 170);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 350);
  sheet.setColumnWidth(6, 200);
  sheet.setColumnWidth(7, 130);
  
  // Freeze
  sheet.setFrozenRows(3);
  
  // Tab color
  sheet.setTabColor('#34a853');
}

// ========== SHEET 3: QUY TRÌNH ESCALATION ==========
function setupSheet3_Escalation(ss) {
  let sheet = ss.getSheetByName('🚨 Quy Trình Escalation');
  if (!sheet) {
    sheet = ss.insertSheet('🚨 Quy Trình Escalation');
  }
  
  sheet.clear();
  sheet.clearConditionalFormatRules();
  
  // Title
  sheet.getRange('A1:D1').merge()
    .setValue('🚨 QUY TRÌNH ESCALATION — XỬ LÝ SỰ VỤ')
    .setBackground(COLORS.DANGER)
    .setFontColor(COLORS.WHITE)
    .setFontSize(13)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 44);
  
  // Subtitle
  sheet.getRange('A2:D2').merge()
    .setValue('⏱️ SLA: Bước 1 → phản hồi trong 1h  ·  Bước 2 → phản hồi trong 2h  ·  Bước 3 → phản hồi trong 4h')
    .setBackground(COLORS.DANGER_BG)
    .setFontColor(COLORS.DANGER)
    .setFontSize(9)
    .setFontStyle('italic')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(2, 30);
  
  // Header
  const headers = ['Tình huống', 'Bước 1', 'Bước 2', 'Bước 3'];
  sheet.getRange('A3:D3').setValues([headers])
    .setBackground(COLORS.DANGER)
    .setFontColor(COLORS.WHITE)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, '#a51c19', SpreadsheetApp.BorderStyle.SOLID);
  sheet.setRowHeight(3, 34);
  
  // Data
  const data = [
    ['📄 Sự vụ chứng từ\n(Sai/thiếu/chậm chứng từ)', 'Liên hệ PIC Chứng từ của KH đó\n(tra Sheet "Phân Công PIC")', 'Escalate lên Team Lead Chứng từ', 'Escalate lên Wind (Trưởng phòng)'],
    ['⚙️ Sự vụ vận hành (Daily Ops)\n(Lỗi quy trình, chậm xử lý đơn)', 'Liên hệ PIC Daily Ops của KH đó\n(tra Sheet "Phân Công PIC")', 'Escalate lên Team Lead SD / Client Ops', 'Escalate lên Wind (Trưởng phòng)'],
    ['❓ Không rõ ai phụ trách', 'Tra cứu Sheet "Phân Công PIC"\n→ tìm PIC tương ứng', 'Nếu không có PIC\n→ liên hệ Wind để phân công', '—'],
    ['🆕 Khách hàng mới\n(Cần phân công PIC)', 'Thông báo cho Wind\nđể phân công PIC', 'Wind cập nhật Sheet\n& email thông báo các team', '—'],
    ['🔄 Thay đổi nhân sự PIC\n(Nghỉ việc, chuyển team)', 'Team Lead thông báo cho Wind', 'Wind cập nhật Sheet 1, 2\n& gửi email thông báo', '—'],
  ];
  
  sheet.getRange(4, 1, data.length, 4).setValues(data)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    .setBorder(true, true, true, true, true, true, COLORS.GRAY_300, SpreadsheetApp.BorderStyle.SOLID);
  
  // Format situation column bold
  sheet.getRange(4, 1, data.length, 1).setFontWeight('bold');
  
  // Zebra
  for (let i = 0; i < data.length; i++) {
    sheet.getRange(4 + i, 1, 1, 4).setBackground(i % 2 === 0 ? COLORS.WHITE : COLORS.GRAY_50);
    sheet.setRowHeight(4 + i, 60);
  }
  
  // Column widths
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 280);
  sheet.setColumnWidth(3, 280);
  sheet.setColumnWidth(4, 250);
  
  // Freeze
  sheet.setFrozenRows(3);
  
  // Tab color
  sheet.setTabColor(COLORS.DANGER);
}

// ========== CLEANUP ==========
function cleanupSheets(ss) {
  const sheets = ss.getSheets();
  const validNames = ['📋 Phân Công PIC', '📞 Liên Hệ PIC', '🚨 Quy Trình Escalation'];
  
  // Only delete sheets that are the original unnamed ones
  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (!validNames.includes(name) && (name === 'Sheet1' || name === 'Trang tính1' || name.match(/^Sheet\d+$/))) {
      try {
        ss.deleteSheet(sheet);
      } catch(e) {
        // Can't delete last sheet, ignore
      }
    }
  });
  
  // Set first sheet as active
  const mainSheet = ss.getSheetByName('📋 Phân Công PIC');
  if (mainSheet) ss.setActiveSheet(mainSheet);
}

// ========== BONUS: CUSTOM MENU ==========
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔧 Quản lý PIC')
    .addItem('🔄 Re-format toàn bộ', 'setupEntireWorkbook')
    .addItem('➕ Thêm khách hàng mới', 'addNewClient')
    .addSeparator()
    .addItem('📊 Tổng hợp thống kê', 'showStats')
    .addToUi();
}

function addNewClient() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('➕ Thêm khách hàng mới', 'Nhập tên khách hàng:', ui.ButtonSet.OK_CANCEL);
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const clientName = response.getResponseText().trim();
    if (!clientName) return;
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('📋 Phân Công PIC');
    if (!sheet) return;
    
    const lastRow = sheet.getLastRow();
    const newSTT = lastRow - 2; // Subtract header rows
    
    sheet.getRange(lastRow + 1, 1, 1, 10).setValues([
      [newSTT, clientName, '(cần bổ sung)', '(cần bổ sung)', '(cần bổ sung)', '(cần bổ sung)', '(cần bổ sung)', '⏳ Chưa bàn giao', '—', '']
    ]).setFontSize(10).setVerticalAlignment('middle')
      .setBorder(true, true, true, true, true, true, COLORS.GRAY_300, SpreadsheetApp.BorderStyle.SOLID);
    
    ui.alert('✅ Đã thêm khách hàng: ' + clientName);
  }
}

function showStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('📋 Phân Công PIC');
  if (!sheet) return;
  
  const data = sheet.getRange('H4:H' + sheet.getLastRow()).getValues();
  let done = 0, progress = 0, pending = 0, confirm = 0;
  
  data.forEach(row => {
    const val = row[0].toString();
    if (val.includes('Đã bàn giao')) done++;
    else if (val.includes('Đang bàn giao')) progress++;
    else if (val.includes('Chưa bàn giao')) pending++;
    else if (val.includes('Cần xác nhận')) confirm++;
  });
  
  const total = done + progress + pending + confirm;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  
  SpreadsheetApp.getUi().alert(
    '📊 THỐNG KÊ TÌNH TRẠNG BÀN GIAO\n\n' +
    '📋 Tổng khách hàng: ' + total + '\n' +
    '✅ Đã bàn giao: ' + done + ' (' + pct + '%)\n' +
    '🔄 Đang bàn giao: ' + progress + '\n' +
    '⏳ Chưa bàn giao: ' + pending + '\n' +
    '❓ Cần xác nhận: ' + confirm
  );
}
