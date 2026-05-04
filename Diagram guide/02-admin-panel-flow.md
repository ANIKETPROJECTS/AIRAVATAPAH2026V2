# Krushi Suvidha AI — Admin Panel Flow

## Overview

The Admin Panel is a **React + Vite** single-page application running at port 5000. It is accessed by government officers via a browser. It provides tools to manage farmer registrations, verify OCR-extracted documents, process scheme applications, manage subsidies, handle insurance claims, and resolve grievances.

---

## Admin Login & Auth Flow

```mermaid
flowchart TD
    A([Officer Opens Browser]) --> B[Login Page\n/]
    B --> C{Credentials?}
    C -->|Click Demo Account| D[Auto-fill email + password]
    C -->|Manual entry| E[Type email + password]
    D --> F[Click 'Sign In to AgriAdmin']
    E --> F
    F --> G{Auth Check\nLocalStorage}
    G -->|Invalid credentials| H[Show error message\nbelow form]
    G -->|Account deactivated| I[Show deactivation message]
    G -->|Valid| J[Save session to localStorage\nagri_session_v1]
    J --> K[Load user permissions\nbased on role]
    K --> L[Render Dashboard\nwith role-filtered sidebar]

    style A fill:#f0fdf4,stroke:#16a34a
    style L fill:#f0fdf4,stroke:#16a34a
    style H fill:#fef2f2,stroke:#dc2626
```

---

## Role-Based Access Control

```mermaid
flowchart LR
    subgraph Roles
        R1[Admin\nDistrict Agricultural Officer]
        R2[District Officer\nDistrict Agricultural Officer]
        R3[Taluka Officer\nTaluka Agricultural Officer]
        R4[Viewer\nRead-only Access]
    end

    subgraph Modules
        M1[Dashboard]
        M2[New Registration]
        M3[Farmer Registry]
        M4[Verified Farmers]
        M5[Scheme Applications]
        M6[All Schemes]
        M7[Subsidy Management]
        M8[Insurance Claims]
        M9[Grievance Management]
        M10[Reports & Analytics]
        M11[Settings & Workflow]
        M12[Farmer App Preview]
        M13[User Management]
    end

    R1 --> M1 & M2 & M3 & M4 & M5 & M6 & M7 & M8 & M9 & M10 & M11 & M12 & M13
    R2 --> M1 & M2 & M3 & M4 & M5 & M6 & M7 & M8 & M9 & M10
    R3 --> M1 & M2 & M3 & M4 & M9
    R4 --> M1 & M10 & M6

    style R1 fill:#dcfce7,stroke:#16a34a
    style R2 fill:#dbeafe,stroke:#2563eb
    style R3 fill:#fef9c3,stroke:#ca8a04
    style R4 fill:#f3f4f6,stroke:#6b7280
```

---

## New Registration Flow (OCR-Driven)

```mermaid
flowchart TD
    A([Officer Opens New Registration]) --> B[Registration Page Loads\nSrc: NewRegistration.tsx]
    B --> C[5 Document Upload Cards Shown\nForm 7 · Form 12 · Form 8A · Aadhaar · Passbook]

    C --> D[Officer uploads a document file\nDrag-drop or file picker]
    D --> E[POST /api/extract\nbody: file, document_type, mode, profile_phone]
    E --> F[API fans out to Datalab\nExtract Pipeline + Marker Pipeline in parallel]
    F --> G{Poll GET /api/extract/:requestId}
    G -->|Still processing| G
    G -->|Complete| H[Receive structured_fields\n+ raw_tables + text_blocks]
    H --> I[Display DocReviewPanel\nExtracted fields shown in language selected]
    I --> J{Phone number provided?}
    J -->|Yes| K[Auto-save to MongoDB\nfarmer profile — ocr sub-document]
    J -->|No| L[Fields shown but not persisted]
    K --> M[FarmerProfileCard updates live\nshowing merged profile data]
    M --> N[Officer reviews all 5 documents]
    N --> O[Officer sets status to Verified\nor requests re-upload]

    style A fill:#f0fdf4,stroke:#16a34a
    style O fill:#f0fdf4,stroke:#16a34a
    style F fill:#eff6ff,stroke:#3b82f6
```

---

## Farmer Registry — Review & Verification Flow

```mermaid
flowchart TD
    A([Officer Opens Farmer Registry]) --> B[GET /api/farmers\nLoads all farmer profiles]
    B --> C[Table view: name, village, status, date]
    C --> D{Officer actions}

    D -->|Search by name/phone| E[Filter table rows live]
    D -->|Filter by status| F[Show Pending / Verified / Rejected]
    D -->|Click farmer row| G[Open Farmer Detail Panel]

    G --> H[View all OCR-extracted sections]
    H --> I[Aadhaar · Passbook · Form7 · Form12 · Form8A]
    I --> J[Review each field for accuracy]
    J --> K{Decision}

    K -->|Approve| L[PATCH /api/farmers/:id\nstatus = Verified]
    K -->|Reject| M[PATCH /api/farmers/:id\nstatus = Rejected + reason]
    K -->|Request more docs| N[Flag specific document section]

    L --> O[Push notification sent to farmer\n'Your profile has been Verified!']
    M --> P[Push notification sent to farmer\n'Re-upload requested']

    style A fill:#f0fdf4,stroke:#16a34a
    style O fill:#dcfce7,stroke:#16a34a
    style P fill:#fef2f2,stroke:#dc2626
```

---

## Verified Farmers Section

```mermaid
flowchart TD
    A[Farmer status = Verified] --> B[Auto-rendered below Farmer Registry table]
    B --> C[VerifiedFarmerCard Component]

    C --> D[Card Header\nInitials avatar · Name · Farmer ID\nVillage/District · Phone/Email\nVerified badge · OCR badge]

    D --> E[Summary Strip\nEligible schemes count\nApplied / Active schemes\nOpen grievances · Open tickets]

    E --> F[Collapsible Sections]
    F --> G[Personal Details\nFather · DOB · Gender · Category\nReligion · Aadhaar · Mobile · Email]
    F --> H[Land & Farm Details\nSurvey no. · Village · District · Taluka\nTotal area · Irrigated area\nOwnership · Soil · Crops · Irrigation]
    F --> I[Bank & Financial\nBank name · Branch · IFSC\nAccount no. · DBT / NPCI status]
    F --> J[Scheme Eligibility\n10 schemes — PM-KISAN · PMFBY · KCC\nSHC · PKVY · PMAY-G · MMS\nNMSA · GKY · Drip Irrigation\nStatus: Applied / Approved / Disbursed / Rejected]
    F --> K[Grievances\nStatus · Priority · Description\nFiled/Resolved dates]
    F --> L[Support Tickets\nType · Status · Description · Date]
    F --> M[Documents\nUploaded files with status indicators]
```

---

## Scheme Applications Flow

```mermaid
flowchart TD
    A([Officer Opens Scheme Applications]) --> B[List of all scheme applications]
    B --> C{Filter options}
    C --> D[By scheme name]
    C --> E[By status: Pending / Approved / Rejected / Disbursed]
    C --> F[By farmer name / ID]

    D & E & F --> G[Filtered application list]
    G --> H[Officer clicks application]
    H --> I[Application detail panel]
    I --> J[Farmer profile summary]
    I --> K[Scheme eligibility check\nagainst farmer's OCR data]
    I --> L[Required documents checklist]

    L --> M{Officer decision}
    M -->|Approve| N[Status → Approved\nDisbursement scheduled]
    M -->|Reject| O[Status → Rejected + reason]
    M -->|Request info| P[Status → Pending More Info]

    N --> Q[Notify farmer via push]
    O --> Q
    P --> Q
```

---

## Grievance Management Flow

```mermaid
flowchart TD
    A([Officer Opens Grievance Management]) --> B[GET /api/grievances\nAll open grievances loaded]
    B --> C[Table: GRV-XXXX · Farmer name · Category · Status · Priority · Date]

    C --> D{Filter / Search}
    D --> E[By status: Open · In Progress · Resolved · Closed]
    D --> F[By farmer phone / ID]
    D --> G[By category]

    E & F & G --> H[Filtered grievance list]
    H --> I[Officer clicks grievance]
    I --> J[Grievance detail panel]
    J --> K[Farmer info · Subject · Description · Filed date]
    J --> L[Admin reply text area]

    L --> M[Officer types reply]
    M --> N{Update status}
    N -->|In Progress| O[PATCH /api/grievances/:id\nstatus = In Progress]
    N -->|Resolved| P[PATCH /api/grievances/:id\nstatus = Resolved + adminReply]
    N -->|Closed| Q[PATCH /api/grievances/:id\nstatus = Closed]

    O & P & Q --> R[Push notification to farmer]
```

---

## Dashboard KPIs & Analytics

```mermaid
flowchart LR
    A[Dashboard Module] --> B[KPI Cards]
    B --> B1[Total Farmers Registered]
    B --> B2[Pending Applications]
    B --> B3[Verified Farmers]
    B --> B4[Open Grievances]
    B --> B5[Total Subsidies Disbursed]
    B --> B6[Active Schemes]

    A --> C[Charts — Recharts Library]
    C --> C1[Bar Chart\nRegistrations over time]
    C --> C2[Pie Chart\nScheme distribution]
    C --> C3[Line Chart\nSubsidy disbursement trends]
    C --> C4[Area Chart\nGrievance resolution rate]

    A --> D[Activity Feed\nRecent registrations · verifications · replies]
    A --> E[Quick Actions\nNew Registration · View Pending · Export Report]
```

---

## AI Assistant Widget

```mermaid
flowchart TD
    A[Floating AI Chat Button\nbottom-right corner] -->|Click| B[Chat panel slides in]
    B --> C[Officer types query]
    C --> D{Query type}
    D --> D1[Farmer lookup query\ne.g. 'Show me all farmers in Nashik']
    D --> D2[Scheme query\ne.g. 'Who is eligible for PM-KISAN?']
    D --> D3[Grievance summary\ne.g. 'Summarize open complaints']
    D1 & D2 & D3 --> E[AI response rendered in chat\nPurely frontend mock — no real API call]
    E --> F[Officer reads insight\nNavigates to relevant module manually]
```

---

## Language Switching

```mermaid
flowchart LR
    A[LangSelector Component\nshown on every doc card] -->|Select language| B{Language chosen}
    B --> EN[English]
    B --> HI[हिंदी]
    B --> MR[मराठी]

    EN & HI & MR --> C[lang state prop\nthreaded into child components]
    C --> D[DocReviewPanel\nField labels translated]
    C --> E[FarmerProfileCard\nSection headers translated]
    C --> F[Sidebar labels\ntranslated via i18n/translations.ts]

    style EN fill:#dbeafe,stroke:#3b82f6
    style HI fill:#fef9c3,stroke:#ca8a04
    style MR fill:#dcfce7,stroke:#16a34a
```

---

## Admin Panel UI Design Specifications

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| Primary Green | `#16a34a` | Buttons, active states, badges |
| Dark Green | `#14532d` | Sidebar background, brand panel |
| Gold / Amber | `#ca8a04` | Logo accent, highlights |
| White | `#ffffff` | Card backgrounds, form fields |
| Light Gray | `#f9fafb` | Page background |
| Red | `#dc2626` | Error states, rejected status |
| Blue | `#2563eb` | Info states, links |

### Typography
| Element | Font | Weight | Size |
|---|---|---|---|
| Brand logo | DM Serif Display | 700 | 28px+ |
| Page headings | DM Sans | 700 | 24px |
| Card titles | DM Sans | 600 | 16px |
| Body text | DM Sans | 400 | 14px |
| Table data | DM Sans | 400 | 13px |
| Badges | DM Sans | 600 | 11px |

### Key UI Components
- **Sidebar**: Fixed left, collapsible, dark green background, white icons, active item highlighted in bright green
- **Cards**: White background, subtle shadow (`shadow-sm`), rounded corners (`rounded-xl`)
- **Status Badges**: Pill-shaped, color-coded (green=verified, yellow=pending, red=rejected, blue=in progress)
- **Tables**: Striped rows, hover highlight, sticky header
- **Modals**: Centered overlay with backdrop blur
- **Toasts**: Bottom-right corner, auto-dismiss after 4 seconds
