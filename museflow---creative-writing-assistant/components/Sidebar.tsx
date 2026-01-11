import React from 'react';
import { ChatSession } from '../types';
import { Icon } from './Icon';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
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
  isOpen,
  onToggle,
  onInstallApp,
  showInstallButton
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-400">
            <Icon name="Feather" className="w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight text-white">MuseFlow</h1>
          </div>
          <button onClick={onToggle} className="lg:hidden text-gray-400">
            <Icon name="X" className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onToggle();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-lg shadow-indigo-900/20"
          >
            <Icon name="Plus" className="w-5 h-5" />
            New Story
          </button>

          {showInstallButton && (
            <button
              onClick={onInstallApp}
              className="w-full bg-gray-800 hover:bg-gray-700 text-indigo-300 border border-indigo-500/30 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
            >
              <Icon name="Download" className="w-4 h-4" />
              Install App
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Library
          </div>
          {sessions.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-8 italic">
              No stories yet. Start writing!
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  currentSessionId === session.id
                    ? 'bg-gray-800 text-white shadow-md border-l-2 border-indigo-500'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Icon name="BookOpen" className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-indigo-400' : 'text-gray-600'}`} />
                  <span className="truncate text-sm font-medium">
                    {session.title}
                  </span>
                </div>
                <button
                  onClick={(e) => onDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/30 hover:text-red-400 rounded transition-all"
                  title="Delete Story"
                >
                  <Icon name="Trash2" className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>System Operational</span>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Powered by Gemini 1.5 Pro
          </div>
        </div>
      </div>
    </>
  );
};