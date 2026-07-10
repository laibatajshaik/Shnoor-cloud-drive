import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import FileRow from './FileRow.jsx';
import { useFiles } from '../hooks/useFiles.js';
import api from '../api/axios';

export default function FileExplorer({ folderId, onOpenFolder, onShare }) {
  const { folders, files, loading, error, refetch } = useFiles(folderId);
  const [openMenuId, setOpenMenuId] = useState(null);
  const containerRef = useRef(null);

  const combined = useMemo(
    () => [
      ...folders.map((f) => ({ ...f, __isFolder: true })),
      ...files.map((f) => ({ ...f, __isFolder: false })),
    ],
    [folders, files]
  );

  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) return;
      setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const handleOpen = useCallback((item) => onOpenFolder(item), [onOpenFolder]);
  const handleMenuToggle = useCallback((id) => setOpenMenuId((cur) => (cur === id ? null : id)), []);

  const handleRename = useCallback(async (item) => {
    const newName = window.prompt('New name', item.name);
    if (!newName?.trim() || newName === item.name) return;
    const endpoint = item.__isFolder ? `/folders/${item._id}/rename` : `/files/${item._id}/rename`;
    await api.patch(endpoint, { name: newName.trim() });
    setOpenMenuId(null);
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    const endpoint = item.__isFolder ? `/folders/${item._id}` : `/files/${item._id}`;
    await api.delete(endpoint);
    setOpenMenuId(null);
    refetch();
  }, [refetch]);

  const handleMove = useCallback(async (item) => {
    const destination = window.prompt('Destination folder ID (blank = root)');
    if (destination === null) return;
    const endpoint = item.__isFolder ? `/folders/${item._id}/move` : `/files/${item._id}/move`;
    await api.patch(endpoint, { newParentId: destination || null });
    setOpenMenuId(null);
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <div className="border border-gray-200 rounded bg-white p-10 flex items-center justify-center text-gray-400 text-sm">
        Loading your files...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded p-8 text-center text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (combined.length === 0) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        This folder is empty
      </div>
    );
  }

  return (
    <div ref={containerRef} className="border border-gray-200 rounded bg-white">
      {combined.map((item) => (
        <FileRow
          key={item._id}
          item={item}
          isFolder={item.__isFolder}
          isMenuOpen={openMenuId === item._id}
          onOpen={handleOpen}
          onMenuToggle={handleMenuToggle}
          onRename={handleRename}
          onDelete={handleDelete}
          onShare={onShare}
          onMove={handleMove}
        />
      ))}
    </div>
  );
}
