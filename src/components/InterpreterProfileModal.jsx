import { useState } from "react";
import {
  X,
  Star,
  ShieldCheck,
  Award,
  Video,
  Calendar,
  CheckCircle2
} from "lucide-react";
const InterpreterProfileModal = ({
  interpreter,
  isOpen,
  onClose,
  onStartCall,
  onBookSlot,
  settings
}) => {
  const [selectedSlot, setSelectedSlot] = useState("");
  if (!isOpen || !interpreter) return null;
  const isOnline = interpreter.availableStatus === "online";
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {
    /* Close Button */
  }
        <button
    onClick={onClose}
    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md"
  >
          <X className="w-5 h-5" />
        </button>

        {
    /* Cover Photo Header */
  }
        <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
          <img
    src={interpreter.coverImage || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"}
    alt="Cover header"
    className="w-full h-full object-cover"
  />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
        </div>

        {
    /* Profile Details Container */
  }
        <div className="p-6 sm:p-8 pt-0 relative">
          
          {
    /* Avatar & Floating Header Bar */
  }
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 mb-6">
            <div className="relative">
              <img
    src={interpreter.avatar}
    alt={interpreter.name}
    className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl"
  />
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-900 ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
            </div>

            <div className="flex items-center space-x-2">
              {isOnline && <button
    onClick={() => {
      onStartCall(interpreter.id);
      onClose();
    }}
    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all"
  >
                  <Video className="w-4 h-4" />
                  <span>Start Instant Video Call</span>
                </button>}
            </div>
          </div>

          {
    /* Name & Credentials */
  }
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {interpreter.name}
              </h2>
              {interpreter.verified && <span className="p-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-500">
                  <ShieldCheck className="w-5 h-5" />
                </span>}
            </div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {interpreter.title}
            </p>
          </div>

          {
    /* Ratings & Key Stats Bar */
  }
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
              <div className="flex items-center justify-center space-x-1 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{interpreter.rating}</span>
              </div>
              <span className="text-[10px] text-slate-400">({interpreter.reviewsCount} Reviews)</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                {interpreter.experienceYears} Years
              </span>
              <span className="text-[10px] text-slate-400">Experience</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">
                {interpreter.completedSessions}+
              </span>
              <span className="text-[10px] text-slate-400">Completed Calls</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-center">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm block">
                ${interpreter.ratePerHour}
              </span>
              <span className="text-[10px] text-slate-400">per hour</span>
            </div>
          </div>

          {
    /* Bio Description */
  }
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>{interpreter.bio}</p>
          </div>

          {
    /* Verified Certifications */
  }
          <div className="my-6">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-indigo-500" />
              <span>Verified Accreditations & Licenses</span>
            </h3>
            <div className="space-y-1.5">
              {interpreter.certifications.map((cert, idx) => <div
    key={idx}
    className="flex items-center space-x-2 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-300 font-medium"
  >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{cert}</span>
                </div>)}
            </div>
          </div>

          {
    /* Specialties */
  }
          <div className="my-6">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
              Domain Specialties
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {interpreter.specialties.map((spec, i) => <span
    key={i}
    className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
  >
                  {spec}
                </span>)}
            </div>
          </div>

          {
    /* Bookable Time Slots */
  }
          <div className="my-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Schedule Next Appointment</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Select an available time slot below to confirm a scheduled interpretation session:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {interpreter.availableSlots.map((slot) => {
    const isSelected = selectedSlot === slot;
    return <button
      key={slot}
      onClick={() => setSelectedSlot(slot)}
      className={`p-2.5 rounded-xl text-xs font-bold transition-all ${isSelected ? "bg-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-indigo-400"}`}
    >
                    {slot}
                  </button>;
  })}
            </div>

            {selectedSlot && <button
    onClick={() => {
      onBookSlot(interpreter, selectedSlot);
      onClose();
    }}
    className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/25"
  >
                Confirm Appointment for {selectedSlot} (${interpreter.ratePerHour}/hr)
              </button>}
          </div>

        </div>

      </div>
    </div>;
};
export {
  InterpreterProfileModal
};
