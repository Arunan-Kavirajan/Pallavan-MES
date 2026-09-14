# Pallavan Precision Works - Shift Production Entry System

A production-grade, offline-first Manufacturing Execution System (MES) application built for the ApexFlow Technologies Technical Assignment.

## Features Implemented
- **Full Specification Coverage**: Complete form, validation rules, live calculations, and role-based access control.
- **Offline-First Architecture**: Uses Dexie.js (IndexedDB) for robust offline capture, caching, and network sync queueing.
- **Offline Simulation Mode**: A built-in toggle in the Navbar lets you simulate network loss and test offline functionality instantly without touching your OS settings.
- **Smart Validation Engine**: Enforces all edge cases (division by zero, negative integers, 60-min downtime limits, and dynamic 10% rejection remark rules).
- **Audit Trails & State Machine**: Immutable audit logs on every transition (`Draft` -> `Submitted` -> `Approved` / `Returned`).
- **Stretch Goals Achieved**: 
  1. **Digital Signatures**: HTML5 Canvas signature capture for Supervisor approvals.
  2. **Analytics & Summary View**: Recharts-powered dashboard showing Rejection Rates (by machine/part) and Downtime Pareto analysis.
- **Export Engine**: Export full production data with calculations to **Excel (.xlsx)** and **Formatted PDF**.

## Setup & Run Instructions

This project runs with zero external backend or cloud dependencies (no Firebase API key hassle) making it effortless to evaluate.

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
# (Navigate to the project folder)

# Install dependencies
npm install

# Run the development server
npm run dev
```

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
