# 🏋️ Gym Attendance System

A full-stack gym attendance management system with **QR-based check-in**, **role-based access control (RBAC)**, and **replay-attack prevention**.

---

## 🏗️ Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────────────┐
│   Next.js Frontend  │────▶│   FastAPI Backend (REST)     │
│   (React + Tailwind)│     │   JWT Auth + RBAC            │
└─────────────────────┘     └──────────┬───────────────────┘
                                       │
                              ┌────────▼────────┐
                              │   PostgreSQL     │
                              │   (Neon Cloud)   │
                              └─────────────────┘
```

### Roles

| Role       | Capabilities                                                    |
|------------|-----------------------------------------------------------------|
| **Admin**    | Manage all users, view all attendance, assign trainers, export |
| **Trainer**  | View assigned trainees, manually mark attendance               |
| **Customer** | Generate QR pass, view own attendance history                  |

---

## 🔐 Replay-Attack Prevention

The QR pass system uses **short-lived JWTs with JTI tracking**:

1. **Token Generation**: Customer requests a QR token valid for 30 seconds
2. **Unique JTI**: Each token gets a UUID `jti` (JWT ID) claim
3. **One-Time Use**: On scan, the `jti` is stored in the `used_tokens` table
4. **Replay Detection**: If a `jti` is seen again, the request is rejected with `409 Conflict`
5. **Auto-Rotation**: The frontend generates a new QR every 30 seconds

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL (or use Neon cloud)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

### Docker (Both Services)

```bash
docker-compose up --build
```

- **Backend**: http://localhost:8000 (API docs at `/docs`)
- **Frontend**: http://localhost:3000

---

## 📡 API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint     | Description          | Auth     |
|--------|-------------|----------------------|----------|
| POST   | `/register` | Create a new account | Public   |
| POST   | `/login`    | Get JWT token        | Public   |
| GET    | `/me`       | Current user profile | Bearer   |

### Attendance (`/api/v1/attendance`)

| Method | Endpoint        | Description               | Auth              |
|--------|----------------|---------------------------|-------------------|
| GET    | `/qr-token`    | Generate QR pass token    | Customer only     |
| POST   | `/verify`      | Verify & check-in via QR  | Public (kiosk)    |
| POST   | `/manual-mark` | Manually mark attendance  | Trainer / Admin   |
| GET    | `/logs`        | Get attendance history    | Role-scoped       |

### Users (`/api/v1/users`)

| Method | Endpoint                 | Description              | Auth       |
|--------|-------------------------|--------------------------|------------|
| GET    | `/`                     | List all users           | Admin      |
| GET    | `/{id}`                 | Get user by ID           | Admin      |
| PATCH  | `/{id}`                 | Update user              | Admin      |
| POST   | `/{id}/assign-trainer`  | Assign trainer           | Admin      |
| GET    | `/trainers/trainees`    | Get assigned trainees    | Trainer    |

---

## 🧪 Running Tests

```bash
cd backend
pytest -v
```

Tests cover:
- ✅ User registration and login
- ✅ JWT payload validation
- ✅ QR token generation and verification
- ✅ Replay attack prevention (409 on reuse)
- ✅ RBAC permission enforcement
- ✅ Attendance log scoping by role

---

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers and dependencies
│   │   ├── core/          # Config, security (JWT, bcrypt)
│   │   ├── db/            # SQLAlchemy engine and base
│   │   ├── models/        # ORM models (User, Attendance, UsedToken)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   └── main.py        # FastAPI entrypoint
│   └── tests/             # Pytest test suite
│
├── frontend/
│   └── src/
│       ├── app/           # Next.js App Router pages
│       ├── components/    # Reusable UI components
│       ├── lib/           # API client, utilities
│       └── types/         # TypeScript interfaces
│
└── docker-compose.yml     # One-command deployment
```

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | FastAPI, SQLAlchemy, Pydantic       |
| Auth       | JWT (python-jose), bcrypt (passlib) |
| Database   | PostgreSQL (Neon)                   |
| Frontend   | Next.js 14, React 18, TypeScript    |
| Styling    | Tailwind CSS                        |
| QR Code    | qrcode.react, html5-qrcode         |
| Testing    | Pytest, SQLite (in-memory)          |
| Deploy     | Docker Compose                      |
