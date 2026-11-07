'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  IconCursor,
  IconWifi,
  IconWifiOff,
  IconPlus,
  IconSettings,
} from './Icons';
import ProfileModal from './ProfileModal';
import CreateRoomModal from './CreateRoomModal';

export default function Navbar({ onRoomCreated }) {
  const { user, isConnected } = useWorkspace();
  const [showProfile, setShowProfile] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <IconCursor className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">SyncSpace</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md uppercase tracking-wider">
                  Real-Time
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Collaborative Workspace Engine</p>
            </div>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Live Socket Status Badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isConnected ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden md:inline">Socket Connected</span>
                  <span className="md:hidden">Live</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <span className="hidden md:inline">Connecting...</span>
                  <span className="md:hidden">Offline</span>
                </>
              )}
            </div>

            {/* Create Room Button */}
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <IconPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Workspace</span>
            </button>

            {/* User Profile Pill */}
            {user && (
              <button
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-left"
                title="Edit profile & cursor color"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-inner"
                  style={{ backgroundColor: user.avatarColor || '#6366f1' }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-xs leading-tight">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[100px]">{user.role}</p>
                </div>
                <IconSettings className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={(room) => {
            setShowCreate(false);
            if (onRoomCreated) onRoomCreated(room);
          }}
        />
      )}
    </>
  );
}
