import axios from 'axios';
import { instance } from '@/app/api/api';

export interface FileUploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileUploadResponse {
  file_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;

}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return 'File size exceeds 10MB limit';
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'File type not supported';
  }
  return null;
};

export const uploadFile = async (
  file: File,
  userId: string,
  conversationId: string,
  onProgress?: (progress: FileUploadProgress) => void
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  formData.append('conversationId', conversationId);

  try {
    const response = await instance.post(`/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.({ progress, status: 'uploading' });
        }
      },
    });

    onProgress?.({ progress: 100, status: 'completed' });
    return response.data;
  } catch (error) {
    onProgress?.({ 
      progress: 0, 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Upload failed' 
    });
    throw error;
  }
}; 