import React from 'react';
import { FiFolder, FiFile, FiMoreVertical } from 'react-icons/fi';

export default function FileRow({ item, isFolder, isMenuOpen, onOpen, onMenuToggle, onRename, onDelete, onShare, onMove }) {
  const Icon = isFolder ? FiFolder : FiFile;

  const handleClick = () => {
    if (isFolder) {
      onOpen(item);
    } else {
      window.open(item.url, '_blank');
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 cursor-pointer hover:bg-gray-50 relative"
      onClick={handleClick}
    >
      <Icon className={isFolder ? 'text-blue-500' : 'text-gray-400'} size={18} />
      <span className="flex-1 truncate text-sm text-gray-800">{item.name}</span>
      <span className="text-xs text-gray-400 hidden sm:block">
        {new Date(item.updatedAt).toLocaleDateString()}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onMenuToggle(item._id); }}
        className="p-1.5 rounded text-gray-500 hover:bg-gray-200"
      >
        <FiMoreVertical size={16} />
      </button>
      {isMenuOpen && (
        <div
          className="absolute right-4 top-9 bg-white border border-gray-200 rounded shadow-lg py-1 z-10 w-36"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => onRename(item)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100">Rename</button>
          <button onClick={() => onMove(item)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100">Move</button>
          {!isFolder && <button onClick={() => onShare(item)} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100">Share</button>}
          <button onClick={() => onDelete(item)} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Delete</button>
        </div>
      )}
    </div>
  );
}
