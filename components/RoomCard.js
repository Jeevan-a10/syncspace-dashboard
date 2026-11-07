'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IconUsers,
  IconCopy,
  IconCheck,
  IconDocument,
  IconCursor,
} from './Icons';
import { useWorkspace } from '@/context/WorkspaceContext';

const TOPIC_STYLES = {
  engineering: { badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  architecture: { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  design: { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  standup: { badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  general: { badge: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

export default function RoomCard({ room, onDelete }) {
  const { addToast } = useWorkspace();
  const [copied, setCopied] = useState(false);

  const topicStyle = TOPIC_STYLES[room.topic] || TOPIC_STYLES.general;
  const activeCount = room.activeUsersCount || (room.participants ? room.participants.length : 0);

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/room/${room.roomId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      addToast('Workspace invite link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-indigo-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top Header Strip */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${topicStyle.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${topicStyle.dot}`}></span>
            <span className="capitalize">{room.topic}</span>
          </span>

          {/* Active Presence Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/60">
            <span className={`relative flex h-2 w-2 ${activeCount > 0 ? '' : 'hidden'}`}>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <IconUsers className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {activeCount} {activeCount === 1 ? 'active' : 'active'}
            </span>
          </div>
        </div>

        {/* Room Title */}
        <Link href={`/room/${room.roomId}`} className="block group-hover:text-indigo-600 transition-colors">
          <h4 className="text-base font-bold text-slate-900 tracking-tight leading-snug line-clamp-1">
            {room.name}
          </h4>
        </Link>

        {/* Room ID */}
        <p className="text-xs font-mono text-slate-400 mt-1">/room/{room.roomId}</p>

        {/* Room Description */}
        <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed min-h-[36px]">
          {room.description || 'Live collaborative document workspace with real-time text sync, cursor canvas, and team chat.'}
        </p>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyLink}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-xs flex items-center gap-1"
            title="Copy Workspace Link"
          >
            {copied ? (
              <IconCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <IconCopy className="w-4 h-4" />
            )}
            <span className="text-[11px] font-medium hidden sm:inline">
              {copied ? 'Copied' : 'Share'}
            </span>
          </button>
        </div>

        <Link
          href={`/room/${room.roomId}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition-all group-hover:bg-indigo-600"
        >
          <IconCursor className="w-3.5 h-3.5" />
          <span>Enter Workspace</span>
        </Link>
      </div>
    </div>
  );
}
