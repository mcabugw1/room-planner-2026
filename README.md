# Room Planner 2026

Interactive furniture layout planner. Drag, resize, rotate, and snap furniture in a 2D room canvas. Layouts auto-saved to browser IndexedDB.

## Features

- Drag-and-drop furniture placement with snap-to-edge
- Resize handles and rotation
- Wall features (doors, windows) with drag-to-move
- Spatial measurement overlay (nearest-neighbor and pair modes)
- Layout persistence via IndexedDB (autosave + named saves)

## Development

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run test      # vitest
npm run lint      # eslint
```

## Docker Deployment (Unraid / LAN)

### Prerequisites

- Docker Desktop with buildx enabled
- Docker Hub account (`akoha`)

### Build and Push

```sh
./build-and-push.sh
```

This cross-compiles for `linux/amd64` and pushes `akoha/room-planner:latest` to Docker Hub.

### Run on Unraid

In Unraid > Docker > Add Container:

| Field | Value |
|---|---|
| Repository | `akoha/room-planner:latest` |
| Port mapping | `5173` → `80` |
| Network | `bridge` |

Or via CLI on Unraid:

```sh
docker run -d \
  --name room-planner \
  --restart unless-stopped \
  -p 5173:80 \
  akoha/room-planner:latest
```

Access at `http://<unraid-ip>:5173`

## Tech Stack

- React 19 + TypeScript 6
- Vite 6
- react-rnd (drag & drop)
- nginx (production serving)
- Docker multi-stage build
