# Krushi Suvidha AI — API Documentation
## AgriAdmin Backend — Complete Endpoint Reference

---

## Base URL

**Production:** `https://krushisuvidhaai.airavatatechnologies.com/api`
**Development:** `http://localhost:8000/api`

---

## Environment Credentials

> These values are configured in `ecosystem.config.cjs` and must be present on the VPS.

| Variable | Value |
|----------|-------|
| `PORT` | `3014` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://sairajkoyande_db_user:5QlrqFxJrJmM9rR4@cluster0.akmevxg.mongodb.net/?appName=Cluster0` |
| `DATALAB_API_KEY` | `Zgtv3ZTMRajX5sv5v9EqD81nsdUH0rfPwlWJd3SorTI` |
| `JWT_SECRET` | `krushi-suvidha-prod-secret-2026-mh-agri` |

---

## VPS Deploy Commands

```bash
# After pulling latest code:
npm run build && pm2 restart krushi-suvidha

# First-time setup only:
npm install && npm run build && pm2 start ecosystem.config.cjs
```

---

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `farmers` | All farmer registrations (manual + mobile OCR) |
| `schemes` | Government schemes (seeded) |
| `otp_sessions` | OTP store (auto-deleted on verify) |
| `push_tokens` | Expo push tokens per mobile |
| `grievances` | Farmer grievances |
| `notifications` | Push + in-app notifications |

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

JWT payload: `{ mobile, farmerId, role: "farmer", iat, exp }`
Expiry: **7 days**
Algorithm: **HS256** (Node.js built-in crypto — no external dependencies)

---

## Complete Endpoint Reference

### Health

#### `GET /api/health`
Returns server status.

**Response:**
```json
{ "status": "ok", "timestamp": "2026-05-03T..." }
```

---

### Authentication

#### `POST /api/auth/send-otp`
Generate and store a 6-digit OTP for a mobile number.

**Body:**
```json
{ "mobile": "9876543210" }
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
> `otp` is returned directly during development. Integrate MSG91/Fast2SMS in production and remove from response.

**Response 400:** `{ "error": "Valid 10-digit mobile number required" }`

---

#### `POST /api/auth/verify-otp`
Verify OTP. Returns JWT + farmer record if registered.

**Body:**
```json
{ "mobile": "9876543210", "otp": "482910" }
```

**Response 200 — returning farmer:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer": { "farmerId": "F-042", "name": "Ramesh Patel", "status": "Pending", ... },
  "isRegistered": true
}
```

**Response 200 — new farmer (no registration yet):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "farmer": null,
  "isRegistered": false
}
```

**Response 400:** `{ "error": "OTP expired. Please request a new one." }` or `{ "error": "Invalid OTP" }`

---

#### `POST /api/auth/register-push-token`
Store Expo push token for a mobile number.

**Body:**
```json
{ "mobile": "9876543210", "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
```

**Response 200:** `{ "success": true }`

> Call this on every app launch after login to keep the push token current.

---

### Document OCR

#### `GET /api/document-types`
Returns the list of supported document types for upload.

**Response 200:**
```json
{
  "types": [
    { "id": "aadhar",       "label": "Aadhaar Card",             "description": "..." },
    { "id": "bank_passbook","label": "Bank Passbook",            "description": "..." },
    { "id": "form7",        "label": "7/12 Satbara",             "description": "..." },
    { "id": "form12",       "label": "Form 12 — Crop Register",  "description": "..." },
    { "id": "form8a",       "label": "Form 8A",                  "description": "..." }
  ]
}
```

---

#### `POST /api/extract`
Upload a document for OCR extraction. Fans out to two Datalab pipelines simultaneously.

**Content-Type:** `multipart/form-data`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | PDF or image (max 50 MB) |
| `document_type` | string | ✅ | One of: `aadhar`, `bank_passbook`, `form7`, `form12`, `form8a` |
| `profile_phone` | string | ✅ for mobile app | Farmer's mobile number. When set, the extraction result is automatically saved into the farmer's record in the `farmers` collection, making it visible in the admin dashboard. |
| `mode` | string | ❌ | `fast` / `balanced` / `accurate` (default: `accurate`) |

**Response 200:**
```json
{
  "request_id": "a1b2c3d4e5f6...",
  "document_type": "aadhar",
  "document_label": "Aadhaar Card",
  "mode": "accurate",
  "profile_phone": "9876543210",
  "pipelines": {
    "extract": { "status": "submitted" },
    "marker":  { "status": "submitted" }
  }
}
```

---

#### `GET /api/extract/:requestId`
Poll for extraction result. Call every 4 seconds until `status` is not `"processing"`.

**Response — still processing:**
```json
{ "status": "processing", "document_type": "aadhar", ... }
```

**Response — complete:**
```json
{
  "status": "complete",
  "document_type": "aadhar",
  "document_label": "Aadhaar Card",
  "page_count": 1,
  "structured": {
    "sections": [
      {
        "title": "Identity",
        "fields": [
          { "key": "name",          "label": "Full Name",      "value": "Ramesh Patel" },
          { "key": "aadhaarNumber", "label": "Aadhaar Number", "value": "XXXX XXXX 1234" },
          { "key": "dateOfBirth",   "label": "Date of Birth",  "value": "15-06-1985" },
          { "key": "gender",        "label": "Gender",         "value": "Male" }
        ],
        "tables": []
      }
    ],
    "empty": false
  },
  "profile": {
    "phone": "9876543210",
    "section": "aadhar",
    "saved": true,
    "error": null
  }
}
```

> When `profile.saved === true`, the farmer record in MongoDB has been created/updated and is immediately visible in the admin dashboard.

---

### Farmers

#### `GET /api/farmers`
List all farmers.

**Response 200:** Array of farmer objects

---

#### `GET /api/farmers/:id`
Get a single farmer by `farmerId`.

**Response 200:** Farmer object
**Response 404:** `{ "error": "Farmer not found" }`

**Farmer object shape:**
```json
{
  "farmerId": "F-042",
  "name": "Ramesh Patel",
  "mobile": "9876543210",
  "status": "Pending",
  "source": "mobile_ocr",
  "aadhaar": "XXXX-XXXX-1234",
  "fatherName": "Shyam Patel",
  "dob": "15-06-1985",
  "gender": "Male",
  "village": "Ozhar",
  "district": "Nashik",
  "taluka": "Niphad",
  "surveyNumber": "42/3",
  "land": "2.00",
  "crop": "Cotton",
  "bankName": "Bank of Maharashtra",
  "branchName": "Ozhar Branch",
  "ifsc": "MAHB0001234",
  "accountNo": "60123456789",
  "bankAccount": "60123456789",
  "addedAt": "2026-05-03T...",
  "docs": [
    { "name": "Aadhaar Card", "fileName": "aadhar.pdf", "size": "—", "status": "uploaded", "section": "aadhar" },
    { "name": "Bank Passbook", "fileName": "bank_passbook.pdf", "size": "—", "status": "uploaded", "section": "passbook" }
  ],
  "ocr": {
    "aadhar": { "name": "Ramesh Patel", "aadhaarNumber": "XXXX XXXX 1234", ... },
    "passbook": { "bankName": "Bank of Maharashtra", "ifsc": "MAHB0001234", ... },
    "form7": { "village": "Ozhar", "surveyNumber": "42/3", "totalArea": "2.00", ... }
  }
}
```

> **`source: "mobile_ocr"`** — farmer created by mobile app OCR upload (vs `"manual"` for admin-created, `"seed"` for demo data)

---

#### `POST /api/farmers`
Create farmer manually (admin dashboard — New Registration form).

**Body:** Farmer fields object (all top-level fields)
**Response 201:** Created farmer object

---

#### `PATCH /api/farmers/:id`
Update a farmer's fields (admin only).

**Body:** Partial farmer fields
**Response 200:** Updated farmer object

---

#### `DELETE /api/farmers/:id`
Delete a farmer.

**Response 200:** `{ "success": true }`

---

### Schemes

#### `GET /api/schemes`
List all schemes with optional filters.

**Query params:** `?type=Central`, `?search=kisan`

**Response 200:** Array of scheme objects

---

#### `GET /api/schemes/:id`
Get single scheme.

---

#### `PATCH /api/schemes/:id/status`
Update scheme status (admin).

**Body:** `{ "status": "Active" }` or `{ "status": "Closed" }`

---

### Grievances

#### `GET /api/grievances`
List grievances with filters.

**Query params:** `?mobile=9876543210`, `?farmerId=F-042`, `?status=Open`

**Response 200:** Array of grievance objects

---

#### `GET /api/grievances/:id`
Get single grievance.

---

#### `POST /api/grievances`
Submit a new grievance.

**Body:**
```json
{
  "mobile": "9876543210",
  "farmerId": "F-042",
  "subject": "PM-KISAN installment not received",
  "description": "The 15th installment for Rabi 2025 has not been credited...",
  "category": "Scheme"
}
```

**Response 201:**
```json
{
  "grievanceId": "GRV-A1B2C3D4",
  "status": "Open",
  "createdAt": "2026-05-03T..."
}
```

---

#### `PATCH /api/grievances/:id`
Update grievance status / add officer reply (admin).

**Body:**
```json
{
  "status": "Resolved",
  "officerReply": "Payment has been processed. Please check your bank account."
}
```

---

### Notifications

#### `GET /api/notifications`
Get notifications with filters.

**Query params:** `?mobile=9876543210`, `?farmerId=F-042`, `?unreadOnly=true`

**Response 200:**
```json
[
  {
    "notificationId": "NOTIF-1746252000000-x7k2z",
    "type": "status_change",
    "title": "Registration Verified!",
    "body": "Your farmer registration has been verified by the District Officer.",
    "mobile": "9876543210",
    "farmerId": "F-042",
    "read": false,
    "readAt": null,
    "data": { "newStatus": "Verified" },
    "createdAt": "2026-05-03T..."
  }
]
```

**Notification types:**

| Type | When sent |
|------|-----------|
| `status_change` | Officer changes farmer status |
| `scheme_eligible` | On verification — lists eligible schemes |
| `grievance_update` | Grievance status changes |
| `general` | Admin broadcast |

---

#### `PATCH /api/notifications/:id/read`
Mark single notification as read.

**Response 200:** Updated notification object

---

#### `PATCH /api/notifications/read-all`
Mark all notifications as read for a mobile number.

**Body:** `{ "mobile": "9876543210" }`

**Response 200:** `{ "success": true, "updated": 3 }`

---

#### `POST /api/notifications/send`
Send a notification (admin / server-side use). Also triggers Expo push delivery.

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

> Push delivery is non-fatal — notification is always saved to MongoDB even if push delivery fails.

---

## Error Responses

All errors follow this shape:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Invalid input / validation failed |
| 401 | Missing or invalid JWT token |
| 404 | Resource not found |
| 500 | Internal server error |
| 502 | Upstream (Datalab) error |

---

## Mobile App OCR Registration Flow

This is how a farmer's registration appears in the admin dashboard:

```
Mobile App                      API Server                    Admin Dashboard
─────────────────────────────────────────────────────────────────────────────
1. POST /auth/send-otp          → Generate OTP
2. POST /auth/verify-otp        → Return JWT
3. POST /auth/register-push-token

For each of 5 documents:
4. POST /api/extract            → Submit to Datalab OCR
   (with profile_phone)
5. Poll GET /api/extract/:id    → When complete:
                                  Auto-upsert into `farmers`
                                  collection with:
                                  - status: "Pending"
                                  - source: "mobile_ocr"
                                  - OCR fields mapped to
                                    farmer top-level fields
                                                              ← Farmer appears
                                                                in Farmer Registry
                                                                with all extracted
                                                                document data
```

---

*Document Version: 2.0 — May 2026*
*Project: Krushi Suvidha AI | Airavata Technologies*
