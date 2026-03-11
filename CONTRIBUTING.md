# CONTRIBUTING

## Branch Policy
- Booking team: use branches `feature/booking-*`
- Quiz team: use branches `feature/quiz-*`
- Do not push directly to `main`

## Ownership
- Booking team owns:
  - `frontend/src/pages/Booking*`
  - `frontend/src/pages/Dashboard.jsx`
  - `frontend/src/pages/PrintLetter.jsx`
- Quiz team owns:
  - `frontend/src/pages/Quiz*`
  - `backend/quiz*`

## Shared Files (coordinate before edit)
- `frontend/src/App.jsx`
- `frontend/src/components/Layout.jsx`
- `frontend/src/index.css`
- `backend/server.js`

## Encoding Rules
- All source files must be UTF-8 (prefer no BOM)
- Do not paste text from unknown encodings
- If text looks corrupted (`U+FFFD`, `A-tilde patterns`, `UTF-8 mojibake`), fix encoding before commit

## Conflict Prevention Checklist
- Pull latest `main` before starting work
- Rebase your branch before opening PR
- Keep PR scope small (one feature/fix per PR)
- Avoid mixing Booking and Quiz changes in the same PR
- Resolve conflicts locally and run app before pushing

## Pre-PR Checklist
- Run frontend build: `npm --prefix frontend run build`
- Verify routes in edited pages still work
- Confirm no corrupted characters in UI
- Confirm files are saved as UTF-8
