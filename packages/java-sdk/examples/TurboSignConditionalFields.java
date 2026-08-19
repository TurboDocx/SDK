/**
 * Example: Conditional (IF/THEN) Fields
 *
 * A checkbox can control other fields so signers only see what applies to them:
 *   - Give a "checkbox" field a stable metadata via FieldMetadata.forFieldKey("...").
 *   - Give a dependent field FieldMetadata.forConditional(new FieldConditional(key, operator, action)).
 *       operator: "is_checked" | "is_not_checked"  -- when the rule fires.
 *       action:   "show"   (hidden until the rule fires)
 *                 "unlock" (visible but read-only until the rule fires).
 *
 * One checkbox can drive any number of dependent fields -- give them the same
 * controllingFieldKey. Uses createSignatureReviewLink (no emails are sent).
 */

package examples;

import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;

public class TurboSignConditionalFields {
    public static void main(String[] args) {
        try {
            TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey(getEnv("TURBODOCX_API_KEY", "your-api-key-here"))
                .orgId(getEnv("TURBODOCX_ORG_ID", "your-org-id-here"))
                .senderEmail(getEnv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"))
                .senderName(getEnv("TURBODOCX_SENDER_NAME", "Your Company Name"))
                .build();

            byte[] pdfFile = Files.readAllBytes(Paths.get("../../ExampleAssets/advanced-contract.pdf"));

            System.out.println("Creating a review link with conditional fields...");

            CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(
                new CreateSignatureReviewLinkRequest.Builder()
                    .file(pdfFile)
                    .fileName("advanced-contract.pdf")
                    .documentName("Conditional Fields Demo")
                    .recipients(Arrays.asList(
                        new Recipient("John Doe", "john@example.com", 1)
                    ))
                    .fields(Arrays.asList(
                        // Controlling checkboxes -- each carries a stable fieldKey.
                        new Field.Builder().type("checkbox").recipientEmail("john@example.com").page(1).x(60).y(120).width(20).height(20)
                            .metadata(FieldMetadata.forFieldKey("request_changes")).build(),
                        new Field.Builder().type("checkbox").recipientEmail("john@example.com").page(1).x(60).y(300).width(20).height(20)
                            .metadata(FieldMetadata.forFieldKey("override_amount")).build(),
                        new Field.Builder().type("checkbox").recipientEmail("john@example.com").page(1).x(60).y(480).width(20).height(20)
                            .metadata(FieldMetadata.forFieldKey("consent")).build(),

                        // show + is_checked -- HIDDEN until "request_changes" is checked.
                        new Field.Builder().type("text").recipientEmail("john@example.com").page(1).x(120).y(120).width(260).height(40)
                            .metadata(FieldMetadata.forConditional(new FieldConditional("request_changes", "is_checked", "show"))).build(),
                        // ONE checkbox driving a SECOND dependent (same controllingFieldKey) -- a signature.
                        new Field.Builder().type("signature").recipientEmail("john@example.com").page(1).x(120).y(180).width(200).height(50)
                            .metadata(FieldMetadata.forConditional(new FieldConditional("request_changes", "is_checked", "show"))).build(),

                        // unlock + is_checked -- VISIBLE but locked until "override_amount" is checked.
                        new Field.Builder().type("text").recipientEmail("john@example.com").page(1).x(120).y(300).width(150).height(30).defaultValue("1000.00")
                            .metadata(FieldMetadata.forConditional(new FieldConditional("override_amount", "is_checked", "unlock"))).build(),

                        // show + is_not_checked -- a "please explain" box shown only while consent is WITHHELD.
                        new Field.Builder().type("text").recipientEmail("john@example.com").page(1).x(120).y(480).width(260).height(40)
                            .metadata(FieldMetadata.forConditional(new FieldConditional("consent", "is_not_checked", "show"))).build(),

                        // A normal required signature with no rule -- always visible, always required.
                        new Field.Builder().type("signature").recipientEmail("john@example.com").page(1).x(120).y(620).width(200).height(50).required(true).build()
                    ))
                    .build()
            );

            System.out.println("✅ Review link created!");
            System.out.println("Document ID: " + result.getDocumentId());
            System.out.println("Preview URL: " + result.getPreviewUrl());

            // Validation: a malformed rule (unknown operator/action, or a missing/empty
            //   controllingFieldKey) is rejected with HTTP 400 and code "InvalidConditionalRule".
            // Fail-open: a well-formed rule whose controllingFieldKey matches NO checkbox is NOT an
            //   error -- the dependent field stays visible/editable. Double-check your keys match.
        } catch (Exception error) {
            System.out.println("Error: " + error.getMessage());
        }
    }

    private static String getEnv(String key, String fallback) {
        String value = System.getenv(key);
        return (value != null && !value.isEmpty()) ? value : fallback;
    }
}
