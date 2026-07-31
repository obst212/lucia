import React from 'react';
import { FileText, History, FileSpreadsheet, Settings, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'form' | 'history' | 'guide' | 'settings';
  setActiveTab: (tab: 'form' | 'history' | 'guide' | 'settings') => void;
  submissionCount: number;
  hasGasUrl: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  submissionCount,
  hasGasUrl
}) => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                  교직원 연수 이수증 취합 시스템
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-500" />
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>교원 · 지방공무원 · 교육공무직 연수 이수증 구글 시트 수집</span>
              </p>
            </div>
          </div>

          {/* Status Indicator Pill */}
          <div className="flex items-center space-x-3 text-xs">
            <div className={`px-3 py-1 rounded-full border flex items-center space-x-2 font-medium ${
              hasGasUrl 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-indigo-50 border-indigo-100 text-indigo-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${hasGasUrl ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`} />
              <span className="text-xs font-semibold">{hasGasUrl ? 'Google 시트 DB 연결 활성' : '구글 시트 URL 설정 필요'}</span>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-100 pt-1.5 pb-2 overflow-x-auto scrollbar-none">
          <button
            id="tab-form"
            onClick={() => setActiveTab('form')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === 'form'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>이수증 제출</span>
          </button>

          <button
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <History className="w-4 h-4" />
            <span>제출 내역</span>
            {submissionCount > 0 && (
              <span className={`ml-1 px-2 py-0.5 text-[10px] rounded-full font-bold ${
                activeTab === 'history' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {submissionCount}
              </span>
            )}
          </button>

          <button
            id="tab-guide"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>구글 시트 연동 가이드</span>
          </button>

          <button
            id="tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>설정</span>
          </button>
        </div>

      </div>
    </header>
  );
};
