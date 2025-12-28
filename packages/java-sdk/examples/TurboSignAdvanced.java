/**
 * Example 3: Review Link - Advanced Field Types
 *
 * This example demonstrates advanced field types and features:
 * - Multiple field types: signature, date, text, checkbox, company, title
 * - Readonly fields with default values
 * - Required fields
 * - Multiline text fields
 *
 * Use this when: You need complex forms with varied input types
 */

package examples;

import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;

public class TurboSignAdvanced {
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
            byte[] pdfFile = Files.readAllBytes(Paths.get("../../ExampleAssets/advanced-contract.pdf"));

            System.out.println("Creating review link with advanced field types...\n");

            CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(
                new CreateSignatureReviewLinkRequest.Builder()
                    .file(pdfFile)
                    .fileName("advanced-contract.pdf")
                    .documentName("Advanced Contract")
                    .documentDescription("Contract with advanced signature field features")
                    .recipients(Arrays.asList(
                        new Recipient("John Doe", "john@example.com", 1)
                    ))
                    .fields(Arrays.asList(
                        // Signature field
                        new Field.Builder()
                            .type("signature")
                            .recipientEmail("john@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{signature}")
                                .placement("replace")
                                .size(new FieldSize(100, 30))
                                .build())
                            .build(),

                        // Date field
                        new Field.Builder()
                            .type("date")
                            .recipientEmail("john@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{date}")
                                .placement("replace")
                                .size(new FieldSize(75, 30))
                                .build())
                            .build(),

                        // Full name field
                        new Field.Builder()
                            .type("full_name")
                            .recipientEmail("john@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{printed_name}")
                                .placement("replace")
                                .size(new FieldSize(100, 20))
                                .build())
                            .build(),

                        // Readonly field with default value (pre-filled)
                        new Field.Builder()
                            .type("company")
                            .recipientEmail("john@example.com")
                            .defaultValue("TurboDocx")
                            .isReadonly(true)
                            .template(new FieldTemplate.Builder()
                                .anchor("{company}")
                                .placement("replace")
                                .size(new FieldSize(100, 20))
                                .build())
                            .build(),

                        // Required checkbox with default checked
                        new Field.Builder()
                            .type("checkbox")
                            .recipientEmail("john@example.com")
                            .defaultValue("true")
                            .required(true)
                            .template(new FieldTemplate.Builder()
                                .anchor("{terms_checkbox}")
                                .placement("replace")
                                .size(new FieldSize(20, 20))
                                .build())
                            .build(),

                        // Title field
                        new Field.Builder()
                            .type("title")
                            .recipientEmail("john@example.com")
                            .template(new FieldTemplate.Builder()
                                .anchor("{title}")
                                .placement("replace")
                                .size(new FieldSize(75, 30))
                                .build())
                            .build(),

                        // Multiline text field
                        new Field.Builder()
                            .type("text")
                            .recipientEmail("john@example.com")
                            .isMultiline(true)
                            .template(new FieldTemplate.Builder()
                                .anchor("{notes}")
                                .placement("replace")
                                .size(new FieldSize(200, 50))
                                .build())
                            .build()
                    ))
                    .build()
            );

            System.out.println("✅ Review link created!\n");
            System.out.println("Document ID: " + result.getDocumentId());
            System.out.println("Status: " + result.getStatus());
            System.out.println("Preview URL: " + result.getPreviewUrl());

            if (result.getRecipients() != null) {
                System.out.println("\nRecipients:");
                for (RecipientResponse recipient : result.getRecipients()) {
                    System.out.println("  " + recipient.getName() + " (" + recipient.getEmail() + ") - " + recipient.getStatus());
                }
            }

            System.out.println("\nNext steps:");
            System.out.println("1. Review the document at the preview URL");
            System.out.println("2. Send to recipients: client.turboSign().send(documentId)");

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
