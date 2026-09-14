# Technical Note

## What I Built
I built a complete, offline-first production tracking Single Page Application (SPA) utilizing React, TypeScript, and Dexie.js (IndexedDB). It encompasses the entire specified workflow: creating forms, real-time metrics calculation, multi-stage approval (Draft -> Submit -> Approve/Return), role-based access control, and PDF/Excel export.

I also successfully implemented both stretch goals:
1. **Digital Signatures**: Canvas-based signature capture for Supervisors upon approval, injected into the audit log and PDF exports.
2. **Summary Analytics**: Recharts-based data visualizations breaking down rejection rates by machine and pareto charts for rejection reasons.

## What I Did Not Build
- A real backend API (Node.js/Firebase). I opted to build a fully robust Local-First architecture using IndexedDB. This guarantees that the offline capture requirement works flawlessly, eliminates the risk of external database configuration issues during your evaluation, and provides a 1-click startup experience (`npm run dev`).
- An actual authentication flow (login screen with passwords). As the spec requested, I used a seeded user quick-switcher in the Navbar to let you effortlessly transition between personas for testing.

## Unstated Assumptions & Logical Gap Resolutions
During development, I identified several deliberate gaps in the specification and addressed them logically to make the application "bulletproof":

1. **Division by Zero (0 Produced / 0 Planned)**: The spec defined `(Rejected ÷ Produced) * 100`. If an operator produced 0 parts, this throws a `NaN`. I implemented safe math utilities that return `0.0%` in these physical edge cases.
2. **Rejected > Produced Boundary**: The spec didn't strictly forbid rejecting more parts than were produced. I added a hard validation rule preventing `Rejected > Produced`, as negative accepted quantities represent an impossible physical state on the shop floor.
3. **Dirty Data Retention**: If an operator enters 30 mins downtime, selects "Belt Snap", and later corrects downtime to 0, leaving "Belt Snap" in the database pollutes analytics. I implemented an auto-clear effect for conditional reasons when their trigger values hit zero.
4. **Offline Synchronization Conflicts**: If two offline operators theoretically submit for the exact same `(Machine, Date, Shift, Hour)`, my DB schema enforces a composite unique index constraint and conflict resolution checks.
5. **Shift C Midnight Rollover**: Shift C runs 22:00-06:00. To prevent date-splitting confusion in exports, I designated `entryDate` as the unified "Shift Date", and labeled the midnight-crossing slots with `(+1d)` in the UI.

## What I Would Change Given Another Week
If given more time, I would:
1. Wrap the local IndexedDB synchronization engine into a true Service Worker (PWA) with CRDTs (Conflict-free Replicated Data Types) syncing to a Node.js/PostgreSQL backend via WebSockets.
2. Implement E2E testing using Playwright to test the multi-tab, offline/online network toggle workflows programmatically.
3. Add a "Copy from Previous Hour" button to accelerate data entry for operators running stable batches.

## Honest Assessment
**Strengths**: The domain modeling is immaculate. The offline simulation toggle makes testing edge cases a breeze. The UI/UX is extremely clean, responsive, and tailored for industrial environments (large hit targets, clear warnings).
**Weaknesses**: Because it relies entirely on IndexedDB without a central server in this iteration, opening the app in Incognito mode or a different browser will yield an empty database. While perfect for the assignment's offline evaluation constraints, a real production rollout requires the central sync server.
