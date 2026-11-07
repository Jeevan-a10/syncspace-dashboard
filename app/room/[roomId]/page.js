'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/context/WorkspaceContext';
import { roomsAPI, documentAPI, messagesAPI } from '@/lib/api';
import CollaborativeEditor from '@/components/CollaborativeEditor';
import ChatPanel from '@/components/ChatPanel';
import PresenceBar from '@/components/PresenceBar';
import HistoryModal from '@/components/HistoryModal';
import {
  IconArrowLeft,
  IconCopy,
  IconCheck,
  IconChat,
  IconHistory,
  IconUsers,
  IconCursor,
} from '@/components/Icons';

export default function RoomPage({ params }) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.roomId;

  const { user, socket, isConnected, addToast } = useWorkspace();
  const [room, setRoom] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [copied, setCopied] = useState(false);

  // Initial data loading via REST
  useEffect(() => {
    async function loadRoomData() {
      try {
        setLoading(true);
        const [roomRes, docRes, msgRes] = await Promise.allSettled([
          roomsAPI.getById(roomId),
          documentAPI.get(roomId),
          messagesAPI.get(roomId),
        ]);

        if (roomRes.status === 'fulfilled' && roomRes.value?.data) {
          setRoom(roomRes.value.data);
        } else {
          // Fallback room data
          setRoom({
            roomId,
            name: roomId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            topic: 'engineering',
            description: 'Collaborative real-time room session.',
          });
        }

        if (docRes.status === 'fulfilled' && docRes.value?.data) {
          setDocumentData(docRes.value.data);
        } else {
          setDocumentData({
            roomId,
            content: `# ${roomId.replace(/-/g, ' ').toUpperCase()}\n\nWelcome to your real-time collaborative workspace.\n\n- Start typing to synchronize edits with peers\n- Real-time cursors stream automatically\n- Use the chat panel on the right for room discussions\n`,
            version: 1,
          });
        }

        if (msgRes.status === 'fulfilled' && msgRes.value?.data) {
          setMessages(msgRes.value.data);
        }
      } catch (err) {
        console.warn('Error loading room data, initializing default workspace:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRoomData();
  }, [roomId]);

  // WebSocket Room Joining & Presence Lifecycle
  useEffect(() => {
    if (!socket || !user) return;

    // Join room event
    const joinPayload = {
      roomId,
      user: {
        id: user.id,
        name: user.name,
        color: user.avatarColor || '#6366f1',
        role: user.role || 'Collaborator',
      },
    };

    socket.emit('join-room', joinPayload);

    function handleRoomState(state) {
      if (state.roomId !== roomId) return;

      if (state.document) {
        setDocumentData(state.document);
      }
      if (state.participants) {
        setParticipants(state.participants);
      }
    }

    function handleUserJoined(data) {
      if (data.roomId !== roomId) return;

      if (data.user && data.user.id !== user.id) {
        addToast(`${data.user.name} joined the room`, 'info');
      }

      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === data.user?.id);
        if (exists) return prev;
        return [...prev, data.user];
      });
    }

    function handleUserLeft(data) {
      if (data.roomId !== roomId) return;

      if (data.user && data.user.id !== user.id) {
        addToast(`${data.user.name} left the room`, 'info');
      }

      setParticipants((prev) =>
        prev.filter((p) => p.id !== data.user?.id && p.socketId !== data.socketId)
      );
    }

    socket.on('room-state', handleRoomState);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('room-state', handleRoomState);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, user, roomId, addToast]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      addToast('Room invite URL copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-700">Connecting to workspace room...</p>
        <p className="text-xs text-slate-400 mt-1">Negotiating WebSocket channel handshake</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Workspace Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Back & Room Name */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Workspace Lobby"
            >
              <IconArrowLeft className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {room?.name || roomId}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize hidden sm:inline">
                  {room?.topic || 'engineering'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 truncate">/room/{roomId}</p>
            </div>
          </div>

          {/* Right: Presence & Actions */}
          <div className="flex items-center gap-3">
            {/* Live Presence Avatars */}
            <PresenceBar participants={participants} />

            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

            {/* Share Link */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              title="Copy Room Link"
            >
              {copied ? (
                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <IconCopy className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            {/* Toggle Chat Drawer */}
            <button
              onClick={() => setShowChat((prev) => !prev)}
              className={`p-2 rounded-lg border transition-colors ${
                showChat
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle Chat Stream"
            >
              <IconChat className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Collaborative Document Stage */}
        <div className="flex-1 min-w-0 h-[calc(100vh-140px)] flex flex-col">
          <CollaborativeEditor
            roomId={roomId}
            initialDocument={documentData}
            participants={participants}
            onOpenHistory={() => setShowHistory(true)}
          />
        </div>

        {/* Chat Drawer Side Stage */}
        {showChat && (
          <div className="w-full lg:w-80 h-[400px] lg:h-[calc(100vh-140px)] flex flex-col shrink-0">
            <ChatPanel roomId={roomId} initialMessages={messages} />
          </div>
        )}
      </div>

      {/* Revision History Modal */}
      {showHistory && (
        <HistoryModal roomId={roomId} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
