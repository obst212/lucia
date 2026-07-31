import React, { useState } from 'react';
import { SubmissionRecord, FacultyType } from '../types';
import { Search, Download, Trash2, RefreshCw, FileText, CheckCircle, AlertCircle, Clock, GraduationCap, Building2, Users } from 'lucide-react';
import { exportToCsv, deleteRecord, updateRecordStatus, getSavedGasUrl } from '../lib/utils';

interface SubmissionHistoryProps {
  records: SubmissionRecord[];
  onRecordsChange: (updated: SubmissionRecord[]) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  records,
  onRecordsChange,
  showToast
}) => {
  const [filterType, setFilterType] = useState<FacultyType | '전체'>('전체');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filteredRecords = records.filter(r => {
    const matchesType = filterType === '전체' || r.facultyType === filterType;
    const matchesSearch = 
      r.submitterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.trainingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`'${name}' 제출자의 기록을 목록에서 삭제하시겠습니까?`)) {
      const updated = deleteRecord(id);
      onRecordsChange(updated);
      showToast('info', '삭제 완료', '해당 제출 기록이 삭제되었습니다.');
    }
  };

  const handleRetrySubmit = async (record: SubmissionRecord) => {
    const gasUrl = getSavedGasUrl();
    if (!gasUrl) {
      showToast('error', 'URL 미설정', '[설정] 탭에서 구글 시트 배포 URL을 먼저 설정해 주세요.');
      return;
    }

    setRetryingId(record.id);
    showToast('info', '재전송 중', `'${record.submitterName}'님의 이수증 데이터를 구글 시트로 재전송합니다...`);

    try {
      const res = await fetch('/api/submit-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasUrl,
          payload: {
            facultyType: record.facultyType,
            submitterName: record.submitterName,
            trainingName: record.trainingName,
            certificateNumber: record.certificateNumber,
            fileName: record.fileName,
            notes: '재전송제출',
            submittedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
          }
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const updated = updateRecordStatus(record.id, 'success', 'Google 시트 재전송 성공');
        onRecordsChange(updated);
        showToast('success', '재전송 성공!', '구글 시트 DB로 데이터가 성공적으로 전송되었습니다.');
      } else {
        const updated = updateRecordStatus(record.id, 'failed', json.error || '재전송 실패');
        onRecordsChange(updated);
        showToast('error', '재전송 실패', json.error || '구글 시트 전송 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      const updated = updateRecordStatus(record.id, 'failed', err.message || '네트워크 오류');
      onRecordsChange(updated);
      showToast('error', '재전송 실패', err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setRetryingId(null);
    }
  };

  const getFacultyIcon = (type: FacultyType) => {
    switch (type) {
      case '교원': return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case '지방공무원': return <Building2 className="w-4 h-4 text-blue-600" />;
      case '교육공무직': return <Users className="w-4 h-4 text-teal-600" />;
    }
  };

  const getStatusBadge = (status: SubmissionRecord['gasStatus']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
            성공
          </span>
        );
      case 'simulated':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
            <Clock className="w-3 h-3 mr-1 text-indigo-600" />
            로컬저장
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
            <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
            전송실패
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
      
      {/* Header Bar */}
      <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>제출 내역 관리 및 조회</span>
            <span className="text-xs font-bold bg-blue-600/80 text-white px-2.5 py-0.5 rounded-full">
              총 {records.length}건
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            제출된 연수 이수증 기록을 확인하고 CSV 엑셀 파일로 다운로드하거나 구글 시트로 재전송합니다.
          </p>
        </div>

        <button
          type="button"
          id="btn-export-csv"
          onClick={() => exportToCsv(records)}
          disabled={records.length === 0}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>CSV 엑셀 다운로드</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Category Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto">
          {(['전체', '교원', '지방공무원', '교육공무직'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterType === type
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="제출자 성명, 연수명, 이수증 번호 검색..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-base text-slate-700">제출된 연수 이수증 내역이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">이수증 제출 폼에서 데이터를 작성하여 전송해 보세요.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <th className="p-3.5 pl-5">제출일시</th>
                <th className="p-3.5">구분</th>
                <th className="p-3.5">제출자 성명</th>
                <th className="p-3.5">연수명</th>
                <th className="p-3.5">이수증 번호</th>
                <th className="p-3.5">첨부파일</th>
                <th className="p-3.5">시트 전송 상태</th>
                <th className="p-3.5 text-right pr-5">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  <td className="p-3.5 pl-5 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(rec.submittedAt).toLocaleString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
                      {getFacultyIcon(rec.facultyType)}
                      <span>{rec.facultyType}</span>
                    </span>
                  </td>

                  <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {rec.submitterName}
                  </td>

                  <td className="p-3.5 max-w-xs font-medium text-slate-800 truncate" title={rec.trainingName}>
                    {rec.trainingName}
                  </td>

                  <td className="p-3.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                    {rec.certificateNumber}
                  </td>

                  <td className="p-3.5 text-slate-600 max-w-xs truncate" title={rec.fileName}>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{rec.fileName}</span>
                    </span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    {getStatusBadge(rec.gasStatus)}
                  </td>

                  <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      {rec.gasStatus !== 'success' && (
                        <button
                          type="button"
                          onClick={() => handleRetrySubmit(rec)}
                          disabled={retryingId === rec.id}
                          className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 flex items-center space-x-1 transition-all cursor-pointer"
                          title="구글 시트로 다시 전송"
                        >
                          <RefreshCw className={`w-3 h-3 ${retryingId === rec.id ? 'animate-spin' : ''}`} />
                          <span>재전송</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id, rec.submitterName)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="기록 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
