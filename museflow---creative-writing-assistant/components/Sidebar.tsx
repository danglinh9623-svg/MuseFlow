import React, { useState } from 'react';
import { ChatSession } from '../types';
import { Icon } from './Icon';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onInstallApp: () => void;
  showInstallButton: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onClearAll,
  isOpen,
  onToggle,
  onInstallApp,
  showInstallButton
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const saveEditing = (id: string) => {
    if (editValue.trim()) {
      onRenameSession(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveEditing(id);
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur">
          <div className="flex items-center gap-2 text-indigo-400">
            <Icon name="Feather" className="w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight text-white">MuseFlow</h1>
          </div>
          <button onClick={onToggle} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <Icon name="X" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {showInstallButton && (
            <button
              onClick={onInstallApp}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all font-bold shadow-lg shadow-indigo-500/20 animate-pulse-slow border border-white/10"
            >
              <Icon name="Download" className="w-5 h-5" />
              Install App
            </button>
          )}

          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onToggle();
            }}
            className={`w-full border border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800 text-gray-200 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all font-medium ${!showInstallButton ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700' : ''}`}
          >
            <Icon name="Plus" className="w-4 h-4" />
            New Story
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
            <span>Library</span>
            <span className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded text-[10px]">{sessions.length}</span>
          </div>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-600 space-y-2 opacity-60">
              <Icon name="Book" className="w-8 h-8" />
              <p className="text-sm italic">No stories yet</p>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-2 rounded-lg transition-all border border-transparent mb-1 ${
                  currentSessionId === session.id
                    ? 'bg-gray-800 border-gray-700'
                    : 'hover:bg-gray-800/50'
                }`}
              >
                {/* Clickable Area for Selection */}
                <div 
                  className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 cursor-pointer py-1"
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}
                >
                  <Icon name={currentSessionId === session.id ? "BookOpen" : "Book"} className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-indigo-400' : 'text-gray-600'}`} />
                  
                  {editingId === session.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveEditing(session.id)}
                      onKeyDown={(e) => handleKeyDown(e, session.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-gray-900 text-white text-sm px-1 py-0.5 rounded border border-indigo-500 w-full outline-none"
                    />
                  ) : (
                    <span className={`truncate text-sm font-medium ${currentSessionId === session.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {session.title}
                    </span>
                  )}
                </div>

                {/* Actions Area - Separated from Selection Click */}
                {editingId !== session.id && (
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEditing(session, e)}
                      className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-all cursor-pointer z-10"
                      title="Rename"
                    >
                      <Icon name="Edit2" className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteSession(session.id, e);
                      }}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer z-10"
                      title="Delete"
                    >
                      <Icon name="Trash2" className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50 space-y-3">
          <button 
             onClick={onClearAll}
             className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 rounded transition-colors"
          >
             <Icon name="Trash" className="w-3 h-3" /> Clear All Data
          </button>

          <div className="flex items-center justify-between text-[10px] text-gray-600 font-mono pt-2 border-t border-gray-800/50">
            <span>MuseFlow v1.1.2</span>
             <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              Online
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
