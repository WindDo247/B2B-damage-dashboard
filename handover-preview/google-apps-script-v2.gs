function setupEntireWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Color palette
  var PRIMARY = '#1a73e8';
  var PRIMARY_LIGHT = '#e8f0fe';
  var PRIMARY_DARK = '#1557b0';
  var SUCCESS = '#137333';
  var SUCCESS_BG = '#e6f4ea';
  var WARNING = '#e37400';
  var WARNING_BG = '#fef7e0';
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

  // ==========================================
  // SHEET 1: PHAN CONG PIC
  // ==========================================
  var sheet1 = ss.getSheets()[0];
  sheet1.setName('Phan Cong PIC');
  sheet1.clear();
  sheet1.clearConditionalFormatRules();

  // Title row
  sheet1.getRange('A1:J1').merge()
    .setValue('BANG PHAN CONG PIC KHACH HANG — TEAM CHUNG TU & CLIENT OPS')
    .setBackground(GRAY_900)
    .setFontColor(WHITE)
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet1.setRowHeight(1, 48);

  // Subtitle row
  sheet1.getRange('A2:J2').merge()
    .setValue('Muc dich: Thong nhat nguoi phu trach (PIC) cho tung khach hang. Khi co su vu phat sinh -> tra bang nay de biet lien he ai.    |    Hieu luc: 02/06/2026    |    v1.0')
    .setBackground(PRIMARY_LIGHT)
    .setFontColor(PRIMARY)
    .setFontSize(10)
    .setFontStyle('italic')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet1.setRowHeight(2, 36);

  // Header row
  var headers1 = [['STT', 'Khach hang', 'Nganh hang', 'PIC Chung tu', 'Team Chung tu', 'PIC Daily Ops', 'Team Daily Ops', 'Trang thai', 'Timeline', 'Ghi chu']];
  sheet1.getRange('A3:J3').setValues(headers1)
    .setBackground(GRAY_800)
    .setFontColor(WHITE)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, GRAY_900, SpreadsheetApp.BorderStyle.SOLID);
  sheet1.setRowHeight(3, 36);

  // Data
  var data1 = [
    [1, 'AQUA B2B',    '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [2, 'CJ | PALDO',  '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [3, 'SCF x KFM',   '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [4, 'SF | WILMAR',  '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [5, 'LG',           'Dien may',      '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [6, 'NTF',          '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [7, 'SF | AUX',     '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [8, 'MDLz',         '(can bo sung)', '(can bo sung)', 'Team Solution Design', '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', 'Ca chung tu & ops deu do SD phu trach'],
    [9, 'LocknLock',    '(can bo sung)', '(can bo sung)', 'Team CS -> Team Chung tu', '(can bo sung)', 'Team Solution Design', 'Dang ban giao', 'Trong T06/2026', 'Dang ban giao chung tu tu CS -> Chung tu'],
    [10, 'Phe La',      '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [11, 'KEC Uniqlo',  '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [12, 'UNICOMMER',   '(can bo sung)', '(can bo sung)', 'Team Chung tu',        '(can bo sung)', 'Team Solution Design',  'Da ban giao',    '—', ''],
    [13, 'Honor',        'Dien may',      '(can bo sung)', '(chua phan cong)',     '(can bo sung)', 'Team Client Ops',       'Can xac nhan',   '—', 'Chua co PIC chung tu — can xac nhan']
  ];

  sheet1.getRange(4, 1, data1.length, 10).setValues(data1)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, GRAY_300, SpreadsheetApp.BorderStyle.SOLID);

  // Format STT column
  sheet1.getRange(4, 1, data1.length, 1).setHorizontalAlignment('center').setFontWeight('bold').setFontColor(GRAY_700);
  // Format client name bold
  sheet1.getRange(4, 2, data1.length, 1).setFontWeight('bold');
  // Format status column center
  sheet1.getRange(4, 8, data1.length, 1).setHorizontalAlignment('center');
  // Format timeline column
  sheet1.getRange(4, 9, data1.length, 1).setHorizontalAlignment('center').setFontSize(9);
  // Format note column
  sheet1.getRange(4, 10, data1.length, 1).setFontSize(9).setFontColor(GRAY_700);

  // Zebra striping
  for (var i = 0; i < data1.length; i++) {
    var rowRange = sheet1.getRange(4 + i, 1, 1, 10);
    if (i % 2 === 1) {
      rowRange.setBackground(GRAY_50);
    } else {
      rowRange.setBackground(WHITE);
    }
    sheet1.setRowHeight(4 + i, 32);
  }

  // Conditional formatting
  var rules1 = [];

  rules1.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Da ban giao')
    .setBackground(SUCCESS_BG)
    .setFontColor(SUCCESS)
    .setBold(true)
    .setRanges([sheet1.getRange('H4:H100')])
    .build());

  rules1.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Dang ban giao')
    .setBackground(WARNING_BG)
    .setFontColor(WARNING)
    .setBold(true)
    .setRanges([sheet1.getRange('H4:H100')])
    .build());

  rules1.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Can xac nhan')
    .setBackground(INFO_BG)
    .setFontColor(INFO)
    .setBold(true)
    .setRanges([sheet1.getRange('H4:H100')])
    .build());

  rules1.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('can bo sung')
    .setBackground(NEED_FILL)
    .setFontColor(NEED_FILL_TEXT)
    .setItalic(true)
    .setRanges([sheet1.getRange('A4:J100')])
    .build());

  rules1.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('chua phan cong')
    .setBackground(DANGER_BG)
    .setFontColor(DANGER)
    .setItalic(true)
    .setRanges([sheet1.getRange('A4:J100')])
    .build());

  sheet1.setConditionalFormatRules(rules1);

  // Data validation: Status dropdown
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Da ban giao', 'Dang ban giao', 'Chua ban giao', 'Can xac nhan'], true)
    .setAllowInvalid(false)
    .build();
  sheet1.getRange('H4:H100').setDataValidation(statusRule);

  // Data validation: Industry dropdown
  var industryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['FMCG', 'Dien may', 'F&B', 'Thoi trang', 'Khac'], true)
    .setAllowInvalid(true)
    .build();
  sheet1.getRange('C4:C100').setDataValidation(industryRule);

  // Column widths
  sheet1.setColumnWidth(1, 45);
  sheet1.setColumnWidth(2, 150);
  sheet1.setColumnWidth(3, 110);
  sheet1.setColumnWidth(4, 150);
  sheet1.setColumnWidth(5, 180);
  sheet1.setColumnWidth(6, 150);
  sheet1.setColumnWidth(7, 170);
  sheet1.setColumnWidth(8, 140);
  sheet1.setColumnWidth(9, 130);
  sheet1.setColumnWidth(10, 300);

  // Freeze header rows only (no frozen columns — conflicts with merged title rows)
  sheet1.setFrozenRows(3);

  // Filter
  if (sheet1.getFilter()) { sheet1.getFilter().remove(); }
  sheet1.getRange('A3:J16').createFilter();

  // Tab color
  sheet1.setTabColor(PRIMARY);

  // ==========================================
  // SHEET 2: LIEN HE PIC
  // ==========================================
  var sheet2 = ss.insertSheet('Lien He PIC');

  // Title
  sheet2.getRange('A1:G1').merge()
    .setValue('DANH SACH LIEN HE PIC — THONG TIN NHANH')
    .setBackground(PRIMARY)
    .setFontColor(WHITE)
    .setFontSize(13)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet2.setRowHeight(1, 44);

  // Subtitle
  sheet2.getRange('A2:G2').merge()
    .setValue('Tra cuu nhanh thong tin lien he PIC khi can xu ly su vu    |    Cap nhat: 02/06/2026')
    .setBackground(PRIMARY_LIGHT)
    .setFontColor(PRIMARY_DARK)
    .setFontSize(9)
    .setFontStyle('italic')
    .setHorizontalAlignment('center');
  sheet2.setRowHeight(2, 30);

  // Header
  var headers2 = [['STT', 'Ho ten', 'Team', 'Vai tro', 'Khach hang phu trach', 'Email', 'So dien thoai']];
  sheet2.getRange('A3:G3').setValues(headers2)
    .setBackground(PRIMARY)
    .setFontColor(WHITE)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, PRIMARY_DARK, SpreadsheetApp.BorderStyle.SOLID);
  sheet2.setRowHeight(3, 34);

  // Data
  var data2 = [
    [1, '(can bo sung)', 'Team Chung tu',        'PIC Chung tu',                   'AQUA, CJ|PALDO, SCF, SF|WILMAR, LG, NTF, SF|AUX, Phe La, KEC Uniqlo, UNICOMMER', '(email)', '(SDT)'],
    [2, '(can bo sung)', 'Team Solution Design',  'PIC Daily Ops',                  'AQUA, CJ|PALDO, SCF, SF|WILMAR, LG, NTF, SF|AUX, MDLz, LocknLock, Phe La, KEC Uniqlo, UNICOMMER', '(email)', '(SDT)'],
    [3, '(can bo sung)', 'Team Solution Design',  'PIC Chung tu (MDLz)',            'MDLz', '(email)', '(SDT)'],
    [4, '(can bo sung)', 'Team Client Ops',       'PIC Daily Ops',                  'Honor', '(email)', '(SDT)'],
    [5, '(can bo sung)', 'Team CS',               'PIC Chung tu (tam - LocknLock)', 'LocknLock (dang ban giao -> Chung tu)', '(email)', '(SDT)']
  ];

  sheet2.getRange(4, 1, data2.length, 7).setValues(data2)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setBorder(true, true, true, true, true, true, GRAY_300, SpreadsheetApp.BorderStyle.SOLID);

  for (var j = 0; j < data2.length; j++) {
    sheet2.getRange(4 + j, 1, 1, 7).setBackground(j % 2 === 0 ? WHITE : GRAY_50);
    sheet2.setRowHeight(4 + j, 34);
  }

  sheet2.getRange(4, 2, data2.length, 1).setFontWeight('bold');
  sheet2.getRange(4, 1, data2.length, 1).setHorizontalAlignment('center').setFontColor(GRAY_700);

  var rules2 = [];
  rules2.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('can bo sung')
    .setBackground(NEED_FILL)
    .setFontColor(NEED_FILL_TEXT)
    .setItalic(true)
    .setRanges([sheet2.getRange('A4:G100')])
    .build());
  sheet2.setConditionalFormatRules(rules2);

  sheet2.setColumnWidth(1, 45);
  sheet2.setColumnWidth(2, 160);
  sheet2.setColumnWidth(3, 170);
  sheet2.setColumnWidth(4, 200);
  sheet2.setColumnWidth(5, 350);
  sheet2.setColumnWidth(6, 200);
  sheet2.setColumnWidth(7, 130);
  sheet2.setFrozenRows(3);
  sheet2.setTabColor('#34a853');

  // ==========================================
  // SHEET 3: QUY TRINH ESCALATION
  // ==========================================
  var sheet3 = ss.insertSheet('Quy Trinh Escalation');

  // Title
  sheet3.getRange('A1:D1').merge()
    .setValue('QUY TRINH ESCALATION — XU LY SU VU')
    .setBackground(DANGER)
    .setFontColor(WHITE)
    .setFontSize(13)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet3.setRowHeight(1, 44);

  // Subtitle
  sheet3.getRange('A2:D2').merge()
    .setValue('SLA: Buoc 1 -> phan hoi trong 1h  |  Buoc 2 -> phan hoi trong 2h  |  Buoc 3 -> phan hoi trong 4h')
    .setBackground(DANGER_BG)
    .setFontColor(DANGER)
    .setFontSize(9)
    .setFontStyle('italic')
    .setHorizontalAlignment('center');
  sheet3.setRowHeight(2, 30);

  // Header
  var headers3 = [['Tinh huong', 'Buoc 1', 'Buoc 2', 'Buoc 3']];
  sheet3.getRange('A3:D3').setValues(headers3)
    .setBackground(DANGER)
    .setFontColor(WHITE)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, '#a51c19', SpreadsheetApp.BorderStyle.SOLID);
  sheet3.setRowHeight(3, 34);

  // Data
  var data3 = [
    ['Su vu chung tu\n(Sai/thieu/cham chung tu)',             'Lien he PIC Chung tu cua KH do\n(tra Sheet "Phan Cong PIC")',   'Escalate len Team Lead Chung tu',          'Escalate len Wind (Truong phong)'],
    ['Su vu van hanh (Daily Ops)\n(Loi quy trinh, cham xu ly don)', 'Lien he PIC Daily Ops cua KH do\n(tra Sheet "Phan Cong PIC")', 'Escalate len Team Lead SD / Client Ops',   'Escalate len Wind (Truong phong)'],
    ['Khong ro ai phu trach',                                  'Tra cuu Sheet "Phan Cong PIC"\n-> tim PIC tuong ung',           'Neu khong co PIC\n-> lien he Wind de phan cong', '—'],
    ['Khach hang moi\n(Can phan cong PIC)',                    'Thong bao cho Wind\nde phan cong PIC',                          'Wind cap nhat Sheet\n& email thong bao cac team',  '—'],
    ['Thay doi nhan su PIC\n(Nghi viec, chuyen team)',         'Team Lead thong bao cho Wind',                                  'Wind cap nhat Sheet 1, 2\n& gui email thong bao',  '—']
  ];

  sheet3.getRange(4, 1, data3.length, 4).setValues(data3)
    .setFontSize(10)
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
    .setBorder(true, true, true, true, true, true, GRAY_300, SpreadsheetApp.BorderStyle.SOLID);

  sheet3.getRange(4, 1, data3.length, 1).setFontWeight('bold');

  for (var k = 0; k < data3.length; k++) {
    sheet3.getRange(4 + k, 1, 1, 4).setBackground(k % 2 === 0 ? WHITE : GRAY_50);
    sheet3.setRowHeight(4 + k, 60);
  }

  sheet3.setColumnWidth(1, 250);
  sheet3.setColumnWidth(2, 280);
  sheet3.setColumnWidth(3, 280);
  sheet3.setColumnWidth(4, 250);
  sheet3.setFrozenRows(3);
  sheet3.setTabColor(DANGER);

  // ==========================================
  // CLEANUP: Delete old default sheets
  // ==========================================
  var allSheets = ss.getSheets();
  for (var s = 0; s < allSheets.length; s++) {
    var sName = allSheets[s].getName();
    if (sName === 'Sheet1' || sName === 'Trang tinh1') {
      try { ss.deleteSheet(allSheets[s]); } catch(e) {}
    }
  }

  // Set main sheet active
  ss.setActiveSheet(sheet1);
  SpreadsheetApp.flush();

  // Done!
  SpreadsheetApp.getUi().alert('Format hoan tat!\n\nSheet 1: Bang Phan Cong PIC — 13 khach hang\nSheet 2: Danh Sach Lien He PIC\nSheet 3: Quy Trinh Escalation\n\nLuu y: Can bo sung ten PIC cu the, nganh hang, email va SDT.');
}
