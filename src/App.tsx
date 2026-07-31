/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SubmissionRecord, ToastMessage } from './types';
import { getSavedRecords, getSavedGasUrl, saveGasUrl } from './lib/utils';
import { Header } from './components/Header';
import { SubmissionForm } from './components/SubmissionForm';
import { SubmissionHistory } from './components/SubmissionHistory';
import { GasGuideModal } from './components/GasGuideModal';
import { SettingsView } from './components/SettingsView';
import { Toast } from './components/Toast';
import { ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'guide' | 'settings'>('form');
  const [records, setRecords] = useState<SubmissionRecord[]>([]);
  const [gasUrl, setGasUrl] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load saved state on mount
  useEffect(() => {
    setRecords(getSavedRecords());
    setGasUrl(getSavedGasUrl());
  }, []);

  // Toast Helper
  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleNewSuccess = (record: SubmissionRecord) => {
    setRecords(getSavedRecords());
  };

  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    saveGasUrl(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white antialiased">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        submissionCount={records.length}
        hasGasUrl={Boolean(gasUrl.trim())}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'form' && (
          <SubmissionForm
            onSuccess={handleNewSuccess}
            showToast={showToast}
            gasUrl={gasUrl}
            onOpenGasGuide={() => setActiveTab('guide')}
          />
        )}

        {activeTab === 'history' && (
          <SubmissionHistory
            records={records}
            onRecordsChange={setRecords}
            showToast={showToast}
          />
        )}

        {activeTab === 'guide' && (
          <GasGuideModal
            gasUrl={gasUrl}
            onSaveGasUrl={handleSaveGasUrl}
            showToast={showToast}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            gasUrl={gasUrl}
            onSaveGasUrl={handleSaveGasUrl}
            showToast={showToast}
            onClearRecords={() => setRecords([])}
          />
        )}
      </main>

      {/* Sleek Footer Status Bar */}
      <footer className="h-10 bg-slate-800 text-slate-400 flex items-center px-6 justify-between text-[10px] uppercase font-bold tracking-widest border-t border-slate-700">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Server Status: Online
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
            SSL: Encrypted
          </span>
          <span className="hidden md:flex items-center gap-1.5 text-slate-500 font-normal">
            Gemini AI Integration Active
          </span>
        </div>
        <div className="font-medium text-slate-400 tracking-normal">
          © EduCert Portal · v2.0.4-stable
        </div>
      </footer>

      {/* Global Toast Alerts */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}
