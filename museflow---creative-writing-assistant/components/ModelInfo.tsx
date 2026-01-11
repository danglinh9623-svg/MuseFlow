import React from 'react';
import { Icon } from './Icon';
import { ModelType } from '../types';

interface ModelInfoProps {
  currentModel: string;
  onSelectModel: (model: string) => void;
  onClose: () => void;
}

export const ModelInfo: React.FC<ModelInfoProps> = ({ currentModel, onSelectModel, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl border border-gray-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <Icon name="X" className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Icon name="Settings" className="text-indigo-400" />
          Model Configuration & Pricing
        </h3>

        <div className="space-y-4">
          <div className="text-sm text-gray-300 mb-4">
            Select the AI model that fits your current task. 
            <br/>
            <span className="text-xs text-gray-500">Tip: Use Flash for drafting to save quota, switch to Pro for final polish.</span>
          </div>

          {/* Model Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Gemini Pro Card */}
            <button
              onClick={() => onSelectModel(ModelType.GEMINI_PRO)}
              className={`text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                currentModel === ModelType.GEMINI_PRO
                  ? 'bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-900/20'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-500'
              }`}
            >
              {currentModel === ModelType.GEMINI_PRO && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl">ACTIVE</div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Sparkles" className={currentModel === ModelType.GEMINI_PRO ? 'text-indigo-400' : 'text-gray-500'} />
                <span className="font-bold text-gray-100">Deep Creative (Pro)</span>
              </div>
              <p className="text-xs text-gray-400 mb-3 h-10">
                Best for complex plots, deep character voices, and high-quality prose.
              </p>
              <div className="text-[10px] font-mono bg-black/30 p-2 rounded text-gray-500">
                <div>Cost: ~$$$</div>
                <div>Speed: Moderate</div>
                <div>Quota: ~50 req/day (Free)</div>
              </div>
            </button>

            {/* Gemini Flash Card */}
            <button
              onClick={() => onSelectModel(ModelType.GEMINI_FLASH)}
              className={`text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                currentModel === ModelType.GEMINI_FLASH
                  ? 'bg-orange-900/20 border-orange-500 shadow-lg shadow-orange-900/20'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-500'
              }`}
            >
              {currentModel === ModelType.GEMINI_FLASH && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl">ACTIVE</div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Zap" className={currentModel === ModelType.GEMINI_FLASH ? 'text-orange-400' : 'text-gray-500'} />
                <span className="font-bold text-gray-100">Fast Draft (Flash)</span>
              </div>
              <p className="text-xs text-gray-400 mb-3 h-10">
                Insanely fast and cheap. Great for brainstorming, chatting, or quick outlines.
              </p>
              <div className="text-[10px] font-mono bg-black/30 p-2 rounded text-gray-500">
                <div>Cost: ~$ (40x cheaper)</div>
                <div>Speed: Lightning</div>
                <div>Quota: ~1,500 req/day (Free)</div>
              </div>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="font-bold text-gray-300 text-sm mb-2">Pricing Reference (Pay-as-you-go)</h4>
            <div className="bg-gray-950 rounded p-3 text-xs text-gray-400 font-mono space-y-1">
               <div className="flex justify-between">
                 <span>Pro Input:</span>
                 <span>$3.50 / 1M tokens</span>
               </div>
               <div className="flex justify-between">
                 <span>Pro Output:</span>
                 <span>$10.50 / 1M tokens</span>
               </div>
               <div className="flex justify-between text-orange-400">
                 <span>Flash Input:</span>
                 <span>$0.075 / 1M tokens</span>
               </div>
               <div className="flex justify-between text-orange-400">
                 <span>Flash Output:</span>
                 <span>$0.30 / 1M tokens</span>
               </div>
               <div className="mt-2 text-gray-500 italic border-t border-gray-800 pt-1">
                 * 1M tokens ≈ 700,000 words (approx 10-14 novels)
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};