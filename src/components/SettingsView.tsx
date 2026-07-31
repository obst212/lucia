import React, { useState } from 'react';
import { getSavedGasUrl, saveGasUrl, getSavedRecords } from '../lib/utils';
import { Settings, Save, Trash2, ShieldCheck, Key, Server, Database } from 'lucide-react';

interface SettingsViewProps {
  gasUrl: string;
  onSaveGasUrl: (url: string) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  onClearRecords: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  gasUrl,
  onSaveGasUrl,
  showToast,
  onClearRecords
}) => {
  const [url, setUrl] = useState<string>(gasUrl || getSavedGasUrl());
  const [testingHealth, setTestingHealth] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ hasGeminiKey: boolean; status: string } | null>(null);

  const handleSave = () => {
    saveGasUrl(url.trim());
    onSaveGasUrl(url.trim());
    showToast('success', '저장 완료', '구글 시트 배포 URL이 저장되었습니다.');
  };

  const handleCheckHealth = async () => {
    setTestingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setServerStatus(data);
      if (data.hasGeminiKey) {
        showToast('success', '서버 상태 양호', 'Gemini API 키가 서버 환경변수(GEMINI_API_KEY)에 정상 로드되었습니다.');
      } else {
        showToast('warning', 'API 키 필요', 'GEMINI_API_KEY가 설정되어 있지 않습니다. AI Studio Secrets에서 설정할 수 있습니다.');
      }
    } catch {
      showToast('error', '서버 응답 없음', '백엔드 서버와 통신할 수 없습니다.');
    } finally {
      setTestingHealth(false);
    }
  };

  const handleClear = () => {
    if (confirm('저장된 모든 이수증 로컬 제출 기록을 초기화하시겠습니까? (구글 시트에 등록된 데이터는 삭제되지 않습니다)')) {
      localStorage.removeItem('cert_submission_records_v1');
      onClearRecords();
      showToast('info', '초기화 완료', '로컬 제출 내역 데이터가 제거되었습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">시스템 설정 및 환경 점검</h2>
            <p className="text-xs text-slate-400 mt-0.5">Google 시트 DB 연동 URL 관리 및 백엔드 보안 상태를 점검합니다.</p>
          </div>
        </div>
      </div>

      {/* GAS URL Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-md space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-200 pb-3">
          <Database className="w-5 h-5 text-indigo-600" />
          <span>Google Apps Script (GAS) Web App 배포 URL</span>
        </h3>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">GAS Web App Executable URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white"
            />
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>저장</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            환경 변수 <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">NEXT_PUBLIC_GAS_URL</code> 또는 상단 입력란을 통해 실시간 연동이 제어됩니다.
          </p>
        </div>
      </div>

      {/* Security & Health Check */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-md space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-200 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>보안 규격 및 Gemini AI 서버 헬스체크</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Gemini API 보안 상태</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini API 키는 브라우저(<code className="bg-slate-200 px-1 rounded">process.env</code>)로 절대 노출되지 않으며 백엔드 서버 라우트(<code className="bg-slate-200 px-1 rounded">/api/gemini/extract</code>)에서 안전하게 사용됩니다.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>서버 연결 및 상태 확인</span>
            </div>
            <button
              type="button"
              onClick={handleCheckHealth}
              disabled={testingHealth}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
            >
              {testingHealth ? '점검 중...' : '서버 상태 점검 실행'}
            </button>
            {serverStatus && (
              <div className="text-xs mt-2 font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                상태: {serverStatus.status} | API 키 감지: {serverStatus.hasGeminiKey ? '✅ 연결됨' : '❌ 미설정'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-md space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-200 pb-3">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <span>로컬 캐시 데이터 관리</span>
        </h3>
        <p className="text-xs text-slate-600">
          현재 브라우저에 임시 보관 중인 제출 내역 <b>({getSavedRecords().length}건)</b>을 삭제할 수 있습니다.
        </p>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>로컬 제출 내역 전체 삭제</span>
        </button>
      </div>
    </div>
  );
};
