# Hormuud University LMS — Class Learning Management System

A full-stack LMS for a university where **students belong to a class**, **subjects belong to a class and a teacher**, and **teachers upload lesson documents** that only students of the matching class can read or download.

**Stack:** React + Vite + Tailwind + Axios + lucide-react (+ docx-preview / pptx-renderer for in-browser documents) · Node + Express · MongoDB + Mongoose · JWT + bcryptjs · Multer

```
Admin → creates Classes → adds Students (assigns Class) → adds Teachers → creates Subjects (assigns Class + Teacher)
Teacher → logs in → sees assigned Subjects → selects a Subject → uploads PDF / DOCX / PPTX lessons (drag & drop)
Student → logs in → sees only their Class's Subjects → opens a Subject → reads lessons in-browser (PDF, DOCX & PPTX) or downloads them
```

### UI / UX

- **Strict two-colour system** — solid green `#18A05A` (primary actions, highlights, success, selected) and solid blue `#3BA9D8` (secondary actions, links, info). No gradients, no other accent hues; neutral grey / white / dark only for text, borders and surfaces. Plus Jakarta Sans + Inter typography, soft shadows, rounded-2xl cards.
- Split-screen login / register with a branded panel.
- Dark navy sidebar with icons, avatar menu, responsive drawer for tablet / mobile.
- Skeleton loaders, empty states, and toast notifications (success / error) everywhere.
- Drag-and-drop lesson upload with type / size validation.
- Admin dashboard with live charts — students per class, subjects per class, lesson materials by file type.
- **Student dashboard** — welcome → summary cards → My Subjects → **Recent Materials** → **Assignments & Deadlines** (submit with status: pending / submitted / late / completed) → **Announcements**, plus an **unread-notifications bell** in the header.
- Teachers manage assignments (with submissions + grading) and post announcements from each subject page; admins post university-wide announcements.
- Every user (admin, teacher, student) has an editable **Profile** with photo upload, shown in the sidebar and top bar.

---

## Project structure

```
University Lms 1/
├── backend/          Express API + Mongoose models + Multer uploads
│   ├── config/db.js
│   ├── controllers/  auth, class, student, teacher, subject, lesson
│   ├── middleware/    auth, role, upload, error, asyncHandler
│   ├── models/        User, Class, Student, Teacher, Subject, Lesson
│   ├── routes/
│   ├── uploads/       uploaded lesson files (git-ignored)
│   ├── seed.js
│   └── server.js
└── frontend/         React SPA (Context API auth + toasts, protected routes per role)
    └── src/
        ├── api/axios.js
        ├── context/     AuthContext.jsx, ToastContext.jsx
        ├── components/   DashboardLayout, AuthShell, ProtectedRoute, Avatar, charts.jsx,
        │                 Dropzone, ImagePicker, DocumentViewer, SubjectCard,
        │                 LessonCard, LessonPreviewModal, ui.jsx
        ├── hooks/useFetch.js
        ├── utils/        assets.js, lessonFiles.js
        └── pages/        login, register, profile, admin/*, teacher/*, student/*
```

`backend/uploads/avatars/` holds profile photos (served statically); lesson files sit in `backend/uploads/` and are streamed only through authenticated endpoints.

---

## Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas connection string

---

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit .env
npm run seed                # creates demo admin / teachers / classes / students / subjects / lessons
npm run dev                 # http://localhost:5000
```

`.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/university_lms
# Atlas:  mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/university_lms
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE_MB=15
CLIENT_URL=http://localhost:5173
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env        # VITE_API_URL=/api  (uses the Vite dev proxy)
npm run dev                 # http://localhost:5173
```

### One-liners from the repo root

```bash
npm run install:all
npm run seed
npm run dev:backend     # terminal 1
npm run dev:frontend    # terminal 2
```

### Clearing demo content

```bash
cd backend && npm run clear
```

Deletes every class, subject and lesson (and their files) and unassigns all
students, while keeping the admin / teacher / student **accounts**. Use it to
start from an empty platform and build your own classes and subjects.

---

## Demo accounts (after `npm run seed`)

| Role    | Email                          | Password    | Notes                              |
| ------- | ------------------------------ | ----------- | ---------------------------------- |
| Admin   | admin@university.com           | Admin123    | full management                    |
| Teacher | turing@university.com          | Teacher123  | Data Structures, Database Systems  |
| Teacher | hopper@university.com           | Teacher123  | Operating Systems                  |
| Teacher | smith@university.com            | Teacher123  | Business subjects                  |
| Teacher | tesla@university.com            | Teacher123  | Electrical Engineering subjects    |
| Student | sara@student.university.com     | Student123  | Computer Science Year 2            |
| Student | layla@student.university.com    | Student123  | Business Administration Year 1     |
| Student | fatima@student.university.com   | Student123  | Electrical Engineering Year 3      |

`sara` and `layla` see completely different subjects — demonstrating class isolation.
`turing` cannot open or upload to `smith`'s subjects — demonstrating teacher isolation.

---

## API

All routes are prefixed with `/api`. Protected routes need `Authorization: Bearer <token>`.

### Auth
| Method | Path              | Access  |
| ------ | ----------------- | ------- |
| POST   | `/auth/register`  | public (students only) — optional `class` id to self-assign at sign-up |
| GET    | `/classes/public`             | public — class list for the registration dropdown |
| GET    | `/classes/public/:id/subjects` | public — active courses of a class (available, not shown on the form) |
| POST   | `/auth/login`     | public  |
| GET    | `/auth/me`        | any authenticated |
| POST   | `/auth/logout`    | any authenticated |
| PUT    | `/auth/profile`   | any authenticated — update own name / email / password + upload profile photo (multipart `avatar`, JPG/PNG/WEBP ≤ 3 MB; `removeAvatar=true` clears it) |

Profile photos are stored in `backend/uploads/avatars/` and served as public static assets from `/uploads/avatars/<file>` (lesson files, by contrast, only ever stream through the authenticated endpoints).

### Classes  `/api/classes`
`GET /`, `GET /:id` — any authenticated · `POST /`, `PUT /:id`, `DELETE /:id` — **admin**

### Students  `/api/students`
`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` — **admin**

### Teachers  `/api/teachers`
`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` — **admin**

### Subjects  `/api/subjects`
`GET /`, `GET /:id` — role-filtered (admin: all · teacher: own · student: own class, **active only**)
`POST /`, `PUT /:id`, `DELETE /:id` — **admin** (multipart: `subjectName`, `subjectCode`, `description`, `status` (`active`/`inactive`), `class`, `teacher`, optional `image`; `PUT` also takes `removeImage`)

A subject carries a name, code, description, **image**, an `active`/`inactive` status, a class and an assigned teacher. Students only see **active** subjects of their class:

- **Student Dashboard** → subject cards with image · name · instructor · lesson count.
- **My Subjects** page → full visual cards (image · name · code · instructor · description · "View Subject").
- **Subject page** → image banner + name, code, instructor, description, lesson materials.

Subject images live in `backend/uploads/subjects/` and are served from `/uploads/subjects/<file>`. The admin can add, replace, or remove a subject's image from the create/edit modal.

### Lessons  `/api/lessons`
| Method | Path                     | Access |
| ------ | ------------------------ | ------ |
| GET    | `/?subject=<id>`         | role-checked (must be allowed to see the subject) |
| GET    | `/:id`                   | role-checked |
| GET    | `/:id/preview`           | inline stream (PDF preview) |
| GET    | `/:id/download`          | attachment stream |
| POST   | `/` (multipart: `file` + optional `cover` image) | **teacher**, must own the subject |
| PUT    | `/:id` (multipart: `file`, `cover`, `removeCover` all optional) | **teacher**, must own the lesson |
| DELETE | `/:id`                   | **teacher**, must own the lesson |

When a teacher adds a lesson they can attach an optional **cover photo** (JPG/PNG/WEBP ≤ 4 MB), shown on the lesson card and at the top of the lesson viewer. Covers live in `backend/uploads/covers/` and are served statically from `/uploads/covers/<file>`. Lesson & assignment files accept **PDF, DOCX, PPTX, XLSX, ZIP, TXT, CSV**.

`GET /api/lessons?limit=<n>` returns the *n* most recent materials the caller can see (used by the student dashboard's **Recent Materials**).

### Assignments  `/api/assignments`
| Method | Path | Access |
| --- | --- | --- |
| GET | `/` | role-filtered — student rows carry `status` (`pending`/`submitted`/`late`/`completed`) + their submission; teacher/admin rows carry `submissionCount` |
| GET | `/:id` | role-checked — student: their submission · teacher: all submissions |
| GET | `/:id/brief` | download the lecturer's brief file |
| POST | `/` (multipart: title, description, `dueDate`, optional `file`) | **teacher** — must own the subject |
| PUT / DELETE `/:id` | **teacher** who owns it (delete also removes submissions) |
| POST | `/:id/submit` (multipart `file`) | **student** — creates/replaces their submission |
| GET | `/submissions/:id/download` | the student who owns it, or the subject's teacher |
| PUT | `/submissions/:id/grade` (`grade`, `feedback`) | **teacher** → status becomes `completed` |

Assignment briefs live in `backend/uploads/assignments/`, submissions in `backend/uploads/submissions/` — both stream through auth.

### Announcements  `/api/announcements`
`GET /` — visibility-filtered (student: `all` + their class + their subjects · teacher: `all` + own + their subjects/classes · admin: everything).
`POST /` — **admin** (audience `all` / `class` / `subject`) or **teacher** (only their own `class` / `subject`). `PUT` / `DELETE /:id` — the author or an admin. Each announcement has a `normal`/`important` priority.

### Notifications  `/api/notifications`
`GET /summary` — recent announcements (+ new materials for students) with an `unreadCount` (items newer than the user's `notificationsSeenAt`). `POST /seen` — mark everything read (drives the header bell badge).

---

## Access control (enforced in the backend)

- **Admin** — full CRUD on classes, students, teachers, subjects; assigns students↔class and teacher↔subject.
- **Teacher** — reads only their assigned subjects; uploads / edits / deletes only their own lessons; blocked from other teachers' subjects.
- **Student** — reads only their class's subjects and those subjects' lessons; can download / preview; blocked from every other class's data.

Every check is done server-side (`authMiddleware` → `roleMiddleware` → per-resource ownership checks in controllers). The frontend route guards are convenience only.

---

## File uploads

- Allowed: **PDF, DOCX, PPTX** (validated by MIME type and extension in `uploadMiddleware.js`).
- Size limit: `MAX_FILE_SIZE_MB` (default 15 MB).
- Stored in `backend/uploads/`, served through authenticated streaming endpoints (never statically exposed).
- **In-browser reading for every type** (students never have to download to read):
  - PDF → native `<iframe>`
  - DOCX → rendered with `docx-preview`
  - PPTX → rendered slide-by-slide with `@aiden0z/pptx-renderer`
- Any file can still be downloaded.

---

## Production (single deploy, optional)

```bash
cd frontend && npm run build          # outputs frontend/dist
cd ../backend && NODE_ENV=production npm start
```

With `NODE_ENV=production` the API also serves `frontend/dist` and SPA-fallbacks to `index.html`.

---

## Notes

- Passwords are hashed with bcrypt (`User` pre-save hook) and never returned in responses.
- JWT is stateless; logout is client-side token disposal.
- `seed.js` generates real, valid one-page PDFs for the sample lessons so previews work immediately.
