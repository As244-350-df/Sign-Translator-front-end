import { Copy, Check } from "lucide-react";

export const RawJsonTab = ({ diagnosticJson, onCopyReport, copied }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Full system diagnostic snapshot for technical troubleshooting:
        </span>
        <button
          onClick={onCopyReport}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-300" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copied ? "Copied to Clipboard!" : "Copy Diagnostic Report"}</span>
        </button>
      </div>

      <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72">
        {diagnosticJson}
      </pre>
    </div>
  );
};
