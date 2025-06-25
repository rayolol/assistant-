"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useMessageHandling } from '@/app/hooks/useMessageHandling';
import { PlusIcon, SendIcon, Loader2Icon } from 'lucide-react';
import { FileUpload } from '@/components/chat/FileUploadComponent';  // lowercase 'f'
import { FileUploadResponse } from '@/components/chat/fileUpload';
import Image from 'next/image';

const ChatInput = () => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isStreaming, sendMessage } = useMessageHandling();

  const [attachedFileURL, setAttachedFileURL] = useState<string | null>(null);
  const [fileName, setFileName]           = useState<string | null>(null);
  const [fileStatus, setFileStatus]       = useState<'idle'|'uploading'|'uploaded'|'error'>('idle');
  const [fileId, setFileId] = useState<string | null>(null);

  // When FileUpload finishes, grab the URL and file name
  const handleUploadComplete = (file: FileUploadResponse) => {
    setAttachedFileURL(file.file_url);
    setFileName(file.file_name);
    setFileId(file.file_id)
    setFileStatus('uploaded');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFileURL) return;

    // send text and attachment together
    await sendMessage(input.trim(), fileId);
    // reset
    setInput('');
    setAttachedFileURL(null);
    setFileName(null);
    setFileStatus('idle');
    setFileId(null);
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const removeAttachedFile = () => {
    setAttachedFileURL(null);
    setFileName(null);
    setFileStatus('idle');
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  return (
    <div className="max-w-4xl mx-auto w-full min-w-[500px] flex flex-col justify-end">
      <div className="text-foreground min-h-[100px] border border-border rounded-2xl bg-muted p-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="p-2 flex-grow">
            {/* Drag/drop + click uploader */}
            <FileUpload
              onUploadComplete={(file) => handleUploadComplete(file)}
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && !e.shiftKey && handleSubmit(e)}
              placeholder="Type your message..."
              disabled={isStreaming}
              rows={1}
              className="w-full border-none resize-none focus:outline-none text-foreground min-h-[20px] max-h-[200px]"
            />

            {fileName && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-sm text-gray-500">Attached: {fileName}</span>
                {attachedFileURL && (
                  <Image src={attachedFileURL} alt={fileName ?? 'Attached file'} height={70} width={70} />
                )}
                <button
                  type="button"
                  onClick={removeAttachedFile}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={handlePlusClick}
              className="rounded-full p-2 hover:bg-gray-200"
            >
              <PlusIcon />
            </button>

            {/* Hidden native file input for fallback / accessibility */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files?.[0]) {
                  // just forward to FileUpload’s onDrop logic,
                  // or do your own validate + upload here
                }
              }}
              className="hidden"
            />

            <button
              type="submit"
              disabled={(!input.trim() && !attachedFileURL) || isStreaming || fileStatus==='uploading'}
              className={`rounded-full p-1 m-1 ${
                (!input.trim() && !attachedFileURL) || isStreaming || fileStatus==='uploading'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isStreaming
                ? <Loader2Icon />
                : <SendIcon />
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
