# Krushi Suvidha AI — Mobile App API Documentation

**Base URL (Production):** `https://krushisuvidhaai.airavatatechnologies.com/api`  
**Server:** VPS running Node.js (Express) via PM2, reverse-proxied through Nginx  
**Protocol:** HTTPS only in production  
**Content-Type:** `application/json` unless uploading files (then `multipart/form-data`)  
**CORS:** Enabled for all origins on the API server

---

## Table of Contents

1. [Server & Infrastructure Setup](#1-server--infrastructure-setup)
2. [Authentication APIs](#2-authentication-apis) *(new — to be added)*
3. [Document Upload & OCR Extraction APIs](#3-document-upload--ocr-extraction-apis) *(existing)*
4. [Farmer Registration & Profile APIs](#4-farmer-registration--profile-apis) *(existing + extensions)*
5. [Scheme APIs](#5-scheme-apis) *(existing)*
6. [Grievance APIs](#6-grievance-apis) *(new — to be added)*
7. [Notification APIs](#7-notification-apis) *(new — to be added)*
8. [Error Handling](#8-error-handling)
9. [Data Models Reference](#9-data-models-reference)

---

## 1. Server & Infrastructure Setup

### Nginx Configuration (reverse proxy)

```nginx
server {
    listen 80;
    server_name krushisuvidhaai.airavatatechnologies.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name krushisuvidhaai.airavatatechnologies.com;

    ssl_certificate /etc/letsencrypt/live/krushisuvidhaai.airavatatechnologies.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/krushisuvidhaai.airavatatechnologies.com/privkey.pem;

    # API — Node.js Express server on port 8000
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;        # OCR can take up to 2 min
        client_max_body_size 55M;       # allow up to 55 MB uploads
    }

    # Admin Web Dashboard — React/Vite on port 5000
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### PM2 Ecosystem (pm2.config.js)

```js
module.exports = {
  apps: [
    {
      name: "krushi-api",
      cwd: "./artifacts/api-server",
      script: "node",
      args: "--enable-source-maps ./dist/index.mjs",
      env: {
        PORT: 8000,
        NODE_ENV: "production",
        MONGODB_URI: "mongodb://localhost:27017/krushi",
        DATALAB_API_KEY: "<your_datalab_key>"
      }
    },
    {
      name: "krushi-admin",
      cwd: "./artifacts/agri-admin",
      script: "npx",
      args: "serve -s dist -l 5000",
      env: { NODE_ENV: "production" }
    }
  ]
};
```

---

## 2. Authentication APIs

> These endpoints **need to be added** to the API server for mobile app authentication. Farmers authenticate using their mobile number + OTP (no password). JWT tokens are used for session management.

### 2.1 Request OTP

```
POST /api/auth/otp/request
```

**Body:**
```json
{
  "mobile": "9876543210"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "OTP sent to 9876543210",
  "expires_in": 300
}
```

**Response 400:**
```json
{ "error": "Invalid mobile number" }
```

**Notes:**
- OTP is 6 digits, expires in 5 minutes
- Use an SMS gateway (MSG91, Twilio, or Fast2SMS) on the server side
- Rate limit: max 3 OTP requests per mobile per 10 minutes

---

### 2.2 Verify OTP & Login

```
POST /api/auth/otp/verify
```

**Body:**
```json
{
  "mobile": "9876543210",
  "otp": "482910"
}
```

**Response 200 — New Farmer (not yet registered):**
```json
{
  "success": true,
  "isNewFarmer": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer": null,
  "message": "OTP verified. Please complete registration."
}
```

**Response 200 — Existing Farmer:**
```json
{
  "success": true,
  "isNewFarmer": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer": {
    "farmerId": "F-042",
    "name": "Ramesh Patel",
    "mobile": "9876543210",
    "status": "Verified",
    "district": "Nashik",
    "village": "Ozhar"
  }
}
```

**Response 401:**
```json
{ "error": "Invalid or expired OTP" }
```

**Notes:**
- JWT payload: `{ farmerId, mobile, iat, exp }`
- Token expires in 30 days
- Include token in all subsequent requests: `Authorization: Bearer <token>`

---

### 2.3 Verify Token (check login status)

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "farmerId": "F-042",
  "mobile": "9876543210",
  "name": "Ramesh Patel",
  "status": "Verified",
  "district": "Nashik"
}
```

**Response 401:**
```json
{ "error": "Token expired or invalid" }
```

---

## 3. Document Upload & OCR Extraction APIs

> These endpoints **already exist** in the current API server. The mobile app uses them exactly as described below.

### 3.1 Get Supported Document Types

```
GET /api/document-types
```

**Response 200:**
```json
{
  "types": [
    { "id": "form7", "label": "Form 7 (Ownership Register)", "description": "Maharashtra 7/12 – Rights Register" },
    { "id": "form12", "label": "Form 12 (Crop Inspection Register)", "description": "Maharashtra 7/12 – Crop Inspection Register" },
    { "id": "form8a", "label": "Form 8A (Holding Register)", "description": "Maharashtra – Holding Register" },
    { "id": "aadhar", "label": "Aadhaar Card", "description": "UIDAI Aadhaar identity card" },
    { "id": "bank_passbook", "label": "Bank Passbook", "description": "Bank account passbook front page" }
  ]
}
```

---

### 3.2 Upload Document for OCR Extraction

```
POST /api/extract
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF or image (JPG/PNG/WEBP), max 50 MB |
| `document_type` | string | Yes | One of: `form7`, `form12`, `form8a`, `aadhar`, `bank_passbook` |
| `mode` | string | No | `fast`, `balanced`, or `accurate` (default: `accurate`) |
| `profile_phone` | string | No | Farmer's mobile number — auto-saves extracted data to profile |

**Response 200:**
```json
{
  "request_id": "a1b2c3d4e5f6...",
  "document_type": "form7",
  "document_label": "Form 7 (Ownership Register)",
  "mode": "accurate",
  "profile_phone": "9876543210",
  "pipelines": {
    "extract": { "status": "submitted" },
    "marker": { "status": "submitted" }
  }
}
```

> **Important:** Save the `request_id`. Poll the next endpoint every 3–5 seconds until `status` is `"complete"` or `"error"`.

---

### 3.3 Poll Extraction Result

```
GET /api/extract/:request_id
Authorization: Bearer <token>
```

**Response — Still Processing:**
```json
{
  "status": "processing",
  "document_type": "form7",
  "document_label": "Form 7 (Ownership Register)",
  "pipelines": {
    "extract": { "status": "processing" },
    "marker": { "status": "complete" }
  }
}
```

**Response — Complete (Form 7 example):**
```json
{
  "status": "complete",
  "document_type": "form7",
  "document_label": "Form 7 (Ownership Register)",
  "page_count": 1,
  "runtime": 12.4,
  "structured": {
    "sections": [
      {
        "title": "Header Details",
        "fields": [
          { "key": "village", "label": "Village (गाव)", "value": "Ozhar" },
          { "key": "taluka", "label": "Taluka (तालुका)", "value": "Niphad" },
          { "key": "district", "label": "District (जिल्हा)", "value": "Nashik" },
          { "key": "survey_number", "label": "Survey Number", "value": "142/A" }
        ],
        "tables": []
      },
      {
        "title": "Ownership Details",
        "fields": [
          { "key": "owner_name", "label": "Owner Name", "value": "Ramesh Patel" }
        ],
        "tables": []
      }
    ],
    "empty": false
  },
  "profile": {
    "phone": "9876543210",
    "section": "land",
    "saved": true,
    "error": null
  }
}
```

**Response — Aadhaar (includes photo):**
```json
{
  "status": "complete",
  "document_type": "aadhar",
  "structured": { "sections": [...], "empty": false },
  "aadhar_photo": {
    "base64": "/9j/4AAQSkZJRgAB...",
    "mimeType": "image/jpeg"
  },
  "profile": { "phone": "9876543210", "section": "identity", "saved": true, "error": null }
}
```

**Polling Strategy for Mobile App:**
```
Upload → get request_id → poll every 4 seconds → timeout after 3 minutes
```

---

## 4. Farmer Registration & Profile APIs

### 4.1 Submit New Farmer Registration

> Called after the farmer has uploaded all 5 documents and the OCR is done. Creates a new farmer record in the Farmer Registry with status `"Pending"`.

```
POST /api/farmers
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Ramesh Patel",
  "mobile": "9876543210",
  "aadhaar": "XXXX-XXXX-1234",
  "dob": "1985-06-15",
  "gender": "Male",
  "fatherName": "Suresh Patel",
  "category": "OBC",
  "village": "Ozhar",
  "taluka": "Niphad",
  "district": "Nashik",
  "surveyNumber": "142/A",
  "land": "2.20",
  "crop": "Grapes",
  "bankAccount": "SBI-XXXXXXXXXXXX",
  "bankName": "State Bank of India",
  "branchName": "Niphad Branch",
  "ifsc": "SBIN0012345",
  "accountNo": "XXXXXXXXXXXX",
  "accountType": "Savings",
  "status": "Pending",
  "source": "mobile",
  "docs": [
    { "name": "Form 7", "fileName": "form7.pdf", "size": "1.2 MB", "status": "uploaded" },
    { "name": "Form 12", "fileName": "form12.pdf", "size": "0.9 MB", "status": "uploaded" },
    { "name": "Form 8A", "fileName": "form8a.pdf", "size": "1.1 MB", "status": "uploaded" },
    { "name": "Aadhaar Card", "fileName": "aadhar.jpg", "size": "0.5 MB", "status": "uploaded" },
    { "name": "Bank Passbook", "fileName": "passbook.jpg", "size": "0.6 MB", "status": "uploaded" }
  ]
}
```

**Response 201:**
```json
{
  "farmerId": "F-043",
  "name": "Ramesh Patel",
  "status": "Pending",
  "mobile": "9876543210",
  "addedAt": "2026-05-03T07:30:00.000Z",
  "source": "mobile"
}
```

---

### 4.2 Get Farmer Profile by ID

```
GET /api/farmers/:farmerId
Authorization: Bearer <token>
```

> **Note:** The current API returns all farmers via `GET /api/farmers`. You need to add a single-farmer fetch endpoint. Until then, the app can fetch all and filter client-side, or the endpoint below can be added to the server.

**Response 200:**
```json
{
  "farmerId": "F-043",
  "name": "Ramesh Patel",
  "mobile": "9876543210",
  "status": "Verified",
  "village": "Ozhar",
  "district": "Nashik",
  "taluka": "Niphad",
  "land": "2.20",
  "crop": "Grapes",
  "aadhaar": "XXXX-XXXX-1234",
  "bankAccount": "SBI-XXXXXXXXXXXX",
  "category": "OBC",
  "addedAt": "2026-05-03T07:30:00.000Z",
  "docs": [...]
}
```

**Response 404:**
```json
{ "error": "Farmer not found" }
```

---

### 4.3 Get Farmer Status (Lightweight Poll)

> The mobile app polls this to detect when their status changes from `Pending` → `Verified` or `Cancelled`.

```
GET /api/farmers/:farmerId/status
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "farmerId": "F-043",
  "status": "Verified",
  "statusUpdatedAt": "2026-05-04T09:15:00.000Z",
  "message": "Your registration has been verified by the District Officer."
}
```

**Possible `status` values:**

| Status | Meaning for Farmer |
|--------|--------------------|
| `Pending` | Application received, under review |
| `Verified` | Approved — full access unlocked |
| `Active` | Previously verified, now active |
| `Cancelled` | Application rejected |
| `Inactive` | Account disabled |

---

### 4.4 Update Farmer Profile

```
PATCH /api/farmers/:farmerId
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (only include fields to update):**
```json
{
  "mobile": "9876543211",
  "crop": "Wheat",
  "bankAccount": "HDFC-XXXXXXXXXXXX"
}
```

**Response 200:** Returns the full updated farmer object.

---

## 5. Scheme APIs

> These endpoints **already exist**. The mobile app uses them to show the farmer which schemes they are eligible for.

### 5.1 Get All Active Schemes

```
GET /api/schemes
GET /api/schemes?type=CENTRAL
GET /api/schemes?type=STATE
GET /api/schemes?search=PM-KISAN
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `type` | `CENTRAL`, `STATE` | Filter by scheme type |
| `search` | string | Search by scheme name |

**Response 200:**
```json
[
  {
    "id": "pm-kisan",
    "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    "type": "CENTRAL",
    "category": "Income Support",
    "description": "Direct income support of ₹6,000/year...",
    "eligibility": {
      "summary": "Indian citizen with land ownership...",
      "parameters": [
        { "parameter": "Land Ownership", "rule": "Must own cultivable land", "validation": "Land records" }
      ],
      "familyCriteria": ["One benefit per farmer family"],
      "exclusions": ["Income tax payers", "Government employees"]
    },
    "documents": ["Aadhaar Card", "Land records / 7/12 extract", "Bank passbook"],
    "benefits": "₹6,000 per year in 3 installments of ₹2,000 via DBT",
    "status": "Active"
  }
]
```

---

### 5.2 Get Single Scheme Details

```
GET /api/schemes/:schemeId
Authorization: Bearer <token>
```

**Example:** `GET /api/schemes/pm-kisan`

**Response 200:** Full scheme object (same structure as above, single item).

**Response 404:**
```json
{ "error": "Scheme not found" }
```

---

### 5.3 Check Farmer Eligibility for Schemes

> This is computed **client-side** in the mobile app using the farmer's profile data and scheme eligibility rules. No separate API call needed. See the eligibility engine logic in Section 9.

---

## 6. Grievance APIs

> These endpoints **need to be added** to the API server.

### 6.1 Submit a Grievance

```
POST /api/grievances
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "farmerId": "F-043",
  "farmerName": "Ramesh Patel",
  "mobile": "9876543210",
  "district": "Nashik",
  "village": "Ozhar",
  "category": "Scheme",
  "subject": "PM-KISAN installment not received",
  "description": "I have been verified since April 2026 but the first installment of PM-KISAN has not been credited to my account. My Aadhaar and bank account are linked.",
  "schemeId": "pm-kisan",
  "schemeName": "PM-KISAN",
  "attachmentUrl": null
}
```

**Response 201:**
```json
{
  "grievanceId": "GR-2026-0041",
  "status": "Submitted",
  "submittedAt": "2026-05-03T08:00:00.000Z",
  "message": "Your grievance has been registered. Tracking ID: GR-2026-0041"
}
```

---

### 6.2 Get Farmer's Grievances

```
GET /api/grievances?farmerId=F-043
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "grievanceId": "GR-2026-0041",
    "category": "Scheme",
    "subject": "PM-KISAN installment not received",
    "status": "Under Review",
    "submittedAt": "2026-05-03T08:00:00.000Z",
    "resolvedAt": null,
    "response": null
  }
]
```

**Grievance Status Values:**

| Status | Meaning |
|--------|---------|
| `Submitted` | Received by the system |
| `Under Review` | Being reviewed by officer |
| `Resolved` | Issue resolved |
| `Closed` | Closed without action |

---

### 6.3 Get Single Grievance

```
GET /api/grievances/:grievanceId
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "grievanceId": "GR-2026-0041",
  "farmerId": "F-043",
  "category": "Scheme",
  "subject": "PM-KISAN installment not received",
  "description": "I have been verified...",
  "status": "Resolved",
  "submittedAt": "2026-05-03T08:00:00.000Z",
  "resolvedAt": "2026-05-05T14:30:00.000Z",
  "response": "Your payment has been initiated. Please allow 2-3 working days for credit.",
  "resolvedBy": "District Officer - Nashik"
}
```

---

## 7. Notification APIs

> These endpoints **need to be added** to the API server. Used to alert farmers about status changes, scheme eligibility, grievance updates.

### 7.1 Get Farmer Notifications

```
GET /api/notifications?farmerId=F-043
Authorization: Bearer <token>
```

**Response 200:**
```json
[
  {
    "notificationId": "N-001",
    "type": "status_change",
    "title": "Registration Verified!",
    "body": "Congratulations! Your farmer registration has been verified by the District Officer.",
    "isRead": false,
    "createdAt": "2026-05-04T09:15:00.000Z",
    "data": { "newStatus": "Verified" }
  },
  {
    "notificationId": "N-002",
    "type": "scheme_eligible",
    "title": "You are eligible for PM-KISAN",
    "body": "Based on your profile, you qualify for ₹6,000/year income support. Tap to learn more.",
    "isRead": true,
    "createdAt": "2026-05-04T09:16:00.000Z",
    "data": { "schemeId": "pm-kisan", "schemeName": "PM-KISAN" }
  },
  {
    "notificationId": "N-003",
    "type": "grievance_update",
    "title": "Grievance Update",
    "body": "Your grievance GR-2026-0041 has been resolved.",
    "isRead": false,
    "createdAt": "2026-05-05T14:30:00.000Z",
    "data": { "grievanceId": "GR-2026-0041" }
  }
]
```

**Notification Types:**

| Type | Trigger |
|------|---------|
| `status_change` | Officer changes farmer status (Verified / Cancelled) |
| `scheme_eligible` | Sent on verification, listing eligible schemes |
| `grievance_update` | Grievance status changes |
| `general` | Admin broadcasts |

---

### 7.2 Mark Notification as Read

```
PATCH /api/notifications/:notificationId/read
Authorization: Bearer <token>
```

**Response 200:**
```json
{ "success": true }
```

---

### 7.3 Register FCM Push Token

> Needed for push notifications (Firebase Cloud Messaging / Expo Push Notifications).

```
POST /api/notifications/register-token
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "farmerId": "F-043",
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "platform": "android"
}
```

**Response 200:**
```json
{ "success": true }
```

---

## 8. Error Handling

All errors follow this format:

```json
{ "error": "Human-readable error message" }
```

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created successfully |
| `400` | Bad request (missing or invalid fields) |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (access denied) |
| `404` | Resource not found |
| `429` | Too many requests (rate limited) |
| `500` | Internal server error |
| `502` | Upstream service error (OCR pipeline) |

**Mobile App Error Handling Strategy:**
- `401` → Clear local token → Redirect to Login screen
- `502` on OCR → Show retry button with message "Processing service unavailable, please retry"
- `429` on OTP → Show countdown timer
- Network errors → Show offline banner with retry

---

## 9. Data Models Reference

### FarmerRecord (MongoDB document)

```typescript
interface FarmerRecord {
  farmerId: string;          // "F-001", auto-assigned
  name: string;
  mobile?: string;
  aadhaar: string;           // masked: "XXXX-XXXX-1234"
  dob?: string;              // ISO date: "1985-06-15"
  gender?: string;           // "Male" | "Female" | "Other"
  fatherName?: string;
  category?: string;         // "SC" | "ST" | "OBC" | "NT" | "VJNT" | "General"
  religion?: string;
  diffAbled?: boolean;
  disabilityType?: string;
  village: string;
  taluka?: string;
  district: string;
  land: number | string;     // hectares, format "H.A.SM"
  surveyNumber: string;
  khateNumber?: string;
  crop: string;
  bankAccount: string;
  bankName?: string;
  branchName?: string;
  ifsc?: string;
  accountNo?: string;
  accountType?: string;
  aadhaarLinked?: string;
  npciStatus?: string;
  status: "Active" | "Inactive" | "Pending" | "Verified" | "Cancelled";
  source: "ocr" | "manual" | "seed" | "mobile";
  addedAt: string;           // ISO datetime
  docs?: DocRecord[];
  aiRiskScore?: number;      // 0–100
  landParcels?: LandParcelRecord[];
}

interface DocRecord {
  name: string;              // "Form 7"
  fileName: string;          // "form7.pdf"
  size: string;              // "1.2 MB"
  status: "uploaded" | "failed" | "none";
}
```

### Document Type IDs (for `POST /api/extract`)

| ID | Label | Required for Registration |
|----|-------|--------------------------|
| `form7` | Form 7 — Ownership Register (7/12) | Yes |
| `form12` | Form 12 — Crop Inspection Register | Yes |
| `form8a` | Form 8A — Holding Register | Yes |
| `aadhar` | Aadhaar Card | Yes |
| `bank_passbook` | Bank Passbook | Yes |

### Scheme Object

```typescript
interface Scheme {
  id: string;
  name: string;
  type: "CENTRAL" | "STATE";
  state: string | null;
  category: string;
  description: string;
  eligibility: {
    summary: string;
    parameters: { parameter: string; rule: string; validation: string }[];
    familyCriteria: string[];
    exclusions?: string[];
  };
  documents: string[];
  validationRules: string[];
  approvalRules: { approve: string[]; reject: string[] };
  benefits: string;
  status: "Active" | "Closed";
}
```

### Grievance Object

```typescript
interface Grievance {
  grievanceId: string;       // "GR-2026-0041"
  farmerId: string;
  farmerName: string;
  mobile: string;
  district: string;
  village: string;
  category: "Scheme" | "Land" | "Payment" | "Registration" | "Other";
  subject: string;
  description: string;
  schemeId?: string;
  schemeName?: string;
  attachmentUrl?: string;
  status: "Submitted" | "Under Review" | "Resolved" | "Closed";
  submittedAt: string;
  resolvedAt?: string;
  response?: string;
  resolvedBy?: string;
}
```

---

## 10. New Endpoints Summary (to be added to API server)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/otp/request` | Request OTP for login |
| `POST` | `/api/auth/otp/verify` | Verify OTP, get JWT |
| `GET` | `/api/auth/me` | Validate token, get farmer info |
| `GET` | `/api/farmers/:id` | Get single farmer by ID |
| `GET` | `/api/farmers/:id/status` | Lightweight status poll |
| `POST` | `/api/grievances` | Submit grievance |
| `GET` | `/api/grievances` | List farmer's grievances |
| `GET` | `/api/grievances/:id` | Get grievance detail |
| `GET` | `/api/notifications` | Get farmer notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark as read |
| `POST` | `/api/notifications/register-token` | Register push token |

---

*Document Version: 1.0 — May 2026*  
*Project: Krushi Suvidha AI — Airavata Technologies*
