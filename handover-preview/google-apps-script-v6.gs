function setupEntireWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Xoa sheet thua, giu 1
  while (ss.getSheets().length > 1) {
    try { ss.deleteSheet(ss.getSheets()[ss.getSheets().length - 1]); } catch(e) { break; }
  }

  // SHEET 1
  var s1 = ss.getSheets()[0];
  s1.setName('Phan Cong PIC');
  s1.clear();
  try { if (s1.getFilter()) s1.getFilter().remove(); } catch(e) {}

  // Row 1-2: Title
  s1.getRange('A1:I1').merge().setValue('BANG PHAN CONG & TRANG THAI BAN GIAO KHACH HANG').setBackground('#202124').setFontColor('#ffffff').setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('A2:I2').merge().setValue('Chung tu: CS -> Team Chung tu   |   Daily Ops: SD -> Team Client Ops   |   Hieu luc: 02/06/2026').setBackground('#e8f0fe').setFontColor('#1a73e8').setFontSize(10).setHorizontalAlignment('center');

  // Row 3: Group header
  s1.getRange('A3:B3').merge().setValue('').setBackground('#3c4043');
  s1.getRange('C3:E3').merge().setValue('CHUNG TU (CS -> Team Chung tu)').setBackground('#1a73e8').setFontColor('#ffffff').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('F3:H3').merge().setValue('DAILY OPS (SD -> Team Client Ops)').setBackground('#e37400').setFontColor('#ffffff').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('I3').setValue('').setBackground('#3c4043');

  // Row 4: Column headers
  var headers = ['STT','Khach hang','PIC Chung tu','Team hien tai','Trang thai CT','PIC Daily Ops','Team hien tai','Trang thai Ops','Ghi chu'];
  s1.getRange('A4:I4').setValues([headers]).setBackground('#3c4043').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

  // Data - based on correct understanding
  // CT: "Team Chung tu" = da ban giao, "Team CS" = chua ban giao
  // Ops: "Team Client Ops" = da ban giao, "Team SD" = chua ban giao
  var data = [
    [1, 'AQUA B2B',    '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [2, 'CJ | PALDO',  '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [3, 'SCF x KFM',   '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [4, 'SF | WILMAR',  '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [5, 'LG',           '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [6, 'NTF',          '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [7, 'SF | AUX',     '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [8, 'MDLz',         '','Team Solution Design','Chua ban giao', '','Team Solution Design','Chua ban giao','CT & Ops deu con o SD'],
    [9, 'LocknLock',    '','Team CS',             'Dang ban giao', '','Team Solution Design','Chua ban giao','CT: ban giao trong T06/2026'],
    [10,'Phe La',       '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [11,'KEC Uniqlo',   '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [12,'UNICOMMER',    '','Team Chung tu',       'Da ban giao',   '','Team Solution Design','Chua ban giao',''],
    [13,'Honor',        '','',                    'Chua phan cong','','Team Client Ops',     'Da ban giao',  'CT chua co PIC']
  ];
  s1.getRange(5,1,data.length,9).setValues(data).setFontSize(10);

  // Format
  s1.getRange(5,2,data.length,1).setFontWeight('bold');

  // Zebra
  var bgs = [];
  for (var i = 0; i < data.length; i++) {
    var c = (i % 2 === 1) ? '#f8f9fa' : '#ffffff';
    bgs.push([c,c,c,c,c,c,c,c,c]);
  }
  s1.getRange(5,1,data.length,9).setBackgrounds(bgs);

  // Conditional formatting for BOTH status columns (E and H)
  var statusRange1 = s1.getRange('E5:E20');
  var statusRange2 = s1.getRange('H5:H20');
  var rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Da ban giao').setBackground('#e6f4ea').setFontColor('#137333').setBold(true).setRanges([statusRange1, statusRange2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Dang ban giao').setBackground('#fef7e0').setFontColor('#e37400').setBold(true).setRanges([statusRange1, statusRange2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Chua ban giao').setBackground('#fce8e6').setFontColor('#c5221f').setBold(true).setRanges([statusRange1, statusRange2]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Chua phan cong').setBackground('#d3e3fd').setFontColor('#0b57d0').setBold(true).setRanges([statusRange1, statusRange2]).build());
  s1.setConditionalFormatRules(rules);

  // Column widths
  s1.setColumnWidth(1,45);
  s1.setColumnWidth(2,140);
  s1.setColumnWidth(3,140);
  s1.setColumnWidth(4,160);
  s1.setColumnWidth(5,130);
  s1.setColumnWidth(6,140);
  s1.setColumnWidth(7,160);
  s1.setColumnWidth(8,130);
  s1.setColumnWidth(9,200);
  s1.setFrozenRows(4);
  s1.setTabColor('#1a73e8');

  // SHEET 2: Lien he
  var s2 = ss.insertSheet('Lien He PIC');
  var all2 = [
    ['STT','Ho ten','Team','Vai tro','KH phu trach','Email','SDT'],
    [1,'','Team Chung tu','PIC Chung tu','AQUA, CJ, SCF, WILMAR, LG, NTF, AUX, Phe La, Uniqlo, UNICOMMER','',''],
    [2,'','Team Client Ops','PIC Daily Ops','Honor','',''],
    [3,'','Team CS','PIC CT tam (LocknLock)','LocknLock (dang ban giao)','',''],
    [4,'','Team Solution Design','PIC Daily Ops (cac KH con lai)','12 KH (chua ban giao Ops)','',''],
    [5,'','Team Solution Design','PIC CT (MDLz)','MDLz (chua ban giao CT)','','']
  ];
  s2.getRange(1,1,all2.length,7).setValues(all2);
  s2.getRange('A1:G1').setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  s2.setColumnWidth(1,45);
  s2.setColumnWidth(2,160);
  s2.setColumnWidth(3,170);
  s2.setColumnWidth(4,200);
  s2.setColumnWidth(5,300);
  s2.setColumnWidth(6,180);
  s2.setColumnWidth(7,120);
  s2.setFrozenRows(1);
  s2.setTabColor('#34a853');

  // SHEET 3: Escalation
  var s3 = ss.insertSheet('Escalation');
  var all3 = [
    ['Tinh huong','Buoc 1','Buoc 2','Buoc 3'],
    ['Su vu chung tu','Lien he PIC CT cua KH','Escalate Team Lead CT','Escalate Wind'],
    ['Su vu Daily Ops','Lien he PIC Ops cua KH','Escalate TL SD/Client Ops','Escalate Wind'],
    ['Khong ro ai phu trach','Tra Sheet Phan Cong PIC','Lien he Wind',''],
    ['KH moi / doi nhan su','Thong bao Wind','Wind cap nhat & email','']
  ];
  s3.getRange(1,1,all3.length,4).setValues(all3);
  s3.getRange('A1:D1').setBackground('#c5221f').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  s3.getRange(2,1,4,1).setFontWeight('bold');
  s3.setColumnWidth(1,220);
  s3.setColumnWidth(2,250);
  s3.setColumnWidth(3,250);
  s3.setColumnWidth(4,200);
  s3.setFrozenRows(1);
  s3.setTabColor('#c5221f');

  ss.setActiveSheet(s1);
}
