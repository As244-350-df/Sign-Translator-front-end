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
  CheckCircle2
} from 'lucide-react';
import { AppSettings, SignLanguageCode } from '../types';
import { SIGN_LANGUAGES } from '../data/mockData';
import { speakText } from '../utils/speech';

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
