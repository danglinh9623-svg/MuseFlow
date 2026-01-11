import React, { useState, useEffect, useRef } from 'react';
import { HashRouter } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { CharacterBuilder } from './components/CharacterBuilder';
import { ModelInfo } from './components/ModelInfo';
import { Icon } from './components/Icon';
import { ChatSession, Message, CharacterProfile, ModelType } from './types';
import { streamChatResponse, generateSessionTitle } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

const STORAGE_KEY = 'museflow_sessions';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCharacterBuilderOpen, setIsCharacterBuilderOpen] = useState(false);
  const [isModelInfoOpen, setIsModelInfoOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // PWA State
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  // Force re-render when prompt is available
  const [installable, setInstallable] = useState(false);

  // Model State
  const [selectedModel, setSelectedModel] = useState<string>(ModelType.GEMINI_PRO);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          if (!currentSessionId) setCurrentSessionId(parsed[0].id);
        } else {
           createNewSession();
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    if (window.deferredPrompt) {
      setInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isGenerating]);

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const getWordCount = (text: string) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const handleInstallClick = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        window.deferredPrompt = null;
        setInstallable(false);
        setIsInstalled(true);
      }
    } else {
      setShowInstallInstructions(true);
    }
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Untitled Story',
      messages: [{
        id: 'welcome',
        role: 'model',
        content: "Hello! I am MuseFlow. Whether you're plotting a fantasy epic, a gritty noir, or a fluff fanfiction, I'm here to help. \n\nStart by telling me your idea, or define some characters using the Character Foundry on the right.",
        timestamp: Date.now()
      }],
      lastModified: Date.now(),
      characters: []
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    // Prevent event bubbling to avoid selecting the session while deleting
    e.stopPropagation();
    e.preventDefault();
    
    // Use window.confirm before deleting
    if (window.confirm('Are you sure you want to delete this story?')) {
      setSessions(prevSessions => {
        const newSessions = prevSessions.filter(s => s.id !== id);
        
        // Handle current session switch inside the state update logic or strictly after
        if (currentSessionId === id) {
          if (newSessions.length > 0) {
             // We need to defer this slightly to avoid render loop, or just set it
             setTimeout(() => setCurrentSessionId(newSessions[0].id), 0);
          } else {
            // If we deleted the last one, create a new blank one
            const blankSession: ChatSession = {
                id: (Date.now() + 1).toString(),
                title: 'Untitled Story',
                messages: [{
                    id: 'welcome',
                    role: 'model',
                    content: "Start a new story...",
                    timestamp: Date.now()
                }],
                lastModified: Date.now(),
                characters: []
            };
            setTimeout(() => {
                setSessions([blankSession]);
                setCurrentSessionId(blankSession.id);
            }, 0);
            return [blankSession]; // Return this for the immediate state
          }
        }
        return newSessions;
      });
    }
  };

  const renameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, title: newTitle } : s
    ));
  };

  const handleClearAllData = () => {
    if (confirm('WARNING: This will delete ALL your stories and characters. This action cannot be undone. Are you sure?')) {
      localStorage.removeItem(STORAGE_KEY);
      setSessions([]);
      setTimeout(() => createNewSession(), 100);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!currentSessionId) return;
    if (!confirm('Delete this message?')) return;

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: s.messages.filter(m => m.id !== messageId),
          lastModified: Date.now()
        };
      }
      return s;
    }));
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !currentSessionId || isGenerating) return;

    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    const shouldRename = currentSession.title === 'Untitled Story' || currentSession.title === 'New Story';
    
    // Fallback title (first 5 words) to ensure it gets renamed immediately
    let fallbackTitle = userMsg.content.split(' ').slice(0, 5).join(' ');
    if (fallbackTitle.length > 30) fallbackTitle = fallbackTitle.substring(0, 30) + '...';

    setSessions(prev => prev.map(s => {
      if (s.id === currentSession.id) {
        return {
          ...s,
          // Apply fallback title immediately if needed
          title: shouldRename ? fallbackTitle : s.title,
          messages: updatedMessages,
          lastModified: Date.now()
        };
      }
      return s;
    }));

    setInputValue('');
    setIsGenerating(true);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsgPlaceholder: Message = {
      id: modelMsgId,
      role: 'model',
      content: '', 
      timestamp: Date.now()
    };
    
    setSessions(prev => prev.map(s => 
      s.id === currentSession.id 
      ? { ...s, messages: [...updatedMessages, modelMsgPlaceholder] }
      : s
    ));

    // Execute AI Auto-Rename
    if (shouldRename) {
      // Run independently
      generateSessionTitle(userMsg.content).then(newTitle => {
          if (newTitle && newTitle !== "New Story") {
             setSessions(prev => prev.map(s => 
               s.id === currentSession.id ? { ...s, title: newTitle } : s
             ));
          }
      }).catch(err => console.error("Auto-rename failed", err));
    }

    try {
      await streamChatResponse(
        updatedMessages,
        inputValue,
        currentSession.characters,
        selectedModel,
        (textChunk) => {
          setSessions(prev => prev.map(s => {
            if (s.id === currentSession.id) {
              const msgs = [...s.messages];
              const lastMsg = msgs[msgs.length - 1];
              if (lastMsg.id === modelMsgId) {
                lastMsg.content = textChunk;
              }
              return { ...s, messages: msgs };
            }
            return s;
          }));
        }
      );
    } catch (error) {
      console.error(error);
      setSessions(prev => prev.map(s => {
        if (s.id === currentSession.id) {
          const msgs = [...s.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.id === modelMsgId) {
            lastMsg.content = "I encountered an error connecting to the Muse. Please try again (Check quota or connection).";
          }
          return { ...s, messages: msgs };
        }
        return s;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    const currentSession = getCurrentSession();
    if (!currentSession || isGenerating) return;
    
    const messages = [...currentSession.messages];
    const lastMsg = messages[messages.length - 1];
    
    if (lastMsg.role !== 'model') return; 

    messages.pop();
    const lastUserMsg = messages[messages.length - 1];
    if (!lastUserMsg) return;

    setIsGenerating(true);

     const modelMsgId = (Date.now() + 1).toString();
     const modelMsgPlaceholder: Message = {
       id: modelMsgId,
       role: 'model',
       content: '',
       timestamp: Date.now()
     };

     setSessions(prev => prev.map(s => 
       s.id === currentSession.id 
       ? { ...s, messages: [...messages, modelMsgPlaceholder] }
       : s
     ));

     try {
       await streamChatResponse(
         messages,
         lastUserMsg.content,
         currentSession.characters,
         selectedModel, 
         (textChunk) => {
           setSessions(prev => prev.map(s => {
             if (s.id === currentSession.id) {
               const msgs = [...s.messages];
               const last = msgs[msgs.length - 1];
               if (last.id === modelMsgId) {
                 last.content = textChunk;
               }
               return { ...s, messages: msgs };
             }
             return s;
           }));
         }
       );
     } catch (e) {
        console.error(e);
     } finally {
       setIsGenerating(false);
     }
  };

  const addCharacter = (character: CharacterProfile) => {
    const current = getCurrentSession();
    if (!current) return;
    
    const updatedCharacters = [...current.characters, character];
    setSessions(prev => prev.map(s => 
      s.id === current.id ? { ...s, characters: updatedCharacters } : s
    ));
    setIsCharacterBuilderOpen(false);

    const sysMsg: Message = {
      id: Date.now().toString(),
      role: 'model',
      content: `*System: Character "${character.name}" has been added to the story context.*`,
      timestamp: Date.now()
    };
    setSessions(prev => prev.map(s => 
        s.id === current.id ? { ...s, messages: [...s.messages, sysMsg] } : s
    ));
  };

  const currentSession = getCurrentSession();

  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-950 text-gray-100 font-sans selection:bg-indigo-500/30">
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewSession={createNewSession}
          onDeleteSession={deleteSession}
          onRenameSession={renameSession}
          onClearAll={handleClearAllData}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onInstallApp={handleInstallClick}
          showInstallButton={!isInstalled} 
        />

        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <header className="h-16 border-b border-gray-800 bg-gray-950/80 backdrop-blur flex items-center justify-between px-4 z-10 sticky top-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-400">
                <Icon name="Menu" />
              </button>
              <h2 className="font-semibold text-gray-200 truncate max-w-[200px] md:max-w-md">
                {currentSession?.title || 'New Story'}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsModelInfoOpen(true)}
                className={`p-2 rounded-lg transition-colors text-xs md:text-sm flex items-center gap-1 border ${
                    selectedModel === ModelType.GEMINI_PRO 
                    ? 'text-indigo-400 border-indigo-900 bg-indigo-900/10' 
                    : 'text-orange-400 border-orange-900 bg-orange-900/10'
                }`}
                title="Change AI Model"
              >
                <Icon name={selectedModel === ModelType.GEMINI_PRO ? 'Sparkles' : 'Zap'} className="w-4 h-4"/>
                <span className="hidden md:inline font-medium">
                    {selectedModel === ModelType.GEMINI_PRO ? 'Pro (Creative)' : 'Flash (Fast)'}
                </span>
              </button>
              <button
                onClick={() => setIsCharacterBuilderOpen(true)}
                className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
              >
                <Icon name="Users" className="w-4 h-4" />
                <span className="hidden sm:inline">Add Character</span>
              </button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 pb-20">
            {currentSession?.messages.map((msg, idx) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                    <Icon name="Bot" className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div 
                  className={`relative group px-5 py-3.5 rounded-2xl max-w-[85%] md:max-w-[75%] shadow-md leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                  }`}
                >
                  {/* Delete Button - Appears on hover */}
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className={`absolute -top-3 -right-3 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm ${
                      msg.role === 'user' ? 'bg-indigo-800 text-indigo-200 hover:bg-red-500 hover:text-white' : 'bg-gray-700 text-gray-400 hover:bg-red-500 hover:text-white'
                    }`}
                    title="Delete message"
                  >
                    <Icon name="X" className="w-3 h-3" />
                  </button>

                  <div className="markdown-content prose prose-invert prose-indigo prose-sm md:prose-base max-w-none">
                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {/* Word Count & Meta Info */}
                  <div className={`mt-2 flex items-center justify-end gap-2 text-[10px] opacity-70 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                    <span className="font-medium">{getWordCount(msg.content)} words</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  
                  {/* Regenerate Button (Only for last model message) */}
                  {msg.role === 'model' && idx === currentSession.messages.length - 1 && !isGenerating && (
                    <button 
                      onClick={handleRegenerate}
                      className="absolute -bottom-6 left-0 text-xs text-gray-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                    >
                      <Icon name="RefreshCw" className="w-3 h-3" /> Regenerate
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Icon name="User" className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Active Characters Badge List */}
            {currentSession && currentSession.characters.length > 0 && (
              <div className="max-w-4xl mx-auto mt-4 px-4 py-2 border-t border-dashed border-gray-800">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-bold">Context Active:</p>
                <div className="flex flex-wrap gap-2">
                  {currentSession.characters.map(c => (
                    <span key={c.id} className="text-xs bg-gray-900 border border-gray-700 text-gray-400 px-2 py-1 rounded flex items-center gap-1">
                      <Icon name="User" className="w-3 h-3" /> {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-950 border-t border-gray-800 safe-area-bottom">
            <div className="max-w-4xl mx-auto relative">
              <form onSubmit={handleSendMessage} className="relative group">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Describe your scene, ask for a trope, or generate a plot twist..."
                  className="w-full bg-gray-900 text-gray-100 rounded-xl border border-gray-700 pl-4 pr-14 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none overflow-hidden h-[52px] focus:h-[120px] text-base"
                  style={{ minHeight: '52px' }}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isGenerating}
                  className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
                >
                  {isGenerating ? (
                    <Icon name="Loader2" className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon name="Send" className="w-5 h-5" />
                  )}
                </button>
              </form>
              <div className="text-center mt-2 text-xs text-gray-500 hidden md:block">
                AI can make mistakes. Check important info.
              </div>
            </div>
          </div>
        </main>

        {isCharacterBuilderOpen && (
          <CharacterBuilder 
            onSave={addCharacter} 
            onCancel={() => setIsCharacterBuilderOpen(false)} 
          />
        )}

        {isModelInfoOpen && (
          <ModelInfo 
            currentModel={selectedModel}
            onSelectModel={setSelectedModel}
            onClose={() => setIsModelInfoOpen(false)} 
          />
        )}

        {/* Manual Install Instructions Modal */}
        {showInstallInstructions && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowInstallInstructions(false)}>
            <div className="bg-gray-800 rounded-xl w-full max-w-sm border border-gray-700 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white">Install App</h3>
                  <button onClick={() => setShowInstallInstructions(false)} className="text-gray-400 hover:text-white">
                    <Icon name="X" className="w-5 h-5"/>
                  </button>
               </div>
               <p className="text-gray-300 text-sm mb-4">
                 Your browser doesn't support automatic installation or the prompt was dismissed.
               </p>
               <div className="bg-gray-900 rounded-lg p-4 space-y-3">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">1</div>
                    <div className="text-sm text-gray-300">Tap the browser menu <span className="font-bold">⋮</span> or <span className="font-bold">Share</span> button.</div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">2</div>
                    <div className="text-sm text-gray-300">Select <span className="text-indigo-400 font-bold">Add to Home Screen</span> or <span className="text-indigo-400 font-bold">Install App</span>.</div>
                 </div>
               </div>
               <button 
                onClick={() => setShowInstallInstructions(false)}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors"
               >
                 Got it
               </button>
            </div>
          </div>
        )}
      </div>
    </HashRouter>
  );
}
