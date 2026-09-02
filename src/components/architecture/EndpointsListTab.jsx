export const EndpointsListTab = () => {
  const endpoints = [
    { method: "GET", path: "/api/health", desc: "Heartbeat, server uptime, and Gemini API readiness", status: "200 OK" },
    { method: "GET", path: "/api/interpreters", desc: "Query certified interpreters with dialect & specialty filters", status: "200 OK" },
    { method: "POST", path: "/api/interpreters/match-ondemand", desc: "Instant match dispatch queue with 30s cascade", status: "200 OK" },
    { method: "GET / POST", path: "/api/bookings", desc: "Create and retrieve scheduled interpretation appointments", status: "200 OK" },
    { method: "GET / POST", path: "/api/sessions", desc: "Save and retrieve encrypted dialog transcripts & ratings", status: "200 OK" },
    { method: "POST", path: "/api/ai/summarize-session", desc: "Gemini 2.5 transcript summarization & clinical action items", status: "200 OK" },
    { method: "POST", path: "/api/ai/translate-sequence", desc: "Convert continuous sign glosses into fluent English sentences", status: "200 OK" }
  ];

  return (
    <div className="space-y-3">
      {endpoints.map((ep, idx) => (
        <div
          key={idx}
          className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono text-xs"
        >
          <div className="flex items-center space-x-3">
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                ep.method.includes("POST")
                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                  : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
              }`}
            >
              {ep.method}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{ep.path}</span>
          </div>
          <div className="hidden sm:flex items-center space-x-3 text-[11px] text-slate-500 font-sans">
            <span>{ep.desc}</span>
            <span className="text-emerald-500 font-mono font-bold">{ep.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
