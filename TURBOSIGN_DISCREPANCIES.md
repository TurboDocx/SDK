# Critical Discrepancies Found in TurboSign SDK

After comparing the SDK implementation with the actual frontend implementation and backend API, the following critical issues were identified:

## Major Issues

### 1. **WRONG API ENDPOINTS** ❌
**SDK uses:** `/sign/*`
**Actual API uses:** `/turbosign/*`

All endpoints in the SDK are **completely wrong**:
- ❌ SDK: `/sign/upload` → ✅ Actual: `/turbosign/documents/upload`
- ❌ SDK: `/sign/:id/recipients` → ✅ Actual: `/turbosign/documents/:id/update-with-recipients`
- ❌ SDK: `/sign/:id/prepare` → ✅ Actual: `/turbosign/documents/:id/prepare-for-signing`
- ❌ SDK: `/sign/:id/void` → ✅ Actual: `/turbosign/documents/:documentId/void`
- ❌ SDK: `/sign/:id/resend` → ✅ Actual: `/turbosign/documents/:documentId/resend-email`
- ❌ SDK: `/sign/:id/audit-trail` → ✅ Actual: `/turbosign/documents/:documentId/audit-trail`
- ❌ SDK: `/sign/:id/download` → ✅ Actual: `/turbosign/documents/:documentId/download`
- ❌ SDK: `/sign/:id` (status) → ✅ Actual: `/turbosign/documents/:id/status`

### 2. **Missing Critical Field Types** ❌
SDK only has 5 field types:
```typescript
type SignatureFieldType = 'signature' | 'initial' | 'date' | 'text' | 'checkbox';
```

**Actual API supports 10 field types:**
```typescript
enum SignatureFieldType {
  SIGNATURE = "signature",
  INITIAL = "initial",
  DATE = "date",
  NAME = "full_name",           // ❌ MISSING
  TITLE = "title",               // ❌ MISSING
  COMPANY = "company",           // ❌ MISSING
  FIRST_NAME = "first_name",     // ❌ MISSING
  LAST_NAME = "last_name",       // ❌ MISSING
  EMAIL = "email",               // ❌ MISSING
  TEXT = "text",
}
```

### 3. **Wrong Field Structure** ❌
SDK fields are missing required properties:

**SDK has:**
```typescript
interface SignatureField {
  recipientId: string;
  type: SignatureFieldType;
  page: number;
  x: number;
  y: number;
  width?: number;      // Optional but should be required
  height?: number;     // Optional but should be required
}
```

**Actual API requires:**
```typescript
{
  recipientId: string;
  type: SignatureFieldType;
  page: number;
  x: number;
  y: number;
  width: number;       // REQUIRED
  height: number;      // REQUIRED
  pageWidth: number;   // ❌ MISSING - REQUIRED
  pageHeight: number;  // ❌ MISSING - REQUIRED
  defaultValue?: string;     // ❌ MISSING
  isMultiline?: boolean;     // ❌ MISSING
}
```

### 4. **Missing Critical Methods** ❌

**Frontend has these methods that SDK doesn't:**
1. `createFromDeliverable()` - Create signature doc from existing deliverable
2. `saveDocumentDetails()` - Save document with recipients (combines update)
3. `getDocumentWithRecipients()` - Get doc with recipient colors/metadata
4. `getDocumentFile()` - Get document file as blob/uint8array
5. `getDocumentFileWithRecipientToken()` - Public file access
6. `getRecipientFieldsWithToken()` - Public field access for signing
7. `recordTermsOfServiceConsent()` - Record TOS consent
8. `submitSignedDocumentWithToken()` - Public signing endpoint
9. `getPublicDocumentStatus()` - Public status check
10. `downloadDocumentPublicKey()` - Download document public key
11. `getDocumentFields()` - Get all fields (authenticated)

### 5. **Wrong Workflow** ❌

**SDK assumes 3-step workflow:**
1. Upload document
2. Add recipients (separate call)
3. Prepare for signing

**Actual API workflow:**
1. Upload document → Returns doc with DRAFT status
2. Update document WITH recipients (single call) → `update-with-recipients` endpoint
3. Prepare for signing with fields

The SDK method `addRecipients()` doesn't exist. The actual endpoint is `update-with-recipients` which updates both document metadata AND recipients in one call.

### 6. **Missing Recipient Metadata** ❌
```typescript
interface ISignatureRecipientMetadata {
  color?: string;        // UI color for recipient
  lightColor?: string;   // Light variant color
}
```
This metadata is used for UI display and is part of the recipient object.

### 7. **Missing Document Statuses** ❌
SDK only knows about basic statuses, but actual API has:
```typescript
enum SignatureDocumentStatus {
  DRAFT = "draft",
  SETUP_COMPLETE = "setup_complete",     // ❌ MISSING
  REVIEW_READY = "review_ready",         // ❌ MISSING
  UNDER_REVIEW = "under_review",         // ❌ MISSING
  COMPLETED = "completed",
  VOIDED = "voided",
}
```

### 8. **Missing Recipient Properties** ❌
SDK recipient interface is incomplete:

**SDK has:**
```typescript
interface Recipient {
  email: string;
  name: string;
  order?: number;        // Wrong property name
  message?: string;
}
```

**Actual API has:**
```typescript
interface ISignatureRecipient {
  id?: string;
  documentId?: string;
  name: string;
  email: string;
  signingOrder: number;           // Not "order"
  status?: string;                // ❌ MISSING
  accessToken?: string;           // ❌ MISSING
  signedOn?: Date;                // ❌ MISSING
  metadata?: ISignatureRecipientMetadata;  // ❌ MISSING
}
```

### 9. **Wrong Response Structure** ❌
All API responses are wrapped in `{ data: {...} }` but SDK expects direct responses.

**Example from frontend:**
```typescript
const res = await this.axios.post<FormData, AxiosResponse<IUploadDocumentResponse>>(
  `${this.apiURL}/documents/upload`,
  formData
);
return res.data.data;  // Note the double .data
```

**SDK incorrectly expects:**
```typescript
return await client.uploadFile<UploadDocumentResponse>('/sign/upload', file);
```

### 10. **Missing Features** ❌
- **Device fingerprinting** - Frontend adds `x-device-fingerprint` header to all requests
- **Template field support** - `TemplateField` type for template-based fields
- **Signature credit checking** - Credit reservation before signing
- **Webhook integration** - Only partial support in SDK
- **Audit trail details** - Location info, device info, recipient info
- **Document integrity verification** - Hash chain verification
- **Public key management** - Public key download for verification
- **Sender name** - Document metadata includes sender name

### 11. **Wrong Method Signatures** ❌

**Void method:**
- SDK: `void(documentId: string)`
- Actual: `voidDocument(documentId: string, reason: string)` - Requires reason!

**Resend method:**
- SDK: `resend(documentId: string, recipientId?: string)`
- Actual: `resendEmails(documentId: string, recipientIds: string[])` - Takes array!

**Download method:**
- SDK: Returns `Promise<Response>`
- Actual: Returns `Promise<Blob>`

### 12. **Missing Public Endpoints** ❌
The SDK is missing all public endpoints used for recipient signing:

- `/turbosign/public/documents/:documentId/file` - Get file with recipient token
- `/turbosign/public/documents/:documentId/fields/recipient` - Get fields to sign
- `/turbosign/public/documents/:documentId/consent` - Record TOS consent
- `/turbosign/public/documents/:documentId/sign` - Submit signed document
- `/turbosign/public/documents/:documentId/status` - Check document status

These are critical for building a signing interface.

## Summary of Required Fixes

### Phase 1: Critical API Fixes (MUST DO FIRST)
1. ✅ Change all endpoints from `/sign/*` to `/turbosign/documents/*`
2. ✅ Fix all endpoint paths to match backend routes
3. ✅ Add missing field types (full_name, title, company, first_name, last_name, email)
4. ✅ Add required pageWidth/pageHeight to field interface
5. ✅ Fix response unwrapping (all responses have `{ data: {...} }`)
6. ✅ Remove `checkbox` field type (not in backend)

### Phase 2: Core Workflow Fixes
7. ✅ Replace `addRecipients()` with `saveDocumentDetails()`
8. ✅ Fix `void()` to require `reason` parameter
9. ✅ Fix `resend()` to take array of recipient IDs
10. ✅ Fix `download()` return type to Blob
11. ✅ Add `createFromDeliverable()` method

### Phase 3: Missing Methods
12. ✅ Add `getDocumentWithRecipients()`
13. ✅ Add `getDocumentFile()`
14. ✅ Add `getDocumentFields()` (authenticated)
15. ✅ Add public endpoints for signing workflow
16. ✅ Add `downloadDocumentPublicKey()`

### Phase 4: Type Improvements
17. ✅ Add complete recipient metadata types
18. ✅ Add all document statuses
19. ✅ Fix recipient interface (signingOrder, status, accessToken, signedOn, metadata)
20. ✅ Add field defaultValue and isMultiline
21. ✅ Add template field support

### Phase 5: Advanced Features
22. ✅ Add device fingerprinting header support
23. ✅ Enhance audit trail types with location/device info
24. ✅ Add sender name to upload

## Backend Route Reference

All routes from `/home/nicolas/repos/RapidDocxBackend/src/routes/TurboSign/index.ts`:

```
POST   /turbosign/documents/upload
POST   /turbosign/documents/from-deliverable
PATCH  /turbosign/documents/:id/update-with-recipients
GET    /turbosign/documents/:id/status
GET    /turbosign/documents/:id/with-recipients
GET    /turbosign/documents/:id/file
GET    /turbosign/public/documents/:documentId/file
GET    /turbosign/public/documents/:documentId/fields/recipient
GET    /turbosign/documents/:id/fields
POST   /turbosign/documents/:id/prepare-for-signing
POST   /turbosign/documents/:id/prepare-for-review
GET    /turbosign/documents/signature-documents
POST   /turbosign/public/documents/:documentId/consent
POST   /turbosign/public/documents/:documentId/sign
POST   /turbosign/documents/:documentId/void
POST   /turbosign/documents/:documentId/resend-email
GET    /turbosign/documents/:documentId/download
GET    /turbosign/documents/:documentId/public-key/download
GET    /turbosign/documents/:documentId/audit-trail
GET    /turbosign/public/documents/:documentId/status
```

## Notes

- The frontend uses Axios and wraps all responses in `{ data: {...} }` structure
- The SDK needs to unwrap this structure appropriately
- Device fingerprinting is critical for audit trail
- Public endpoints are essential for building recipient signing interfaces
- The `prepare-for-review` endpoint exists but may not be needed for SDK v1
