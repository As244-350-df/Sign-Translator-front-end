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
  BookOpen,
  Hand,
  Vibrate,
  Activity,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, SignGestureItem } from '../types';
import { SIGN_ALPHABET, COMMON_SIGNS, SIGN_LANGUAGES } from '../data/mockData';
import { speakText } from '../utils/speech';
import { 
  FingerKey, 
  FINGER_METADATA, 
  getFingerProfileForSign, 
  triggerHapticFeedback 
} from '../utils/fingerMapping';
import { FingerActivationVisualizer } from './FingerActivationVisualizer';

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
  const [activeFingerFilter, setActiveFingerFilter] = useState<FingerKey | 'all'>('all');
  const [lastClickedKeyId, setLastClickedKeyId] = useState<string | null>(null);

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
    setLastClickedKeyId(item.id);

    // Retrieve finger kinematics profile & trigger haptic + audio click
    const fingerProfile = getFingerProfileForSign(item.name);
    triggerHapticFeedback(fingerProfile.hapticPattern, fingerProfile.soundPitch, settings.soundEffects);

    // Reset clicked highlight after brief animation
    setTimeout(() => {
      setLastClickedKeyId((prev) => (prev === item.id ? null : prev));
    }, 450);
    
    // Add to composed sentence
    if (activeCategory === 'words') {
      setComposedSentence(prev => prev ? `${prev} ${item.name}` : item.name);
    } else {
      setComposedSentence(prev => `${prev}${item.name}`);
    }

    // Audio voice pronunciation if enabled
    if (settings.soundEffects) {
      speakText(item.name, undefined, 1.2, 1.1);
    }

    // Check practice mode
    if (practiceMode && item.name === practiceTarget) {
      setPracticeScore(s => s + 10);
      const nextChar = SIGN_ALPHABET[Math.floor(Math.random() * SIGN_ALPHABET.length)].name;
      setPracticeTarget(nextChar);
    }
  };

  const handleBackspace = () => {
    triggerHapticFeedback([15], 300, settings.soundEffects);
    setComposedSentence(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    triggerHapticFeedback([20, 20], 250, settings.soundEffects);
    setComposedSentence('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(composedSentence);
    setCopied(true);
    triggerHapticFeedback([40], 500, settings.soundEffects);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    speakText(composedSentence, undefined, settings.speechVoiceRate, settings.speechVoicePitch);
  };

  // Filter items by selected finger if filter is active
  const filterByFinger = (items: SignGestureItem[]) => {
    if (activeFingerFilter === 'all') return items;
    return items.filter(item => {
      const prof = getFingerProfileForSign(item.name);
      return prof.primaryFingers.includes(activeFingerFilter) || prof.activeFingers.includes(activeFingerFilter);
    });
  };

  const currentFingerProfile = getFingerProfileForSign(selectedKey.name);

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Category Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        
        {/* Category Pill Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
          <button
            onClick={() => {
              setActiveCategory('alphabet');
              setActiveFingerFilter('all');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'alphabet'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            A-Z Alphabet ({SIGN_ALPHABET.length})
          </button>
          <button
            onClick={() => {
              setActiveCategory('numbers');
              setActiveFingerFilter('all');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'numbers'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            0-9 Numbers (10)
          </button>
          <button
            onClick={() => {
              setActiveCategory('words');
              setActiveFingerFilter('all');
            }}
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

          {/* Finger Articulation Filter Bar */}
          <div className="bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <div className="flex items-center space-x-1.5 min-w-fit text-slate-500 dark:text-slate-400 font-bold text-[11px]">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>Highlight by Finger:</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveFingerFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  activeFingerFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Signs
              </button>

              {(['thumb', 'index', 'middle', 'ring', 'pinky'] as FingerKey[]).map(fKey => {
                const meta = FINGER_METADATA[fKey];
                const isActive = activeFingerFilter === fKey;
                return (
                  <button
                    key={fKey}
                    onClick={() => setActiveFingerFilter(fKey)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1 ${
                      isActive
                        ? `bg-gradient-to-r ${meta.color} text-white shadow-xs scale-105`
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Tiles Grid */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
            {activeCategory === 'alphabet' && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5">
                {filterByFinger(SIGN_ALPHABET).map((item) => {
                  const isSelected = selectedKey.id === item.id;
                  const isJustClicked = lastClickedKeyId === item.id;
                  const prof = getFingerProfileForSign(item.name);

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleKeyPress(item)}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all duration-150 group overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800'
                      } ${isJustClicked ? 'ring-4 ring-cyan-400/60 shadow-lg' : ''}`}
                    >
                      {/* Active Momentary Pulse Ripple */}
                      <AnimatePresence>
                        {isJustClicked && (
                          <motion.span
                            initial={{ scale: 0.2, opacity: 0.8 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="absolute inset-0 bg-cyan-400/25 rounded-2xl pointer-events-none"
                          />
                        )}
                      </AnimatePresence>

                      <span className="text-2xl font-black text-slate-900 dark:text-white tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </span>

                      {/* Finger Activation Micro-Badge Dots */}
                      <div className="flex items-center space-x-0.5 mt-1.5">
                        {(['thumb', 'index', 'middle', 'ring', 'pinky'] as FingerKey[]).map(fk => {
                          const isEngaged = prof.primaryFingers.includes(fk);
                          const meta = FINGER_METADATA[fk];
                          return (
                            <span
                              key={fk}
                              title={`${meta.name}: ${isEngaged ? 'Active' : 'Curled'}`}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                isEngaged
                                  ? `bg-gradient-to-tr ${meta.color} ring-1 ring-white dark:ring-slate-900 scale-125`
                                  : 'bg-slate-300 dark:bg-slate-700 opacity-40'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1 truncate max-w-full">
                        {item.handshape.split(' ')[0]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {activeCategory === 'numbers' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {filterByFinger(numbersData).map((item) => {
                  const isSelected = selectedKey.id === item.id;
                  const isJustClicked = lastClickedKeyId === item.id;
                  const prof = getFingerProfileForSign(item.name);

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleKeyPress(item)}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 dark:border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      } ${isJustClicked ? 'ring-4 ring-cyan-400/60 shadow-lg' : ''}`}
                    >
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {item.name}
                      </span>

                      {/* Micro finger dots */}
                      <div className="flex items-center space-x-1 mt-1.5">
                        {(['thumb', 'index', 'middle', 'ring', 'pinky'] as FingerKey[]).map(fk => {
                          const isEngaged = prof.primaryFingers.includes(fk);
                          const meta = FINGER_METADATA[fk];
                          return (
                            <span
                              key={fk}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                isEngaged
                                  ? `bg-gradient-to-tr ${meta.color} scale-125`
                                  : 'bg-slate-300 dark:bg-slate-700 opacity-40'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <span className="text-[10px] text-slate-400 font-semibold mt-1">
                        Digit {item.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {activeCategory === 'words' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {filterByFinger(COMMON_SIGNS).map((item) => {
                  const isSelected = selectedKey.id === item.id;
                  const isJustClicked = lastClickedKeyId === item.id;
                  const prof = getFingerProfileForSign(item.name);

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleKeyPress(item)}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative flex flex-col items-start p-3 rounded-2xl border-2 transition-all overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 dark:border-indigo-400 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      } ${isJustClicked ? 'ring-4 ring-cyan-400/60 shadow-lg' : ''}`}
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>

                      {/* Micro finger dots */}
                      <div className="flex items-center space-x-1 my-1">
                        {(['thumb', 'index', 'middle', 'ring', 'pinky'] as FingerKey[]).map(fk => {
                          const isEngaged = prof.primaryFingers.includes(fk);
                          const meta = FINGER_METADATA[fk];
                          return (
                            <span
                              key={fk}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isEngaged ? `bg-gradient-to-tr ${meta.color}` : 'bg-slate-300 dark:bg-slate-700 opacity-40'
                              }`}
                            />
                          );
                        })}
                      </div>

                      <span className="text-[10px] text-slate-400 capitalize">
                        {item.category}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Spacebar key */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-center">
              <button
                onClick={() => {
                  triggerHapticFeedback([20], 350, settings.soundEffects);
                  setComposedSentence(prev => `${prev} `);
                }}
                className="w-full max-w-md py-3 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>Space (Add Word Separation)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Selected Sign Detail, Visual Finger Lift Stage & Inspector */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Kinetic Finger Articulation Visualizer with Live Lift & Pulse */}
          <FingerActivationVisualizer
            currentSignName={selectedKey.name}
            selectedFingerFilter={activeFingerFilter === 'all' ? null : activeFingerFilter}
            onFingerSelect={(fKey) => setActiveFingerFilter(fKey)}
          />

          {/* Detailed Inspector Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {settings.primarySignLanguage} Gesture Specs
              </span>
              <button
                onClick={() => speakText(selectedKey.name)}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors"
                title="Hear Pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Big Character Box with Spring Physics Easing */}
            <motion.div 
              key={`inspect-box-${selectedKey.name}`}
              initial={{ scale: 0.94, opacity: 0.8 }}
              animate={{ scale: 1.0, opacity: 1.0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.75 }}
              className="relative w-full aspect-video max-h-[140px] rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-500/40 flex flex-col items-center justify-center p-3 shadow-xl mb-4 text-white overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
              <motion.span 
                key={`sign-letter-${selectedKey.name}`}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 450, damping: 26 }}
                className="text-5xl font-black text-cyan-300 tracking-wider relative z-10 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
              >
                {selectedKey.name}
              </motion.span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 relative z-10">
                {selectedKey.category} • {currentFingerProfile.movementType.toUpperCase()}
              </span>
            </motion.div>

            {/* Structural Parameters Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Handshape (Configuration)</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedKey.handshape}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Movement & Trajectory</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedKey.movement}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Kinetic Description</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedKey.description}</p>
              </div>
            </div>

            {/* Quick action: append to sentence */}
            <button
              onClick={() => handleKeyPress(selectedKey)}
              className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insert "{selectedKey.name}" into Sentence</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
