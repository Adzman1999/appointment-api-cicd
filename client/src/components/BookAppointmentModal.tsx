import React, { useState } from "react";
import { DOCTORS, TIME_SLOTS, COMMON_PURPOSES } from "../appointmentService";
import { Calendar, Clock, Stethoscope, User, FileText, Check, X, ShieldAlert } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    doctorId: number;
    patientName: string;
    patientEmail: string;
    date: string;
    time: string;
    purpose: string;
    notes?: string;
  }) => Promise<void>;
  defaultPatientName: string;
  defaultPatientEmail: string;
}

export const BookAppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultPatientName,
  defaultPatientEmail,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(DOCTORS[0].id);
  const [patientName, setPatientName] = useState(defaultPatientName || "Sarah Jenkins");
  const [patientEmail, setPatientEmail] = useState(defaultPatientEmail || "patient.guest@caresync.com");
  
  // Default date to tomorrow
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const [date, setDate] = useState(tomorrowStr);
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [purpose, setPurpose] = useState(COMMON_PURPOSES[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !patientName || !patientEmail) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        doctorId: selectedDoctorId,
        patientName,
        patientEmail,
        date,
        time,
        purpose,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-white flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
              New Appointment
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">Schedule a Consultation</h2>
            <p className="text-xs text-indigo-100 mt-0.5">
              Fill in your details below. Your request will be instantly processed.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Medical Specialist</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {DOCTORS.map((doc) => {
                const isSelected = doc.id === selectedDoctorId;
                return (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-slate-900 leading-snug">{doc.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0 ml-1" />}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium mt-1 truncate w-full">
                      {doc.specialty}
                    </span>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-medium">
                      <span>{doc.experienceYears} yrs exp.</span>
                      <span className="font-bold text-indigo-600">{doc.consultationFee}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient Details (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Patient Full Name</span>
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preferred Date</span>
              </label>
              <input
                type="date"
                required
                min={tomorrowStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Available Time Slot</span>
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purpose of Appointment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Purpose of Consultation</span>
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium bg-white mb-2"
            >
              {COMMON_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific symptoms, medical history, or questions for the doctor? (Optional)"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <span>Scheduling...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Appointment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
