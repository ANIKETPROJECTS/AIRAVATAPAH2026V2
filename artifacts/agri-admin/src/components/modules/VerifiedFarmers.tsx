import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Users, Loader2, AlertCircle, BadgeCheck, BarChart3, AlertTriangle, Ticket, Filter, RefreshCw } from "lucide-react";
import { apiFetchFarmers, type FarmerRecord } from "@/data/farmerApi";
import VerifiedFarmerCard from "@/components/modules/VerifiedFarmerCard";

export default function VerifiedFarmers() {
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [distFilter, setDistFilter] = useState("");

  const loadFarmers = useCallback(async () => {
    try {
      setError("");
      const data = await apiFetchFarmers();
      setFarmers(data.filter(f => f.status === "Verified"));
    } catch {
      setError("Failed to load farmers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFarmers(); }, [loadFarmers]);

  useEffect(() => {
    const handler = () => loadFarmers();
    window.addEventListener("farmer-registry-changed", handler);
    return () => window.removeEventListener("farmer-registry-changed", handler);
  }, [loadFarmers]);

  const districts = useMemo(() => [...new Set(farmers.map(f => f.district))].sort(), [farmers]);

  const filtered = useMemo(() => {
    return farmers.filter(f => {
      const s = search.toLowerCase();
      const matchSearch = !s || f.name.toLowerCase().includes(s) || f.farmerId.toLowerCase().includes(s) || f.aadhaar.includes(s) || f.village.toLowerCase().includes(s);
      const matchDist = !distFilter || f.district === distFilter;
      return matchSearch && matchDist;
    });
  }, [search, distFilter, farmers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading verified farmers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span>{error}</span>
        <button onClick={loadFarmers} className="ml-auto flex items-center gap-1 text-xs underline">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" style={{ opacity: 0 }}>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <BadgeCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{farmers.length}</div>
            <div className="text-xs text-muted-foreground">Verified Farmers</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{farmers.length * 5}</div>
            <div className="text-xs text-muted-foreground">Active Scheme Enrolments</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{farmers.length > 0 ? "2" : "0"}</div>
            <div className="text-xs text-muted-foreground">Open Grievances</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Ticket className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{farmers.length > 0 ? "1" : "0"}</div>
            <div className="text-xs text-muted-foreground">Open Support Tickets</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, Aadhaar, village..."
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={distFilter}
            onChange={e => setDistFilter(e.target.value)}
            className="text-sm bg-card border border-border rounded-xl px-3 py-2.5"
          >
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {farmers.length} farmer{farmers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Empty state ── */}
      {farmers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground mb-1">No Verified Farmers Yet</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              When a farmer's registration is reviewed and approved in the Farmer Registry, their full profile will appear here.
            </p>
          </div>
        </div>
      )}

      {farmers.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40" />
          <div className="text-sm text-muted-foreground">No farmers match your search.</div>
          <button onClick={() => { setSearch(""); setDistFilter(""); }} className="text-xs text-secondary underline">Clear filters</button>
        </div>
      )}

      {/* ── Farmer Cards ── */}
      <div className="space-y-6">
        {filtered.map(f => (
          <VerifiedFarmerCard key={f.farmerId} farmer={f} />
        ))}
      </div>

    </div>
  );
}
