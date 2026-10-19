export type AppointmentStatus = "Pending" | "Approved" | "Rescheduled" | "Rejected" | "Cancelled";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "patient" | "admin";
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experienceYears: number;
  consultationFee: string;
  availableDays: string[];
}

export interface Appointment {
  id: string;
  patientId: number;
  patientName: string;
  patientEmail: string;
  doctorId: number;
  doctorName: string;
  specialty: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "09:30 AM"
  purpose: string;
  notes?: string;
  status: AppointmentStatus;
  rejectionReason?: string;
  rescheduleReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Dr. Maria Santos",
    specialty: "Cardiology (Heart Health)",
    experienceYears: 14,
    consultationFee: "$50",
    availableDays: ["Mon", "Wed", "Fri"],
  },
  {
    id: 2,
    name: "Dr. Juan Carlos Reyes",
    specialty: "Dermatology (Skin & Care)",
    experienceYears: 10,
    consultationFee: "$45",
    availableDays: ["Tue", "Thu", "Sat"],
  },
  {
    id: 3,
    name: "Dr. Kristine Joy Alcantara",
    specialty: "Pediatrics (Child Healthcare)",
    experienceYears: 12,
    consultationFee: "$40",
    availableDays: ["Mon", "Tue", "Thu", "Fri"],
  },
  {
    id: 4,
    name: "Dr. Gabriel Mendoza",
    specialty: "Orthopedics (Bones & Joints)",
    experienceYears: 16,
    consultationFee: "$55",
    availableDays: ["Wed", "Thu", "Sat"],
  },
  {
    id: 5,
    name: "Dr. Beatrice Lim",
    specialty: "General Internal Medicine",
    experienceYears: 9,
    consultationFee: "$35",
    availableDays: ["Mon", "Tue", "Wed", "Fri"],
  },
];

export const TIME_SLOTS = [
  "08:30 AM",
  "09:30 AM",
  "10:30 AM",
  "11:30 AM",
  "01:30 PM",
  "02:30 PM",
  "03:30 PM",
  "04:30 PM",
];

export const COMMON_PURPOSES = [
  "General Routine Checkup",
  "Follow-up Consultation",
  "Prescription Refill & Lab Review",
  "Acute Symptoms / Urgent Care",
  "Specialist Second Opinion",
  "Preventive Screening",
];

const STORAGE_KEY = "caresync_appointments_v2";

function getStoredAppointments(): Appointment[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }

  // Pre-seed with helpful realistic appointments for first demo experience
  const defaultList: Appointment[] = [
    {
      id: "APT-1001",
      patientId: 101,
      patientName: "Sarah Jenkins",
      patientEmail: "patient.guest@caresync.com",
      doctorId: 1,
      doctorName: "Dr. Maria Santos",
      specialty: "Cardiology (Heart Health)",
      date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      time: "09:30 AM",
      purpose: "General Routine Checkup",
      notes: "Experiencing mild fatigue after exercise.",
      status: "Approved",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: "APT-1002",
      patientId: 101,
      patientName: "Sarah Jenkins",
      patientEmail: "patient.guest@caresync.com",
      doctorId: 2,
      doctorName: "Dr. Juan Carlos Reyes",
      specialty: "Dermatology (Skin & Care)",
      date: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
      time: "02:30 PM",
      purpose: "Acute Symptoms / Urgent Care",
      notes: "Skin allergic reaction on forearm.",
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "APT-1003",
      patientId: 102,
      patientName: "Michael Chang",
      patientEmail: "m.chang@example.com",
      doctorId: 4,
      doctorName: "Dr. Gabriel Mendoza",
      specialty: "Orthopedics (Bones & Joints)",
      date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      time: "11:30 AM",
      purpose: "Follow-up Consultation",
      notes: "Post-surgery knee rehabilitation assessment.",
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultList));
  return defaultList;
}

function saveAppointments(appts: Appointment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appts));
}

export async function getAppointments(user?: User | null): Promise<Appointment[]> {
  const list = getStoredAppointments();
  if (!user) return list;
  if (user.role === "admin") return list; // Admin sees all
  return list.filter((a) => a.patientEmail.toLowerCase() === user.email.toLowerCase() || a.patientId === user.id);
}

export async function createAppointment(data: {
  patientId: number;
  patientName: string;
  patientEmail: string;
  doctorId: number;
  date: string;
  time: string;
  purpose: string;
  notes?: string;
}): Promise<Appointment> {
  const doctor = DOCTORS.find((d) => d.id === data.doctorId) || DOCTORS[0];
  const list = getStoredAppointments();

  const newAppt: Appointment = {
    id: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: data.patientId,
    patientName: data.patientName,
    patientEmail: data.patientEmail,
    doctorId: doctor.id,
    doctorName: doctor.name,
    specialty: doctor.specialty,
    date: data.date,
    time: data.time,
    purpose: data.purpose,
    notes: data.notes,
    status: "Pending", // Starts as pending confirmation
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.unshift(newAppt);
  saveAppointments(list);
  return newAppt;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  options?: { reason?: string; newDate?: string; newTime?: string }
): Promise<Appointment> {
  const list = getStoredAppointments();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Appointment not found");

  const appt = { ...list[index] };
  appt.status = status;
  appt.updatedAt = new Date().toISOString();

  if (status === "Rejected" && options?.reason) {
    appt.rejectionReason = options.reason;
  }
  if (status === "Rescheduled") {
    if (options?.newDate) appt.date = options.newDate;
    if (options?.newTime) appt.time = options.newTime;
    if (options?.reason) appt.rescheduleReason = options.reason;
  }

  list[index] = appt;
  saveAppointments(list);
  return appt;
}

export async function deleteAppointment(id: string): Promise<void> {
  let list = getStoredAppointments();
  list = list.filter((a) => a.id !== id);
  saveAppointments(list);
}
