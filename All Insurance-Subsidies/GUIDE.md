# All Insurance/Subsidies — Complete Integration Guide

This guide contains everything you need to add the **All Insurance/Subsidies** section to any AgriAdmin-style project, exactly as it exists here — same UI, same data, same backend, same design.

---

## What This Section Does

- Displays 20 government insurance and subsidy schemes in a **Table** or **Grid** view
- Supports filtering by **Region** (All / Central / Maharashtra) and **Type** (All / Insurance / Subsidy)
- Has a **search bar** with 300ms debounce for searching by scheme name
- Shows **10 items per page** with full pagination
- Clicking "View Details" opens a **sliding detail panel** from the right with full scheme info
- Data is served from MongoDB via Express API

---

## 1. Frontend Component

Create this file at:
```
src/components/modules/AllInsuranceSubsidies.tsx
```

> **Full source code:**

```tsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, X } from "lucide-react";

interface InsuranceSubsidy {
  id: string;
  name: string;
  type: "Insurance" | "Subsidy";
  region: "Central" | "Maharashtra";
  eligibility: string;
  criteria: string;
  parameters: string;
  features: string;
  createdAt: string;
}

interface ApiResponse {
  items: InsuranceSubsidy[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

function TypeBadge({ type }: { type: "Insurance" | "Subsidy" }) {
  const isInsurance = type === "Insurance";
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
        isInsurance
          ? "bg-success/15 text-success"
          : "bg-secondary/15 text-secondary"
      }`}
    >
      {isInsurance ? "🛡️ Insurance" : "💰 Subsidy"}
    </span>
  );
}

function RegionBadge({ region }: { region: "Central" | "Maharashtra" }) {
  const isCentral = region === "Central";
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
        isCentral
          ? "bg-primary/10 text-primary"
          : "bg-orange-100 text-orange-700"
      }`}
    >
      {isCentral ? "🏛 Central" : "🏠 Maharashtra"}
    </span>
  );
}

function DetailPanel({
  item,
  onClose,
}: {
  item: InsuranceSubsidy;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="fixed top-0 right-0 z-50 h-full w-1/2 bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
      style={{ minWidth: 460 }}
    >
      <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-muted/20 flex-shrink-0">
        <div className="flex-1 pr-3">
          <h2 className="font-heading text-base font-semibold leading-snug mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
            {item.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            <TypeBadge type={item.type} />
            <RegionBadge region={item.region} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Eligibility
          </p>
          <p className="text-xs leading-relaxed text-foreground bg-muted/20 rounded-lg px-3 py-2.5">
            {item.eligibility}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Parameters
          </p>
          <p className="text-xs leading-relaxed text-foreground bg-secondary/10 border border-secondary/20 rounded-lg px-3 py-2.5">
            {item.parameters}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            Key Features
          </p>
          <ul className="space-y-1.5">
            {item.features.split(". ").filter(Boolean).map((f, i) => (
              <li key={i} className="text-xs flex gap-2 items-start">
                <span className={`flex-shrink-0 mt-0.5 ${item.type === "Insurance" ? "text-success" : "text-secondary"}`}>
                  {item.type === "Insurance" ? "🛡" : "💰"}
                </span>
                <span>{f.replace(/\.$/, "")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TableRow({
  item,
  onView,
}: {
  item: InsuranceSubsidy;
  onView: () => void;
}) {
  return (
    <tr className="border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
      <td className="px-4 py-3 w-[28%]">
        <button
          onClick={onView}
          className="font-medium text-sm text-left hover:text-primary transition-colors leading-snug"
        >
          {item.name}
        </button>
      </td>
      <td className="px-4 py-3 w-[11%] align-middle">
        <div className="flex justify-center">
          <TypeBadge type={item.type} />
        </div>
      </td>
      <td className="px-4 py-3 w-[12%] align-middle">
        <div className="flex justify-center">
          <RegionBadge region={item.region} />
        </div>
      </td>
      <td className="px-4 py-3 w-[22%]">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {item.eligibility}
        </p>
      </td>
      <td className="px-4 py-3 w-[18%]">
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {item.parameters}
        </p>
      </td>
      <td className="px-4 py-3 w-[9%] align-middle">
        <button
          onClick={onView}
          className="text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          View Details
        </button>
      </td>
    </tr>
  );
}

function GridCard({
  item,
  onView,
}: {
  item: InsuranceSubsidy;
  onView: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm leading-snug flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <TypeBadge type={item.type} />
        <RegionBadge region={item.region} />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Eligibility
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {item.eligibility}
        </p>
      </div>
      <div className="bg-secondary/10 rounded p-2.5">
        <p className="text-[11px] font-semibold text-muted-foreground mb-0.5 uppercase tracking-wide">
          Parameters
        </p>
        <p className="text-xs font-medium leading-relaxed line-clamp-2">
          {item.parameters}
        </p>
      </div>
      <button
        onClick={onView}
        className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity mt-auto"
      >
        View Details
      </button>
    </div>
  );
}

export default function AllInsuranceSubsidies() {
  const [items, setItems] = useState<InsuranceSubsidy[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "Insurance" | "Subsidy">("ALL");
  const [regionFilter, setRegionFilter] = useState<"ALL" | "Central" | "Maharashtra">("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<InsuranceSubsidy | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (regionFilter !== "ALL") params.set("region", regionFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/insurance-subsidies?${params.toString()}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: ApiResponse = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, regionFilter, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(0);
  };
  const handleTypeFilter = (v: "ALL" | "Insurance" | "Subsidy") => {
    setTypeFilter(v);
    setPage(0);
  };
  const handleRegionFilter = (v: "ALL" | "Central" | "Maharashtra") => {
    setRegionFilter(v);
    setPage(0);
  };

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i),
    [totalPages]
  );

  return (
    <div className="space-y-4 animate-fade-in" style={{ opacity: 0 }}>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by scheme name..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
          {(["ALL", "Central", "Maharashtra"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRegionFilter(r)}
              className={`text-sm px-3.5 py-1.5 rounded-md transition-colors ${
                regionFilter === r
                  ? "bg-card shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "ALL" ? "All Regions" : r === "Central" ? "🏛 Central" : "🏠 Maharashtra"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
          {(["ALL", "Insurance", "Subsidy"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeFilter(t)}
              className={`text-sm px-3.5 py-1.5 rounded-md transition-colors ${
                typeFilter === t
                  ? "bg-card shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "ALL" ? "All Types" : t === "Insurance" ? "🛡️ Insurance" : "💰 Subsidy"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
          <button
            onClick={() => setView("table")}
            className={`p-1.5 rounded-md transition-colors ${view === "table" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            title="Table view"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[
          ["Total", total],
          ["Page", `${page + 1} / ${totalPages}`],
        ].map(([l, v]) => (
          <span
            key={l as string}
            className="text-xs bg-card border border-border rounded-full px-3 py-1.5 font-medium"
          >
            {l}: <span className="text-primary">{v}</span>
          </span>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
          <p className="text-sm text-destructive font-medium">Failed to load data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-80"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-muted/20 rounded-lg p-10 text-center">
          <p className="text-muted-foreground text-sm">No schemes match your search.</p>
        </div>
      ) : view === "table" ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Scheme Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 font-medium">Eligibility</th>
                  <th className="px-4 py-3 font-medium">Parameters</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    item={item}
                    onView={() => setSelected(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} · {total} records
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`text-xs w-7 h-7 rounded transition-colors ${
                    page === i
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((item) => (
              <GridCard key={item.id} item={item} onView={() => setSelected(item)} />
            ))}
          </div>
          {/* Grid Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} · {total} records
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`text-xs w-7 h-7 rounded transition-colors ${
                    page === i
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {selected && (
        <DetailPanel item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
```

---

## 2. Sidebar Navigation Entry

In your sidebar file (wherever your nav items array is), add this entry — position it wherever you want it in the list:

```tsx
// Import at top of sidebar file
import { ShieldCheck } from "lucide-react";

// Add to navItems array
{ key: "allinsurance", label: "All Insurance/Subsidies", icon: ShieldCheck },
```

**Example** — the nav array should look like:
```tsx
const navItems = [
  { key: "dashboard",       label: "Dashboard",               icon: BarChart3 },
  // ... other items ...
  { key: "allinsurance",    label: "All Insurance/Subsidies", icon: ShieldCheck },
  // ... other items ...
];
```

---

## 3. Page Router / Module Registry

In your main page file (e.g. `Index.tsx` or `App.tsx`) where you map sidebar keys to components:

```tsx
// 1. Import the component
import AllInsuranceSubsidies from "@/components/modules/AllInsuranceSubsidies";

// 2. Add to titles map
const titles: Record<string, string> = {
  // ...existing entries...
  allinsurance: "All Insurance & Subsidies",
};

// 3. Add to modules map
const modules: Record<string, React.FC> = {
  // ...existing entries...
  allinsurance: AllInsuranceSubsidies,
};
```

---

## 4. Backend — API Route File

Create this file at:
```
src/routes/insurance-subsidies.ts   (or your equivalent routes folder)
```

```typescript
import { Router, type IRouter } from "express";
import { getDb } from "../lib/mongo";   // adjust import path to your mongo helper
import { logger } from "../lib/logger"; // adjust to your logger

const router: IRouter = Router();

router.get("/insurance-subsidies", async (req, res): Promise<void> => {
  try {
    const db = getDb();

    const type   = typeof req.query["type"]   === "string" ? req.query["type"]   : undefined;
    const region = typeof req.query["region"] === "string" ? req.query["region"] : undefined;
    const search = typeof req.query["search"] === "string" ? req.query["search"].trim() : undefined;
    const pageRaw  = typeof req.query["page"]  === "string" ? parseInt(req.query["page"],  10) : 0;
    const limitRaw = typeof req.query["limit"] === "string" ? parseInt(req.query["limit"], 10) : 10;

    const page  = isNaN(pageRaw)  || pageRaw  < 0 ? 0  : pageRaw;
    const limit = isNaN(limitRaw) || limitRaw < 1 || limitRaw > 100 ? 10 : limitRaw;

    const filter: Record<string, unknown> = {};
    if (type   === "Insurance" || type   === "Subsidy")     filter["type"]   = type;
    if (region === "Central"   || region === "Maharashtra") filter["region"] = region;
    if (search) filter["name"] = { $regex: search, $options: "i" };

    const [items, total] = await Promise.all([
      db.collection("insurance_subsidies")
        .find(filter, { projection: { _id: 0 } })
        .sort({ region: 1, type: 1, name: 1 })
        .skip(page * limit)
        .limit(limit)
        .toArray(),
      db.collection("insurance_subsidies").countDocuments(filter),
    ]);

    res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error({ err }, "Failed to fetch insurance subsidies");
    res.status(500).json({ error: "Failed to fetch insurance subsidies" });
  }
});

router.get("/insurance-subsidies/:id", async (req, res): Promise<void> => {
  try {
    const db = getDb();
    const item = await db
      .collection("insurance_subsidies")
      .findOne({ id: req.params.id }, { projection: { _id: 0 } });

    if (!item) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    logger.error({ err }, "Failed to fetch insurance subsidy");
    res.status(500).json({ error: "Failed to fetch insurance subsidy" });
  }
});

export default router;
```

Then mount it in your main router file:

```typescript
import insuranceSubsidiesRouter from "./insurance-subsidies";

router.use(insuranceSubsidiesRouter);
```

---

## 5. Backend — MongoDB Seed File

Create this file at:
```
src/lib/seed-insurance-subsidies.ts
```

```typescript
import { type Db } from "mongodb";
import { logger } from "./logger"; // adjust to your logger

export interface InsuranceSubsidy {
  id: string;
  name: string;
  type: "Insurance" | "Subsidy";
  region: "Central" | "Maharashtra";
  eligibility: string;
  criteria: string;
  parameters: string;
  features: string;
  createdAt: string;
}

const now = new Date().toISOString();

const INSURANCE_SUBSIDIES: InsuranceSubsidy[] = [
  // ─── CENTRAL INSURANCE ────────────────────────────────────────────────────
  {
    id: "pmfby-central",
    name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    type: "Insurance",
    region: "Central",
    eligibility: "All farmers (owner, tenant, sharecropper) growing notified crops in notified areas. Loanee farmers: compulsory. Non-loanee: voluntary. Must enroll before cut-off date.",
    criteria: "Eligibility: notified crop, notified area, enrollment before cut-off, valid land records, and insurable interest in the crop.",
    parameters: "Premium: Kharif 2%, Rabi 1.5%, Commercial crops 5%. Sum insured = Scale of finance × area. Coverage: Pre-sowing to post-harvest.",
    features: "Covers drought, flood, cyclone, pests. Uses satellite & drone tech for assessment. Claims settled via DBT. Area-based insurance model.",
    createdAt: now,
  },
  {
    id: "rwbcis",
    name: "Restructured Weather Based Crop Insurance Scheme (RWBCIS)",
    type: "Insurance",
    region: "Central",
    eligibility: "Farmers in notified weather stations. Must grow weather-sensitive crops. Enrollment before deadline.",
    criteria: "Eligibility: notified weather station, weather-sensitive crop, enrollment before deadline, and trigger-based coverage acceptance.",
    parameters: "Based on rainfall levels and temperature variation. Predefined trigger thresholds automatically initiate claims.",
    features: "Claim triggered automatically. No field inspection required. Faster claim settlement than traditional schemes.",
    createdAt: now,
  },
  {
    id: "upis",
    name: "Unified Package Insurance Scheme (UPIS)",
    type: "Insurance",
    region: "Central",
    eligibility: "Farmers opting for bundled insurance coverage. Must be engaged in farming activities.",
    criteria: "Eligibility: active farming engagement, bundled insurance selection, and acceptance of crop/livestock/accident/asset cover combination.",
    parameters: "Covers multiple components: Crop, Livestock, Accident, Assets. Single premium for all coverages.",
    features: "Single policy for multiple risks. Reduces insurance complexity. Simplifies claims process for farmers.",
    createdAt: now,
  },
  {
    id: "cpis",
    name: "Coconut Palm Insurance Scheme (CPIS)",
    type: "Insurance",
    region: "Central",
    eligibility: "Coconut farmers with a minimum number of palms. Specific to plantation crop farmers.",
    criteria: "Eligibility: coconut cultivation, minimum palm count as per scheme norms, and plantation-crop ownership proof.",
    parameters: "Coverage per tree basis. Premium subsidized by government. Covers loss due to natural calamities.",
    features: "Covers natural calamities affecting coconut palms. Specific to plantation crops. Subsidized premium structure.",
    createdAt: now,
  },
  // ─── CENTRAL SUBSIDIES ────────────────────────────────────────────────────
  {
    id: "pm-kisan-subsidy",
    name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Landholding farmers with verified land records. Excludes income taxpayers and government employees, pensioners receiving ≥₹10,000/month, MPs/MLAs.",
    criteria: "Eligibility: cultivable land, Aadhaar-bank linkage, DBT-ready bank account, and exclusion checks for income tax payers/government employees.",
    parameters: "₹6,000 per year paid in 3 installments of ₹2,000 each every four months via Direct Benefit Transfer.",
    features: "Direct Benefit Transfer (DBT) to bank accounts. Nationwide coverage. Aadhaar-linked verification.",
    createdAt: now,
  },
  {
    id: "pmksy-subsidy",
    name: "Pradhan Mantri Krishi Sinchai Yojana (PMKSY)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Farmers with cultivable land suitable for irrigation. Priority to water-stressed regions.",
    criteria: "Eligibility: cultivable land, irrigation requirement, project feasibility, and priority for water-stressed locations.",
    parameters: "Subsidy on drip irrigation and sprinkler systems. Infrastructure development support. Focus on micro-irrigation.",
    features: "Focus: 'More crop per drop'. Water efficiency improvement. Supports drip and sprinkler installation.",
    createdAt: now,
  },
  {
    id: "smam",
    name: "Sub-Mission on Agricultural Mechanization (SMAM)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Farmers with land. Priority to small and marginal farmers for machinery subsidies.",
    criteria: "Eligibility: valid landholding, machinery need, and preference for small/marginal farmers.",
    parameters: "Subsidy on agricultural machinery and equipment. Limited subsidy amount per farmer per scheme period.",
    features: "Promotes mechanization of farming. Reduces manual labor requirement. Custom Hiring Centers supported.",
    createdAt: now,
  },
  {
    id: "aif-subsidy",
    name: "Agriculture Infrastructure Fund (AIF)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Farmers, Farmer Producer Organisations (FPOs), PACS, SHGs, and agri-entrepreneurs for project-based applications.",
    criteria: "Eligibility: project-based application, agri-infrastructure use case, and viable repayment plan.",
    parameters: "Interest subvention of 3% on loans up to ₹2 crore. Credit guarantee cover available under CGTMSE.",
    features: "Supports warehousing and cold storage infrastructure. Reduces post-harvest loss. Medium-to-long term financing.",
    createdAt: now,
  },
  {
    id: "pm-fme",
    name: "PM Formalisation of Micro Food Processing Enterprises (PM-FME)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Individual farmers, Self Help Groups (SHGs), and Farmer Producer Organisations (FPOs) in food processing.",
    criteria: "Eligibility: food-processing project, eligible applicant category, and bank-linked project proposal.",
    parameters: "35% capital subsidy on eligible project cost. Credit-linked subsidy through banks.",
    features: "Encourages food processing sector. Supports development of local brands and GI products.",
    createdAt: now,
  },
  {
    id: "iss",
    name: "Interest Subvention Scheme (ISS – Crop Loan)",
    type: "Subsidy",
    region: "Central",
    eligibility: "Farmers taking short-term crop loans from scheduled commercial banks. Must repay on time for additional benefit.",
    criteria: "Eligibility: crop loan account, repayment discipline, and sanctioned loan within eligible limit.",
    parameters: "Interest reduced by 2–4% on crop loans up to ₹3 lakh. Additional 3% for prompt repayment.",
    features: "Lower borrowing cost for farmers. Encourages formal credit channel usage. Administered through NABARD.",
    createdAt: now,
  },
  // ─── MAHARASHTRA INSURANCE ────────────────────────────────────────────────
  {
    id: "pmfby-maharashtra",
    name: "PMFBY – Maharashtra State Implementation",
    type: "Insurance",
    region: "Maharashtra",
    eligibility: "Farmers in Maharashtra growing notified crops. Must register through Maharashtra state agriculture portal before enrollment deadline.",
    criteria: "Eligibility: Maharashtra residency, notified crop, state portal registration, and valid crop survey records.",
    parameters: "Same premium structure as central PMFBY (Kharif 2%, Rabi 1.5%). State shares subsidy with central government.",
    features: "Maharashtra has one of highest claim settlements nationally. Digital crop survey (e-peek pahani) used. State-level grievance redressal.",
    createdAt: now,
  },
  {
    id: "state-crop-insurance-addons",
    name: "State Crop Insurance Variants / Add-ons",
    type: "Insurance",
    region: "Maharashtra",
    eligibility: "Farmers registered under Maharashtra state agriculture department and enrolled in base PMFBY scheme.",
    criteria: "Eligibility: base PMFBY enrollment, Maharashtra registration, and region-specific add-on acceptance.",
    parameters: "State-funded add-on coverage beyond central scheme. Local crop customization for region-specific risks.",
    features: "Faster claim processing at state level. Local crop and weather customization. Additional coverage for state-specific perils.",
    createdAt: now,
  },
  // ─── MAHARASHTRA SUBSIDIES ────────────────────────────────────────────────
  {
    id: "namo-shetkari-subsidy",
    name: "Namo Shetkari Maha Samman Nidhi Yojana",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers eligible under PM-KISAN who are Maharashtra residents. Must have DBT-enabled bank account linked to Aadhaar.",
    criteria: "Eligibility: PM-KISAN beneficiary, Maharashtra resident, Aadhaar-linked DBT account, and no duplicate family claim.",
    parameters: "₹6,000 per year (state top-up). Total benefit = ₹12,000/year combined with PM-KISAN. Paid via DBT.",
    features: "Direct DBT to farmer bank accounts. State top-up scheme on PM-KISAN. Automatic enrollment for PM-KISAN beneficiaries.",
    createdAt: now,
  },
  {
    id: "saur-krushi-pump-subsidy",
    name: "Mukhyamantri Saur Krushi Pump Yojana",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers with irrigation need and limited electricity access. Must have cultivable land and genuine pump requirement.",
    criteria: "Eligibility: cultivable land, irrigation need, feasible solar site, and pump requirement verified.",
    parameters: "Subsidy up to 90–95% for SC/ST farmers. 75–80% for general farmers. One solar pump per landholding.",
    features: "Solar pump installation for irrigation. Reduces electricity cost significantly. One-time capital asset benefit.",
    createdAt: now,
  },
  {
    id: "jalyukt-shivar-subsidy",
    name: "Jalyukt Shivar Abhiyan",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers in drought-prone areas of Maharashtra. Community/village-level participation required.",
    criteria: "Eligibility: drought-prone zone, village/community participation, and local body approval.",
    parameters: "Subsidy for water conservation structures (farm ponds, check dams, nala bunding). Village-level implementation.",
    features: "Improves groundwater levels. Reduces drought impact on agriculture. Community-based water self-sufficiency.",
    createdAt: now,
  },
  {
    id: "birsa-munda-subsidy",
    name: "Birsa Munda Krishi Kranti Yojana",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Scheduled Tribe (ST) category farmers in Maharashtra with valid tribal certificate and cultivable land.",
    criteria: "Eligibility: ST certificate, cultivable land, and irrigation or farm-development requirement.",
    parameters: "Up to 100% subsidy on eligible components including irrigation, farm development, and equipment.",
    features: "Irrigation support and farm development. Tribal-focused agricultural development. Comprehensive farm improvement package.",
    createdAt: now,
  },
  {
    id: "ambedkar-krishi-subsidy",
    name: "Dr. Babasaheb Ambedkar Krishi Swavalamban Yojana",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Scheduled Caste (SC) category farmers in Maharashtra with valid caste certificate and cultivable land.",
    criteria: "Eligibility: SC certificate, cultivable land, and approved farm development need.",
    parameters: "Financial support for irrigation infrastructure, farm pond, drip system, pump set, and land levelling.",
    features: "Improves farm productivity for SC farmers. Subsidized irrigation infrastructure. Land development support.",
    createdAt: now,
  },
  {
    id: "micro-irrigation-maha",
    name: "Maharashtra Micro Irrigation Scheme",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers with cultivable land in Maharashtra. Small and marginal farmers given priority.",
    criteria: "Eligibility: landholding in Maharashtra, drip/sprinkler need, and small/marginal farmer priority where applicable.",
    parameters: "Additional state subsidy over and above central PMKSY subsidy for drip and sprinkler systems.",
    features: "Promotes drip irrigation and water efficiency. State top-up over central scheme. Reduces irrigation water wastage.",
    createdAt: now,
  },
  {
    id: "farm-mechanization-maha",
    name: "Farm Mechanization Subsidy (Maharashtra)",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Small and marginal farmers in Maharashtra. Priority to economically weaker farmers for tools and machinery.",
    criteria: "Eligibility: small/marginal farmer status, valid landholding, and machinery requirement.",
    parameters: "State subsidy on agricultural tools and machinery. Top-up over central SMAM scheme subsidy.",
    features: "State top-up over central SMAM subsidy. Reduces manual labor for small farmers. Custom Hiring Centers supported.",
    createdAt: now,
  },
  {
    id: "electricity-subsidy-maha",
    name: "Electricity Subsidy for Farmers (Maharashtra)",
    type: "Subsidy",
    region: "Maharashtra",
    eligibility: "Farmers using electricity for irrigation purposes. Must have registered agricultural pump connection.",
    criteria: "Eligibility: agricultural pump connection, irrigation use, and verified electricity account.",
    parameters: "Reduced electricity tariff for agricultural pump connections. Flat rate billing for irrigation pumps.",
    features: "Lowers irrigation cost substantially. Flat rate instead of metered billing. Administered through MSEDCL.",
    createdAt: now,
  },
];

export async function seedInsuranceSubsidies(db: Db): Promise<void> {
  try {
    const collection = db.collection("insurance_subsidies");
    const count = await collection.countDocuments();
    if (count > 0) {
      logger.info({ count }, "Insurance subsidies already seeded");
      return;
    }
    await collection.createIndex({ id: 1 }, { unique: true });
    await collection.createIndex({ type: 1 });
    await collection.createIndex({ region: 1 });
    await collection.createIndex({ name: "text" });
    await collection.insertMany(INSURANCE_SUBSIDIES as unknown[]);
    logger.info({ inserted: INSURANCE_SUBSIDIES.length }, "Insurance subsidies seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed insurance subsidies");
  }
}
```

---

## 6. Call the Seed Function on Server Startup

In your server entry point (e.g. `src/index.ts`), call `seedInsuranceSubsidies` when the server starts:

```typescript
import { seedInsuranceSubsidies } from "./lib/seed-insurance-subsidies";

// Inside your startup / connectMongo().then(...) block:
await seedInsuranceSubsidies(db);
```

---

## 7. CSS — Required Animation

Make sure your global CSS file (`index.css` or `globals.css`) includes the `animate-fade-in` animation. Add this if it is not already present:

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

## 8. Tailwind — Required Color Tokens

The badges and UI use these Tailwind CSS color tokens. Make sure your `tailwind.config.ts` defines them. If they are already defined in your project you can skip this.

```typescript
// tailwind.config.ts — inside theme.extend.colors:
colors: {
  success:   "hsl(var(--success))",    // green — used for Insurance badge
  secondary: "hsl(var(--secondary))",  // gold  — used for Subsidy badge
  primary:   "hsl(var(--primary))",    // blue  — used for Central badge, buttons
}
```

And in your CSS variables:
```css
:root {
  --success:   142 71% 45%;   /* green */
  --secondary: 43  96% 56%;   /* gold  */
  --primary:   221 83% 53%;   /* blue  */
}
```

> Adjust the HSL values to match your project's design system.

---

## Data Summary

| Category              | Count |
|-----------------------|-------|
| Central Insurance     | 4     |
| Central Subsidies     | 6     |
| Maharashtra Insurance | 2     |
| Maharashtra Subsidies | 8     |
| **Total**             | **20**|

**Scheme IDs:** `pmfby-central`, `rwbcis`, `upis`, `cpis`, `pm-kisan-subsidy`, `pmksy-subsidy`, `smam`, `aif-subsidy`, `pm-fme`, `iss`, `pmfby-maharashtra`, `state-crop-insurance-addons`, `namo-shetkari-subsidy`, `saur-krushi-pump-subsidy`, `jalyukt-shivar-subsidy`, `birsa-munda-subsidy`, `ambedkar-krishi-subsidy`, `micro-irrigation-maha`, `farm-mechanization-maha`, `electricity-subsidy-maha`

---

## API Endpoints Reference

| Method | Path                            | Description                                      |
|--------|---------------------------------|--------------------------------------------------|
| GET    | `/api/insurance-subsidies`      | Paginated list. Params: `page`, `limit`, `type`, `region`, `search` |
| GET    | `/api/insurance-subsidies/:id`  | Single scheme by `id` field                      |
