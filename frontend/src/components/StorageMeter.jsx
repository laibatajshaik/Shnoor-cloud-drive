import React from 'react';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export default function StorageMeter({ usedBytes = 0, quotaBytes = 1 }) {
  const pct = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
  const isNearFull = pct >= 85;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Storage</span>
        <span className="font-mono text-xs text-slate-500">
          {formatBytes(usedBytes)} <span className="text-slate-400">/ {formatBytes(quotaBytes)}</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-ink-600/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isNearFull ? 'bg-clay-500' : 'bg-brass-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
