## Care-AI – Digital Health Wallet

A full-stack health wallet application that allows users to upload medical reports, track vitals, and share reports with family members, doctors, and friends.

### 🛠️ Technology Stack

- **Frontend:** ReactJS with TypeScript, Vite, TailwindCSS
- **Backend:** Node.js (Express.js)
- **Database:** SQLite (better-sqlite3)
- **ORM:** Drizzle ORM
- **Authentication:** Passport.js with Local Strategy

### 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize the database:**
   ```bash
   npm run db:init
   ```
   This will create the SQLite database file (`health_wallet.db`) with all required tables.
   
   Alternatively, you can use drizzle-kit:
   ```bash
   npm run db:push
   ```

3. **Run the application:**
   
   **Option A: Run both backend and frontend together (recommended for development)**
   ```bash
   npm run dev
   ```
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:5000 (served by Vite middleware)

   **Option B: Run backend and frontend separately**
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend
   npm run dev:frontend
   ```
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:3000 (proxies API requests to backend)

4. **Default login credentials:**
   - Username: `admin`
   - Password: `admin123`

### 📦 Build for Production

```bash
# Build both frontend and backend
npm run build

# Or build separately
npm run build:frontend
npm run build:backend

# Start production server
npm start
```

### 🔧 Configuration

The application uses SQLite by default. The database file (`health_wallet.db`) will be created automatically in the project root when you first run the app.

You can customize settings by creating a `.env` file (see `.env.example` for reference):

```env
DATABASE_URL=./health_wallet.db
SESSION_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

### 📁 Project Structure

```
Care-AI/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and configs
│   └── index.html
├── server/              # Backend Express application
│   ├── index.ts         # Express server entry point
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication setup
│   ├── db.ts            # Database connection
│   └── storage.ts       # Database operations
├── shared/              # Shared types and schemas
│   ├── schema.ts        # Drizzle ORM schema
│   └── routes.ts        # API route definitions
└── dist/                # Build output (generated)
```

Backend entry point and modules:

- **Entry**: `server/index.ts` – sets up Express, logging, JSON parsing and wires:
  - `registerRoutes` from `server/routes.ts` for API routes.
  - `serveStatic` from `server/static.ts` in production.
  - `setupVite` from `server/vite.ts` in development.
- **Shared types/routes**: `shared/routes.ts`, `shared/schema.ts` – imported in both backend and frontend via the `@shared` alias.

**Frontend (React + Vite)**

- **Entry HTML**: `client/index.html`
- **React entry**: `client/src/main.tsx` – mounts `App` to `#root`.
- **Root App component**: `client/src/App.tsx` – sets up:
  - Routing (`wouter`) with protected routes.
  - React Query (`QueryClientProvider`).
  - UI providers (`TooltipProvider`, `Toaster`).

Vite configuration and module aliases:

- `vite.config.ts`:
  - `root` is `client`.
  - Build output goes to `dist/public`.
  - Aliases:
    - `@` → `client/src`
    - `@shared` → `shared`
    - `@assets` → `attached_assets` (only used if you import from `@assets/...`).
- `tsconfig.json`:
  - Mirrors these aliases with `"paths"` so TypeScript understands `@/...` and `@shared/...` imports.

**Running locally**

1. Install dependencies:
   - `npm install`
2. Development options:
   - Backend only: `npm run dev:backend`
   - Frontend only: `npm run dev:frontend`
   - Combined (API + UI on one port): `npm run dev`
3. Build and run production:
   - `npm run build` (or individually with `build:frontend` / `build:backend`)
   - `npm start`

On Windows, environment variables are handled via `cross-env` in all scripts, so you can run the same commands in PowerShell or CMD.


