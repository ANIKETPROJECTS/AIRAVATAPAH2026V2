# Prompt to give to another Replit

Copy and paste the text below exactly as-is into the other Replit's chat:

---

I want you to add an **"All Insurance/Subsidies"** section to this project. Here are the exact details — follow them precisely so the result matches a reference implementation.

---

## What to build

A new sidebar section and full-page module called **"All Insurance/Subsidies"**. It displays 20 government insurance and subsidy schemes fetched from a MongoDB collection, with search, filters, table/grid toggle, pagination, and a sliding detail panel.

---

## Step 1 — Create the frontend component

Create the file `src/components/modules/AllInsuranceSubsidies.tsx` with the full source code from the GUIDE.md file located at `All Insurance-Subsidies/GUIDE.md` in this project (Section 1). Copy it exactly.

The component has these features:
- Search bar (debounced 300ms) by scheme name
- Region filter toggle: All Regions / 🏛 Central / 🏠 Maharashtra
- Type filter toggle: All Types / 🛡️ Insurance / 💰 Subsidy
- Table/Grid view toggle (icons: LayoutList / LayoutGrid)
- Stats bar showing Total count and current Page
- Table view with columns: Scheme Name, Type, Region, Eligibility, Parameters, Action (View Details button)
- Grid view with cards (3 columns on xl, 2 on sm, 1 on mobile)
- Sliding detail panel from the right side (fixed, z-50, w-1/2, minWidth 460px) showing Eligibility, Parameters, and Key Features — closes on outside click
- Loading skeleton (5 animated pulse rows), error state with retry, empty state
- Pagination with prev/next arrows and numbered page buttons, 10 items per page
- TypeBadge: green for Insurance, gold for Subsidy
- RegionBadge: blue for Central, orange for Maharashtra

---

## Step 2 — Add sidebar nav entry

In your sidebar component, import `ShieldCheck` from `lucide-react` and add this nav item (place it after your existing insurance/subsidy-related items):

```
{ key: "allinsurance", label: "All Insurance/Subsidies", icon: ShieldCheck }
```

---

## Step 3 — Register in page router

In your main page file (where sidebar keys are mapped to components):

1. Import: `import AllInsuranceSubsidies from "@/components/modules/AllInsuranceSubsidies";`
2. Add to titles map: `allinsurance: "All Insurance & Subsidies"`
3. Add to modules map: `allinsurance: AllInsuranceSubsidies`

---

## Step 4 — Create the backend API route

Create `src/routes/insurance-subsidies.ts` with two endpoints:

- `GET /api/insurance-subsidies` — paginated list supporting query params: `type` (Insurance|Subsidy), `region` (Central|Maharashtra), `search` (regex on name field, case-insensitive), `page` (0-indexed), `limit` (default 10, max 100). Response: `{ items, total, page, limit, totalPages }`. Sorts by region, type, name. Uses MongoDB collection `insurance_subsidies`.

- `GET /api/insurance-subsidies/:id` — single item by `id` field (not `_id`). Returns 404 if not found.

Mount this router in your main routes file: `router.use(insuranceSubsidiesRouter)`

Use the full source from `All Insurance-Subsidies/GUIDE.md` Section 4.

---

## Step 5 — Create the MongoDB seed file

Create `src/lib/seed-insurance-subsidies.ts` with all 20 schemes. The full data is in `All Insurance-Subsidies/GUIDE.md` Section 5. Copy all 20 objects exactly.

The seed function should:
- Check if collection already has documents — skip if yes
- Create indexes on: `id` (unique), `type`, `region`, `name` (text)
- Insert all 20 documents

---

## Step 6 — Call the seed on server startup

In your server entry point, import `seedInsuranceSubsidies` and call it inside your MongoDB connection callback:

```typescript
import { seedInsuranceSubsidies } from "./lib/seed-insurance-subsidies";
// ...
await seedInsuranceSubsidies(db);
```

---

## Step 7 — Add CSS animation

In your global CSS file, make sure `animate-fade-in` is defined:

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.35s ease forwards;
}
```

---

## Step 8 — Verify Tailwind color tokens

The component uses these Tailwind tokens: `success`, `secondary`, `primary`, `muted`, `card`, `border`, `foreground`, `muted-foreground`, `destructive`. These should already exist in your project's Tailwind config. If any are missing, add them as CSS variables.

---

## Data — 20 schemes total

- 4 Central Insurance: PMFBY, RWBCIS, UPIS, CPIS
- 6 Central Subsidies: PM-KISAN, PMKSY, SMAM, AIF, PM-FME, ISS
- 2 Maharashtra Insurance: PMFBY Maharashtra, State Crop Insurance Add-ons
- 8 Maharashtra Subsidies: Namo Shetkari, Saur Krushi Pump, Jalyukt Shivar, Birsa Munda, Ambedkar Krishi, Micro Irrigation, Farm Mechanization, Electricity Subsidy

All 20 records with full content are in `All Insurance-Subsidies/GUIDE.md` Section 5.

---

After completing all steps, rebuild the API server (if there is a build step), restart both the frontend and API workflows, and verify the "All Insurance/Subsidies" section appears in the sidebar and loads data correctly.
