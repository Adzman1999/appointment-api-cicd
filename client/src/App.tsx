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
import { MedicalHeroIllustration } from "./components/MedicalHeroIllustration";
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
  ShieldCheck,
  RefreshCw,
  MapPin,
  HeartPulse,
  Award,
  Filter,
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

  const currentYear = new Date().getFullYear();

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
    const savedUser = localStorage.getItem("clinix_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("clinix_user");
      }
    }

    fetchHealth()
      .then(() => setHealthStatus("healthy"))
      .catch(() => setHealthStatus("error"));

    loadData();

    // Auto-refresh every 12 seconds to sync hold releases
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleAuthSuccess = (authenticatedUser: User, token: string) => {
    localStorage.setItem("clinix_token", token);
    localStorage.setItem("clinix_user", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    showFeedback("success", `Mabuhay, ${authenticatedUser.email}! You are now signed in.`);
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem("clinix_token");
    localStorage.removeItem("clinix_user");
    setUser(null);
    setAppointments([]);
    showFeedback("success", "Signed out successfully");
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-2.5 transition-all duration-300 animate-slide-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <Activity className="w-5 h-5 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Region & Timezone Bar: Default Philippines with Global Multi-Region Support */}
      <div className="bg-slate-900 text-slate-300 text-[11px] font-medium py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-slate-800">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>🌐 Global Healthcare Scheduling &bull; Default Region: Philippines (PHT / UTC+8) &bull; International Telehealth Ready</span>
      </div>

      {/* Modern Floating Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 transition-transform hover:scale-105">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">CareSync</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Global
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Universal Clinical Scheduling & Real-Time Smart Hold Platform
              </p>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200/60">
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              <span>API: {healthStatus === "healthy" ? "Online (Global / PHT)" : "Connecting..."}</span>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Refresh schedule"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="max-w-[140px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/35 hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Patient Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* Modern Vector Hero Section (No AI Images) */}
        <section className="mb-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-2xl p-6 sm:p-10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero Double-Booking Guarantee &bull; Global Multi-Timezone</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Universal Healthcare Scheduling with <span className="text-indigo-400">3-Minute Smart Hold</span>
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
                Book consultations with board-certified medical specialists worldwide, with default hub in the Philippines. When you reserve a slot, our database locks it for 3 minutes so no other patient globally can double-book it while you confirm.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>St. Luke&apos;s BGC (PH)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Makati Medical Center (PH)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Singapore General (SG)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Mayo Clinic Network (US)</span>
                </div>
              </div>
            </div>

            {/* Vector Graphic Centerpiece */}
            <div className="lg:col-span-5 flex justify-center">
              <MedicalHeroIllustration />
            </div>
          </div>
        </section>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("slots")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "slots"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
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
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "appointments"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>My Bookings ({appointments.filter((a) => a.status === "booked").length})</span>
            </button>
          </div>

          {/* Specialty Filter Pills */}
          {activeTab === "slots" && specialties.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
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

        {/* View 1: Slots Grid */}
        {activeTab === "slots" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSlots.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <Stethoscope className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-600" />
                <p className="font-bold text-sm text-slate-700">No appointment slots available</p>
                <p className="text-xs mt-1 text-slate-400">Run the seeder or check back shortly!</p>
              </div>
            ) : (
              filteredSlots.map((slot) => {
                const isHeldByMe = slot.is_held_by_me && slot.status === "held";
                const isHeldByOther = slot.status === "held" && !slot.is_held_by_me;
                const isBooked = slot.status === "booked";

                const startDate = new Date(slot.starts_at);
                const timeString = `${startDate.toLocaleDateString("en-PH", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })} • ${startDate.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`;

                return (
                  <div
                    key={slot.id}
                    className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                      isHeldByMe
                        ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-400 shadow-xl scale-[1.01]"
                        : isBooked
                        ? "bg-slate-50/80 border-slate-200 opacity-60"
                        : isHeldByOther
                        ? "bg-slate-100/70 border-slate-200 text-slate-400"
                        : "bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xl hover:-translate-y-1 shadow-sm"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          <span className="truncate max-w-[180px]">{slot.specialty}</span>
                        </div>

                        {isHeldByMe && slot.held_until ? (
                          <CountdownTimer heldUntil={slot.held_until} onExpire={loadData} />
                        ) : isHeldByOther ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Lock className="w-3 h-3" />
                            <span>On Hold</span>
                          </span>
                        ) : isBooked ? (
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Booked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Available
                          </span>
                        )}
                      </div>

                      {/* Doctor Profile */}
                      <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                        {slot.provider_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{timeString} (PHT)</span>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                      {isHeldByMe ? (
                        <>
                          <button
                            onClick={() => handleConfirm(slot.id)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Booking</span>
                          </button>
                          <button
                            onClick={() => handleRelease(slot.id)}
                            className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                          >
                            Release
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
                          className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 flex items-center justify-center gap-1.5"
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

        {/* View 2: My Bookings */}
        {activeTab === "appointments" && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {appointments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-500" />
                <p className="font-bold text-sm text-slate-700">No confirmed appointments yet</p>
                <p className="text-xs mt-1 text-slate-400">
                  Switch to Available Doctors and hold a slot to secure your schedule.
                </p>
              </div>
            ) : (
              appointments.map((appt) => {
                const startDate = new Date(appt.starts_at);
                const isCancelled = appt.status === "cancelled";

                return (
                  <div
                    key={appt.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isCancelled
                        ? "bg-slate-50 border-slate-200 opacity-60"
                        : "bg-white border-slate-200 shadow-sm hover:shadow-md"
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
                        <span className="text-xs font-medium text-slate-400">{appt.specialty}</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900">{appt.provider_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {startDate.toLocaleDateString("en-PH", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {startDate.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} (PHT)
                      </p>
                    </div>

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="py-1.5 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
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

      {/* Dynamic Footer with current year */}
      <footer className="mt-auto bg-white border-t border-slate-200 px-4 sm:px-8 py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">CareSync Global Health</span>
            <span>&bull;</span>
            <span>Worldwide Clinical Network (Primary Hub: Philippines)</span>
          </div>

          <p className="text-slate-400">
            &copy; {currentYear} CareSync Health Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Global Cloud Status: 99.99% Uptime
            </span>
          </div>
        </div>
      </footer>

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
