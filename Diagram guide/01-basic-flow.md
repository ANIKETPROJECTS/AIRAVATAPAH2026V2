# Krushi Suvidha AI — Basic System Flow

## Overview

Krushi Suvidha AI is a two-sided platform:
- **Mobile App** — Used by farmers to register, upload documents, apply for schemes, and file grievances.
- **Admin Panel** — Used by government district/taluka officers to verify farmer registrations, review documents, approve scheme applications, and resolve grievances.

Both sides communicate through a shared **REST API** backed by **MongoDB Atlas**.

---

## High-Level System Flow

```mermaid
flowchart TD
    A([Farmer / Citizen]) -->|Opens Mobile App| B[Farmer Mobile App]
    C([District / Taluka Officer]) -->|Opens Browser| D[Krushi Suvidha Admin Panel]

    B -->|OTP Login via Phone| E[API Server\nNode.js + Express]
    D -->|Email + Password Login\nLocalStorage Session| E

    E -->|Read / Write| F[(MongoDB Atlas\napnaapp DB)]
    E -->|Document OCR| G[Datalab AI\nExtract + Marker Pipelines]

    G -->|Structured Fields + Tables| E
    E -->|Auto-save to Farmer Profile| F

    F -->|Farmer Profiles\nSchemes\nGrievances\nNotifications| E

    E -->|Push Notification\nvia Expo| B
    E -->|Real-time Status Updates| D
```

---

## Step-by-Step Basic Flow

```mermaid
sequenceDiagram
    participant Farmer as 🌾 Farmer (Mobile App)
    participant API as ⚙️ API Server
    participant OCR as 🤖 Datalab OCR
    participant DB as 🗄️ MongoDB
    participant Admin as 🏛️ Admin Officer (Web)

    Note over Farmer,Admin: STEP 1 — Farmer Registration
    Farmer->>API: POST /auth/send-otp (phone number)
    API->>Farmer: 6-digit OTP via SMS
    Farmer->>API: POST /auth/verify-otp
    API->>Farmer: JWT Token + registration status

    Note over Farmer,Admin: STEP 2 — Document Upload
    Farmer->>API: POST /extract (file + document_type)
    API->>OCR: Submit to Extract + Marker pipelines
    OCR-->>API: Structured fields + tables
    API->>DB: Auto-save to farmer profile (ocr sub-document)
    API-->>Farmer: requestId for polling

    Note over Farmer,Admin: STEP 3 — Admin Review
    Admin->>API: GET /farmers (list all profiles)
    API-->>Admin: Farmer list with OCR data
    Admin->>Admin: Review documents, verify fields
    Admin->>API: PATCH /farmers/:id (status = Verified)
    API->>DB: Update farmer status

    Note over Farmer,Admin: STEP 4 — Farmer Notified
    API->>Farmer: Push Notification (Verified!)
    Farmer->>API: GET /schemes (eligible schemes)
    API-->>Farmer: List of applicable schemes

    Note over Farmer,Admin: STEP 5 — Scheme Application
    Farmer->>API: POST scheme application
    Admin->>API: Review + Approve / Reject application

    Note over Farmer,Admin: STEP 6 — Grievance (if needed)
    Farmer->>API: POST /grievances
    Admin->>API: PATCH /grievances/:id (reply + status update)
    API->>Farmer: Push Notification (Grievance resolved)
```

---

## Status Lifecycle — Farmer Profile

```mermaid
stateDiagram-v2
    [*] --> Pending : Farmer registers via app\nor officer creates manually
    Pending --> Under_Review : Officer opens profile\nand starts review
    Under_Review --> Verified : Officer approves all documents
    Under_Review --> Rejected : Documents invalid / incomplete
    Rejected --> Pending : Farmer re-uploads documents
    Verified --> [*] : Farmer is eligible for schemes
```

---

## Document Types Supported

| Document | Purpose |
|---|---|
| **Aadhaar Card** | Identity verification — name, DOB, address, UID |
| **Bank Passbook** | Financial — bank name, IFSC, account number, DBT linkage |
| **Form 7 (Satbara)** | Land ownership — survey number, area, owner name |
| **Form 12 (Hakkpatra)** | Land rights and mutation history |
| **Form 8A (Khate Utara)** | Crop inspection, irrigation, farming type |

---

## Key Actors

| Actor | Platform | Access Level |
|---|---|---|
| **Farmer** | Mobile App (Expo/React Native) | Own profile, own documents, own schemes, own grievances |
| **Taluka Officer** | Admin Web Panel | Dashboard, Registration, Farmer Registry, Grievances |
| **District Officer** | Admin Web Panel | All above + Scheme Applications, Subsidies, Insurance, Reports |
| **Admin (DAO)** | Admin Web Panel | Full access including User Management, Settings |
| **Viewer** | Admin Web Panel | Dashboard + Reports (read-only) |
