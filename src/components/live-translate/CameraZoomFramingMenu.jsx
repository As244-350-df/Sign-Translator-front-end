import {
  ZoomIn,
  ZoomOut,
  Target,
  Sliders,
  Focus,
  Move,
  Crosshair,
  RotateCcw,
  ChevronDown
} from "lucide-react";

export const CameraZoomFramingMenu = ({
  cameraZoom,
  cameraPan,
  calibrationScale,
  isAutoCentering,
  showAlignmentGuide,
  showZoomMenu,
  onToggleAutoCenter,
  onZoomIn,
  onZoomOut,
  onSetZoom,
  onResetZoom,
  onPanNudge,
  onSetCalibrationScale,
  onToggleAlignmentGuide,
  onToggleZoomMenu
}) => {
  const zoomPresets = [
    { label: "1.0x Fit", val: 1 },
    { label: "1.25x", val: 1.25 },
    { label: "1.5x Opt", val: 1.5 },
    { label: "1.75x", val: 1.75 },
    { label: "2.0x Close", val: 2 },
    { label: "2.5x", val: 2.5 },
    { label: "3.0x Macro", val: 3 },
    { label: "3.5x Max", val: 3.5 }
  ];

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2">
      {/* Compact Glass Zoom Pill Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center space-x-1.5">
        {/* Auto-Centering Quick Toggle */}
        <button
          onClick={onToggleAutoCenter}
          className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
            isAutoCentering
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md shadow-emerald-500/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
          title="Toggle Computer Vision Hand Auto-Centering & Smart Framing"
        >
          <Crosshair className={`w-3.5 h-3.5 ${isAutoCentering ? "text-emerald-100" : ""}`} />
          <span className="text-[10px] font-bold pr-0.5">{isAutoCentering ? "Auto ON" : "Auto"}</span>
        </button>

        {/* Zoom Out Button */}
        <button
          onClick={onZoomOut}
          disabled={cameraZoom <= 1 || isAutoCentering}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
          title="Zoom Out (Reduce camera crop)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Level Indicator / Popover Toggle */}
        <button
          onClick={onToggleZoomMenu}
          className="px-2.5 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 text-xs font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
          title="Click to open Zoom Presets & Hand Calibration"
        >
          <Focus className="w-3 h-3" />
          <span>{cameraZoom.toFixed(2)}x</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showZoomMenu ? "rotate-180" : ""}`} />
        </button>

        {/* Zoom In Button */}
        <button
          onClick={onZoomIn}
          disabled={cameraZoom >= 3.5 || isAutoCentering}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer"
          title="Zoom In (Enlarge hand & fingers for precise tracking)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Reset 1.0x (if zoomed or panned) */}
        {(cameraZoom > 1 || cameraPan.x !== 0 || cameraPan.y !== 0) && !isAutoCentering && (
          <button
            onClick={onResetZoom}
            className="px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-colors cursor-pointer"
            title="Reset to 1.0x Default Fit"
          >
            1.0x
          </button>
        )}

        {/* Hand Alignment Guide Toggle */}
        <button
          onClick={onToggleAlignmentGuide}
          className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
            showAlignmentGuide
              ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
          title="Toggle Hand Alignment Guide & Sweet-spot Reticle"
        >
          <Target className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold pr-0.5">{showAlignmentGuide ? "Guide ON" : "Align"}</span>
        </button>
      </div>

      {/* Precision Zoom & Framing Popover Drawer */}
      {showZoomMenu && (
        <div className="w-80 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/90 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Camera Zoom & Framing</span>
            </span>
            <button
              onClick={onResetZoom}
              className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Auto-Centering Toggle Card */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              isAutoCentering
                ? "bg-emerald-950/40 border-emerald-500/50"
                : "bg-slate-800/60 border-slate-700/60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Crosshair className={`w-4 h-4 ${isAutoCentering ? "text-emerald-400" : "text-slate-400"}`} />
                <div>
                  <span className="font-bold text-white block">Auto-Center Hand (CV)</span>
                  <span className="text-[10px] text-slate-400">Automatic optical hand tracking</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAutoCentering}
                onChange={onToggleAutoCenter}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
              />
            </div>

            {isAutoCentering && (
              <div className="mt-2 pt-2 border-t border-emerald-900/60 flex items-center justify-between text-[11px]">
                <span className="text-emerald-300 font-mono flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Auto Tracking Hand</span>
                </span>
                <span className="text-slate-300 font-mono">
                  Zoom: <strong className="text-emerald-400">{cameraZoom.toFixed(2)}x</strong>
                </span>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className={isAutoCentering ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
              Quick Zoom Presets {isAutoCentering && "(Disabled while Auto-Center is ON)"}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {zoomPresets.map((preset) => (
                <button
                  key={preset.val}
                  onClick={() => onSetZoom(preset.val)}
                  disabled={isAutoCentering}
                  className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    Math.abs(cameraZoom - preset.val) < 0.05
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Continuous Zoom Slider */}
          <div className={`space-y-1 ${isAutoCentering ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Magnification</span>
              <span className="font-mono text-indigo-400 font-bold">{cameraZoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.5"
              step="0.05"
              value={cameraZoom}
              disabled={isAutoCentering}
              onChange={(e) => onSetZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Finger Span Calibration Scale */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Skeletal Hand Span Scale</span>
              <span className="font-mono text-emerald-400 font-bold">
                {Math.round(calibrationScale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.35"
              step="0.05"
              value={calibrationScale}
              onChange={(e) => onSetCalibrationScale(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Fine-tune finger length mapping to align precisely with your fingers.
            </p>
          </div>

          {/* Camera Framing Pan D-Pad */}
          {cameraZoom > 1.05 && (
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center space-x-1">
                <Move className="w-3 h-3 text-slate-400" />
                <span>Nudge Camera Frame Offset</span>
              </label>
              <div className="flex items-center justify-center">
                <div className="grid grid-cols-3 gap-1 w-28 text-center">
                  <div />
                  <button
                    onClick={() => onPanNudge(0, -0.15)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
                    title="Pan Up"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    onClick={() => onPanNudge(-0.15, 0)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
                    title="Pan Left"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => onPanNudge(0, 0, true)}
                    className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 rounded text-indigo-300 font-bold text-[9px] cursor-pointer"
                    title="Center View"
                  >
                    •
                  </button>
                  <button
                    onClick={() => onPanNudge(0.15, 0)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
                    title="Pan Right"
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    onClick={() => onPanNudge(0, 0.15)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 cursor-pointer"
                    title="Pan Down"
                  >
                    ▼
                  </button>
                  <div />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
