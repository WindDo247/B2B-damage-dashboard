function setupEntireWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  while (ss.getSheets().length > 1) {
    try { ss.deleteSheet(ss.getSheets()[ss.getSheets().length - 1]); } catch(e) { break; }
  }

  var s1 = ss.getSheets()[0];
  s1.setName('Phân Công PIC');
  s1.clear();
  try { if (s1.getFilter()) s1.getFilter().remove(); } catch(e) {}

  // Title
  s1.getRange('A1:H1').merge().setValue('BẢNG PHÂN CÔNG & TRẠNG THÁI BÀN GIAO KHÁCH HÀNG').setBackground('#202124').setFontColor('#ffffff').setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('A2:H2').merge().setValue('Chứng từ: CS → Team Chứng từ   |   Daily Ops: SD → Team Client Ops   |   02/06/2026').setBackground('#e8f0fe').setFontColor('#1a73e8').setFontSize(10).setHorizontalAlignment('center');

  // Group headers
  s1.getRange('A3:C3').merge().setValue('').setBackground('#3c4043');
  s1.getRange('D3:E3').merge().setValue('CHỨNG TỪ (CS → Team Chứng từ)').setBackground('#1a73e8').setFontColor('#ffffff').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('F3:G3').merge().setValue('DAILY OPS (SD → Team Client Ops)').setBackground('#e37400').setFontColor('#ffffff').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('H3').setValue('').setBackground('#3c4043');

  // Column headers
  s1.getRange('A4:H4').setValues([['STT','Khách hàng','Ngành hàng','Team PIC hiện tại','Trạng thái','Team PIC hiện tại','Trạng thái','Ghi chú']])
    .setBackground('#3c4043').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

  var data = [
    [1, 'AQUA B2B',   'Điện máy', 'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [2, 'CJ | PALDO', 'STTP',     'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [3, 'SCF x KFM',  'STTP',     'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [4, 'SF | WILMAR', 'STTP',     'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [5, 'LG',          'Điện máy', 'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [6, 'NTF',         'STTP',     'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [7, 'SF | AUX',    'Điện máy', 'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [8, 'MDLz',        'STTP',     'Team Solution Design','Chưa bàn giao',   'Team Solution Design','Chưa bàn giao','Chứng từ & Ops còn ở SD'],
    [9, 'LocknLock',   'Chung',    'Team CS',             'Đang bàn giao',   'Team Solution Design','Chưa bàn giao','Chứng từ: trong T06/2026'],
    [10,'Phê La',      'STTP',     'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [11,'KEC Uniqlo',  'Chung',    'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [12,'UNICOMMER',   'Chung',    'Team Chứng từ',       'Đã bàn giao',     'Team Solution Design','Chưa bàn giao',''],
    [13,'Honor',       'Chung',    '',                    'Chưa phân công',  'Team Client Ops',     'Đã bàn giao',  'Chứng từ chưa có PIC']
  ];
  s1.getRange(5,1,data.length,8).setValues(data).setFontSize(10);
  s1.getRange(5,2,data.length,1).setFontWeight('bold');

  // Zebra
  var bgs = [];
  for (var i = 0; i < data.length; i++) {
    var c = (i % 2 === 1) ? '#f8f9fa' : '#ffffff';
    bgs.push([c,c,c,c,c,c,c,c]);
  }
  s1.getRange(5,1,data.length,8).setBackgrounds(bgs);

  // Conditional formatting — status columns E and G
  var r1 = s1.getRange('E5:E20');
  var r2 = s1.getRange('G5:G20');
  var rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Đã bàn giao').setBackground('#e6f4ea').setFontColor('#137333').setBold(true).setRanges([r1,r2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Đang bàn giao').setBackground('#fef7e0').setFontColor('#e37400').setBold(true).setRanges([r1,r2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Chưa bàn giao').setBackground('#fce8e6').setFontColor('#c5221f').setBold(true).setRanges([r1,r2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Chưa phân công').setBackground('#d3e3fd').setFontColor('#0b57d0').setBold(true).setRanges([r1,r2]).build());

  // Conditional formatting — ngành hàng column C
  var r3 = s1.getRange('C5:C20');
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('STTP').setBackground('#e6f4ea').setFontColor('#137333').setBold(true).setRanges([r3]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Điện máy').setBackground('#d3e3fd').setFontColor('#0b57d0').setBold(true).setRanges([r3]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Chung').setBackground('#fef7e0').setFontColor('#e37400').setBold(true).setRanges([r3]).build());
  s1.setConditionalFormatRules(rules);

  s1.setColumnWidth(1,45);
  s1.setColumnWidth(2,140);
  s1.setColumnWidth(3,100);
  s1.setColumnWidth(4,180);
  s1.setColumnWidth(5,130);
  s1.setColumnWidth(6,180);
  s1.setColumnWidth(7,130);
  s1.setColumnWidth(8,220);
  s1.setFrozenRows(4);
  s1.setTabColor('#1a73e8');

  // ====== SHEET 2: DANH SÁCH PIC & ESCALATION ======
  var s2 = ss.insertSheet('Danh sách PIC & Escalation');

  // Title
  s2.getRange('A1:F1').merge().setValue('DANH SÁCH PIC & QUY TRÌNH ESCALATION').setBackground('#202124').setFontColor('#ffffff').setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center');

  // Section 1: PIC liên hệ chính
  s2.getRange('A3:F3').merge().setValue('DANH SÁCH PIC LIÊN HỆ CHÍNH').setBackground('#1a73e8').setFontColor('#ffffff').setFontSize(11).setFontWeight('bold').setHorizontalAlignment('center');

  s2.getRange('A4:F4').setValues([['STT','Họ tên','Phụ trách','Khách hàng','Email','Số điện thoại']])
    .setBackground('#3c4043').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

  var picData = [
    [1,'Nguyễn Ngọc Nhiệm','PIC Chứng từ','AQUA, CJ|PALDO, SCF, WILMAR, LG, NTF, AUX, Phê La, Uniqlo, UNICOMMER','nhiemnn@ghn.vn','0394783175'],
    [2,'Nguyễn Lâm Minh Tiến','PIC Daily Ops (Honor)','Honor','tiennlm@ghn.vn','0918058100']
  ];
  s2.getRange(5,1,picData.length,6).setValues(picData).setFontSize(10);
  s2.getRange(5,2,picData.length,1).setFontWeight('bold');
  s2.getRange(5,1,1,6).setBackground('#ffffff');
  s2.getRange(6,1,1,6).setBackground('#f8f9fa');

  // Section 2: Escalation
  s2.getRange('A8:F8').merge().setValue('QUY TRÌNH ESCALATION').setBackground('#c5221f').setFontColor('#ffffff').setFontSize(11).setFontWeight('bold').setHorizontalAlignment('center');

  s2.getRange('A9:F9').merge().setValue('Nếu không liên hệ được PIC ở trên, escalate tới:').setBackground('#fce8e6').setFontColor('#c5221f').setFontSize(10).setFontStyle('italic').setHorizontalAlignment('center');

  s2.getRange('A10:F10').setValues([['','Họ tên','Chức vụ','Phạm vi','Email','Số điện thoại']])
    .setBackground('#3c4043').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

  s2.getRange('A11:F11').setValues([['','Wind Đỗ','Trưởng phòng Vận hành','Tất cả khách hàng','hanhdth@ghn.vn','0909890323']])
    .setFontSize(10).setBackground('#fff3e0');
  s2.getRange('B11').setFontWeight('bold');

  // Section 3: Hướng dẫn nhanh
  s2.getRange('A13:F13').merge().setValue('HƯỚNG DẪN KHI CÓ SỰ VỤ').setBackground('#34a853').setFontColor('#ffffff').setFontSize(11).setFontWeight('bold').setHorizontalAlignment('center');

  var guideData = [
    ['Sự vụ chứng từ','Bước 1: Liên hệ Nguyễn Ngọc Nhiệm (nhiemnn@ghn.vn / 0394783175)','Bước 2: Nếu không được → Escalate Wind Đỗ (hanhdth@ghn.vn / 0909890323)'],
    ['Sự vụ Daily Ops (Honor)','Bước 1: Liên hệ Nguyễn Lâm Minh Tiến (tiennlm@ghn.vn / 0918058100)','Bước 2: Nếu không được → Escalate Wind Đỗ (hanhdth@ghn.vn / 0909890323)'],
    ['Không rõ ai phụ trách','Bước 1: Tra Sheet "Phân Công PIC"','Bước 2: Liên hệ Wind Đỗ (hanhdth@ghn.vn / 0909890323)'],
    ['KH mới / đổi nhân sự','Bước 1: Thông báo Wind Đỗ','Bước 2: Wind Đỗ cập nhật bảng & gửi email thông báo']
  ];

  s2.getRange('A14:C14').setValues([['Tình huống','Liên hệ đầu tiên','Escalation']])
    .setBackground('#3c4043').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');
  s2.getRange(15,1,guideData.length,3).setValues(guideData).setFontSize(10);
  s2.getRange(15,1,guideData.length,1).setFontWeight('bold');

  // Zebra for guide
  var bgsg = [];
  for (var g = 0; g < guideData.length; g++) {
    var cg = (g % 2 === 0) ? '#ffffff' : '#f8f9fa';
    bgsg.push([cg,cg,cg]);
  }
  s2.getRange(15,1,guideData.length,3).setBackgrounds(bgsg);

  // Column widths
  s2.setColumnWidth(1,50);
  s2.setColumnWidth(2,200);
  s2.setColumnWidth(3,200);
  s2.setColumnWidth(4,350);
  s2.setColumnWidth(5,180);
  s2.setColumnWidth(6,130);
  s2.setFrozenRows(1);
  s2.setTabColor('#34a853');

  ss.setActiveSheet(s1);
}
