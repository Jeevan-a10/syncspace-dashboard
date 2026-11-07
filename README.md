# SyncSpace Dashboard ⚡

![CI Status](https://github.com/Jeevan-a10/syncspace-dashboard/actions/workflows/ci.yml/badge.svg)
![Next.js](https://img.shields.io/badge/next.js-v16.4-black)
![React](https://img.shields.io/badge/react-v19.3-blue)
![Socket.io](https://img.shields.io/badge/socket.io--client-v4.8-orange)
![Tailwind CSS](https://img.shields.io/badge/tailwind-v4.0-38bdf8)
![Docker](https://img.shields.io/badge/docker-ready-2496ed)
![License](https://img.shields.io/badge/license-MIT-blue)

High-performance real-time collaborative workspace frontend built with **Next.js 16 (App Router)**, **React 19**, **Socket.io Client**, and **Tailwind CSS**.

SyncSpace Dashboard connects teams with instant document synchronization, live multi-user SVG cursor canvas tracking, typing indicators, full-duplex room chat, and monotonic revision history.

---

## 🏗️ System Architecture & Real-Time Flow

```
   ┌─────────────────────────────────────────────────────────────┐
   │                    SyncSpace Client UI                      │
   │  ┌─────────────────────────┐   ┌─────────────────────────┐  │
   │  │   Collaborative Editor  │   │   Live Cursor Canvas    │  │
   │  │  • Text diff debounce   │   │  • SVG peer pointers    │  │
   │  │  • Monotonic Rev badge  │   │  • User name tags       │  │
   │  │  • Live Markdown preview│   │  • 20fps mouse stream   │  │
   │  └───────────┬─────────────┘   └───────────┬─────────────┘  │
   │              │                             │                │
   │  ┌───────────┴─────────────┐   ┌───────────┴─────────────┐  │
   │  │     Workspace Chat      │   │  Presence & Awareness   │  │
   │  │  • Real-time room feed  │   │  • Colored peer rings   │  │
   │  │  • Optimistic sending   │   │  • Typing state badges  │  │
   │  └───────────┬─────────────┘   └───────────┬─────────────┘  │
   └──────────────┼─────────────────────────────┼────────────────┘
                  │                             │
                  ▼                             ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    Socket.io Protocol                       │
   │       Events: join-room, doc-edit, cursor-move, typing      │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │              SyncSpace API Server (:5001)                   │
   │   (Dual-mode: MongoDB persistence + In-Memory Fallback)     │
   └─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **⚡ Real-Time Collaborative Document Editor**: Debounced keystroke synchronization across all peers in the room with monotonic revision badges and instant markdown rendering.
- **🖱️ Live Multi-User SVG Cursor Canvas**: High-fidelity cursor overlay streaming peer positions with auto-assigned signature palette colors and floating username tags.
- **⌨️ Live Typing State Streaming**: Visual typing indicators ("Marcus is editing...") keeping teammates aware in real time.
- **💬 Real-Time Workspace Chat**: Full-duplex room chat stream with optimistic message dispatching and auto-scrolling message feeds.
- **👥 Live Presence & Peer Awareness**: Avatar stack showcasing all online collaborators with active status rings and custom palette colors.
- **📜 Document Revision History**: Dedicated audit log modal displaying previous revisions, timestamps, authors, and change delta counts.
- **🏠 Workspace Lobby & Topic Filtering**: Browse rooms with live presence counts, instant search queries, and domain filter tabs (`Engineering`, `Architecture`, `Design`, `Standup`, `General`).
- **🛡️ Standalone Resilience**: Pre-seeded demo rooms and safe fallbacks ensure seamless SSR and offline UI functionality even if the backend is disconnected.
- **🐳 Multi-Stage Docker Build**: Production-optimized standalone Alpine container.

---

## 📂 Project Structure

```
syncspace-dashboard/
├── app/
│   ├── globals.css              # Custom styling, animations, and Tailwind directives
│   ├── layout.js                # Root layout with WorkspaceProvider & meta tags
│   ├── page.js                  # Workspace lobby, room browser & topic filters
│   └── room/
│       └── [roomId]/
│           └── page.js          # Live collaborative workspace room view
├── components/
│   ├── CollaborativeEditor.js   # Real-time text editor + live cursor overlay
│   ├── ChatPanel.js             # Room messaging stream with optimistic dispatch
│   ├── PresenceBar.js           # Active peer avatar stack & status rings
│   ├── RoomCard.js              # Workspace preview card with share action
│   ├── CreateRoomModal.js       # Modal to provision new workspace rooms
│   ├── ProfileModal.js          # Collaborator name and cursor palette selector
│   ├── HistoryModal.js          # Monotonic revision audit log modal
│   └── Icons.js                 # Centralized resolution-independent SVG icons
├── context/
│   └── WorkspaceContext.js      # Global state for user, socket connection & toasts
├── lib/
│   ├── api.js                   # Axios REST client for rooms, documents, and chat
│   └── socket.js                # Socket.io client singleton and user palette helper
├── tests/
│   ├── api.test.js              # Unit tests for API endpoints and client
│   └── socket.test.js           # Unit tests for socket contracts & color mapping
├── Dockerfile                   # Multi-stage standalone Next.js container build
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Running `syncspace-api` instance on port 5001 (or default standalone seed mode)

### 1. Installation

```bash
cd syncspace-dashboard
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Run Automated Test Suite

```bash
npm test
```

Executes test suite validating API modules, socket protocols, and deterministic color palettes.

### 5. Production Build

```bash
npm run build
npm start
```

---

## 🐳 Docker Deployment

Build and run the standalone production container:

```bash
# Build Docker image
docker build -t syncspace-dashboard .

# Run container on port 3000
docker run -p 3000:3000 --name syncspace-ui syncspace-dashboard
```

---

## 📄 License

MIT © [Jeevan](https://github.com/Jeevan-a10)
