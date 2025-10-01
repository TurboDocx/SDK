# TurboDocx SDK Architecture Plan

Based on comprehensive analysis of the TurboDocx API documentation, this document outlines the proposed modular architecture for both JavaScript and Python SDKs.

## Design Philosophy

The SDK should be:
- **Modular**: Each API domain (Templates, TurboSign, AI, etc.) is a separate module
- **Developer-friendly**: Clean, intuitive API with TypeScript support
- **Flexible**: Support both namespace and direct import patterns
- **Type-safe**: Full TypeScript definitions and Python type hints

## Proposed SDK Structure

### User's Preferred Pattern
```typescript
import { TurboSign } from '@turbodocx/sdk';

// Configure once (or per instance)
TurboSign.configure({ apiKey: 'your-api-key' });

// Use directly
await TurboSign.uploadDocument(file);
await TurboSign.addRecipients([
  { email: 'user@example.com', name: 'John Doe' }
]);
await TurboSign.prepareForSigning({
  fields: [
    { type: 'signature', page: 1, x: 100, y: 200 }
  ]
});
```

### Alternative Pattern (Also Supported)
```typescript
import TurboDocx from '@turbodocx/sdk';

const client = new TurboDocx({ apiKey: 'your-api-key' });

// Use via client namespace
await client.sign.uploadDocument(file);
await client.templates.upload(templateFile);
await client.ai.generateVariable({ hint: 'Generate summary' });
```

## Core Modules

Based on the TurboDocx API documentation, the SDK will be organized into the following modules:

### 1. Templates Module

**Purpose**: Manage document and presentation templates

**Methods**:
```typescript
import { Templates } from '@turbodocx/sdk';

// Upload template with optional default values
await Templates.upload(file, { defaultValues: {...} });

// List templates and folders
await Templates.list({ folderId: 'optional' });

// Get specific template by ID
await Templates.get(templateId);

// Update template metadata
await Templates.update(templateId, { name: 'New Name', description: '...' });

// Delete template
await Templates.delete(templateId);

// Extract placeholders and generate preview
await Templates.extractPlaceholders(templateId);
```

**API Endpoints Covered**:
- `POST /templates/upload` - Upload Template with Optional Default Values
- `GET /templates` - Get Templates and Folders
- `GET /templates/:id` - Get Template by ID
- `PATCH /templates/:id` - Edit Template Metadata
- `DELETE /templates/:id` - Delete Template
- `POST /templates/:id/extract` - Extract Template Placeholders and Generate Preview

---

### 2. Deliverables Module

**Purpose**: Generate documents from templates with data

**Methods**:
```typescript
import { Deliverables } from '@turbodocx/sdk';

// Create deliverable from template
await Deliverables.create({
  templateId: 'template-id',
  variables: {
    name: 'John Doe',
    company: 'Acme Corp',
    items: [
      { product: 'Widget', price: 100 }
    ]
  },
  format: 'pdf' // or 'docx', 'pptx'
});

// Download generated file
await Deliverables.download(deliverableId);

// Export to various platforms
await Deliverables.export(deliverableId, {
  platform: 'google-drive', // or 'sharepoint', 'onedrive'
  folderId: 'destination-folder'
});
```

**API Endpoints Covered**:
- `POST /deliverables` - Create Deliverable
- `GET /deliverables/:id/download` - Download Generated File

---

### 3. Variables Module

**Purpose**: Manage template variables and image variables

**Methods**:
```typescript
import { Variables } from '@turbodocx/sdk';

// Create variable
await Variables.create({
  name: 'customer_name',
  type: 'text',
  defaultValue: 'John Doe'
});

// Create image variable
await Variables.createImage({
  name: 'company_logo',
  folderId: 'folder-id',
  imageUrl: 'https://...'
});

// Read variables from folder
await Variables.list({ folderId: 'folder-id' });

// Update variable by ID
await Variables.update(variableId, { defaultValue: 'New Value' });

// Delete variables by IDs
await Variables.delete([variableId1, variableId2]);
```

**API Endpoints Covered**:
- `POST /variables` - Create Variable
- `POST /variables/image` - Create Image Variable (Folder)
- `GET /variables` - Read Variables (Folder)
- `PATCH /variables/:id` - Update Variable (by ID)
- `DELETE /variables` - Delete Variables (by IDs)

---

### 4. Tags Module

**Purpose**: Organize and categorize templates with tags

**Methods**:
```typescript
import { Tags } from '@turbodocx/sdk';

// Create tag
await Tags.create({ name: 'Sales', color: '#FF5733' });

// Read tag
await Tags.get(tagId);

// Update tag
await Tags.update(tagId, { name: 'Sales & Marketing' });

// Delete tags by IDs
await Tags.delete([tagId1, tagId2]);
```

**API Endpoints Covered**:
- `POST /tags` - Create Tag
- `GET /tags/:id` - Read Tag
- `PATCH /tags/:id` - Update Tag
- `DELETE /tags` - Delete Tags (by IDs)

---

### 5. TurboSign Module (Digital Signatures)

**Purpose**: Send documents for digital signature

**Methods**:
```typescript
import { TurboSign } from '@turbodocx/sdk';

// Step 1: Upload document for signing
const upload = await TurboSign.uploadDocument(pdfFile);

// Step 2: Add recipients
const recipients = await TurboSign.addRecipients(upload.documentId, [
  {
    email: 'signer1@example.com',
    name: 'John Doe',
    order: 1
  },
  {
    email: 'signer2@example.com',
    name: 'Jane Smith',
    order: 2
  }
]);

// Step 3: Prepare for signing (add signature fields)
await TurboSign.prepareForSigning(upload.documentId, {
  fields: [
    {
      type: 'signature',
      recipientId: recipients[0].id,
      page: 1,
      x: 100,
      y: 200,
      width: 200,
      height: 50
    },
    {
      type: 'date',
      recipientId: recipients[0].id,
      page: 1,
      x: 100,
      y: 300
    }
  ],
  webhookUrl: 'https://your-app.com/webhooks/signature-completed' // optional
});

// Additional operations
await TurboSign.void(documentId); // Void a document
await TurboSign.resend(documentId); // Resend signature email
await TurboSign.getAuditTrail(documentId); // Get audit trail
await TurboSign.download(documentId); // Download signed document
```

**Available Field Types**:
- `signature` - Signature field
- `initial` - Initial field
- `date` - Date field
- `text` - Text field
- `checkbox` - Checkbox field

**API Endpoints Covered**:
- `POST /sign/upload` - Upload Document
- `POST /sign/:id/recipients` - Add Recipients
- `POST /sign/:id/prepare` - Prepare for Signing
- `POST /sign/:id/void` - Void Document
- `POST /sign/:id/resend` - Resend Signature Email
- `GET /sign/:id/audit-trail` - Get Audit Trail
- `GET /sign/:id/download` - Download Signed Document

---

### 6. AI Module

**Purpose**: AI-powered variable generation from context and files

**Methods**:
```typescript
import { AI } from '@turbodocx/sdk';

// Generate single variable with AI
await AI.generateVariable({
  hint: 'Write a professional executive summary for this proposal',
  context: 'This is a proposal for...',
  templateId: 'optional-template-id'
});

// Generate from file attachments (Excel, PDF, DOCX)
await AI.generateFromFile({
  file: excelFile,
  hint: 'Analyze Q4 financial data and create summary',
  fileMetadata: {
    type: 'excel',
    sheetName: 'Q4 Results'
  }
});

// Context-aware generation
await AI.generateWithContext({
  hint: 'Create a project timeline section',
  templateContext: templateData,
  files: [projectPlan.pdf]
});
```

**Supported File Types**:
- Excel/Spreadsheets (`.xlsx`, `.xls`, `.csv`)
- Documents (`.pdf`, `.docx`)
- Images (`.png`, `.jpg`) - for OCR/analysis

**API Endpoints Covered**:
- `POST /ai/generate` - Generate Single Variable
- `POST /ai/generate-from-file` - Generate from File

---

### 7. Webhooks Module

**Purpose**: Configure and manage webhook notifications

**Methods**:
```typescript
import { Webhooks } from '@turbodocx/sdk';

// Create webhook
await Webhooks.create({
  url: 'https://your-app.com/webhooks/turbosign',
  events: ['signature.completed', 'signature.voided'],
  secret: 'your-webhook-secret'
});

// List webhooks
await Webhooks.list();

// Delete webhook
await Webhooks.delete(webhookId);

// Verify webhook signature (for security)
const isValid = Webhooks.verifySignature(
  payload,
  signature,
  secret
);
```

**Webhook Events**:
- `signature.completed` - Document fully signed
- `signature.voided` - Document voided

**API Endpoints Covered**:
- `POST /webhooks` - Create Webhook
- `GET /webhooks` - List Webhooks
- `DELETE /webhooks/:id` - Delete Webhook

---

### 8. Brand Module

**Purpose**: Configure organization brand identity

**Methods**:
```typescript
import { Brand } from '@turbodocx/sdk';

// Upload brand logo
await Brand.uploadLogo(logoFile);

// Set brand colors (auto-extracted from logo or manual)
await Brand.setColors({
  primary: '#FF5733',
  secondary: '#3498DB',
  accent: '#2ECC71'
});

// Configure typography
await Brand.setTypography({
  headings: {
    h1: { fontFamily: 'Arial', fontSize: 32, color: '#000000' },
    h2: { fontFamily: 'Arial', fontSize: 24, color: '#333333' },
    h3: { fontFamily: 'Arial', fontSize: 18, color: '#666666' }
  },
  body: { fontFamily: 'Georgia', fontSize: 12, color: '#000000' }
});

// Configure table styling
await Brand.setTableStyles({
  headerBackground: '#3498DB',
  headerText: '#FFFFFF',
  borderColor: '#CCCCCC',
  borderWidth: 1
});
```

**API Endpoints Covered**:
- `POST /brand/logo` - Upload Brand Logo
- `POST /brand/colors` - Set Brand Colors
- `POST /brand/typography` - Set Typography
- `POST /brand/tables` - Set Table Styles

---

### 9. Integrations Module

**Purpose**: Connect with third-party platforms (CRMs, storage, meeting tools)

Each integration is a sub-module:

```typescript
import { Integrations } from '@turbodocx/sdk';

// HubSpot
await Integrations.hubspot.configure({ accessToken: 'token' });
await Integrations.hubspot.syncFields();
await Integrations.hubspot.getContacts();
await Integrations.hubspot.getDeals();

// Salesforce
await Integrations.salesforce.configure({
  consumerKey: 'key',
  consumerSecret: 'secret'
});
await Integrations.salesforce.authorize();
await Integrations.salesforce.getAccounts();

// ConnectWise PSA
await Integrations.connectwise.configure({
  tenantEndpoint: 'https://company.connectwise.com',
  companyName: 'YourCompany',
  publicKey: 'key',
  privateKey: 'key',
  clientId: 'client-id'
});
await Integrations.connectwise.getTickets();
await Integrations.connectwise.getProjects();

// Zoom
await Integrations.zoom.configure({
  clientId: 'id',
  clientSecret: 'secret'
});
await Integrations.zoom.getMeetings();
await Integrations.zoom.getTranscript(meetingId);

// Fireflies
await Integrations.fireflies.configure({ apiKey: 'key' });
await Integrations.fireflies.getTranscripts();

// SharePoint/OneDrive
await Integrations.sharepoint.configure({
  tenantId: 'id',
  clientId: 'id',
  siteName: 'DocumentationTeam'
});

// Google Drive
await Integrations.googleDrive.authorize();
await Integrations.googleDrive.listFiles();
```

**Supported Integrations**:
- HubSpot (CRM)
- Salesforce (CRM)
- ConnectWise PSA (Service Management)
- Zoom (Meeting Transcripts)
- Fireflies (Meeting Transcripts)
- SharePoint/OneDrive (Cloud Storage)
- Google Drive (Cloud Storage)
- Zapier (Automation - coming soon)
- Microsoft Teams (coming soon)

---

## Implementation Structure

### JavaScript/TypeScript SDK

```
packages/js-sdk/
├── src/
│   ├── index.ts                      # Main exports
│   ├── client.ts                     # Main TurboDocx client class
│   ├── config.ts                     # Global configuration
│   ├── http.ts                       # HTTP client with auth
│   ├── modules/
│   │   ├── templates.ts              # Templates module
│   │   ├── deliverables.ts           # Deliverables module
│   │   ├── variables.ts              # Variables module
│   │   ├── tags.ts                   # Tags module
│   │   ├── sign.ts                   # TurboSign module
│   │   ├── ai.ts                     # AI module
│   │   ├── webhooks.ts               # Webhooks module
│   │   ├── brand.ts                  # Brand module
│   │   └── integrations/
│   │       ├── index.ts              # Integrations main
│   │       ├── hubspot.ts
│   │       ├── salesforce.ts
│   │       ├── connectwise.ts
│   │       ├── zoom.ts
│   │       ├── fireflies.ts
│   │       ├── sharepoint.ts
│   │       └── google-drive.ts
│   ├── types/
│   │   ├── index.ts                  # All type exports
│   │   ├── templates.ts
│   │   ├── deliverables.ts
│   │   ├── sign.ts
│   │   └── ...
│   └── utils/
│       ├── errors.ts                 # Custom error classes
│       ├── validation.ts             # Input validation
│       └── helpers.ts
├── tests/
│   ├── templates.test.ts
│   ├── sign.test.ts
│   └── ...
├── examples/
│   ├── basic-template.ts
│   ├── turbosign-complete.ts
│   ├── ai-generation.ts
│   └── ...
├── package.json
├── tsconfig.json
└── README.md
```

### Python SDK

```
packages/py-sdk/
├── src/turbodocx_sdk/
│   ├── __init__.py                   # Main exports
│   ├── client.py                     # Main client class
│   ├── config.py                     # Configuration
│   ├── http_client.py                # HTTP client
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── templates.py
│   │   ├── deliverables.py
│   │   ├── variables.py
│   │   ├── tags.py
│   │   ├── sign.py
│   │   ├── ai.py
│   │   ├── webhooks.py
│   │   ├── brand.py
│   │   └── integrations/
│   │       ├── __init__.py
│   │       ├── hubspot.py
│   │       ├── salesforce.py
│   │       └── ...
│   ├── types/
│   │   ├── __init__.py
│   │   ├── templates.py
│   │   └── ...
│   └── utils/
│       ├── errors.py
│       ├── validation.py
│       └── helpers.py
├── tests/
│   ├── test_templates.py
│   ├── test_sign.py
│   └── ...
├── examples/
│   ├── basic_template.py
│   ├── turbosign_complete.py
│   └── ...
├── pyproject.toml
└── README.md
```

## Usage Patterns

### Pattern 1: Direct Module Imports (Recommended)

```typescript
import { TurboSign, Templates, AI } from '@turbodocx/sdk';

// Configure globally (once at app startup)
TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY,
  baseUrl: 'https://api.turbodocx.com' // optional
});

Templates.configure({ apiKey: process.env.TURBODOCX_API_KEY });
AI.configure({ apiKey: process.env.TURBODOCX_API_KEY });

// Use modules directly
const upload = await TurboSign.uploadDocument(file);
const template = await Templates.upload(templateFile);
const aiResult = await AI.generateVariable({ hint: '...' });
```

### Pattern 2: Client Instance (Alternative)

```typescript
import TurboDocx from '@turbodocx/sdk';

const client = new TurboDocx({
  apiKey: process.env.TURBODOCX_API_KEY
});

// Use via client
await client.sign.uploadDocument(file);
await client.templates.upload(templateFile);
await client.ai.generateVariable({ hint: '...' });
```

### Pattern 3: Hybrid (Both Available)

```typescript
import TurboDocx, { TurboSign } from '@turbodocx/sdk';

// Client for some operations
const client = new TurboDocx({ apiKey: 'key' });
await client.templates.list();

// Direct import for frequently used modules
await TurboSign.uploadDocument(file);
```

## Python Usage

```python
from turbodocx_sdk import TurboDocx
from turbodocx_sdk.modules import TurboSign, Templates, AI

# Pattern 1: Direct module import
TurboSign.configure(api_key="your-api-key")
upload = await TurboSign.upload_document(file)

# Pattern 2: Client instance
client = TurboDocx(api_key="your-api-key")
template = await client.templates.upload(template_file)
```

## Authentication

Both SDKs will support:

1. **API Key Authentication** (primary)
   ```typescript
   import TurboDocx from '@turbodocx/sdk';
   const client = new TurboDocx({ apiKey: 'your-api-key' });
   ```

2. **Bearer Token** (for user-level access)
   ```typescript
   const client = new TurboDocx({ accessToken: 'bearer-token' });
   ```

3. **Environment Variables**
   ```typescript
   // Automatically reads TURBODOCX_API_KEY
   const client = new TurboDocx();
   ```

## Error Handling

Consistent error handling across all modules:

```typescript
try {
  await TurboSign.uploadDocument(file);
} catch (error) {
  if (error instanceof TurboDocxError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Error Code:', error.code);
  }
}
```

**Error Classes**:
- `TurboDocxError` - Base error class
- `AuthenticationError` - Invalid API key/token
- `ValidationError` - Invalid input
- `NotFoundError` - Resource not found
- `RateLimitError` - Rate limit exceeded
- `NetworkError` - Network/connection issues

## TypeScript Support

Full TypeScript support with:
- Comprehensive type definitions for all methods
- Request/response types
- Enum types for constants
- Generic types where appropriate

```typescript
interface SignatureField {
  type: 'signature' | 'initial' | 'date' | 'text' | 'checkbox';
  recipientId: string;
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  required?: boolean;
}

interface PrepareSigningRequest {
  fields: SignatureField[];
  webhookUrl?: string;
  message?: string;
}
```

## Next Steps

1. **Phase 1: Core Infrastructure**
   - Set up HTTP client with authentication
   - Implement error handling
   - Create base classes/utilities

2. **Phase 2: Priority Modules**
   - TurboSign (highest priority based on user example)
   - Templates
   - Deliverables

3. **Phase 3: Extended Modules**
   - Variables & Tags
   - AI
   - Webhooks
   - Brand

4. **Phase 4: Integrations**
   - HubSpot
   - Salesforce
   - Other integrations

5. **Phase 5: OpenAPI Code Generation**
   - Generate types from OpenAPI specs
   - Auto-generate client code
   - Keep specs in sync with SDK

6. **Phase 6: Documentation & Examples**
   - API reference documentation
   - Comprehensive examples
   - Migration guides

## OpenAPI Specifications

Update `specs/core.yaml` and `specs/sign.yaml` with complete endpoint definitions based on documentation analysis. These specs will be used to:
- Generate TypeScript types
- Generate Python types (using dataclasses/Pydantic)
- Validate API requests/responses
- Auto-generate documentation
