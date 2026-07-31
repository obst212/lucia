import React, { useState } from 'react';
import { GAS_SCRIPT_CODE, GAS_SETUP_STEPS } from '../data/gasScriptTemplate';
import { Copy, Check, FileSpreadsheet, ExternalLink, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { saveGasUrl, getSavedGasUrl } from '../lib/utils';

interface GasGuideModalProps {
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const GasGuideModal: React.FC<GasGuideModalProps> = ({
  gasUrl,
  onSaveGasUrl,
  showToast
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>(gasUrl || getSavedGasUrl());
  const [testing, setTesting] = useState<boolean>(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE);
    setCopied(true);
    showToast('success', '코드 복사 완료', 'Google Apps Script 코드가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveUrl = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      showToast('warning', 'URL 확인', 'Google Apps Script 배포 URL을 입력해 주세요.');
      return;
    }
    saveGasUrl(trimmed);
    onSaveGasUrl(trimmed);
    showToast('success', '설정 저장 완료', 'Google 시트 배포 URL이 저장되었습니다.');
  };

  const handleTestConnection = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      showToast('warning', 'URL 미입력', '테스트할 Google Apps Script URL을 먼저 입력해 주세요.');
      return;
    }

    setTesting(true);
    showToast('info', '연결 테스트 시작', 'Google Apps Script 엔드포인트 응답을 테스트 중입니다...');

    try {
      const res = await fetch('/api/submit-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasUrl: trimmed,
          payload: {
            facultyType: '테스트',
            submitterName: '시스템검증',
            trainingName: '연동 테스트 연수',
            certificateNumber: 'TEST-2026-000',
            fileName: 'test.pdf',
            notes: '시스템연동확인테스트',
            submittedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
          }
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast('success', '구글 시트 연동 성공! 🎉', 'Google 시트에 테스트 행이 추가되었습니다. 정상 작동합니다.');
        saveGasUrl(trimmed);
        onSaveGasUrl(trimmed);
      } else {
        showToast(
          'warning',
          '응답 상태 점검',
          'GAS URL이 웹 앱으로 올바르게 배포되었는지, [액세스 권한: 모든 사용자]로 설정되었는지 확인해 주세요.'
        );
      }
    } catch (err: any) {
      showToast('error', '연결 실패', err.message || '네트워크 접속 오류가 발생했습니다.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white border border-emerald-800/80 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Google 시트 DB 연동가이드</h2>
            <p className="text-xs text-emerald-200/80">학교 구글 시트 문서와 본 시스템을 무료로 연동하여 자동 취합부를 구축합니다.</p>
          </div>
        </div>
      </div>

      {/* 1. URL Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Google Apps Script 웹 앱 URL 설정</span>
          </h3>
          <span className="text-xs text-slate-500 font-semibold">NEXT_PUBLIC_GAS_URL</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Google 시트에서 배포한 <span className="font-bold text-slate-800">웹 앱 URL (https://script.google.com/macros/s/.../exec)</span>을 아래에 입력하시면 제출된 연수 이수증 정보가 해당 구글 시트에 실시간으로 기록됩니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            id="input-gas-url-settings"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-xs font-mono text-slate-900 placeholder:text-slate-400 bg-white"
          />

          <button
            type="button"
            id="btn-test-gas-connection"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <span>{testing ? '테스트 중...' : '연동 테스트 실행'}</span>
          </button>

          <button
            type="button"
            id="btn-save-gas-url"
            onClick={handleSaveUrl}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>설정 저장</span>
          </button>
        </div>

        {gasUrl && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>현재 설정된 구글 시트 URL이 정상 등록되어 있습니다.</span>
          </div>
        )}
      </div>

      {/* 2. Step-by-Step Instructions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-md space-y-5">
        <h3 className="font-bold text-slate-800 text-base border-b border-slate-200 pb-3 flex items-center gap-2">
          <span>Google Apps Script 5단계 연동 방법</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GAS_SETUP_STEPS.map((step) => (
            <div key={step.step} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {step.step}
                </span>
                <span className="font-bold text-sm text-slate-900">{step.title}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line pl-8">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GAS Code Template Box */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <span>Google Apps Script (GAS) 표준 소스코드</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Google 시트의 Apps Script 편집기에 복사해 붙여넣으세요.</p>
          </div>

          <button
            type="button"
            id="btn-copy-gas-code"
            onClick={handleCopyCode}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>코드 전체 복사</span>
              </>
            )}
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto max-h-80 leading-relaxed border border-slate-800/80">
          <code>{GAS_SCRIPT_CODE}</code>
        </pre>
      </div>

    </div>
  );
};
