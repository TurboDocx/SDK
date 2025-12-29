package com.turbodocx;

/*
 * TurboSign Java SDK - Manual Test Suite
 *
 * Run: mvn exec:java -Dexec.mainClass="com.turbodocx.ManualTest"
 *
 * Make sure to configure the values below before running.
 */

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.turbodocx.models.*;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

public class ManualTest {

    // =============================================
    // CONFIGURE THESE VALUES BEFORE RUNNING
    // =============================================
    private static final String API_KEY = "TDX-your-api-key-here"; // Replace with your actual TurboDocx API key
    private static final String BASE_URL = "http://localhost:3000"; // Replace with your API URL
    private static final String ORG_ID = "your-organization-uuid-here"; // Replace with your organization UUID

    private static final String TEST_PDF_PATH = "/path/to/your/test-document.pdf"; // Replace with path to your test PDF/DOCX
    private static final String TEST_EMAIL = "test-recipient@example.com"; // Replace with a real email to receive notifications
    private static final String FILE_URL = "https://example.com/sample-document.pdf"; // Replace with publicly accessible PDF URL

    private static TurboDocxClient client;
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public static void main(String[] args) {
        System.out.println("==============================================");
        System.out.println("TurboSign Java SDK - Manual Test Suite");
        System.out.println("==============================================");

        // Check if test PDF exists
        if (!new File(TEST_PDF_PATH).exists()) {
            System.out.println("\nError: Test PDF not found at " + TEST_PDF_PATH);
            System.out.println("Please add a test PDF file and update TEST_PDF_PATH.");
            System.exit(1);
        }

        // Initialize client
        client = new TurboDocxClient.Builder()
                .apiKey(API_KEY)
                .baseUrl(BASE_URL)
                .orgId(ORG_ID)
                .senderEmail("sender@example.com")   // Reply-to email for signature requests
                .senderName("Your Company Name")    // Sender name shown in emails
                .build();

        try {
            // Uncomment and run tests as needed:

            // Test 1: Prepare for Review
            // String reviewDocId = testPrepareForReview();

            // Test 2: Prepare for Signing (creates a new document)
            // String signDocId = testPrepareForSigningSingle();

            // Test 3: Get Status (replace with actual document ID)
            // testGetStatus("document-uuid-here");

            // Test 4: Download (replace with actual document ID)
            // testDownload("document-uuid-here");

            // Test 5: Resend (replace with actual document ID and recipient ID)
            // testResend("document-uuid-here", Arrays.asList("recipient-uuid-here"));

            // Test 6: Void (do this last as it cancels the document)
            // testVoid("document-uuid-here");

            // Test 7: Get Audit Trail (replace with actual document ID)
            // testGetAuditTrail("document-uuid-here");

            System.out.println("\n==============================================");
            System.out.println("All tests completed successfully!");
            System.out.println("==============================================");

        } catch (TurboDocxException e) {
            System.out.println("\n==============================================");
            System.out.println("TEST FAILED");
            System.out.println("==============================================");
            System.out.println("Error: " + e.getMessage());
            System.out.println("Status Code: " + e.getStatusCode());
            if (e.getCode() != null) {
                System.out.println("Error Code: " + e.getCode());
            }
            System.exit(1);
        } catch (Exception e) {
            System.out.println("\n==============================================");
            System.out.println("TEST FAILED");
            System.out.println("==============================================");
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }

    // =============================================
    // TEST FUNCTIONS
    // =============================================

    private static String testPrepareForReview() throws IOException {
        System.out.println("\n--- Test 1: createSignatureReviewLink (using fileLink) ---");

        // Using fileLink instead of file upload
        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .fileLink(FILE_URL)
                .recipients(Arrays.asList(
                        new Recipient("Signer One", TEST_EMAIL, 1)
                ))
                .fields(Arrays.asList(
                        new Field("signature", 1, 100, 550, 200, 50, TEST_EMAIL),
                        new Field("checkbox", 1, 320, 550, 50, 50, TEST_EMAIL, "true", null, null, null, null, null)
                ))
                .documentName("Review Test Document (fileLink)")
                .build();

        CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(request);
        System.out.println("Result: " + gson.toJson(result));
        return result.getDocumentId();
    }

    private static String testPrepareForSigningSingle() throws IOException {
        System.out.println("\n--- Test 2: sendSignature (using file buffer with template fields) ---");

        byte[] pdfBytes = Files.readAllBytes(Paths.get(TEST_PDF_PATH));

        // Template-based field using anchor text (like Python test)
        Field.TemplateAnchor templateAnchor = new Field.TemplateAnchor(
                "{hello}",           // anchor text to find
                null,                // searchText (alternative to anchor)
                "replace",           // placement: replace/before/after/above/below
                new Field.Size(200, 80),    // size
                new Field.Offset(0, 0),     // offset
                true,                // caseSensitive
                false                // useRegex
        );

        // Field with template anchor (no page/x/y coordinates needed)
        Field templateField = new Field(
                "text",              // type
                null,                // page (null for template-based)
                null,                // x (null for template-based)
                null,                // y (null for template-based)
                null,                // width (null, using template size)
                null,                // height (null, using template size)
                TEST_EMAIL,          // recipientEmail
                "Amit",              // defaultValue
                true,                // isMultiline
                null,                // isReadonly
                true,                // required
                null,                // backgroundColor
                templateAnchor       // template anchor config
        );

        // Coordinate-based field (traditional approach)
        Field coordinateField = new Field(
                "last_name",         // type
                1,                   // page
                100,                 // x
                650,                 // y
                200,                 // width
                50,                  // height
                TEST_EMAIL,          // recipientEmail
                "Sharma",            // defaultValue
                null,                // isMultiline
                null,                // isReadonly
                null,                // required
                null,                // backgroundColor
                null                 // no template (coordinate-based)
        );

        SendSignatureRequest request = new SendSignatureRequest.Builder()
                .file(pdfBytes)
                .recipients(Arrays.asList(
                        new Recipient("Test User", TEST_EMAIL, 1)
                ))
                .fields(Arrays.asList(templateField, coordinateField))
                .documentName("Signing Test Document (Template Fields)")
                .documentDescription("Testing template-based field positioning")
                .ccEmails(Arrays.asList("cc@example.com"))
                .build();

        SendSignatureResponse result = client.turboSign().sendSignature(request);
        System.out.println("Result: " + gson.toJson(result));
        return result.getDocumentId();
    }

    private static void testGetStatus(String documentId) throws IOException {
        System.out.println("\n--- Test 3: getStatus ---");

        DocumentStatusResponse result = client.turboSign().getStatus(documentId);
        System.out.println("Result: " + gson.toJson(result));
    }

    private static void testDownload(String documentId) throws IOException {
        System.out.println("\n--- Test 4: download ---");

        byte[] result = client.turboSign().download(documentId);
        System.out.println("Result: PDF received, size: " + result.length + " bytes");

        // Save to file
        String outputPath = "./downloaded-document.pdf";
        try (FileOutputStream fos = new FileOutputStream(outputPath)) {
            fos.write(result);
        }
        System.out.println("File saved to: " + outputPath);
    }

    private static void testResend(String documentId, List<String> recipientIds) throws IOException {
        System.out.println("\n--- Test 5: resendEmail ---");

        ResendEmailResponse result = client.turboSign().resendEmail(documentId, recipientIds);
        System.out.println("Result: " + gson.toJson(result));
    }

    private static void testVoid(String documentId) throws IOException {
        System.out.println("\n--- Test 6: voidDocument ---");

        VoidDocumentResponse result = client.turboSign().voidDocument(documentId, "Testing void functionality");
        System.out.println("Result: " + gson.toJson(result));
    }

    private static void testGetAuditTrail(String documentId) throws IOException {
        System.out.println("\n--- Test 7: getAuditTrail ---");

        AuditTrailResponse result = client.turboSign().getAuditTrail(documentId);
        System.out.println("Result: " + gson.toJson(result));
    }
}
