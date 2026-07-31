import React from 'react';
import { ExtractionResult } from '../types';
import { Sparkles, Check, Building2, Clock, Calendar, User, FileText, AlertTriangle } from 'lucide-react';

interface AiExtractorCardProps {
  result: ExtractionResult;
  onApply: (data: Partial<ExtractionResult>) => void;
}

export const AiExtractorCard: React.FC<AiExtractorCardProps> = ({
  result,
  onApply
}) => {
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">높은 신뢰도 (High)</span>;
      case 'medium':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">보통 신뢰도 (Medium)</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">확인 필요 (Low)</span>;
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-xl ring-1 ring-white/10 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-amber-300 flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Gemini AI 이수증 스마트 분석 결과</h3>
            <p className="text-xs text-indigo-200/80">문서에서 추출된 연수 정보가 아래 폼에 적용되었습니다.</p>
          </div>
        </div>
        <div>
          {getConfidenceBadge(result.confidence)}
        </div>
      </div>

      {/* Grid of Extracted Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
        
        <div className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/40">
          <div className="text-indigo-300 font-semibold mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>추출된 연수명</span>
          </div>
          <p className="text-sm font-bold text-white break-words">
            {result.trainingName || <span className="text-slate-400 font-normal italic">인식되지 않음</span>}
          </p>
        </div>

        <div className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/40">
          <div className="text-indigo-300 font-semibold mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>추출된 이수증 번호</span>
          </div>
          <p className="text-sm font-bold text-amber-300 font-mono break-words">
            {result.certificateNumber || <span className="text-slate-400 font-normal italic">인식되지 않음</span>}
          </p>
        </div>

        {result.submitterName && (
          <div className="bg-indigo-900/30 p-2.5 rounded-lg border border-indigo-800/30 flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-indigo-300 font-medium block">문서 상 제출자명</span>
              <span className="text-white font-bold">{result.submitterName}</span>
            </div>
          </div>
        )}

        {result.institution && (
          <div className="bg-indigo-900/30 p-2.5 rounded-lg border border-indigo-800/30 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-indigo-300 font-medium block">연수 기관</span>
              <span className="text-white font-bold">{result.institution}</span>
            </div>
          </div>
        )}

        {result.completionHours && (
          <div className="bg-indigo-900/30 p-2.5 rounded-lg border border-indigo-800/30 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-indigo-300 font-medium block">연수 시간</span>
              <span className="text-white font-bold">{result.completionHours}</span>
            </div>
          </div>
        )}

        {result.completionDate && (
          <div className="bg-indigo-900/30 p-2.5 rounded-lg border border-indigo-800/30 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-indigo-300 font-medium block">이수 일자</span>
              <span className="text-white font-bold">{result.completionDate}</span>
            </div>
          </div>
        )}

      </div>

      {result.summary && (
        <p className="text-xs text-indigo-200/90 bg-indigo-950/80 p-2.5 rounded-lg border border-indigo-800/50 mb-3">
          💡 <span className="font-semibold text-white">AI 문서 요약:</span> {result.summary}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-indigo-300/70 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          추출된 값이 실제 문서와 다를 경우 아래 입력 폼에서 자유롭게 수정하실 수 있습니다.
        </span>

        <button
          type="button"
          onClick={() => onApply(result)}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center space-x-1 shadow-md transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>폼에 재적용</span>
        </button>
      </div>
    </div>
  );
};
