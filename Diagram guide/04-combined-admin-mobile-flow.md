# Krushi Suvidha AI — Combined Admin + Mobile App Flow

## Overview

This document shows how the **Farmer Mobile App** and the **Admin Web Panel** interact with each other through the shared backend API. It covers the full lifecycle from farmer onboarding to scheme disbursement, showing how both sides of the system work together in real time.

---

## Full System Architecture — Both Sides

```mermaid
flowchart TD
    subgraph Mobile["📱 Farmer Mobile App (Expo / React Native)"]
        M1[OTP Login Screen]
        M2[Document Upload]
        M3[Home Dashboard]
        M4[Scheme Browser]
        M5[Grievance Module]
        M6[Profile Screen]
    end

    subgraph Admin["🏛️ Admin Web Panel (React + Vite)"]
        A1[Login Page]
        A2[New Registration Module]
        A3[Farmer Registry]
        A4[Verified Farmers]
        A5[Scheme Applications]
        A6[Grievance Management]
        A7[Dashboard & Reports]
    end

    subgraph API["⚙️ API Server (Node.js + Express — Port 8000)"]
        R1[/auth routes]
        R2[/extract routes]
        R3[/farmers routes]
        R4[/schemes routes]
        R5[/grievances routes]
        R6[/notifications routes]
    end

    subgraph External["🌐 External Services"]
        OCR[Datalab AI\nExtract + Marker]
        PUSH[Expo Push\nNotification Service]
        SMS[SMS Gateway\nOTP Delivery]
    end

    subgraph DB["🗄️ MongoDB Atlas (apnaapp DB)"]
        C1[(farmers)]
        C2[(schemes)]
        C3[(grievances)]
        C4[(notifications)]
        C5[(otp_sessions)]
    end

    Mobile <-->|HTTPS REST| API
    Admin <-->|HTTPS REST| API
    API <-->|Read / Write| DB
    API -->|Document processing| OCR
    OCR -->|Structured data| API
    API -->|Push| PUSH
    PUSH -->|Notification| Mobile
    API -->|OTP| SMS
    SMS -->|6-digit code| Mobile

    style Mobile fill:#f0fdf4,stroke:#16a34a
    style Admin fill:#eff6ff,stroke:#3b82f6
    style API fill:#fef9c3,stroke:#ca8a04
    style External fill:#f3f4f6,stroke:#6b7280
    style DB fill:#fdf4ff,stroke:#9333ea
```

---

## Complete Farmer Journey — End to End

```mermaid
sequenceDiagram
    participant F as 📱 Farmer (Mobile)
    participant API as ⚙️ API Server
    participant OCR as 🤖 Datalab OCR
    participant DB as 🗄️ MongoDB
    participant OFC as 🏛️ Officer (Admin Panel)
    participant PUSH as 📨 Push Service

    rect rgb(240, 253, 244)
    Note over F,PUSH: PHASE 1 — REGISTRATION & OTP AUTH
    F->>API: POST /auth/send-otp { mobile }
    API->>DB: Store OTP in otp_sessions
    API-->>F: OTP sent via SMS
    F->>API: POST /auth/verify-otp { mobile, otp }
    API-->>F: JWT token + isRegistered: false
    F->>API: Create basic farmer profile { name, village, district }
    API->>DB: Insert into farmers collection
    API-->>F: { farmerId: "KS-2024-XXXX" }
    end

    rect rgb(239, 246, 255)
    Note over F,PUSH: PHASE 2 — DOCUMENT UPLOAD (Mobile or Admin)
    F->>API: POST /extract { file, document_type: "aadhaar", profile_phone }
    API->>OCR: Fan out — Extract pipeline + Marker pipeline
    OCR-->>API: Structured fields + tables + text blocks
    API->>DB: Auto-save OCR data to farmers.ocr.aadhar
    API-->>F: { requestId, status: "complete", structured_fields }
    Note over F: Farmer reviews extracted data
    F->>API: Repeat for all 5 documents
    Note over OFC: Alternatively, officer does this manually in\nNew Registration module
    end

    rect rgb(254, 249, 195)
    Note over F,PUSH: PHASE 3 — ADMIN REVIEW & VERIFICATION
    OFC->>API: GET /farmers
    API->>DB: Fetch all farmer profiles
    API-->>OFC: Farmer list with OCR data
    OFC->>API: GET /farmers/:farmerId
    API-->>OFC: Full profile with all OCR sub-docs
    Note over OFC: Officer reviews Aadhaar, Passbook, Form 7/12/8A
    OFC->>API: PATCH /farmers/:farmerId { status: "Verified" }
    API->>DB: Update farmer status to Verified
    API->>PUSH: Trigger push notification
    PUSH-->>F: "🎉 Your profile has been verified!"
    end

    rect rgb(240, 253, 244)
    Note over F,PUSH: PHASE 4 — SCHEME DISCOVERY & APPLICATION
    F->>API: GET /schemes
    API->>DB: Fetch active schemes + run eligibility rules
    API-->>F: Schemes list with eligibility flags
    F->>API: POST — apply for PM-KISAN
    API->>DB: Create scheme application record
    OFC->>API: GET scheme applications
    API-->>OFC: List of pending applications
    OFC->>API: PATCH application { status: "Approved" }
    API->>PUSH: Send approval notification
    PUSH-->>F: "✅ Your PM-KISAN application has been approved!"
    end

    rect rgb(254, 242, 242)
    Note over F,PUSH: PHASE 5 — GRIEVANCE (if needed)
    F->>API: POST /grievances { category, subject, description }
    API->>DB: Create grievance GRV-XXXX
    OFC->>API: GET /grievances
    API-->>OFC: Open grievance list
    OFC->>API: PATCH /grievances/:id { status: "Resolved", adminReply: "..." }
    API->>DB: Update grievance record
    API->>PUSH: Trigger resolution notification
    PUSH-->>F: "📣 Your grievance GRV-0042 has been resolved."
    end
```

---

## Two Entry Paths — Mobile vs In-Person at Office

```mermaid
flowchart TD
    Start([Farmer needs to register]) --> Q{How does farmer register?}

    Q -->|Has smartphone\nand uploads documents himself| MobilePath
    Q -->|Visits office\nwith physical documents| AdminPath

    subgraph MobilePath["📱 Self-Service via Mobile App"]
        M1[Download Krushi Suvidha app]
        M2[OTP login with phone number]
        M3[Take photos of documents with phone camera]
        M4[OCR auto-extracts data]
        M5[Review extracted info on phone]
        M6[Submit — profile created automatically]
    end

    subgraph AdminPath["🏛️ Assisted via Admin Panel"]
        A1[Officer opens New Registration module]
        A2[Officer scans/uploads farmer's documents]
        A3[OCR auto-extracts data in DocReviewPanel]
        A4[Officer reviews and corrects fields if needed]
        A5[Officer enters farmer's phone number]
        A6[Profile auto-saved to MongoDB]
    end

    MobilePath --> Join[Profile appears in Admin Panel\nFarmer Registry — Status: Pending]
    AdminPath --> Join

    Join --> Review[Officer reviews and verifies profile]
    Review --> Verified[Status → Verified]
    Verified --> Notify[Farmer notified via push / SMS]
    Notify --> Schemes[Farmer can now browse eligible schemes]
```

---

## Data Synchronisation Points

```mermaid
flowchart LR
    subgraph FarmerActions["Farmer Actions (Mobile)"]
        FA1[Upload document]
        FA2[Apply for scheme]
        FA3[File grievance]
        FA4[View notifications]
    end

    subgraph Sync["⚡ Real-time Sync via API"]
        S1[POST /extract → MongoDB farmers.ocr]
        S2[POST scheme application → MongoDB]
        S3[POST /grievances → MongoDB]
        S4[GET /notifications → MongoDB]
    end

    subgraph AdminView["Officer Sees Instantly (Admin Panel)"]
        AV1[New farmer profile in Farmer Registry]
        AV2[New application in Scheme Applications]
        AV3[New ticket in Grievance Management]
        AV4[Notification badge count updates]
    end

    FA1 --> S1 --> AV1
    FA2 --> S2 --> AV2
    FA3 --> S3 --> AV3
    FA4 --> S4 --> AV4

    style FarmerActions fill:#f0fdf4,stroke:#16a34a
    style Sync fill:#fef9c3,stroke:#ca8a04
    style AdminView fill:#eff6ff,stroke:#3b82f6
```

---

## Status Mirrors — Both Sides See the Same Data

```mermaid
flowchart TD
    DB[(MongoDB Atlas\nfarmer profile)]

    DB -->|Farmer reads| MApp[Mobile App\nshows current status badge]
    DB -->|Admin reads| APanel[Admin Panel\nshows status in Farmer Registry table]

    OFC[Officer changes status] -->|PATCH /farmers/:id| DB
    DB --> MApp
    DB --> APanel
    DB --> PUSH[Push notification\nsent to farmer]

    style DB fill:#fdf4ff,stroke:#9333ea
    style PUSH fill:#f0fdf4,stroke:#16a34a
```

---

## Notification Flow — Both Directions

```mermaid
flowchart TD
    A[Admin action triggers notification] --> B{Notification type}

    B --> B1[Profile status change\nVerified / Rejected]
    B --> B2[Scheme application update\nApproved / Rejected / Disbursed]
    B --> B3[Grievance update\nIn Progress / Resolved / Closed]
    B --> B4[New scheme announced]

    B1 & B2 & B3 & B4 --> C[POST /notifications\nInsert into notifications collection]
    C --> D[Expo Push Notification API]
    D --> E[📱 Farmer receives push notification]
    E --> F[Farmer taps notification]
    F --> G{Deep link destination}
    G --> G1[Profile status → Profile Screen]
    G --> G2[Scheme update → Scheme Detail Screen]
    G --> G3[Grievance update → Grievance Detail Screen]

    style E fill:#f0fdf4,stroke:#16a34a
```

---

## Side-by-Side Feature Mapping

| Feature | Mobile App | Admin Panel |
|---|---|---|
| **Authentication** | OTP (SMS) → JWT | Email + Password → localStorage session |
| **Registration** | Self-service with camera | Assisted with scanner/upload |
| **Document Upload** | Camera / gallery / file picker | File picker / scanner |
| **OCR Review** | View extracted fields on phone | Review in DocReviewPanel with language switching |
| **Verification** | View status, can't change it | Can verify/reject — full control |
| **Scheme Browse** | Filter by eligibility | View all + manage status |
| **Scheme Apply** | Apply button in app | Submit on behalf of farmer |
| **Grievance File** | Fill form in app | Create manually for farmer |
| **Grievance Resolve** | Read-only — see reply | Full edit — status + adminReply |
| **Language Support** | Marathi / Hindi / English | Marathi / Hindi / English |
| **Push Notifications** | Receive notifications | Send / manage notification system |
| **Analytics** | Personal stats only | District-wide analytics + charts |

---

## Error Handling — Both Sides

```mermaid
flowchart TD
    subgraph MobileErrors["📱 Mobile App Error Handling"]
        ME1[Network error\nShow retry button]
        ME2[OTP expired\nResend OTP option]
        ME3[OCR failed\nRetake photo prompt]
        ME4[Upload too large\nCompress and retry]
        ME5[Session expired\nRedirect to OTP login]
    end

    subgraph AdminErrors["🏛️ Admin Panel Error Handling"]
        AE1[API unreachable\nToast: 'Server unavailable']
        AE2[Upload failed\nRed error state on doc card]
        AE3[Session expired\nRedirect to login page]
        AE4[Permission denied\nModule hidden from sidebar]
        AE5[Invalid credentials\nInline error below form]
    end

    subgraph APIErrors["⚙️ API Server Error Handling"]
        PE1[Missing DATALAB_API_KEY\n500 + error message]
        PE2[MongoDB connection fail\n500 on startup]
        PE3[OCR pipeline timeout\nPoll returns error status]
        PE4[OTP not found / expired\n400 with reason]
        PE5[Farmer not found\n404 response]
    end
```
