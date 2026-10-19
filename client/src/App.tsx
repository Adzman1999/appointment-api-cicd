import { useEffect, useState } from "react";
import {
  User,
  Appointment,
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "./appointmentService";
import { BookAppointmentModal } from "./components/BookAppointmentModal";
import { RescheduleModal } from "./components/RescheduleModal";
import { StatusBadge } from "./components/StatusBadge";
import { AuthModal } from "./components/AuthModal";
import { MedicalHeroIllustration } from "./components/MedicalHeroIllustration";
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Ban,
  Trash2,
  User as UserIcon,
  LogOut,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  Award,
  AlertCircle,
} from "lucide-react";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await getAppointments(user);
      setAppointments(data);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load appointments", "error");
    } finally {
      setLoading(false);
    }
  };

  // Restore stored user or default to guest patient for instant demo usability
  useEffect(() => {
    const savedUserStr = localStorage.getItem("caresync_demo_user");
    if (savedUserStr) {
      try {
        setUser(JSON.parse(savedUserStr));
      } catch {
        setUser({ id: 101, email: "patient.guest@caresync.com", name: "Sarah Jenkins", role: "patient" });
      }
    } else {
      // Default to friendly demo patient so first-time visitors don't face a blank login wall
      const defaultPatient: User = {
        id: 101,
        email: "patient.guest@caresync.com",
        name: "Sarah Jenkins",
        role: "patient",
      };
      setUser(defaultPatient);
      localStorage.setItem("caresync_demo_user", JSON.stringify(defaultPatient));
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [user]);

  // Auth Handlers
  const handleAuthSuccess = (authenticatedUser: any) => {
    const fullUser: User = {
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      name: authenticatedUser.email.split("@")[0].replace(".", " "),
      role: authenticatedUser.role || (authenticatedUser.email.includes("admin") ? "admin" : "patient"),
    };
    setUser(fullUser);
    localStorage.setItem("caresync_demo_user", JSON.stringify(fullUser));
    showToast(`Welcome back, ${fullUser.name}! Signed in as ${fullUser.role.toUpperCase()}.`);
  };

  const switchRole = (newRole: "patient" | "admin") => {
    if (newRole === "admin") {
      const adminUser: User = {
        id: 1,
        email: "admin.director@caresync.com",
        name: "Dr. Admin Director",
        role: "admin",
      };
      setUser(adminUser);
      localStorage.setItem("caresync_demo_user", JSON.stringify(adminUser));
      showToast("Switched to Administrator Mode. You can now Approve and Reject bookings.", "info");
    } else {
      const patientUser: User = {
        id: 101,
        email: "patient.guest@caresync.com",
        name: "Sarah Jenkins",
        role: "patient",
      };
      setUser(patientUser);
      localStorage.setItem("caresync_demo_user", JSON.stringify(patientUser));
      showToast("Switched to Patient Mode.", "info");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("caresync_demo_user");
    setUser(null);
    showToast("Signed out. Switch back to a guest or sign in to continue.", "info");
  };

  // Appointment Actions
  const handleCreateAppointment = async (formData: {
    doctorId: number;
    patientName: string;
    patientEmail: string;
    date: string;
    time: string;
    purpose: string;
    notes?: string;
  }) => {
    await createAppointment({
      patientId: user?.id || 101,
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
      doctorId: formData.doctorId,
      date: formData.date,
      time: formData.time,
      purpose: formData.purpose,
      notes: formData.notes,
    });
    showToast("Appointment scheduled! It is now Pending doctor confirmation.");
    loadAppointments();
  };

  const handleApprove = async (id: string) => {
    await updateAppointmentStatus(id, "Approved");
    showToast("Appointment confirmed and marked as Approved.");
    loadAppointments();
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter a brief reason for declining this appointment:") || "Doctor unavailable at requested time.";
    await updateAppointmentStatus(id, "Rejected", { reason });
    showToast("Appointment rejected.", "info");
    loadAppointments();
  };

  const handleReschedule = async (id: string, newDate: string, newTime: string, reason: string) => {
    await updateAppointmentStatus(id, "Rescheduled", { newDate, newTime, reason });
    showToast(`Appointment rescheduled to ${newDate} at ${newTime}.`);
    loadAppointments();
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    await updateAppointmentStatus(id, "Cancelled");
    showToast("Appointment cancelled successfully.", "info");
    loadAppointments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this record?")) return;
    await deleteAppointment(id);
    showToast("Record removed.", "info");
    loadAppointments();
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch =
      appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || appt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "Pending").length,
    approved: appointments.filter((a) => a.status === "Approved").length,
    rescheduled: appointments.filter((a) => a.status === "Rescheduled").length,
    rejected: appointments.filter((a) => a.status === "Rejected").length,
    cancelled: appointments.filter((a) => a.status === "Cancelled").length,
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-2.5 transition-all animate-bounce-short ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-indigo-50 border-indigo-200 text-indigo-800"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {toast.type === "error" && <XCircle className="w-5 h-5 text-rose-600" />}
          {toast.type === "info" && <AlertCircle className="w-5 h-5 text-indigo-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modern Friendly Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">CareSync</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Health
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Simple & Intuitive Appointment Management
              </p>
            </div>
          </div>

          {/* Role Switcher Pill & Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/70 text-xs font-bold">
              <button
                onClick={() => switchRole("patient")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  user?.role === "patient"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Patient</span>
              </button>
              <button
                onClick={() => switchRole("admin")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  user?.role === "admin"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin / Doctor</span>
              </button>
            </div>

            {/* User Profile Pill & Sign Out */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
                <span className="text-xs font-semibold text-slate-700 hidden lg:inline-block max-w-[130px] truncate">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Book Appointment CTA */}
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all hover:shadow-indigo-600/40 hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Friendly Hero Banner */}
        <section className="rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-md border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Mode: {user?.role === "admin" ? "Staff / Medical Director" : "Patient Portal"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.role === "admin"
                  ? "Manage, Review, and Confirm Consultations"
                  : "Effortless Doctor Consultations & Care Scheduling"}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
                {user?.role === "admin"
                  ? "Review incoming patient requests, approve or decline appointments, and handle schedule changes with one click."
                  : "Book consultations with board-certified specialists. View live statuses, request date changes, or cancel anytime."}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => setIsBookModalOpen(true)}
                  className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Schedule New Appointment</span>
                </button>
                <div className="text-xs text-slate-300 flex items-center gap-2 pl-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Real-time instant status tracking</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 hidden md:flex justify-end">
              <MedicalHeroIllustration />
            </div>
          </div>
        </section>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setStatusFilter("All")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "All"
                ? "bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-xs font-bold text-slate-500">Total Bookings</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{counts.all}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">All tracked visits</div>
          </div>

          <div
            onClick={() => setStatusFilter("Pending")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "Pending"
                ? "bg-amber-50/60 border-amber-500 shadow-md ring-2 ring-amber-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-xs font-bold text-amber-600 flex items-center justify-between">
              <span>Pending Review</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">{counts.pending}</div>
            <div className="text-[11px] text-amber-600/80 mt-0.5">Needs approval</div>
          </div>

          <div
            onClick={() => setStatusFilter("Approved")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "Approved"
                ? "bg-emerald-50/60 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-xs font-bold text-emerald-600 flex items-center justify-between">
              <span>Confirmed</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{counts.approved}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Ready for visit</div>
          </div>

          <div
            onClick={() => setStatusFilter("Rescheduled")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === "Rescheduled"
                ? "bg-blue-50/60 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-xs font-bold text-blue-600 flex items-center justify-between">
              <span>Rescheduled</span>
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1">{counts.rescheduled}</div>
            <div className="text-[11px] text-blue-600/80 mt-0.5">Updated times</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor, patient, specialty, or ID (e.g. APT-1001)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mr-1" />
            {(["All", "Pending", "Approved", "Rescheduled", "Rejected", "Cancelled"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>
              Showing {filteredAppointments.length} of {appointments.length} appointments
            </span>
            <button
              onClick={loadAppointments}
              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No appointments found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== "All"
                  ? "Try adjusting your filters or search keywords."
                  : "You haven't scheduled any appointments yet. Click below to book your first consultation!"}
              </p>
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Consultation</span>
              </button>
            </div>
          ) : (
            filteredAppointments.map((appt) => (
              <div
                key={appt.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                        {appt.id}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {appt.doctorName}
                    </h3>
                    <p className="text-xs text-indigo-700 font-semibold">{appt.specialty}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">{appt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-700">{appt.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Patient: <strong className="text-slate-700">{appt.patientName}</strong></span>
                      </div>
                    </div>

                    {/* Purpose / Notes / Rejection Reasons */}
                    <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                      <div>
                        <strong className="text-slate-700">Purpose:</strong> {appt.purpose}
                      </div>
                      {appt.notes && (
                        <div className="mt-0.5 text-slate-500">
                          <strong className="text-slate-600">Notes:</strong> {appt.notes}
                        </div>
                      )}
                      {appt.rescheduleReason && (
                        <div className="mt-1 text-blue-700 font-medium">
                          <strong>Reschedule Note:</strong> {appt.rescheduleReason}
                        </div>
                      )}
                      {appt.rejectionReason && (
                        <div className="mt-1 text-rose-700 font-medium">
                          <strong>Decline Reason:</strong> {appt.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions based on Role and Status */}
                <div className="flex flex-wrap md:flex-col items-end justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Admin / Doctor Approval Actions */}
                  {user?.role === "admin" && (appt.status === "Pending" || appt.status === "Rescheduled") && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleApprove(appt.id)}
                        className="flex-1 md:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(appt.id)}
                        className="flex-1 md:flex-none px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {/* Reschedule Button (available if not cancelled/rejected) */}
                  {appt.status !== "Cancelled" && appt.status !== "Rejected" && (
                    <button
                      onClick={() => setRescheduleTarget(appt)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                  )}

                  {/* Cancel Button */}
                  {appt.status !== "Cancelled" && appt.status !== "Rejected" && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}

                  {/* Delete record for housekeeping */}
                  {(appt.status === "Cancelled" || appt.status === "Rejected") && (
                    <button
                      onClick={() => handleDelete(appt.id)}
                      className="px-3 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      title="Remove record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Dynamic Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 px-4 sm:px-8 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">CareSync Health</span>
            <span>&bull;</span>
            <span>Enterprise Patient Scheduling Platform</span>
          </div>

          <p className="text-slate-400">
            &copy; {currentYear} CareSync Health. All rights reserved.
          </p>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational &bull; 99.99% Uptime</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSubmit={handleCreateAppointment}
        defaultPatientName={user?.name || "Sarah Jenkins"}
        defaultPatientEmail={user?.email || "patient.guest@caresync.com"}
      />

      <RescheduleModal
        isOpen={Boolean(rescheduleTarget)}
        appointment={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onReschedule={handleReschedule}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
