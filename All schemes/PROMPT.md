# Prompt for Replit Agent — Add "All Schemes" Page

Copy and paste the prompt below into your Replit project's agent chat:

---

I have an "All schemes" folder in my project root that contains all the code needed to add a fully working "All Schemes" page to my app. Please integrate it exactly as described below.

## What the page does

The All Schemes page is a government agricultural schemes management screen with:
- A searchable, filterable table of 18 government schemes (10 Central + 8 Maharashtra state)
- Toggle between table view and grid/card view
- Live search across scheme name, category, and description
- Filter by type: All / Central / Maharashtra
- Client-side pagination (10 per page)
- A status toggle (Active / Closed) per scheme that calls the backend
- A slide-out detail panel showing full eligibility, documents, approval rules, benefits

## Files in the folder

```
All schemes/
  frontend/
    AllSchemes.tsx         ← React component (self-contained, no extra imports needed)
  backend/
    routes/schemes.ts      ← Express routes: GET /api/schemes, GET /api/schemes/:id, PATCH /api/schemes/:id/status
    lib/
      seed-schemes.ts      ← Seeds 18 schemes into MongoDB on first startup
      mongo.ts             ← MongoDB connection helper (connectMongo, getDb, closeMongo)
      logger.ts            ← Pino logger setup
```

## Integration steps

### Frontend
1. Copy `All schemes/frontend/AllSchemes.tsx` into your React source directory (e.g. `src/components/` or `src/pages/`).
2. The component uses only `lucide-react` icons (`Search`, `LayoutGrid`, `LayoutList`, `ChevronLeft`, `ChevronRight`, `ChevronDown`, `ChevronUp`, `X`) — install lucide-react if not already present.
3. Wire it into your router/navigation so it renders when the user clicks "All Schemes". Add it as a page/route in your app.
4. The component calls `fetch("/api/schemes")` and `fetch("/api/schemes/:id/status", { method: "PATCH" })` — make sure your frontend dev server proxies `/api` to your backend (e.g. via Vite's `server.proxy`).

### Backend (Express + MongoDB)
1. Copy `All schemes/backend/lib/mongo.ts` and `All schemes/backend/lib/logger.ts` into your API server's lib folder (skip if you already have these).
2. Copy `All schemes/backend/routes/schemes.ts` into your routes folder.
3. Register the schemes router in your main Express app:
   ```ts
   import schemesRouter from "./routes/schemes";
   app.use("/api", schemesRouter);
   ```
4. Copy `All schemes/backend/lib/seed-schemes.ts` into your lib folder.
5. Call `seedSchemes(db)` once after your MongoDB connection is established (on server startup). This inserts all 18 schemes on first run and is idempotent on subsequent runs.
6. Set the environment variable `MONGODB_URI` to your MongoDB Atlas connection string (the code uses `process.env.MONGODB_URI`). Also set `MONGODB_DB` (defaults to `"apnaapp"`).

### Required npm packages (backend)
- `mongodb` — MongoDB driver
- `pino` — logging
- `pino-pretty` — dev log formatting
- `pino-http` — HTTP request logging middleware
- `express` — web framework
- `cors` — CORS middleware

Install with: `npm install mongodb pino pino-pretty pino-http express cors`
Or with pnpm: `pnpm add mongodb pino pino-pretty pino-http express cors`

### Tailwind CSS tokens used
The component uses these Tailwind CSS custom color tokens that should exist in your theme:
- `text-primary`, `bg-primary`, `text-primary-foreground` — main brand color
- `text-secondary`, `bg-secondary` — secondary accent color
- `text-success`, `bg-success` — green for active status
- `text-destructive`, `bg-destructive` — red for errors/closed status
- `text-warning` — amber for warnings
- `bg-card`, `border-border`, `text-muted-foreground`, `bg-muted` — standard shadcn/ui tokens

If you use shadcn/ui, these are already defined. If not, map them to your own color variables in your Tailwind config.

### Page heading
Wrap the `<AllSchemes />` component in a page container with an "All Schemes" heading, for example:
```tsx
<div className="p-6">
  <h1 className="text-2xl font-bold mb-4">All Schemes</h1>
  <AllSchemes />
</div>
```

---

That's everything needed. The page is fully self-contained — no extra state management, no Redux, no context. Just drop in the files, wire the routes, and it works.
