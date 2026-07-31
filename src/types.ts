export type FacultyType = '교원' | '지방공무원' | '교육공무직';

export interface CertificateForm {
  facultyType: FacultyType;
  submitterName: string;
  trainingName: string;
  certificateNumber: string;
  file: File | null;
  fileDataUrl: string;
  fileName: string;
  fileType: string;
}

export interface ExtractionResult {
  trainingName: string;
  certificateNumber: string;
  submitterName?: string;
  institution?: string;
  completionHours?: string;
  completionDate?: string;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

export interface SubmissionRecord {
  id: string;
  submittedAt: string;
  facultyType: FacultyType;
  submitterName: string;
  trainingName: string;
  certificateNumber: string;
  fileName: string;
  fileDataUrl?: string;
  gasStatus: 'success' | 'pending' | 'failed' | 'simulated';
  gasMessage?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}
