# Clinix — Smart Hold Healthcare Booking Platform

> A production-grade appointment booking platform featuring a **3-Minute Smart Hold reservation pattern** (Ticketmaster-style concurrency protection), fully automated CI/CD pipeline, and modern React dashboard.

---

## 🌟 Key Product Features

### 1. 3-Minute Smart Hold Reservation Pattern
* **The Problem:** In standard booking apps, users get frustrated when another patient snatches a slot while they are filling out their medical details or payment.
* **The Solution:** When a patient clicks **"Reserve"**, PostgreSQL locks the slot with a 3-minute TTL (Time-To-Live):
  * **On your screen:** An active countdown ring (`Hold: 02:59... 02:58`) appears with a **"Confirm Booking"** button.
  * **On everyone else's screen:** The slot instantly disables with a padlock: *"Reserved by another patient"*.
  * **Self-Cleaning Auto-Expiry:** If the user closes the browser or lets the timer hit `00:00`, the database query automatically releases the slot back to `available` without needing manual intervention.

### 2. Zero-Double-Booking Guarantee
* Protected by atomic PostgreSQL row locks (`SELECT ... FOR UPDATE`) and database unique constraints.
* Even if 50 users click "Confirm" on the exact same millisecond, exactly **1 succeeds (`HTTP 201 Created`)** and 49 safely receive **`HTTP 409 Conflict`**.

### 3. Modern React Client (`client/`)
* Built with **React 18 + Vite + TypeScript**.
* Clean styling powered by **Tailwind CSS** and **Lucide Icons**.
* Features:
  * Modal authentication (JWT registration & login).
  * Real-time slot status indicator (*Available*, *On Hold*, *Booked*).
  * Filter by medical specialty (Cardiology, Dermatology, Pediatrics, Orthopedics).
  * "My Bookings" management panel with 1-click cancellation.
  * Live API Heartbeat (`/health` probe).

---

## 🏗️ Architecture & Tech Stack

```
[ Client / Browser ]
        │  React 18 (Vite, TypeScript, Tailwind CSS, Lucide Icons)
        ▼  HTTPS / JSON REST API with CORS
[ Express 5 Application Layer ]
        │  • Helmet Security Headers
        │  • Zod Payload Validation
        │  • JWT Authentication Middleware
        │  • Database Connection Pool (node-postgres pg.Pool)
        ▼  TCP 5432
[ PostgreSQL 18 Database ]
        • appointment_slots (with status, held_by_user_id, held_until)
        • appointments
        • providers
        • users
```

---

## 🚀 Local Development Setup

### 1. Start the Database and Seed Doctors
Make sure PostgreSQL is running (or run with Docker Compose):
```bash
docker compose up -d db
```

Run database migrations and seed doctors with future appointment slots:
```bash
npm run migrate:up
npm run db:seed
```

### 2. Start the Backend API
```bash
npm run dev
# Backend listening on http://localhost:8000
```

### 3. Start the React Frontend
In a new terminal window:
```bash
npm run client:dev
# Client running at http://localhost:5173
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🧪 Automated Testing & Quality Gates

Run the entire automated test pyramid with a single command:
```bash
npm run check
```
This executes:
1. `npm run typecheck` — TypeScript strict type validation
2. `npm run build` — Production compilation
3. `npm test` — Unit & Service tests (Vitest)
4. `npm run test:smoke` — Live deployment health verification

---

## 🌐 100% Free Live Cloud Deployment Guide (For Portfolio)

You can deploy this full-stack application completely free to share a live URL on your portfolio or resume.

### Step 1: Free PostgreSQL & Backend (Render.com)
1. Push this repository to GitHub.
2. Sign in to **[Render.com](https://render.com)** (Free Tier).
3. Click **New +** $\rightarrow$ **PostgreSQL**:
   * Name: `clinix-db`
   * Free Plan
   * Copy the **Internal Database URL**.
4. Click **New +** $\rightarrow$ **Web Service**:
   * Connect your GitHub repository.
   * Environment: `Node`
   * Build Command: `npm ci && npm run build && npm run migrate:up && npm run db:seed`
   * Start Command: `npm start`
   * Add Environment Variables:
     * `DATABASE_URL`: *(paste the Render PostgreSQL URL)*
     * `JWT_SECRET`: *(generate any 32-character random string)*
     * `PORT`: `8000`
     * `NODE_ENV`: `production`
5. Click **Deploy**. Render will give you a free live backend URL (e.g. `https://clinix-api.onrender.com`).

### Step 2: Free React Frontend (Vercel)
1. Sign in to **[Vercel.com](https://vercel.com)** with your GitHub account.
2. Click **Add New Project** and select this repository.
3. In Project Settings:
   * **Root Directory:** Select `client`
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. In **Environment Variables**, add:
   * `VITE_API_URL`: `https://clinix-api.onrender.com` *(your Render backend URL)*
5. Click **Deploy**. In under 60 seconds, you get a free live frontend link (e.g. `https://clinix-booking.vercel.app`)!

---

## 🎙️ How to Present This in an Interview (The 60-Second Pitch)

> *"For my portfolio, I built Clinix—a full-stack appointment booking platform designed to solve booking race conditions and user drop-off.*
> 
> *Instead of a standard calendar, I engineered a **3-Minute Smart Hold reservation pattern**, similar to how Ticketmaster or airlines hold seats during checkout. When a patient selects a slot, the system reserves it with a temporary TTL in PostgreSQL. The user sees an active countdown timer on their React dashboard while the slot is locked for everyone else. If the user confirms, it atomically commits; if the timer expires, the slot automatically reopens for other patients.*
> 
> *The entire system is backed by a multi-tier Vitest test suite, strictly validated with Zod, and packaged with automated CI/CD and Docker."*
