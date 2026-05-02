# CLAUDE.md
Project: Room Layout Planner (2026)

## Overview
A React 19 + TypeScript 6 SPA for interactive furniture placement, optimized for the Claude Code agentic environment.

## Tech Stack
- React 19 (Modern Hooks + Compiler)
- TypeScript 6.0 (Strict)
- Vite 6
- react-rnd (Drag & Drop)
- ESLint 9 (Flat Config)
- Docker (Multi-stage)

## Commands
| Task | Command |
| :--- | :--- |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Test | `npm test` |
| Lint | `npm run lint` |
| Deploy | `docker compose up --build -d` |

## Pointers
- Room Logic: `src/features/room-planner/components/RoomPlanner.tsx`
- Layout: `src/app/router.tsx`
- Project Memory: See `.claude/skills/` for custom automation.
