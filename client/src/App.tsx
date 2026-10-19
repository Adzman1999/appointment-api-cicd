import { useEffect, useState } from "react";
import {
  fetchSlots,
  fetchMyAppointments,
  holdSlot,
  releaseSlot,
  bookSlot,
  cancelAppointment,
  fetchHealth,
  Slot,
  Appointment,
  User,
} from "./api";
import { CountdownTimer } from "./components/CountdownTimer";
import { AuthModal } from "./components/AuthModal";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  LogOut,
  Stethoscope,
  Trash2,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"slots" | "appointments">("slots");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<"healthy" | "error" | "loading">("loading");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const loadedSlots = await fetchSlots();
      setSlots(loadedSlots);

      if (user) {
        const myAppts = await fetchMyAppointments();
        setAppointments(myAppts);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check local storage for user token
    const savedUser = localStorage.getItem("clinix_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("clinix_user");
      }
    }

    // Health check
    fetchHealth()
      .then(() => setHealthStatus("healthy"))
      .catch(() => setHealthStatus("error"));

    loadData();

    // Auto-refresh slots every 15 seconds to sync hold releases
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleAuthSuccess = (authenticatedUser: User, token: string) => {
    localStorage.setItem("clinix_token", token);
    localStorage.setItem("clinix_user", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    showFeedback("success", `Welcome back, ${authenticatedUser.email}`);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem("clinix_token");
    localStorage.removeItem("clinix_user");
    setUser(null);
    setAppointments([]);
    showFeedback("success", "Logged out successfully");
    loadData();
  };

  const handleHold = async (slotId: number) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      await holdSlot(slotId);
      showFeedback("success", "Slot placed on 3-minute hold for you!");
      loadData();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to reserve hold");
      loadData();
    }
  };

  const handleRelease = async (slotId: number) => {
    try {
      await releaseSlot(slotId);
      showFeedback("success", "Hold released");
      loadData();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to release hold");
    }
  };

  const handleConfirm = async (slotId: number) => {
    try {
      await bookSlot(slotId);
      showFeedback("success", "Appointment confirmed! View it in My Appointments.");
      loadData();
      setActiveTab("appointments");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to confirm booking");
      loadData();
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      await cancelAppointment(appointmentId);
      showFeedback("success", "Appointment cancelled successfully");
      loadData();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to cancel");
    }
  };

  const specialties = ["All", ...Array.from(new Set(slots.map((s) => s.specialty)))];
  const filteredSlots = selectedSpecialty === "All" ? slots : slots.filter((s) => s.specialty === selectedSpecialty);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Notification Toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <Activity className="w-4 h-4 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">CareSync</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Healthcare Scheduling & Smart Hold Platform</p>
          </div>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-3">
          {/* Health indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span>API: {healthStatus === "healthy" ? "Online" : "Connecting..."}</span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh Slots"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200/60">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-6">
        {/* Hero Concept Card */}
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-medium backdrop-blur-sm mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ticketmaster-Style Concurrency Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              3-Minute Smart Hold Slot Reservation
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              When you reserve an appointment slot, our PostgreSQL database locks it with a temporary TTL hold. Complete your booking with zero double-booking risk.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        </div>

        {/* Tab Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("slots")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "slots"
                  ? "bg-white text-slate-900 shadow-sm shadow-slate-900/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Available Doctors ({slots.filter((s) => s.status !== "booked").length})</span>
            </button>
            <button
              onClick={() => {
                if (!user) {
                  setAuthModalOpen(true);
                } else {
                  setActiveTab("appointments");
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "appointments"
                  ? "bg-white text-slate-900 shadow-sm shadow-slate-900/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>My Bookings ({appointments.filter((a) => a.status === "booked").length})</span>
            </button>
          </div>

          {/* Specialty Filter */}
          {activeTab === "slots" && specialties.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-400 mr-1">Filter:</span>
              {specialties.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedSpecialty === spec
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View 1: Available Slots */}
        {activeTab === "slots" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSlots.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm">No appointment slots found</p>
                <p className="text-xs mt-1">Run the seeder or check back soon!</p>
              </div>
            ) : (
              filteredSlots.map((slot) => {
                const isHeldByMe = slot.is_held_by_me && slot.status === "held";
                const isHeldByOther = slot.status === "held" && !slot.is_held_by_me;
                const isBooked = slot.status === "booked";

                const startDate = new Date(slot.starts_at);
                const timeString = `${startDate.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })} • ${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

                return (
                  <div
                    key={slot.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                      isHeldByMe
                        ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400 shadow-md"
                        : isBooked
                        ? "bg-slate-50/60 border-slate-200 opacity-60"
                        : isHeldByOther
                        ? "bg-slate-100/60 border-slate-200 text-slate-400"
                        : "bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-lg shadow-sm"
                    }`}
                  >
                    <div>
                      {/* Top Row: Specialty & Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {slot.specialty}
                        </span>

                        {isHeldByMe && slot.held_until ? (
                          <CountdownTimer heldUntil={slot.held_until} onExpire={loadData} />
                        ) : isHeldByOther ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <Lock className="w-3 h-3" />
                            <span>On Hold</span>
                          </span>
                        ) : isBooked ? (
                          <span className="text-[11px] font-semibold text-slate-400">Booked</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Available
                          </span>
                        )}
                      </div>

                      {/* Doctor Name & Time */}
                      <h3 className="font-bold text-base text-slate-900 leading-snug">{slot.provider_name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{timeString}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isHeldByMe ? (
                        <>
                          <button
                            onClick={() => handleConfirm(slot.id)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Booking</span>
                          </button>
                          <button
                            onClick={() => handleRelease(slot.id)}
                            className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                            title="Release this hold"
                          >
                            Cancel
                          </button>
                        </>
                      ) : isHeldByOther ? (
                        <button
                          disabled
                          className="w-full py-2 px-3 bg-slate-200/60 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Reserved by another patient</span>
                        </button>
                      ) : isBooked ? (
                        <button
                          disabled
                          className="w-full py-2 px-3 bg-slate-100 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                        >
                          Unavailable
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHold(slot.id)}
                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/15 flex items-center justify-center gap-1.5"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Reserve (Hold 3m)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* View 2: My Appointments */}
        {activeTab === "appointments" && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {appointments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm">No booked appointments yet</p>
                <p className="text-xs mt-1">Switch to Available Doctors and hold a slot to get started!</p>
              </div>
            ) : (
              appointments.map((appt) => {
                const startDate = new Date(appt.starts_at);
                const isCancelled = appt.status === "cancelled";

                return (
                  <div
                    key={appt.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isCancelled ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isCancelled
                              ? "bg-slate-200 text-slate-600"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {appt.status}
                        </span>
                        <span className="text-xs text-slate-400">{appt.specialty}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{appt.provider_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {startDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="py-1.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
