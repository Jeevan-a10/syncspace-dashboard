'use client';

import React from 'react';
import { IconUsers } from './Icons';

export default function PresenceBar({ participants = [] }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      <div className="flex items-center -space-x-2 overflow-hidden p-1">
        {participants.slice(0, 6).map((participant, index) => {
          const name = participant.name || 'User';
          const initial = name.charAt(0).toUpperCase();
          const color = participant.color || '#6366f1';

          return (
            <div
              key={participant.id || participant.socketId || index}
              className="relative inline-block"
              title={`${name} (${participant.isTyping ? 'Typing...' : 'Active'})`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-xs transition-transform hover:scale-110 hover:z-20 cursor-default"
                style={{ backgroundColor: color }}
              >
                {initial}
              </div>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
          );
        })}

        {participants.length > 6 && (
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-white">
            +{participants.length - 6}
          </div>
        )}
      </div>

      <div className="text-xs font-medium text-slate-600 hidden sm:block whitespace-nowrap">
        {participants.length} {participants.length === 1 ? 'collaborator' : 'collaborators'} online
      </div>
    </div>
  );
}
