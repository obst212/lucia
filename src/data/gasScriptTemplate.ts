export const GAS_SCRIPT_CODE = `/**
 * 교직원 연수 이수증 자동 취합 Google Apps Script (GAS)
 * Google 시트의 [확장 프로그램] -> [Apps Script]에 붙여넣고 [웹 앱으로 배포]하세요.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // 첫번째 행에 헤더가 없는 경우 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "제출일시", 
        "교직원유형", 
        "제출자성명", 
        "연수명", 
        "이수증번호", 
        "파일명", 
        "비고/상태"
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#e8f0fe");
    }

    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      data = e.parameter;
    }

    var timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    var facultyType = data.facultyType || "미지정";
    var submitterName = data.submitterName || "미입력";
    var trainingName = data.trainingName || "미입력";
    var certificateNumber = data.certificateNumber || "미입력";
    var fileName = data.fileName || "첨부파일없음";
    var notes = data.notes || "정상제출";

    // 데이터 행 추가
    sheet.appendRow([
      timestamp,
      facultyType,
      submitterName,
      trainingName,
      certificateNumber,
      fileName,
      notes
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      "result": "success",
      "message": "연수 이수증이 성공적으로 등록되었습니다.",
      "timestamp": timestamp
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error",
      "error": error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    "status": "online",
    "message": "교직원 연수 이수증 수집 API가 정상 작동 중입니다."
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

export const GAS_SETUP_STEPS = [
  {
    step: 1,
    title: "Google 시트 생성",
    desc: "Google Drive에서 새로운 Google 시트 문서(예: '2026학년도 교직원 연수 이수증 취합부')를 만듭니다."
  },
  {
    step: 2,
    title: "Apps Script 열기",
    desc: "상단 메뉴에서 [확장 프로그램] -> [Apps Script]를 클릭합니다."
  },
  {
    step: 3,
    title: "코드 복사 및 붙여넣기",
    desc: "기존 코드를 지우고, 아래 제공된 GAS 스크립트 코드를 그대로 복사하여 붙여넣고 저장(Ctrl+S)합니다."
  },
  {
    step: 4,
    title: "웹 앱 배포 설정",
    desc: "우측 상단 [배포] -> [새 배포] 클릭 후 ⚙️아이콘에서 '웹 앱'을 선택합니다.\n• 설명: 연수 이수증 수집 API\n• 다음 사용자 권한으로 실행: 나 (Me)\n• 액세스 권한이 있는 사용자: 모든 사용자 (Anyone)"
  },
  {
    step: 5,
    title: "URL 붙여넣기",
    desc: "배포 후 생성된 '웹 앱 URL'(https://script.google.com/macros/s/.../exec)을 복사하여 본 시스템의 [설정] 탭에 입력하면 연동이 완료됩니다!"
  }
];
