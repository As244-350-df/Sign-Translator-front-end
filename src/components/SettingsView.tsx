import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Languages, 
  Volume2, 
  Sliders, 
  Moon, 
  Sun, 
  Camera, 
  Eye, 
  ShieldCheck, 
  RotateCcw, 
  Check, 
  Sparkles,
  Smartphone,
  CheckCircle2,
  Crosshair,
  Focus,
  Zap,
  Activity,
  Brain,
  Cpu,
  Database
} from 'lucide-react';
import { AppSettings, SignLanguageCode, HandPhysicsConfig } from '../types';
import { SIGN_LANGUAGES } from '../data/mockData';
import { speakText } from '../utils/speech';
import { PHYSICS_PRESETS } from '../utils/handTracker';
import { tfjsClassifier } from '../utils/tfjsModel';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenErrorModal: (type: 'camera' | 'connection' | 'maintenance') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenErrorModal
}) => {
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestSpeech = () => {
    speakText('Hello! This is a test of the SignLink text-to-speech engine.', settings.speechVoiceRate, settings.speechVoicePitch);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Application Settings & Preferences
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize sign language dialects, visual contrast, vocalization speed, and hardware tracking sensitivity.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 animate-in fade-in shadow-xs">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </div>
        )}
      </div>

      {/* Language Dialect Preferences */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Languages className="w-5 h-5 text-indigo-500" />
          <span>Primary Sign Language Dialect</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose the standard sign language dialect used for AI landmark classification and interpreter matching.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {SIGN_LANGUAGES.map((lang) => {
            const isSelected = settings.primarySignLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  onUpdateSettings({ primarySignLanguage: lang.code });
                  handleSave();
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl">{lang.flag}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{lang.name}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{lang.region} • {lang.alphabetType}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice & Speech Synthesis Controls */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-indigo-500" />
          <span>Text-to-Speech Vocalization & Audio</span>
        </h2>

        {/* Auto Speak Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-white block">Auto-Vocalize Translated Signs</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Speak translated sentences aloud automatically using speech synthesis</span>
          </div>
          <input
            type="checkbox"
            checked={settings.autoSpeakTranslation}
            onChange={(e) => {
              onUpdateSettings({ autoSpeakTranslation: e.target.checked });
              handleSave();
            }}
            className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Sliders for Rate & Pitch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Speech Speed Rate</span>
              <span>{settings.speechVoiceRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.1"
              value={settings.speechVoiceRate}
              onChange={(e) => onUpdateSettings({ speechVoiceRate: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Voice Pitch</span>
              <span>{settings.speechVoicePitch}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.1"
              value={settings.speechVoicePitch}
              onChange={(e) => onUpdateSettings({ speechVoicePitch: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={handleTestSpeech}
          className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center space-x-1.5"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Play Voice Sample</span>
        </button>
      </div>

      {/* Accessibility & Visual Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Eye className="w-5 h-5 text-indigo-500" />
          <span>Accessibility & Contrast Display</span>
        </h2>

        {/* High Contrast Captions */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-white block">High-Contrast Amber Subtitles</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Renders high-visibility amber text on pitch-black background for low-vision signers</span>
          </div>
          <input
            type="checkbox"
            checked={settings.highContrastCaptions}
            onChange={(e) => {
              onUpdateSettings({ highContrastCaptions: e.target.checked });
              handleSave();
            }}
            className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* AI Gesture Tracking Mesh */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-white block">Display 21-Point Hand Skeleton Mesh</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Show holographic joints, bones, and bounding box confidence in camera view</span>
          </div>
          <input
            type="checkbox"
            checked={settings.gestureTrackingOverlay}
            onChange={(e) => {
              onUpdateSettings({ gestureTrackingOverlay: e.target.checked });
              handleSave();
            }}
            className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* CV Hand Auto-Centering & Dynamic Framing */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-indigo-500/20 dark:border-indigo-500/30">
          <div className="pr-4">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Auto-Center Hand (Computer Vision)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                SMART FRAMING
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
              Uses computer vision to detect the hand in real-time and automatically adjusts camera zoom and pan cropping to keep fingers centered for maximum recognition accuracy.
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.autoCenterCamera ?? false}
            onChange={(e) => {
              onUpdateSettings({ autoCenterCamera: e.target.checked });
              handleSave();
            }}
            className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Biomechanical Hand Physics Engine Settings */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <span>Biomechanical Hand Physics Engine</span>
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono font-bold">
            2ND-ORDER KINETICS
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Simulates anatomical joint inertia, tissue damping, spring recoil, and inter-tendon tension coupling for ultra-natural finger movement.
        </p>

        {/* Physics Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          {(['biological', 'snappy', 'fluid', 'precision'] as const).map((preset) => {
            const currentPreset = settings.handPhysics?.preset || 'biological';
            const isSel = currentPreset === preset;
            const labels: Record<string, { title: string; icon: string; desc: string }> = {
              biological: { title: 'Biological Realism', icon: '🧬', desc: 'Anatomical tendon lag & tissue resistance' },
              snappy: { title: 'Snappy Spring', icon: '⚡', desc: 'High frequency & instant rebound' },
              fluid: 'fluid' === preset ? { title: 'Fluid Organic', icon: '🌊', desc: 'Viscous damping & smooth arcs' } : { title: '', icon: '', desc: '' },
              precision: { title: 'Precision Studio', icon: '🦾', desc: 'Zero lag & high stiffness' }
            };
            const item = labels[preset] || { title: preset, icon: '⚙️', desc: '' };

            return (
              <button
                key={preset}
                onClick={() => {
                  const presetValues = PHYSICS_PRESETS[preset] || {};
                  onUpdateSettings({
                    handPhysics: {
                      ...(settings.handPhysics || {
                        enabled: true,
                        preset: 'biological',
                        stiffness: 1.15,
                        damping: 0.72,
                        tendonCoupling: 0.35,
                        massInertia: 0.40,
                        softCollision: true,
                        volumetric3D: true,
                        oneEuroFilter: true
                      }),
                      ...presetValues,
                      preset
                    }
                  });
                  handleSave();
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSel
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <span>{item.icon}</span>
                  <span>{item.title}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* 3D Volumetric and Soft Collision Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">3D Perspective Foreshortening</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Volumetric joint depth and bone cylinder lighting</span>
            </div>
            <input
              type="checkbox"
              checked={settings.handPhysics?.volumetric3D ?? true}
              onChange={(e) => {
                onUpdateSettings({
                  handPhysics: {
                    ...(settings.handPhysics || {
                      enabled: true,
                      preset: 'biological',
                      stiffness: 1.15,
                      damping: 0.72,
                      tendonCoupling: 0.35,
                      massInertia: 0.40,
                      softCollision: true,
                      volumetric3D: true,
                      oneEuroFilter: true
                    }),
                    volumetric3D: e.target.checked
                  }
                });
                handleSave();
              }}
              className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">Soft Fingertip Contact Physics</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Prevents mesh clipping during tight hand clasps</span>
            </div>
            <input
              type="checkbox"
              checked={settings.handPhysics?.softCollision ?? true}
              onChange={(e) => {
                onUpdateSettings({
                  handPhysics: {
                    ...(settings.handPhysics || {
                      enabled: true,
                      preset: 'biological',
                      stiffness: 1.15,
                      damping: 0.72,
                      tendonCoupling: 0.35,
                      massInertia: 0.40,
                      softCollision: true,
                      volumetric3D: true,
                      oneEuroFilter: true
                    }),
                    softCollision: e.target.checked
                  }
                });
                handleSave();
              }}
              className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* TensorFlow.js Pure JavaScript Neural Engine */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              TensorFlow.js (Pure JavaScript) Neural Engine
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-mono font-bold border border-amber-300 dark:border-amber-700">
              @tensorflow/tfjs
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Client-side deep learning running 100% in pure JavaScript/WebGL within your browser sandbox. Features on-device transfer learning, zero cloud API latency, and privacy-preserving landmark inference.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>WebGL GPU Backend</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Uses hardware shaders for sub-2ms tensor matrix multiplication.
              </p>
            </div>
            <button
              onClick={async () => {
                await tfjsClassifier.setBackend('webgl');
                handleSave();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Select WebGL
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Pure JS CPU Backend</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Zero GPU dependencies, pure ECMAScript execution fallback.
              </p>
            </div>
            <button
              onClick={async () => {
                await tfjsClassifier.setBackend('cpu');
                handleSave();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Select CPU
            </button>
          </div>
        </div>
      </div>

      {/* System Diagnostics & Error Screen Previews */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <span>System Diagnostics & Error Screen Previews</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Test and preview the built-in system error modals and camera/mic access fallback dialogs designed for this applet.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => onOpenErrorModal('camera')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
          >
            Preview: Camera / Mic Permission Modal
          </button>
          <button
            onClick={() => onOpenErrorModal('connection')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
          >
            Preview: Connection Drop Modal
          </button>
          <button
            onClick={() => onOpenErrorModal('maintenance')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
          >
            Preview: Maintenance State View
          </button>
        </div>
      </div>

    </div>
  );
};
