'use client';

import React, { useState } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { USER_PALETTES } from '@/lib/socket';
import { IconX, IconCheck } from './Icons';

export default function ProfileModal({ onClose }) {
  const { user, updateUser, addToast } = useWorkspace();
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || '');
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor || USER_PALETTES[0].bg);

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUser({
      name: name.trim(),
      role: role.trim() || 'Collaborator',
      avatarColor: selectedColor,
    });

    addToast('Profile updated successfully!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Collaborator Profile</h3>
            <p className="text-xs text-slate-500">Configure your live presence and cursor identity</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Live Preview Avatar & Cursor */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
              style={{ backgroundColor: selectedColor }}
            >
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{name || 'Your Name'}</p>
              <p className="text-xs text-slate-500">{role || 'Your Role'}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedColor }}></span>
                <span className="text-[11px] font-medium text-slate-600">Your live cursor color</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Elena Rostova"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Role / Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Frontend Architect"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Signature Cursor & Avatar Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {USER_PALETTES.map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => setSelectedColor(palette.bg)}
                  style={{ backgroundColor: palette.bg }}
                  className={`h-9 rounded-lg flex items-center justify-center transition-colors ${
                    selectedColor === palette.bg
                      ? 'ring-2 ring-offset-2 ring-indigo-600'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                  title={palette.name}
                >
                  {selectedColor === palette.bg && <IconCheck className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
