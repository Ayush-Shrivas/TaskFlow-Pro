# TaskFlow Pro

TaskFlow Pro is a full-stack project and task management platform built with React, Vite, Node.js, Express, MongoDB, and Socket.io. It combines workspace planning, task tracking, realtime collaboration, notifications, and AI-assisted planning in one application.

## Overview

The app is organized as two separate workspaces:

- `frontend` - React + Vite single-page application
- `backend` - Express API, MongoDB models, Socket.io realtime layer, and AI endpoints

## Key Features

- Secure authentication with register, login, profile, and password reset flows
- Role-based access for `admin`, `manager`, and `member`
- Project creation and collaboration with members
- Task management with status tracking, priorities, due dates, attachments, and activity history
- Task comments and notification delivery
- Realtime updates through Socket.io for project and user rooms
- Analytics and project health views
- AI-powered task prioritization, sprint planning, risk detection, and project summaries
- Seed script for quick local demo data setup

## Tech Stack

- Frontend: React 19, Vite, React Router, Redux Toolkit, Axios, Recharts, Socket.io client, Tailwind CSS
- Backend: Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs, Socket.io, CORS, dotenv

## Project Structure

```text
TaskFlow Pro - DEV/
|-- frontend/
|   |-- src/
|   |-- package.json
|-- backend/
|   |-- src/
|   |-- package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Install dependencies

From the project root, install dependencies for both workspaces:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Create a `.env` file inside `backend/` with the following values:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow_pro
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_optional_gemini_api_key
NODE_ENV=development
```

Notes:

- `GEMINI_API_KEY` is optional. If it is not set, the AI endpoints fall back to local logic.
- The frontend currently targets `http://localhost:5000/api` and `http://localhost:5000` for API and Socket.io connections.

### 3. Run the backend

```bash
cd backend
npm run dev
```

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

The frontend will start with Vite, usually on `http://localhost:5173`.

## Available Scripts

### Backend

- `npm start` - Start the API server
- `npm run dev` - Start the API server with nodemon

### Frontend

- `npm run dev` - Start the Vite development server
- `npm run build` - Build the production bundle
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint

## Seed Demo Data

The backend includes a seed script that creates demo users, a sample project, tasks, comments, and notifications.

Run it from the `backend` folder:

```bash
node src/seed.js
```

Demo credentials:

- `admin@taskflow.pro` / `password123`
- `manager@taskflow.pro` / `password123`
- `dev@taskflow.pro` / `password123`
- `designer@taskflow.pro` / `password123`

## API Highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/projects`
- `GET /api/tasks?projectId=...`
- `GET /api/comments/:taskId`
- `GET /api/notifications`
- `POST /api/ai/prioritize`
- `POST /api/ai/sprint-plan`
- `GET /api/ai/risk-detection/:projectId`
- `GET /api/ai/project-summary/:projectId`

## Realtime Events

Socket.io is used for collaborative updates.

- `joinProject` / `leaveProject`
- `joinUser`
- `taskCreated`, `taskUpdated`, `taskDeleted`
- `commentAdded`

## Helpful Notes

- If you change the backend port or host, update `frontend/src/services/api.js` and `frontend/src/services/socket.js`.
- Password reset and AI behavior are designed to work even when optional external services are not configured.
- The backend currently ships without automated tests.


