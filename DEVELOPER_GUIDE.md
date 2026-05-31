# Developer Guide: Nails & Lashes Lane System

Welcome to the Nails & Lashes Lane Management System repository. This guide covers setup, project architecture, configurations, and core programming flows for development.

---

## 1. System Architecture

The project is structured as a monorepo using npm workspaces:
- **`backend`**: Express REST API server utilizing Prisma ORM to communicate with a PostgreSQL database.
- **`frontend`**: Single Page Application built with React, Vite, and TypeScript, styled with custom premium vanilla CSS.

```
Nails-Salon-System/
├── backend/                  # REST API & DB Schema
│   ├── prisma/
│   │   └── schema.prisma     # Prisma DB models
│   ├── src/
│   │   └── index.ts          # Express Server & Endpoints
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Client UI
│   ├── src/
│   │   ├── pages/            # View Portals & Tabs
│   │   ├── App.tsx           # Router & App Shell
│   │   ├── main.tsx
│   │   └── types.ts          # Shared UI Types
│   ├── package.json
│   └── tsconfig.json
├── package.json              # Monorepo Workspace Config
└── docker-compose.yml        # PostgreSQL Dev Instance
```

---

## 2. Dev Environment Setup

### Prerequisites
- **Node.js**: v18 or later
- **npm**: v9 or later
- **Docker**: Optional, for running PostgreSQL locally

### Installation
From the project root directory, run npm install. Workspaces will automatically link and resolve dependencies:
```bash
npm install
```

### Environment Configurations
Create configuration files for the backend and frontend.

#### Backend Env Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=5001
JWT_SECRET=your-secure-development-jwt-key
DATABASE_URL="postgresql://user:password@localhost:5432/nailssalon?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/nailssalon?schema=public"
```

#### Frontend Env Setup
Create a `.env` or `.env.local` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5001
```

### Database Initialization
If using Docker, start the local database container:
```bash
npm run db:up
```

Run Prisma migrations to generate client libraries and push the tables into Postgres:
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## 3. Running the Application

You can spin up both the backend and frontend simultaneously from the root directory:
```bash
npm run dev
```

Alternatively, run them separately:
- **Backend**: `npm run backend:dev` (runs on `http://localhost:5001`)
- **Frontend**: `npm run frontend:dev` (runs on `http://localhost:5173`)

---

## 4. Key Workflows & Code Files

### Unified Authentication & Redirect Guards
- All login flows are directed to the `/login` path, processed in [LoginPortal.tsx](file:///Users/andresfolder/Documents/Coding%20Practice/Nails-Salon-System/frontend/src/pages/LoginPortal.tsx).
- Redirection guards in [App.tsx](file:///Users/andresfolder/Documents/Coding%20Practice/Nails-Salon-System/frontend/src/App.tsx) automatically reroute unauthenticated visits to protected pages (`/admin` and `/owner`) back to the unified portal.
- Tokens are kept in `sessionStorage` for secure session tracking and automatically deleted on tab close.

### Backend Endpoints & JWT Validation
- **Token Verification**: [index.ts](file:///Users/andresfolder/Documents/Coding%20Practice/Nails-Salon-System/backend/src/index.ts) uses a `verifyJWT` middleware verifying signature keys and adding user role/ID payload metadata to incoming request headers.
- **Prisma Schema**: Models for branches, employees, waitlists, scheduling, and inventory are defined inside [schema.prisma](file:///Users/andresfolder/Documents/Coding%20Practice/Nails-Salon-System/backend/prisma/schema.prisma).
