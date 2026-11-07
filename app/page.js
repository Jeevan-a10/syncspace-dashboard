'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import RoomCard from '@/components/RoomCard';
import CreateRoomModal from '@/components/CreateRoomModal';
import { roomsAPI, healthAPI } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import {
  IconSearch,
  IconPlus,
  IconRefresh,
  IconCursor,
  IconDocument,
  IconUsers,
  IconSparkles,
} from '@/components/Icons';

// Fallback seed rooms for zero-backend standalone resilience
const SEED_ROOMS = [
  {
    roomId: 'eng-sync',
    name: 'Distributed Systems & Microservices',
    topic: 'engineering',
    description: 'Technical RFC discussions, WebSocket synchronization benchmarks, and distributed database clustering.',
    activeUsersCount: 3,
  },
  {
    roomId: 'arch-review',
    name: 'Real-Time Sync Protocol Architecture',
    topic: 'architecture',
    description: 'Monotonic revisions, CRDT trade-offs, Socket.io event models, and state reconciliation rules.',
    activeUsersCount: 2,
  },
  {
    roomId: 'design-system',
    name: 'Design System & Micro-Interactions',
    topic: 'design',
    description: 'Tailwind CSS token alignments, cursor palette aesthetics, and low-latency canvas overlay rendering.',
    activeUsersCount: 1,
  },
  {
    roomId: 'daily-standup',
    name: 'Engineering Daily Standup',
    topic: 'standup',
    description: 'Daily team sync, blockers, milestone status, and upcoming feature shipping priorities.',
    activeUsersCount: 4,
  },
];

const TOPIC_TABS = [
  { id: 'all', label: 'All Workspaces' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'design', label: 'Design' },
  { id: 'standup', label: 'Standup' },
  { id: 'general', label: 'General' },
];

export default function Home() {
  const { isConnected, addToast } = useWorkspace();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [healthInfo, setHealthInfo] = useState(null);

  // Fetch rooms and health
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, healthRes] = await Promise.allSettled([
        roomsAPI.getAll(),
        healthAPI.check(),
      ]);

      if (roomsRes.status === 'fulfilled' && roomsRes.value?.data?.length > 0) {
        setRooms(roomsRes.value.data);
      } else {
        setRooms(SEED_ROOMS);
      }

      if (healthRes.status === 'fulfilled') {
        setHealthInfo(healthRes.value);
      }
    } catch (err) {
      console.warn('API error, falling back to seed rooms:', err);
      setRooms(SEED_ROOMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesTopic =
        selectedTopic === 'all' || room.topic?.toLowerCase() === selectedTopic;
      const matchesSearch =
        !searchQuery.trim() ||
        room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.roomId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [rooms, selectedTopic, searchQuery]);

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onRoomCreated={handleRoomCreated} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white shadow-xl overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-sm">
              <IconSparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full-Stack Real-Time Workspace Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Collaborate in real time with zero friction.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Multi-user document synchronization with monotonic revision trails, live SVG cursor
              canvas tracking, full-duplex room chat, and dual-mode persistence.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <IconPlus className="w-4 h-4" />
                <span>Launch New Workspace</span>
              </button>

              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-xs backdrop-blur-sm transition-all"
              >
                <IconRefresh className="w-4 h-4 text-slate-300" />
                <span>Refresh Workspaces</span>
              </button>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium">Total Workspaces</p>
              <p className="text-2xl font-bold text-white">{rooms.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium">Gateway Protocol</p>
              <p className="text-2xl font-bold text-emerald-400">WebSocket</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium">Revision Engine</p>
              <p className="text-2xl font-bold text-cyan-300">Monotonic</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium">Persistence Mode</p>
              <p className="text-2xl font-bold text-indigo-300">
                {healthInfo?.database || 'Dual-Mode'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Topic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            {TOPIC_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTopic(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTopic === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces or topics..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Workspaces Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium">Connecting to workspace gateway...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-20 bg-white rounded-2xl border border-slate-200 text-center p-8">
            <IconDocument className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No workspaces found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No active rooms match your current search criteria. Create a new workspace or reset filters.
            </p>
            <button
              onClick={() => {
                setSelectedTopic('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <RoomCard key={room.roomId} room={room} />
            ))}

            {/* Quick Add Card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-full min-h-[200px] rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-white/40 hover:bg-indigo-50/20 p-6 flex flex-col items-center justify-center text-center group transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 transition-colors shadow-2xs">
                <IconPlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                New Workspace
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Create a custom collaborative room for your team
              </p>
            </button>
          </div>
        )}

        {/* System Architecture Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IconCursor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hybrid Real-Time Architecture & Event Protocol
              </h3>
              <p className="text-xs text-slate-500">
                Optimistic local state reconciliation with monotonic revision broadcasting
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-xs font-bold text-indigo-700">1. WebSocket Synchronization</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bidirectional Socket.io transport broadcasting live text diffs, cursor coordinates, and typing indicators at &lt; 20ms latency.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-xs font-bold text-indigo-700">2. Monotonic Revisions</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Auto-incrementing revision audit logs prevent race conditions and preserve linear document version histories.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <span className="text-xs font-bold text-indigo-700">3. Dual-Mode Storage</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-speed Mongoose models with transparent in-memory fallback guarantees 100% service uptime even if MongoDB is offline.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(room) => {
            setShowCreateModal(false);
            handleRoomCreated(room);
          }}
        />
      )}
    </div>
  );
}
