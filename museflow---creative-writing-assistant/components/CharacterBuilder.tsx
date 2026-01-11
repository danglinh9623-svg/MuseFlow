import React, { useState } from 'react';
import { CharacterProfile } from '../types';
import { Icon } from './Icon';
import { generateCharacterSuggestion } from '../services/geminiService';
import { INITIAL_CHARACTER_STATE } from '../constants';

interface CharacterBuilderProps {
  onSave: (character: CharacterProfile) => void;
  onCancel: () => void;
}

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ onSave, onCancel }) => {
  const [profile, setProfile] = useState<CharacterProfile>({
    ...INITIAL_CHARACTER_STATE,
    id: Date.now().toString()
  });
  const [loadingField, setLoadingField] = useState<string | null>(null);

  const handleInputChange = (field: keyof CharacterProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleMagicFill = async (field: keyof CharacterProfile) => {
    if (!profile.name && field !== 'name') {
      alert("Please give your character a name first to get better suggestions.");
      return;
    }
    setLoadingField(field);
    const suggestion = await generateCharacterSuggestion(field, profile);
    handleInputChange(field, suggestion);
    setLoadingField(null);
  };

  const fields: { key: keyof CharacterProfile; label: string; type: 'input' | 'textarea' }[] = [
    { key: 'name', label: 'Name', type: 'input' },
    { key: 'role', label: 'Role / Archetype', type: 'input' },
    { key: 'appearance', label: 'Appearance', type: 'textarea' },
    { key: 'backstory', label: 'Backstory & Trauma', type: 'textarea' },
    { key: 'strengths', label: 'Strengths & Skills', type: 'textarea' },
    { key: 'weaknesses', label: 'Weaknesses & Flaws', type: 'textarea' },
    { key: 'goals', label: 'Goals & Motivations', type: 'textarea' },
    { key: 'relationships', label: 'Key Relationships', type: 'textarea' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Icon name="UserPlus" className="text-indigo-400" />
              Character Foundry
            </h2>
            <p className="text-gray-400 text-sm mt-1">Define deep, memorable characters for your story context.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <Icon name="X" className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((f) => (
              <div key={f.key} className={`flex flex-col gap-2 ${f.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                <label className="text-sm font-medium text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  {f.label}
                  <button
                    onClick={() => handleMagicFill(f.key)}
                    disabled={!!loadingField}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs normal-case disabled:opacity-50"
                    title="Generate with AI"
                  >
                    {loadingField === f.key ? (
                      <Icon name="Loader2" className="w-3 h-3 animate-spin" />
                    ) : (
                      <Icon name="Sparkles" className="w-3 h-3" />
                    )}
                    Inspire Me
                  </button>
                </label>
                
                {f.type === 'input' ? (
                  <input
                    type="text"
                    value={profile[f.key]}
                    onChange={(e) => handleInputChange(f.key, e.target.value)}
                    className="bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-600"
                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                  />
                ) : (
                  <textarea
                    value={profile[f.key]}
                    onChange={(e) => handleInputChange(f.key, e.target.value)}
                    className="bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[100px] placeholder-gray-600"
                    placeholder={`Describe ${f.label.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-800/50 rounded-b-xl flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(profile)}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-900/20 transition-all transform active:scale-95"
          >
            Save Character
          </button>
        </div>
      </div>
    </div>
  );
};
