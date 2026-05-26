# paradox-ui

React + TypeScript frontend for the ParadoxSportsData platform. Connects to paradox-clock-gate (game state engine) to display NFL game state at any elapsed second via an interactive timeline scrubber.

**Port:** 5173 (dev) / 4173 (preview)  
**Repo:** [ParadoxSportsData/paradox-ui](https://github.com/ParadoxSportsData/paradox-ui)

See [paradox-clock-gate](https://github.com/ParadoxSportsData/paradox-clock-gate) for the game state engine.

---

## Prerequisites

- Node.js 20+ (`node --version` to check)
- paradox-clock-gate serve running on port 8080 (or configure `VITE_API_URL`)

---

## Quick start

```bash
git clone https://github.com/ParadoxSportsData/paradox-ui
cd paradox-ui
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Running against the live backend

Start paradox-clock-gate serve first:

```bash
# In paradox-clock-gate/
go build ./cmd/clock-gate/
./clock-gate serve        # --port 8080 --data ./testdata (defaults)
```

Then start paradox-ui (connects to `http://localhost:8080` by default):

```bash
npm run dev
```

---

## Mock mode (no backend required)

```bash
VITE_MOCK_MODE=true npm run dev
```

Returns fixture data — no backend required. Useful for UI development.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | clock-gate serve base URL |
| `VITE_MOCK_MODE` | `false` | Set to `true` to use fixture data instead of API calls |

---

## API surface consumed

All calls go to paradox-clock-gate serve:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/games` | List all available games |
| `GET` | `/games/{id}/timeline` | Play index for timeline scrubber |
| `GET` | `/games/{id}/state?tick=T` | Game state at elapsed second T |

---

## Development

```bash
npm run dev        # dev server with HMR at :5173
npm run build      # production build → dist/
npm run preview    # preview production build at :4173
npm run lint       # ESLint
```
