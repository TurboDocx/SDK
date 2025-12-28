/**
 * Example 2: Review Link - Template Anchors
 *
 * This example creates a review link first, then sends manually.
 * Uses template anchors like {signature1} and {date1} in your PDF.
 *
 * Use this when: You want to review the document before sending
 */

package examples;

import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;

public class TurboSignBasic {
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

            System.out.println("Creating review link with template anchors...\n");

            CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(
                new CreateSignatureReviewLinkRequest.Builder()
                    .file(pdfFile)
                    .fileName("sample-contract.pdf")
                    .documentName("Contract Agreement")
                    .documentDescription("This document requires electronic signatures from both parties.")
                    .recipients(Arrays.asList(
                        new Recipient("John Doe", "john@example.com", 1),
                        new Recipient("Jane Smith", "jane@example.com", 2)
                    ))
                    .fields(Arrays.asList(
                        // First recipient - using template anchors
                        new Field.Builder()
                            .type("full_name")
                            .recipientEmail("john@example.com")
                            .template(new Field.TemplateAnchor.Builder()
                                .anchor("{name1}")
                                .placement("replace")
                                .size(new Field.Size(100, 30))
                                .build())
                            .build(),
                        new Field.Builder()
                            .type("signature")
                            .recipientEmail("john@example.com")
                            .template(new Field.TemplateAnchor.Builder()
                                .anchor("{signature1}")
                                .placement("replace")
                                .size(new Field.Size(100, 30))
                                .build())
                            .build(),
                        new Field.Builder()
                            .type("date")
                            .recipientEmail("john@example.com")
                            .template(new Field.TemplateAnchor.Builder()
                                .anchor("{date1}")
                                .placement("replace")
                                .size(new Field.Size(75, 30))
                                .build())
                            .build(),
                        // Second recipient
                        new Field.Builder()
                            .type("full_name")
                            .recipientEmail("jane@example.com")
                            .template(new Field.TemplateAnchor.Builder()
                                .anchor("{name2}")
                                .placement("replace")
                                .size(new Field.Size(100, 30))
                                .build())
                            .build(),
                        new Field.Builder()
                            .type("signature")
                            .recipientEmail("jane@example.com")
                            .template(new Field.TemplateAnchor.Builder()
                                .anchor("{signature2}")
                                .placement("replace")
                                .size(new Field.Size(100, 30))
                                .build())
                            .build(),
                        new Field.Builder()
                            .type("date")
                            .recipientEmail("jane@example.com")
                            .template(new Field.TemplateAnchor.Builder()
                                .anchor("{date2}")
                                .placement("replace")
                                .size(new Field.Size(75, 30))
                                .build())
                            .build()
                    ))
                    .build()
            );

            System.out.println("\n✅ Review link created!");
            System.out.println("Document ID: " + result.getDocumentId());
            System.out.println("Status: " + result.getStatus());
            System.out.println("Preview URL: " + result.getPreviewUrl());

            if (result.getRecipients() != null) {
                System.out.println("\nRecipients:");
                for (RecipientResponse recipient : result.getRecipients()) {
                    System.out.println("  " + recipient.getName() + " (" + recipient.getEmail() + ") - " + recipient.getStatus());
                }
            }

            System.out.println("\nYou can now:");
            System.out.println("1. Review the document at the preview URL");
            System.out.println("2. Send to recipients using: client.turboSign().send(documentId)");

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
