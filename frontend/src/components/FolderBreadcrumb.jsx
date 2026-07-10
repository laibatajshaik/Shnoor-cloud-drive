import React from 'react';
import { FiChevronRight, FiHome } from 'react-icons/fi';

export default function FolderBreadcrumb({ path, onNavigate }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-600 flex-wrap">
      <button onClick={() => onNavigate(null)} className="flex items-center gap-1.5 hover:text-blue-600 font-medium">
        <FiHome size={14} /> My Drive
      </button>
      {path.map((folder) => (
        <React.Fragment key={folder._id}>
          <FiChevronRight size={13} className="text-gray-300" />
          <button onClick={() => onNavigate(folder._id)} className="hover:text-blue-600 truncate max-w-[160px]">
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
