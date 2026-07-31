import React, { useState } from 'react';
import { FacultyType, CertificateForm, ExtractionResult, SubmissionRecord } from '../types';
import { FacultyTypeSelector } from './FacultyTypeSelector';
import { FileUploader } from './FileUploader';
import { AiExtractorCard } from './AiExtractorCard';
import { Send, User, BookOpen, Hash, RefreshCw, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { saveRecord, getSavedGasUrl } from '../lib/utils';

interface SubmissionFormProps {
  onSuccess: (record: SubmissionRecord) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  gasUrl: string;
  onOpenGasGuide: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  onSuccess,
  showToast,
  gasUrl,
  onOpenGasGuide
}) => {
  const [formData, setFormData] = useState<CertificateForm>({
    facultyType: '교원',
    submitterName: '',
    trainingName: '',
    certificateNumber: '',
    file: null,
    fileDataUrl: '',
    fileName: '',
    fileType: ''
  });

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // File Change Handler
  const handleFileChange = (
    file: File | null, 
    dataUrl: string, 
    _base64Data: string, 
    _mimeType: string
  ) => {
    setFormData(prev => ({
      ...prev,
      file,
      fileDataUrl: dataUrl,
      fileName: file ? file.name : '',
      fileType: file ? file.type : ''
    }));

    if (!file) {
      setExtractionResult(null);
    }
  };

  // Trigger Gemini AI Extraction via Backend Route (/api/gemini/extract)
  const handleExtractAi = async (base64Data: string, mimeType: string, fileName: string) => {
    if (!base64Data) return;

    setIsExtracting(true);
    showToast('info', 'AI 이수증 분석 시작', 'Gemini AI가 이수증 파일에서 연수명과 번호를 판독 중입니다...');

    try {
      const response = await fetch('/api/gemini/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType, fileName })
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Gemini 분석 중 오류가 발생했습니다.');
      }

      const resData: ExtractionResult = json.data;
      setExtractionResult(resData);

      // Auto Fill Form Fields if extracted values are present
      setFormData(prev => ({
        ...prev,
        trainingName: resData.trainingName || prev.trainingName,
        certificateNumber: resData.certificateNumber || prev.certificateNumber,
        submitterName: resData.submitterName && !prev.submitterName ? resData.submitterName : prev.submitterName
      }));

      showToast(
        'success',
        'AI 이수증 자동 추출 완료!',
        `연수명과 이수증 번호가 감지되어 폼에 입력되었습니다. (신뢰도: ${resData.confidence.toUpperCase()})`
      );
    } catch (err: any) {
      console.error('AI Extraction Error:', err);
      showToast(
        'warning',
        'AI 자동 추출 제한',
        err.message || '이수증 자동 추출에 실패했습니다. 입력란에 직접 입력해 주세요.'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Form Reset
  const handleReset = () => {
    setFormData({
      facultyType: '교원',
      submitterName: '',
      trainingName: '',
      certificateNumber: '',
      file: null,
      fileDataUrl: '',
      fileName: '',
      fileType: ''
    });
    setExtractionResult(null);
    showToast('info', '폼 초기화 완료', '모든 입력값이 초기화되었습니다.');
  };

  // Apply Extracted Values manually
  const handleApplyExtracted = (data: Partial<ExtractionResult>) => {
    setFormData(prev => ({
      ...prev,
      trainingName: data.trainingName || prev.trainingName,
      certificateNumber: data.certificateNumber || prev.certificateNumber,
      submitterName: data.submitterName || prev.submitterName
    }));
    showToast('info', '폼 반영 완료', '추출된 데이터가 입력란에 다시 적용되었습니다.');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.submitterName.trim()) {
      showToast('error', '입력 오류', '제출자 성명을 입력해 주세요.');
      return;
    }
    if (!formData.trainingName.trim()) {
      showToast('error', '입력 오류', '연수명을 입력해 주세요.');
      return;
    }
    if (!formData.certificateNumber.trim()) {
      showToast('error', '입력 오류', '이수증 번호를 입력해 주세요.');
      return;
    }
    if (!formData.file) {
      showToast('error', '파일 누락', '연수 이수증 파일을 첨부해 주세요.');
      return;
    }

    setIsSubmitting(true);
    const targetGasUrl = gasUrl || getSavedGasUrl();

    const submissionPayload = {
      facultyType: formData.facultyType,
      submitterName: formData.submitterName.trim(),
      trainingName: formData.trainingName.trim(),
      certificateNumber: formData.certificateNumber.trim(),
      fileName: formData.fileName,
      fileType: formData.fileType,
      notes: extractionResult ? `AI분석완료(${extractionResult.confidence})` : '수동입력제출',
      submittedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };

    let gasStatus: 'success' | 'failed' | 'simulated' = 'pending' as any;
    let gasMessage = '';

    try {
      if (targetGasUrl) {
        // Send via backend proxy to safely post to GAS
        const res = await fetch('/api/submit-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gasUrl: targetGasUrl,
            payload: submissionPayload
          })
        });

        const resJson = await res.json();
        if (res.ok && resJson.success) {
          gasStatus = 'success';
          gasMessage = 'Google 시트에 정상 기록되었습니다.';
          showToast('success', '제출 성공!', '연수 이수증 정보가 Google 시트 DB로 안전하게 전송되었습니다.');
        } else {
          gasStatus = 'failed';
          gasMessage = resJson.error || 'Google 시트 전송에 응답하지 못했습니다.';
          showToast(
            'warning',
            '제출 완료 (DB 전송 확인 필요)',
            '로컬 제출 기록은 저장되었으나, 구글 시트 URL 접속 상태를 점검해 보세요.'
          );
        }
      } else {
        // Simulated Local Save Mode
        gasStatus = 'simulated';
        gasMessage = '구글 시트 URL 미설정 (시뮬레이션 모드로 저장됨)';
        showToast(
          'info',
          '제출 기록 저장 완료',
          '구글 시트 URL이 설정되지 않아 시스템 로컬 기록에만 보관되었습니다. [설정] 탭에서 URL을 연결하실 수 있습니다.'
        );
      }
    } catch (err: any) {
      console.error('Submission Proxy Error:', err);
      gasStatus = 'failed';
      gasMessage = err.message || '네트워크 전송 오류';
      showToast('error', '전송 실패', '전송 도중 오류가 발생하였습니다. 제출 내역에서 재시도할 수 있습니다.');
    } finally {
      setIsSubmitting(false);

      // Create new record
      const record: SubmissionRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        submittedAt: new Date().toISOString(),
        facultyType: formData.facultyType,
        submitterName: formData.submitterName.trim(),
        trainingName: formData.trainingName.trim(),
        certificateNumber: formData.certificateNumber.trim(),
        fileName: formData.fileName,
        fileDataUrl: formData.fileDataUrl,
        gasStatus,
        gasMessage
      };

      saveRecord(record);
      onSuccess(record);

      // Reset Form fields
      handleReset();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden transition-all">
      
      {/* Form Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>연수 이수증 제출 양식</span>
              <span className="text-xs font-normal text-indigo-300 bg-indigo-900/60 border border-indigo-700/60 px-2.5 py-0.5 rounded-full">
                원스톱 스마트 접수
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              이수증 파일을 올리면 Gemini AI가 연수명과 번호를 자동으로 채워 드립니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenGasGuide}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center space-x-1 border border-emerald-500/40 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-200" />
            <span>구글 시트 연결 안내</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* 1. Faculty Type Selection */}
        <FacultyTypeSelector
          value={formData.facultyType}
          onChange={(type: FacultyType) => setFormData(prev => ({ ...prev, facultyType: type }))}
        />

        {/* 2. Submitter Name Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>성명</span>
                <span className="text-indigo-600 font-bold">*</span>
              </span>
            </label>
            <input
              type="text"
              id="input-submitter-name"
              value={formData.submitterName}
              onChange={(e) => setFormData(prev => ({ ...prev, submitterName: e.target.value }))}
              placeholder="성명을 입력하세요"
              required
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                <span>이수증 번호 (AI 추천)</span>
                <span className="text-indigo-600 font-bold">*</span>
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-normal bg-indigo-50 px-2 py-0.5 rounded-full">AI 추출 가능</span>
            </label>
            <input
              type="text"
              id="input-certificate-number"
              value={formData.certificateNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, certificateNumber: e.target.value }))}
              placeholder="예: CERT-EDU-2026-00152"
              required
              className="w-full px-4 py-3 rounded-lg border border-indigo-200 bg-indigo-50/20 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono text-slate-900 transition-all"
            />
          </div>
        </div>

        {/* 3. Training Name Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>연수명 (AI 추천)</span>
              <span className="text-indigo-600 font-bold">*</span>
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-normal bg-indigo-50 px-2 py-0.5 rounded-full">AI 추출 가능</span>
          </label>
          <input
            type="text"
            id="input-training-name"
            value={formData.trainingName}
            onChange={(e) => setFormData(prev => ({ ...prev, trainingName: e.target.value }))}
            placeholder="예: 2026학년도 인공지능 융합 교육 심화 과정"
            required
            className="w-full px-4 py-3 rounded-lg border border-indigo-200 bg-indigo-50/20 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 transition-all"
          />
        </div>

        {/* 4. File Attachment Upload Zone */}
        <FileUploader
          file={formData.file}
          fileDataUrl={formData.fileDataUrl}
          onFileChange={handleFileChange}
          onExtractAi={handleExtractAi}
          isExtracting={isExtracting}
          extractionResult={extractionResult}
        />

        {/* 5. AI Extracted Card Results */}
        {extractionResult && (
          <AiExtractorCard
            result={extractionResult}
            onApply={handleApplyExtracted}
          />
        )}

        {/* Security & System Info Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-slate-800">보안성 및 개인정보 보호 안내:</span>
            <span className="ml-1">
              제출된 연수 정보는 학교 전용 Google Apps Script 및 보안 백엔드를 통해 전송됩니다.
              Gemini API 키는 서버측에만 안전하게 보호되며 브라우저로 노출되지 않습니다.
            </span>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            id="btn-reset-form"
            onClick={handleReset}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>양식 초기화</span>
          </button>

          <button
            type="submit"
            id="btn-submit-certificate"
            disabled={isSubmitting || isExtracting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Google 시트로 전송 중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>제출하기</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
