import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  Trash2,
  RotateCw
} from "lucide-react";
import { api } from "../utils/api";
const ScheduleView = ({
  settings,
  onJoinCall,
  onOpenDirectory
}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("upcoming");
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setBookings(data);
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBookings();
  }, []);
  const handleCancelBooking = async (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to cancel this booking?")) {
      const ok = await api.cancelBooking(id);
      if (ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
      }
    }
  };
  const filteredBookings = bookings.filter((b) => {
    if (activeFilter === "upcoming") return b.status === "upcoming" || b.status === "in_progress";
    if (activeFilter === "completed") return b.status === "completed";
    return true;
  });
  return <div className="space-y-6">
      
      {
    /* Header Banner */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Scheduled Appointments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              {bookings.filter((b) => b.status === "upcoming").length} Upcoming
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your booked human sign language interpreters across medical, academic, and business sessions.
          </p>
        </div>

        {
    /* Action Buttons */
  }
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
    onClick={fetchBookings}
    disabled={loading}
    title="Refresh bookings from server"
    className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
  >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <button
    onClick={onOpenDirectory}
    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-2 shadow-md shadow-indigo-500/25 transition-all"
  >
            <Plus className="w-4 h-4" />
            <span>Book New Interpreter</span>
          </button>
        </div>
      </div>

      {
    /* Filter Tabs */
  }
      <div className="flex items-center space-x-2">
        {["upcoming", "completed", "all"].map((filter) => <button
    key={filter}
    onClick={() => setActiveFilter(filter)}
    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${activeFilter === filter ? "bg-indigo-600 text-white shadow-xs" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
  >
            {filter} Sessions
          </button>)}
      </div>

      {
    /* Bookings Card List */
  }
      <div className="space-y-4">
        {filteredBookings.length > 0 ? filteredBookings.map((b) => {
    const isToday = b.date.toLowerCase() === "today";
    return <div
      key={b.id}
      className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
                {
      /* Left details */
    }
                <div className="flex items-start space-x-4">
                  <img
      src={b.interpreterAvatar}
      alt={b.interpreterName}
      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/30 shrink-0"
    />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {b.interpreterName}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                        {b.language}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                      <span className="flex items-center space-x-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <strong className="text-slate-800 dark:text-slate-200">{b.date}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{b.time} ({b.durationMinutes} min)</span>
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ${b.totalCost.toFixed(2)}
                      </span>
                    </div>

                    {b.notes && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-1">
                        📝 {b.notes}
                      </p>}
                  </div>
                </div>

                {
      /* Action Buttons */
    }
                <div className="flex items-center space-x-2 self-end md:self-center">
                  <button
      onClick={(e) => handleCancelBooking(b.id, e)}
      title="Cancel Booking"
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
    >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {b.status === "upcoming" && <button
      onClick={() => onJoinCall(b.interpreterId)}
      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all"
    >
                      <Video className="w-4 h-4" />
                      <span>{isToday ? "Join Video Call" : "Prepare Room"}</span>
                    </button>}
                </div>
              </div>;
  }) : <div className="bg-white dark:bg-slate-800 p-10 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
            <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No {activeFilter} appointments</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              You can easily browse certified interpreters and book appointments for your upcoming healthcare, academic, or work meetings.
            </p>
            <button
    onClick={onOpenDirectory}
    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
  >
              Browse Interpreter Directory
            </button>
          </div>}
      </div>

    </div>;
};
export {
  ScheduleView
};
