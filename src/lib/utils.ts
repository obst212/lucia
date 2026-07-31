import { SubmissionRecord } from '../types';

export function fileToBase64(file: File): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const matches = result.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        resolve({
          mimeType: matches[1],
          base64Data: matches[2]
        });
      } else {
        reject(new Error("파일을 읽는 중 데이터 형식을 분석할 수 없습니다."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}

export function formatKoreanDate(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

const STORAGE_KEY_RECORDS = 'cert_submission_records_v1';
const STORAGE_KEY_GAS_URL = 'cert_submission_gas_url_v1';

export function getSavedRecords(): SubmissionRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveRecord(record: SubmissionRecord): SubmissionRecord[] {
  try {
    const current = getSavedRecords();
    const updated = [record, ...current];
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Local storage save error:", e);
    return getSavedRecords();
  }
}

export function updateRecordStatus(
  id: string, 
  status: 'success' | 'pending' | 'failed' | 'simulated', 
  message?: string
): SubmissionRecord[] {
  try {
    const current = getSavedRecords();
    const updated = current.map(r => r.id === id ? { ...r, gasStatus: status, gasMessage: message } : r);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    return updated;
  } catch {
    return getSavedRecords();
  }
}

export function deleteRecord(id: string): SubmissionRecord[] {
  try {
    const current = getSavedRecords();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updated));
    return updated;
  } catch {
    return getSavedRecords();
  }
}

export function getSavedGasUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GAS_URL);
    if (saved) return saved;
  } catch {
    // fallback
  }
  const metaEnv = (import.meta as any).env || {};
  return metaEnv.VITE_NEXT_PUBLIC_GAS_URL || metaEnv.NEXT_PUBLIC_GAS_URL || '';
}

export function saveGasUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_GAS_URL, url.trim());
  } catch (e) {
    console.error("Failed to save GAS URL:", e);
  }
}

export function exportToCsv(records: SubmissionRecord[]): void {
  if (!records.length) return;

  const headers = ['제출일시', '교직원유형', '제출자성명', '연수명', '이수증번호', '파일명', '구글시트전송상태'];
  
  const csvRows = records.map(r => [
    `"${r.submittedAt}"`,
    `"${r.facultyType}"`,
    `"${r.submitterName}"`,
    `"${r.trainingName}"`,
    `"${r.certificateNumber}"`,
    `"${r.fileName}"`,
    `"${r.gasStatus === 'success' ? '전송완료' : r.gasStatus === 'simulated' ? '테스트전송' : '전송실패'}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `교직원_연수이수증_취합목록_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
