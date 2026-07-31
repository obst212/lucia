import React, { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, X, Sparkles, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { fileToBase64 } from '../lib/utils';
import { ExtractionResult } from '../types';

interface FileUploaderProps {
  file: File | null;
  fileDataUrl: string;
  onFileChange: (file: File | null, dataUrl: string, base64Data: string, mimeType: string) => void;
  onExtractAi: (base64Data: string, mimeType: string, fileName: string) => void;
  isExtracting: boolean;
  extractionResult: ExtractionResult | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  file,
  fileDataUrl,
  onFileChange,
  onExtractAi,
  isExtracting,
  extractionResult
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [currentBase64, setCurrentBase64] = useState<string>('');
  const [currentMimeType, setCurrentMimeType] = useState<string>('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const processFile = async (selectedFile: File) => {
    // Max 15MB file size check
    if (selectedFile.size > 15 * 1024 * 1024) {
      alert('파일 크기가 너무 큽니다. 15MB 이하의 PDF 또는 이미지 파일을 업로드해 주세요.');
      return;
    }

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('지원되지 않는 파일 형식입니다. PDF 또는 이미지(PNG, JPG, WEBP) 파일을 선택해 주세요.');
      return;
    }

    try {
      const { base64Data, mimeType } = await fileToBase64(selectedFile);
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      setCurrentBase64(base64Data);
      setCurrentMimeType(mimeType);
      onFileChange(selectedFile, dataUrl, base64Data, mimeType);

      // Auto trigger AI Extraction
      onExtractAi(base64Data, mimeType, selectedFile.name);
    } catch (err) {
      console.error('File reading error:', err);
      alert('파일을 읽는 중 오류가 발생했습니다.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setCurrentBase64('');
    setCurrentMimeType('');
    onFileChange(null, '', '', '');
  };

  const isPdf = file?.type === 'application/pdf';

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span>이수증 파일 첨부 (PDF / JPG / PNG)</span>
          <span className="text-indigo-600 font-bold">*</span>
        </span>
        <span className="text-[11px] text-slate-400 font-normal">최대 용량 15MB</span>
      </label>

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 bg-white text-center cursor-pointer transition-all duration-200 group relative flex flex-col items-center justify-center ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/80 shadow-md'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="certificate-file-input"
          />

          <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-50 transition-colors">
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>

          <p className="text-sm font-medium text-slate-700">
            파일을 드래그하거나 <span className="text-indigo-600 font-bold underline">클릭하여 선택</span>하세요
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ✨ 첨부 시 Gemini AI가 연수명과 이수증 번호를 자동으로 추출합니다.
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-xs transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || 'Document'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>미리보기</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="파일 삭제"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* AI Trigger and Status Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs">
              {isExtracting ? (
                <div className="flex items-center space-x-2 text-indigo-600 font-semibold animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Gemini AI가 이수증 문서를 분석 중입니다...</span>
                </div>
              ) : extractionResult ? (
                <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>AI 연수 정보 추출 완료</span>
                </div>
              ) : (
                <div className="text-slate-500 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>자동 추출이 완료되지 않았다면 재실행하세요.</span>
                </div>
              )}
            </div>

            <button
              type="button"
              id="btn-re-extract-ai"
              disabled={isExtracting}
              onClick={() => onExtractAi(currentBase64, currentMimeType, file.name)}
              className="px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold flex items-center space-x-1.5 shadow-md border border-slate-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isExtracting ? '분석 진행 중...' : 'Gemini AI 자동 정보 추출'}</span>
            </button>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showPreviewModal && fileDataUrl && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                {isPdf ? <FileText className="w-5 h-5 text-indigo-600" /> : <ImageIcon className="w-5 h-5 text-indigo-600" />}
                <span>첨부 이수증 미리보기 ({file?.name})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100 min-h-[300px]">
              {isPdf ? (
                <iframe
                  src={fileDataUrl}
                  title="PDF 미리보기"
                  className="w-full h-[60vh] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={fileDataUrl}
                  alt="이수증 이미지 미리보기"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                />
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
