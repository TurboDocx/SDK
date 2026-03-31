/**
 * Deliverable JS SDK - Manual Test Suite
 *
 * Run: npx ts-node manual-test-deliverable.ts
 *
 * Make sure to configure the values below before running.
 */

import { Deliverable } from "./src";
import * as fs from "fs";

// =============================================
// CONFIGURE THESE VALUES BEFORE RUNNING
// =============================================
const API_KEY = "your-api-key-here"; // Replace with your actual TurboDocx API key
const BASE_URL = "http://localhost:3000"; // Replace with your API URL
const ORG_ID = "your-organization-id-here"; // Replace with your organization UUID

const TEMPLATE_ID = "your-template-id-here"; // Replace with a valid template UUID
const DELIVERABLE_ID = "your-deliverable-id-here"; // Replace with a valid deliverable UUID

// Initialize client
Deliverable.configure({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
  orgId: ORG_ID,
});

// =============================================
// TEST FUNCTIONS
// =============================================

async function testListDeliverables() {
  console.log("\n--- Test 1: listDeliverables ---");
  const result = await Deliverable.listDeliverables({
    limit: 10,
    offset: 0,
    showTags: true,
  });

  console.log(`Total Records: ${result.totalRecords}`);
  console.log("Results:", JSON.stringify(result.results, null, 2));
  return result;
}

async function testGenerateDeliverable() {
  console.log("\n--- Test 2: generateDeliverable ---");
  const result = await Deliverable.generateDeliverable({
    name: "SDK Manual Test Document",
    templateId: TEMPLATE_ID,
    variables: [
      { placeholder: "{CompanyName}", text: "TechCorp Inc.", mimeType: "text" },
      { placeholder: "{EmployeeName}", text: "John Smith", mimeType: "text" },
    ],
    tags: ["sdk-test", "manual"],
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result.results.deliverable.id;
}

async function testGetDeliverableDetails(deliverableId: string) {
  console.log("\n--- Test 3: getDeliverableDetails ---");
  const result = await Deliverable.getDeliverableDetails(deliverableId, {
    showTags: true,
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result;
}

async function testUpdateDeliverableInfo(deliverableId: string) {
  console.log("\n--- Test 4: updateDeliverableInfo ---");
  const result = await Deliverable.updateDeliverableInfo(deliverableId, {
    name: "SDK Manual Test Document (Updated)",
    tags: ["sdk-test", "manual", "updated"],
  });

  console.log("Result:", JSON.stringify(result, null, 2));
  return result;
}

async function testDeleteDeliverable(deliverableId: string) {
  console.log("\n--- Test 5: deleteDeliverable ---");
  const result = await Deliverable.deleteDeliverable(deliverableId);

  console.log("Result:", JSON.stringify(result, null, 2));
  return result;
}

async function testDownloadSourceFile(deliverableId: string) {
  console.log("\n--- Test 6: downloadSourceFile ---");
  const buffer = await Deliverable.downloadSourceFile(deliverableId);

  console.log(`Result: File received, size: ${buffer.byteLength} bytes`);

  const outputPath = "./downloaded-deliverable.docx";
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`File saved to: ${outputPath}`);

  return buffer;
}

async function testDownloadPDF(deliverableId: string) {
  console.log("\n--- Test 7: downloadPDF ---");
  const buffer = await Deliverable.downloadPDF(deliverableId);

  console.log(`Result: PDF received, size: ${buffer.byteLength} bytes`);

  const outputPath = "./downloaded-deliverable.pdf";
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`File saved to: ${outputPath}`);

  return buffer;
}

// =============================================
// MAIN TEST RUNNER
// =============================================

async function runAllTests() {
  console.log("==============================================");
  console.log("Deliverable JS SDK - Manual Test Suite");
  console.log("==============================================");

  try {
    // Uncomment and run tests as needed:

    // Test 1: List Deliverables
    // await testListDeliverables();

    // Test 2: Generate Deliverable (replace TEMPLATE_ID above)
    // const newId = await testGenerateDeliverable();

    // Test 3: Get Deliverable Details (replace with actual deliverable ID)
    // await testGetDeliverableDetails(DELIVERABLE_ID);

    // Test 4: Update Deliverable Info (replace with actual deliverable ID)
    // await testUpdateDeliverableInfo(DELIVERABLE_ID);

    // Test 5: Delete Deliverable (run last — soft-deletes the deliverable)
    // await testDeleteDeliverable(DELIVERABLE_ID);

    // Test 6: Download Source File (replace with actual deliverable ID)
    // await testDownloadSourceFile(DELIVERABLE_ID);

    // Test 7: Download PDF (replace with actual deliverable ID)
    // await testDownloadPDF(DELIVERABLE_ID);

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
