import React, { useState } from 'react';
import { X, Plus, Sparkles, Check, HandMetal, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import { SignSymbolMeaning } from '../utils/handTracker';

interface AddSignModalProps {
  onClose: () => void;
  onSaveSign: (key: string, sign: SignSymbolMeaning) => void;
}

const PRESET_EMOJIS = ['👋', '☕', '🏠', '🐱', '🐶', '🚗', '✈️', '🍕', '💡', '🔑', '🌟', '📱', '🎓', '🏥', '❤️', '🎉', '💼', '🛑', '⏰', '⚡'];

const PRESET_HAND_SHAPES: { name: string; icon: string; config: { thumb: number; index: number; middle: number; ring: number; pinky: number } }[] = [
  { name: 'Open Palm (5)', icon: '🖐️', config: { thumb: 1.0, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 } },
  { name: 'Solid Fist (S/A)', icon: '✊', config: { thumb: 0.2, index: 0.2, middle: 0.2, ring: 0.2, pinky: 0.2 } },
  { name: 'Point Index (D/1)', icon: '☝️', config: { thumb: 0.3, index: 1.0, middle: 0.2, ring: 0.2, pinky: 0.2 } },
  { name: 'V-Shape / Peace (V/2)', icon: '✌️', config: { thumb: 0.3, index: 1.0, middle: 1.0, ring: 0.2, pinky: 0.2 } },
  { name: 'Thumbs Up (10)', icon: '👍', config: { thumb: 1.0, index: 0.2, middle: 0.2, ring: 0.2, pinky: 0.2 } },
  { name: 'I Love You (ILY)', icon: '🤟', config: { thumb: 1.0, index: 1.0, middle: 0.2, ring: 0.2, pinky: 1.0 } },
  { name: 'Call Me / Shaka (Y)', icon: '🤙', config: { thumb: 1.0, index: 0.2, middle: 0.2, ring: 0.2, pinky: 1.0 } },
  { name: 'OK / Pinch (F/9)', icon: '👌', config: { thumb: 0.5, index: 0.5, middle: 1.0, ring: 1.0, pinky: 1.0 } },
  { name: 'Three / Water (W/3)', icon: '💧', config: { thumb: 0.3, index: 1.0, middle: 1.0, ring: 1.0, pinky: 0.2 } },
  { name: 'Four (4)', icon: '4️⃣', config: { thumb: 0.2, index: 1.0, middle: 1.0, ring: 1.0, pinky: 1.0 } },
];

export const AddSignModal: React.FC<AddSignModalProps> = ({ onClose, onSaveSign }) => {
  const [signName, setSignName] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [symbol, setSymbol] = useState('🌟');
  const [meaning, setMeaning] = useState('');
  const [category, setCategory] = useState<'greetings' | 'common' | 'emergency' | 'alphabet' | 'numbers' | 'actions' | 'custom'>('custom');
  const [aslNotation, setAslNotation] = useState('');
  const [selectedShapePreset, setSelectedShapePreset] = useState<string>('Open Palm (5)');

  // Finger extension levels (0 = curled, 1 = extended)
  const [fingerConfig, setFingerConfig] = useState<{
    thumb: number;
    index: number;
    middle: number;
    ring: number;
    pinky: number;
  }>({
    thumb: 1.0,
    index: 1.0,
    middle: 1.0,
    ring: 1.0,
    pinky: 1.0
  });

  const handleSelectShapePreset = (preset: typeof PRESET_HAND_SHAPES[0]) => {
    setSelectedShapePreset(preset.name);
    setFingerConfig(preset.config);
  };

  const handleFingerSliderChange = (finger: keyof typeof fingerConfig, val: number) => {
    setSelectedShapePreset('Custom');
    setFingerConfig(prev => ({
      ...prev,
      [finger]: val
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signName.trim() || !translatedText.trim()) return;

    const key = signName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    
    const newSign: SignSymbolMeaning = {
      symbol: symbol || '✨',
      signName: signName.trim().toUpperCase(),
      translatedText: translatedText.trim(),
      meaning: meaning.trim() || `Custom recognized sign for "${translatedText.trim()}".`,
      category,
      confidence: 0.96,
      aslNotation: aslNotation.trim() || `Handshape: ${selectedShapePreset}`,
      isCustom: true,
      fingerConfig
    };

    onSaveSign(key, newSign);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Sign Recognition
              </h2>
              <p className="text-xs text-slate-500">
                Train and register a new sign gesture into the real-time AI recognition engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Sign Identity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Sign Name / Label *
              </label>
              <input
                type="text"
                required
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                placeholder="e.g. COFFEE, FAMILY, WAIT, BATHROOM"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Spoken Translation Output (TTS) *
              </label>
              <input
                type="text"
                required
                value={translatedText}
                onChange={(e) => setTranslatedText(e.target.value)}
                placeholder="e.g. I need coffee please"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Emoji / Symbol & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Visual Symbol / Emoji
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  maxLength={4}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-14 h-11 text-center text-xl rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                />
                <div className="flex flex-wrap gap-1 overflow-x-auto max-h-12 py-1">
                  {PRESET_EMOJIS.slice(0, 10).map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSymbol(em)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform hover:scale-110 ${
                        symbol === em ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="custom">Custom Signs</option>
                <option value="greetings">Greetings & Courtesies</option>
                <option value="common">Common Phrases</option>
                <option value="emergency">Medical & Emergency</option>
                <option value="actions">Actions & Requests</option>
                <option value="numbers">Numbers</option>
                <option value="alphabet">Alphabet & Spelling</option>
              </select>
            </div>
          </div>

          {/* Meaning Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Full Meaning & Context
            </label>
            <textarea
              rows={2}
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Describe when to use this sign and what it conveys..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs resize-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Hand Shape & 21-Landmark Kinematic Presets */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <HandMetal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Hand Shape Landmark Topology</span>
              </label>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
                {selectedShapePreset}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Select a standard anatomical hand shape for TensorFlow 21-point recognition, or fine-tune finger curl values below:
            </p>

            {/* Quick Shape Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PRESET_HAND_SHAPES.map((shape) => (
                <button
                  key={shape.name}
                  type="button"
                  onClick={() => handleSelectShapePreset(shape)}
                  className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all ${
                    selectedShapePreset === shape.name
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-lg">{shape.icon}</span>
                  <span className="text-[10px] font-bold line-clamp-1">{shape.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Finger Extension Sliders */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-5 gap-3">
              {(['thumb', 'index', 'middle', 'ring', 'pinky'] as const).map((finger) => (
                <div key={finger} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-400 capitalize">
                    <span>{finger}</span>
                    <span>{fingerConfig[finger] >= 0.7 ? 'Open' : (fingerConfig[finger] >= 0.4 ? 'Bend' : 'Curl')}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.1"
                    value={fingerConfig[finger]}
                    onChange={(e) => handleFingerSliderChange(finger, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-md shadow-indigo-600/30">
                {symbol || '✨'}
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400">
                  Live Preview Recognition Card
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white">
                  "{translatedText || 'Your translated sentence will show here'}"
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {signName ? `${signName.toUpperCase()} • ${selectedShapePreset}` : 'Sign gesture preview'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Register Sign</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
