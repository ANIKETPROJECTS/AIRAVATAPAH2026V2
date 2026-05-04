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
