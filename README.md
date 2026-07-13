# JY SCHOOL — Student Management System

A full-stack, production-ready **Student Management System** for JY School, with role-based dashboards for **Admin**, **Teacher**, **Student**, and **Parent**.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + React Router + React Query + Recharts
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **File Uploads**: Multer
- **Email**: Nodemailer

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL running on port 5432

### 1. Clone / open the project
```bash
cd "Raj Software"
```

### 2. Setup environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your DB credentials and email settings
```

### 3. Install & migrate
```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed

# Frontend
cd ../frontend
npm install
```

### 4. Run dev servers
```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

### 5. Default Login Credentials (after seed)
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@rajacademy.com | Admin@123 |
| Teacher | teacher@rajacademy.com | Teacher@123 |
| Student | student@rajacademy.com | Student@123 |
| Parent | parent@rajacademy.com | Parent@123 |

## Docker Deployment

```bash
docker-compose up --build
```

Visit `http://localhost:3000`

## Project Structure

```
Raj Software/
├── frontend/         # React + Vite + TypeScript
├── backend/          # Node.js + Express + Prisma
├── docker-compose.yml
└── README.md
```

## Modules

- ✅ Authentication (JWT, RBAC, Password Reset)
- ✅ Student Management (CRUD, CSV Import/Export)
- ✅ Teacher Management (CRUD, Subject Assignment)
- ✅ Class & Subject Management
- ✅ Attendance (Daily marking, Reports, Analytics)
- ✅ Examinations & Grades (Report Card PDF)
- ✅ Timetable (Drag-and-drop builder, Conflict detection)
- ✅ Fee Management (Invoices, Overdue tracking)
- ✅ Communication (Announcements, Real-time Messaging)
- ✅ Dashboards & Analytics (Role-specific, Recharts)
- ✅ Settings & Reports (PDF/Excel export)
