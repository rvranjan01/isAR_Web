# Immverse — AR Client & Admin Portal

A full-stack repository for Immverse Studios: a React + TypeScript client/admin portal (frontend/) and an Express + TypeScript API server (backend/) used to manage 3D model production, client orders, subscriptions and Web AR QR codes.

## What the project does

- Provides a passwordless client experience (Email + Order ID) to track 3D model production and access scannable Web AR QR codes.
- Provides an admin portal to manage incoming orders, upload 3D model files (.glb/.gltf/.usdz), advance pipeline stages, and manage subscriptions.

## Key features

- Passwordless authentication for clients and admin flows
- Project / order tracking and file uploads for 3D assets
- Subscription management and notification endpoints
- Swappable front-end service layer supporting mock mode for local development

## Tech stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express 5, TypeScript, Mongoose (MongoDB)
- Auth: JWT for API authentication
- Files: Multer-powered uploads served from `/uploads`

## Quick start

Prerequisites:

- Node.js (v20+ recommended)
- npm (v10+ recommended)
- MongoDB (local or remote)

1. Clone the repo

```bash
git clone <your-repo-url>
cd <repo-root>
```

2. Backend — install and run

```bash
cd backend
npm install

# create a .env file (example below)
```

Create `backend/.env` with at least:

```env
MONGODB_URI=mongodb://localhost:..............
PORT=3000
JWT_SECRET=your_jwt_secret_here
```

Run in development:

```bash
npm run dev
```

Build + run production:

```bash
npm run build
npm start
```

The API will be available at `http://localhost:3000` by default.

3. Frontend — install and run

```bash
cd ../frontend
npm install

# create a .env file (example below)
```

Create `frontend/.env` with recommended values:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK_API=true
```

Run the dev server:

```bash
npm run dev
```

Open the app at `http://localhost:5173` (Vite default).

## Environment modes

- Development with mock API: set `VITE_USE_MOCK_API=true` in `frontend/.env` to use in-memory mocked data (no backend required).
- Production mode: set `VITE_USE_MOCK_API=false` and point `VITE_API_BASE_URL` to your running backend.

## Useful scripts

- Backend: `npm run dev` (dev), `npm run build` (tsc), `npm start` (prod)
- Frontend: `npm run dev` (vite), `npm run build` (tsc + vite build), `npm run preview` (preview build)

## Where to get help

- Project docs and planning are in the repository root: `prd.md`, `Architecture.md`, `phases.md`, `design.md`, `rules.md`, `memory.md`.
- For frontend-specific details see `frontend/README.md`.
- For backend-specific code see the `backend/src/` folder and route controllers.


## Maintainers & License

- Maintainers: Immverse Studios (see `package.json` files under `frontend/` and `backend/` for project metadata)

---