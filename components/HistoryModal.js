'use client';

import React, { useState, useEffect } from 'react';
import { documentAPI } from '@/lib/api';
import { IconHistory, IconX, IconCheck } from './Icons';

const CHANGE_TYPE_BADGES = {
  init: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  edit: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  replace: 'bg-amber-50 text-amber-700 border-amber-200',
  reset: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function HistoryModal({ roomId, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await documentAPI.getHistory(roomId);
        setHistory(res.data || []);
      } catch (err) {
        console.error('Failed to load version history:', err);
        setError('Failed to load version history');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [roomId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IconHistory className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Document Revision History</h3>
              <p className="text-xs text-slate-500">Monotonic change audit trail for {roomId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-medium">Fetching revision log...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <IconHistory className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No revision history found</p>
              <p className="text-[11px] mt-0.5">Edits will be recorded here as peers collaborate.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((rev, index) => {
                const badgeStyle =
                  CHANGE_TYPE_BADGES[rev.changeType] || CHANGE_TYPE_BADGES.edit;
                const date = rev.timestamp
                  ? new Date(rev.timestamp).toLocaleString()
                  : 'Recent';

                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-mono font-bold text-slate-700">
                        #{rev.version || index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {rev.author || 'Collaborator'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${badgeStyle}`}
                          >
                            {rev.changeType || 'edit'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{date}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-medium text-slate-500">
                        {rev.deltaLength ? `${rev.deltaLength} chars` : 'Sync edit'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Total {history.length} {history.length === 1 ? 'revision' : 'revisions'} logged
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
