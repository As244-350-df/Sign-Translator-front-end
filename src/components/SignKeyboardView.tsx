import React, { useState } from 'react';
import { 
  Keyboard as KeyboardIcon, 
  Volume2, 
  Copy, 
  Check, 
  Delete, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  Play, 
  Award, 
  BookOpen 
} from 'lucide-react';
import { AppSettings, SignGestureItem } from '../types';
import { SIGN_ALPHABET, COMMON_SIGNS, SIGN_LANGUAGES } from '../data/mockData';
import { speakText } from '../utils/speech';

interface SignKeyboardViewProps {
  settings: AppSettings;
  onOpenTutorial: () => void;
}

export const SignKeyboardView: React.FC<SignKeyboardViewProps> = ({
  settings,
  onOpenTutorial
}) => {
  const [selectedKey, setSelectedKey] = useState<SignGestureItem>(SIGN_ALPHABET[0]);
  const [composedSentence, setComposedSentence] = useState<string>('HELLO');
  const [activeCategory, setActiveCategory] = useState<'alphabet' | 'numbers' | 'words'>('alphabet');
  const [copied, setCopied] = useState<boolean>(false);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  const [practiceTarget, setPracticeTarget] = useState<string>('A');
  const [practiceScore, setPracticeScore] = useState<number>(0);

  const numbersData: SignGestureItem[] = Array.from({ length: 10 }, (_, i) => ({
    id: `num-${i}`,
    name: `${i}`,
    category: 'number',
    language: 'ASL',
    description: `Standard ${settings.primarySignLanguage} hand representation for digit ${i}.`,
    handshape: `${i} fingers count gesture`,
    movement: 'Held steady facing outward',
    tags: ['number', `${i}`]
  }));

  const handleKeyPress = (item: SignGestureItem) => {
    setSelectedKey(item);
    
    // Add to composed sentence
    if (activeCategory === 'words') {
      setComposedSentence(prev => prev ? `${prev} ${item.name}` : item.name);
    } else {
      setComposedSentence(prev => `${prev}${item.name}`);
    }

    // Audio cue if enabled
    if (settings.soundEffects) {
      speakText(item.name, 1.2, 1.1);
    }

    // Check practice mode
    if (practiceMode && item.name === practiceTarget) {
      setPracticeScore(s => s + 10);
      const nextChar = SIGN_ALPHABET[Math.floor(Math.random() * SIGN_ALPHABET.length)].name;
      setPracticeTarget(nextChar);
    }
  };

  const handleBackspace = () => {
    setComposedSentence(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setComposedSentence('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(composedSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    speakText(composedSentence, settings.speechVoiceRate, settings.speechVoicePitch);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Category Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        
        {/* Category Pill Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            onClick={() => setActiveCategory('alphabet')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'alphabet'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            A-Z Alphabet ({SIGN_ALPHABET.length})
          </button>
          <button
            onClick={() => setActiveCategory('numbers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'numbers'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            0-9 Numbers (10)
          </button>
          <button
            onClick={() => setActiveCategory('words')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'words'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Essential Words ({COMMON_SIGNS.length})
          </button>
        </div>

        {/* Practice Drill Mode & Tutorial Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setPracticeMode(!practiceMode);
              setPracticeTarget(SIGN_ALPHABET[0].name);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
              practiceMode 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{practiceMode ? `Drill: Sign "${practiceTarget}"` : 'Practice Mode'}</span>
          </button>

          <button
            onClick={onOpenTutorial}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors flex items-center space-x-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Interactive Tutorial</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Keyboard Tiles (Left 8 Cols) + Detail Preview (Right 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Virtual Key Matrix */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Sentence Builder Display Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex-1 w-full overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Composed Sentence
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white tracking-wide truncate min-h-[32px]">
                {composedSentence || <span className="text-slate-400 font-normal italic text-sm">Click keys below to fingerspell...</span>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto justify-end">
              <button
                onClick={handleBackspace}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Backspace"
              >
                <Delete className="w-4 h-4" />
              </button>
              <button
                onClick={handleClear}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Clear all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Copy text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSpeak}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Speak</span>
              </button>
            </div>
          </div>

          {/* Key Tiles Grid */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
            {activeCategory === 'alphabet' && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5">
                {SIGN_ALPHABET.map((item) => {
                  const isSelected = selectedKey.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleKeyPress(item)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-150 group ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 shadow-md scale-105'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-2xl font-black text-slate-900 dark:text-white tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1 truncate max-w-full">
                        {item.handshape.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeCategory === 'numbers' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {numbersData.map((item) => {
                  const isSelected = selectedKey.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleKeyPress(item)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">
                        Digit {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeCategory === 'words' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {COMMON_SIGNS.map((item) => {
                  const isSelected = selectedKey.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleKeyPress(item)}
                      className={`flex flex-col items-start p-3 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize mt-0.5">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Spacebar key */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-center">
              <button
                onClick={() => setComposedSentence(prev => `${prev} `)}
                className="w-full max-w-md py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors uppercase tracking-wider"
              >
                Space (Add Space Between Words)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Selected Sign Detail & 3D Spatial Parameters Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {settings.primarySignLanguage} Sign Inspector
              </span>
              <button
                onClick={() => speakText(selectedKey.name)}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                title="Hear Pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Big Character Box */}
            <div className="w-full aspect-square max-w-[200px] mx-auto rounded-3xl bg-gradient-to-tr from-indigo-900 via-slate-900 to-slate-950 border-2 border-indigo-500/40 flex flex-col items-center justify-center p-4 shadow-xl mb-5 text-white">
              <span className="text-6xl font-black text-cyan-300 tracking-wider">
                {selectedKey.name}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">
                {selectedKey.category}
              </span>
            </div>

            {/* 5 Structural Parameters Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Handshape (Configuration)</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedKey.handshape}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Movement & Trajectory</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedKey.movement}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Kinetic Description</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedKey.description}</p>
              </div>
            </div>

            {/* Quick action: append to sentence */}
            <button
              onClick={() => handleKeyPress(selectedKey)}
              className="w-full mt-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
            >
              Insert "{selectedKey.name}" into Sentence
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
