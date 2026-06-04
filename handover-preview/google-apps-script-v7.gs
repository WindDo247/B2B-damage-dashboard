function setupEntireWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  while (ss.getSheets().length > 1) {
    try { ss.deleteSheet(ss.getSheets()[ss.getSheets().length - 1]); } catch(e) { break; }
  }

  var s1 = ss.getSheets()[0];
  s1.setName('Phan Cong PIC');
  s1.clear();
  try { if (s1.getFilter()) s1.getFilter().remove(); } catch(e) {}

  // Title
  s1.getRange('A1:G1').merge().setValue('BANG PHAN CONG & TRANG THAI BAN GIAO KHACH HANG').setBackground('#202124').setFontColor('#ffffff').setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('A2:G2').merge().setValue('Chung tu: CS -> Team Chung tu   |   Daily Ops: SD -> Team Client Ops   |   02/06/2026').setBackground('#e8f0fe').setFontColor('#1a73e8').setFontSize(10).setHorizontalAlignment('center');

  // Group headers
  s1.getRange('A3:B3').merge().setValue('').setBackground('#3c4043');
  s1.getRange('C3:D3').merge().setValue('CHUNG TU (CS -> Team Chung tu)').setBackground('#1a73e8').setFontColor('#ffffff').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('E3:F3').merge().setValue('DAILY OPS (SD -> Team Client Ops)').setBackground('#e37400').setFontColor('#ffffff').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('G3').setValue('').setBackground('#3c4043');

  // Column headers
  s1.getRange('A4:G4').setValues([['STT','Khach hang','Team PIC hien tai','Trang thai','Team PIC hien tai','Trang thai','Ghi chu']])
    .setBackground('#3c4043').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

  var data = [
    [1, 'AQUA B2B',   'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [2, 'CJ | PALDO', 'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [3, 'SCF x KFM',  'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [4, 'SF | WILMAR', 'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [5, 'LG',          'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [6, 'NTF',         'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [7, 'SF | AUX',    'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [8, 'MDLz',        'Team Solution Design','Chua ban giao', 'Team Solution Design','Chua ban giao','CT & Ops con o SD'],
    [9, 'LocknLock',   'Team CS',             'Dang ban giao', 'Team Solution Design','Chua ban giao','CT: trong T06/2026'],
    [10,'Phe La',      'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [11,'KEC Uniqlo',  'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [12,'UNICOMMER',   'Team Chung tu',       'Da ban giao',   'Team Solution Design','Chua ban giao',''],
    [13,'Honor',       '',                    'Chua phan cong','Team Client Ops',     'Da ban giao',  'CT chua co PIC']
  ];
  s1.getRange(5,1,data.length,7).setValues(data).setFontSize(10);
  s1.getRange(5,2,data.length,1).setFontWeight('bold');

  // Zebra
  var bgs = [];
  for (var i = 0; i < data.length; i++) {
    var c = (i % 2 === 1) ? '#f8f9fa' : '#ffffff';
    bgs.push([c,c,c,c,c,c,c]);
  }
  s1.getRange(5,1,data.length,7).setBackgrounds(bgs);

  // Conditional formatting for both status columns D and F
  var r1 = s1.getRange('D5:D20');
  var r2 = s1.getRange('F5:F20');
  var rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Da ban giao').setBackground('#e6f4ea').setFontColor('#137333').setBold(true).setRanges([r1,r2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Dang ban giao').setBackground('#fef7e0').setFontColor('#e37400').setBold(true).setRanges([r1,r2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Chua ban giao').setBackground('#fce8e6').setFontColor('#c5221f').setBold(true).setRanges([r1,r2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Chua phan cong').setBackground('#d3e3fd').setFontColor('#0b57d0').setBold(true).setRanges([r1,r2]).build());
  s1.setConditionalFormatRules(rules);

  s1.setColumnWidth(1,45);
  s1.setColumnWidth(2,140);
  s1.setColumnWidth(3,180);
  s1.setColumnWidth(4,130);
  s1.setColumnWidth(5,180);
  s1.setColumnWidth(6,130);
  s1.setColumnWidth(7,220);
  s1.setFrozenRows(4);
  s1.setTabColor('#1a73e8');

  // SHEET 2
  var s2 = ss.insertSheet('Escalation');
  var all2 = [
    ['Tinh huong','Buoc 1','Buoc 2','Buoc 3'],
    ['Su vu chung tu','Lien he Team PIC CT cua KH','Escalate Team Lead','Escalate Wind'],
    ['Su vu Daily Ops','Lien he Team PIC Ops cua KH','Escalate Team Lead','Escalate Wind'],
    ['Khong ro ai phu trach','Tra Sheet Phan Cong PIC','Lien he Wind',''],
    ['KH moi / doi nhan su','Thong bao Wind','Wind cap nhat & email','']
  ];
  s2.getRange(1,1,all2.length,4).setValues(all2);
  s2.getRange('A1:D1').setBackground('#c5221f').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  s2.getRange(2,1,4,1).setFontWeight('bold');
  s2.setColumnWidth(1,220);
  s2.setColumnWidth(2,250);
  s2.setColumnWidth(3,250);
  s2.setColumnWidth(4,200);
  s2.setFrozenRows(1);
  s2.setTabColor('#c5221f');

  ss.setActiveSheet(s1);
}
