# Krushi Suvidha AI — Mobile App API Documentation

**Base URL (Production):** `https://krushisuvidhaai.airavatatechnologies.com/api`  
**Server:** VPS running Node.js (Express) via PM2, reverse-proxied through Nginx on **port 3014**  
**Protocol:** HTTPS only in production  
**Content-Type:** `application/json` unless uploading files (then `multipart/form-data`)  
**CORS:** Enabled for all origins on the API server

---

## Environment Credentials

> These values are already configured in `ecosystem.config.cjs` and must be present on the VPS.

| Variable | Value |
|----------|-------|
| `PORT` | `3014` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://sairajkoyande_db_user:5QlrqFxJrJmM9rR4@cluster0.akmevxg.mongodb.net/?appName=Cluster0` |
| `DATALAB_API_KEY` | `Zgtv3ZTMRajX5sv5v9EqD81nsdUH0rfPwlWJd3SorTI` |
| `JWT_SECRET` | `krushi-suvidha-prod-secret-2026-mh-agri` |

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
10. [New Endpoints Summary](#10-new-endpoints-summary)

---

## 1. Server & Infrastructure Setup

### Architecture — Single Port (3014)

The Express API server runs on **port 3014** and handles everything:
- `/api/*` → All API routes
- `/*` → Serves the built React admin dashboard (static files)

This means only **one process, one port** — no separate frontend server needed.

```
Internet → Nginx (80/443) → localhost:3014 (Express — API + Static Frontend)
```

---

### Nginx Configuration

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

    # Everything goes to the single Express server on port 3014
    location / {
        proxy_pass http://localhost:3014;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        client_max_body_size 55M;
    }
}
```

---

### PM2 Ecosystem Config (`ecosystem.config.cjs`)

> This file is already created at the root of the project. Just run the commands below on your VPS.

```js
module.exports = {
  apps: [
    {
      name: "krushi-suvidha",
      cwd: "./artifacts/api-server",
      script: "node",
      args: "--enable-source-maps ./dist/index.mjs",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        PORT: 3014,
        NODE_ENV: "production",
        MONGODB_URI: "mongodb+srv://sairajkoyande_db_user:5QlrqFxJrJmM9rR4@cluster0.akmevxg.mongodb.net/?appName=Cluster0",
        DATALAB_API_KEY: "Zgtv3ZTMRajX5sv5v9EqD81nsdUH0rfPwlWJd3SorTI",
      },
    },
  ],
};
```

---

### VPS Deployment Steps

```bash
# 1. Clone/upload project to VPS
git clone <your-repo> /var/www/krushi-suvidha
cd /var/www/krushi-suvidha

# 2. Install Node.js (v20+) and PM2 globally
npm install -g pm2

# 3. Install all dependencies (single command)
npm install

# 4. Build everything — frontend + API server (single command)
npm run build
# Builds: artifacts/agri-admin/dist/  (React frontend)
#         artifacts/api-server/dist/   (Express API server)

# 5. Start with PM2
pm2 start ecosystem.config.cjs

# 6. Save PM2 process list (auto-restart on reboot)
pm2 save
pm2 startup

# 7. Set up Nginx (copy config above to /etc/nginx/sites-available/krushi-suvidha)
sudo ln -s /etc/nginx/sites-available/krushi-suvidha /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 8. SSL certificate (Let's Encrypt)
sudo certbot --nginx -d krushisuvidhaai.airavatatechnologies.com

# To redeploy after code changes:
# git pull && npm install && npm run build && pm2 restart krushi-suvidha
```

---

## 2. Authentication APIs

> ✅ **Implemented and live** on the API server.

### 2.1 Request OTP

```
POST /api/auth/send-otp
Content-Type: application/json
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
  "message": "OTP sent successfully",
  "otp": "482910",
  "expiresIn": 300
}
```

> **Note:** The `otp` field is returned directly for development. In production, integrate an SMS gateway (MSG91 / Fast2SMS) and remove it from the response.

**Response 400:**
```json
{ "error": "Valid 10-digit mobile number required" }
```

**Notes:**
- OTP is 6 digits, valid for 5 minutes
- Stored in MongoDB `otp_sessions` collection
- A new OTP request overwrites the previous one for the same mobile

---

### 2.2 Verify OTP & Get JWT Token

```
POST /api/auth/verify-otp
Content-Type: application/json
```

**Body:**
```json
{
  "mobile": "9876543210",
  "otp": "482910"
}
```

**Response 200 — Farmer exists:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer": {
    "farmerId": "F-042",
    "name": "Ramesh Patel",
    "mobile": "9876543210",
    "status": "Verified",
    "district": "Nashik"
  },
  "isRegistered": true
}
```

**Response 200 — Mobile not yet registered:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer": null,
  "isRegistered": false
}
```

**Response 400:**
```json
{ "error": "OTP expired. Please request a new one." }
```

**Notes:**
- JWT payload: `{ mobile, farmerId, role: "farmer", iat, exp }`
- Token expires in **7 days**
- Include in all subsequent requests: `Authorization: Bearer <token>`
- OTP session is deleted after successful verification

---

### 2.3 Register Expo Push Token

```
POST /api/auth/register-push-token
Content-Type: application/json
```

**Body:**
```json
{
  "mobile": "9876543210",
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response 200:**
```json
{ "success": true }
```

> Call this on every app launch after login to keep the token current.

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
    { "id": "form7",        "label": "Form 7 (Ownership Register)",        "description": "Maharashtra 7/12 — Rights Register" },
    { "id": "form12",       "label": "Form 12 (Crop Inspection Register)",  "description": "Maharashtra 7/12 — Crop Inspection Register" },
    { "id": "form8a",       "label": "Form 8A (Holding Register)",          "description": "Maharashtra — Holding Register" },
    { "id": "aadhar",       "label": "Aadhaar Card",                        "description": "UIDAI Aadhaar identity card" },
    { "id": "bank_passbook","label": "Bank Passbook",                       "description": "Bank account passbook front page" }
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
| `profile_phone` | string | No | Farmer's mobile number — auto-saves extracted data to their profile |

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

> Save the `request_id`. Poll the next endpoint every 4 seconds until `status` is `"complete"` or `"error"`.

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
  "pipelines": {
    "extract": { "status": "processing" },
    "marker": { "status": "complete" }
  }
}
```

**Response — Complete:**
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
          { "key": "village",       "label": "Village (गाव)",     "value": "Ozhar" },
          { "key": "taluka",        "label": "Taluka (तालुका)",   "value": "Niphad" },
          { "key": "district",      "label": "District (जिल्हा)", "value": "Nashik" },
          { "key": "survey_number", "label": "Survey Number",     "value": "142/A" }
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

**Aadhaar response also includes:**
```json
{
  "aadhar_photo": {
    "base64": "/9j/4AAQSkZJRgAB...",
    "mimeType": "image/jpeg"
  }
}
```

**Polling Strategy:**
```
Upload → save request_id → poll every 4 seconds → stop at "complete" or "error" → timeout after 3 minutes
```

---

## 4. Farmer Registration & Profile APIs

### 4.1 Submit New Farmer Registration

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
    { "name": "Form 7",       "fileName": "form7.pdf",    "size": "1.2 MB", "status": "uploaded" },
    { "name": "Form 12",      "fileName": "form12.pdf",   "size": "0.9 MB", "status": "uploaded" },
    { "name": "Form 8A",      "fileName": "form8a.pdf",   "size": "1.1 MB", "status": "uploaded" },
    { "name": "Aadhaar Card", "fileName": "aadhar.jpg",   "size": "0.5 MB", "status": "uploaded" },
    { "name": "Bank Passbook","fileName": "passbook.jpg", "size": "0.6 MB", "status": "uploaded" }
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

> **Note:** A dedicated single-farmer endpoint needs to be added to the API server. Until then, use `GET /api/farmers` and filter client-side by `farmerId`.

**Response 200:** Full `FarmerRecord` object (see Data Models section).

**Response 404:**
```json
{ "error": "Farmer not found" }
```

---

### 4.3 Poll Farmer Status (lightweight)

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

**Status values:**

| Status | Meaning for Farmer |
|--------|--------------------|
| `Pending` | Application received, under review |
| `Verified` | Approved — full access unlocked |
| `Active` | Active registered farmer |
| `Cancelled` | Application rejected |
| `Inactive` | Account disabled |

---

### 4.4 Update Farmer Profile

```
PATCH /api/farmers/:farmerId
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (only fields to update):**
```json
{
  "mobile": "9876543211",
  "crop": "Wheat"
}
```

**Response 200:** Returns the full updated farmer object.

---

## 5. Scheme APIs

> These endpoints **already exist**.

### 5.1 Get All Active Schemes

```
GET /api/schemes
GET /api/schemes?type=CENTRAL
GET /api/schemes?type=STATE
GET /api/schemes?search=PM-KISAN
Authorization: Bearer <token>
```

**Response 200:** Array of Scheme objects (see Data Models).

---

### 5.2 Get Single Scheme Details

```
GET /api/schemes/:schemeId
Authorization: Bearer <token>
```

**Example:** `GET /api/schemes/pm-kisan`

**Response 404:**
```json
{ "error": "Scheme not found" }
```

---

## 6. Grievance APIs

> ✅ **Implemented and live** on the API server.

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
  "description": "I have been verified since April 2026 but the first installment of PM-KISAN has not been credited to my account.",
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

### 6.3 Get Single Grievance Detail

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
  "response": "Your payment has been initiated. Please allow 2–3 working days for credit.",
  "resolvedBy": "District Officer — Nashik"
}
```

---

## 7. Notification APIs

> ✅ **Implemented and live** on the API server.

### 7.1 Get Farmer Notifications

```
GET /api/notifications?farmerId=F-043
GET /api/notifications?mobile=9876543210
GET /api/notifications?farmerId=F-043&unreadOnly=true
```

**Response 200:**
```json
[
  {
    "notificationId": "NOTIF-1746252000000-x7k2z",
    "type": "status_change",
    "title": "Registration Verified!",
    "body": "Congratulations! Your farmer registration has been verified.",
    "farmerId": "F-042",
    "mobile": "9876543210",
    "read": false,
    "readAt": null,
    "data": { "newStatus": "Verified" },
    "createdAt": "2026-05-04T09:15:00.000Z"
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
```

**Response 200:** Updated notification object

---

### 7.3 Mark All as Read

```
PATCH /api/notifications/read-all
Content-Type: application/json
```

**Body:**
```json
{ "mobile": "9876543210" }
```

**Response 200:**
```json
{ "success": true, "updated": 3 }
```

---

### 7.4 Send Notification (Admin / Server-side)

```
POST /api/notifications/send
Content-Type: application/json
```

**Body:**
```json
{
  "mobile": "9876543210",
  "farmerId": "F-042",
  "type": "status_change",
  "title": "Registration Verified!",
  "body": "Your farmer registration has been verified by the District Officer.",
  "data": { "newStatus": "Verified" }
}
```

**Response 201:** Created notification object

> This endpoint also delivers an Expo push notification if the farmer has a registered push token (via `POST /api/auth/register-push-token`). Push delivery failures are non-fatal — the notification is always saved to MongoDB.

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
| `502` | Upstream OCR service error |

**Mobile App Error Handling Strategy:**
- `401` → Clear local token → Redirect to Login screen
- `502` on OCR → Show retry button: "Processing service unavailable, please retry"
- `429` on OTP → Show countdown timer
- Network errors → Show offline banner with retry

---

## 9. Data Models Reference

### FarmerRecord

```typescript
interface FarmerRecord {
  farmerId: string;          // "F-001" — auto-assigned
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
  land: number | string;     // hectares
  surveyNumber: string;
  khateNumber?: string;
  crop: string;
  bankAccount: string;
  bankName?: string;
  branchName?: string;
  ifsc?: string;
  accountNo?: string;
  accountType?: string;
  status: "Active" | "Inactive" | "Pending" | "Verified" | "Cancelled";
  source: "ocr" | "manual" | "seed" | "mobile";
  addedAt: string;           // ISO datetime
  docs?: DocRecord[];
  aiRiskScore?: number;
}

interface DocRecord {
  name: string;              // "Form 7"
  fileName: string;          // "form7.pdf"
  size: string;              // "1.2 MB"
  status: "uploaded" | "failed" | "none";
}
```

### Document Type IDs

| ID | Label | Required |
|----|-------|---------|
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
  status: "Submitted" | "Under Review" | "Resolved" | "Closed";
  submittedAt: string;
  resolvedAt?: string;
  response?: string;
  resolvedBy?: string;
}
```

---

## 10. Complete API Endpoints Reference

### ✅ All Implemented

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/send-otp` | Request OTP for mobile login |
| `POST` | `/api/auth/verify-otp` | Verify OTP, get JWT token |
| `POST` | `/api/auth/register-push-token` | Register Expo push token |
| `GET` | `/api/document-types` | List supported OCR document types |
| `POST` | `/api/extract` | Upload document for OCR extraction |
| `GET` | `/api/extract/:requestId` | Poll OCR extraction result |
| `GET` | `/api/farmers` | List all farmers |
| `GET` | `/api/farmers/:id` | Get single farmer by farmerId |
| `POST` | `/api/farmers` | Register new farmer |
| `PATCH` | `/api/farmers/:id` | Update farmer profile |
| `DELETE` | `/api/farmers/:id` | Delete farmer |
| `GET` | `/api/schemes` | List schemes (filter by type/search) |
| `GET` | `/api/schemes/:id` | Get single scheme |
| `PATCH` | `/api/schemes/:id/status` | Update scheme status (Active/Closed) |
| `GET` | `/api/grievances` | List grievances (filter by mobile/farmerId/status) |
| `GET` | `/api/grievances/:id` | Get single grievance |
| `POST` | `/api/grievances` | Submit new grievance |
| `PATCH` | `/api/grievances/:id` | Update grievance status/reply (admin) |
| `GET` | `/api/notifications` | Get notifications (filter by mobile/farmerId/unreadOnly) |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read |
| `POST` | `/api/notifications/send` | Send notification + Expo push |

---

*Document Version: 1.1 — May 2026*  
*Project: Krushi Suvidha AI — Airavata Technologies*  
*Production: https://krushisuvidhaai.airavatatechnologies.com — Port 3014*
