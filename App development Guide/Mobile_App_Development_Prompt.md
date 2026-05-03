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

---

## BACKEND CONFIGURATION

> These credentials are already live and running in production. Use them directly.

| Setting | Value |
|---------|-------|
| **API Base URL** | `https://krushisuvidhaai.airavatatechnologies.com/api` |
| **Server Port** | `3014` (single port — API + Admin Dashboard on one Express server) |
| **MongoDB URI** | `mongodb+srv://sairajkoyande_db_user:5QlrqFxJrJmM9rR4@cluster0.akmevxg.mongodb.net/?appName=Cluster0` |
| **DATALAB_API_KEY** | `Zgtv3ZTMRajX5sv5v9EqD81nsdUH0rfPwlWJd3SorTI` |
| **Platform** | Android + iOS (Expo managed workflow) |
| **Language** | TypeScript |
| **State** | Zustand |
| **Navigation** | Expo Router (file-based routing) |

> The MongoDB and DATALAB credentials are needed if you ever extend the API server. The mobile app only talks to the REST API — it does not connect to MongoDB or Datalab directly.

---

## BRAND & DESIGN SYSTEM

### App Name
**Krushi Suvidha AI** (कृषी सुविधा AI)

### Logo & Identity
- App logo: Green leaf / wheat sheaf icon with "कृषी सुविधा" in Devanagari script
- Tagline: "शेतकऱ्यांसाठी, शेतकऱ्यांनी" (For farmers, by farmers)
- Company: Airavata Technologies

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
- Top: "Login / Register" header
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

**API Call:**
```
POST https://krushisuvidhaai.airavatatechnologies.com/api/auth/otp/request
Body: { "mobile": "9876543210" }
```

**On Success:** Navigate to OTP screen with mobile as route param.

---

### SCREEN 3: OTP Verification Screen (`(auth)/otp-verify`)

**Purpose:** Farmer enters the 6-digit OTP received via SMS.

**Layout:**
- "Verify OTP" header
- "OTP sent to +91-98765-43210"
- 6 individual digit input boxes (auto-focus next on input)
- Countdown timer: "Resend OTP in 0:45"
- "Resend OTP" link (active after countdown)
- "Verify & Continue →" button (dark green)

**Logic:**
- Auto-submit when 6th digit entered
- Shake animation on wrong OTP

**API Call:**
```
POST https://krushisuvidhaai.airavatatechnologies.com/api/auth/otp/verify
Body: { "mobile": "9876543210", "otp": "482910" }
```

**On Success:**
- Save JWT to `expo-secure-store` with key `jwt_token`
- If `isNewFarmer: true` → Navigate to Registration
- If `isNewFarmer: false` → Navigate to Home (Dashboard)

---

### SCREEN 4: Home / Dashboard Screen (`(app)/(tabs)/home`)

**Purpose:** Main hub after login. Shows registration status or verified farmer dashboard.

#### State A: Pending Farmer

**Layout:**
- Header: "कृषी सुविधा AI" logo + notification bell icon
- Status card (amber border):
  - Status icon: ⏳
  - "Registration Under Review"
  - Submission date + Farmer ID
  - Progress tracker: `Submitted → Under Review → Verified`
  - Message: "Your documents are being reviewed by the District Officer."
- Tips section: "While you wait, explore government schemes →"

**Polling:** Call `GET /api/farmers/:farmerId/status` every 30 seconds while status is Pending.

#### State B: Verified Farmer

**Layout:**
- Green gradient header: "Good morning, [Name]!" + notification bell
- Profile summary card:
  - Farmer avatar (initials circle)
  - Name, Farmer ID, District, Village
  - "✅ Verified Farmer" green badge
- Stats row (4 tiles):
  - Land (ha) | Crop | Eligible Schemes | Open Grievances
- "Eligible Schemes" horizontal scroll
- "Recent Notifications" list (last 3)
- "File a Grievance" button

#### State C: Cancelled Farmer

**Layout:**
- Red status card with reason
- "Contact District Office" + "Re-apply" buttons

**API Calls:**
```
GET /api/auth/me                              ← on mount
GET /api/farmers/:farmerId/status             ← poll every 30s if Pending
GET /api/notifications?farmerId=:farmerId     ← on mount
```

---

### SCREEN 5: Document Upload / Registration

**4-step flow:**

#### Step 1 — Personal Information Form

Fields:
- Full Name (Marathi input supported)
- Date of Birth (date picker)
- Gender (radio: Male / Female / Other)
- Father's Name
- Category (dropdown: SC / ST / OBC / NT / VJNT / General)
- Mobile (pre-filled, read-only)
- Village, Taluka, District (dropdown: all 36 Maharashtra districts)

#### Step 2 — Document Upload

5 upload cards — one per document:

```
┌─────────────────────────────────┐
│ 📄 Form 7 (Ownership Register)  │
│ Maharashtra 7/12 – Rights       │
│ [📷 Take Photo] [📁 Browse]     │
│ ✅ Uploaded — form7.pdf (1.2MB) │
│ Extracted: Village: Ozhar       │
└─────────────────────────────────┘
```

Documents:
1. Form 7 → `document_type: "form7"`
2. Form 12 → `document_type: "form12"`
3. Form 8A → `document_type: "form8a"`
4. Aadhaar Card → `document_type: "aadhar"`
5. Bank Passbook → `document_type: "bank_passbook"`

**Upload flow per document:**
1. Farmer picks file or takes photo
2. `POST /api/extract` with `multipart/form-data`, `document_type`, `profile_phone`
3. Save `request_id`
4. Poll `GET /api/extract/:request_id` every 4 seconds
5. On complete → show extracted field preview in card
6. On error → show retry button
7. For Aadhaar: if `aadhar_photo.base64` returned, show farmer's photo

All 5 must show "Done" to enable "Next →".

#### Step 3 — Review Extracted Data

Summary of all extracted data, organized by section:
- **Identity:** Name, DOB, Aadhaar number (from Aadhaar)
- **Land:** Village, District, Survey No., Area (from Form 7)
- **Crop:** Season crops (from Form 12)
- **Bank:** Account number, IFSC, Bank name (from passbook)

All fields editable — farmer can correct any OCR mistakes.

#### Step 4 — Submit Registration

**API Call:**
```
POST /api/farmers
Body: { all farmer data, status: "Pending", source: "mobile" }
```

**On 201 Success:**
- Green checkmark success animation
- Show Farmer ID: "Your ID: F-043"
- "Go to Home" button
- Save `farmerId` to SecureStore

---

### SCREEN 6: Farmer Profile (`(app)/(tabs)/profile`)

**Layout:**
- Header: "My Profile" + Edit (pencil icon)
- Avatar initials circle + "✅ Verified Farmer" badge
- Farmer ID in monospace
- Tabs:
  - **Personal** — Name, DOB, Gender, Father's Name, Category, Mobile
  - **Land** — District, Village, Taluka, Survey No., Land Area, Crop
  - **Bank** — Bank Name, Branch, IFSC, Account (masked)
  - **Documents** — 5 doc cards with status chips (uploaded / failed)

**Edit Mode:**
- Tap Edit → editable inputs
- "Save Changes" → `PATCH /api/farmers/:farmerId`

---

### SCREEN 7: All Schemes (`(app)/(tabs)/schemes`)

**Layout:**
- Header: "Government Schemes" + search bar
- Filter chips: All | Central Govt | Maharashtra State
- Toggle: "Show only schemes I'm eligible for" (ON by default for verified farmers)
- Scheme cards list:

```
┌────────────────────────────────────────┐
│ 🏛 PM-KISAN          ✅ You're Eligible │
│ Income Support · Central Govt          │
│ ₹6,000/year in 3 installments         │
│ [View Details →]                       │
└────────────────────────────────────────┘
```

**API Call:** `GET /api/schemes` — fetch all, compute eligibility client-side.

**Eligibility is computed client-side** using the farmer's profile. See Eligibility Engine section.

---

### SCREEN 8: Scheme Detail (`schemes/[id]`)

**Layout:**
- Back button + scheme name header
- Hero card (light green gradient):
  - Scheme name, Type badge, Status badge
  - Eligibility score bar (e.g., 82%)
- Benefits section
- Tabs:
  - **Overview** — Eligibility criteria table, exclusions
  - **Documents Needed** — List with checkmarks (✅ if farmer has it)
  - **How to Apply** — Step-by-step + contact info
- Bottom: "Apply for this Scheme →" button

**Eligibility match breakdown:**
```
✅ Land holding: 2.2 ha
✅ Aadhaar linked
✅ Bank account available
❌ Aadhaar–bank linkage not yet verified
```

**API Call:** `GET /api/schemes/:id`

---

### SCREEN 9: Grievances (`(app)/(tabs)/grievances`)

**Layout:**
- Header: "Grievances" + "File New +" button
- Stats: N Open | N Resolved
- Grievance cards:

```
┌──────────────────────────────────────────┐
│ GR-2026-0041  ●  Under Review            │
│ PM-KISAN installment not received        │
│ Submitted: 3 May 2026                    │
│ [View Details →]                         │
└──────────────────────────────────────────┘
```

Status colors: Submitted → grey | Under Review → amber | Resolved → green | Closed → slate

**API Call:** `GET /api/grievances?farmerId=:farmerId`

---

### SCREEN 10: File New Grievance (`grievances/new`)

**Layout:**
- Header: "← File a Grievance"
- Form:
  - **Category** — dropdown: Scheme / Land / Payment / Registration / Other
  - **Related Scheme** — optional dropdown (from GET /api/schemes)
  - **Subject** — single line (max 100 chars)
  - **Description** — textarea (min 50, max 500 chars)
  - **Attach Photo** — optional image picker
  - "Submit Grievance →" button (dark green)

**API Call:**
```
POST /api/grievances
Body: { farmerId, farmerName, mobile, district, village, category, subject, description, schemeId? }
```

**On Success:**
- Success card: "Grievance Registered! ID: GR-2026-0041"
- Navigate back to Grievances list

---

### SCREEN 11: Grievance Detail (`grievances/[id]`)

**Layout:**
- Status timeline:
  ```
  ● Submitted — 3 May 2026
  ● Under Review — 4 May 2026
  ● Resolved — 5 May 2026
  ```
- Details: Category, Subject, Description
- Officer Response card (shown when resolved):
  ```
  👮 District Officer — Nashik
  "Your payment has been initiated..."
  ```

---

### SCREEN 12: Notifications (`notifications`)

**Layout:**
- "Mark all as read" button
- Grouped by date (Today / Yesterday / Earlier)
- Notification item:
  - Icon by type: ✅ verification | 📋 scheme | 💬 grievance
  - Title + body + timestamp
  - Unread: darker bg + green left border
  - Tap → navigate to relevant screen

**API Calls:**
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

npx expo install expo-router expo-secure-store expo-image-picker
npx expo install expo-document-picker expo-camera expo-file-system
npx expo install expo-notifications expo-font expo-device
npm install zustand axios react-hook-form @hookform/resolvers zod
npm install @react-native-community/datetimepicker
npm install react-native-reanimated react-native-gesture-handler
npm install nativewind tailwindcss
```

### File Structure

```
KrushiSuvidhaApp/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx          # Splash + Welcome
│   │   ├── login.tsx
│   │   └── otp-verify.tsx
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
│   └── _layout.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
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
│   ├── authStore.ts
│   ├── farmerStore.ts
│   └── notificationStore.ts
├── services/
│   ├── api.ts                 # Axios instance with base URL + JWT interceptor
│   ├── authService.ts
│   ├── farmerService.ts
│   ├── extractService.ts
│   ├── schemeService.ts
│   └── grievanceService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useFarmerStatus.ts
│   └── useNotifications.ts
├── utils/
│   ├── eligibility.ts
│   ├── storage.ts
│   └── i18n.ts
└── constants/
    ├── colors.ts
    ├── districts.ts           # All 36 Maharashtra districts
    └── documentTypes.ts
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
      // Trigger navigation to login (use a navigation ref or event emitter)
    }
    return Promise.reject(err);
  }
);
```

### Auth Guard (Root Layout)

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
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
  const [extracted, setExtracted] = useState<any>(null);

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

    // Poll until done (max 3 minutes = 45 attempts × 4 seconds)
    let attempts = 0;
    const poll = async (): Promise<void> => {
      if (attempts++ > 45) { setStatus('error'); return; }
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
import * as Notifications from 'expo-notifications';

export function useFarmerStatus(farmerId: string, currentStatus: string) {
  const { updateStatus } = useFarmerStore();

  useEffect(() => {
    if (currentStatus !== 'Pending') return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/farmers/${farmerId}/status`);
        if (data.status !== currentStatus) {
          updateStatus(data.status);
          if (data.status === 'Verified') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Registration Verified! ✅',
                body: 'Your farmer registration has been approved by the District Officer.',
              },
              trigger: null,
            });
          } else if (data.status === 'Cancelled') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Registration Update',
                body: 'Your registration status has been updated. Please open the app for details.',
              },
              trigger: null,
            });
          }
        }
      } catch (e) {
        // Ignore network errors during polling
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [farmerId, currentStatus]);
}
```

### Client-Side Eligibility Engine

```typescript
// utils/eligibility.ts
function getAge(dob: string): number {
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function getLandHa(land: string | number): number {
  const s = String(land);
  const [h, a] = s.split('.');
  return parseFloat(h || '0') + parseFloat(a || '0') / 100;
}

export function checkEligibility(farmer: any, scheme: any) {
  let score = 0;
  const reasons: string[] = [];
  const gaps: string[] = [];
  const landHa = getLandHa(farmer.land);
  const age = farmer.dob ? getAge(farmer.dob) : 35;
  const name = scheme.name.toLowerCase();

  if (['Verified', 'Active'].includes(farmer.status)) { score += 20; reasons.push('Active registered farmer'); }
  if (farmer.bankAccount) { score += 15; reasons.push('Bank account linked'); }

  if (name.includes('pm-kisan')) {
    if (landHa > 0) { score += 30; reasons.push(`Land: ${landHa.toFixed(2)} ha`); }
    if (farmer.aadhaar) { score += 15; reasons.push('Aadhaar available'); }
  } else if (name.includes('pmfby') || name.includes('fasal bima')) {
    if (landHa > 0) { score += 30; reasons.push(`Cultivable land: ${landHa.toFixed(2)} ha`); }
    if (farmer.crop) { score += 20; reasons.push(`Crop: ${farmer.crop}`); }
  } else if (name.includes('kcc') || name.includes('kisan credit')) {
    if (age >= 18 && age <= 75) { score += 25; reasons.push(`Age ${age} in 18–75 range`); }
    else gaps.push(`Age ${age} outside 18–75 range`);
    if (landHa > 0) { score += 30; reasons.push('Agricultural land owner'); }
  } else if (name.includes('kusum') || name.includes('solar')) {
    if (landHa >= 0.5) { score += 35; reasons.push(`${landHa.toFixed(2)} ha suitable for solar`); }
    else gaps.push('Insufficient land for solar pump');
  } else if (name.includes('maan-dhan') || name.includes('pension')) {
    if (age >= 18 && age <= 40) { score += 35; reasons.push(`Age ${age} in 18–40 range`); }
    else gaps.push(`Age ${age} outside 18–40 range`);
  } else {
    if (landHa > 0) { score += 25; reasons.push(`Land: ${landHa.toFixed(2)} ha`); }
    if (farmer.crop) { score += 15; reasons.push(`Crop: ${farmer.crop}`); }
  }

  const cat = (farmer.category || '').toLowerCase();
  if (['sc','st','obc','nt','vjnt'].some(c => cat.includes(c))) {
    score += 10; reasons.push(`Reserved category: ${farmer.category}`);
  }

  return { eligible: score >= 45, score: Math.min(100, score), reasons, gaps };
}
```

---

## PUSH NOTIFICATIONS SETUP

```typescript
// Call this after successful login
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

async function registerForPushNotifications(farmerId: string) {
  if (!Device.isDevice) return;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await api.post('/notifications/register-token', {
    farmerId,
    pushToken: token,
    platform: Platform.OS,
  });
}

// Configure notification handler at app root
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

**Server-side push** (when officer verifies/cancels a farmer, the API server should):
```
POST https://exp.host/--/api/v2/push/send
Body: { to: pushToken, title: "...", body: "...", data: { type: "status_change" } }
```

---

## MARATHI TRANSLATIONS (KEY STRINGS)

```typescript
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
    notifications: "Notifications",
    profile: "My Profile",
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
    notifications: "सूचना",
    profile: "माझी प्रोफाइल",
  }
};
```

---

## IMPORTANT IMPLEMENTATION NOTES

1. **Token Storage:** Use `expo-secure-store` (NOT AsyncStorage) for JWT — SecureStore is encrypted.
2. **File Uploads:** Use `expo-image-picker` for camera/gallery. Convert to FormData blob for multipart upload.
3. **OCR Polling Timeout:** Max 3 minutes (45 polls × 4 seconds). After timeout, show retry.
4. **Offline Handling:** Cache farmer profile and schemes in AsyncStorage. Show "You're offline" banner. Queue grievance submissions for retry.
5. **Camera Permissions:** Request before opening camera. Show explanation dialog if denied.
6. **Maharashtra Districts:** Hardcode all 36 districts as a dropdown list in `constants/districts.ts`.
7. **App ID:** `com.airavatatechnologies.krushisuvidha`
8. **Build:** `eas build --platform all --profile production`

---

## DELIVERABLES CHECKLIST

- [ ] All 12 screens implemented with green-only design system
- [ ] JWT auth flow (OTP login, SecureStore, auth guard)
- [ ] 5-document OCR upload with 4-second polling
- [ ] Farmer status polling (30-second interval, local notification on change)
- [ ] Scheme eligibility engine (client-side, all scheme types)
- [ ] Grievance submission + status tracking
- [ ] Expo push notifications + server-side token registration
- [ ] Marathi language toggle
- [ ] Offline handling + error states + loading skeletons
- [ ] Form validation with react-hook-form + zod
- [ ] Tested on Android (API 26+) and iOS (13+)

---

*Project: Krushi Suvidha AI — Airavata Technologies*  
*API: https://krushisuvidhaai.airavatatechnologies.com/api (Port 3014)*  
*MongoDB: mongodb+srv://sairajkoyande_db_user:5QlrqFxJrJmM9rR4@cluster0.akmevxg.mongodb.net/?appName=Cluster0*  
*DATALAB_API_KEY: Zgtv3ZTMRajX5sv5v9EqD81nsdUH0rfPwlWJd3SorTI*  
*Document Version: 1.1 — May 2026*
