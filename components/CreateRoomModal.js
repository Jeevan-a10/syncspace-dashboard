'use client';

import React, { useState } from 'react';
import { roomsAPI } from '@/lib/api';
import { useWorkspace } from '@/context/WorkspaceContext';
import { IconX, IconPlus } from './Icons';

const TOPICS = [
  { id: 'engineering', label: 'Engineering', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'architecture', label: 'Architecture', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'design', label: 'Design', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'standup', label: 'Standup', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'general', label: 'General', color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

export default function CreateRoomModal({ onClose, onCreated }) {
  const { addToast } = useWorkspace();
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('engineering');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val) => {
    setName(val);
    if (!roomId) {
      // Auto-generate slug for room ID
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 32);
      setRoomId(slug);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanRoomId = roomId.toLowerCase().trim();
    if (!cleanRoomId || cleanRoomId.length < 3) {
      setError('Room ID must be at least 3 characters.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(cleanRoomId)) {
      setError('Room ID can only contain lowercase letters, numbers, and hyphens.');
      return;
    }
    if (!name.trim() || name.trim().length < 3) {
      setError('Room Name must be at least 3 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await roomsAPI.create({
        roomId: cleanRoomId,
        name: name.trim(),
        topic,
        description: description.trim() || undefined,
        maxParticipants: Number(maxParticipants),
      });

      addToast(`Workspace "${name}" created!`, 'success');
      onCreated(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Create Collaborative Workspace</h3>
            <p className="text-xs text-slate-500">Initialize a live collaborative document & chat room</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Distributed Database Architecture"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Room Identifier (Slug)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-mono">
                /room/
              </span>
              <input
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toLowerCase())}
                placeholder="database-arch-v2"
                className="w-full pl-16 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Lowercase letters, numbers, and hyphens only.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Topic Domain
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                {TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Participants
              </label>
              <input
                type="number"
                min="2"
                max="500"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline meeting goals, whiteboard notes, or shared context..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <IconPlus className="w-4 h-4" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
