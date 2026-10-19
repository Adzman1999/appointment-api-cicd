const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
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

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export async function register(email: string, password: string): Promise<{ data: { user: User; accessToken: string } }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || "Registration failed");
  }
  return body;
}

export async function login(email: string, password: string): Promise<{ data: { user: User; accessToken: string } }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || "Login failed");
  }
  return body;
}

export async function fetchSlots(): Promise<Slot[]> {
  const res = await fetch(`${API_BASE}/slots`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load appointment slots");
  const data = await res.json();
  return data.data;
}

export async function holdSlot(slotId: number): Promise<Slot> {
  const res = await fetch(`${API_BASE}/slots/${slotId}/hold`, {
    method: "POST",
    headers: { ...getAuthHeader() },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || "Could not reserve slot");
  }
  return body.data;
}

export async function releaseSlot(slotId: number): Promise<void> {
  await fetch(`${API_BASE}/slots/${slotId}/release`, {
    method: "POST",
    headers: { ...getAuthHeader() },
  });
}

export async function bookSlot(slotId: number): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ slotId }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message || "Failed to confirm appointment");
  }
  return body.data;
}

export async function fetchMyAppointments(): Promise<Appointment[]> {
  const res = await fetch(`${API_BASE}/appointments`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error("Failed to load appointments");
  const data = await res.json();
  return data.data;
}

export async function cancelAppointment(appointmentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body?.error?.message || "Failed to cancel appointment");
  }
}
