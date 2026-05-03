# Krushi Suvidha AI — Farmer Mobile App
## Complete Development Prompt for React Native (Expo)

---

## PROJECT OVERVIEW

Build **Krushi Suvidha AI** — a React Native mobile application (using Expo) for Maharashtra farmers. This app is the farmer-facing companion to an existing web-based agricultural administration dashboard used by government officers.

The app allows farmers to:
1. Register by uploading 5 official documents (OCR-powered extraction)
2. Track their registration status in real time
3. View their verified farmer profile
4. Browse government schemes they are eligible for
5. Apply for schemes
6. File and track grievances

**API Base URL:** `https://krushisuvidhaai.airavatatechnologies.com/api`  
**Platform:** Android + iOS (Expo managed workflow)  
**Language:** TypeScript  
**State:** Zustand or React Context  
**Navigation:** Expo Router (file-based routing)

---

## BRAND & DESIGN SYSTEM

### App Name
**Krushi Suvidha AI** (कृषी सुविधा AI)

### Logo & Identity
- App logo: Use a green leaf / wheat sheaf icon with "कृषी सुविधा" in Devanagari script
- Tagline: "शेतकऱ्यांसाठी, शेतकऱ्यांनी" (For farmers, by farmers)

### Color Palette — GREEN ONLY (no blue, purple, orange, red except errors)

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
Success:        #15803d   (deep green)
Warning:        #ca8a04   (amber — only for warnings)
Error:          #dc2626   (red — only for errors)
```

### Typography
- **Headings:** Noto Sans Devanagari Bold (supports Marathi text)
- **Body:** Noto Sans / System default
- **Monospace:** For IDs and codes

### Language Support
- Default: English
- Full Marathi translation support (toggle in settings)
- Use `i18n-js` or `expo-localization` for translations

---

## SCREENS & NAVIGATION STRUCTURE

```
App
├── (auth)                      ← Unauthenticated stack
│   ├── index (Splash/Welcome)
│   ├── login (Mobile OTP entry)
│   └── otp-verify (OTP confirmation)
│
└── (app)                       ← Authenticated tab navigator
    ├── (tabs)
    │   ├── home                ← Dashboard
    │   ├── profile             ← Farmer profile
    │   ├── schemes             ← Scheme browser
    │   └── grievances          ← Grievance management
    │
    └── (screens)               ← Full-screen modals/pages
        ├── register/index      ← Registration hub
        ├── register/upload     ← Document upload
        ├── register/review     ← Review extracted data
        ├── register/submit     ← Submission confirmation
        ├── schemes/[id]        ← Scheme detail
        ├── grievances/new      ← File new grievance
        ├── grievances/[id]     ← Grievance detail
        └── notifications       ← All notifications
```

---

## DETAILED SCREEN SPECIFICATIONS

---

### SCREEN 1: Splash / Welcome Screen (`(auth)/index`)

**Purpose:** First screen the farmer sees. Brand introduction.

**Layout:**
- Full screen background: gradient from `#166534` (top) to `#16a34a` (bottom)
- Center: App logo (white leaf icon, 100×100)
- Below logo: "कृषी सुविधा AI" in large white Devanagari font
- Below: "Krushi Suvidha AI" in smaller white English text
- Below: Tagline "शेतकऱ्यांसाठी, शेतकऱ्यांनी" in italic white
- Bottom: Large white "Get Started" button → navigates to Login
- Bottom-most: "Powered by Airavata Technologies" in small white text

**Logic:**
- If JWT token exists in SecureStore → auto-navigate to `(app)/home`
- Show splash for 1.5 seconds before showing the CTA button

---

### SCREEN 2: Login Screen (`(auth)/login`)

**Purpose:** Farmer enters mobile number to receive OTP.

**Layout:**
- Top: Back arrow + "Login / Register" header
- Hero section (light green background):
  - Green wheat/farm illustration
  - "Welcome Farmer" in Devanagari
  - "Enter your mobile number to continue"
- Form card (white, rounded, shadow):
  - Label: "Mobile Number / मोबाइल नंबर"
  - Input: Large phone number field (numeric keyboard, +91 prefix shown)
  - Checkbox: "I agree to Terms & Conditions"
  - Button: "Send OTP →" (dark green, full width)
- Bottom: Language toggle (English | मराठी)

**Validation:**
- Mobile must be exactly 10 digits
- Terms checkbox must be checked
- Disable button while loading

**API Call:**
```
POST /api/auth/otp/request
Body: { "mobile": "9876543210" }
```

**On Success:** Navigate to OTP screen, pass mobile number as route param

---

### SCREEN 3: OTP Verification Screen (`(auth)/otp-verify`)

**Purpose:** Farmer enters the 6-digit OTP received via SMS.

**Layout:**
- Header: "← Back" + "Verify OTP"
- "OTP sent to +91-98765-43210" (masked middle digits)
- 6 individual digit input boxes (auto-focus next on input)
- Countdown timer: "Resend OTP in 0:45"
- "Resend OTP" link (active after countdown)
- Large "Verify & Continue →" button

**Logic:**
- Auto-submit when 6th digit is entered
- Show loading spinner on verification button
- Shake animation on wrong OTP

**API Call:**
```
POST /api/auth/otp/verify
Body: { "mobile": "9876543210", "otp": "482910" }
```

**On Success:**
- Save JWT to `expo-secure-store`
- If `isNewFarmer: true` → Navigate to Registration screen
- If `isNewFarmer: false` → Navigate to Home (Dashboard)

---

### SCREEN 4: Home / Dashboard Screen (`(app)/(tabs)/home`)

**Purpose:** Main hub after login. Shows registration status or verified farmer dashboard.

#### State A: Pending Farmer (not yet verified)

**Layout:**
- Header: "कृषी सुविधा AI" logo + notification bell
- Status card (amber border):
  - Large status icon (⏳)
  - "Registration Under Review"
  - "Submitted: 3 May 2026"
  - Farmer ID: "F-043"
  - Progress tracker: `Submitted → Under Review → Verified`
  - "Your documents are being reviewed by the District Officer. You will be notified once verified."
- "Upload More Documents" button (if any doc missing)
- Tips section: "While you wait, learn about government schemes →"

#### State B: Verified Farmer

**Layout:**
- Header: Green background, "Good morning, Ramesh!" + notification bell
- Profile summary card:
  - Farmer avatar (initials circle, green background)
  - Name, Farmer ID, District, Village
  - "✅ Verified Farmer" green badge
- Stats row (4 tiles, green shades):
  - Land: 2.2 ha
  - Crop: Grapes
  - Schemes Eligible: 5
  - Grievances: 1 Open
- "Eligible Schemes" horizontal scroll of scheme cards
- "Recent Notifications" list (last 3)
- "File a Grievance" button

#### State C: Cancelled Farmer

**Layout:**
- Red/orange status card:
  - "Registration Cancelled"
  - Reason (if provided by officer)
  - "Contact District Office" button
  - "Re-apply" button

**API Calls (poll every 30 seconds while status is Pending):**
```
GET /api/farmers/:farmerId/status
GET /api/notifications?farmerId=:farmerId
```

---

### SCREEN 5: Document Upload / Registration (`register/upload`)

**Purpose:** Step-by-step document upload for the 5 required documents.

**Layout — Step-by-step stepper:**

```
Step 1: Personal Info (no upload — just form fields)
Step 2: Upload Documents
Step 3: Review Extracted Data
Step 4: Confirm & Submit
```

#### Step 1 — Personal Information Form

Fields (all required unless noted):
- Full Name (Marathi script input supported)
- Date of Birth (date picker)
- Gender (Male / Female / Other — radio)
- Father's Name
- Category (SC / ST / OBC / NT / VJNT / General — dropdown)
- Mobile (pre-filled from login, read-only)
- Village
- Taluka (dropdown or text)
- District (dropdown — all Maharashtra districts)
- "Next →" button

#### Step 2 — Document Upload

Show 5 upload cards (matching the web admin's New Registration screen):

```
┌─────────────────────────────────┐
│ 📄 Form 7 (Ownership Register)  │
│ Maharashtra 7/12 – Rights       │
│ [📷 Take Photo] [📁 Browse]     │
│ ✅ Uploaded — form7.pdf (1.2MB) │
└─────────────────────────────────┘
```

Five document cards:
1. **Form 7** — `document_type: "form7"`
2. **Form 12** — `document_type: "form12"`
3. **Form 8A** — `document_type: "form8a"`
4. **Aadhaar Card** — `document_type: "aadhar"`
5. **Bank Passbook** — `document_type: "bank_passbook"`

Each card has:
- Document name + description
- "Take Photo" button (camera) + "Upload from Gallery/Files" button
- Upload progress bar
- Status: Pending / Uploading / Processing / Done / Error
- Extracted preview (name, village, survey number) after processing

**Upload flow per document:**
1. Farmer selects file / takes photo
2. Call `POST /api/extract` with `multipart/form-data`, `document_type`, and `profile_phone`
3. Get `request_id`
4. Poll `GET /api/extract/:request_id` every 4 seconds
5. On complete: show extracted fields preview
6. On error: show retry button

**All 5 documents must show "Done" to enable "Next →"**

**Important for Aadhaar:**
- If `aadhar_photo.base64` is returned, show the farmer's photo in the card as confirmation

#### Step 3 — Review Extracted Data

Show a summary of all extracted data organized in sections:
- **Identity:** Name, DOB, Aadhaar number, Gender (from Aadhaar)
- **Land:** Village, District, Survey Number, Area (from Form 7)
- **Crop:** Season crops (from Form 12)
- **Bank:** Account number, IFSC, Bank name (from passbook)

Each field is editable (tap to correct if OCR was wrong).

"Confirm & Submit →" button at bottom.

#### Step 4 — Confirmation

```
POST /api/farmers
Body: All combined farmer data with status: "Pending", source: "mobile"
```

**On 201 Success:**
- Show success animation (green checkmark, confetti particles)
- "Registration Submitted!"
- Show Farmer ID: "F-043"
- "Your application is now under review by the District Officer."
- "Go to Home" button
- Save farmerId to local storage/SecureStore

---

### SCREEN 6: Farmer Profile (`(app)/(tabs)/profile`)

**Purpose:** View and edit verified farmer profile.

**Layout:**
- Header: "My Profile" + Edit button (pencil icon)
- Avatar circle with initials (tap to change photo — optional)
- "✅ Verified Farmer" green badge
- Farmer ID in monospace
- Tabbed sections:
  - **Personal** — Name, DOB, Gender, Father's Name, Category, Mobile
  - **Land** — District, Village, Taluka, Survey No., Land Area, Crop
  - **Bank** — Bank Name, Branch, IFSC, Account (masked)
  - **Documents** — List of 5 uploaded documents with status chips

**Edit Mode:**
- Tap Edit → fields become editable inputs
- "Save Changes" button → `PATCH /api/farmers/:farmerId`

**Show registration date and last updated date at bottom.**

---

### SCREEN 7: All Schemes (`(app)/(tabs)/schemes`)

**Purpose:** Browse all government schemes and see eligibility.

**Layout:**
- Header: "Government Schemes" + search bar
- Filter chips: All | Central Govt | Maharashtra State
- Eligibility toggle: "Show only eligible for me" (ON by default for verified farmers)
- Scheme cards list:

```
┌────────────────────────────────────────┐
│ 🏛 PM-KISAN          ✅ You're Eligible │
│ Income Support · Central Govt          │
│ ₹6,000/year in 3 installments         │
│ [View Details →]                       │
└────────────────────────────────────────┘
```

**Eligibility computation (client-side):**
- Fetch farmer profile from local state
- For each scheme, compute eligibility using these rules:
  - PM-KISAN: Has land + Aadhaar + bank account
  - PMFBY: Has land + crop data
  - KCC: Age 18–75 + has land
  - PM KUSUM: Land ≥ 0.5 ha
  - PKVY: Has land + organic-compatible crop
  - Pension schemes: Age 18–40 + small/marginal farmer

**API Call:** `GET /api/schemes` (fetch all, filter client-side)

---

### SCREEN 8: Scheme Detail (`schemes/[id]`)

**Purpose:** Full scheme detail with apply option.

**Layout:**
- Back button + scheme name header
- Hero card (light green gradient):
  - Scheme name
  - Type badge (Central / State)
  - Status badge (Active)
  - Your eligibility score bar (e.g., 82%)
- Benefits section: "₹6,000 per year in 3 installments"
- Tabs:
  - **Overview** — Eligibility criteria table, family criteria, exclusions
  - **Documents Needed** — List of required documents with checkmarks (✅ if farmer already has it uploaded)
  - **How to Apply** — Step-by-step process, contact info
- Bottom: "Apply for this Scheme →" button (opens in-app or links to official portal)

**Eligibility match card:**
```
✅ Land holding: 2.2 ha
✅ Aadhaar linked
✅ Bank account available
✅ Active farmer status
❌ Pending Aadhaar-bank linkage verification
```

---

### SCREEN 9: Grievances (`(app)/(tabs)/grievances`)

**Purpose:** View, file, and track grievances.

**Layout:**
- Header: "Grievances" + "File New +" button
- Stats: 1 Open | 0 Resolved
- Grievance list:

```
┌──────────────────────────────────────────┐
│ GR-2026-0041  ●  Under Review            │
│ PM-KISAN installment not received        │
│ Submitted: 3 May 2026                    │
│ [View Details →]                         │
└──────────────────────────────────────────┘
```

**Status color coding:**
- Submitted: grey
- Under Review: amber
- Resolved: green
- Closed: slate

**API Call:** `GET /api/grievances?farmerId=:farmerId`

---

### SCREEN 10: File New Grievance (`grievances/new`)

**Layout:**
- Header: "← File a Grievance"
- Form card:
  - **Category** — dropdown: Scheme / Land / Payment / Registration / Other
  - **Related Scheme** — optional dropdown (fetch from GET /api/schemes)
  - **Subject** — single line text (max 100 chars)
  - **Description** — multi-line textarea (min 50 chars, max 500)
  - **Attach Photo** — optional image picker
  - "Submit Grievance →" button (dark green)
- Note: "Your name, mobile number, and district are auto-filled from your profile"

**API Call:**
```
POST /api/grievances
Body: { farmerId, farmerName, mobile, district, village, category, subject, description, schemeId? }
```

**On Success:**
- Show success card: "Grievance Registered!"
- Show tracking ID: GR-2026-0041
- Navigate back to Grievances list

---

### SCREEN 11: Grievance Detail (`grievances/[id]`)

**Layout:**
- Header: "← Grievance GR-2026-0041"
- Status timeline:
  ```
  ● Submitted — 3 May 2026
  ● Under Review — 4 May 2026
  ● Resolved — 5 May 2026
  ```
- Details card: Category, Subject, Description
- Officer Response card (shown when resolved):
  ```
  👮 District Officer — Nashik
  "Your payment has been initiated. Allow 2-3 working days."
  ```

---

### SCREEN 12: Notifications (`notifications`)

**Layout:**
- Header: "Notifications"
- "Mark all as read" button
- Grouped by date (Today / Yesterday / Earlier)
- Each notification:
  - Icon based on type (✅ verification, 📋 scheme, 💬 grievance)
  - Title + body
  - Timestamp
  - Unread: slightly darker background with green left border
  - Tap → navigate to relevant screen

**API Call:**
```
GET /api/notifications?farmerId=:farmerId
PATCH /api/notifications/:id/read  (on tap)
```

---

## TECHNICAL IMPLEMENTATION

### Project Setup

```bash
npx create-expo-app KrushiSuvidhaApp --template expo-template-blank-typescript
cd KrushiSuvidhaApp

# Core dependencies
npx expo install expo-router expo-secure-store expo-image-picker
npx expo install expo-document-picker expo-camera expo-file-system
npx expo install expo-notifications expo-font
npm install zustand axios react-hook-form @hookform/resolvers zod
npm install @react-native-community/datetimepicker
npm install react-native-reanimated react-native-gesture-handler
npm install nativewind tailwindcss  # for styling
```

### File Structure

```
KrushiSuvidhaApp/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx          # Splash + Welcome
│   │   ├── login.tsx          # Mobile number entry
│   │   └── otp-verify.tsx     # OTP verification
│   ├── (app)/
│   │   ├── _layout.tsx        # Tab navigator
│   │   ├── (tabs)/
│   │   │   ├── home.tsx
│   │   │   ├── profile.tsx
│   │   │   ├── schemes.tsx
│   │   │   └── grievances.tsx
│   │   └── (screens)/
│   │       ├── register/
│   │       │   ├── index.tsx
│   │       │   ├── upload.tsx
│   │       │   ├── review.tsx
│   │       │   └── submit.tsx
│   │       ├── schemes/[id].tsx
│   │       ├── grievances/new.tsx
│   │       ├── grievances/[id].tsx
│   │       └── notifications.tsx
│   └── _layout.tsx            # Root layout + auth guard
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── StatusBar.tsx
│   │   └── ProgressBar.tsx
│   ├── farmer/
│   │   ├── StatusCard.tsx
│   │   ├── ProfileCard.tsx
│   │   └── DocumentCard.tsx
│   ├── schemes/
│   │   ├── SchemeCard.tsx
│   │   └── EligibilityScore.tsx
│   └── grievances/
│       ├── GrievanceCard.tsx
│       └── StatusTimeline.tsx
├── store/
│   ├── authStore.ts           # JWT, farmerId, mobile
│   ├── farmerStore.ts         # Farmer profile data
│   └── notificationStore.ts  # Notifications + push tokens
├── services/
│   ├── api.ts                 # Axios instance + interceptors
│   ├── authService.ts
│   ├── farmerService.ts
│   ├── extractService.ts
│   ├── schemeService.ts
│   └── grievanceService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useFarmerStatus.ts     # Polls status while Pending
│   └── useNotifications.ts
├── utils/
│   ├── eligibility.ts         # Client-side scheme eligibility engine
│   ├── storage.ts             # SecureStore wrappers
│   └── i18n.ts                # Language translations
├── constants/
│   ├── colors.ts
│   ├── districts.ts           # Maharashtra districts list
│   └── documentTypes.ts
└── assets/
    ├── logo.png
    └── fonts/
```

### API Service Layer

```typescript
// services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://krushisuvidhaai.airavatatechnologies.com/api';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('jwt_token');
      // Navigate to login
    }
    return Promise.reject(err);
  }
);
```

### Auth Guard (Root Layout)

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { token, setToken } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const saved = await SecureStore.getItemAsync('jwt_token');
      if (saved) {
        setToken(saved);
        if (segments[0] === '(auth)') router.replace('/(app)/(tabs)/home');
      } else {
        if (segments[0] !== '(auth)') router.replace('/(auth)');
      }
    };
    checkAuth();
  }, []);

  return <Slot />;
}
```

### Document Upload Hook

```typescript
// hooks/useDocumentUpload.ts
export function useDocumentUpload(documentType: string, mobile: string) {
  const [status, setStatus] = useState<'idle'|'uploading'|'processing'|'done'|'error'>('idle');
  const [extracted, setExtracted] = useState(null);

  const upload = async (file: { uri: string; name: string; type: string }) => {
    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
    formData.append('document_type', documentType);
    formData.append('mode', 'accurate');
    formData.append('profile_phone', mobile);

    const { data } = await api.post('/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const requestId = data.request_id;

    setStatus('processing');
    // Poll until done
    const poll = async (): Promise<void> => {
      const result = await api.get(`/extract/${requestId}`);
      if (result.data.status === 'processing') {
        await new Promise(r => setTimeout(r, 4000));
        return poll();
      }
      if (result.data.status === 'complete') {
        setExtracted(result.data.structured);
        setStatus('done');
      } else {
        setStatus('error');
      }
    };
    await poll();
  };

  return { status, extracted, upload };
}
```

### Farmer Status Polling Hook

```typescript
// hooks/useFarmerStatus.ts
export function useFarmerStatus(farmerId: string, currentStatus: string) {
  const { updateStatus } = useFarmerStore();

  useEffect(() => {
    if (currentStatus !== 'Pending') return;
    const interval = setInterval(async () => {
      const { data } = await api.get(`/farmers/${farmerId}/status`);
      if (data.status !== currentStatus) {
        updateStatus(data.status);
        // Trigger local notification
        if (data.status === 'Verified') {
          showLocalNotification('Registration Verified!', 'Your farmer registration has been approved.');
        } else if (data.status === 'Cancelled') {
          showLocalNotification('Registration Cancelled', 'Please contact your District Office.');
        }
      }
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [farmerId, currentStatus]);
}
```

### Client-Side Eligibility Engine

```typescript
// utils/eligibility.ts
export function checkEligibility(farmer: FarmerRecord, scheme: Scheme): { eligible: boolean; score: number; reasons: string[]; gaps: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const gaps: string[] = [];
  const landHa = parseFloat(String(farmer.land)) || 0;
  const age = farmer.dob ? getAge(farmer.dob) : 35;
  const name = scheme.name.toLowerCase();

  if (farmer.status === 'Verified' || farmer.status === 'Active') { score += 20; reasons.push('Active registered farmer'); }
  if (farmer.bankAccount) { score += 15; reasons.push('Bank account linked'); }

  if (name.includes('pm-kisan')) {
    if (landHa > 0) { score += 30; reasons.push(`Land: ${landHa} ha`); }
    if (farmer.aadhaar) { score += 15; reasons.push('Aadhaar available'); }
  } else if (name.includes('pmfby') || name.includes('fasal bima')) {
    if (landHa > 0) { score += 30; reasons.push(`Cultivable land: ${landHa} ha`); }
    if (farmer.crop) { score += 20; reasons.push(`Crop: ${farmer.crop}`); }
  } else if (name.includes('kcc') || name.includes('kisan credit')) {
    if (age >= 18 && age <= 75) { score += 25; reasons.push(`Age ${age} in range`); }
    else gaps.push(`Age ${age} outside 18-75 range`);
    if (landHa > 0) { score += 30; reasons.push('Land owner'); }
  } else {
    if (landHa > 0) { score += 25; reasons.push(`Land: ${landHa} ha`); }
    if (farmer.crop) { score += 15; reasons.push(`Crop: ${farmer.crop}`); }
  }

  return { eligible: score >= 45, score: Math.min(100, score), reasons, gaps };
}
```

---

## PUSH NOTIFICATIONS SETUP

Use **Expo Notifications** for push notifications.

```typescript
// On app start (after login):
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

async function registerForPushNotifications(farmerId: string) {
  if (!Device.isDevice) return;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await api.post('/notifications/register-token', { farmerId, pushToken: token, platform: Platform.OS });
}
```

**Server-side** (when officer changes farmer status to Verified/Cancelled): Look up farmer's push token and send notification via Expo Push API:
```
POST https://exp.host/--/api/v2/push/send
Body: { to: pushToken, title: "Registration Verified!", body: "...", data: { type: "status_change" } }
```

---

## MARATHI TRANSLATIONS (KEY STRINGS)

```typescript
// constants/translations.ts
export const translations = {
  en: {
    welcome: "Welcome Farmer",
    enterMobile: "Enter your mobile number to continue",
    sendOtp: "Send OTP",
    verifyOtp: "Verify & Continue",
    registrationPending: "Registration Under Review",
    registrationVerified: "Verified Farmer",
    registrationCancelled: "Registration Cancelled",
    uploadDocuments: "Upload Your Documents",
    fileGrievance: "File a Grievance",
    eligibleSchemes: "Eligible Schemes",
  },
  mr: {
    welcome: "शेतकरी स्वागत",
    enterMobile: "पुढे सुरू ठेवण्यासाठी तुमचा मोबाइल नंबर टाका",
    sendOtp: "OTP पाठवा",
    verifyOtp: "सत्यापित करा आणि पुढे चला",
    registrationPending: "नोंदणी पुनरावलोकनात आहे",
    registrationVerified: "सत्यापित शेतकरी",
    registrationCancelled: "नोंदणी रद्द करण्यात आली",
    uploadDocuments: "तुमची कागदपत्रे अपलोड करा",
    fileGrievance: "तक्रार नोंदवा",
    eligibleSchemes: "पात्र योजना",
  }
};
```

---

## IMPORTANT IMPLEMENTATION NOTES

### 1. Token Storage
Use `expo-secure-store` (NOT AsyncStorage) for the JWT token. AsyncStorage is not encrypted.

### 2. File Uploads
- Use `expo-image-picker` for camera / gallery selection
- Use `expo-document-picker` for PDF files
- Convert URI to FormData blob for multipart upload
- Show upload progress using axios `onUploadProgress`

### 3. OCR Polling Timeout
Set a maximum polling time of **3 minutes** (45 polls × 4 seconds). After timeout, show error and offer retry.

### 4. Offline Handling
- Cache farmer profile and schemes locally using AsyncStorage
- Show "You're offline" banner when no network
- Queue grievance submissions for retry when back online

### 5. Camera Permissions
Request camera permission before opening camera. Show explanation dialog if denied.

### 6. Maharashtra Districts List
Hardcode all 36 Maharashtra districts as a dropdown option list for the registration form.

### 7. Testing
Test on both Android (API 26+) and iOS (13+). Use Expo Go for development, build with EAS Build for production.

### 8. App Store / Play Store Submission
- App ID: `com.airavatatechnologies.krushisuvidha`
- Build with: `eas build --platform all --profile production`
- Submit with: `eas submit`

---

## DELIVERABLES CHECKLIST

- [ ] All 12 screens implemented
- [ ] API integration complete (all endpoints)
- [ ] OCR document upload with polling
- [ ] Farmer status polling (real-time updates)
- [ ] Scheme eligibility engine (client-side)
- [ ] Grievance submission + tracking
- [ ] Push notifications (Expo)
- [ ] Marathi language toggle
- [ ] Offline handling + error states
- [ ] Loading skeletons on all data-fetching screens
- [ ] Form validation with react-hook-form + zod
- [ ] JWT auth guard + auto-redirect
- [ ] Tested on Android + iOS

---

*Project: Krushi Suvidha AI — Airavata Technologies*  
*App for Maharashtra Farmers — Companion to AgriAdmin Web Dashboard*  
*API Base: https://krushisuvidhaai.airavatatechnologies.com/api*  
*Document Version: 1.0 — May 2026*
