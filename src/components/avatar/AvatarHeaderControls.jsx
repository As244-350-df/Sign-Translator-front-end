import {
  Sparkles,
  User,
  Sliders,
  Activity,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Check
} from "lucide-react";

export const AvatarHeaderControls = ({
  primarySignLanguage,
  avatarTheme,
  avatarModel,
  onSelectAvatarModel,
  cameraAngle,
  onCycleCameraAngle,
  showSkeletalOverlay,
  onToggleSkeletalOverlay,
  isAudioSyncEnabled,
  onToggleAudioSync,
  isFullscreen,
  onToggleFullscreen
}) => {
  return (
    <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent backdrop-blur-xs">
      {/* Left Status & Sign Language Badge */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-slate-200">AI SIGN AVATAR</span>
          <span className="text-slate-600">|</span>
          <span className={`text-[11px] font-bold ${avatarTheme.hudAccent}`}>
            {primarySignLanguage}
          </span>
        </div>

        <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-bold text-indigo-200">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>{avatarTheme.badge}</span>
        </div>
      </div>

      {/* Right HUD Controls: Model Switcher & Camera Angle */}
      <div className="flex items-center space-x-1.5">
        {/* Avatar Model Selector Dropdown */}
        <div className="relative group">
          <button
            className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-md"
            title="Switch Sign Avatar Persona"
          >
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="capitalize">{avatarModel}</span>
          </button>
          <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl p-1 hidden group-hover:block z-30 animate-in fade-in">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 block">
              Avatar Persona
            </span>
            {[
              { id: "maya", name: "Maya (ASL Pro)", icon: "👩‍💼" },
              { id: "nova", name: "Nova (Cyber AI)", icon: "🤖" },
              { id: "kai", name: "Kai (Casual 3D)", icon: "🧑" },
              { id: "skeletal", name: "Biomechanical", icon: "⚡" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectAvatarModel(m.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  avatarModel === m.id
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>{m.icon}</span>
                  <span>{m.name}</span>
                </span>
                {avatarModel === m.id && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* Camera View Angle Selector */}
        <button
          onClick={onCycleCameraAngle}
          className="px-2 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-semibold text-slate-300 flex items-center space-x-1 transition-colors cursor-pointer"
          title="Switch Camera View: Front / Angled / Hands Zoom"
        >
          <Sliders className="w-3 h-3 text-cyan-400" />
          <span className="capitalize">{cameraAngle.replace("_", " ")}</span>
        </button>

        {/* 3D Skeletal Mesh Overlay Toggle */}
        <button
          onClick={onToggleSkeletalOverlay}
          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
            showSkeletalOverlay
              ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
              : "bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white"
          }`}
          title="Toggle 21-Node Skeletal Landmark Overlay"
        >
          <Activity className="w-3.5 h-3.5" />
        </button>

        {/* Audio Vocalizer Sync Toggle */}
        <button
          onClick={onToggleAudioSync}
          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
            isAudioSyncEnabled
              ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
              : "bg-slate-900/90 border-slate-700/80 text-slate-500 hover:text-white"
          }`}
          title={isAudioSyncEnabled ? "Audio Vocalization Active" : "Audio Vocalization Muted"}
        >
          {isAudioSyncEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Theatre View"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
