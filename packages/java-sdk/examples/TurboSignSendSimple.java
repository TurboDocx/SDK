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
                        new Field(
                            "full_name",
                            null, null, null, null, null,
                            "john@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{name1}",
                                null,
                                "replace",
                                new Field.Size(100, 30),
                                null, null, null
                            )
                        ),
                        new Field(
                            "signature",
                            null, null, null, null, null,
                            "john@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{signature1}",  // Text in your PDF to replace
                                null,
                                "replace",       // Replace the anchor text
                                new Field.Size(100, 30),
                                null, null, null
                            )
                        ),
                        new Field(
                            "date",
                            null, null, null, null, null,
                            "john@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{date1}",
                                null,
                                "replace",
                                new Field.Size(75, 30),
                                null, null, null
                            )
                        ),
                        // Second recipient's fields
                        new Field(
                            "full_name",
                            null, null, null, null, null,
                            "jane@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{name2}",
                                null,
                                "replace",
                                new Field.Size(100, 30),
                                null, null, null
                            )
                        ),
                        new Field(
                            "signature",
                            null, null, null, null, null,
                            "jane@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{signature2}",
                                null,
                                "replace",
                                new Field.Size(100, 30),
                                null, null, null
                            )
                        ),
                        new Field(
                            "date",
                            null, null, null, null, null,
                            "jane@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{date2}",
                                null,
                                "replace",
                                new Field.Size(75, 30),
                                null, null, null
                            )
                        )
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
