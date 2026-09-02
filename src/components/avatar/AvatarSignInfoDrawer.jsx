import { motion, AnimatePresence } from "motion/react";

export const AvatarSignInfoDrawer = ({ isOpen, activePose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-slate-900/95 border-t border-slate-800 p-3 sm:p-4 z-20 overflow-hidden text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Handshape & Articulation
              </span>
              <p className="font-semibold text-slate-200 line-clamp-2">
                {activePose.handshapeDescription}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Spatial Movement Path
              </span>
              <p className="font-semibold text-slate-200 line-clamp-2">
                {activePose.movementDescription}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Grammar & Non-Manual Marker
              </span>
              <p className="font-semibold text-slate-200 line-clamp-2">
                {activePose.facialDescription}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
