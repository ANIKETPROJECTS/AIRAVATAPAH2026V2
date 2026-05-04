# Krushi Suvidha AI — Frontend Architecture

## Overview

The Admin Panel frontend is a **React 18 + Vite** single-page application (SPA). It uses **Tailwind CSS v3** for styling, **shadcn/ui** for pre-built components, **TanStack Query** for server state, **React Router DOM** for routing, and the **Context API** for global client state.

The Mobile App frontend is an **Expo / React Native** app sharing the same API contract and design language as the admin panel.

---

## Admin Panel — File & Folder Structure

```mermaid
flowchart TD
    Root[artifacts/agri-admin/src/] --> A[main.tsx\nApp entry point]
    Root --> B[App.tsx\nRouter + Providers setup]
    Root --> C[pages/]
    Root --> D[components/]
    Root --> E[contexts/]
    Root --> F[data/]
    Root --> G[i18n/]
    Root --> H[hooks/]
    Root --> I[lib/]

    C --> C1[Index.tsx\nMain SPA shell — module switcher]
    C --> C2[LoginPage.tsx\nAuth gate]
    C --> C3[NotFound.tsx\n404 page]

    D --> D1[layout/\nSidebar.tsx · Header.tsx]
    D --> D2[modules/\nAll feature modules]
    D --> D3[ui/\nshadcn/ui component library]
    D --> D4[AIAssistant.tsx\nFloating chat widget]

    D2 --> D2a[Dashboard.tsx]
    D2 --> D2b[NewRegistration.tsx]
    D2 --> D2c[FarmerRegistry.tsx]
    D2 --> D2d[VerifiedFarmerCard.tsx]
    D2 --> D2e[SchemeApplications.tsx]
    D2 --> D2f[AllSchemes.tsx]
    D2 --> D2g[SubsidyManagement.tsx]
    D2 --> D2h[InsuranceClaims.tsx]
    D2 --> D2i[GrievanceManagement.tsx]
    D2 --> D2j[ReportsAnalytics.tsx]
    D2 --> D2k[SettingsWorkflow.tsx]
    D2 --> D2l[UserManagement.tsx]
    D2 --> D2m[MyProfile.tsx]
    D2 --> D2n[FarmerAppPreview.tsx]

    E --> E1[AuthContext.tsx]
    E --> E2[LanguageContext.tsx]
    E --> E3[NotificationContext.tsx]

    F --> F1[farmerApi.ts\nAPI client functions]
    F --> F2[dummyData.ts\nStatic/mock data]

    G --> G1[translations.ts\nen/hi/mr strings]

    style Root fill:#f0fdf4,stroke:#16a34a
```

---

## Component Hierarchy — Runtime Tree

```mermaid
flowchart TD
    A[main.tsx\nReactDOM.createRoot] --> B[App.tsx]

    B --> P1[QueryClientProvider\nTanStack Query]
    P1 --> P2[TooltipProvider]
    P2 --> P3[Toaster\nToast notifications]
    P3 --> P4[Sonner\nSonner toasts]
    P4 --> P5[BrowserRouter]
    P5 --> P6[AuthProvider]
    P6 --> P7[LanguageProvider]
    P7 --> P8[NotificationProvider]
    P8 --> P9[AppRoutes]

    P9 --> Q{Is user logged in?}
    Q -->|No| LG[LoginPage.tsx]
    Q -->|Yes| RT[Routes]

    RT --> R1[/ → Index.tsx]
    RT --> R2[* → NotFound.tsx]

    R1 --> L[Layout Shell]
    L --> L1[Sidebar.tsx\nFixed left nav]
    L --> L2[Header.tsx\nTop bar]
    L --> L3[Main Content Area]
    L --> L4[AIAssistant.tsx\nFloating widget]

    L3 --> M{active module state}
    M --> M1[Dashboard]
    M --> M2[NewRegistration]
    M --> M3[FarmerRegistry]
    M --> M4[VerifiedFarmers]
    M --> M5[SchemeApplications]
    M --> M6[AllSchemes]
    M --> M7[SubsidyManagement]
    M --> M8[InsuranceClaims]
    M --> M9[GrievanceManagement]
    M --> M10[ReportsAnalytics]
    M --> M11[SettingsWorkflow]
    M --> M12[UserManagement]
    M --> M13[FarmerAppPreview]

    style A fill:#f0fdf4,stroke:#16a34a
```

---

## State Management Architecture

```mermaid
flowchart TD
    subgraph GlobalState["🌐 Global State — React Context"]
        AC[AuthContext\nCurrentUser · Users · Permissions\nlogin() · logout() · can()]
        LC[LanguageContext\nlang: en / hi / mr\nsetLang()]
        NC[NotificationContext\nnotifications[] · unreadCount\nmarkRead() · clearAll()]
    end

    subgraph ServerState["☁️ Server State — TanStack Query"]
        QC[QueryClient\nconfigured in App.tsx]
        Q1[useQuery\nGET /api/farmers]
        Q2[useQuery\nGET /api/schemes]
        Q3[useQuery\nGET /api/grievances]
        Q4[useMutation\nPATCH /api/farmers/:id]
        Q5[useMutation\nPOST /api/extract]
    end

    subgraph LocalState["📦 Local State — useState / useReducer"]
        LS1[active module\nin Index.tsx]
        LS2[form fields\nin NewRegistration.tsx]
        LS3[selected farmer\nin FarmerRegistry.tsx]
        LS4[chat messages\nin AIAssistant.tsx]
        LS5[collapsed sidebar\nin Sidebar.tsx]
        LS6[search/filter terms\nin list modules]
    end

    subgraph Persistence["💾 Persistence — localStorage"]
        PS1[agri_users_v1\nAll user records]
        PS2[agri_session_v1\nCurrent session userId]
    end

    AC <--> PS1
    AC <--> PS2
    QC --> Q1 & Q2 & Q3 & Q4 & Q5

    style GlobalState fill:#f0fdf4,stroke:#16a34a
    style ServerState fill:#eff6ff,stroke:#3b82f6
    style LocalState fill:#fef9c3,stroke:#ca8a04
    style Persistence fill:#fdf4ff,stroke:#9333ea
```

---

## AuthContext — Detailed Internal Flow

```mermaid
flowchart TD
    A[App starts] --> B[AuthProvider mounts]
    B --> C[loadUsers() from localStorage\nagri_users_v1]
    C --> D{Users found in localStorage?}
    D -->|Yes| E[Use stored users]
    D -->|No| F[Use SEED_USERS\n3 demo accounts]

    E & F --> G[loadSession() from localStorage\nagri_session_v1]
    G --> H{Session ID found?}
    H -->|Yes| I[Restore session — currentUser from users list]
    H -->|No| J[currentUser = null → Show LoginPage]

    I & J --> K[AuthProvider renders children]

    K --> L{Login action}
    L -->|login email + password| M[Find user by email]
    M --> N{User found?}
    N -->|No| O[Return error: 'No account found']
    N -->|Yes| P{Account active?}
    P -->|No| Q[Return error: 'Account deactivated']
    P -->|Yes| R{Password hash matches?}
    R -->|No| S[Return error: 'Incorrect password']
    R -->|Yes| T[Update lastLogin\nSave session\nSet currentUser]

    T --> U[Sidebar renders with role-filtered items]
    U --> V[can section checks permissions object]

    style A fill:#f0fdf4,stroke:#16a34a
    style T fill:#dcfce7,stroke:#16a34a
    style O & Q & S fill:#fef2f2,stroke:#dc2626
```

---

## New Registration Module — Component Architecture

```mermaid
flowchart TD
    A[NewRegistration.tsx\nParent component] --> B[State: lang, phone, perDocState]
    A --> C[LangSelector\nEN / HI / MR toggle]
    A --> D[Phone number input\noptional — for auto-save]

    A --> E[5 × DocUploadCard]
    E --> E1[DocUploadCard — Aadhaar]
    E --> E2[DocUploadCard — Passbook]
    E --> E3[DocUploadCard — Form 7]
    E --> E4[DocUploadCard — Form 12]
    E --> E5[DocUploadCard — Form 8A]

    E1 & E2 & E3 & E4 & E5 --> F[File input / drag-drop zone]
    F --> G[POST /api/extract]
    G --> H[Poll GET /api/extract/:requestId]
    H --> I[DocReviewPanel\nshow extracted fields]
    I --> J[FarmerProfileCard\nmerged profile sidebar]

    I --> K{Field display by lang}
    K --> K1[FIELD_LABEL_MAP — extracted doc fields]
    K --> K2[SECTION_TITLE_MAP — subsection headers]
    K --> K3[PROFILE_FIELD_LABEL_MAP — profile fields]
    K --> K4[PROFILE_SECTION_DOC_LABELS — card titles]
    K --> K5[UI_T — static strings]

    style A fill:#f0fdf4,stroke:#16a34a
```

---

## Translation System Architecture

```mermaid
flowchart TD
    A[i18n/translations.ts] --> B[Translation dictionaries]

    B --> B1[FIELD_LABEL_MAP\nExtracted document field labels\nKey → en/hi/mr string]
    B --> B2[SECTION_TITLE_MAP\nSubsection heading labels]
    B --> B3[PROFILE_FIELD_LABEL_MAP\nFarmerProfileCard field labels]
    B --> B4[PROFILE_SECTION_DOC_LABELS\nSection card titles in profile]
    B --> B5[UI_T\nStatic UI strings:\nbutton text · placeholders · headings]

    A --> C[Helper functions]
    C --> C1[ui key lang\nReturns UI_T string for language]
    C --> C2[tSec key lang\nReturns section title]
    C --> C3[tField key lang\nReturns extracted field label]
    C --> C4[tProfileField key lang\nReturns profile field label]

    D[LangSelector Component] -->|User selects language| E[lang state in NewRegistration]
    E -->|prop drilling| F[DocReviewPanel props]
    E -->|prop drilling| G[FarmerProfileCard props]
    F & G --> H[Call helper functions with lang]
    H --> I[Render translated strings\nNo mixed-language strings in render code]

    style A fill:#f0fdf4,stroke:#16a34a
```

---

## API Client — farmerApi.ts

```mermaid
flowchart TD
    A[data/farmerApi.ts] --> B[Type definitions]
    B --> B1[FarmerRecord\nFull farmer profile type]
    B --> B2[LandParcelRecord\nPer-parcel land data]
    B --> B3[DocRecord\nDocument upload metadata]

    A --> C[API fetch functions]
    C --> C1[fetchFarmers\nGET /api/farmers]
    C --> C2[fetchFarmer id\nGET /api/farmers/:id]
    C --> C3[createFarmer data\nPOST /api/farmers]
    C --> C4[updateFarmer id patch\nPATCH /api/farmers/:id]
    C --> C5[deleteFarmer id\nDELETE /api/farmers/:id]

    C1 & C2 & C3 & C4 & C5 --> D[TanStack Query hooks\nuseQuery / useMutation]
    D --> E[Components receive\nloading · error · data states]

    style A fill:#f0fdf4,stroke:#16a34a
```

---

## Vite Build & Dev Configuration

```mermaid
flowchart LR
    A[vite.config.ts] --> B[Server config\nhost: 0.0.0.0\nport: 5000]
    A --> C[Proxy config\n/api → http://localhost:8000\nrewriteBasePath: true]
    A --> D[Plugins\n@vitejs/plugin-react\nfor React Fast Refresh]
    A --> E[Aliases\n@ → src/]
    A --> F[Build output\ndist/ folder\nchunk splitting]

    B --> G[Dev server accessible\nvia Replit proxy on port 8080]
    C --> H[Frontend API calls proxied\nto Express API server]

    style A fill:#f0fdf4,stroke:#16a34a
```

---

## Tailwind & shadcn/ui Component System

```mermaid
flowchart TD
    A[tailwind.config.ts] --> B[Content paths\nall .tsx .ts files]
    A --> C[Theme extensions\nCustom green palette\nDM Sans + DM Serif Display fonts]
    A --> D[Plugins\ntailwindcss-animate]

    E[components/ui/] --> F[shadcn/ui components]
    F --> F1[button.tsx]
    F --> F2[card.tsx]
    F --> F3[dialog.tsx]
    F --> F4[input.tsx]
    F --> F5[table.tsx]
    F --> F6[badge.tsx]
    F --> F7[toast.tsx]
    F --> F8[select.tsx]
    F --> F9[tabs.tsx]
    F --> F10[sheet.tsx — side panels]
    F --> F11[avatar.tsx]
    F --> F12[progress.tsx]

    G[lib/utils.ts] --> H[cn utility\nclsx + tailwind-merge\nfor conditional class names]

    style A fill:#f0fdf4,stroke:#16a34a
    style E fill:#eff6ff,stroke:#3b82f6
```

---

## Port Routing Architecture (Dev Environment)

```mermaid
flowchart LR
    Browser([Browser / Replit Webview]) -->|HTTPS external URL| Proxy8080[scripts/redirect-8080.mjs\nTransparent proxy\nPort 8080 + 18593]
    Proxy8080 -->|HTTP forward| Vite[Vite Dev Server\nPort 5000]
    Vite -->|/api/* proxy| Express[Express API Server\nPort 8000]
    Express -->|Query| MongoDB[(MongoDB Atlas)]
    Express -->|OCR| Datalab[Datalab AI]

    style Browser fill:#f0fdf4,stroke:#16a34a
    style MongoDB fill:#fdf4ff,stroke:#9333ea
    style Datalab fill:#fef9c3,stroke:#ca8a04
```

---

## Key Design Patterns Used

| Pattern | Where Used | Purpose |
|---|---|---|
| **Provider pattern** | AuthContext, LanguageContext, NotificationContext | Global state without prop drilling |
| **Module switching** | Index.tsx active state | SPA without full page reloads |
| **Polling** | /extract/:requestId | Wait for async OCR result |
| **Optimistic UI** | Status badge updates | Instant feedback before API confirms |
| **Role-based rendering** | Sidebar, module access | Hide features based on permissions |
| **Compound components** | shadcn/ui Card, Tabs | Flexible, composable UI blocks |
| **Local storage sync** | AuthProvider useEffect | Persist users and session across refreshes |
| **Proxy forwarding** | vite.config.ts + redirect-8080.mjs | Single domain for frontend + API |
