# HomeGuard 🏠

> A full-stack home maintenance tracker — know what needs fixing, when it's due, and what you've spent.

Most homeowners have no system for home maintenance. They forget when the HVAC filter was last changed, lose track of warranty expiry dates, and have no idea what they've spent on repairs over the year. HomeGuard solves this with a clean, modern web app that tracks everything in one place and sends reminders before things go wrong.

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=flat-square&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?style=flat-square&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Auth Flow](#auth-flow)

---

## Features

### Core
- **Multi-property support** — track multiple homes, apartments, or rental properties under one account
- **Appliance registry** — log every appliance with brand, model, serial number, purchase date, and cost
- **Maintenance scheduling** — create recurring tasks (e.g. replace HVAC filter every 90 days) with flexible frequency presets
- **Warranty tracker** — dedicated page showing all warranties, highlighted by expiry status
- **Task completion logging** — mark tasks done, log actual cost and notes; next due date auto-calculates
- **Email reminders** — automated daily background job sends reminder emails X days before a task is due
- **In-app notifications** — notification bell shows due and overdue tasks in real time

### Dashboard
- Home health score (percentage of tasks completed on time)
- Overdue task count with visual alerts
- Upcoming tasks in the next 30 days
- Annual maintenance cost tracking
- Quick-action links

### Auth
- Google OAuth via NextAuth.js — one-click sign in, no passwords to manage
- JWT-based API authentication between frontend and backend
- Session persistence across page reloads

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 (App Router) | UI framework, routing, API routes |
| Frontend | TypeScript | Type safety |
| Frontend | Tailwind CSS | Styling |
| Frontend | Framer Motion | Animations and transitions |
| Frontend | React Query | Server state, caching, refetching |
| Frontend | React Hook Form + Zod | Form handling and validation |
| Frontend | NextAuth.js | Google OAuth session management |
| Backend | FastAPI (Python) | REST API |
| Backend | SQLAlchemy | ORM |
| Backend | Pydantic | Request/response validation |
| Backend | APScheduler | Background job scheduling for reminders |
| Backend | python-jose | JWT creation and verification |
| Database | PostgreSQL (Neon) | Primary data store |
| Email | Resend | Transactional reminder emails |
| Deployment | Vercel | Frontend hosting |
| Deployment | Railway | Backend hosting |

---

## Architecture

```
┌──────────────────────────────────────────────┐
│              Browser (User)                  │
└─────────────────────┬────────────────────────┘
                      │ HTTPS
┌─────────────────────▼────────────────────────┐
│         Next.js Frontend (Vercel)            │
│                                              │
│  ┌─────────────┐   ┌──────────────────────┐  │
│  │  App Pages  │   │  /api/auth/[...next] │  │
│  │  dashboard  │   │  NextAuth.js handler │  │
│  │  properties │   └──────────┬───────────┘  │
│  │  appliances │              │               │
│  │  tasks      │   React Query│ fetches       │
│  │  warranties │              │               │
│  │  notifs     │              │               │
│  └──────┬──────┘              │               │
└─────────┼─────────────────────┼───────────────┘
          │ REST + JWT          │ POST /auth/google
          │                     │ (exchanges Google
          │                     │  token for app JWT)
┌─────────▼─────────────────────▼───────────────┐
│           FastAPI Backend (Railway)            │
│                                               │
│  ┌──────────────────────────────────────────┐ │
│  │              API Routers                 │ │
│  │  /auth  /properties  /appliances         │ │
│  │  /tasks  /warranties  /dashboard         │ │
│  │  /notifications                          │ │
│  └──────────────────┬───────────────────────┘ │
│                     │                         │
│  ┌──────────────────▼───────────────────────┐ │
│  │         APScheduler (Background)         │ │
│  │   Runs daily at 9am UTC                  │ │
│  │   Checks tasks due soon / overdue        │ │
│  │   Sends emails via Resend                │ │
│  │   Creates in-app notifications           │ │
│  └──────────────────────────────────────────┘ │
└─────────────────────┬─────────────────────────┘
                      │ SQLAlchemy ORM
┌─────────────────────▼─────────────────────────┐
│            PostgreSQL (Neon)                  │
│                                               │
│  users · properties · appliances             │
│  maintenance_tasks · maintenance_logs         │
│  notifications                                │
└───────────────────────────────────────────────┘
```

---

## Project Structure

```
homeguard/
│
├── frontend/                          # Next.js application
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── layout.tsx             # Root layout, providers
│   │   │   ├── globals.css            # Global styles, design tokens
│   │   │   ├── api/auth/[...nextauth] # NextAuth.js API route
│   │   │   ├── auth/signin/           # Custom sign-in page
│   │   │   ├── dashboard/             # Main dashboard
│   │   │   ├── properties/            # Property management
│   │   │   ├── appliances/            # Appliance tracking
│   │   │   ├── tasks/                 # Maintenance task scheduler
│   │   │   ├── warranties/            # Warranty expiry tracker
│   │   │   └── notifications/         # In-app notifications
│   │   │
│   │   ├── components/
│   │   │   └── providers/
│   │   │       ├── session-provider.tsx  # NextAuth session wrapper
│   │   │       └── query-provider.tsx    # React Query client
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                 # All API calls (Axios)
│   │   │   └── utils.ts              # Formatting, constants, helpers
│   │   │
│   │   └── types/
│   │       └── index.ts              # Shared TypeScript types
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── vercel.json
│   └── .env.example
│
├── backend/                           # FastAPI application
│   ├── main.py                        # App entry point, middleware, startup
│   ├── database.py                    # SQLAlchemy engine and session
│   ├── requirements.txt
│   ├── railway.toml                   # Railway deployment config
│   ├── Procfile
│   │
│   ├── core/
│   │   ├── config.py                  # Pydantic settings (reads from .env)
│   │   └── security.py               # JWT creation and verification
│   │
│   ├── models/
│   │   └── models.py                  # SQLAlchemy ORM models
│   │
│   ├── schemas/
│   │   └── schemas.py                 # Pydantic request/response schemas
│   │
│   ├── routers/
│   │   ├── auth.py                    # Google OAuth token exchange
│   │   ├── properties.py              # Property CRUD
│   │   ├── appliances.py              # Appliance CRUD
│   │   ├── tasks.py                   # Task CRUD + mark complete
│   │   ├── warranties.py              # Warranty listing and alerts
│   │   ├── dashboard.py               # Aggregated stats + upcoming tasks
│   │   └── notifications.py           # In-app notification management
│   │
│   ├── jobs/
│   │   └── reminders.py               # APScheduler daily reminder job
│   │
│   └── .env.example
│
├── SETUP.md                           # Full deployment guide
├── README.md
└── .gitignore
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL database — create a free one at [neon.tech](https://neon.tech)
- Google OAuth credentials — create at [console.cloud.google.com](https://console.cloud.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/homeguard.git
cd homeguard
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be running at `http://localhost:8000`
Interactive API docs at `http://localhost:8000/docs`

**Getting a dev token for API testing:**
```bash
# With venv activated
python3 -c "
from core.security import create_access_token
token = create_access_token({'sub': '1'})
print(token)
"
```
Paste the token into the Authorize button in Swagger UI.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Start the dev server
npm run dev
```

The app will be running at `http://localhost:3000`

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string from Neon |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `JWT_SECRET` | Any long random string — used to sign JWTs |
| `RESEND_API_KEY` | From resend.com (optional, needed for emails) |
| `FRONTEND_URL` | `http://localhost:3000` in dev, Vercel URL in prod |
| `ENVIRONMENT` | `development` or `production` |

### Frontend — `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | `http://localhost:3000` in dev, Vercel URL in prod |
| `NEXTAUTH_SECRET` | Random string — run `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Same as backend |
| `GOOGLE_CLIENT_SECRET` | Same as backend |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` in dev, Railway URL in prod |

---

## API Reference

All endpoints except `/auth/google` and `/health` require a `Bearer` token in the `Authorization` header.

```
GET    /health                        Health check

POST   /auth/google                   Exchange Google ID token → app JWT
GET    /auth/me                       Get current user profile

GET    /properties/                   List all properties
POST   /properties/                   Create property
PATCH  /properties/{id}               Update property
DELETE /properties/{id}               Delete property

GET    /appliances/                   List appliances (filter: ?property_id=)
POST   /appliances/                   Create appliance
PATCH  /appliances/{id}               Update appliance
DELETE /appliances/{id}               Delete appliance

GET    /tasks/                        List tasks (filter: ?overdue_only=true)
POST   /tasks/                        Create task
PATCH  /tasks/{id}                    Update task
DELETE /tasks/{id}                    Delete task
POST   /tasks/{id}/complete           Mark complete + log entry
GET    /tasks/{id}/logs               Get completion history

GET    /warranties/                   List all warranties with status
GET    /dashboard/stats               Aggregated dashboard stats
GET    /dashboard/upcoming-tasks      Tasks due in next N days

GET    /notifications/                List notifications
PATCH  /notifications/{id}/read       Mark single notification read
POST   /notifications/read-all        Mark all notifications read
```

Full interactive documentation available at `/docs` when running locally.

---

## Auth Flow

```
1. User clicks "Continue with Google"
2. NextAuth redirects to Google OAuth consent screen
3. Google authenticates user and redirects back to:
   /api/auth/callback/google
4. NextAuth receives Google ID token
5. NextAuth calls backend: POST /auth/google { id_token }
6. Backend verifies token with Google's servers
7. Backend finds or creates user in database
8. Backend returns signed JWT
9. NextAuth stores JWT in encrypted session cookie
10. All subsequent API calls attach JWT as Authorization: Bearer <token>
11. Backend verifies JWT on every protected request
```

---