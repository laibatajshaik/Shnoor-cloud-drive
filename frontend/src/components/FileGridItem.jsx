import React from 'react';
import { FiFolder, FiFile, FiFileText, FiImage, FiGrid, FiMoreVertical } from 'react-icons/fi';
import clsx from 'clsx';

function getFileVisual(mimeType = '') {
  if (mimeType.startsWith('image/')) return { Icon: FiImage, color: 'text-moss-500', bg: 'bg-moss-50' };
  if (mimeType === 'application/pdf') return { Icon: FiFileText, color: 'text-clay-500', bg: 'bg-clay-50' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { Icon: FiGrid, color: 'text-moss-500', bg: 'bg-moss-50' };
  if (mimeType.includes('word') || mimeType.includes('document')) return { Icon: FiFileText, color: 'text-slate-500', bg: 'bg-paper-200' };
  return { Icon: FiFile, color: 'text-slate-400', bg: 'bg-paper-200' };
}

function thumbnailUrl(url) {
  if (!url) return null;
  return url.replace('/upload/', '/upload/w_300,h_300,c_fill,q_auto,f_auto/');
}

function FileGridItemBase({ item, isFolder, isMenuOpen, onOpen, onMenuToggle, onRename, onDelete, onShare, onMove }) {
  const isImage = !isFolder && item.mimeType?.startsWith('image/');
  const { Icon, color, bg } = isFolder ? { Icon: FiFolder, color: 'text-brass-500', bg: 'bg-brass-50' } : getFileVisual(item.mimeType);

  return (
    <div
      className={clsx(
        'group relative flex flex-col rounded-xl border bg-white overflow-hidden cursor-pointer transition-all duration-150',
        isMenuOpen ? 'border-brass-400 shadow-md' : 'border-paper-200 hover:border-brass-200 hover:shadow-md'
      )}
      onDoubleClick={() => isFolder && onOpen(item)}
    >
      <div className={clsx('aspect-square flex items-center justify-center', isImage ? 'bg-paper-100' : bg)}>
        {isImage ? (
          <img
            src={thumbnailUrl(item.url)}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className={color} size={36} />
        )}
      </div>

      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <span className="flex-1 truncate text-xs font-medium text-ink-800">{item.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onMenuToggle(item._id); }}
          className={clsx(
            'opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:bg-paper-200 shrink-0',
            isMenuOpen && 'opacity-100 bg-paper-200'
          )}
        >
          <FiMoreVertical size={14} />
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute right-2 top-2 bg-white border border-paper-200 rounded-xl shadow-lg py-1 z-10 w-36 overflow-hidden">
          <button onClick={() => onRename(item)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-paper-200">Rename</button>
          <button onClick={() => onMove(item)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-paper-200">Move</button>
          {!isFolder && <button onClick={() => onShare(item)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-paper-200">Share</button>}
          <button onClick={() => onDelete(item)} className="w-full text-left px-3 py-1.5 text-xs text-clay-500 hover:bg-clay-50">Delete</button>
        </div>
      )}
    </div>
  );
}

export default React.memo(FileGridItemBase, (prev, next) => (
  prev.item === next.item && prev.isMenuOpen === next.isMenuOpen && prev.isFolder === next.isFolder
));
