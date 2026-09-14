# Pallavan Precision Works - Shift Production Entry System

A production-grade, offline-first Manufacturing Execution System (MES) application built for the ApexFlow Technologies Technical Assignment.

## Features Implemented
- **Full Specification Coverage**: Complete form, validation rules, live calculations, and role-based access control (Operator, Supervisor).
- **Offline-First PWA Architecture**: Operates 100% offline via IndexedDB, and is fully installable as a standalone application on mobile and desktop devices.
- **Dynamic Cloud Sync Engine**: Runs fully locally out-of-the-box, but seamlessly connects to Firebase. When online, it actively beams local data to the cloud in the background. If the network drops, it queues changes and bursts them to the cloud upon reconnection.
- **Smart Validation & Auto-Fill**: Enforces all edge cases (division by zero, negative integers, 60-min downtime limits, and dynamic 10% rejection rules). Includes a Quick-Copy UI to instantly pull previous shift entry data to speed up workflows.
- **Audit Trails & State Machine**: Immutable audit logs on every transition (`Draft` -> `Submitted` -> `Approved` / `Returned`).
- **Stretch Goals Achieved**: 
  1. **Digital Signatures**: HTML5 Canvas signature capture for Supervisor approvals.
  2. **Analytics & Summary View**: Recharts-powered dashboard showing Rejection Rates (by machine/part) and Downtime Pareto analysis.
- **Export Engine**: Export full production data with calculations to **Excel (.xlsx)** and **Formatted PDF**.

## Setup & Run Instructions

This project is built to evaluate flawlessly. It defaults to a powerful local-first mode, meaning it requires **zero external cloud configuration** to boot up and test.

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
# (Navigate to the project folder)

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Firebase Cloud Sync (Optional)
The application operates flawlessly in a **Local-First Emulation Mode** (IndexedDB) out of the box so you can review it instantly with zero configuration. 

However, a production-ready **Firebase Cloud Sync** engine is fully built into the architecture (`src/services/firebaseService.ts`). To test live cloud syncing:
1. Create a `.env` file in the root directory.
2. Add your Firebase web configuration keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
3. Restart the dev server. The app will automatically detect the keys, exit emulation mode, and begin syncing approved records to a `production_entries` Cloud Firestore collection.

### Running Tests
Automated unit tests covering calculations, validations, and edge cases:
```bash
npm test
```

## Seeded Users & Testing Guide

For ease of testing, the top navigation bar includes a **Persona Switcher dropdown** pre-loaded with the 6 required seeded users. You can switch between them with one click.

### Operators (Create, Edit Drafts, Submit)
1. **Ramesh Kumar** (`OP-01`)
2. **Suresh Patel** (`OP-02`)

### Supervisors (Review all, Approve with signature, Return with remarks)
1. **Anitha Sharma** (`SUP-01`)
2. **Balaji Natarajan** (`SUP-02`)

### Managers (Read-only, Export Reports, View Analytics)
1. **Karthik Venkatesh** (`MGR-01`)
2. **Divya Murugan** (`MGR-02`)

## Architecture Highlights
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Data Persistence**: Dexie.js (IndexedDB wrapper) enabling offline-first reactivity.
- **Exports**: `xlsx` for Excel, `jspdf` & `jspdf-autotable` for PDFs.
- **Charts**: `recharts`

---
*Built for the ApexFlow Technologies Manufacturing Systems Programme.*
