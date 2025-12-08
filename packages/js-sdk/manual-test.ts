/// <reference types="node" />
import { TurboSign } from "./src";
import * as fs from "fs";

// =============================================
// CONFIGURE THESE VALUES BEFORE RUNNING
// =============================================
TurboSign.configure({
  apiKey: "TDX-your-api-key-here", // Replace with your actual TurboDocx API key
  baseUrl: "http://localhost:3000", // Replace with your API URL
  orgId: "your-organization-uuid-here", // Replace with your organization UUID
});

const TEST_PDF_PATH = "/path/to/your/test-document.pdf"; // Replace with path to your test PDF/DOCX
const TEST_EMAIL = "test-recipient@example.com"; // Replace with a real email to receive notifications

// =============================================
// TEST FUNCTIONS
// =============================================

async function testPrepareForReview() {
  console.log("\n--- Test 1: prepareForReview ---");
  const pdfBuffer = fs.readFileSync(TEST_PDF_PATH);

  const result = await TurboSign.prepareForReview({
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

async function testPrepareForSigningSingle() {
  console.log("\n--- Test 2: prepareForSigningSingle ---");
  const pdfBuffer = fs.readFileSync(TEST_PDF_PATH);

  const result = await TurboSign.prepareForSigningSingle({
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
    senderName: "Test Sender",
    senderEmail: "sender@example.com",
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

    // Test 1: Prepare for Review
    // const reviewDocId = await testPrepareForReview();

    // Test 2: Prepare for Signing (creates a new document)
    // const signDocId = await testPrepareForSigningSingle();

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
