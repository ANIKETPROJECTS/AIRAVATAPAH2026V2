export interface FarmerRecord {
  id: string;
  name: string;
  village: string;
  district: string;
  land: number;
  crop: string;
  aadhaar: string;
  surveyNumber: string;
  bankAccount: string;
  status: "Active" | "Inactive" | "Pending";
  source: "ocr" | "manual";
  addedAt: string;
}

const listeners: Array<() => void> = [];
const approvedFarmers: FarmerRecord[] = [];

export function getApprovedFarmers(): FarmerRecord[] {
  return [...approvedFarmers];
}

export function addApprovedFarmer(farmer: FarmerRecord): void {
  approvedFarmers.push(farmer);
  listeners.forEach((fn) => fn());
}

export function subscribeToFarmers(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i !== -1) listeners.splice(i, 1);
  };
}

let counter = 100;
export function nextFarmerId(): string {
  counter += 1;
  return `F-${String(counter).padStart(3, "0")}`;
}
