# Meeting Tracker

A full-stack meeting tracking application built with a Cloudflare Worker backend and a modern JavaScript frontend. Create, track, and manage meetings with persistent storage at the edge.

## Architecture

```
meeting-tracker/
├── worker/          # Cloudflare Worker — API + KV storage
│   ├── src/
│   └── wrangler.toml
└── frontend/        # UI — HTML/CSS/JS
    └── src/
```

**Backend**: Cloudflare Worker handles REST API endpoints and persists meeting data using Cloudflare KV.
**Frontend**: Lightweight JavaScript SPA communicating with the Worker API.

## Features

- Create and manage meeting records
- Track meeting details, participants, and notes
- Persistent storage via Cloudflare KV
- Deployed globally on Cloudflare's edge network

## Getting Started

### Backend (Worker)

```bash
cd worker
npm install
npx wrangler dev       # local dev
npx wrangler deploy    # deploy to Cloudflare
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

- **Backend**: Cloudflare Workers, Cloudflare KV
- **Frontend**: JavaScript
- **Tooling**: Wrangler
