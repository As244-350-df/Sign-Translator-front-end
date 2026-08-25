import React, { useState } from 'react';
import { X, Download, FileArchive, CheckCircle2, Sparkles, FolderArchive, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateProjectZip, downloadBlob } from '../utils/zipExporter';

interface ExportZipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportZipModal: React.FC<ExportZipModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsGenerating(true);
    setProgress(10);
    setCurrentFile('Preparing SignLink repository...');

    try {
      const zipBlob = await generateProjectZip((pct, filename) => {
        setProgress(pct);
        setCurrentFile(filename);
      });

      downloadBlob(zipBlob, 'signlink-sign-language-interpreter-project.zip');
      setDownloadSuccess(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Failed to export zip archive:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <FolderArchive className="w-8 h-8" />
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          Export Project Code as ZIP
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Download the complete standalone React application, TypeScript source code, Tailwind styles, and data models in a single compressed archive.
        </p>

        {/* Included Files Checklist */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 text-left space-y-2 mb-5">
          <span className="font-bold text-slate-900 dark:text-white block mb-1 text-[11px] uppercase tracking-wider">
            Archive Contents:
          </span>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full React 19 + TypeScript + Vite project files</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>AI Landmark Hand Tracking & Live Video Suite</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Interactive Virtual Sign Language Keyboard</span>
            </div>
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Interpreter Directory, Booking, & Transcripts</span>
            </div>
          </div>
        </div>

        {/* Progress Bar (if generating) */}
        {isGenerating && (
          <div className="mb-4 text-left">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>{currentFile}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Download Action Button */}
        <button
          onClick={handleExport}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Bundling ZIP ({progress}%)...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Downloaded! Click to Download Again</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate & Download ZIP Archive</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
