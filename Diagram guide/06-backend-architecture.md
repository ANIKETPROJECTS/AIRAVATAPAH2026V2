# Krushi Suvidha AI — Backend Architecture

## Overview

The backend is a **Node.js + Express 5** REST API server. It handles all data operations, document OCR orchestration, authentication, push notifications, and scheme management. It runs on **port 8000** and connects to **MongoDB Atlas** as its primary data store.

---

## Server Structure — File Layout

```mermaid
flowchart TD
    Root[artifacts/api-server/src/] --> A[index.ts\nServer bootstrap\nPort binding + signal handling]
    Root --> B[app.ts\nExpress app setup\nMiddleware + route mounting]
    Root --> C[routes/]
    Root --> D[lib/]
    Root --> E[build.mjs\nesbuild bundler config]
    Root --> F[dist/\nCompiled output\nindex.mjs + worker files]

    C --> C1[auth.ts\nOTP + JWT + push token]
    C --> C2[extract.ts\nOCR fan-out + polling + persist]
    C --> C3[farmers.ts\nCRUD for farmer profiles]
    C --> C4[schemes.ts\nScheme catalog management]
    C --> C5[grievances.ts\nGrievance filing + resolution]
    C --> C6[notifications.ts\nIn-app + push notifications]
    C --> C7[transliterate.ts\nGoogle Input Tools proxy]

    D --> D1[mongo.ts\nMongoDB client + connection]
    D --> D2[profiles.ts\nUserProfile type + merge logic]
    D --> D3[document-types.ts\nSchema definitions per doc type]
    D --> D4[seed-schemes.ts\n18 pre-seeded government schemes]

    style Root fill:#fef9c3,stroke:#ca8a04
```

---

## Express App — Middleware Stack

```mermaid
flowchart TD
    A[Incoming HTTP Request] --> B[cors\nAllow all origins in dev]
    B --> C[express.json\nParse JSON body]
    C --> D[cookie-parser\nParse cookies]
    D --> E[pino-http\nRequest/response logging\nStructured JSON logs]
    E --> F[Route handlers]
    F --> G{Route matched?}
    G -->|Yes| H[Execute handler]
    G -->|No| I[404 handler\n{ error: 'Not found' }]
    H --> J{Handler threw?}
    J -->|Yes| K[Global error handler\n{ error: message }\nLog stack trace]
    J -->|No| L[Send response]

    style A fill:#fef9c3,stroke:#ca8a04
    style L fill:#dcfce7,stroke:#16a34a
    style K fill:#fef2f2,stroke:#dc2626
```

---

## MongoDB Collections & Schema

```mermaid
erDiagram
    FARMERS {
        ObjectId _id PK
        string farmerId "KS-2024-XXXX"
        string mobile "primary identifier"
        string name
        string status "Pending/Verified/Rejected"
        string source "mobile_app or admin_panel"
        string village
        string district
        string taluka
        number addedAt "Unix timestamp"
        object ocr "OCR sub-documents"
        array docs "document upload records"
    }

    OCR_SUBDOC {
        object aadhar "Aadhaar fields"
        object passbook "Bank passbook fields"
        object form7 "Satbara land record"
        object form12 "Hakkpatra"
        object form8a "Khate Utara crop data"
    }

    SCHEMES {
        ObjectId _id PK
        string schemeId
        string name
        string type "CENTRAL or STATE"
        string status "Active or Closed"
        object eligibility "eligibility rules"
        array documents "required docs list"
        object validationRules
        object approvalRules
    }

    GRIEVANCES {
        ObjectId _id PK
        string grievanceId "GRV-XXXX"
        string mobile
        string farmerId
        string category "Document/Payment/Scheme/Technical"
        string subject
        string description
        string status "Open/In Progress/Resolved/Closed"
        string priority "Low/Medium/High"
        string adminReply
        number filedAt
        number resolvedAt
    }

    NOTIFICATIONS {
        ObjectId _id PK
        string notificationId
        string title
        string body
        boolean read
        string targetMobile
        string type "push or in_app"
        number createdAt
    }

    OTP_SESSIONS {
        ObjectId _id PK
        string mobile
        string otp "6-digit code"
        number expiresAt "Unix timestamp"
        boolean verified
    }

    FARMERS ||--|| OCR_SUBDOC : "has"
    FARMERS ||--o{ GRIEVANCES : "files"
    FARMERS ||--o{ NOTIFICATIONS : "receives"
```

---

## OCR Extraction Pipeline — Detailed

```mermaid
flowchart TD
    A[POST /api/extract\nMultipart upload: file + document_type + mode + profile_phone] --> B[multer middleware\nBuffer file in memory]
    B --> C[Validate document_type\nagainst SUPPORTED_TYPES]
    C --> D[Generate requestId UUID]

    D --> E[Fan out in parallel]
    E --> F[Datalab Extract API\nPOST /v1/extract\nStructured field extraction\nBased on doc schema from document-types.ts]
    E --> G[Datalab Marker API\nPOST /v1/marker\nHigh-fidelity HTML + Markdown\nCaptures tables + portraits + signatures]

    F --> H[Store Extract requestId\nin memory Map]
    G --> I[Store Marker requestId\nin memory Map]

    H & I --> J[Return { requestId } to client\nClient begins polling]

    J --> K[GET /api/extract/:requestId\nclient polls every 2s]
    K --> L{Both pipelines done?}
    L -->|No| M[Return { status: 'processing' }]
    M --> K
    L -->|Yes| N[Parse Extract JSON → structured_fields]
    N --> O[Parse Marker JSON → raw_tables + text_blocks]
    O --> P{profile_phone provided?}
    P -->|Yes| Q[persistToProfile\nMap fields to ProfileSection\nMerge into farmers collection]
    P -->|No| R[Return data without persisting]
    Q --> S[Return { status: 'complete',\nstructured_fields,\nraw_tables,\ntext_blocks }]
    R --> S

    style A fill:#fef9c3,stroke:#ca8a04
    style S fill:#dcfce7,stroke:#16a34a
    style F fill:#eff6ff,stroke:#3b82f6
    style G fill:#eff6ff,stroke:#3b82f6
```

---

## OCR Field Mapping — Document Type to Profile Section

```mermaid
flowchart LR
    A[Uploaded Document] --> B{document_type}

    B --> C[aadhaar] --> C1[farmers.ocr.aadhar\nfields: name · dob · gender\naddress · uid_number · photo_url]
    B --> D[passbook] --> D1[farmers.ocr.passbook\nfields: bank_name · branch · ifsc\naccount_no · account_type\naadhaar_linked · npci_status]
    B --> E[form7] --> E1[farmers.ocr.form7\nfields: survey_no · village · district\ntaluka · owner_name · total_area\nirrigated_area · ownership_type\nsoil_type · crops · farming_type]
    B --> F[form12] --> F1[farmers.ocr.form12\nfields: mutation_entries\nrights_holders · land_area\nmutation_date]
    B --> G[form8a] --> G1[farmers.ocr.form8a\nfields: crop_inspection_table\nirrigation_sources\nfarm_input_usage]

    style A fill:#fef9c3,stroke:#ca8a04
```

---

## Auth Routes — OTP Flow

```mermaid
flowchart TD
    A[POST /auth/send-otp\n{ mobile }] --> B[Validate: 10-digit Indian mobile]
    B --> C[Generate 6-digit OTP\nMath.random]
    C --> D[Store in otp_sessions\n{ mobile, otp, expiresAt: now+5min, verified: false }]
    D --> E[Send OTP via SMS\nGateway integration]
    E --> F[Return { success: true }]

    G[POST /auth/verify-otp\n{ mobile, otp }] --> H[Lookup otp_sessions by mobile]
    H --> I{Record found?}
    I -->|No| J[400: OTP not found]
    I -->|Yes| K{Expired?}
    K -->|Yes| L[400: OTP expired]
    K -->|No| M{OTP matches?}
    M -->|No| N[400: Invalid OTP]
    M -->|Yes| O[Mark verified in DB]
    O --> P[Lookup farmers by mobile]
    P --> Q{Farmer exists?}
    Q -->|Yes| R[Return JWT + { isRegistered: true, farmerId }]
    Q -->|No| S[Return JWT + { isRegistered: false }]

    T[POST /auth/register-push-token\n{ mobile, expoPushToken }] --> U[Upsert push token\ninto notifications collection]
    U --> V[Return { success: true }]

    style F & R & S & V fill:#dcfce7,stroke:#16a34a
    style J & L & N fill:#fef2f2,stroke:#dc2626
```

---

## Farmers CRUD Routes

```mermaid
flowchart TD
    A[GET /farmers] --> B[MongoDB: farmers.find\nSort by addedAt desc]
    B --> C[Return array of farmer profiles]

    D[GET /farmers/:id] --> E[MongoDB: farmers.findOne\n{ farmerId: id }]
    E --> F{Found?}
    F -->|No| G[404: Farmer not found]
    F -->|Yes| H[Return full profile with OCR]

    I[POST /farmers\n{ name, mobile, village, district, ... }] --> J[Generate farmerId: KS-YYYY-XXXX]
    J --> K[MongoDB: farmers.insertOne]
    K --> L[Return { farmerId, ...profile }]

    M[PATCH /farmers/:id\n{ status, ...fields }] --> N[MongoDB: farmers.updateOne\n$set patch fields]
    N --> O{Modified?}
    O -->|No| P[404: Not found]
    O -->|Yes| Q{Status changed to Verified?}
    Q -->|Yes| R[Trigger push notification\n'Profile Verified!']
    Q -->|No| S[Return updated profile]
    R --> S

    T[DELETE /farmers/:id] --> U[MongoDB: farmers.deleteOne]
    U --> V[Return { deleted: true }]

    style C & H & L & S & V fill:#dcfce7,stroke:#16a34a
    style G & P fill:#fef2f2,stroke:#dc2626
```

---

## Schemes Routes & Seeding

```mermaid
flowchart TD
    A[Server startup\nindex.ts] --> B[Connect to MongoDB]
    B --> C[Check schemes collection count]
    C --> D{Count > 0?}
    D -->|Yes| E[Log: Schemes already seeded — skip]
    D -->|No| F[Insert 18 seed schemes\nfrom lib/seed-schemes.ts]
    F --> G[18 schemes seeded:\nPM-KISAN · PMFBY · KCC\nSHC · PKVY · PMAY-G\nMMS · NMSA · GKY\nDrip Irrigation + 8 more]

    H[GET /schemes] --> I[Optional query: type, search]
    I --> J[MongoDB: schemes.find with filter]
    J --> K[Return schemes array]

    L[GET /schemes/:id] --> M[MongoDB: schemes.findOne]
    M --> N[Return scheme with eligibility rules]

    O[PATCH /schemes/:id/status] --> P{current status?}
    P -->|Active| Q[Set to Closed]
    P -->|Closed| R[Set to Active]
    Q & R --> S[Return updated scheme]

    style E fill:#dcfce7,stroke:#16a34a
    style G fill:#dcfce7,stroke:#16a34a
```

---

## Grievances Routes

```mermaid
flowchart TD
    A[POST /grievances\n{ mobile, farmerId, category,\n  subject, description, priority }] --> B[Generate grievanceId\nGRV- padded 4-digit counter]
    B --> C[MongoDB: grievances.insertOne\n{ status: 'Open', filedAt: now }]
    C --> D[Return { grievanceId, ...grievance }]

    E[GET /grievances] --> F[Optional filters: mobile, farmerId, status]
    F --> G[MongoDB: grievances.find with filter\nSort by filedAt desc]
    G --> H[Return grievances array]

    I[PATCH /grievances/:id\n{ status, adminReply }] --> J[MongoDB: grievances.updateOne\n$set status + adminReply\nIf Resolved: set resolvedAt]
    J --> K{Status changed to Resolved?}
    K -->|Yes| L[Trigger push notification\n'Grievance resolved']
    K -->|No| M[Return updated grievance]
    L --> M

    style D & H & M fill:#dcfce7,stroke:#16a34a
```

---

## Build System — esbuild Configuration

```mermaid
flowchart TD
    A[build.mjs\nesbuild config] --> B[Entry: src/index.ts]
    B --> C[Bundle: true\nAll deps included]
    C --> D[Platform: node]
    D --> E[Format: ESM\noutput: dist/index.mjs]
    E --> F[Sourcemaps: linked\nfor --enable-source-maps]
    F --> G[External: []\nEverything bundled\nexcept native addons]

    G --> H[Worker files bundled separately]
    H --> H1[dist/pino-worker.mjs]
    H --> H2[dist/pino-file.mjs]
    H --> H3[dist/pino-pretty.mjs]
    H --> H4[dist/thread-stream-worker.mjs]

    I[pnpm run build] --> A
    I --> J[Output: dist/ folder\n3.4mb main bundle]
    J --> K[Startup command\nnode --enable-source-maps ./dist/index.mjs]

    style A fill:#fef9c3,stroke:#ca8a04
```

---

## Logging — Pino Structured Logger

```mermaid
flowchart LR
    A[pino logger\nattached to Express via pino-http] --> B[Log levels]
    B --> B1[INFO: Server start · DB connect · Seeding]
    B --> B2[ERROR: OCR fail · DB error · Missing secrets]
    B --> B3[DEBUG: Request details in dev]

    A --> C[Log fields]
    C --> C1[timestamp]
    C --> C2[level]
    C --> C3[msg]
    C --> C4[req.method · req.url]
    C --> C5[res.statusCode · responseTime]
    C --> C6[err.stack on errors]

    A --> D[Output: stdout\nJSON format in production\nPretty-print in development via pino-pretty]
```

---

## Environment Variables Required

| Variable | Type | Required | Purpose |
|---|---|---|---|
| `MONGODB_URI` | Secret | **Yes** | MongoDB Atlas connection string |
| `DATALAB_API_KEY` | Secret | **Yes** | Datalab OCR pipeline authentication |
| `MONGODB_DB` | Env var | Yes | Database name (default: `apnaapp`) |
| `PORT` | Env var | No | API server port (default: `8000`) |
| `NODE_ENV` | Env var | No | `development` or `production` |

---

## Error Handling Strategy

```mermaid
flowchart TD
    A[Request arrives] --> B{Validation passes?}
    B -->|No| C[400 Bad Request\n{ error: 'descriptive message' }]
    B -->|Yes| D{Resource exists?}
    D -->|No| E[404 Not Found\n{ error: 'X not found' }]
    D -->|Yes| F{External service available?}
    F -->|DATALAB_API_KEY missing| G[500\n{ error: 'Server is missing DATALAB_API_KEY' }]
    F -->|MongoDB down| H[500\n{ error: 'Database error' }]
    F -->|Yes| I[Process request]
    I --> J{Success?}
    J -->|Yes| K[200/201 with data]
    J -->|Unexpected error| L[500 + log full stack via pino]

    style C & E & G & H & L fill:#fef2f2,stroke:#dc2626
    style K fill:#dcfce7,stroke:#16a34a
```
