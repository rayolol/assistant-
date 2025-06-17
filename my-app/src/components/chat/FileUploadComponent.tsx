import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUploadProgress, validateFile, uploadFile, FileUploadResponse } from './fileUpload';
import { useUserStore } from '../../app/hooks/StoreHooks/UserStore';
import { useMessageStore } from '../../app/hooks/StoreHooks/useMessageStore';

interface FileUploadProps {
  onUploadComplete?: (file: FileUploadResponse) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const { userId } = useUserStore();
  const { currentConversationId } = useMessageStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const error = validateFile(file);
    
    if (error) {
      setUploadProgress({ progress: 0, status: 'error', error });
      return;
    }

    try {
      const result = await uploadFile(
        file,
        userId!,
        currentConversationId!,
        setUploadProgress
      );
      onUploadComplete?.(result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [userId, currentConversationId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploadProgress?.status === 'error' ? 'border-red-500' : ''}`}
      >
        <input {...getInputProps()} />
        {uploadProgress ? (
          <div className="space-y-2">
            {uploadProgress.status === 'uploading' && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            )}
            {uploadProgress.status === 'error' && (
              <p className="text-red-500">{uploadProgress.error}</p>
            )}
            {uploadProgress.status === 'completed' && (
              <p className="text-green-500">Upload complete!</p>
            )}
          </div>
        ) : (
          <p>Drag & drop a file here, or click to select</p>
        )}
      </div>
    </div>
  );
}; 