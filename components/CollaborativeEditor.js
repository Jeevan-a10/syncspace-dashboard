'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  IconDocument,
  IconEye,
  IconEdit,
  IconCursor,
  IconCheck,
  IconHistory,
} from './Icons';

export default function CollaborativeEditor({
  roomId,
  initialDocument,
  participants,
  onOpenHistory,
}) {
  const { user, socket } = useWorkspace();
  const [content, setContent] = useState(initialDocument?.content || '');
  const [version, setVersion] = useState(initialDocument?.version || 1);
  const [isSaved, setIsSaved] = useState(true);
  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
  const [remoteCursors, setRemoteCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  const editorContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const editDebounceRef = useRef(null);
  const cursorThrottleRef = useRef(null);

  // Sync initial document if it changes externally
  useEffect(() => {
    if (initialDocument) {
      setContent(initialDocument.content || '');
      setVersion(initialDocument.version || 1);
    }
  }, [initialDocument]);

  // Socket event listeners for real-time collaboration
  useEffect(() => {
    if (!socket) return;

    function handleDocUpdated(data) {
      if (data.roomId !== roomId) return;

      // Update content and version
      setContent(data.content);
      setVersion(data.version);
      setIsSaved(true);
    }

    function handleCursorUpdated(data) {
      if (data.roomId !== roomId) return;
      if (data.user?.id === user?.id) return; // Don't show own cursor

      setRemoteCursors((prev) => ({
        ...prev,
        [data.socketId]: {
          user: data.user,
          cursor: data.cursor,
          timestamp: Date.now(),
        },
      }));
    }

    function handleUserTyping(data) {
      if (data.roomId !== roomId) return;
      if (data.user?.id === user?.id) return;

      setTypingUsers((prev) => {
        if (data.isTyping) {
          return { ...prev, [data.socketId]: data.user?.name || 'Someone' };
        } else {
          const next = { ...prev };
          delete next[data.socketId];
          return next;
        }
      });
    }

    function handleUserLeft(data) {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[data.socketId];
        return next;
      });
    }

    socket.on('doc-updated', handleDocUpdated);
    socket.on('cursor-updated', handleCursorUpdated);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-left', handleUserLeft);

    // Periodic cleanup of stale remote cursors (older than 15s)
    const staleInterval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => {
        let changed = false;
        const next = {};
        for (const [id, data] of Object.entries(prev)) {
          if (now - data.timestamp < 15000) {
            next[id] = data;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 5000);

    return () => {
      socket.off('doc-updated', handleDocUpdated);
      socket.off('cursor-updated', handleCursorUpdated);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-left', handleUserLeft);
      clearInterval(staleInterval);
    };
  }, [socket, roomId, user]);

  // Handle local text edits
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setContent(newText);
    setIsSaved(false);

    // Broadcast typing indicator
    if (socket) {
      socket.emit('typing', { roomId, isTyping: true });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (socket) {
          socket.emit('typing', { roomId, isTyping: false });
        }
      }, 1500);
    }

    // Debounce doc-edit broadcast to avoid spamming the network
    if (editDebounceRef.current) {
      clearTimeout(editDebounceRef.current);
    }
    editDebounceRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('doc-edit', {
          roomId,
          content: newText,
          changeType: 'edit',
        });
        setIsSaved(true);
      }
    }, 300);
  };

  // Track mouse and cursor position within the collaborative canvas
  const handleMouseMove = useCallback(
    (e) => {
      if (!socket || !editorContainerRef.current) return;

      const now = Date.now();
      if (cursorThrottleRef.current && now - cursorThrottleRef.current < 50) {
        return; // Throttle to 20fps
      }
      cursorThrottleRef.current = now;

      const rect = editorContainerRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      socket.emit('cursor-move', {
        roomId,
        cursor: {
          x,
          y,
          line: 0,
          ch: 0,
        },
      });
    },
    [socket, roomId]
  );

  // Stats calculation
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const activeTypers = Object.values(typingUsers);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Editor Top Navigation & Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <IconDocument className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-xs text-slate-800">Collaborative Document</span>
          </div>

          {/* Monotonic Version Pill */}
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-200/70 text-slate-700">
            Rev #{version}
          </span>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            {isSaved ? (
              <>
                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Synced</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-amber-700">Syncing...</span>
              </>
            )}
          </div>
        </div>

        {/* View Mode & History Buttons */}
        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-md transition-colors"
            title="View revision audit log"
          >
            <IconHistory className="w-3.5 h-3.5 text-slate-500" />
            <span>Revisions</span>
          </button>

          {/* Split / Edit / Preview Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-200/70 text-xs font-medium text-slate-600">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'edit'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <IconEdit className="w-3.5 h-3.5 inline mr-1" />
              Edit
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md transition-all hidden md:block ${
                viewMode === 'split'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <IconEye className="w-3.5 h-3.5 inline mr-1" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Collaborative Canvas Area with Remote Cursor Overlay */}
      <div
        ref={editorContainerRef}
        onMouseMove={handleMouseMove}
        className="relative flex-1 min-h-[460px] overflow-hidden flex flex-col md:flex-row"
      >
        {/* Remote Cursors Floating Layer */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {Object.entries(remoteCursors).map(([id, peer]) => {
            if (!peer.cursor || typeof peer.cursor.x !== 'number') return null;
            const peerColor = peer.user?.color || '#6366f1';
            return (
              <div
                key={id}
                className="absolute transition-all duration-75 ease-out pointer-events-none select-none flex items-start gap-1"
                style={{
                  left: `${peer.cursor.x}px`,
                  top: `${peer.cursor.y}px`,
                  transform: 'translate(-2px, -2px)',
                }}
              >
                {/* SVG Pointer */}
                <svg
                  className="w-4 h-4 drop-shadow-md"
                  viewBox="0 0 24 24"
                  fill={peerColor}
                  stroke="white"
                  strokeWidth="1.5"
                >
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>

                {/* Peer Name Tag */}
                <div
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-md whitespace-nowrap"
                  style={{ backgroundColor: peerColor }}
                >
                  {peer.user?.name || 'Collaborator'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Textarea Input (Edit View) */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`relative flex-1 h-full p-4 md:p-6 overflow-y-auto ${
              viewMode === 'split' ? 'border-r border-slate-200' : ''
            }`}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              placeholder="Start collaborating in real-time... Markdown formatting supported."
              className="w-full h-full min-h-[420px] resize-none font-mono text-sm leading-relaxed text-slate-800 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400"
              spellCheck="false"
            />
          </div>
        )}

        {/* Markdown Live Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 h-full p-4 md:p-6 overflow-y-auto bg-slate-50/50">
            <div className="prose prose-slate max-w-none text-sm leading-relaxed">
              {content ? (
                <div className="space-y-3">
                  {content.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('# ')) {
                      return (
                        <h1 key={index} className="text-xl font-bold text-slate-900 border-b pb-1">
                          {paragraph.replace('# ', '')}
                        </h1>
                      );
                    }
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h2 key={index} className="text-lg font-bold text-slate-800 mt-4 border-b pb-1">
                          {paragraph.replace('## ', '')}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h3 key={index} className="text-base font-semibold text-slate-800 mt-3">
                          {paragraph.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                      const items = paragraph.split('\n');
                      return (
                        <ul key={index} className="list-disc pl-5 space-y-1">
                          {items.map((item, i) => (
                            <li key={i} className="text-slate-700">
                              {item.replace(/^[-*]\s*/, '')}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={index} className="text-slate-700 whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 italic">Preview will render live as you type...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor Bottom Status Bar */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        {/* Typing indicator */}
        <div className="flex items-center gap-2">
          {activeTypers.length > 0 ? (
            <div className="flex items-center gap-1.5 text-indigo-600 font-medium animate-pulse">
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
              <span>
                {activeTypers.join(', ')} {activeTypers.length === 1 ? 'is' : 'are'} editing...
              </span>
            </div>
          ) : (
            <span className="text-slate-400">All changes synchronized in real time</span>
          )}
        </div>

        {/* Word and character stats */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>{words} words</span>
          <span>•</span>
          <span>{chars} characters</span>
        </div>
      </div>
    </div>
  );
}
