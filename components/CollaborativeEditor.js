'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  IconDocument,
  IconEye,
  IconEdit,
  IconCheck,
  IconHistory,
  IconBold,
  IconItalic,
  IconHeading,
  IconCode,
  IconQuote,
  IconList,
  IconListOrdered,
  IconCheckSquare,
  IconTable,
  IconDownload,
  IconTemplate,
  IconLink,
  IconCopy,
  IconTrash,
} from './Icons';
import {
  DOCUMENT_TEMPLATES,
  calculateDocStats,
  applyFormatting,
  parseMarkdownBlocks,
  downloadMarkdownFile,
} from '@/lib/markdown';

export default function CollaborativeEditor({
  roomId,
  initialDocument,
  participants,
  onOpenHistory,
}) {
  const { user, socket, addToast } = useWorkspace();
  const [content, setContent] = useState(initialDocument?.content || '');
  const [version, setVersion] = useState(initialDocument?.version || 1);
  const [isSaved, setIsSaved] = useState(true);
  const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
  const [remoteCursors, setRemoteCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(null);

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
      setContent(data.content);
      setVersion(data.version);
      setIsSaved(true);
    }

    function handleCursorUpdated(data) {
      if (data.roomId !== roomId) return;
      if (data.user?.id === user?.id) return;

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

  // Dispatch document edit to socket
  const dispatchEdit = useCallback(
    (newText, changeType = 'edit') => {
      setContent(newText);
      setIsSaved(false);

      if (socket) {
        socket.emit('typing', { roomId, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          if (socket) socket.emit('typing', { roomId, isTyping: false });
        }, 1500);
      }

      if (editDebounceRef.current) clearTimeout(editDebounceRef.current);
      editDebounceRef.current = setTimeout(() => {
        if (socket) {
          socket.emit('doc-edit', {
            roomId,
            content: newText,
            changeType,
          });
          setIsSaved(true);
        }
      }, 300);
    },
    [socket, roomId]
  );

  const handleTextChange = (e) => {
    dispatchEdit(e.target.value, 'edit');
  };

  // Apply formatting from toolbar
  const handleFormat = (action) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : content.length;
    const end = textarea ? textarea.selectionEnd : content.length;

    const { newContent, newStart, newEnd } = applyFormatting(content, start, end, action);
    dispatchEdit(newContent, action);

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newStart, newEnd);
      }
    }, 10);
  };

  // Insert template
  const handleInsertTemplate = (tmpl) => {
    const updated = content.trim() ? `${content}\n\n---\n\n${tmpl.content}` : tmpl.content;
    dispatchEdit(updated, 'template');
    setShowTemplates(false);
    if (addToast) addToast(`Inserted template: ${tmpl.name}`, 'success');
  };

  // Export document as markdown
  const handleExportMarkdown = () => {
    downloadMarkdownFile(`${roomId}-syncspace.md`, content);
    if (addToast) addToast('Document downloaded as Markdown file', 'success');
  };

  // Copy full document
  const handleCopyDocument = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(content);
      if (addToast) addToast('Document copied to clipboard!', 'success');
    }
  };

  // Clear document
  const handleClearDocument = () => {
    if (window.confirm('Are you sure you want to clear the document? This will sync to all peers.')) {
      dispatchEdit('', 'clear');
      if (addToast) addToast('Document cleared', 'info');
    }
  };

  // Copy code snippet helper
  const handleCopyCodeSnippet = (codeText, index) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(codeText);
      setCopiedSnippet(index);
      setTimeout(() => setCopiedSnippet(null), 2000);
      if (addToast) addToast('Code snippet copied to clipboard', 'success');
    }
  };

  // Track cursor movement
  const handleMouseMove = useCallback(
    (e) => {
      if (!socket || !editorContainerRef.current) return;

      const now = Date.now();
      if (cursorThrottleRef.current && now - cursorThrottleRef.current < 50) return;
      cursorThrottleRef.current = now;

      const rect = editorContainerRef.current.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      socket.emit('cursor-move', {
        roomId,
        cursor: { x, y, line: 0, ch: 0 },
      });
    },
    [socket, roomId]
  );

  const stats = useMemo(() => calculateDocStats(content), [content]);
  const parsedBlocks = useMemo(() => parseMarkdownBlocks(content), [content]);
  const activeTypers = Object.values(typingUsers);

  // Helper to format inline markdown spans (bold, italic, code, links)
  const renderInlineMarkdown = (text = '') => {
    if (!text) return null;

    // Split on inline patterns
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~|\[[^\]]+\]\([^)]+\))/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={keyIdx++}>{text.substring(lastIndex, match.index)}</span>);
      }

      const matchText = match[0];
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-slate-900">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-800">
            {matchText.slice(1, -1)}
          </em>
        );
      } else if (matchText.startsWith('~~') && matchText.endsWith('~~')) {
        parts.push(
          <span key={keyIdx++} className="line-through text-slate-400">
            {matchText.slice(2, -2)}
          </span>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded-md font-mono text-xs bg-slate-100 text-indigo-700 border border-slate-200"
          >
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith('[') && matchText.includes('](')) {
        const linkMatch = matchText.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          parts.push(
            <a
              key={keyIdx++}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 underline font-medium"
            >
              {linkMatch[1]}
            </a>
          );
        } else {
          parts.push(<span key={keyIdx++}>{matchText}</span>);
        }
      }

      lastIndex = match.index + matchText.length;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={keyIdx++}>{text.substring(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Editor Top Navigation & Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <IconDocument className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-xs text-slate-800">Collaborative Workspace Document</span>
          </div>

          {/* Monotonic Version Pill */}
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-200/80 text-slate-700 border border-slate-300/60">
            Rev #{version}
          </span>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            {isSaved ? (
              <>
                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Synced</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-amber-700 font-semibold">Syncing...</span>
              </>
            )}
          </div>
        </div>

        {/* View Mode & History Controls */}
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

      {/* Rich Markdown Formatting Toolbar */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-slate-600">
        {/* Left Toolbar: Text Styles & Structure */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => handleFormat('bold')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Bold (**text**)"
          >
            <IconBold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('italic')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Italic (*text*)"
          >
            <IconItalic className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-0.5"></div>

          <button
            onClick={() => handleFormat('h1')}
            className="px-1.5 py-1 text-xs font-bold rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Heading 1 (# Heading)"
          >
            H1
          </button>
          <button
            onClick={() => handleFormat('h2')}
            className="px-1.5 py-1 text-xs font-semibold rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Heading 2 (## Heading)"
          >
            H2
          </button>
          <button
            onClick={() => handleFormat('h3')}
            className="px-1.5 py-1 text-xs font-medium rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Heading 3 (### Heading)"
          >
            H3
          </button>
          <div className="h-4 w-px bg-slate-200 mx-0.5"></div>

          <button
            onClick={() => handleFormat('code')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Inline Code (`code`)"
          >
            <IconCode className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('codeblock')}
            className="px-1.5 py-1 text-xs font-mono rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Code Block (```lang)"
          >
            &lt;/&gt;
          </button>
          <button
            onClick={() => handleFormat('quote')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Blockquote (> quote)"
          >
            <IconQuote className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-200 mx-0.5"></div>

          <button
            onClick={() => handleFormat('bullet')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Bullet List (- item)"
          >
            <IconList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('number')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Numbered List (1. item)"
          >
            <IconListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('task')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Task List (- [ ] task)"
          >
            <IconCheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('table')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Insert Table"
          >
            <IconTable className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('link')}
            className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Insert Link ([title](url))"
          >
            <IconLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Toolbar: Templates, Export & Document Actions */}
        <div className="flex items-center gap-1.5 relative">
          {/* Templates Menu */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Insert predefined document templates"
            >
              <IconTemplate className="w-3.5 h-3.5 text-indigo-600" />
              <span>Templates</span>
            </button>

            {showTemplates && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Document Templates
                </div>
                {DOCUMENT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleInsertTemplate(tmpl)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50/70 transition-colors flex flex-col"
                  >
                    <span className="text-xs font-semibold text-slate-800">{tmpl.name}</span>
                    <span className="text-[11px] text-slate-500 leading-tight truncate">
                      {tmpl.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5"></div>

          {/* Copy Full Document */}
          <button
            onClick={handleCopyDocument}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title="Copy Document Text"
          >
            <IconCopy className="w-3.5 h-3.5" />
          </button>

          {/* Export .md */}
          <button
            onClick={handleExportMarkdown}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title="Export as Markdown (.md)"
          >
            <IconDownload className="w-3.5 h-3.5" />
          </button>

          {/* Clear Document */}
          <button
            onClick={handleClearDocument}
            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
            title="Clear Document Content"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
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
                <svg
                  className="w-4 h-4 drop-shadow-md"
                  viewBox="0 0 24 24"
                  fill={peerColor}
                  stroke="white"
                  strokeWidth="1.5"
                >
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>

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

        {/* Enhanced Markdown Live Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 h-full p-4 md:p-6 overflow-y-auto bg-slate-50/50">
            {parsedBlocks.length > 0 ? (
              <div className="space-y-4 max-w-none text-slate-800 text-sm leading-relaxed">
                {parsedBlocks.map((block, idx) => {
                  switch (block.type) {
                    case 'h1':
                      return (
                        <h1 key={idx} className="text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mt-2">
                          {renderInlineMarkdown(block.content)}
                        </h1>
                      );
                    case 'h2':
                      return (
                        <h2 key={idx} className="text-xl font-bold text-slate-900 border-b border-slate-200/60 pb-1 mt-4">
                          {renderInlineMarkdown(block.content)}
                        </h2>
                      );
                    case 'h3':
                      return (
                        <h3 key={idx} className="text-lg font-semibold text-slate-800 mt-3">
                          {renderInlineMarkdown(block.content)}
                        </h3>
                      );
                    case 'h4':
                      return (
                        <h4 key={idx} className="text-base font-semibold text-slate-700 mt-2">
                          {renderInlineMarkdown(block.content)}
                        </h4>
                      );
                    case 'hr':
                      return <hr key={idx} className="my-4 border-slate-200" />;
                    case 'quote':
                      return (
                        <blockquote
                          key={idx}
                          className="border-l-4 border-indigo-500 pl-4 py-1.5 my-2 bg-indigo-50/40 text-slate-700 italic rounded-r-lg text-sm"
                        >
                          {renderInlineMarkdown(block.content)}
                        </blockquote>
                      );
                    case 'code':
                      return (
                        <div key={idx} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 my-3 shadow-sm">
                          <div className="px-4 py-2 bg-slate-800/90 flex items-center justify-between text-xs font-mono text-slate-300">
                            <span className="uppercase font-semibold tracking-wider text-[11px] text-indigo-400">
                              {block.language}
                            </span>
                            <button
                              onClick={() => handleCopyCodeSnippet(block.content, idx)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] transition-colors"
                              title="Copy code"
                            >
                              {copiedSnippet === idx ? (
                                <>
                                  <IconCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <IconCopy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto font-mono text-xs text-emerald-300 leading-relaxed">
                            <code>{block.content}</code>
                          </pre>
                        </div>
                      );
                    case 'table':
                      return (
                        <div key={idx} className="my-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                          <table className="min-w-full divide-y divide-slate-200 text-xs">
                            <thead className="bg-slate-50">
                              <tr>
                                {block.headers.map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    className="px-4 py-2.5 text-left font-semibold text-slate-700 uppercase tracking-wider"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {block.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/50">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-4 py-2 text-slate-700">
                                      {renderInlineMarkdown(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    case 'bulletlist':
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1 my-2 text-slate-700">
                          {block.items.map((item, i) => (
                            <li key={i}>{renderInlineMarkdown(item)}</li>
                          ))}
                        </ul>
                      );
                    case 'numberedlist':
                      return (
                        <ol key={idx} className="list-decimal pl-5 space-y-1 my-2 text-slate-700">
                          {block.items.map((item, i) => (
                            <li key={i}>{renderInlineMarkdown(item)}</li>
                          ))}
                        </ol>
                      );
                    case 'tasklist':
                      return (
                        <div key={idx} className="space-y-1.5 my-2">
                          {block.items.map((task, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-2 text-slate-700">
                              <input
                                type="checkbox"
                                checked={task.checked}
                                readOnly
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                              />
                              <span className={task.checked ? 'line-through text-slate-400' : ''}>
                                {renderInlineMarkdown(task.text)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    case 'paragraph':
                    default:
                      return (
                        <p key={idx} className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {renderInlineMarkdown(block.content)}
                        </p>
                      );
                  }
                })}
              </div>
            ) : (
              <p className="text-slate-400 italic">Preview will render live as you type...</p>
            )}
          </div>
        )}
      </div>

      {/* Editor Bottom Status Bar */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        {/* Active typing indicator */}
        <div className="flex items-center gap-2">
          {activeTypers.length > 0 ? (
            <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
              <span>
                {activeTypers.join(', ')} {activeTypers.length === 1 ? 'is' : 'are'} editing...
              </span>
            </div>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All collaborative edits synchronized in real time
            </span>
          )}
        </div>

        {/* Word, char, line and reading time stats */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span>{stats.words} words</span>
          <span>•</span>
          <span>{stats.chars} chars</span>
          <span>•</span>
          <span>{stats.lines} lines</span>
          <span>•</span>
          <span className="text-indigo-600 font-semibold">{stats.readingTime} min read</span>
        </div>
      </div>
    </div>
  );
}
