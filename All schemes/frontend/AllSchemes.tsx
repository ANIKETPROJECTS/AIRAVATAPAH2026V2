import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";

interface EligibilityParam {
  parameter: string;
  rule: string;
  validation: string;
}

interface Scheme {
  id: string;
  name: string;
  type: "CENTRAL" | "STATE";
  state: string | null;
  category: string;
  description: string;
  eligibility: {
    summary: string;
    parameters: EligibilityParam[];
    familyCriteria: string[];
    exclusions?: string[];
  };
  documents: string[];
  validationRules: string[];
  approvalRules: { approve: string[]; reject: string[] };
  benefits: string;
  status: "Active" | "Closed";
}

const PAGE_SIZE = 10;

function TypeBadge({ type, compact }: { type: "CENTRAL" | "STATE"; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex flex-col items-center gap-0.5 w-fit">
        <span className={`text-base leading-none ${type === "CENTRAL" ? "text-primary" : "text-secondary"}`}>
          {type === "CENTRAL" ? "🏛" : "🏠"}
        </span>
        <span className={`text-[11px] font-semibold leading-none ${type === "CENTRAL" ? "text-primary" : "text-[#b45309]"}`}>
          {type === "CENTRAL" ? "Central" : "Maharashtra"}
        </span>
      </div>
    );
  }
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${type === "CENTRAL" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"}`}>
      {type === "CENTRAL" ? "🏛 Central" : "🏠 Maharashtra"}
    </span>
  );
}

function StatusText({ status }: { status: "Active" | "Closed" }) {
  return (
    <span className={`text-sm font-semibold ${status === "Active" ? "text-success" : "text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: "Active" | "Closed" }) {
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
      {status === "Active" ? "✅ Active" : "⛔ Closed"}
    </span>
  );
}

function CategoryBadge({ category, compact }: { category: string; compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-block text-xs text-foreground font-medium leading-snug text-left">
        {category}
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground font-medium">
      {category}
    </span>
  );
}

function SchemeDetailModal({ scheme, onClose }: { scheme: Scheme; onClose: () => void }) {
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
      style={{ minWidth: 480 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border bg-muted/20 flex-shrink-0">
        <div className="flex-1 pr-3">
          <h2 className="font-heading text-base font-semibold leading-snug mb-1.5">{scheme.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={scheme.type} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${scheme.status === "Active" ? "text-success" : "text-muted-foreground"}`}>
              ● {scheme.status}
            </span>
            <span className="text-xs text-muted-foreground font-medium">{scheme.category}</span>
          </div>
        </div>
        <button onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">

        {/* Overview + Benefits */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Overview</p>
            <p className="text-xs leading-relaxed text-foreground">{scheme.description}</p>
          </div>
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg px-3 py-2.5">
            <p className="text-[11px] font-semibold text-secondary mb-1 uppercase tracking-wide">Benefits</p>
            <p className="text-xs font-medium leading-relaxed">{scheme.benefits}</p>
          </div>
        </div>

        {/* Eligibility */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Eligibility</p>
          <p className="text-xs italic text-muted-foreground mb-2">{scheme.eligibility.summary}</p>
          {scheme.eligibility.parameters.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[26%]">Parameter</th>
                    <th className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-[42%]">Rule</th>
                    <th className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {scheme.eligibility.parameters.map((p, i) => (
                    <tr key={i} className="border-t border-border/40">
                      <td className="px-3 py-1.5 text-xs font-medium">{p.parameter}</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{p.rule}</td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">{p.validation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Family Criteria + Exclusions */}
        <div className="grid grid-cols-2 gap-3">
          {scheme.eligibility.familyCriteria.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Family Criteria</p>
              <ul className="space-y-1">
                {scheme.eligibility.familyCriteria.map((c, i) => (
                  <li key={i} className="text-xs flex gap-1.5 items-start"><span className="text-primary mt-0.5 flex-shrink-0">•</span>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {scheme.eligibility.exclusions && scheme.eligibility.exclusions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-destructive mb-1">Exclusions</p>
              <ul className="space-y-1">
                {scheme.eligibility.exclusions.map((e, i) => (
                  <li key={i} className="text-xs flex gap-1.5 items-start"><span className="text-destructive flex-shrink-0">✗</span>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Documents + Validation Rules */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Required Documents</p>
            <ul className="space-y-1">
              {scheme.documents.map((d, i) => (
                <li key={i} className="text-xs flex gap-1.5 items-center">
                  <span className="text-sm flex-shrink-0">📄</span>{d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Validation Rules</p>
            <ul className="space-y-1">
              {scheme.validationRules.map((r, i) => (
                <li key={i} className="text-xs flex gap-1.5 items-start"><span className="text-warning flex-shrink-0">⚠</span>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Approve / Reject */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-success/5 border border-success/20 rounded-lg px-3 py-2.5">
            <p className="text-[11px] font-semibold text-success uppercase tracking-wide mb-1.5">✓ Approve When</p>
            <ul className="space-y-1">
              {scheme.approvalRules.approve.map((r, i) => (
                <li key={i} className="text-xs flex gap-1.5 items-start"><span className="text-success flex-shrink-0">✓</span>{r}</li>
              ))}
            </ul>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5">
            <p className="text-[11px] font-semibold text-destructive uppercase tracking-wide mb-1.5">✗ Reject When</p>
            <ul className="space-y-1">
              {scheme.approvalRules.reject.map((r, i) => (
                <li key={i} className="text-xs flex gap-1.5 items-start"><span className="text-destructive flex-shrink-0">✗</span>{r}</li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusToggle({ schemeId, status, onToggle }: { schemeId: string; status: "Active" | "Closed"; onToggle: (id: string, next: "Active" | "Closed") => void }) {
  const [loading, setLoading] = useState(false);
  const isActive = status === "Active";

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: "Active" | "Closed" = isActive ? "Closed" : "Active";
    setLoading(true);
    try {
      const res = await fetch(`/api/schemes/${schemeId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) onToggle(schemeId, next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        title={`Click to mark as ${isActive ? "Inactive" : "Active"}`}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60 ${isActive ? "bg-success" : "bg-destructive/80"}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
      <span className={`text-[10px] font-semibold leading-none ${isActive ? "text-success" : "text-destructive"}`}>
        {isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function TableRow({ scheme, onView, onStatusChange }: { scheme: Scheme; onView: () => void; onStatusChange: (id: string, status: "Active" | "Closed") => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr className="border-t border-border/50 hover:bg-success/10 transition-colors cursor-pointer">
        <td className="px-4 py-3 w-[30%]">
          <button onClick={onView} className="font-medium text-sm text-left hover:text-primary transition-colors leading-snug">{scheme.name}</button>
        </td>
        <td className="px-4 py-3 w-[10%] align-middle">
          <TypeBadge type={scheme.type} compact />
        </td>
        <td className="px-4 py-3 w-[14%] align-middle">
          <CategoryBadge category={scheme.category} compact />
        </td>
        <td className="px-4 py-3 w-[26%]">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{scheme.eligibility.summary}</p>
        </td>
        <td className="px-4 py-3 w-[9%] align-middle">
          <StatusToggle schemeId={scheme.id} status={scheme.status} onToggle={onStatusChange} />
        </td>
        <td className="px-4 py-3 w-[11%] align-middle">
          <div className="flex gap-1.5 items-center">
            <button onClick={onView} className="text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:opacity-80 transition-opacity whitespace-nowrap">Details</button>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
              className="p-1 rounded bg-muted hover:bg-muted/80 transition-colors flex-shrink-0"
              title="Toggle eligibility"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-border/30 bg-muted/10">
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Documents</p>
                <ul className="space-y-1">{scheme.documents.map((d, i) => <li key={i} className="flex gap-1.5"><span className="text-secondary">•</span>{d}</li>)}</ul>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Approve When</p>
                <ul className="space-y-1">{scheme.approvalRules.approve.map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-success">✓</span>{r}</li>)}</ul>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Reject When</p>
                <ul className="space-y-1">{scheme.approvalRules.reject.map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-destructive">✗</span>{r}</li>)}</ul>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function GridCard({ scheme, onView }: { scheme: Scheme; onView: () => void }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-sm leading-snug flex-1">{scheme.name}</h3>
        <StatusBadge status={scheme.status} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <TypeBadge type={scheme.type} />
        <CategoryBadge category={scheme.category} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">{scheme.description}</p>
      <div className="bg-secondary/10 rounded p-2.5">
        <p className="text-xs font-medium text-secondary-foreground line-clamp-2">{scheme.benefits}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Key Docs</p>
        <p className="text-xs text-muted-foreground">{scheme.documents.slice(0, 3).join(" · ")}{scheme.documents.length > 3 ? ` +${scheme.documents.length - 3} more` : ""}</p>
      </div>
      <button onClick={onView} className="text-sm px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity mt-auto">
        View Full Details
      </button>
    </div>
  );
}

export default function AllSchemes() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CENTRAL" | "STATE">("ALL");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Scheme | null>(null);

  const handleStatusChange = useCallback((id: string, status: "Active" | "Closed") => {
    setSchemes((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    setSelected((prev) => prev?.id === id ? { ...prev, status } : prev);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/schemes")
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json() as Promise<Scheme[]>;
      })
      .then((data) => { setSchemes(data); setLoading(false); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let s = schemes;
    if (typeFilter !== "ALL") s = s.filter((x) => x.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter((x) =>
        x.name.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q) ||
        x.description.toLowerCase().includes(q)
      );
    }
    return s;
  }, [schemes, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleFilter = (v: "ALL" | "CENTRAL" | "STATE") => { setTypeFilter(v); setPage(0); };

  const central = schemes.filter((s) => s.type === "CENTRAL").length;
  const state = schemes.filter((s) => s.type === "STATE").length;

  return (
    <div className="space-y-4 animate-fade-in" style={{ opacity: 0 }}>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search schemes..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
          {(["ALL", "CENTRAL", "STATE"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleFilter(t)}
              className={`text-sm px-3.5 py-1.5 rounded-md transition-colors ${typeFilter === t ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t === "ALL" ? "All" : t === "CENTRAL" ? "🏛 Central" : "🏠 Maharashtra"}
            </button>
          ))}
        </div>

        {/* View toggle */}
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
          ["Total Schemes", schemes.length],
          ["Central Govt", central],
          ["Maharashtra", state],
          ["Showing", filtered.length],
        ].map(([l, v]) => (
          <span key={l as string} className="text-xs bg-card border border-border rounded-full px-3 py-1.5 font-medium">
            {l}: <span className="text-primary">{v}</span>
          </span>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-muted/40 rounded-lg animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
          <p className="text-sm text-destructive font-medium">Failed to load schemes</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
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
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Eligibility Summary</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((s) => (
                  <TableRow key={s.id} scheme={s} onView={() => setSelected(s)} onStatusChange={handleStatusChange} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {safePage + 1} of {totalPages} · {filtered.length} schemes
            </span>
            <div className="flex gap-1">
              <button
                disabled={safePage === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`text-xs w-7 h-7 rounded transition-colors ${safePage === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageData.map((s) => (
              <GridCard key={s.id} scheme={s} onView={() => setSelected(s)} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Page {safePage + 1} of {totalPages} · {filtered.length} schemes
            </span>
            <div className="flex gap-1">
              <button
                disabled={safePage === 0}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`text-xs w-7 h-7 rounded transition-colors ${safePage === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selected && <SchemeDetailModal scheme={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
