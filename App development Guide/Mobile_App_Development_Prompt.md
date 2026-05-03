# Krushi Suvidha AI — Farmer Mobile App
## Complete Development Prompt for React Native (Expo)

---

## PROJECT OVERVIEW

Build **Krushi Suvidha AI** — a React Native mobile application (using Expo) for Maharashtra farmers. This app is the farmer-facing companion to the AgriAdmin web dashboard used by government officers.

### What the app does:
1. Farmer logs in with their mobile number + OTP
2. Farmer uploads 5 official documents — OCR extracts all data automatically
3. The server creates the farmer's registration in the admin dashboard automatically
4. Farmer tracks their registration status and officer decisions in real time
5. Farmer views their verified profile, eligible schemes, files grievances

> **There is no manual data entry.** All registration data is extracted from uploaded documents by the OCR pipeline on the server. The mobile app only uploads files.

---

## BACKEND CONFIGURATION

> These credentials are already live and running in production.

| Setting | Value |
|---------|-------|
| **API Base URL** | `https://krushisuvidhaai.airavatatechnologies.com/api` |
| **Server Port** | `3014` (single port — API + Admin Dashboard) |
| **Platform** | Android + iOS (Expo managed workflow) |
| **Language** | TypeScript |
| **State** | Zustand |
| **Navigation** | Expo Router (file-based routing) |

---

## BRAND & DESIGN SYSTEM

### App Name
**Krushi Suvidha AI** (कृषी सुविधा AI)

### Color Palette — GREEN ONLY

```
Primary:        #166534   (dark forest green — buttons, headers)
Primary Light:  #16a34a   (emerald green — active states)
Accent:         #4ade80   (lime green — highlights, badges)
Background:     #f0fdf4   (very light green — screen background)
Surface:        #ffffff   (white — cards)
Surface Alt:    #dcfce7   (pale green — section backgrounds)
Text Primary:   #14532d   (dark green — headings)
Text Secondary: #166534   (medium green — body)
Text Muted:     #6b7280   (grey — secondary text)
Border:         #bbf7d0   (light green border)
Error:          #dc2626   (red — errors only)
Warning:        #ca8a04   (amber — warnings only)
```

### Typography
- **Headings:** Noto Sans Devanagari Bold
- **Body:** System default (Noto Sans)

### Language
- Default: English with Marathi text support throughout
- Marathi toggle in Settings screen

---

## SCREENS & NAVIGATION

```
App
├── (auth)
│   ├── index         ← Splash / Welcome
│   ├── login         ← Mobile number entry
│   └── otp-verify    ← OTP confirmation
│
└── (app)
    ├── (tabs)
    │   ├── home          ← Status dashboard
    │   ├── profile       ← Farmer profile (read-only, from server)
    │   ├── schemes       ← Scheme browser
    │   └── grievances    ← Grievances list
    │
    └── (screens)
        ├── upload/index       ← Document upload hub
        ├── upload/[docType]   ← Single document upload + OCR status
        ├── schemes/[id]       ← Scheme detail
        ├── grievances/new     ← File new grievance
        ├── grievances/[id]    ← Grievance detail
        └── notifications      ← All notifications
```

---

## DETAILED SCREEN SPECIFICATIONS

---

### SCREEN 1: Splash / Welcome (`(auth)/index`)

**Layout:**
- Full screen gradient: `#166534` → `#16a34a`
- Center: White leaf/wheat icon (100×100)
- "कृषी सुविधा AI" in large white Devanagari
- "Krushi Suvidha AI" in smaller white text
- Tagline: "शेतकऱ्यांसाठी, शेतकऱ्यांनी"
- Bottom: White "Get Started" button
- "Powered by Airavata Technologies" at bottom

**Logic:**
- If JWT exists in SecureStore → skip to Home
- Show for 1.5s then show CTA

---

### SCREEN 2: Login (`(auth)/login`)

**Layout:**
- "Login / Register" header
- Mobile number input (10 digits, numeric keyboard)
- "Send OTP →" green button

**API:**
```
POST /api/auth/send-otp
Body: { "mobile": "9876543210" }

Response: { "success": true, "otp": "482910", "expiresIn": 300 }
```
> Note: `otp` is returned in the response body during development (no SMS gateway yet). Display it in a dev-mode hint or log it. In production, remove this field and integrate MSG91/Fast2SMS.

**On success:** Navigate to OTP screen.

---

### SCREEN 3: OTP Verify (`(auth)/otp-verify`)

**Layout:**
- "Verify OTP" header
- "OTP sent to +91-98765-43210"
- 6 individual digit boxes (auto-advance)
- Countdown: "Resend in 0:45" → active Resend link after countdown
- "Verify & Continue →" button

**Logic:**
- Auto-submit on 6th digit
- Shake animation on wrong OTP

**API:**
```
POST /api/auth/verify-otp
Body: { "mobile": "9876543210", "otp": "482910" }

Response (new farmer):
{ "success": true, "token": "eyJ...", "farmer": null, "isRegistered": false }

Response (returning farmer):
{ "success": true, "token": "eyJ...", "farmer": { farmerId, name, status, ... }, "isRegistered": true }
```

**On success:**
- Save JWT to `expo-secure-store` key `jwt_token`
- If `isRegistered: false` → navigate to Upload hub (first-time document upload)
- If `isRegistered: true` → navigate to Home (returning farmer)

---

### SCREEN 4: Home / Dashboard (`(app)/(tabs)/home`)

#### State A: Pending farmer (documents uploaded, awaiting officer review)

- Header with notification bell
- Status card (amber border):
  - "Registration Under Review"
  - "Documents submitted on DD/MM/YYYY"
  - Progress bar showing step: Submitted → Under Review → Verified
- "View Submitted Documents" button → opens Upload hub in read-only mode

#### State B: Verified farmer

- Green "Verified Farmer" banner with badge
- Farmer name, Farmer ID, District
- Quick stats: Land area, Primary Crop, Bank linked status
- Section: "Your Eligible Schemes" (2-3 scheme cards)
- Section: "Recent Notifications" (last 3)

#### State C: No documents yet (first login, `isRegistered: false`)

- Welcome banner with farmer illustration
- "Complete Your Registration" card (prominent green CTA)
- Explains: "Upload 5 documents → OCR extracts your data → Officer reviews → You're registered!"
- "Start Uploading →" button

**API to get farmer status:**
```
GET /api/farmers/:farmerId
Authorization: Bearer <token>
```

---

### SCREEN 5: Document Upload Hub (`(screens)/upload/index`)

**Purpose:** Shows all 5 required documents with upload status.

**Layout:**
- Title: "Upload Your Documents"
- Subtitle: "All 5 documents are required for registration"
- List of 5 document cards:

| # | Document | API `document_type` |
|---|----------|---------------------|
| 1 | Aadhaar Card | `aadhar` |
| 2 | Bank Passbook | `bank_passbook` |
| 3 | 7/12 Form (Satbara) | `form7` |
| 4 | Form 12 (Crop Register) | `form12` |
| 5 | Form 8A | `form8a` |

Each card shows:
- Document name (Marathi + English)
- Status: Not Uploaded / Processing / Extracted / Failed
- Green checkmark when extracted

- Bottom: "All done!" banner appears when all 5 are extracted

**Logic:**
- Tapping a card → navigate to `upload/[docType]`
- Track status per docType in Zustand store
- Poll each doc's extraction status independently

---

### SCREEN 6: Single Document Upload (`(screens)/upload/[docType]`)

**Purpose:** Upload one document, show OCR extraction progress and result.

**Layout:**
- Document name as header
- Upload area: "Tap to select PDF or image" (dashed green border, file icon)
- After selection: Show filename, size, "Upload & Extract" button
- While processing: Spinner + "Extracting data with AI..."
- On success: Show extracted field cards with key-value pairs
- On failure: Error message, retry button

**Upload Flow:**

**Step 1 — Submit document:**
```
POST /api/extract
Content-Type: multipart/form-data
Fields:
  file          → the selected file
  document_type → e.g. "aadhar"
  profile_phone → farmer's mobile number (REQUIRED — links to registration)

Response: { "request_id": "abc123...", "status": "submitted" }
```

> **`profile_phone` is critical.** It tells the server which farmer this document belongs to. When extraction completes, the server automatically creates or updates the farmer's registration record in the admin dashboard.

**Step 2 — Poll for result (every 4 seconds):**
```
GET /api/extract/:request_id

Response (processing): { "status": "processing" }
Response (complete):   { "status": "complete", "structured": { "sections": [...] }, ... }
Response (error):      { "status": "error", "error": "..." }
```

**Step 3 — Display extracted fields:**
When `status === "complete"`, render `structured.sections` as cards:
```typescript
// structured.sections is an array:
[
  {
    title: "Identity",  // Section heading
    fields: [
      { key: "name", label: "Full Name", value: "Ramesh Patel" },
      { key: "aadhaarNumber", label: "Aadhaar Number", value: "XXXX XXXX 1234" },
      // ...
    ],
    tables: []
  }
]
```

Render each field as a read-only label + value pair. The farmer cannot edit these — they come from the document.

**After all 5 docs extracted:**
- Show success screen: "Registration submitted to district officer"
- Navigate to Home (Status: Pending)

---

### SCREEN 7: Profile (`(app)/(tabs)/profile`)

**Purpose:** Read-only view of the farmer's verified profile from the server.

**Data source:** `GET /api/farmers/:farmerId`

**Layout:**
- Farmer photo (from aadhaar, if extracted) or avatar
- Name, Farmer ID, Status badge
- Sections (collapsible):
  - Personal Info (name, DOB, gender, father's name)
  - Address (village, taluka, district)
  - Land Details (survey number, total area, crop)
  - Bank Details (bank name, branch, masked account)
  - Documents Submitted (checklist of 5 docs with extracted status)

> All data is read-only. Farmers cannot edit their profile through the app.

---

### SCREEN 8: Schemes Browser (`(app)/(tabs)/schemes`)

**API:**
```
GET /api/schemes
GET /api/schemes?type=Central
GET /api/schemes?search=kisan
```

**Layout:**
- Search bar + Type filter (All / Central / State / District)
- Scheme cards:
  - Scheme name (Hindi/Marathi)
  - Short description
  - Benefit amount or type
  - Eligibility badge (Eligible / Check Eligibility)
  - "Learn More" → Scheme detail screen

---

### SCREEN 9: Scheme Detail (`(screens)/schemes/[id]`)

**API:** `GET /api/schemes/:id`

**Layout:**
- Scheme name (large heading)
- Type badge (Central / State)
- Description
- Benefits section
- Eligibility criteria
- Documents required
- "Apply" button (disabled for now — scheme application flow TBD)

---

### SCREEN 10: Grievances (`(app)/(tabs)/grievances`)

**API:**
```
GET /api/grievances?mobile=9876543210
```

**Layout:**
- "File New Grievance" button (top right)
- List of grievances with status badges (Open / In Progress / Resolved)
- Each card: Subject, date filed, status, short description

---

### SCREEN 11: File New Grievance (`(screens)/grievances/new`)

**API:**
```
POST /api/grievances
Body:
{
  "mobile": "9876543210",
  "farmerId": "F-042",
  "subject": "Scheme payment not received",
  "description": "PM-KISAN installment for Rabi 2025 not credited to account",
  "category": "Scheme"
}
```

**Response:**
```json
{
  "grievanceId": "GRV-A1B2C3D4",
  "status": "Open",
  "createdAt": "2026-05-03T..."
}
```

**Fields:**
- Subject (text input)
- Category picker: Scheme / Land Record / Aadhaar / Bank / Other
- Description (multi-line, min 20 chars)
- Submit button

---

### SCREEN 12: Notifications (`(screens)/notifications`)

**API:**
```
GET /api/notifications?mobile=9876543210
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all   Body: { "mobile": "9876543210" }
```

**Layout:**
- Unread count badge in tab bar
- Notification list grouped by date
- Tap → mark as read + show detail

**Notification types to handle:**

| Type | Icon | Action |
|------|------|--------|
| `status_change` | ✅ / ❌ | Show new status |
| `scheme_eligible` | 🌾 | Open scheme detail |
| `grievance_update` | 📋 | Open grievance detail |
| `general` | 🔔 | Show message |

---

## PUSH NOTIFICATIONS (Expo)

Register push token after login:
```
POST /api/auth/register-push-token
Body: { "mobile": "9876543210", "pushToken": "ExponentPushToken[xxx]" }
```

Call this on every app launch after login. The server sends push notifications via Expo's push service when the officer changes farmer status, when a grievance is updated, etc.

---

## STATE MANAGEMENT (Zustand)

```typescript
interface AppStore {
  // Auth
  token: string | null;
  mobile: string | null;
  farmer: FarmerRecord | null;
  setAuth: (token: string, mobile: string, farmer: FarmerRecord | null) => void;
  logout: () => void;

  // Upload tracking
  uploadStatus: Record<string, "idle" | "uploading" | "processing" | "done" | "error">;
  setUploadStatus: (docType: string, status: string) => void;

  // Notifications
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}
```

---

## AUTHENTICATION HEADERS

After login, include JWT in all API calls:
```typescript
const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json",
};
```

For file uploads use `multipart/form-data` (no Content-Type header — let the browser/fetch set the boundary automatically).

---

## ERROR HANDLING

| HTTP Status | Action |
|-------------|--------|
| 400 | Show field validation error |
| 401 | Clear token, redirect to Login |
| 404 | Show "Not found" empty state |
| 429 | Show "Too many requests, try again in 1 minute" |
| 500/502 | Show "Server error, try again" with retry |

---

## IMPORTANT NOTES

1. **No manual data entry** — farmers never type their own data. Everything comes from OCR.
2. **`profile_phone` is mandatory** on every `POST /api/extract` call — without it the registration won't appear in the admin dashboard.
3. **Polling interval**: 4 seconds for extraction status. Stop after 10 minutes (show timeout error).
4. **File types accepted**: PDF, JPG, JPEG, PNG — max 50 MB per file.
5. **Token storage**: Use `expo-secure-store`, never AsyncStorage for JWT.
6. **All fields from server are read-only** — no editing in the app.

---

*Document Version: 2.0 — May 2026*
*Project: Krushi Suvidha AI | Airavata Technologies*
