function setupEntireWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var PRIMARY = '#1a73e8';
  var PRIMARY_LIGHT = '#e8f0fe';
  var PRIMARY_DARK = '#1557b0';
  var SUCCESS_BG = '#e6f4ea';
  var SUCCESS = '#137333';
  var WARNING_BG = '#fef7e0';
  var WARNING = '#e37400';
  var DANGER = '#c5221f';
  var DANGER_BG = '#fce8e6';
  var INFO = '#0b57d0';
  var INFO_BG = '#d3e3fd';
  var WHITE = '#ffffff';
  var GRAY_50 = '#f8f9fa';
  var GRAY_300 = '#dadce0';
  var GRAY_700 = '#5f6368';
  var GRAY_800 = '#3c4043';
  var GRAY_900 = '#202124';
  var NEED_FILL = '#fff3e0';
  var NEED_FILL_TEXT = '#bf360c';

  // Delete extra sheets first (keep only first one)
  var allSheets = ss.getSheets();
  for (var d = allSheets.length - 1; d >= 1; d--) {
    try { ss.deleteSheet(allSheets[d]); } catch(e) {}
  }

  // ====== SHEET 1 ======
  var s1 = ss.getSheets()[0];
  s1.setName('Phan Cong PIC');
  s1.clear();
  s1.getRange('1:100').setDataValidation(null);
  s1.clearConditionalFormatRules();
  try { if (s1.getFilter()) s1.getFilter().remove(); } catch(e) {}

  // Row 1: Title
  s1.getRange('A1:J1').merge().setValue('BANG PHAN CONG PIC KHACH HANG — TEAM CHUNG TU & CLIENT OPS')
    .setBackground(GRAY_900).setFontColor(WHITE).setFontSize(14).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  // Row 2: Subtitle
  s1.getRange('A2:J2').merge().setValue('Thong nhat nguoi phu trach (PIC) cho tung khach hang  |  Hieu luc: 02/06/2026  |  v1.0')
    .setBackground(PRIMARY_LIGHT).setFontColor(PRIMARY).setFontSize(10).setFontStyle('italic')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  // Row 3: Header
  s1.getRange('A3:J3').setValues([['STT', 'Khach hang', 'Nganh hang', 'PIC Chung tu', 'Team Chung tu', 'PIC Daily Ops', 'Team Daily Ops', 'Trang thai', 'Timeline', 'Ghi chu']])
    .setBackground(GRAY_800).setFontColor(WHITE).setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  // Data rows 4-16
  var d1 = [
    [1,'AQUA B2B','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [2,'CJ | PALDO','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [3,'SCF x KFM','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [4,'SF | WILMAR','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [5,'LG','Dien may','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [6,'NTF','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [7,'SF | AUX','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [8,'MDLz','','','Team Solution Design','','Team Solution Design','Da ban giao','','Ca chung tu & ops do SD phu trach'],
    [9,'LocknLock','','','Team CS -> Chung tu','','Team Solution Design','Dang ban giao','T06/2026','Dang ban giao tu CS -> Chung tu'],
    [10,'Phe La','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [11,'KEC Uniqlo','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [12,'UNICOMMER','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [13,'Honor','Dien may','','(chua phan cong)','','Team Client Ops','Can xac nhan','','Chua co PIC chung tu']
  ];
  s1.getRange(4,1,d1.length,10).setValues(d1).setFontSize(10).setVerticalAlignment('middle');

  // Batch format columns
  s1.getRange(4,1,d1.length,1).setHorizontalAlignment('center').setFontWeight('bold').setFontColor(GRAY_700);
  s1.getRange(4,2,d1.length,1).setFontWeight('bold');
  s1.getRange(4,8,d1.length,1).setHorizontalAlignment('center');
  s1.getRange(4,10,d1.length,1).setFontSize(9).setFontColor(GRAY_700);

  // Zebra — batch set backgrounds for odd rows only
  var bgs = [];
  for (var i = 0; i < d1.length; i++) {
    var color = (i % 2 === 1) ? GRAY_50 : WHITE;
    bgs.push([color,color,color,color,color,color,color,color,color,color]);
  }
  s1.getRange(4,1,d1.length,10).setBackgrounds(bgs);

  // Conditional formatting
  var r1 = [];
  r1.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Da ban giao').setBackground(SUCCESS_BG).setFontColor(SUCCESS).setBold(true).setRanges([s1.getRange('H4:H100')]).build());
  r1.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Dang ban giao').setBackground(WARNING_BG).setFontColor(WARNING).setBold(true).setRanges([s1.getRange('H4:H100')]).build());
  r1.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Can xac nhan').setBackground(INFO_BG).setFontColor(INFO).setBold(true).setRanges([s1.getRange('H4:H100')]).build());
  r1.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('chua phan cong').setBackground(DANGER_BG).setFontColor(DANGER).setItalic(true).setRanges([s1.getRange('A4:J100')]).build());
  s1.setConditionalFormatRules(r1);

  // Validation — allowInvalid = true so no errors
  s1.getRange('H4:H100').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Da ban giao','Dang ban giao','Chua ban giao','Can xac nhan'],true).setAllowInvalid(true).build());
  s1.getRange('C4:C100').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['FMCG','Dien may','F&B','Thoi trang','Khac'],true).setAllowInvalid(true).build());

  // Column widths in batch
  s1.setColumnWidths(1,1,45);
  s1.setColumnWidths(2,1,150);
  s1.setColumnWidths(3,1,110);
  s1.setColumnWidths(4,1,150);
  s1.setColumnWidths(5,1,180);
  s1.setColumnWidths(6,1,150);
  s1.setColumnWidths(7,1,170);
  s1.setColumnWidths(8,1,140);
  s1.setColumnWidths(9,1,130);
  s1.setColumnWidths(10,1,300);

  s1.setFrozenRows(3);
  s1.getRange('A3:J16').createFilter();
  s1.setTabColor(PRIMARY);

  // ====== SHEET 2 ======
  var s2 = ss.insertSheet('Lien He PIC');
  s2.getRange('A1:G1').merge().setValue('DANH SACH LIEN HE PIC')
    .setBackground(PRIMARY).setFontColor(WHITE).setFontSize(13).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  s2.getRange('A2:G2').merge().setValue('Tra cuu nhanh thong tin lien he PIC  |  Cap nhat: 02/06/2026')
    .setBackground(PRIMARY_LIGHT).setFontColor(PRIMARY_DARK).setFontSize(9).setFontStyle('italic').setHorizontalAlignment('center');
  s2.getRange('A3:G3').setValues([['STT','Ho ten','Team','Vai tro','Khach hang phu trach','Email','So dien thoai']])
    .setBackground(PRIMARY).setFontColor(WHITE).setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

  var d2 = [
    [1,'(can bo sung)','Team Chung tu','PIC Chung tu','AQUA, CJ, SCF, WILMAR, LG, NTF, AUX, Phe La, Uniqlo, UNICOMMER','',''],
    [2,'(can bo sung)','Team Solution Design','PIC Daily Ops','AQUA, CJ, SCF, WILMAR, LG, NTF, AUX, MDLz, LocknLock, Phe La, Uniqlo, UNICOMMER','',''],
    [3,'(can bo sung)','Team Solution Design','PIC Chung tu (MDLz)','MDLz','',''],
    [4,'(can bo sung)','Team Client Ops','PIC Daily Ops','Honor','',''],
    [5,'(can bo sung)','Team CS','PIC Chung tu (tam)','LocknLock (dang ban giao)','','']
  ];
  s2.getRange(4,1,d2.length,7).setValues(d2).setFontSize(10).setVerticalAlignment('middle');
  s2.getRange(4,2,d2.length,1).setFontWeight('bold');
  s2.getRange(4,1,d2.length,1).setHorizontalAlignment('center').setFontColor(GRAY_700);

  var bgs2 = [];
  for (var j = 0; j < d2.length; j++) {
    var c2 = (j % 2 === 1) ? GRAY_50 : WHITE;
    bgs2.push([c2,c2,c2,c2,c2,c2,c2]);
  }
  s2.getRange(4,1,d2.length,7).setBackgrounds(bgs2);

  s2.setColumnWidths(1,1,45);
  s2.setColumnWidths(2,1,160);
  s2.setColumnWidths(3,1,170);
  s2.setColumnWidths(4,1,200);
  s2.setColumnWidths(5,1,350);
  s2.setColumnWidths(6,1,200);
  s2.setColumnWidths(7,1,130);
  s2.setFrozenRows(3);
  s2.setTabColor('#34a853');

  // ====== SHEET 3 ======
  var s3 = ss.insertSheet('Quy Trinh Escalation');
  s3.getRange('A1:D1').merge().setValue('QUY TRINH ESCALATION — XU LY SU VU')
    .setBackground(DANGER).setFontColor(WHITE).setFontSize(13).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  s3.getRange('A2:D2').merge().setValue('SLA: Buoc 1 -> 1h  |  Buoc 2 -> 2h  |  Buoc 3 -> 4h')
    .setBackground(DANGER_BG).setFontColor(DANGER).setFontSize(9).setFontStyle('italic').setHorizontalAlignment('center');
  s3.getRange('A3:D3').setValues([['Tinh huong','Buoc 1','Buoc 2','Buoc 3']])
    .setBackground(DANGER).setFontColor(WHITE).setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

  var d3 = [
    ['Su vu chung tu','Lien he PIC Chung tu cua KH','Escalate Team Lead Chung tu','Escalate Wind'],
    ['Su vu van hanh (Daily Ops)','Lien he PIC Daily Ops cua KH','Escalate Team Lead SD/Client Ops','Escalate Wind'],
    ['Khong ro ai phu trach','Tra cuu Sheet Phan Cong PIC','Lien he Wind de phan cong',''],
    ['Khach hang moi','Thong bao Wind de phan cong','Wind cap nhat Sheet & email',''],
    ['Thay doi nhan su PIC','Team Lead thong bao Wind','Wind cap nhat Sheet & email','']
  ];
  s3.getRange(4,1,d3.length,4).setValues(d3).setFontSize(10).setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  s3.getRange(4,1,d3.length,1).setFontWeight('bold');

  var bgs3 = [];
  for (var k = 0; k < d3.length; k++) {
    var c3 = (k % 2 === 1) ? GRAY_50 : WHITE;
    bgs3.push([c3,c3,c3,c3]);
  }
  s3.getRange(4,1,d3.length,4).setBackgrounds(bgs3);

  s3.setColumnWidths(1,1,250);
  s3.setColumnWidths(2,1,280);
  s3.setColumnWidths(3,1,280);
  s3.setColumnWidths(4,1,250);
  s3.setFrozenRows(3);
  s3.setTabColor(DANGER);

  // Activate sheet 1
  ss.setActiveSheet(s1);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Done! 3 sheets da duoc tao.');
}
