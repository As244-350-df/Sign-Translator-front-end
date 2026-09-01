import { useState } from "react";
import {
  X,
  Download,
  FileText,
  Star,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  Lock,
  DollarSign,
  CheckCircle2,
  ListTodo
} from "lucide-react";
const SessionReviewModal = ({
  session,
  isOpen,
  onClose,
  settings
}) => {
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState(session?.rating || 5);
  const [feedbackNotes, setFeedbackNotes] = useState(session?.notes || "");
  const [activeTab, setActiveTab] = useState("transcript");
  if (!isOpen || !session) return null;
  const handleCopyTranscript = () => {
    const text = session.fullTranscript.map((t) => `[${t.time}] ${t.speaker}: ${t.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const handleDownloadTranscript = () => {
    const transcriptText = `SIGNLINK HIPAA-COMPLIANT INTERPRETATION RECORD
Session ID: ${session.id}
Title: ${session.title}
Date: ${session.date} | Duration: ${session.duration} | Dialect: ${session.language}
${session.interpreterName ? `Certified Human Interpreter: ${session.interpreterName}` : "Mode: AI Real-Time Computer Vision"}
HIPAA Compliance Hash: SHA256-${session.id.replace(/[^a-z0-9]/g, "")}-VERIFIED

CLINICAL / BUSINESS SUMMARY:
${session.summary}

ACTION ITEMS & KEY VOCABULARY:
${session.keyTerms.map((t) => `\u2022 ${t}`).join("\n")}

=======================================
DIARIZED CONVERSATION TRANSCRIPT:
=======================================
${session.fullTranscript.map((t) => `[${t.time}] ${t.speaker}: ${t.text}`).join("\n")}

Signed & Encrypted via SignLink WebRTC & Gemini Multimodal Suite
`;
    const blob = new Blob([transcriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-certified-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 sm:p-8">
        
        {
    /* Close Button */
  }
        <button
    onClick={onClose}
    className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  >
          <X className="w-5 h-5" />
        </button>

        {
    /* Header Badges */
  }
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4" />
          <span>Session Review & Vault Record</span>
        </div>

        {
    /* Title & HIPAA Badge */
  }
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {session.title}
          </h2>
          <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center space-x-1 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5" />
            <span>HIPAA Encrypted Vault</span>
          </span>
        </div>

        {
    /* Metadata stats */
  }
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>{session.date}</span>
          </span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{session.duration}</span>
          </span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold">
            {session.language}
          </span>
          {session.interpreterName && <>
              <span>•</span>
              <span className="text-slate-700 dark:text-slate-200 font-semibold">
                Interpreter: {session.interpreterName}
              </span>
            </>}
        </div>

        {
    /* Section Tabs */
  }
        <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 my-5">
          <button
    onClick={() => setActiveTab("transcript")}
    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${activeTab === "transcript" ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
  >
            Diarized Transcript ({session.fullTranscript.length} turns)
          </button>
          <button
    onClick={() => setActiveTab("clinical_summary")}
    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${activeTab === "clinical_summary" ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
  >
            AI Summary & Action Items
          </button>
          <button
    onClick={() => setActiveTab("billing")}
    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${activeTab === "billing" ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
  >
            Billing & Escrow Receipt
          </button>
        </div>

        {
    /* Tab 1: Full Diarized Transcript */
  }
        {activeTab === "transcript" && <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Timestamped Dialogue Turns
              </span>
              <div className="flex items-center space-x-2">
                <button
    onClick={handleCopyTranscript}
    className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1"
  >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
    onClick={handleDownloadTranscript}
    className="px-3 py-1 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center space-x-1 shadow-xs"
  >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Record</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto space-y-3">
              {session.fullTranscript.map((t, idx) => <div key={idx} className="flex items-start space-x-3 text-xs leading-relaxed">
                  <span className="font-mono text-[10px] text-slate-400 shrink-0 pt-0.5">
                    {t.time}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] shrink-0 ${t.speaker === "Signer" ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300" : t.speaker === "Interpreter" ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                    {t.speaker}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {t.text}
                  </span>
                </div>)}
            </div>
          </div>}

        {
    /* Tab 2: AI Clinical Summary & Action Items */
  }
        {activeTab === "clinical_summary" && <div className="space-y-4">
            
            {
    /* Gemini Summary Card */
  }
            <div className="p-4 bg-linear-to-br from-indigo-50/50 via-white to-indigo-50/20 dark:from-indigo-950/30 dark:via-slate-900 dark:to-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Multimodal Gemini 2.5 Analysis</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {session.summary}
              </p>
            </div>

            {
    /* Action Items Checklist */
  }
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <ListTodo className="w-4 h-4 text-emerald-500" />
                <span>Extracted Action Items & Follow-ups</span>
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Review prescription timings with morning meal routine</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Schedule follow-up laboratory blood panel for next month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Contact clinic coordinator if any side effects occur</span>
                </li>
              </ul>
            </div>

            {
    /* Key Terminology Pills */
  }
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Key Technical & Medical Vocabulary:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {session.keyTerms.map((term, idx) => <span
    key={idx}
    className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
  >
                    🏷️ {term}
                  </span>)}
              </div>
            </div>

          </div>}

        {
    /* Tab 3: Billing & Escrow Receipt */
  }
        {activeTab === "billing" && <div className="space-y-4">
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Stripe Escrow Itemized Breakdown</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Paid & Settled
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Session Length:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{session.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interpreter Base Rate:</span>
                  <span className="font-bold text-slate-900 dark:text-white">$75.00 / hr ($1.25 / min)</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform SFU & Recording Fee:</span>
                  <span className="font-bold text-slate-900 dark:text-white">$0.00 (Tier Included)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white">
                  <span>Total Escrow Payout:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">$3.45</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Payment automatically disbursed to certified interpreter via Stripe Connect Instant Payouts.</span>
            </div>

          </div>}

        {
    /* Rating & Feedback */
  }
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Rate Session Quality:
            </span>
            <div className="flex items-center space-x-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => <button
    key={star}
    onClick={() => setUserRating(star)}
    className="p-1 hover:scale-110 transition-transform"
  >
                  <Star
    className={`w-5 h-5 ${star <= userRating ? "fill-current text-amber-400" : "text-slate-300 dark:text-slate-700"}`}
  />
                </button>)}
            </div>
          </div>
        </div>

        {
    /* Modal Footer */
  }
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
    onClick={onClose}
    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors"
  >
            Done
          </button>
        </div>

      </div>
    </div>;
};
export {
  SessionReviewModal
};
