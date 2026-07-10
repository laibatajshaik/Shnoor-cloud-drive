import React, { useRef, useState, useCallback } from 'react';
import { FiUpload, FiFolderPlus, FiFolder, FiUploadCloud } from 'react-icons/fi';
import api from '../api/axios';
import {
  getFilesFromDataTransferItems,
  getFilesFromFileList,
  uploadFileBatch,
} from '../utils/uploadHelpers';

export default function UploadZone({ folderId, onUploaded, onFolderCreated, children }) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastFailures, setLastFailures] = useState([]);
  const dragCounter = useRef(0);

  const runUpload = useCallback(
    async (items) => {
      if (!items || items.length === 0) return;
      setUploading(true);
      setProgress(0);
      setLastFailures([]);
      try {
        const { uploaded, failed } = await uploadFileBatch({
          items,
          parentFolder: folderId,
          onProgress: setProgress,
        });
        if (failed?.length) setLastFailures(failed);
        if (uploaded?.length) onUploaded?.();
      } catch (err) {
        alert(err.response?.data?.message || 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [folderId, onUploaded]
  );

  const handleFilePick = (e) => {
    const items = getFilesFromFileList(e.target.files);
    runUpload(items);
    e.target.value = '';
  };

  const handleFolderPick = (e) => {
    const items = getFilesFromFileList(e.target.files);
    runUpload(items);
    e.target.value = '';
  };

  const handleNewFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name?.trim()) return;
    await api.post('/folders', { name: name.trim(), parentFolder: folderId || undefined });
    onFolderCreated?.();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const items = await getFilesFromDataTransferItems(e.dataTransfer.items);
      runUpload(items);
    } else if (e.dataTransfer.files?.length) {
      runUpload(getFilesFromFileList(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative overflow-hidden flex items-center gap-2 bg-brass-500 hover:bg-brass-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-90 transition-colors"
          >
            {uploading && (
              <span
                className="absolute inset-0 bg-white/20 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <FiUpload size={16} /> {uploading ? `Uploading ${progress}%` : 'Upload files'}
            </span>
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilePick} />

          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 border border-paper-200 hover:bg-paper-100 text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-60"
          >
            <FiFolder size={16} /> Upload folder
          </button>
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleFolderPick}
          />

          <button
            onClick={handleNewFolder}
            className="flex items-center gap-2 border border-paper-200 hover:bg-paper-100 text-sm font-medium px-4 py-2 rounded-lg"
          >
            <FiFolderPlus size={16} /> New folder
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:block">or drag files/folders anywhere below</span>
      </div>

      {lastFailures.length > 0 && (
        <div className="mb-3 text-xs bg-clay-50 text-clay-600 border border-clay-50 rounded-lg px-3 py-2">
          {lastFailures.length} file(s) failed to upload: {lastFailures.map((f) => f.name).join(', ')}
        </div>
      )}

      {children}

      {isDragging && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-brass-50/95 border-2 border-dashed border-brass-400 rounded-xl pointer-events-none animate-[fadeIn_150ms_ease-out]">
          <FiUploadCloud size={40} className="text-brass-500 mb-2 animate-bounce" />
          <p className="text-brass-600 font-medium">Drop files or folders to upload</p>
        </div>
      )}
    </div>
  );
}
