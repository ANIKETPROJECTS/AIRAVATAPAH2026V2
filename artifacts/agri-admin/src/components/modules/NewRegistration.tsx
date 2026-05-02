import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload, CheckCircle2, XCircle, Loader2, FileText,
  User, Landmark, FileStack, Sprout,
  ClipboardCheck, UserCheck, Pencil, ThumbsUp, Camera,
  ArrowRight, ArrowLeft, ChevronRight,
} from "lucide-react";
import { apiCreateFarmer, notifyFarmerChange } from "@/data/farmerApi";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type DocTypeId = "form7" | "form12" | "form8a" | "aadhar" | "bank_passbook";
type ExtractionStatus = "idle" | "uploading" | "processing" | "complete" | "error";
type WorkflowStep = "upload" | "review";

interface DocCard {
  id: DocTypeId;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DOC_CARDS: DocCard[] = [
  {
    id: "form7",
    label: "Form 7 (Ownership Register)",
    shortLabel: "Form 7",
    description: "Maharashtra 7/12 — अधिकार अभिलेख (Rights Register)",
    icon: FileStack,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    id: "form12",
    label: "Form 12 (Crop Inspection Register)",
    shortLabel: "Form 12",
    description: "Maharashtra 7/12 — पीक पाहणी (Crop Inspection Register)",
    icon: Sprout,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    id: "form8a",
    label: "Form 8A (Holding Register)",
    shortLabel: "Form 8A",
    description: "Maharashtra — धारण जमिनींची नोंदवही (Holding Register)",
    icon: ClipboardCheck,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  {
    id: "aadhar",
    label: "Aadhaar Card",
    shortLabel: "Aadhaar",
    description: "UIDAI Aadhaar identity card",
    icon: User,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "bank_passbook",
    label: "Bank Passbook",
    shortLabel: "Passbook",
    description: "Bank account passbook front page",
    icon: Landmark,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
];

interface FieldRow {
  key: string;
  label: string;
  value: string;
}

interface TableData {
  key: string;
  label: string;
  columns: { key: string; label: string }[];
  rows: { values: Record<string, string> }[];
}

interface RawTable {
  blockId?: string;
  headers: string[];
  rows: string[][];
  html: string;
}

interface SectionData {
  title: string;
  fields: FieldRow[];
  tables: TableData[];
}

interface ExtractionState {
  status: ExtractionStatus;
  filename: string;
  requestId: string | null;
  sections: SectionData[];
  images: Record<string, string> | null;
  rawTables: RawTable[];
  textBlocks: string[];
  aadharPhoto: { base64: string; mimeType: string } | null;
  error: string | null;
}

const DEFAULT_STATE: ExtractionState = {
  status: "idle",
  filename: "",
  requestId: null,
  sections: [],
  images: null,
  rawTables: [],
  textBlocks: [],
  aadharPhoto: null,
  error: null,
};

export interface FarmerProfile {
  name: string;
  aadhaar: string;
  vid: string;
  dob: string;
  gender: string;
  fathersName: string;
  mobile: string;
  address: string;
  pincode: string;
  state: string;
  issueDate: string;
  enrolmentNumber: string;
  village: string;
  district: string;
  taluka: string;
  surveyNumber: string;
  puId: string;
  khateNumber: string;
  occupantClass: string;
  ownerNames: string;
  ownerShare: string;
  modeOfAcquisition: string;
  land: string;
  landRevenue: string;
  collectionCharges: string;
  nonAgriculturalArea: string;
  nonCultivatedArea: string;
  tenantName: string;
  tenantRent: string;
  otherRights: string;
  encumbrances: string;
  boundaryMarks: string;
  lastMutationNumber: string;
  lastMutationDate: string;
  pendingMutation: string;
  form8aYear: string;
  form8aReportDate: string;
  khateAccountType: string;
  khatedarNames: string;
  khatedarAddress: string;
  totalAssessment: string;
  totalDamageInherited: string;
  totalZpCess: string;
  totalGpCess: string;
  totalRecovery: string;
  grandTotal: string;
  crop: string;
  bankName: string;
  branchName: string;
  branchAddress: string;
  ifsc: string;
  micrCode: string;
  bankAccount: string;
  accountType: string;
  accountOpeningDate: string;
  customerIdCif: string;
  nomineeRelationship: string;
  bankHolderName: string;
  bankCustomerAddress: string;
  email: string;
}

const EMPTY_PROFILE: FarmerProfile = {
  name: "", aadhaar: "", vid: "", dob: "", gender: "", fathersName: "",
  mobile: "", address: "", pincode: "", state: "", issueDate: "", enrolmentNumber: "",
  village: "", district: "", taluka: "", surveyNumber: "", puId: "",
  khateNumber: "", occupantClass: "", ownerNames: "", ownerShare: "", modeOfAcquisition: "",
  land: "", landRevenue: "", collectionCharges: "", nonAgriculturalArea: "", nonCultivatedArea: "",
  tenantName: "", tenantRent: "", otherRights: "", encumbrances: "", boundaryMarks: "",
  lastMutationNumber: "", lastMutationDate: "", pendingMutation: "",
  form8aYear: "", form8aReportDate: "", khateAccountType: "", khatedarNames: "",
  khatedarAddress: "", totalAssessment: "", totalDamageInherited: "",
  totalZpCess: "", totalGpCess: "", totalRecovery: "", grandTotal: "", crop: "",
  bankName: "", branchName: "", branchAddress: "", ifsc: "", micrCode: "",
  bankAccount: "", accountType: "", accountOpeningDate: "", customerIdCif: "",
  nomineeRelationship: "", bankHolderName: "", bankCustomerAddress: "", email: "",
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollUntilDone(
  requestId: string,
  onComplete: (result: Omit<ExtractionState, "filename">) => void,
  onError: (msg: string) => void,
) {
  const maxAttempts = 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await sleep(3000);
    attempts++;
    const pollUrl = `${BASE_URL}/api/extract/${requestId}`;
    try {
      const res = await fetch(pollUrl);
      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch {
        onError("API server is unavailable. Please try again in a moment.");
        return;
      }
      if (!res.ok) {
        onError((data?.error as string) ?? `Server error ${res.status}`);
        return;
      }
      if (data.status === "processing") continue;
      if (data.status === "error") {
        onError((data.error as string) ?? "Extraction failed.");
        return;
      }
      if (data.status === "complete") {
        const markerData = data.marker as Record<string, unknown> | null | undefined;
        const markerImages: Record<string, string> | null =
          (markerData?.images as Record<string, string>) ?? null;
        const aadharPhoto: { base64: string; mimeType: string } | null =
          (data.aadhar_photo as { base64: string; mimeType: string }) ?? null;
        const structuredData = data.structured as Record<string, unknown> | null | undefined;
        onComplete({
          status: "complete",
          requestId,
          sections: (structuredData?.sections as SectionData[]) ?? [],
          images: markerImages,
          rawTables: (data.raw_tables as RawTable[]) ?? [],
          textBlocks: (data.text_blocks as string[]) ?? [],
          aadharPhoto,
          error: null,
        });
        return;
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Network error");
      return;
    }
  }
  onError("Timed out waiting for extraction result.");
}

function fieldMatch(field: FieldRow, keywords: string[]): boolean {
  const h = `${field.key} ${field.label}`.toLowerCase();
  return keywords.some((kw) => h.includes(kw));
}

function extractProfileFromStates(
  allStates: Record<DocTypeId, ExtractionState>,
): Partial<FarmerProfile> {
  const out: Partial<FarmerProfile> = {};

  const pick = (keywords: string[], field: keyof FarmerProfile, docTypes: DocTypeId[]) => {
    if (out[field]) return;
    for (const docId of docTypes) {
      const state = allStates[docId];
      if (state.status !== "complete") continue;
      for (const sec of state.sections) {
        for (const f of sec.fields) {
          if (f.value && f.value !== "—" && fieldMatch(f, keywords)) {
            out[field] = f.value;
            return;
          }
        }
      }
    }
  };

  pick(["full_name", "name"], "name", ["aadhar"]);
  pick(["aadhaar_number", "aadhaar", "uid", "uidai"], "aadhaar", ["aadhar"]);
  pick(["vid", "virtual_id"], "vid", ["aadhar"]);
  pick(["date_of_birth", "dob"], "dob", ["aadhar"]);
  pick(["gender"], "gender", ["aadhar"]);
  pick(["father", "husband", "guardian", "care_of"], "fathersName", ["aadhar"]);
  pick(["mobile_number", "mobile"], "mobile", ["aadhar"]);
  pick(["address"], "address", ["aadhar"]);
  pick(["pincode", "pin_code", "pin code", "postal"], "pincode", ["aadhar"]);
  pick(["state"], "state", ["aadhar"]);
  pick(["issue_date"], "issueDate", ["aadhar"]);
  pick(["enrolment_number", "enrolment_no"], "enrolmentNumber", ["aadhar"]);
  pick(["bank_name"], "bankName", ["bank_passbook"]);
  pick(["branch_name"], "branchName", ["bank_passbook"]);
  pick(["branch_address"], "branchAddress", ["bank_passbook"]);
  pick(["ifsc_code", "ifsc"], "ifsc", ["bank_passbook"]);
  pick(["micr_code", "micr"], "micrCode", ["bank_passbook"]);
  pick(["account_holder_name"], "bankHolderName", ["bank_passbook"]);
  pick(["customer address", "customer_address"], "bankCustomerAddress", ["bank_passbook"]);
  pick(["account_number"], "bankAccount", ["bank_passbook"]);
  pick(["account_type"], "accountType", ["bank_passbook"]);
  pick(["opening_date"], "accountOpeningDate", ["bank_passbook"]);
  pick(["customer_id"], "customerIdCif", ["bank_passbook"]);
  pick(["nominee_relationship"], "nomineeRelationship", ["bank_passbook"]);
  pick(["email"], "email", ["bank_passbook"]);
  pick(["village"], "village", ["form7", "form8a", "form12"]);
  pick(["taluka"], "taluka", ["form7", "form8a", "form12"]);
  pick(["district"], "district", ["form7", "form8a", "form12"]);
  pick(["survey_number"], "surveyNumber", ["form7", "form12"]);
  pick(["pu_id"], "puId", ["form7"]);
  pick(["khate_number", "khate number"], "khateNumber", ["form7", "form8a", "form12"]);
  pick(["occupant_class"], "occupantClass", ["form7"]);
  pick(["owner_names", "owner name"], "ownerNames", ["form7"]);
  pick(["owner_share"], "ownerShare", ["form7"]);
  pick(["mode_of_acquisition"], "modeOfAcquisition", ["form7"]);
  pick(["total_area"], "land", ["form7", "form8a"]);
  pick(["land_revenue_assessment"], "landRevenue", ["form7"]);
  pick(["collection_charges"], "collectionCharges", ["form7"]);
  pick(["non_agricultural_area"], "nonAgriculturalArea", ["form7"]);
  pick(["non_cultivated_area"], "nonCultivatedArea", ["form7"]);
  pick(["tenant_name"], "tenantName", ["form7"]);
  pick(["tenant_rent"], "tenantRent", ["form7"]);
  pick(["other_rights"], "otherRights", ["form7"]);
  pick(["encumbrances"], "encumbrances", ["form7"]);
  pick(["boundary_and_survey_marks"], "boundaryMarks", ["form7"]);
  pick(["last_mutation_number"], "lastMutationNumber", ["form7"]);
  pick(["last_mutation_date"], "lastMutationDate", ["form7"]);
  pick(["pending_mutation"], "pendingMutation", ["form7"]);
  pick(["year"], "form8aYear", ["form8a"]);
  pick(["report_date"], "form8aReportDate", ["form8a"]);
  pick(["account_type", "khata type", "account type"], "khateAccountType", ["form8a"]);
  pick(["khatedar_names", "khatedar name"], "khatedarNames", ["form8a"]);
  pick(["khatedar_address"], "khatedarAddress", ["form8a"]);
  pick(["total_assessment_or_judi", "total assessment"], "totalAssessment", ["form8a"]);
  pick(["total_damage_on_inherited_land", "total damage"], "totalDamageInherited", ["form8a"]);
  pick(["total_zp_local_cess", "zp local cess"], "totalZpCess", ["form8a"]);
  pick(["total_gp_local_cess", "gp local cess"], "totalGpCess", ["form8a"]);
  pick(["total_recovery_amount", "total recovery"], "totalRecovery", ["form8a"]);
  pick(["grand_total"], "grandTotal", ["form8a"]);
  pick(["crop_name", "crop"], "crop", ["form12"]);

  return out;
}

/**
 * Strip Devanagari administrative annotations that appear after survey numbers
 * in raw document HTML (e.g. "77/3 भूमिअभिलेख निर्णयात्" → "77/3").
 */
function cleanDocHtml(html: string): string {
  return html.replace(
    /(\d+(?:\/[\dA-Za-z]+)*)\s+[\u0900-\u097F][\u0900-\u097F\u0020\u00A0।,.-]*/g,
    (_match, surveyNum: string) => surveyNum,
  );
}

function isSectionAnchorLabel(text: string): boolean {
  return /^\s*[\u0900-\u097F]\s*\)/.test(text ?? "");
}

function splitLabelValue(line: string): { label: string; value: string | null } {
  const trimmed = (line ?? "").trim();
  if (!trimmed) return { label: "", value: null };
  const lastSpace = trimmed.search(/\s+\S+$/);
  if (lastSpace < 0) return { label: trimmed, value: null };
  const label = trimmed.slice(0, lastSpace).trim();
  const value = trimmed.slice(lastSpace).trim();
  if (!label) return { label: trimmed, value: null };
  if (/^[\u0966-\u096F0-9.,/\-()]+$/.test(value)) return { label, value };
  return { label: trimmed, value: null };
}

function SpannedTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  const colCount = Math.max(headers.length, ...rows.map((r) => r.length), 1);
  type Cell = { value: string; rowspan: number };
  const grid: (Cell | null)[][] = rows.map((r) => {
    const padded: (Cell | null)[] = r.map((c) => ({ value: c ?? "", rowspan: 1 }));
    while (padded.length < colCount) padded.push({ value: "", rowspan: 1 });
    return padded;
  });
  for (let c = 0; c < colCount; c++) {
    let anchorRow = -1;
    for (let r = 0; r < grid.length; r++) {
      const cell = grid[r][c];
      if (cell === null) continue;
      const isEmpty = !cell.value || cell.value.trim() === "";
      if (!isEmpty) { anchorRow = r; }
      else if (anchorRow >= 0) {
        const anchor = grid[anchorRow][c];
        if (anchor) anchor.rowspan += 1;
        grid[r][c] = null;
      }
    }
  }
  if (colCount > 0) {
    let sectionAnchorRow = -1;
    for (let r = 0; r < grid.length; r++) {
      const cell = grid[r][0];
      if (cell === null) continue;
      if (isSectionAnchorLabel(cell.value)) {
        sectionAnchorRow = r;
      } else if (sectionAnchorRow >= 0) {
        const anchor = grid[sectionAnchorRow][0];
        if (anchor) {
          const sub = (cell.value ?? "").trim();
          if (sub.length > 0) anchor.value = anchor.value ? `${anchor.value}\n${sub}` : sub;
          anchor.rowspan += 1;
        }
        grid[r][0] = null;
      }
    }
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border text-xs">
        {headers.length > 0 && (
          <thead>
            <tr className="bg-muted/40">
              {headers.map((h, i) => (
                <th key={i} className="border border-border p-2 text-left font-semibold align-top whitespace-pre-wrap">{h || ""}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {grid.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => {
                if (cell === null) return null;
                const hasContent = cell.value !== undefined && cell.value !== null && cell.value.length > 0;
                const lines = (cell.value ?? "").split("\n");
                return (
                  <td key={cIdx} rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined} className="border border-border px-2 py-1.5 align-top break-words">
                    {hasContent ? (
                      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 leading-relaxed">
                        {lines.flatMap((line, lIdx) => {
                          const { label, value } = splitLabelValue(line);
                          if (value === null) return [<div key={`${lIdx}-full`} className="col-span-2 whitespace-pre-wrap">{label.length > 0 ? label : "\u00A0"}</div>];
                          return [
                            <div key={`${lIdx}-label`} className="whitespace-pre-wrap">{label}</div>,
                            <div key={`${lIdx}-value`} className="whitespace-pre-wrap text-right tabular-nums">{value}</div>,
                          ];
                        })}
                      </div>
                    ) : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FieldsTable({
  sections,
  rawTables = [],
  textBlocks = [],
  docId,
}: {
  sections: SectionData[];
  rawTables?: RawTable[];
  textBlocks?: string[];
  docId?: DocTypeId;
}) {
  if (!sections.length && !rawTables.length && !textBlocks.length) return null;
  return (
    <div className="space-y-5">
      {sections.map((sec) => (
        <div key={sec.title}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{sec.title}</p>
          {sec.fields.filter(f => f.value && f.value !== "—").length > 0 && (
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {sec.fields.filter(f => f.value && f.value !== "—").map((f) => (
                    <tr key={f.key} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground w-2/5 font-medium">{f.label}</td>
                      <td className="px-4 py-2.5 text-foreground break-words">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sec.tables.map((tbl) => tbl.rows.length > 0 && (
            <div key={tbl.key} className="mt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">{tbl.label}</p>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      {tbl.columns.map(c => <th key={c.key} className="px-4 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {tbl.rows.map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        {tbl.columns.map(c => <td key={c.key} className="px-4 py-2 text-foreground">{row.values[c.key] ?? "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}

      {rawTables.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source document tables</p>
          {rawTables.map((tbl, idx) => (
            <div key={tbl.blockId ?? idx} className="border-l-4 border-l-orange-400 bg-card border border-border rounded-md p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-700 mb-3">Table {idx + 1}</p>
              {docId === "form7" ? (
                <SpannedTable headers={tbl.headers} rows={tbl.rows} />
              ) : (
                <div
                  className="[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-border [&_th]:bg-muted/40 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:align-top text-foreground"
                  dangerouslySetInnerHTML={{ __html: cleanDocHtml(tbl.html) }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {textBlocks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Other text from document</p>
          {textBlocks.map((t, i) => (
            <div key={i} className="border-l-4 border-l-blue-400 bg-card border border-border rounded-md px-4 py-3 text-sm whitespace-pre-wrap break-words text-foreground">
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type StateUpdater = ExtractionState | ((prev: ExtractionState) => ExtractionState);

function DocUploadCard({
  card,
  state,
  onStateChange,
}: {
  card: DocCard;
  state: ExtractionState;
  onStateChange: (s: StateUpdater) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const Icon = card.icon;

  const handleFile = useCallback(async (file: File) => {
    onStateChange({ ...DEFAULT_STATE, status: "uploading", filename: file.name });
    const uploadUrl = `${BASE_URL}/api/extract`;
    const body = new FormData();
    body.append("file", file);
    body.append("document_type", card.id);
    body.append("mode", "accurate");
    try {
      const res = await fetch(uploadUrl, { method: "POST", body, redirect: "error" });
      let data: Record<string, unknown> | null = null;
      try {
        const rawText = await res.text();
        data = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        onStateChange({ ...DEFAULT_STATE, filename: file.name, status: "error", error: "API server is unavailable. Please try again in a moment." });
        return;
      }
      if (!res.ok) {
        onStateChange({ ...DEFAULT_STATE, filename: file.name, status: "error", error: (data?.error as string) ?? `Upload failed (${res.status})` });
        return;
      }
      const reqId = data?.request_id as string;
      if (!reqId) {
        onStateChange({ ...DEFAULT_STATE, filename: file.name, status: "error", error: "Server did not return a request ID." });
        return;
      }
      onStateChange((prev: ExtractionState) => ({ ...prev, status: "processing", requestId: reqId }));
      pollUntilDone(
        reqId,
        (result) => { onStateChange((prev: ExtractionState) => ({ ...prev, ...result })); },
        (msg) => { onStateChange((prev: ExtractionState) => ({ ...prev, status: "error", error: msg })); },
      );
    } catch (err) {
      onStateChange({ ...DEFAULT_STATE, filename: file.name, status: "error", error: err instanceof Error ? err.message : "Network error" });
    }
  }, [card.id, onStateChange]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const busy = state.status === "uploading" || state.status === "processing";
  const isComplete = state.status === "complete";
  const photoSrc = card.id === "aadhar" && state.aadharPhoto
    ? `data:${state.aadharPhoto.mimeType};base64,${state.aadharPhoto.base64}`
    : null;

  return (
    <div className={`rounded-xl border-2 bg-card shadow-sm overflow-hidden transition-all ${
      isComplete
        ? `${card.borderColor} ${card.bgColor}`
        : state.status === "error"
        ? "border-red-200 bg-red-50/30"
        : busy
        ? "border-amber-200 bg-amber-50/30"
        : "border-border bg-card"
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`mt-0.5 flex-shrink-0 p-2 rounded-lg ${card.bgColor}`}>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-foreground leading-tight">{card.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{card.description}</p>
              {state.filename && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <FileText className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{state.filename}</span>
                </p>
              )}
            </div>
            {photoSrc && (
              <div className="flex-shrink-0">
                <img
                  src={photoSrc}
                  alt="Aadhaar photo"
                  className="w-12 h-14 object-cover rounded-md border-2 border-white shadow-sm"
                />
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {isComplete && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Extracted
              </span>
            )}
            {state.status === "uploading" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </span>
            )}
            {state.status === "processing" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                <Loader2 className="h-3 w-3 animate-spin" /> Processing…
              </span>
            )}
            {state.status === "error" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <XCircle className="h-3 w-3" /> Failed
              </span>
            )}
            {!busy && (
              <button
                onClick={() => fileRef.current?.click()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isComplete
                    ? "bg-white/80 hover:bg-white border border-border text-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                {isComplete ? "Re-upload" : "Upload"}
              </button>
            )}
          </div>
        </div>

        {state.status === "idle" && (
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="mt-3 border-2 border-dashed border-border rounded-lg py-5 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
          >
            <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1.5" />
            <p className="text-xs text-muted-foreground">Drag & drop or click to upload PDF / image</p>
          </div>
        )}

        {state.status === "error" && state.error && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {state.error}
          </div>
        )}

        {isComplete && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              {state.sections.reduce((n, s) => n + s.fields.filter(f => f.value && f.value !== "—").length, 0)} fields extracted
              {state.rawTables.length > 0 ? ` · ${state.rawTables.length} table${state.rawTables.length > 1 ? "s" : ""}` : ""}
              {" · Review in next step"}
            </span>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff" className="hidden" onChange={onInputChange} />
    </div>
  );
}

function ReviewTabBar({
  completedCards,
  activeIndex,
  showProfile,
  onJump,
  onJumpToProfile,
  onBack,
}: {
  completedCards: DocCard[];
  activeIndex: number;
  showProfile: boolean;
  onJump: (i: number) => void;
  onJumpToProfile: () => void;
  onBack: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border mb-6 -mx-6 px-6 pt-3">
      <div className="flex items-center gap-1 mb-0 overflow-x-auto scrollbar-none">
        <button
          onClick={onBack}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-t-lg mr-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Upload
        </button>
        <div className="w-px h-5 bg-border flex-shrink-0 mr-2" />

        {completedCards.map((card, i) => {
          const Icon = card.icon;
          const isActive = !showProfile && activeIndex === i;
          return (
            <button
              key={card.id}
              onClick={() => onJump(i)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all rounded-t-sm whitespace-nowrap ${
                isActive
                  ? `border-b-2 ${card.borderColor.replace("border-", "border-b-")} ${card.color} bg-muted/30`
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? card.color : ""}`} />
              {card.shortLabel}
              {i < activeIndex || (showProfile) ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-0.5" />
              ) : null}
            </button>
          );
        })}

        <button
          onClick={onJumpToProfile}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all rounded-t-sm whitespace-nowrap ${
            showProfile
              ? "border-b-2 border-b-primary text-primary bg-muted/30"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Farmer Profile
        </button>
      </div>
    </div>
  );
}

function DocReviewPanel({
  card,
  state,
  index,
  total,
  onPrev,
  onNext,
  isLast,
}: {
  card: DocCard;
  state: ExtractionState;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const Icon = card.icon;
  const photoSrc = card.id === "aadhar" && state.aadharPhoto
    ? `data:${state.aadharPhoto.mimeType};base64,${state.aadharPhoto.base64}`
    : null;
  const fieldCount = state.sections.reduce((n, s) => n + s.fields.filter(f => f.value && f.value !== "—").length, 0);

  return (
    <div className="flex flex-col">
      <div className={`rounded-xl border-2 ${card.borderColor} ${card.bgColor} p-5 mb-5`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/70 shadow-sm">
              <Icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${card.color} mb-0.5`}>
                Document {index + 1} of {total}
              </p>
              <h3 className="font-bold text-lg text-foreground leading-tight">{card.label}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{card.description}</p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className={`text-2xl font-bold ${card.color}`}>{fieldCount}</p>
            <p className="text-xs text-muted-foreground">fields extracted</p>
          </div>
        </div>
      </div>

      {photoSrc && (
        <div className="mb-5 flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <img
            src={photoSrc}
            alt="Aadhaar profile photo"
            className="w-24 h-28 object-cover rounded-lg border-2 border-white shadow-md flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Camera className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-800">Profile Photo Extracted</p>
            </div>
            <p className="text-sm text-blue-600">Automatically extracted from Aadhaar Card</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <FieldsTable
          sections={state.sections}
          rawTables={state.rawTables}
          textBlocks={state.textBlocks}
          docId={card.id}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          onClick={onNext}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
            isLast
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
        >
          {isLast ? "Review Profile" : "Next Document"}
          {isLast ? <ChevronRight className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

type ProfileField = { key: keyof FarmerProfile; label: string; placeholder: string; span?: boolean };
type ProfileSubsection = { label: string; fields: ProfileField[] };

const PROFILE_SECTIONS: {
  id: string;
  label: string;
  docIds: DocTypeId[];
  headerColor: string;
  headerBg: string;
  subHeaderColor: string;
  subsections: ProfileSubsection[];
}[] = [
  {
    id: "identity",
    label: "Aadhaar Card",
    docIds: ["aadhar"],
    headerColor: "text-violet-700",
    headerBg: "bg-violet-50 border-violet-200",
    subHeaderColor: "text-violet-500",
    subsections: [
      {
        label: "Identity",
        fields: [
          { key: "name", label: "Full Name", placeholder: "Farmer's full name", span: true },
          { key: "gender", label: "Gender", placeholder: "Male / Female" },
          { key: "dob", label: "Date of Birth", placeholder: "DD/MM/YYYY" },
          { key: "aadhaar", label: "Aadhaar Number", placeholder: "XXXX XXXX XXXX" },
          { key: "vid", label: "Virtual ID (VID)", placeholder: "16-digit Virtual ID" },
          { key: "fathersName", label: "Father's / Husband's / Guardian's Name", placeholder: "Guardian name", span: true },
        ],
      },
      {
        label: "Address",
        fields: [
          { key: "address", label: "Address", placeholder: "Residential address", span: true },
          { key: "pincode", label: "PIN Code", placeholder: "6-digit PIN" },
          { key: "state", label: "State", placeholder: "State name" },
        ],
      },
      {
        label: "Document",
        fields: [
          { key: "issueDate", label: "Issue Date", placeholder: "DD/MM/YYYY" },
          { key: "mobile", label: "Mobile Number", placeholder: "10-digit number" },
          { key: "enrolmentNumber", label: "Enrolment No.", placeholder: "e.g. 0855/04021/00568" },
        ],
      },
    ],
  },
  {
    id: "bank",
    label: "Bank Passbook",
    docIds: ["bank_passbook"],
    headerColor: "text-blue-700",
    headerBg: "bg-blue-50 border-blue-200",
    subHeaderColor: "text-blue-500",
    subsections: [
      {
        label: "Bank & Branch",
        fields: [
          { key: "bankName", label: "Bank Name", placeholder: "e.g. State Bank of India" },
          { key: "branchName", label: "Branch Name", placeholder: "e.g. Samta Nagar Thane" },
          { key: "branchAddress", label: "Branch Address", placeholder: "Branch full address", span: true },
          { key: "ifsc", label: "IFSC Code", placeholder: "e.g. SBIN0013035" },
          { key: "micrCode", label: "MICR Code", placeholder: "9-digit MICR code" },
        ],
      },
      {
        label: "Account Holder",
        fields: [
          { key: "bankHolderName", label: "Account Holder Name", placeholder: "Full name of account holder", span: true },
          { key: "nomineeRelationship", label: "Nominee Relationship", placeholder: "e.g. S/D/H/o" },
          { key: "email", label: "Email Address", placeholder: "e.g. name@bank.in" },
          { key: "bankCustomerAddress", label: "Customer Address", placeholder: "Customer's mailing address", span: true },
        ],
      },
      {
        label: "Account Details",
        fields: [
          { key: "bankAccount", label: "Account Number", placeholder: "Account number" },
          { key: "accountType", label: "Account Type", placeholder: "e.g. Regular Savings Bank Account", span: true },
          { key: "customerIdCif", label: "Customer ID (CIF)", placeholder: "CIF number" },
          { key: "accountOpeningDate", label: "Account Opening Date", placeholder: "DD/MM/YYYY" },
        ],
      },
    ],
  },
  {
    id: "form7",
    label: "Form 7 — Ownership Register",
    docIds: ["form7"],
    headerColor: "text-emerald-700",
    headerBg: "bg-emerald-50 border-emerald-200",
    subHeaderColor: "text-emerald-600",
    subsections: [
      {
        label: "Location",
        fields: [
          { key: "village", label: "Village (गाव)", placeholder: "Village name" },
          { key: "taluka", label: "Taluka (तालुका)", placeholder: "Taluka name" },
          { key: "district", label: "District (जिल्हा)", placeholder: "District name" },
          { key: "surveyNumber", label: "Survey Number (भूमापन क्रमांक)", placeholder: "e.g. 77/3" },
          { key: "puId", label: "PU-ID", placeholder: "Permanent Unique ID" },
        ],
      },
      {
        label: "Ownership",
        fields: [
          { key: "khateNumber", label: "Khate Number (खाते क्र.)", placeholder: "e.g. 159" },
          { key: "occupantClass", label: "Occupant Class (भोगवटदार वर्ग)", placeholder: "e.g. Class 1" },
          { key: "ownerNames", label: "Owner Name(s) (शेताचे स्वामिनाव)", placeholder: "Full name(s)", span: true },
          { key: "ownerShare", label: "Owner Share / Hissa", placeholder: "e.g. 1/2" },
          { key: "modeOfAcquisition", label: "Mode of Acquisition", placeholder: "e.g. Purchase / Inheritance" },
        ],
      },
      {
        label: "Area & Assessment",
        fields: [
          { key: "land", label: "Total Area (क्षेत्र)", placeholder: "e.g. 2.06.00 H.R." },
          { key: "landRevenue", label: "Land Revenue Assessment (आकार)", placeholder: "Annual tax amount" },
          { key: "collectionCharges", label: "Collection Charges (पो.ख.)", placeholder: "Admin fee" },
          { key: "nonAgriculturalArea", label: "Non-Agricultural Area (अकृषिक क्षेत्र)", placeholder: "Area in non-agri use" },
          { key: "nonCultivatedArea", label: "Non-Cultivated Area (बिन शेती)", placeholder: "Uncultivated land" },
        ],
      },
      {
        label: "Rights & Encumbrances",
        fields: [
          { key: "tenantName", label: "Tenant Name (कुळाचे नाव)", placeholder: "Tenant / kul name" },
          { key: "tenantRent", label: "Tenant Rent (खंड)", placeholder: "Rent amount" },
          { key: "otherRights", label: "Other Rights (इतर अधिकार)", placeholder: "Easements, water rights…", span: true },
          { key: "encumbrances", label: "Encumbrance / Mortgage (बोजा / तारण)", placeholder: "Bank name & loan amount", span: true },
          { key: "boundaryMarks", label: "Boundary & Survey Marks", placeholder: "Boundary notes", span: true },
        ],
      },
      {
        label: "Mutation",
        fields: [
          { key: "lastMutationNumber", label: "Last Mutation No. (शेवटचा फेरफार क्र.)", placeholder: "e.g. 742" },
          { key: "lastMutationDate", label: "Last Mutation Date", placeholder: "Date of last mutation" },
          { key: "pendingMutation", label: "Pending Mutation (प्रलंबित फेरफार)", placeholder: "Yes / No / None" },
        ],
      },
    ],
  },
  {
    id: "form12",
    label: "Form 12 — Crop Inspection Register",
    docIds: ["form12"],
    headerColor: "text-green-700",
    headerBg: "bg-green-50 border-green-200",
    subHeaderColor: "text-green-600",
    subsections: [
      {
        label: "Location",
        fields: [
          { key: "village", label: "Village (गाव)", placeholder: "Village name" },
          { key: "taluka", label: "Taluka (तालुका)", placeholder: "Taluka name" },
          { key: "district", label: "District (जिल्हा)", placeholder: "District name" },
          { key: "surveyNumber", label: "Survey Number (भूमापन क्रमांक)", placeholder: "e.g. 77/3" },
          { key: "khateNumber", label: "Khate Number (खाते क्र.)", placeholder: "e.g. 159" },
        ],
      },
      {
        label: "Crop",
        fields: [
          { key: "crop", label: "Primary Crop (पिकांचे नाव)", placeholder: "e.g. Soybean, Wheat, Cotton", span: true },
        ],
      },
    ],
  },
  {
    id: "form8a",
    label: "Form 8A — Holding Register",
    docIds: ["form8a"],
    headerColor: "text-teal-700",
    headerBg: "bg-teal-50 border-teal-200",
    subHeaderColor: "text-teal-600",
    subsections: [
      {
        label: "Header Details",
        fields: [
          { key: "form8aYear", label: "Year (वर्ष)", placeholder: "e.g. 2016-15" },
          { key: "form8aReportDate", label: "Report Date", placeholder: "e.g. 12/20/2016" },
        ],
      },
      {
        label: "Khatedar (Account Holder)",
        fields: [
          { key: "khateNumber", label: "Khate Number (खाते क्र.)", placeholder: "e.g. 159" },
          { key: "khateAccountType", label: "Account Type (खात्याचा प्रकार)", placeholder: "e.g. अविभक्त कुटूंब खाते", span: true },
          { key: "khatedarNames", label: "Khatedar Name(s) (खातेदाराचे नाव)", placeholder: "Names as per 8A", span: true },
        ],
      },
      {
        label: "Totals",
        fields: [
          { key: "land", label: "Total Area (एकूण क्षेत्र)", placeholder: "Total area" },
          { key: "totalAssessment", label: "Total Assessment / Judi (एकूण आकारणी किंवा जुडी)", placeholder: "Total assessment amount" },
          { key: "totalDamageInherited", label: "Total Damage on Inherited Land (एकूण दुमाला जमिनीवरील नुकसान)", placeholder: "दुमाला जमिनीवरील नुकसान", span: true },
          { key: "totalZpCess", label: "Total Zilla Parishad Local Cess (एकूण जि.प. स्थानिक उपकर)", placeholder: "Zilla Parishad cess total", span: true },
          { key: "totalGpCess", label: "Total Gram Panchayat Local Cess (एकूण ग्रा.प. स्थानिक उपकर)", placeholder: "Gram Panchayat cess total", span: true },
          { key: "totalRecovery", label: "Total Recovery Amount (एकूण वसुलीसाठी)", placeholder: "Recovery total" },
          { key: "grandTotal", label: "Grand Total (एकूण)", placeholder: "Final grand total" },
        ],
      },
    ],
  },
];

const ALL_PROFILE_FIELDS = (() => {
  const seen = new Set<string>();
  return PROFILE_SECTIONS.flatMap(s => s.subsections.flatMap(sub => sub.fields)).filter(f => {
    if (seen.has(f.key)) return false;
    seen.add(f.key);
    return true;
  });
})();

function FarmerProfileCard({
  docStates,
  profile,
  onChange,
  onApprove,
  approved,
  onBack,
}: {
  docStates: Record<DocTypeId, ExtractionState>;
  profile: FarmerProfile;
  onChange: (field: keyof FarmerProfile, value: string) => void;
  onApprove: () => void;
  approved: boolean;
  onBack: () => void;
}) {
  const filledCount = ALL_PROFILE_FIELDS.filter(f => Boolean(profile[f.key])).length;
  const photoSrc = docStates["aadhar"]?.aadharPhoto
    ? `data:${docStates["aadhar"].aadharPhoto.mimeType};base64,${docStates["aadhar"].aadharPhoto.base64}`
    : null;

  // ── Form 8A editable table ──────────────────────────────────────────────
  const form8aRawTable0 = docStates["form8a"]?.rawTables?.[0] ?? null;

  const [editRows, setEditRows] = useState<string[][]>(
    () => form8aRawTable0?.rows ?? []
  );

  // Re-initialise whenever a new Form 8A extraction completes
  useEffect(() => {
    setEditRows(docStates["form8a"]?.rawTables?.[0]?.rows ?? []);
  }, [docStates["form8a"]?.status]);

  const numCols = useMemo(() => {
    if (!form8aRawTable0) return 0;
    return Math.max(
      form8aRawTable0.headers.length,
      ...form8aRawTable0.rows.map(r => r.length),
      0,
    );
  }, [form8aRawTable0]);

  // Map column index → profile field key (anchored from the right)
  const colToProfile = useMemo((): Record<number, keyof FarmerProfile> => {
    if (numCols === 0) return {};
    return {
      [numCols - 1]: "grandTotal",
      [numCols - 2]: "totalGpCess",
      [numCols - 3]: "totalZpCess",
      [numCols - 4]: "totalDamageInherited",
      [numCols - 5]: "totalAssessment",
      [numCols - 6]: "land",
    };
  }, [numCols]);

  const profileToCol = useMemo((): Partial<Record<keyof FarmerProfile, number>> => {
    const m: Partial<Record<keyof FarmerProfile, number>> = {};
    Object.entries(colToProfile).forEach(([c, k]) => { m[k] = Number(c); });
    return m;
  }, [colToProfile]);

  // Sync: profile field input → table cell (two-way)
  const { land, totalAssessment, totalDamageInherited, totalZpCess, totalGpCess, totalRecovery, grandTotal } = profile;
  useEffect(() => {
    if (editRows.length === 0 || numCols === 0) return;
    setEditRows(prev => {
      let changed = false;
      const next = prev.map(row => {
        const nr = [...row];
        (Object.entries(profileToCol) as [keyof FarmerProfile, number][]).forEach(([key, col]) => {
          if (col >= 0 && col < nr.length && nr[col] !== "" && nr[col] !== undefined) {
            const val = profile[key] ?? "";
            if (nr[col] !== val) { nr[col] = val; changed = true; }
          }
        });
        return nr;
      });
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [land, totalAssessment, totalDamageInherited, totalZpCess, totalGpCess, totalRecovery, grandTotal]);

  // Handle table cell edit → update local rows + sync to profile field
  const handleCellChange = useCallback((rowIdx: number, colIdx: number, val: string) => {
    setEditRows(prev =>
      prev.map((r, ri) => ri === rowIdx ? r.map((c, ci) => ci === colIdx ? val : c) : r)
    );
    const profileKey = colToProfile[colIdx];
    if (profileKey) onChange(profileKey, val);
  }, [colToProfile, onChange]);

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card shadow-md overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 bg-primary/5 border-b border-primary/20">
        <div className="flex items-center gap-4">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt="Farmer photo"
              className="w-14 h-16 object-cover rounded-xl border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-14 h-16 rounded-xl bg-primary/15 flex items-center justify-center border-2 border-white shadow-md">
              <UserCheck className="h-7 w-7 text-primary" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-base text-foreground">
              {profile.name || "Auto-Built Farmer Profile"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filledCount} of {ALL_PROFILE_FIELDS.length} fields filled · Verify and edit before approving
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Pencil className="h-3.5 w-3.5" />
          <span className="text-xs">Editable</span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {PROFILE_SECTIONS.map((section) => {
          const isExtracted = section.docIds.some(id => docStates[id]?.status === "complete");
          const allFields = section.subsections.flatMap(sub => sub.fields);
          const sectionFilled = allFields.filter(f => Boolean(profile[f.key as keyof FarmerProfile])).length;
          const form8aRawTables = section.id === "form8a" ? (docStates["form8a"]?.rawTables ?? []) : [];
          return (
            <div key={section.id}>
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-4 ${section.headerBg}`}>
                <span className={`text-xs font-bold tracking-wide uppercase ${section.headerColor}`}>
                  {section.label}
                </span>
                <span className={`text-xs font-medium ${section.headerColor} opacity-70`}>
                  {isExtracted ? `${sectionFilled} / ${allFields.length} filled` : "Upload document to extract"}
                </span>
              </div>
              {section.id === "form8a" ? (
                /* Form 8A: extraction-style row layout with editable inputs */
                <div className="space-y-5">
                  {section.subsections.map((sub) => (
                    <div key={sub.label}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        {sub.label}
                      </p>
                      <div className="rounded-md border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody>
                            {sub.fields.map(({ key, label, placeholder }) => (
                              <tr key={key} className="border-b border-border last:border-0">
                                <td className="px-4 py-2.5 text-muted-foreground font-medium w-2/5 align-middle whitespace-nowrap">
                                  {label}
                                </td>
                                <td className="px-3 py-1.5 align-middle">
                                  <input
                                    type="text"
                                    value={profile[key as keyof FarmerProfile]}
                                    onChange={(e) => onChange(key as keyof FarmerProfile, e.target.value)}
                                    placeholder={placeholder}
                                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  {/* Holdings editable table */}
                  {form8aRawTables.length > 0 && editRows.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Holdings (धारण जमिनींची नोंदवही)
                      </p>
                      <div className="border-l-4 border-l-orange-400 bg-card border border-border rounded-md p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-700 mb-3">
                          Table 1 <span className="normal-case font-normal text-muted-foreground ml-1">— click any cell to edit</span>
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-border text-xs">
                            {form8aRawTable0 && form8aRawTable0.headers.length > 0 && (
                              <thead>
                                <tr className="bg-muted/40">
                                  {Array.from({ length: numCols }).map((_, hi) => (
                                    <th key={hi} className="border border-border px-2 py-2 text-left font-semibold align-top whitespace-pre-wrap text-muted-foreground">
                                      {form8aRawTable0.headers[hi] ?? ""}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                            )}
                            <tbody>
                              {editRows.map((row, ri) => (
                                <tr key={ri} className={ri % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                  {Array.from({ length: numCols }).map((_, ci) => {
                                    const isMapped = colToProfile[ci] !== undefined;
                                    return (
                                      <td key={ci} className={`border border-border p-0 align-top ${isMapped ? "bg-teal-50/40" : ""}`}>
                                        <input
                                          type="text"
                                          value={row[ci] ?? ""}
                                          onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                                          className={`w-full px-2 py-1.5 bg-transparent text-xs focus:outline-none focus:bg-primary/5 min-w-[56px] ${isMapped ? "font-medium" : ""}`}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {numCols > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Highlighted cells sync with the Totals fields above.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* All other sections: standard grid input layout */
                <div className="space-y-5">
                  {section.subsections.map((sub) => (
                    <div key={sub.label}>
                      <p className={`text-[10px] font-semibold tracking-widest uppercase mb-2 ${section.subHeaderColor}`}>
                        {sub.label}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sub.fields.map(({ key, label, placeholder, span }) => (
                          <div key={key} className={span ? "sm:col-span-2" : ""}>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
                            <input
                              type="text"
                              value={profile[key as keyof FarmerProfile]}
                              onChange={(e) => onChange(key as keyof FarmerProfile, e.target.value)}
                              placeholder={placeholder}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {approved ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Farmer profile approved and saved to the Farmer Registry!
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Documents
            </button>
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve & Save to Farmer Registry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type DocStates = Record<DocTypeId, ExtractionState>;
const INITIAL_DOC_STATES: DocStates = Object.fromEntries(
  DOC_CARDS.map((c) => [c.id, { ...DEFAULT_STATE }]),
) as DocStates;

export default function NewRegistration() {
  const [docStates, setDocStates] = useState<DocStates>(INITIAL_DOC_STATES);
  const [profile, setProfile] = useState<FarmerProfile>({ ...EMPTY_PROFILE });
  const [approved, setApproved] = useState(false);
  const [step, setStep] = useState<WorkflowStep>("upload");
  const [reviewIndex, setReviewIndex] = useState(0);

  const completedCards = DOC_CARDS.filter(c => docStates[c.id].status === "complete");
  const anyBusy = Object.values(docStates).some(s => s.status === "uploading" || s.status === "processing");
  const canProceed = completedCards.length > 0 && !anyBusy;

  useEffect(() => {
    const checkApi = async () => {
      const healthUrl = `${BASE_URL}/api/document-types`;
      try {
        await fetch(healthUrl);
      } catch {}
    };
    checkApi();
  }, []);

  useEffect(() => {
    const anyExtracted = Object.values(docStates).some((s) => s.status === "complete");
    if (!anyExtracted) return;
    const extracted = extractProfileFromStates(docStates);
    setProfile((prev) => {
      const next = { ...prev };
      (Object.keys(extracted) as (keyof FarmerProfile)[]).forEach((k) => {
        if (!prev[k] && extracted[k]) next[k] = extracted[k]!;
      });
      return next;
    });
  }, [docStates]);

  const handleStateChange = useCallback(
    (docId: DocTypeId) => (updater: StateUpdater) => {
      setDocStates((prev) => ({
        ...prev,
        [docId]: typeof updater === "function" ? updater(prev[docId]) : updater,
      }));
    },
    [],
  );

  const handleProfileChange = (field: keyof FarmerProfile, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const handleApprove = () => {
    apiCreateFarmer({
      name: profile.name || "Unknown Farmer",
      village: profile.village || profile.taluka || "—",
      district: profile.district || "—",
      land: parseFloat(profile.land) || 0,
      crop: profile.crop || "—",
      aadhaar: profile.aadhaar || "—",
      surveyNumber: profile.surveyNumber || "—",
      bankAccount: profile.bankAccount || "—",
      status: "Active",
      source: "ocr",
    }).then(() => {
      notifyFarmerChange();
    }).catch(() => {});
    setApproved(true);
  };

  const handleProceed = () => {
    setReviewIndex(0);
    setStep("review");
  };

  const handleBackToUpload = () => {
    setStep("upload");
  };

  const handleReviewNext = () => {
    if (reviewIndex < completedCards.length - 1) {
      setReviewIndex(i => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setReviewIndex(completedCards.length);
    }
  };

  const handleReviewPrev = () => {
    if (reviewIndex > 0) {
      setReviewIndex(i => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const showProfileCard = step === "review" && reviewIndex >= completedCards.length;

  if (step === "upload") {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-lg">New Registration</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Upload one or more documents below. You can upload any combination — no documents are mandatory.
            Once at least one document is processed, the Proceed button will activate.
          </p>

          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {DOC_CARDS.map((card) => (
              <DocUploadCard
                key={card.id}
                card={card}
                state={docStates[card.id]}
                onStateChange={handleStateChange(card.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {completedCards.length > 0 ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {completedCards.length} document{completedCards.length > 1 ? "s" : ""} ready to review
                {anyBusy && " · waiting for processing…"}
              </span>
            ) : anyBusy ? (
              <span className="flex items-center gap-1.5 text-amber-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing documents…
              </span>
            ) : (
              <span>Upload at least one document to proceed</span>
            )}
          </div>
          <button
            onClick={handleProceed}
            disabled={!canProceed}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Proceed to Review
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ReviewTabBar
        completedCards={completedCards}
        activeIndex={reviewIndex}
        showProfile={showProfileCard}
        onJump={(i) => { setReviewIndex(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onJumpToProfile={() => { setReviewIndex(completedCards.length); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onBack={handleBackToUpload}
      />

      {!showProfileCard && completedCards[reviewIndex] && (
        <DocReviewPanel
          card={completedCards[reviewIndex]}
          state={docStates[completedCards[reviewIndex].id]}
          index={reviewIndex}
          total={completedCards.length}
          onPrev={handleReviewPrev}
          onNext={handleReviewNext}
          isLast={reviewIndex === completedCards.length - 1}
        />
      )}

      {showProfileCard && (
        <FarmerProfileCard
          docStates={docStates}
          profile={profile}
          onChange={handleProfileChange}
          onApprove={handleApprove}
          approved={approved}
          onBack={() => { setReviewIndex(completedCards.length - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      )}
    </div>
  );
}
