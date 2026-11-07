'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSocket, disconnectSocket, getPaletteColor } from '@/lib/socket';

const WorkspaceContext = createContext(null);

const DEFAULT_NAMES = [
  'Alex Chen',
  'Priya Sharma',
  'Jordan Blake',
  'Marcus Vance',
  'Elena Rostova',
  'Taylor Kim',
  'Aiden Brooks',
];

export function WorkspaceProvider({ children }) {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Initialize or restore user profile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('syncspace_user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        const randomName = DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
        const userId = `usr_${Math.random().toString(36).substring(2, 9)}`;
        const palette = getPaletteColor(userId);
        const newUser = {
          id: userId,
          name: randomName,
          role: 'Full Stack Engineer',
          avatarColor: palette.bg,
        };
        localStorage.setItem('syncspace_user', JSON.stringify(newUser));
        setUser(newUser);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
      setUser({
        id: 'usr_guest',
        name: 'Guest Developer',
        role: 'Collaborator',
        avatarColor: '#6366f1',
      });
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sock = getSocket();
    if (!sock) return;

    setSocket(sock);

    function onConnect() {
      setIsConnected(true);
      setSocketId(sock.id);
    }

    function onDisconnect() {
      setIsConnected(false);
      setSocketId(null);
    }

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);

    if (sock.connected) {
      onConnect();
    }

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
    };
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('syncspace_user', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save user:', e);
      }
      return updated;
    });
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        updateUser,
        socket,
        isConnected,
        socketId,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-200 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700 backdrop-blur-md'
                : toast.type === 'error'
                ? 'bg-rose-900/90 text-rose-100 border-rose-700 backdrop-blur-md'
                : 'bg-slate-900/90 text-slate-100 border-slate-700 backdrop-blur-md'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
