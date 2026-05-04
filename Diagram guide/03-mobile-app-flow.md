# Krushi Suvidha AI — Mobile App Flow

## Overview

The Farmer Mobile App (built with **Expo / React Native**) is the primary interface for farmers. It allows them to:
1. Register and verify their identity via OTP
2. Upload agricultural documents (Aadhaar, land records, bank passbook)
3. View their verification status
4. Browse schemes and subsidies they are eligible for
5. Apply for government schemes directly
6. File and track grievances

The app communicates with the same backend API server used by the Admin Panel.

---

## Mobile App — Full Navigation Structure

```mermaid
flowchart TD
    A([Farmer opens app]) --> B{Has JWT token\nin secure storage?}
    B -->|No| C[Onboarding / Login Screen]
    B -->|Yes| D[Home / Dashboard Screen]

    C --> E[Enter mobile number]
    E --> F[POST /auth/send-otp]
    F --> G[OTP screen — enter 6-digit code]
    G --> H[POST /auth/verify-otp]
    H --> I{Is farmer\nalready registered?}
    I -->|No| J[Profile Setup Screen\nenter basic details]
    I -->|Yes| D

    J --> K[Document Upload Screen]
    K --> D

    D --> L[Bottom Tab Navigation]
    L --> L1[🏠 Home]
    L --> L2[📄 Documents]
    L --> L3[🌾 Schemes]
    L --> L4[📣 Grievances]
    L --> L5[👤 Profile]

    style A fill:#f0fdf4,stroke:#16a34a
    style D fill:#f0fdf4,stroke:#16a34a
```

---

## OTP Authentication Flow (Detailed)

```mermaid
sequenceDiagram
    participant Farmer as 📱 Farmer App
    participant API as ⚙️ API Server
    participant DB as 🗄️ MongoDB

    Farmer->>API: POST /auth/send-otp\n{ mobile: "9876543210" }
    API->>DB: Store OTP in otp_sessions\n{ mobile, otp, expiresAt, verified: false }
    API->>Farmer: { success: true, message: "OTP sent" }
    Note over Farmer: Farmer receives SMS OTP

    Farmer->>API: POST /auth/verify-otp\n{ mobile, otp }
    API->>DB: Lookup otp_sessions\nCheck expiry + match
    alt OTP valid
        DB-->>API: OTP record found + not expired
        API->>DB: Mark otp verified, check farmers collection
        alt Farmer exists
            DB-->>API: Existing farmer profile
            API->>Farmer: { token: JWT, isRegistered: true, farmerId }
        else New farmer
            DB-->>API: No profile found
            API->>Farmer: { token: JWT, isRegistered: false }
        end
    else OTP invalid / expired
        API->>Farmer: { error: "Invalid or expired OTP" }
    end

    Note over Farmer: Store JWT in SecureStore
    Farmer->>API: POST /auth/register-push-token\n{ mobile, expoPushToken }
    API->>DB: Save push token for notifications
```

---

## Document Upload Flow (Farmer Side)

```mermaid
flowchart TD
    A([Farmer taps 'Documents' tab]) --> B[Document Upload Screen]
    B --> C[5 document cards shown]
    C --> C1[📋 Aadhaar Card]
    C --> C2[🏦 Bank Passbook]
    C --> C3[📜 Form 7 — Satbara]
    C --> C4[📜 Form 12 — Hakkpatra]
    C --> C5[📜 Form 8A — Khate Utara]

    C1 & C2 & C3 & C4 & C5 --> D[Farmer taps a card]
    D --> E{Upload method}
    E -->|Camera| F[Open device camera\ncapture document photo]
    E -->|Gallery| G[Open image picker\nchoose from photos]
    E -->|File| H[Open file picker\nchoose PDF or image]

    F & G & H --> I[POST /api/extract\n{ file, document_type,\n  mode, profile_phone }]
    I --> J[Show upload progress spinner]
    J --> K[Poll GET /api/extract/:requestId\nevery 2 seconds]
    K -->|Processing| K
    K -->|Complete| L[Show extracted fields\nto farmer for review]
    L --> M{Farmer confirms data is correct?}
    M -->|Yes| N[Data auto-saved to profile\nDocument marked as Uploaded ✓]
    M -->|No| O[Farmer re-captures document]
    O --> D

    style A fill:#f0fdf4,stroke:#16a34a
    style N fill:#dcfce7,stroke:#16a34a
```

---

## Document Status Tracking

```mermaid
stateDiagram-v2
    [*] --> Not_Uploaded : No action taken
    Not_Uploaded --> Uploading : Farmer selects file
    Uploading --> Processing : File sent to OCR API
    Processing --> Uploaded : OCR complete + data saved
    Uploaded --> Under_Review : Admin opens the profile
    Under_Review --> Verified : Admin approves document
    Under_Review --> Rejected : Admin rejects document
    Rejected --> Not_Uploaded : Farmer must re-upload
    Verified --> [*] : Document accepted
```

---

## Home Dashboard Screen (Farmer)

```mermaid
flowchart TD
    A[Home Screen] --> B[Welcome banner\nFarmer name · Village · Farmer ID]
    A --> C[Profile Status Card]
    C --> C1{Status}
    C1 --> D1[🟡 Pending\nDocuments not yet submitted]
    C1 --> D2[🔵 Under Review\nAdmin is reviewing]
    C1 --> D3[✅ Verified\nProfile approved!]
    C1 --> D4[🔴 Rejected\nRe-upload required]

    A --> E[Document Progress\nX of 5 documents uploaded]
    A --> F[Quick Actions]
    F --> F1[Upload Documents]
    F --> F2[View Eligible Schemes]
    F --> F3[File Grievance]

    A --> G[Recent Notifications\nlast 3 push notifications]
    A --> H[Upcoming Deadlines\nscheme application last dates]
```

---

## Scheme Discovery & Application Flow

```mermaid
flowchart TD
    A([Farmer taps 'Schemes' tab]) --> B[GET /api/schemes\nFetch all active schemes]
    B --> C[Schemes List Screen]
    C --> D[Filter bar at top]
    D --> D1[All Schemes]
    D --> D2[Eligible Only\nbased on farmer's profile]
    D --> D3[Applied]
    D --> D4[Central / State filter]

    D1 & D2 & D3 & D4 --> E[Filtered scheme cards]
    E --> F{Farmer taps a scheme card}

    F --> G[Scheme Detail Screen]
    G --> G1[Scheme name + logo]
    G --> G2[Description + benefits]
    G --> G3[Eligibility criteria\nchecked against farmer profile]
    G --> G4[Required documents\nwith upload status indicators]
    G --> G5[Application deadline]
    G --> G6[Disbursement amount / type]

    G3 --> H{Is farmer eligible?}
    H -->|Yes| I[Apply Now button — active]
    H -->|No| J[Why not eligible — reasons listed\nMissing docs or criteria not met]

    I --> K[Application Form]
    K --> L[Pre-filled from farmer profile\nFarmer reviews + confirms]
    L --> M[POST — submit scheme application]
    M --> N[Application submitted\nStatus: Pending]
    N --> O[Admin reviews and approves/rejects]
    O --> P[Push notification to farmer]

    style A fill:#f0fdf4,stroke:#16a34a
    style N fill:#dbeafe,stroke:#3b82f6
    style P fill:#dcfce7,stroke:#16a34a
```

---

## Scheme Eligibility Logic

```mermaid
flowchart TD
    A[Farmer Profile Data\nfrom OCR documents] --> B[Eligibility Engine]

    B --> C{Check each scheme's rules}

    C --> D[Land area check\nForm 7/12 data]
    C --> E[Category check\nSC / ST / OBC / General\nAadhaar data]
    C --> F[Bank linkage check\nAadhaar ↔ Bank IFSC\nPassbook data]
    C --> G[Crop type check\nForm 8A data]
    C --> H[Income exclusion check\nNo income tax payer\nNo government employee]

    D & E & F & G & H --> I{All rules pass?}
    I -->|Yes| J[Mark scheme as ELIGIBLE ✅]
    I -->|Partial| K[Mark as PARTIALLY ELIGIBLE ⚠️\nshow missing criteria]
    I -->|No| L[Mark as NOT ELIGIBLE ❌\nshow blocking reasons]

    subgraph Schemes
        PM_KISAN[PM-KISAN\n₹6000/year]
        PMFBY[PMFBY\nCrop Insurance]
        KCC[KCC\nKisan Credit Card]
        SHC[Soil Health Card]
        PKVY[PKVY\nOrganic Farming]
        PMAY_G[PMAY-G\nHousing]
        MMS[MMS\nMahila Sashaktikaran]
        NMSA[NMSA\nSoil + Water]
        GKY[GKY\nSkill Training]
        Drip[Drip Irrigation\nSubsidy]
    end
```

---

## Grievance Filing & Tracking Flow

```mermaid
flowchart TD
    A([Farmer taps 'Grievances' tab]) --> B[Grievance List Screen]
    B --> C[Past grievances shown\nGRV-XXXX · Category · Status · Date]

    C --> D[Farmer taps '+ New Grievance']
    D --> E[Grievance Form]
    E --> F[Select category\nDocument · Payment · Scheme · Technical · Other]
    F --> G[Enter subject — short title]
    G --> H[Enter description — detailed]
    H --> I[Optional: attach photo / file]
    I --> J[POST /api/grievances\n{ mobile, farmerId, category,\n  subject, description }]
    J --> K[Grievance created\nID: GRV-XXXX]
    K --> L[Confirmation screen\nGrievance submitted successfully]

    B --> M[Farmer taps existing grievance]
    M --> N[Grievance Detail Screen]
    N --> O[Status timeline]
    O --> O1[🔴 Open — filed date]
    O --> O2[🔵 In Progress — admin picked up]
    O --> O3[🟢 Resolved — admin replied]
    O --> O4[⚫ Closed]

    N --> P[Admin reply shown\nif status = Resolved]
    N --> Q[Push notification history]

    style A fill:#f0fdf4,stroke:#16a34a
    style L fill:#dcfce7,stroke:#16a34a
```

---

## Profile Screen

```mermaid
flowchart TD
    A([Farmer taps 'Profile' tab]) --> B[Profile Screen]
    B --> C[Profile header\nPhoto / initials · Name · Farmer ID · Village]
    B --> D[Verification badge\nbased on current status]

    B --> E[Sections]
    E --> E1[Personal Information\nName · DOB · Gender · Category\nAadhaar number · Mobile]
    E --> E2[Land Details\nSurvey numbers · Area\nVillage · District · Taluka]
    E --> E3[Bank Details\nBank name · IFSC · Account no.\nDBT/NPCI linkage status]
    E --> E4[Documents\nUpload status for all 5 docs\nTap to re-upload if rejected]
    E --> E5[Schemes\nApplied schemes + statuses]
    E --> E6[Settings\nLanguage · Notifications · Logout]
```

---

## Push Notification Events

| Event | Trigger | Message |
|---|---|---|
| Profile Verified | Admin sets status = Verified | "🎉 Your profile has been verified! You are now eligible for schemes." |
| Profile Rejected | Admin sets status = Rejected | "⚠️ Your profile requires attention. Please re-upload the requested documents." |
| Document Rejected | Admin flags a specific doc | "📄 Your Aadhaar document was rejected. Please re-upload a clear copy." |
| Scheme Approved | Admin approves scheme application | "✅ Your PM-KISAN application has been approved!" |
| Scheme Rejected | Admin rejects scheme application | "❌ Your PMFBY application was rejected. Reason: [reason]" |
| Grievance Update | Admin updates grievance status | "📣 Your grievance GRV-0042 has been resolved." |
| New Scheme Available | Admin activates a new scheme | "🌾 A new scheme 'Drip Irrigation Subsidy' is now available. Check your eligibility!" |

---

## Mobile App UI Design Specifications

### Color Palette (follows admin panel branding)
| Token | Hex | Usage |
|---|---|---|
| Primary Green | `#16a34a` | Primary actions, verified badges, active tabs |
| Dark Green | `#14532d` | Headers, status bars |
| Gold / Amber | `#ca8a04` | Logo, accent elements |
| Light Green | `#f0fdf4` | Screen backgrounds |
| White | `#ffffff` | Cards, input fields |
| Red | `#dc2626` | Errors, rejected status |
| Blue | `#2563eb` | Links, in-progress status |

### Typography
| Element | Font | Weight | Size |
|---|---|---|---|
| Screen titles | DM Serif Display | 700 | 22px |
| Section headers | DM Sans | 600 | 18px |
| Body / labels | DM Sans | 400 | 15px |
| Captions | DM Sans | 400 | 12px |
| Buttons | DM Sans | 600 | 16px |

### UI Patterns
- **Bottom Tab Bar**: 5 tabs — Home · Documents · Schemes · Grievances · Profile
- **Status Pills**: Rounded pill badges, color-coded by status
- **Document Cards**: White card with upload icon, tap to upload, green checkmark when done
- **Progress Bar**: Document upload progress — "3 of 5 documents uploaded"
- **OTP Input**: 6 separate digit boxes, auto-advance on input
- **Pull to Refresh**: All list screens support pull-to-refresh
- **Empty States**: Illustrated empty states with action buttons when no data
- **Loading Skeletons**: Shimmer loading placeholders while API data loads
