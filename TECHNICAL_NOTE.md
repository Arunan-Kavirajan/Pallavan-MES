# Technical Note

## What I Built
I built a complete, offline-first production tracking Progressive Web App (PWA) utilizing React, TypeScript, and Dexie.js (IndexedDB). It encompasses the entire specified workflow: creating forms, real-time metrics calculation, multi-stage approval (Draft -> Submit -> Approve/Return), role-based secure login, and PDF/Excel export.

I also successfully implemented both stretch goals and beyond:
1. **Digital Signatures**: Canvas-based signature capture for Supervisors upon approval, injected into the audit log and PDF exports.
2. **Summary Analytics**: Recharts-based data visualizations breaking down rejection rates by machine and pareto charts for rejection reasons.
3. **True Dual-Engine Sync**: The app functions 100% offline using IndexedDB, and automatically syncs to Firebase Firestore in the background the moment internet is restored.
4. **PWA Installation**: The app is fully installable as a standalone PWA on mobile devices and desktop.

## Unstated Assumptions & Logical Gap Resolutions
During development, I identified several deliberate gaps in the specification and addressed them logically to make the application "bulletproof":

1. **Division by Zero (0 Produced / 0 Planned)**: The spec defined `(Rejected / Produced) * 100`. If an operator produced 0 parts, this throws a `NaN`. I implemented safe math utilities that return `0.0%` in these physical edge cases.
2. **Rejected > Produced Boundary**: The spec didn't strictly forbid rejecting more parts than were produced. I added a hard validation rule preventing `Rejected > Produced`, as negative accepted quantities represent an impossible physical state on the shop floor.
3. **Dirty Data Retention**: If an operator enters 30 mins downtime, selects "Belt Snap", and later corrects downtime to 0, leaving "Belt Snap" in the database pollutes analytics. I implemented an auto-clear effect for conditional reasons when their trigger values hit zero.
4. **Shift C Midnight Rollover**: Shift C runs 22:00-06:00. To prevent date-splitting confusion in exports, I designated `entryDate` as the unified "Shift Date", and labeled the midnight-crossing slots with `(+1d)` in the UI.

## What I Would Change Given Another Week (Future Improvements)
If given more time, I would focus on data continuity and advanced administration:
1. **Super Admin Role & Data Portability**: Because the offline-first architecture relies on IndexedDB, data is tied to the specific browser session. If a user switches browsers or devices before syncing, the local queue is inaccessible. I would introduce a `Super Admin` role with the ability to export the entire IndexedDB state to a `.json` file and import it on another device to seamlessly resume operations.
2. **Automated Local Backups**: To prevent accidental data loss if a browser's cache is cleared before a cloud sync occurs, I would automate the local backup process (e.g., automatically downloading an encrypted backup file to the device's local file system or leveraging the File System Access API for persistent local saving).
3. **E2E Testing**: Implement E2E testing using Playwright to test the multi-tab, offline/online network toggle workflows programmatically.

## Honest Assessment
**Strengths**: The domain modeling is robust. The offline background-sync engine elegantly solves factory connectivity issues, and the PWA capabilities allow for true native-like deployment on factory tablets. The UI/UX is tailored for industrial environments with quick-copy functionality for operators.
**Weaknesses**: The offline-first architecture necessitates careful local storage management. If a factory runs the app exclusively locally (without Firebase) on a shared device, catastrophic hardware failure of that device would result in data loss without the automated backups mentioned in the future improvements.
