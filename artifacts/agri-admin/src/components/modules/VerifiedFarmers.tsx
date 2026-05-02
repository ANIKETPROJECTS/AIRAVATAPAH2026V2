import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Users, Loader2, AlertCircle, BadgeCheck, BarChart3,
  AlertTriangle, Ticket, Filter, RefreshCw, MapPin, Phone,
  Sprout, X, ChevronUp, Hash, Shield, FileText, Landmark, CreditCard
} from "lucide-react";
import { apiFetchFarmers, type FarmerRecord } from "@/data/farmerApi";
import VerifiedFarmerCard from "@/components/modules/VerifiedFarmerCard";

function formatLandHAR(val: number | string | undefined): string {
  if (val === undefined || val === null || val === "" || val === "0" || val === 0) return "—";
  const s = String(val).trim();
  const parts = s.split(".");
  if (parts.length === 3) {
    const [h, a, sm] = parts;
    return `${h} हे. ${a} आर. ${sm} चौ.मी.`;
  }
  if (parts.length === 2) {
    const [h, a] = parts;
    if (a === "0" || a === "00") return `${h} हे.`;
    return `${h} हे. ${a} आर.`;
  }
  return `${s} हे.`;
}

function landToHectares(val: number | string | undefined): number {
  if (!val) return 0;
  const s = String(val).trim();
  const parts = s.split(".");
  return parseFloat(parts[0] || "0") + parseFloat(parts[1] || "0") / 100 + parseFloat(parts[2] || "0") / 10000;
}

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-yellow-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
];

function farmerGradient(id: string) {
  const n = parseInt(id.replace(/\D/g, "") || "0") % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[n];
}

function schemeCount(f: FarmerRecord) {
  const ha = landToHectares(f.land);
  const hasBank = !!(f.bankAccount && f.bankAccount !== "—" && f.bankAccount.length > 4);
  let count = 0;
  if (ha > 0 && ha <= 2 && hasBank) count += 2; // PM-KISAN + NMSA
  if (ha > 0) count += 3; // PMFBY, SHC, GKY
  if (ha > 0 && hasBank) count++; // KCC
  if (ha >= 0.5) count++; // PKVY
  if (ha >= 0.6) count++; // MMS
  if (ha >= 0.4) count++; // DRIP
  return Math.min(count, 10);
}

function CompactFarmerCard({
  farmer, selected, onClick,
}: {
  farmer: FarmerRecord;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = farmer.name.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const grad = farmerGradient(farmer.farmerId);
  const eligible = schemeCount(farmer);
  const seed = parseInt(farmer.farmerId.replace(/\D/g, "") || "1") % 100;
  const openGrievances = seed < 30 ? 3 : seed < 60 ? 2 : 1;
  const openTickets = seed < 40 ? 3 : seed < 70 ? 2 : 1;
  const regDate = new Date(farmer.addedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden cursor-pointer
        ${selected
          ? "border-secondary shadow-lg shadow-secondary/15 scale-[1.01]"
          : "border-border hover:border-secondary/50 hover:shadow-md hover:scale-[1.005]"
        } bg-card`}
    >
      {/* Card top color bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${grad}`} />

      <div className="p-4">
        {/* Avatar + Badges row */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center font-bold text-white text-base shadow-sm flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
              <BadgeCheck className="h-2.5 w-2.5" /> Verified
            </span>
            {farmer.source === "ocr" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold border border-purple-200">AI-OCR</span>
            )}
            {farmer.source === "manual" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">Manual</span>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="mb-0.5">
          <h3 className="font-bold text-sm text-foreground leading-tight truncate">{farmer.name}</h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{farmer.farmerId}</p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-3 mt-1">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{farmer.village}, {farmer.district}</span>
        </div>

        {/* Crop + Land */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted/40 rounded-lg px-2.5 py-1.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">क्षेत्रफळ</div>
            <div className="text-[11px] font-semibold text-foreground font-mono leading-tight">{formatLandHAR(farmer.land)}</div>
          </div>
          <div className="bg-muted/40 rounded-lg px-2.5 py-1.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">पीक</div>
            <div className="text-[11px] font-semibold text-foreground truncate leading-tight">{farmer.crop || "—"}</div>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            <Shield className="h-2.5 w-2.5" />{eligible} Schemes
          </span>
          <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
            openGrievances > 0
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : "bg-muted/30 text-muted-foreground border-border"
          }`}>
            <AlertTriangle className="h-2.5 w-2.5" />{openGrievances} GRV
          </span>
          <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
            openTickets > 0
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-muted/30 text-muted-foreground border-border"
          }`}>
            <Ticket className="h-2.5 w-2.5" />{openTickets} TKT
          </span>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Reg: {regDate}</span>
          <span className={`text-[10px] font-semibold transition-colors ${selected ? "text-secondary" : "text-muted-foreground group-hover:text-secondary"}`}>
            {selected ? "▲ Hide Profile" : "▼ View Profile"}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function VerifiedFarmers() {
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [distFilter, setDistFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

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

  const filtered = useMemo(() => farmers.filter(f => {
    const s = search.toLowerCase();
    const matchSearch = !s || f.name.toLowerCase().includes(s)
      || f.farmerId.toLowerCase().includes(s)
      || f.aadhaar.includes(s)
      || f.village.toLowerCase().includes(s);
    const matchDist = !distFilter || f.district === distFilter;
    return matchSearch && matchDist;
  }), [search, distFilter, farmers]);

  const selectedFarmer = filtered.find(f => f.farmerId === selectedId) ?? null;

  const handleSelect = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  };

  const totalEligibleSchemes = farmers.reduce((acc, f) => acc + schemeCount(f), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Loading verified farmers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span>{error}</span>
        <button onClick={loadFarmers} className="ml-auto flex items-center gap-1 text-xs underline">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in" style={{ opacity: 0 }}>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <BadgeCheck className="h-5 w-5 text-emerald-600" />, bg: "bg-emerald-100", value: farmers.length, label: "Verified Farmers" },
          { icon: <BarChart3 className="h-5 w-5 text-blue-600" />, bg: "bg-blue-100", value: totalEligibleSchemes, label: "Total Scheme Eligibilities" },
          { icon: <AlertTriangle className="h-5 w-5 text-orange-500" />, bg: "bg-orange-100", value: farmers.length > 0 ? 2 : 0, label: "Open Grievances" },
          { icon: <Ticket className="h-5 w-5 text-red-500" />, bg: "bg-red-100", value: farmers.length > 0 ? 1 : 0, label: "Open Support Tickets" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedId(null); }}
            placeholder="Search by name, ID, Aadhaar, village..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={distFilter}
            onChange={e => { setDistFilter(e.target.value); setSelectedId(null); }}
            className="text-sm bg-card border border-border rounded-lg px-3 py-2"
          >
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          Showing {filtered.length} of {farmers.length} farmer{farmers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Empty states ── */}
      {farmers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
            <Users className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
            <div className="text-base font-semibold text-foreground mb-1">No Verified Farmers Yet</div>
            <p className="text-sm text-muted-foreground max-w-xs">
              When a farmer is verified in the Farmer Registry, their full profile will appear here.
            </p>
          </div>
        </div>
      )}

      {farmers.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <Search className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No farmers match your search.</p>
          <button
            onClick={() => { setSearch(""); setDistFilter(""); }}
            className="text-xs text-secondary underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── 4-column compact card grid ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(f => (
            <CompactFarmerCard
              key={f.farmerId}
              farmer={f}
              selected={selectedId === f.farmerId}
              onClick={() => handleSelect(f.farmerId)}
            />
          ))}
        </div>
      )}

      {/* ── Expanded full profile ── */}
      {selectedFarmer && (
        <div ref={detailRef} className="mt-2">
          {/* Detail header bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-secondary/8 border border-secondary/20 rounded-t-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BadgeCheck className="h-4 w-4 text-secondary" />
              Full Profile — {selectedFarmer.name}
              <span className="font-mono text-xs text-muted-foreground">({selectedFarmer.farmerId})</span>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
          <div className="border border-t-0 border-secondary/20 rounded-b-2xl overflow-hidden">
            <VerifiedFarmerCard farmer={selectedFarmer} />
          </div>
        </div>
      )}

    </div>
  );
}
