# TurboSign SDK vs Documentation Comparison

## Overview

This document compares the TurboSign SDK implementation with the official API documentation to ensure consistency.

## Documentation Reference

- **Source**: `/home/nicolas/repos/Docs/docs/TurboSign/API Signatures.md`
- **3-Step Workflow**: Upload → Add Recipients → Prepare for Signing

## Comparison Results

### ✅ Step 1: Upload Document - MATCHES

**Documentation Endpoint**: `POST /turbosign/documents/upload`

**SDK Implementation**: ✅ Correct
```typescript
TurboSign.uploadDocument(file, fileName, description)
```

**Payload Structure**: ✅ Matches
- `file`: PDF binary
- `name`: Document name
- `description`: Optional description

---

### ⚠️ Step 2: Add Recipients - PARTIALLY MATCHES

**Documentation Endpoint**: `POST /turbosign/documents/{documentId}/update-with-recipients`

**SDK Implementation**: Has TWO methods

#### Option A: `addRecipients()` - Simplified (⚠️ Incomplete)
```typescript
TurboSign.addRecipients(documentId, recipients)
```

**Issue**: Sends incomplete payload
```typescript
{ document: {}, recipients }  // ⚠️ Empty document object
```

**Documentation requires**:
```json
{
  "document": {
    "name": "Contract Agreement - Updated",
    "description": "This document requires electronic signatures..."
  },
  "recipients": [...]
}
```

#### Option B: `saveDocumentDetails()` - Full (✅ Correct)
```typescript
TurboSign.saveDocumentDetails(
  documentId,
  { name: 'Updated Contract', description: 'Q4 2024' },
  recipients
)
```

**Payload**: ✅ Matches documentation exactly
```typescript
{ document: documentData, recipients }
```

---

### ✅ Step 3: Prepare for Signing - MATCHES

**Documentation Endpoint**: `POST /turbosign/documents/{documentId}/prepare-for-signing`

**SDK Implementation**: ✅ Correct
```typescript
TurboSign.prepareForSigning(documentId, { fields, webhookUrl, sendEmails })
```

**Payload Structure**: ✅ Matches
- Sends array of fields directly
- Documentation shows array of field objects (lines 353-411)
- SDK correctly sends `request.fields` (line 188 in sign.ts)

---

## Field Types Comparison

**Documentation** (API Signatures.md, lines 66-78):
- ✅ signature
- ✅ initial
- ✅ date
- ✅ full_name
- ✅ first_name
- ✅ last_name
- ✅ title
- ✅ company
- ✅ email
- ✅ text

**SDK** (types/sign.ts, lines 5-15):
- ✅ All 10 field types present and correct

---

## Examples Comparison

### Documentation Example (lines 241-268, 353-411)

**Step 2 Payload**:
```json
{
  "document": {
    "name": "Contract Agreement - Updated",
    "description": "This document requires electronic signatures from both parties..."
  },
  "recipients": [
    {
      "name": "John Smith",
      "email": "john.smith@company.com",
      "signingOrder": 1,
      "metadata": {
        "color": "hsl(200, 75%, 50%)",
        "lightColor": "hsl(200, 75%, 93%)"
      },
      "documentId": "4a20eca5-7944-430c-97d5-fcce4be24296"
    }
  ]
}
```

**Step 3 Payload** (coordinate-based, lines 450-471):
```json
[
  {
    "recipientId": "5f673f37-9912-4e72-85aa-8f3649760f6b",
    "type": "signature",
    "page": 1,
    "x": 100,
    "y": 200,
    "width": 200,
    "height": 80,
    "pageWidth": 612,
    "pageHeight": 792
  }
]
```

### SDK Example Issues

**Current SDK `turbosign-basic.ts`**:
- ❌ Uses `addRecipients()` without document details
- ❌ Doesn't include `metadata` (colors) for recipients
- ❌ Recipients don't include `documentId` field
- ✅ Step 3 field structure is correct

---

## Recommendations

### 1. Update `turbosign-basic.ts` Example

Replace `addRecipients()` with `saveDocumentDetails()` to match documentation:

```typescript
// CURRENT (incomplete):
const recipients = await TurboSign.addRecipients(upload.documentId, [
  { email: 'john.doe@example.com', name: 'John Doe', order: 1 }
]);

// RECOMMENDED (matches docs):
const result = await TurboSign.saveDocumentDetails(
  upload.documentId,
  {
    name: 'Contract Agreement - Updated',
    description: 'This document requires electronic signatures from both parties.'
  },
  [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      signingOrder: 1,
      metadata: {
        color: 'hsl(200, 75%, 50%)',
        lightColor: 'hsl(200, 75%, 93%)'
      }
    }
  ]
);
```

### 2. Update Example to Include Metadata

Add color metadata to match documentation examples.

### 3. Consider Deprecating `addRecipients()`

The simplified `addRecipients()` method doesn't match the documented API behavior. Options:
- Deprecate it in favor of `saveDocumentDetails()`
- Update it to require document details as a parameter
- Keep it but document that `saveDocumentDetails()` is the preferred method

### 4. Update TypeScript Types

Add `documentId` to recipient types since docs show it's required:
```typescript
export interface Recipient {
  email: string;
  name: string;
  order?: number;
  message?: string;
  documentId?: string;  // Add this
}
```

---

## Summary

| Component | Status | Action Needed |
|-----------|--------|--------------|
| Upload Document | ✅ Perfect | None |
| Add Recipients | ⚠️ Partial | Update examples to use `saveDocumentDetails()` |
| Prepare for Signing | ✅ Perfect | None |
| Field Types | ✅ Perfect | None |
| Examples | ❌ Needs Update | Add metadata, use correct method |

---

## Next Steps

1. Update `turbosign-basic.ts` to use `saveDocumentDetails()` instead of `addRecipients()`
2. Add recipient metadata (colors) to all examples
3. Update `turbosign-complete-workflow.ts` similarly
4. Consider adding a migration guide if `addRecipients()` is deprecated
