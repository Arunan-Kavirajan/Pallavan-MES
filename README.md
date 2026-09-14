# Pallavan Precision Works MES

An enterprise-grade Manufacturing Execution System (MES) designed specifically for factory floors. It enables operators, supervisors, and managers to track production output, monitor machine efficiency, and ensure quality control—even in environments with unreliable internet connections.

## ??? Core Architecture

This application is built with a rigorous **Offline-First** philosophy. 

### The Engine
* **Frontend:** React 19 + TypeScript + Tailwind CSS + Vite
* **Local Database:** Dexie.js (IndexedDB wrapper)
* **Cloud Database:** Firebase Firestore
* **Reactivity:** `dexie-react-hooks` (`useLiveQuery`)

### ? True 2-Way Offline Sync
We developed a proprietary sync engine that perfectly resolves the "Offline Factory" problem:
1. **Local Writes:** Operators save entries to IndexedDB (local storage). The app remains lightning fast, instantly updating the UI with `useLiveQuery`.
2. **Cloud Push (Background):** A sync worker continuously monitors IndexedDB for `pending` entries and attempts to push them to Firebase Firestore. If the network goes down, they sit safely on the device.
3. **Cloud Pull (Realtime):** The app maintains an `onSnapshot` listener with Firebase. The moment another device syncs an entry, this listener beams the payload down and invisibly merges it into the local IndexedDB. 

## 🛡️ Role-Based Access Control (RBAC)

The system enforces strict hierarchical access:
* **Operators (OP-01, OP-02):** Can only view and edit their *own* entries. Can save entries as "Drafts" to edit later before submitting.
* **Supervisors (SUP-01):** Have bird's-eye view of all submitted operator entries. Can review, approve, or reject entries. They *cannot* see Operator Drafts.
* **Managers (MGR-01):** Have full supervisor access, plus exclusive access to the **Analytics Dashboard** and the **Export Data** tab.

## ?? Key Polish Features

* **Global Error Boundary:** In the event of a fatal data mutation or corruption, the app gracefully traps the crash and displays a recovery UI, preventing the dreaded "White Screen of Death".
* **Loading Skeletons:** Implemented buttery smooth UX loading states that display while the IndexedDB queries populate the initial dashboard.
* **Service Worker (PWA):** Instantly caches the React build so that if the internet dies, users don't see the Chrome Dinosaur page upon accidental refresh.

## ?? Getting Started

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build
```

## ?? Demo Credentials
* Universal PIN: `apex123`
* Operator IDs: `OP-01`, `OP-02`
* Supervisor ID: `SUP-01`
* Manager ID: `MGR-01`
