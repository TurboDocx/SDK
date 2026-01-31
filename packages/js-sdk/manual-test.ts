/**
 * TurboDocx JS SDK - Manual Test Suite
 *
 * Tests for both TurboSign (digital signatures) and TurboTemplate (document generation)
 *
 * Run: npx ts-node manual-test.ts
 *
 * Make sure to configure the values below before running.
 */

import { TurboSign, TurboTemplate } from "./src";
import * as fs from "fs";

// =============================================
// CONFIGURE THESE VALUES BEFORE RUNNING
// =============================================
const API_KEY = "your-api-key-here"; // Replace with your actual TurboDocx API key
const BASE_URL = "https://api.turbodocx.com"; // Replace with your API URL
const ORG_ID = "your-org-id-here"; // Replace with your organization UUID

const TEST_PDF_PATH = "./test-document.pdf"; // Replace with path to your test PDF/DOCX
const TEST_EMAIL = "recipient@example.com"; // Replace with a real email to receive notifications
const FILE_URL = "https://example.com/your-document.pdf"; // Replace with publicly accessible PDF URL
const TEMPLATE_ID = "your-template-uuid-here"; // Replace with your template UUID

// Initialize TurboSign client
TurboSign.configure({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  orgId: ORG_ID,
  senderEmail: "sender@example.com",     // Reply-to email for signature requests
  senderName: "Your Company Name",       // Sender name shown in emails
});

// Initialize TurboTemplate client
TurboTemplate.configure({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  orgId: ORG_ID,
});

// =============================================
// TEST FUNCTIONS
// =============================================

async function testCreateSignatureReviewLink() {
  console.log("\n--- Test 1: createSignatureReviewLink ---");
  const pdfBuffer = fs.readFileSync(TEST_PDF_PATH);

  const result = await TurboSign.createSignatureReviewLink({
    // file: pdfBuffer,
    templateId: "your-template-uuid-here", // Replace with your template ID
    recipients: [{ name: "Test User", email: TEST_EMAIL, signingOrder: 1 }],
    fields: [
      {
        recipientEmail: TEST_EMAIL,
        type: "text",
        template: {
          anchor: "{placeholder}",
          placement: "replace",
          size: { width: 200, height: 80 },
          offset: { x: 0, y: 0 },
          caseSensitive: true,
          useRegex: false,
        },
        defaultValue: "Sample Text",
        required: true,
        isMultiline: true,
      },
      {
        recipientEmail: TEST_EMAIL,
        type: "last_name",
        page: 1,
        x: 100,
        y: 650,
        width: 200,
        height: 50,
        defaultValue: "Doe",
      },
    ],
    documentName: "Review Test Document",
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result.documentId;
}

async function testSendSignature() {
  console.log("\n--- Test 2: sendSignature ---");
  const pdfBuffer = fs.readFileSync(TEST_PDF_PATH);

  const result = await TurboSign.sendSignature({
    file: pdfBuffer,
    // templateId: "341af877-02d4-4549-823b-87089a3f7b02",
    recipients: [{ name: "Signer One", email: TEST_EMAIL, signingOrder: 1 }],
    fields: [
      {
        recipientEmail: TEST_EMAIL,
        type: "signature",
        page: 1,
        x: 100,
        y: 550,
        width: 200,
        height: 50,
      },
      {
        recipientEmail: TEST_EMAIL,
        type: "checkbox",
        page: 1,
        x: 320,
        y: 550,
        width: 50,
        height: 50,
        defaultValue: "true",
      },
    ],
    documentName: "Signing Test Document",
    documentDescription:
      "Sample contract for testing single-step signature endpoint",
    ccEmails: ["cc@example.com"]
  });

  console.log("Result:", result);
  return result.documentId;
}

async function testGetStatus(documentId: string) {
  console.log("\n--- Test 3: getStatus ---");
  const result = await TurboSign.getStatus(documentId);
  console.log("Result:", JSON.stringify(result, null, 2));
  return result;
}

async function testDownload(documentId: string) {
  console.log("\n--- Test 4: download ---");
  const result = await TurboSign.download(documentId);
  console.log("Result: Blob received, size:", result.size, "bytes");

  // Save to file
  const buffer = Buffer.from(await result.arrayBuffer());
  const outputPath = "./downloaded-document.pdf";
  fs.writeFileSync(outputPath, buffer);
  console.log(`File saved to: ${outputPath}`);

  return buffer;
}

async function testResend(documentId: string, recipientIds: string[]) {
  console.log("\n--- Test 5: resend ---");
  const result = await TurboSign.resend(documentId, recipientIds);
  console.log("Result:", JSON.stringify(result, null, 2));
  return result;
}

async function testVoid(documentId: string) {
  console.log("\n--- Test 6: void ---");
  const result = await TurboSign.void(documentId, "Testing void functionality");
  console.log("Result:", JSON.stringify(result, null, 2));
  return result;
}

async function testGetAuditTrail(documentId: string) {
  console.log("\n--- Test 7: getAuditTrail ---");
  const result = await TurboSign.getAuditTrail(documentId);
  console.log("Result:", JSON.stringify(result, null, 2));
  return result;
}

// =============================================
// TURBOTEMPLATE TEST FUNCTIONS
// =============================================

/**
 * Test 8: Simple Variable Substitution
 *
 * Template usage: "Dear {customer_name}, your order total is ${order_total}."
 */
async function testSimpleVariables() {
  console.log("\n--- Test 8: Simple Variable Substitution ---");

  const result = await TurboTemplate.generate({
    templateId: TEMPLATE_ID,
    variables: [
      { placeholder: "{customer_name}", name: "customer_name", value: "John Doe", mimeType: "text" },
      { placeholder: "{order_total}", name: "order_total", value: 1500, mimeType: "text" },
      { placeholder: "{order_date}", name: "order_date", value: "2024-01-01", mimeType: "text" },
    ],
    name: "Simple Substitution Document",
    description: "Basic variable substitution example",
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result.id;
}

/**
 * Test 9: Nested Objects with Dot Notation
 *
 * Template usage: "Name: {user.name}, Company: {user.profile.company}"
 */
async function testNestedObjects() {
  console.log("\n--- Test 9: Nested Objects with Dot Notation ---");

  const result = await TurboTemplate.generate({
    templateId: TEMPLATE_ID,
    variables: [
      {
        placeholder: "{user}",
        name: "user",
        value: {
          name: "John Doe",
          email: "john@example.com",
          profile: {
            company: "Acme Corp",
            title: "Software Engineer",
            location: "San Francisco, CA"
          }
        },
        mimeType: "json",
        usesAdvancedTemplatingEngine: true,
      },
    ],
    name: "Nested Objects Document",
    description: "Nested object with dot notation example",
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result.id;
}

/**
 * Test 10: Array Loops
 *
 * Template usage:
 * {#items}
 * - {name}: {quantity} x ${price}
 * {/items}
 */
async function testArrayLoops() {
  console.log("\n--- Test 10: Array Loops ---");

  const result = await TurboTemplate.generate({
    templateId: TEMPLATE_ID,
    variables: [
      {
        placeholder: "{items}",
        name: "items",
        value: [
          { name: "Item A", quantity: 5, price: 100, sku: "SKU-001" },
          { name: "Item B", quantity: 3, price: 200, sku: "SKU-002" },
          { name: "Item C", quantity: 10, price: 50, sku: "SKU-003" },
        ],
        mimeType: "json",
        usesAdvancedTemplatingEngine: true,
      },
    ],
    name: "Array Loops Document",
    description: "Array loop iteration example",
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result.id;
}

/**
 * Test 11: Conditionals
 *
 * Template usage:
 * {#if is_premium}
 * Premium Member Discount: {discount * 100}%
 * {/if}
 */
async function testConditionals() {
  console.log("\n--- Test 11: Conditionals ---");

  const result = await TurboTemplate.generate({
    templateId: TEMPLATE_ID,
    variables: [
      { placeholder: "{is_premium}", name: "is_premium", value: true, mimeType: "json", usesAdvancedTemplatingEngine: true },
      { placeholder: "{discount}", name: "discount", value: 0.2, mimeType: "json", usesAdvancedTemplatingEngine: true },
    ],
    name: "Conditionals Document",
    description: "Boolean conditional example",
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result.id;
}

/**
 * Test 12: Images
 *
 * Template usage: Insert {logo} at the top of the document
 */
async function testImages() {
  console.log("\n--- Test 12: Images ---");

  const result = await TurboTemplate.generate({
    templateId: TEMPLATE_ID,
    variables: [
      { placeholder: "{title}", name: "title", value: "Quarterly Report", mimeType: "text" },
      { placeholder: "{logo}", name: "logo", value: "https://example.com/logo.png", mimeType: "image" },
    ],
    name: "Document with Images",
    description: "Using image variables",
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result.id;
}

// =============================================
// MAIN TEST RUNNER
// =============================================

async function runAllTests() {
  console.log("==============================================");
  console.log("TurboSign JS SDK - Manual Test Suite");
  console.log("==============================================");

  // Check if test PDF exists
  if (!fs.existsSync(TEST_PDF_PATH)) {
    console.error(`\nError: Test PDF not found at ${TEST_PDF_PATH}`);
    console.log("Please add a test PDF file and try again.");
    process.exit(1);
  }

  try {
    // Uncomment and run tests as needed:

    // ===== TurboSign Tests =====

    // Test 1: Create Signature Review Link
    // const reviewDocId = await testCreateSignatureReviewLink();

    // Test 2: Send Signature (creates a new document)
    // const signDocId = await testSendSignature();

    // Test 3: Get Status (replace with actual document ID)
    // await testGetStatus("document-uuid-here");

    // Test 4: Download (replace with actual document ID)
    // await testDownload("document-uuid-here");

    // Test 5: Resend (replace with actual document ID and recipient ID)
    // await testResend("document-uuid-here", ["recipient-uuid-here"]);

    // Test 6: Void (do this last as it cancels the document)
    // await testVoid("document-uuid-here");

    // Test 7: Get Audit Trail (replace with actual document ID)
    // await testGetAuditTrail("document-uuid-here");

    // ===== TurboTemplate Tests =====

    // Test 8: Simple Variable Substitution
    // const simpleDocId = await testSimpleVariables();

    // Test 9: Nested Objects with Dot Notation
    // const nestedDocId = await testNestedObjects();

    // Test 10: Array Loops
    // const loopsDocId = await testArrayLoops();

    // Test 11: Conditionals
    // const conditionalsDocId = await testConditionals();

    // Test 12: Images
    // const imagesDocId = await testImages();

    console.log("\n==============================================");
    console.log("All tests completed successfully!");
    console.log("==============================================");
  } catch (error: any) {
    console.error("\n==============================================");
    console.error("TEST FAILED");
    console.error("==============================================");
    console.error("Error:", error.message || error);
    if (error.statusCode) console.error("Status Code:", error.statusCode);
    if (error.code) console.error("Error Code:", error.code);
    process.exit(1);
  }
}

// Run tests
runAllTests();
