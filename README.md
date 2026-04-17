# 🏥 VitalSync — Healthcare Patient Dashboard

> *"Your Health, Synced."*

![VitalSync Banner](https://img.shields.io/badge/VitalSync-Healthcare%20Dashboard-2563EB?style=for-the-badge&logo=heart&logoColor=white)
![Track](https://img.shields.io/badge/Track-Frontend-10B981?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Planning%20Phase-F59E0B?style=for-the-badge)

---

## 📌 Project Overview

**VitalSync** is a modern, enterprise-grade **Healthcare Patient Dashboard** — a hospital management interface that connects Doctors and Patients in one seamless platform.

The application provides a real-time overview of appointments, medical history, prescriptions, and doctor availability — all in a clean, responsive interface designed for both desktop and mobile devices.

This project is built as the **Capstone Project** for the Prodesk IT Internship Program — Week 13 (Planning & Architecture Phase).

---

## 👨‍💻 Track

**Frontend Intern**
> Focus: UI/UX Design, State Management, Component Architecture, Responsive Design

---

## ⚙️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) | Core frontend framework |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS |
| **UI Components** | [Shadcn UI](https://ui.shadcn.com/) | Pre-built accessible components |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | Global state (auth, appointments, user) |
| **Backend-as-a-Service** | [Supabase](https://supabase.com/) | Database, Auth, Real-time |
| **Icons** | [Lucide React](https://lucide.dev/) | Icon library |
| **Charts** | [Recharts](https://recharts.org/) | Data visualization |
| **Language** | TypeScript | Type safety |
| **Deployment** | [Vercel](https://vercel.com/) | Hosting & CI/CD |

---

## ✨ Core Features

### 🔐 Authentication & Roles
- Secure login/signup with **Doctor** and **Patient** role selection
- Role-based routing — Doctors and Patients see different dashboards
- **Google OAuth Integration** via Supabase Auth (with role preservation)

### 🧑‍⚕️ Patient Dashboard
- **Overview stats** — Upcoming appointments, active prescriptions, last checkup date
- **Appointment management** — View, book, and cancel appointments
- **Medical history timeline** — Chronological view of all past visits and diagnoses
- **Prescriptions viewer** — List of active and past medications with dosage details

### 👨‍💼 Doctor Dashboard
- **Availability toggle** — Go online/offline to accept new appointments
- **Today's schedule** — Real-time list of today's appointments with patient details
- **Patient management** — Quick access to patient profiles and history
- **Quick stats** — Total patients today, completed sessions, pending appointments

### 📅 Appointment Booking System
- Patients can browse available doctors filtered by specialty
- Real-time doctor availability check
- Appointment status tracking (Pending → Confirmed → Completed)

### 📱 Responsive Design
- Fully mobile-friendly — bottom navigation bar on mobile
- Responsive grid layout adapts from desktop to tablet to phone

---

## 🎨 UI Design (Figma)

> 🔗 **Figma Link:** https://www.figma.com/make/bNHb0WOazpOyZOQRn56KTP/Design-VitalSync-Healthcare-App?t=aFNm27O9urQmuqbm-1

### Screens Designed:
1. **Login / Landing Page** — Split screen with role selector (Patient / Doctor)
2. **Patient Dashboard** — Stats, appointments, medical history timeline
3. **Doctor Dashboard** — Availability toggle, today's schedule, patient list

### Design System:
- **Primary Color:** `#2563EB` (Blue)
- **Background:** `#FFFFFF` / `#F8FAFC`
- **Success/Online:** `#10B981` (Green)
- **Danger/Alert:** `#EF4444` (Red)
- **Font:** Inter (Regular, Medium, SemiBold, Bold)
- **Border Radius:** 12px on cards, 8px on inputs

---

## 🗂️ Architecture Diagram (State Tree)


| ![VitalSync Global Store architecture diagram showing four main Zustand stores: authStore managing user authentication with state for id, name, email, role, isAuthenticated, and isLoading; appointmentStore handling appointments with state for appointments array, upcomingList, and selectedId; doctorStore managing doctor availability with state for doctors array, isAvailable boolean, and todaySchedule; patientStore containing medical records with state for medicalHistory and prescriptions arrays. Each store is connected to its respective Supabase backend endpoint for data synchronization. The diagram uses color-coded boxes: blue for authStore, green for appointmentStore, purple for doctorStore, and orange for patientStore, displaying the hierarchical relationship and data flow between frontend state management and database operations.](diagram/Untitled%20Diagram.drawio.png) |



### Zustand Store Structure (Planned):

```
Store
├── authStore
│   ├── user (id, name, email, role)
│   ├── isAuthenticated
│   └── actions: login(), logout(), setRole()
│
├── appointmentStore
│   ├── appointments[]
│   ├── upcomingAppointments[]
│   ├── selectedAppointment
│   └── actions: fetchAppointments(), bookAppointment(), cancelAppointment()
│
├── doctorStore
│   ├── doctors[]
│   ├── isAvailable (toggle)
│   ├── todaySchedule[]
│   └── actions: toggleAvailability(), fetchSchedule()
│
└── patientStore
    ├── medicalHistory[]
    ├── prescriptions[]
    └── actions: fetchHistory(), fetchPrescriptions()
```

### Planned API Endpoints (Supabase):

| Endpoint | Method | Description |
|---|---|---|
| `/auth/login` | POST | User login |
| `/appointments` | GET | Fetch all appointments |
| `/appointments` | POST | Book new appointment |
| `/appointments/:id` | PATCH | Update appointment status |
| `/doctors` | GET | Fetch available doctors |
| `/doctors/:id/availability` | PATCH | Toggle doctor availability |
| `/patients/:id/history` | GET | Fetch medical history |
| `/patients/:id/prescriptions` | GET | Fetch prescriptions |

---

## 📁 Planned Project Structure

```
prodesk-capstone-VitalSync/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── dashboard/
│   │   ├── patient/page.tsx
│   │   └── doctor/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/          (Shadcn components)
│   ├── shared/      (Navbar, Sidebar)
│   └── dashboard/   (Cards, Charts, Tables)
├── store/
│   ├── authStore.ts
│   ├── appointmentStore.ts
│   └── doctorStore.ts
├── lib/
│   └── supabase.ts
└── types/
    └── index.ts
```

## 👤 Intern Details

- **Name:** Ayush Vyas
- **Email:** s.ayushvyas3925@gmail.com
- **Track:** Frontend
- **Program:** Prodesk IT Internship — Capstone Phase

---



