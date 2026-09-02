import { Database } from "lucide-react";

export const FirestoreERDTab = () => {
  return (
    <div className="space-y-6">
      {/* Visual Schema Hierarchy Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5 text-amber-900 dark:text-amber-200">
          <Database className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <div className="font-bold">Firestore NoSQL Document & Subcollection Architecture</div>
            <div className="text-amber-700 dark:text-amber-400 text-[11px]">
              HIPAA PII Data Isolation • Diarized Transcript Subcollections • Atomic Escrow Ledger
            </div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono text-[10px] font-bold w-fit">
          firestore.rules v2 Enforced
        </span>
      </div>

      {/* Visual Diagram Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Collection 1: users & subcollections */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold">
              <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-[10px] text-indigo-300">COLLECTION</span>
              <span>/users/{`{userId}`}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-sans font-bold">Auth Owner CRUD</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1">
            <div>• <span className="text-amber-300">userId:</span> string (Primary Key, Auth UID)</div>
            <div>• <span className="text-amber-300">name:</span> string</div>
            <div>• <span className="text-amber-300">role:</span> "user_deaf" | "user_hearing" | "interpreter"</div>
            <div>• <span className="text-amber-300">primaryLanguage:</span> "ASL" | "BSL" | "Auslan" | "IS"</div>
            <div>• <span className="text-amber-300">availableStatus:</span> "online" | "busy" | "offline"</div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nested Subcollections:</div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300">
              <span className="text-purple-400 font-bold">↳ /users/{`{userId}`}/private/settings</span>
              <div className="text-slate-400 mt-0.5">Isolated email, phone, Stripe customerId & custom audio prefs</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300">
              <span className="text-blue-400 font-bold">↳ /users/{`{userId}`}/notifications/{`{id}`}</span>
              <div className="text-slate-400 mt-0.5">Inbox notifications, booking confirmations & emergency alerts</div>
            </div>
          </div>
        </div>

        {/* Collection 2: interpreters */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[10px] text-emerald-300">COLLECTION</span>
              <span>/interpreters/{`{id}`}</span>
            </div>
            <span className="text-[10px] text-indigo-400 font-sans font-bold">Public Discoverable</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1">
            <div>• <span className="text-amber-300">interpreterId:</span> string (FK → users.userId)</div>
            <div>• <span className="text-amber-300">certifications:</span> string[] (RID NIC, SC:L, BEI)</div>
            <div>• <span className="text-amber-300">specialties:</span> ["Medical", "Legal", "Crisis"]</div>
            <div>• <span className="text-amber-300">ratePerHour:</span> number ($)</div>
            <div>• <span className="text-amber-300">ratePerMinute:</span> number ($/min for urgent)</div>
            <div>• <span className="text-amber-300">rating:</span> number (1.0 to 5.0)</div>
            <div>• <span className="text-amber-300">availableStatus:</span> "online" | "busy" | "offline"</div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nested Subcollections:</div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300">
              <span className="text-emerald-400 font-bold">↳ /interpreters/{`{id}`}/reviews/{`{reviewId}`}</span>
              <div className="text-slate-400 mt-0.5">Verified client reviews, ratings and session feedback</div>
            </div>
          </div>
        </div>

        {/* Collection 3: sessions & transcripts */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-purple-400 font-bold">
              <span className="px-1.5 py-0.5 rounded bg-purple-950 text-[10px] text-purple-300">COLLECTION</span>
              <span>/sessions/{`{sessionId}`}</span>
            </div>
            <span className="text-[10px] text-purple-400 font-sans font-bold">Participant Access</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1">
            <div>• <span className="text-amber-300">sessionId:</span> string (Primary Key)</div>
            <div>• <span className="text-amber-300">userId:</span> string (FK → users)</div>
            <div>• <span className="text-amber-300">interpreterId:</span> string | null (FK → interpreters)</div>
            <div>• <span className="text-amber-300">type:</span> "on_demand" | "scheduled" | "ai_solo"</div>
            <div>• <span className="text-amber-300">status:</span> "in_progress" | "completed"</div>
            <div>• <span className="text-amber-300">durationMinutes:</span> number</div>
            <div>• <span className="text-amber-300">complianceHash:</span> string (SHA-256)</div>
            <div>• <span className="text-amber-300">summary:</span> string (Gemini 2.5 synthesis)</div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nested Subcollections:</div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300">
              <span className="text-purple-400 font-bold">↳ /sessions/{`{id}`}/transcript/{`{entryId}`}</span>
              <div className="text-slate-400 mt-0.5">Diarized turns: speaker, text, timestamp, confidence, handshape</div>
            </div>
          </div>
        </div>

        {/* Collection 4: dispatchQueue & transactions */}
        <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-rose-400 font-bold">
              <span className="px-1.5 py-0.5 rounded bg-rose-950 text-[10px] text-rose-300">COLLECTIONS</span>
              <span>/dispatchQueue & /transactions</span>
            </div>
            <span className="text-[10px] text-rose-400 font-sans font-bold">Ephemeral & Ledger</span>
          </div>
          
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300 space-y-1">
            <span className="text-rose-400 font-bold block">/dispatchQueue/{`{dispatchId}`} (30s Triage)</span>
            <div>• <span className="text-amber-300">urgency:</span> "emergency" | "urgent" | "normal"</div>
            <div>• <span className="text-amber-300">status:</span> "searching" | "offered" | "accepted"</div>
            <div>• <span className="text-amber-300">offerExpiresAt:</span> timestamp (Auto-cascade)</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300 space-y-1">
            <span className="text-amber-400 font-bold block">/transactions/{`{transactionId}`} (Escrow)</span>
            <div>• <span className="text-amber-300">amount:</span> number ($) | <span className="text-amber-300">currency:</span> "USD"</div>
            <div>• <span className="text-amber-300">type:</span> "escrow_hold" | "instant_payout"</div>
            <div>• <span className="text-amber-300">status:</span> "held" | "settled" | "released"</div>
          </div>
        </div>
      </div>

      {/* Relationships & Entity Mapping Flow */}
      <div className="p-5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Relational Foreign Key (FK) Data Flow:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-indigo-400 font-bold block">users.userId</span>
            <span className="text-slate-500 text-[10px]">1 : 1 ⬌</span>
            <span className="text-emerald-400 font-bold block">interpreters.interpreterId</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-indigo-400 font-bold block">users.userId</span>
            <span className="text-slate-500 text-[10px]">1 : N ⬌</span>
            <span className="text-purple-400 font-bold block">sessions.userId</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-purple-400 font-bold block">sessions.sessionId</span>
            <span className="text-slate-500 text-[10px]">1 : N ⬌</span>
            <span className="text-amber-400 font-bold block">transactions.sessionId</span>
          </div>
        </div>
      </div>
    </div>
  );
};
