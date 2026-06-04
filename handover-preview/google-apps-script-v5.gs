function setupEntireWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Xoa het sheet thua, giu lai 1
  while (ss.getSheets().length > 1) {
    try { ss.deleteSheet(ss.getSheets()[ss.getSheets().length - 1]); } catch(e) { break; }
  }

  // SHEET 1
  var s1 = ss.getSheets()[0];
  s1.setName('Phan Cong PIC');
  s1.clear();
  try { s1.getRange('H1:H100').setDataValidation(null); } catch(e) {}
  try { s1.getRange('C1:C100').setDataValidation(null); } catch(e) {}
  try { if (s1.getFilter()) s1.getFilter().remove(); } catch(e) {}

  s1.getRange('A1:J1').merge().setValue('BANG PHAN CONG PIC KHACH HANG').setBackground('#202124').setFontColor('#ffffff').setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');
  s1.getRange('A2:J2').merge().setValue('Hieu luc: 02/06/2026  |  v1.0').setBackground('#e8f0fe').setFontColor('#1a73e8').setFontSize(10).setHorizontalAlignment('center');

  var all1 = [
    ['STT','Khach hang','Nganh hang','PIC Chung tu','Team Chung tu','PIC Daily Ops','Team Daily Ops','Trang thai','Timeline','Ghi chu'],
    [1,'AQUA B2B','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [2,'CJ | PALDO','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [3,'SCF x KFM','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [4,'SF | WILMAR','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [5,'LG','Dien may','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [6,'NTF','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [7,'SF | AUX','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [8,'MDLz','','','Team Solution Design','','Team Solution Design','Da ban giao','','Ca CT & ops do SD'],
    [9,'LocknLock','','','CS -> Chung tu','','Team Solution Design','Dang ban giao','T06/2026','Dang ban giao'],
    [10,'Phe La','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [11,'KEC Uniqlo','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [12,'UNICOMMER','','','Team Chung tu','','Team Solution Design','Da ban giao','',''],
    [13,'Honor','Dien may','','(chua phan cong)','','Team Client Ops','Can xac nhan','','Chua co PIC CT']
  ];
  s1.getRange(3,1,all1.length,10).setValues(all1);

  // Format header
  s1.getRange('A3:J3').setBackground('#3c4043').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');

  // Format data
  s1.getRange(4,1,13,10).setFontSize(10);
  s1.getRange(4,2,13,1).setFontWeight('bold');

  // Zebra batch
  var bgs = [];
  for (var i = 0; i < 13; i++) {
    var c = (i % 2 === 1) ? '#f8f9fa' : '#ffffff';
    bgs.push([c,c,c,c,c,c,c,c,c,c]);
  }
  s1.getRange(4,1,13,10).setBackgrounds(bgs);

  // Conditional formatting
  var rules = [];
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Da ban giao').setBackground('#e6f4ea').setFontColor('#137333').setBold(true).setRanges([s1.getRange('H4:H20')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Dang ban giao').setBackground('#fef7e0').setFontColor('#e37400').setBold(true).setRanges([s1.getRange('H4:H20')]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Can xac nhan').setBackground('#d3e3fd').setFontColor('#0b57d0').setBold(true).setRanges([s1.getRange('H4:H20')]).build());
  s1.setConditionalFormatRules(rules);

  s1.setColumnWidth(1,45);
  s1.setColumnWidth(2,150);
  s1.setColumnWidth(3,110);
  s1.setColumnWidth(4,150);
  s1.setColumnWidth(5,180);
  s1.setColumnWidth(6,150);
  s1.setColumnWidth(7,170);
  s1.setColumnWidth(8,140);
  s1.setColumnWidth(9,100);
  s1.setColumnWidth(10,200);
  s1.setFrozenRows(3);
  s1.setTabColor('#1a73e8');

  // SHEET 2
  var s2 = ss.insertSheet('Lien He PIC');
  var all2 = [
    ['STT','Ho ten','Team','Vai tro','KH phu trach','Email','SDT'],
    [1,'','Team Chung tu','PIC Chung tu','AQUA, CJ, SCF, WILMAR, LG, NTF, AUX, Phe La, Uniqlo, UNICOMMER','',''],
    [2,'','Team Solution Design','PIC Daily Ops','Tat ca KH tru Honor','',''],
    [3,'','Team Solution Design','PIC CT (MDLz)','MDLz','',''],
    [4,'','Team Client Ops','PIC Daily Ops','Honor','',''],
    [5,'','Team CS','PIC CT tam (LocknLock)','LocknLock','','']
  ];
  s2.getRange(1,1,all2.length,7).setValues(all2);
  s2.getRange('A1:G1').setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  s2.getRange(2,1,5,7).setFontSize(10);
  s2.setColumnWidth(1,45);
  s2.setColumnWidth(2,160);
  s2.setColumnWidth(3,170);
  s2.setColumnWidth(4,180);
  s2.setColumnWidth(5,300);
  s2.setColumnWidth(6,180);
  s2.setColumnWidth(7,120);
  s2.setFrozenRows(1);
  s2.setTabColor('#34a853');

  // SHEET 3
  var s3 = ss.insertSheet('Escalation');
  var all3 = [
    ['Tinh huong','Buoc 1','Buoc 2','Buoc 3'],
    ['Su vu chung tu','Lien he PIC CT cua KH','Escalate Team Lead CT','Escalate Wind'],
    ['Su vu Daily Ops','Lien he PIC Ops cua KH','Escalate TL SD/Client Ops','Escalate Wind'],
    ['Khong ro ai phu trach','Tra Sheet Phan Cong PIC','Lien he Wind',''],
    ['KH moi','Thong bao Wind','Wind cap nhat Sheet',''],
    ['Doi nhan su PIC','TL thong bao Wind','Wind cap nhat & email','']
  ];
  s3.getRange(1,1,all3.length,4).setValues(all3);
  s3.getRange('A1:D1').setBackground('#c5221f').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');
  s3.getRange(2,1,5,4).setFontSize(10);
  s3.getRange(2,1,5,1).setFontWeight('bold');
  s3.setColumnWidth(1,220);
  s3.setColumnWidth(2,250);
  s3.setColumnWidth(3,250);
  s3.setColumnWidth(4,200);
  s3.setFrozenRows(1);
  s3.setTabColor('#c5221f');

  ss.setActiveSheet(s1);
}
