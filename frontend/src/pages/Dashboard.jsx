import React, { useState, useCallback, useRef } from 'react';
import { FiSearch, FiLogOut, FiUpload, FiFolderPlus } from 'react-icons/fi';
import { SocketProvider } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import FileExplorer from '../components/FileExplorer.jsx';
import FolderBreadcrumb from '../components/FolderBreadcrumb.jsx';
import ShareModal from '../components/ShareModal.jsx';
import api from '../api/axios';
import { getFilesFromFileList, uploadFileBatch } from '../utils/uploadHelpers';

function DashboardInner() {
  const { user, logout } = useAuth();
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [path, setPath] = useState([]);
  const [shareTarget, setShareTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleOpenFolder = useCallback((item) => {
    setCurrentFolderId(item._id);
    setPath((prev) => [...prev, { _id: item._id, name: item.name }]);
    setSearchResults(null);
  }, []);

  const handleBreadcrumbNav = useCallback((folderId) => {
    if (!folderId) {
      setCurrentFolderId(null);
      setPath([]);
    } else {
      setPath((prevPath) => {
        const idx = prevPath.findIndex((p) => p._id === folderId);
        setCurrentFolderId(folderId);
        return prevPath.slice(0, idx + 1);
      });
    }
    setSearchResults(null);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return setSearchResults(null);
    const { data } = await api.get('/folders/search', { params: { q: searchQuery } });
    setSearchResults(data.data.files);
  };

  const handleFilePick = async (e) => {
    const items = getFilesFromFileList(e.target.files);
    e.target.value = '';
    if (items.length === 0) return;
    setUploading(true);
    try {
      await uploadFileBatch({ items, parentFolder: currentFolderId });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleNewFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name?.trim()) return;
    await api.post('/folders', { name: name.trim(), parentFolder: currentFolderId || undefined });
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4">
        <span className="text-lg font-semibold text-blue-600">Shnoor Cloud - Drive</span>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files across all folders..."
              className="w-full border border-gray-300 rounded pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{user?.name}</span>
          <button onClick={logout} className="text-gray-500 hover:text-gray-800" title="Log out">
            <FiLogOut size={16} />
          </button>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <FolderBreadcrumb path={path} onNavigate={handleBreadcrumbNav} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-60"
            >
              <FiUpload size={16} /> {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilePick} />

            <button
              onClick={handleNewFolder}
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded"
            >
              <FiFolderPlus size={16} /> New folder
            </button>
          </div>
        </div>

        {searchResults ? (
          <div className="bg-white border border-gray-200 rounded divide-y divide-gray-200">
            <p className="px-4 py-2 text-xs text-gray-400">
              {searchResults.length} result{searchResults.length !== 1 && 's'} for "{searchQuery}"
            </p>
            {searchResults.length === 0 && <p className="px-4 py-8 text-center text-sm text-gray-400">No files matched your search</p>}
            {searchResults.map((f) => (
              <div key={f._id} className="px-4 py-2 text-sm hover:bg-gray-50">{f.name}</div>
            ))}
          </div>
        ) : (
          <FileExplorer
            key={refreshKey}
            folderId={currentFolderId}
            onOpenFolder={handleOpenFolder}
            onShare={setShareTarget}
          />
        )}
      </main>

      {shareTarget && <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  );
}

export default function Dashboard() {
  return (
    <SocketProvider>
      <DashboardInner />
    </SocketProvider>
  );
}
