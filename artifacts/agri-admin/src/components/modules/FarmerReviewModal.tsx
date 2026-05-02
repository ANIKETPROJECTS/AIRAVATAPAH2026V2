import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X, CheckCircle2, XCircle, ShieldCheck, Loader2,
  FileStack, Sprout, ClipboardCheck, CreditCard, BookOpen,
  UserCheck, RotateCcw, AlertTriangle, FileText,
} from "lucide-react";
import {
  type DocTypeId,
  type ExtractionState,
  type LangCode,
  DEFAULT_STATE,
  EMPTY_PROFILE,
  FarmerProfileCard,
  FieldsTable,
  DOC_CARDS,
  DOC_CARD_SHORT,
  type FarmerProfile,
} from "./NewRegistration";
import { apiUpdateFarmer, type FarmerRecord } from "@/data/farmerApi";

type DocStates = Record<DocTypeId, ExtractionState>;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Verified:  "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-700",
    Pending:   "bg-yellow-100 text-yellow-700",
    Active:    "bg-green-100 text-green-700",
    Inactive:  "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function DocTabIcon({ id }: { id: DocTypeId }) {
  if (id === "form7") return <FileStack className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "form12") return <Sprout className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "form8a") return <ClipboardCheck className="h-3.5 w-3.5 flex-shrink-0" />;
  if (id === "aadhar") return <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />;
  return <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />;
}

function DocContentView({
  state,
  docId,
  lang,
}: {
  state: ExtractionState;
  docId: DocTypeId;
  lang: LangCode;
}) {
  const [showRawText, setShowRawText] = useState(false);

  const hasFields = state.sections.some(s =>
    s.fields.some(f => f.value && f.value !== "—")
  );
  const hasTables = state.sections.some(s => s.tables && s.tables.length > 0);
  const hasRawTables = state.rawTables && state.rawTables.length > 0;
  const hasTextBlocks = state.textBlocks && state.textBlocks.length > 0;
  const hasMeaningfulContent = hasFields || hasTables || hasRawTables;

  return (
    <div className="space-y-4">
      {/* Filename badge */}
      {state.filename && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 border border-border">
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-mono truncate">{state.filename}</span>
        </div>
      )}

      {/* Aadhar photo if present */}
      {docId === "aadhar" && state.aadharPhoto && (
        <div className="flex justify-center">
          <img
            src={`data:${state.aadharPhoto.mimeType};base64,${state.aadharPhoto.base64}`}
            alt="Aadhaar photo"
            className="h-28 w-28 rounded-full object-cover border-4 border-border shadow"
          />
        </div>
      )}

      {/* Main structured content */}
      {(state.sections.length > 0 || hasRawTables) && (
        <FieldsTable
          sections={state.sections}
          rawTables={state.rawTables ?? []}
          textBlocks={[]}
          docId={docId}
          lang={lang}
        />
      )}

      {/* Sparse data warning */}
      {!hasMeaningfulContent && state.sections.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Limited structured data extracted</p>
            <p className="text-xs mt-1 opacity-80">
              The OCR could not extract structured fields from this document.
              {hasTextBlocks ? " Raw text is available below." : " The document may be unclear or in an unsupported format."}
            </p>
          </div>
        </div>
      )}

      {/* No data at all */}
      {state.sections.length === 0 && !hasRawTables && !hasTextBlocks && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <BookOpen className="h-10 w-10 opacity-20" />
          <p className="text-sm">No data extracted from this document.</p>
        </div>
      )}

      {/* Raw text blocks — always show for documents, expanded */}
      {hasTextBlocks && (
        <div>
          <button
            type="button"
            onClick={() => setShowRawText(o => !o)}
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full text-left px-1 py-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Raw extracted text ({state.textBlocks.length} block{state.textBlocks.length !== 1 ? "s" : ""})
            <span className="ml-auto text-[10px]">{showRawText ? "▲ hide" : "▼ show"}</span>
          </button>
          {(showRawText || !hasMeaningfulContent) && (
            <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
              {state.textBlocks.map((tb, i) => (
                <div key={i} className="border-l-4 border-l-border bg-muted/30 border border-border rounded-md px-4 py-3 text-xs whitespace-pre-wrap break-words text-foreground font-mono">
                  {tb}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FarmerReviewModal({
  farmer,
  onClose,
  onUpdated,
}: {
  farmer: FarmerRecord;
  onClose: () => void;
  onUpdated: (f: FarmerRecord) => void;
}) {
  const [lang, setLang] = useState<LangCode>("mr");
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [modalStep, setModalStep] = useState<"review" | "verify">("review");

  const initialProfile: FarmerProfile = useMemo(() => {
    if (farmer.farmerProfile) return farmer.farmerProfile as unknown as FarmerProfile;
    return {
      ...EMPTY_PROFILE,
      name: farmer.name ?? "",
      village: farmer.village ?? "",
      taluka: farmer.taluka ?? "",
      district: farmer.district ?? "",
      aadhaar: farmer.aadhaar ?? "",
      khateNumber: farmer.khateNumber ?? "",
      surveyNumber: farmer.surveyNumber ?? "",
      land: String(farmer.land ?? ""),
      crop: farmer.crop ?? "",
      bankAccount: farmer.bankAccount ?? "",
    };
  }, [farmer]);

  const [profile, setProfile] = useState<FarmerProfile>(initialProfile);

  const handleProfileChange = (field: keyof FarmerProfile, value: string) => {
    setProfile(p => ({ ...p, [field]: value }));
  };

  const docStates: DocStates = useMemo(() => {
    const states = Object.fromEntries(
      DOC_CARDS.map(c => [c.id, { ...DEFAULT_STATE }])
    ) as DocStates;
    if (farmer.extractionData) {
      for (const [docId, saved] of Object.entries(farmer.extractionData)) {
        states[docId as DocTypeId] = {
          status: "complete",
          filename: saved.filename ?? "",
          requestId: null,
          sections: Array.isArray(saved.sections) ? saved.sections : [],
          images: null,
          rawTables: Array.isArray(saved.rawTables) ? saved.rawTables : [],
          textBlocks: Array.isArray(saved.textBlocks) ? saved.textBlocks : [],
          aadharPhoto: saved.aadharPhoto ?? null,
          error: null,
        };
      }
    }
    return states;
  }, [farmer]);

  const completedCards = DOC_CARDS.filter(c => docStates[c.id].status === "complete");
  const [activeTab, setActiveTab] = useState<DocTypeId | "profile">(
    completedCards.length > 0 ? completedCards[0].id : "profile"
  );

  const handleUpdateStatus = async (status: FarmerRecord["status"]) => {
    setSaving(status);
    try {
      const updated = await apiUpdateFarmer(farmer.farmerId, {
        status,
        farmerProfile: profile as unknown as Record<string, string>,
        name: profile.name || farmer.name,
        village: profile.village || farmer.village,
        taluka: profile.taluka || farmer.taluka,
        district: profile.district || farmer.district,
        khateNumber: profile.khateNumber || farmer.khateNumber,
      });
      onUpdated(updated);
      onClose();
    } catch {
      setSaving(null);
    }
  };

  const isPending = farmer.status === "Pending";
  const isVerified = farmer.status === "Verified";
  const isCancelled = farmer.status === "Cancelled";

  const content = (
    <div
      className="fixed inset-0 bg-background flex flex-col"
      style={{ zIndex: 9999 }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base">{farmer.name}</h2>
              <StatusBadge status={farmer.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {farmer.farmerId}
              {farmer.aadhaar ? ` · Aadhaar: ${farmer.aadhaar}` : ""}
              {farmer.khateNumber && farmer.khateNumber !== "—" ? ` · Khate: ${farmer.khateNumber}` : ""}
              {farmer.village ? ` · ${farmer.village}, ${farmer.district}` : ""}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-muted/30 flex-shrink-0 overflow-x-auto">
        {completedCards.map(card => (
          <button
            key={card.id}
            onClick={() => setActiveTab(card.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === card.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <DocTabIcon id={card.id} />
            {DOC_CARD_SHORT[card.id]?.["en"] ?? card.id}
          </button>
        ))}
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5 flex-shrink-0" />
          Farmer Profile
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* No extraction data */}
        {completedCards.length === 0 && activeTab !== "profile" && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <BookOpen className="h-10 w-10 opacity-20" />
            <p className="text-sm font-medium">No documents saved for this farmer.</p>
            <p className="text-xs opacity-70">Documents were not uploaded during registration.</p>
          </div>
        )}

        {/* Document tab content */}
        {activeTab !== "profile" && docStates[activeTab as DocTypeId]?.status === "complete" && (
          <DocContentView
            state={docStates[activeTab as DocTypeId]}
            docId={activeTab as DocTypeId}
            lang={lang}
          />
        )}

        {/* Profile tab */}
        {activeTab === "profile" && (
          <FarmerProfileCard
            docStates={docStates}
            profile={profile}
            onChange={handleProfileChange}
            onApprove={() => {}}
            approved={false}
            onBack={() => setActiveTab(completedCards[0]?.id ?? "profile")}
            lang={lang}
            onLangChange={setLang}
            customPhoto={customPhoto}
            onCustomPhotoChange={setCustomPhoto}
            hideFooter={true}
          />
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="flex-shrink-0 border-t border-border bg-card px-6 py-4">

        {/* Pending — step 1: Review */}
        {isPending && modalStep === "review" && (
          <div className="flex items-center gap-3 justify-between flex-wrap gap-y-2">
            <p className="text-sm text-muted-foreground">Review all documents and farmer profile before deciding.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateStatus("Cancelled")}
                disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {saving === "Cancelled" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject Farmer
              </button>
              <button
                onClick={() => setModalStep("verify")}
                disabled={!!saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept Farmer
              </button>
            </div>
          </div>
        )}

        {/* Pending — step 2: Approve verification */}
        {isPending && modalStep === "verify" && (
          <div className="flex items-center gap-3 justify-between flex-wrap gap-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Farmer accepted — verify data and approve.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setModalStep("review")}
                disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => handleUpdateStatus("Cancelled")}
                disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {saving === "Cancelled" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject
              </button>
              <button
                onClick={() => handleUpdateStatus("Verified")}
                disabled={!!saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving === "Verified" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Approve Verification
              </button>
            </div>
          </div>
        )}

        {/* Verified — read-only */}
        {isVerified && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-700">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              This farmer has been verified and approved.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* Cancelled — with Restore option */}
        {isCancelled && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border bg-red-50 border-red-200 text-red-700">
              <XCircle className="h-4 w-4 flex-shrink-0" />
              This farmer registration was cancelled.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateStatus("Pending")}
                disabled={!!saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm font-medium hover:bg-yellow-100 transition-colors disabled:opacity-50"
              >
                {saving === "Pending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Restore to Pending
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
