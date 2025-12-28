/**
 * Example 1: Send Signature Directly - Template Anchors
 *
 * This example sends a document directly to recipients for signature.
 * Uses template anchors like {signature1} and {date1} in your PDF.
 *
 * Use this when: You want to send immediately without review
 */

package examples;

import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;

public class TurboSignSendSimple {
    public static void main(String[] args) {
        try {
            // Configure TurboDocx client
            TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey(getEnv("TURBODOCX_API_KEY", "your-api-key-here"))
                .orgId(getEnv("TURBODOCX_ORG_ID", "your-org-id-here"))
                .senderEmail(getEnv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"))
                .senderName(getEnv("TURBODOCX_SENDER_NAME", "Your Company Name"))
                .build();

            // Read PDF file
            byte[] pdfFile = Files.readAllBytes(Paths.get("../../ExampleAssets/sample-contract.pdf"));

            System.out.println("Sending document directly to recipients...\n");

            SendSignatureResponse result = client.turboSign().sendSignature(
                new SendSignatureRequest.Builder()
                    .file(pdfFile)
                    .fileName("sample-contract.pdf")
                    .documentName("Partnership Agreement")
                    .documentDescription("Q1 2025 Partnership Agreement - Please review and sign")
                    .recipients(Arrays.asList(
                        new Recipient("John Doe", "john@example.com", 1),
                        new Recipient("Jane Smith", "jane@example.com", 2)
                    ))
                    .fields(Arrays.asList(
                        // First recipient's fields - using template anchors
                        new Field.Builder()
                            .type("full_name")
                            .recipientEmail("john@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{name1}")
                                .placement("replace")
                                .size(new FieldSize(100, 30))
                                .build())
                            .build(),
                        new Field.Builder()
                            .type("signature")
                            .recipientEmail("john@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{signature1}")  // Text in your PDF to replace
                                .placement("replace")     // Replace the anchor text
                                .size(new FieldSize(100, 30))
                                .build())
                            .build(),
                        new Field.Builder()
                            .type("date")
                            .recipientEmail("john@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{date1}")
                                .placement("replace")
                                .size(new FieldSize(75, 30))
                                .build())
                            .build(),
                        // Second recipient's fields
                        new Field.Builder()
                            .type("full_name")
                            .recipientEmail("jane@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{name2}")
                                .placement("replace")
                                .size(new FieldSize(100, 30))
                                .build())
                            .build(),
                        new Field.Builder()
                            .type("signature")
                            .recipientEmail("jane@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{signature2}")
                                .placement("replace")
                                .size(new FieldSize(100, 30))
                                .build())
                            .build(),
                        new Field.Builder()
                            .type("date")
                            .recipientEmail("jane@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{date2}")
                                .placement("replace")
                                .size(new FieldSize(75, 30))
                                .build())
                            .build()
                    ))
                    .build()
            );

            System.out.println("✅ Document sent successfully!\n");
            System.out.println("Document ID: " + result.getDocumentId());
            System.out.println("Message: " + result.getMessage());

            // To get sign URLs and recipient details, use getStatus
            try {
                DocumentStatusResponse status = client.turboSign().getStatus(result.getDocumentId());
                if (status.getRecipients() != null) {
                    System.out.println("\nSign URLs:");
                    for (RecipientResponse recipient : status.getRecipients()) {
                        System.out.println("  " + recipient.getName() + ": " + recipient.getSignUrl());
                    }
                }
            } catch (Exception statusError) {
                System.out.println("\nNote: Could not fetch recipient sign URLs");
            }

        } catch (Exception error) {
            System.err.println("Error: " + error.getMessage());
            error.printStackTrace();
        }
    }

    private static String getEnv(String key, String fallback) {
        String value = System.getenv(key);
        return value != null ? value : fallback;
    }
}
