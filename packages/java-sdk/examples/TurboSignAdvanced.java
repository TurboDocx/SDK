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
                        new Field(
                            "signature",
                            null, null, null, null, null,
                            "john@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{signature}",
                                null,
                                "replace",
                                new Field.Size(100, 30),
                                null, null, null
                            )
                        ),

                        // Date field
                        new Field(
                            "date",
                            null, null, null, null, null,
                            "john@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{date}",
                                null,
                                "replace",
                                new Field.Size(75, 30),
                                null, null, null
                            )
                        ),

                        // Full name field
                        new Field(
                            "full_name",
                            null, null, null, null, null,
                            "john@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{printed_name}",
                                null,
                                "replace",
                                new Field.Size(100, 20),
                                null, null, null
                            )
                        ),

                        // Readonly field with default value (pre-filled)
                        new Field(
                            "company",
                            null, null, null, null, null,
                            "john@example.com",
                            "TurboDocx",
                            null,
                            true,  // isReadonly
                            null,
                            null,
                            new Field.TemplateAnchor(
                                "{company}",
                                null,
                                "replace",
                                new Field.Size(100, 20),
                                null, null, null
                            )
                        ),

                        // Required checkbox with default checked
                        new Field(
                            "checkbox",
                            null, null, null, null, null,
                            "john@example.com",
                            "true",
                            null,
                            null,
                            true,  // required
                            null,
                            new Field.TemplateAnchor(
                                "{terms_checkbox}",
                                null,
                                "replace",
                                new Field.Size(20, 20),
                                null, null, null
                            )
                        ),

                        // Title field
                        new Field(
                            "title",
                            null, null, null, null, null,
                            "john@example.com",
                            null, null, null, null, null,
                            new Field.TemplateAnchor(
                                "{title}",
                                null,
                                "replace",
                                new Field.Size(75, 30),
                                null, null, null
                            )
                        ),

                        // Multiline text field
                        new Field(
                            "text",
                            null, null, null, null, null,
                            "john@example.com",
                            null,
                            true,  // isMultiline
                            null,
                            null,
                            null,
                            new Field.TemplateAnchor(
                                "{notes}",
                                null,
                                "replace",
                                new Field.Size(200, 50),
                                null, null, null
                            )
                        )
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
