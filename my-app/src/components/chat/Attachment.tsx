import Image from 'next/image';
import { useState } from 'react';
import { FileIcon, ImageIcon, FileTextIcon, FileArchiveIcon } from 'lucide-react';

interface AttachmentProps {
  filePath: string;
  fileName?: string;
  fileType?: string;
}

export const Attachment = ({ filePath, fileName, fileType }: AttachmentProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Determine if it's an image based on file type or path extension
  const isImage = fileType?.startsWith('image/') || 
                 /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filePath);
  
  // Get file extension
  const extension = filePath.split('.').pop()?.toLowerCase() || '';
  
  // Choose appropriate icon based on file type
  const getFileIcon = () => {
    if (fileType?.includes('pdf') || extension === 'pdf') return <FileTextIcon className="h-8 w-8" />;
    if (fileType?.includes('zip') || ['zip', 'rar', '7z'].includes(extension)) return <FileArchiveIcon className="h-8 w-8" />;
    if (fileType?.includes('text') || ['txt', 'md', 'doc', 'docx'].includes(extension)) return <FileTextIcon className="h-8 w-8" />;
    return <FileIcon className="h-8 w-8" />;
  };
  
  if (!filePath) return null;
  
  return (
    <div className="attachment-container mb-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {isImage ? (
        <div className="relative">
          {isLoading && <div className="bg-gray-100 dark:bg-gray-800 animate-pulse h-48 w-full" />}
          {error && <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-gray-800">
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Failed to load image</span>
          </div>}
          <Image 
            src={filePath}
            alt={fileName || "Attachment"}
            width={300}
            height={200}
            className="max-w-xs object-contain"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError(true);
            }}
            style={{ display: isLoading || error ? 'none' : 'block' }}
          />
        </div>
      ) : (
        <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800">
          {getFileIcon()}
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{fileName || filePath.split('/').pop()}</p>
            <p className="text-xs text-gray-500">{fileType || extension.toUpperCase()}</p>
          </div>
        </div>
      )}
    </div>
  );
};