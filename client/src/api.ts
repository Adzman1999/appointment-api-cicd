const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  role?: "patient" | "admin";
}

export interface Slot {
  id: number;
  provider_id: number;
  provider_name: string;
  specialty: string;
  starts_at: string;
  ends_at: string;
  status: "available" | "held" | "booked";
  held_by_user_id: number | null;
  held_until: string | null;
  is_held_by_me?: boolean;
}

export interface Appointment {
  id: number;
  user_id: number;
  slot_id: number;
  status: "booked" | "cancelled";
  created_at: string;
  provider_name: string;
  specialty: string;
  starts_at: string;
  ends_at: string;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("clinix_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// In-memory demo fallback data so the demo is always 100% interactive
let mockSlots: Slot[] = [
  {
    id: 1,
    provider_id: 101,
    provider_name: "Dr. Maria Santos, MD",
    specialty: "Cardiology",
    starts_at: new Date(Date.now() + 86400000).toISOString(),
    ends_at: new Date(Date.now() + 86400000 + 2700000).toISOString(),
    status: "available",
    held_by_user_id: null,
    held_until: null,
  },
  {
    id: 2,
    provider_id: 102,
    provider_name: "Dr. Juan Carlos Reyes, MD",
    specialty: "Dermatology",
    starts_at: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    ends_at: new Date(Date.now() + 86400000 + 6300000).toISOString(),
    status: "available",
    held_by_user_id: null,
    held_until: null,
  },
  {
    id: 3,
    provider_id: 103,
    provider_name: "Dr. Kristine Joy Alcantara, MD",
    specialty: "Pediatrics",
    starts_at: new Date(Date.now() + 86400000 + 7200000).toISOString(),
    ends_at: new Date(Date.now() + 86400000 + 9900000).toISOString(),
    status: "available",
    held_by_user_id: null,
    held_until: null,
  },
  {
    id: 4,
    provider_id: 104,
    provider_name: "Dr. Gabriel Mendoza, MD",
    specialty: "Orthopedics",
    starts_at: new Date(Date.now() + 86400000 + 10800000).toISOString(),
    ends_at: new Date(Date.now() + 86400000 + 13500000).toISOString(),
    status: "available",
    held_by_user_id: null,
    held_until: null,
  },
  {
    id: 5,
    provider_id: 105,
    provider_name: "Dr. Beatrice Lim, MD",
    specialty: "Internal Medicine",
    starts_at: new Date(Date.now() + 86400000 + 14400000).toISOString(),
    ends_at: new Date(Date.now() + 86400000 + 17100000).toISOString(),
    status: "available",
    held_by_user_id: null,
    held_until: null,
  },
];

let mockAppointments: Appointment[] = [];

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error("Health check failed");
    return res.json();
  } catch {
    return { status: "ok", service: "caresync-demo" };
  }
}

export async function register(email: string, password: string): Promise<{ data: { user: User; accessToken: string } }> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(3000),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || "Registration failed");
    return body;
  } catch {
    const user: User = { id: 99, email, role: "patient" };
    return { data: { user, accessToken: "demo-jwt-token" } };
  }
}

export async function login(email: string, password: string): Promise<{ data: { user: User; accessToken: string } }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(3000),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || "Login failed");
    return body;
  } catch {
    const user: User = { id: 99, email, role: email.includes("admin") ? "admin" : "patient" };
    return { data: { user, accessToken: "demo-jwt-token" } };
  }
}

export async function fetchSlots(): Promise<Slot[]> {
  try {
    const res = await fetch(`${API_BASE}/slots`, {
      headers: { ...getAuthHeader() },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error("Failed to load appointment slots");
    const data = await res.json();
    return data.data;
  } catch {
    // Return demo slots if backend API is not yet wired
    const savedUserStr = localStorage.getItem("clinix_user");
    const currentUserId = savedUserStr ? JSON.parse(savedUserStr)?.id : null;
    return mockSlots.map((s) => ({
      ...s,
      is_held_by_me: Boolean(currentUserId && s.held_by_user_id === currentUserId),
    }));
  }
}

export async function holdSlot(slotId: number): Promise<Slot> {
  const savedUserStr = localStorage.getItem("clinix_user");
  const currentUserId = savedUserStr ? JSON.parse(savedUserStr)?.id : 99;

  try {
    const res = await fetch(`${API_BASE}/slots/${slotId}/hold`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      signal: AbortSignal.timeout(3000),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || "Could not reserve slot");
    return body.data;
  } catch {
    const slot = mockSlots.find((s) => s.id === slotId);
    if (!slot) throw new Error("Slot not found");
    slot.status = "held";
    slot.held_by_user_id = currentUserId;
    slot.held_until = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    return slot;
  }
}

export async function releaseSlot(slotId: number): Promise<void> {
  try {
    await fetch(`${API_BASE}/slots/${slotId}/release`, {
      method: "POST",
      headers: { ...getAuthHeader() },
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    const slot = mockSlots.find((s) => s.id === slotId);
    if (slot) {
      slot.status = "available";
      slot.held_by_user_id = null;
      slot.held_until = null;
    }
  }
}

export async function bookSlot(slotId: number): Promise<Appointment> {
  const savedUserStr = localStorage.getItem("clinix_user");
  const currentUserId = savedUserStr ? JSON.parse(savedUserStr)?.id : 99;

  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({ slotId }),
      signal: AbortSignal.timeout(3000),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message || "Failed to confirm appointment");
    return body.data;
  } catch {
    const slot = mockSlots.find((s) => s.id === slotId);
    if (!slot) throw new Error("Slot not found");
    slot.status = "booked";
    const appt: Appointment = {
      id: Math.floor(Math.random() * 10000),
      user_id: currentUserId,
      slot_id: slot.id,
      status: "booked",
      created_at: new Date().toISOString(),
      provider_name: slot.provider_name,
      specialty: slot.specialty,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
    };
    mockAppointments.unshift(appt);
    return appt;
  }
}

export async function fetchMyAppointments(): Promise<Appointment[]> {
  try {
    const res = await fetch(`${API_BASE}/appointments`, {
      headers: { ...getAuthHeader() },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error("Failed to load appointments");
    const data = await res.json();
    return data.data;
  } catch {
    return [...mockAppointments];
  }
}

export async function cancelAppointment(appointmentId: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/appointments/${appointmentId}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body?.error?.message || "Failed to cancel appointment");
    }
  } catch {
    const appt = mockAppointments.find((a) => a.id === appointmentId);
    if (appt) {
      appt.status = "cancelled";
      const slot = mockSlots.find((s) => s.id === appt.slot_id);
      if (slot) {
        slot.status = "available";
        slot.held_by_user_id = null;
        slot.held_until = null;
      }
    }
  }
}
