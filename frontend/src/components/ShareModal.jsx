import React, { useState } from 'react';
import { FiX, FiLink, FiCopy, FiCheck } from 'react-icons/fi';
import api from '../api/axios';

export default function ShareModal({ file, onClose }) {
  const [permission, setPermission] = useState('view');
  const [shareUrl, setShareUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreateLink = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/share', {
        resourceType: 'file',
        resourceId: file._id,
        permission,
        expiresInDays: 7,
      });
      setShareUrl(data.data.shareUrl);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <FiX size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <FiLink className="text-blue-500" size={18} />
          <h3 className="font-semibold text-gray-900">Share "{file.name}"</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">Anyone with the link gets the permission you choose below. Expires in 7 days.</p>

        <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded">
          {['view', 'edit'].map((p) => (
            <button
              key={p}
              onClick={() => setPermission(p)}
              className={`flex-1 py-2 rounded text-sm font-medium ${
                permission === p ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p === 'view' ? 'Can view' : 'Can edit'}
            </button>
          ))}
        </div>

        {shareUrl ? (
          <div className="flex gap-2">
            <input readOnly value={shareUrl} className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 bg-gray-50" />
            <button
              onClick={handleCopy}
              className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded text-sm flex items-center gap-1.5"
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleCreateLink}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Creating link...' : 'Create share link'}
          </button>
        )}
      </div>
    </div>
  );
}
