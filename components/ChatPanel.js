'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { messagesAPI } from '@/lib/api';
import { IconChat, IconSend, IconX } from './Icons';

export default function ChatPanel({ roomId, initialMessages = [] }) {
  const { user, socket } = useWorkspace();
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync initial messages
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Listen to incoming messages via Socket.io
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message) {
      if (message.roomId !== roomId) return;
      setMessages((prev) => {
        // Prevent duplicate messages if optimistic update already added it
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    }

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket, roomId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || sending) return;

    setInputValue('');
    setSending(true);

    const tempId = `msg_${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      roomId,
      sender: user?.name || 'Anonymous',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Send via socket if connected
    if (socket && socket.connected) {
      socket.emit('send-message', {
        roomId,
        content: text,
      });
      setSending(false);
    } else {
      // Fallback to REST API
      try {
        await messagesAPI.send(roomId, {
          sender: user?.name || 'Anonymous',
          content: text,
        });
      } catch (err) {
        console.error('Failed to send message via REST:', err);
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <IconChat className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-semibold text-slate-800">Workspace Chat</h4>
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <IconChat className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-medium">No messages yet</p>
            <p className="text-[11px] mt-0.5">Send a message to start the room discussion!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.sender === user?.name;
            const time = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={msg._id || index}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-700">
                    {isSelf ? 'You' : msg.sender}
                  </span>
                  {time && <span className="text-[10px] text-slate-400">{time}</span>}
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                    isSelf
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message... (Enter to send)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-all active:scale-95"
            title="Send Message"
          >
            <IconSend className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
