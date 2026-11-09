/**
 * Example: Anchored Fields on a Template's Signature Setup
 *
 * An anchored field ties a signature field to a tag such as {ClientSign} in a Word template, for
 * one signer role. Wherever the tag appears in a document generated from the template, the field
 * goes there, sized to fit the tag.
 *
 * Before you run it:
 *   - A Word template containing the tag, with at least one signer role saved on its Signatures tab.
 *   - A deliverable generated from that template in which the tag still appears as text. Generate
 *     it after the tag is a signature field, or give the tag's variable its own tag as the value.
 *
 * Environment:
 *   TURBODOCX_API_KEY       an administrator or contributor API key
 *   TURBODOCX_ORG_ID        your organization id
 *   TURBODOCX_SENDER_EMAIL  the sender shown on the document
 *   TURBODOCX_BASE_URL      optional, defaults to https://api.turbodocx.com
 *   TEMPLATE_ID             the Word template
 *   DELIVERABLE_ID          a deliverable generated from that template
 *   ROLE_KEY                optional, the signer role that fills the tag (default "client")
 *   ANCHOR_TAG              optional, the tag (default "{ClientSign}")
 *   SIGNER_NAME, SIGNER_EMAIL  optional, who the review link is prepared for
 *
 * Run with: TEMPLATE_ID=... DELIVERABLE_ID=... (compile and run this class like the other examples)
 */

package examples;

import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;
import java.util.Collections;
import java.util.List;

public class TurboSignAnchoredFields {
    public static void main(String[] args) {
        try {
            TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey(getEnv("TURBODOCX_API_KEY", "your-api-key-here"))
                .orgId(getEnv("TURBODOCX_ORG_ID", "your-org-id-here"))
                .senderEmail(getEnv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"))
                .senderName(getEnv("TURBODOCX_SENDER_NAME", "Your Company Name"))
                .baseUrl(getEnv("TURBODOCX_BASE_URL", "https://api.turbodocx.com"))
                .build();

            String templateId = getEnv("TEMPLATE_ID", "your-template-id-here");
            String deliverableId = getEnv("DELIVERABLE_ID", "your-deliverable-id-here");
            String roleKey = getEnv("ROLE_KEY", "client");
            String anchor = getEnv("ANCHOR_TAG", "{ClientSign}");
            String signerName = getEnv("SIGNER_NAME", "Jane Doe");
            String signerEmail = getEnv("SIGNER_EMAIL", "jane@example.com");

            // 1. Save a signature field on the tag for the role. Adding the same type on the same tag
            //    for the same role again returns the existing field.
            AddTemplateSignatureAnchorResponse added = client.turboSign().addTemplateSignatureAnchor(
                new AddTemplateSignatureAnchorRequest.Builder()
                    .templateId(templateId)
                    .roleKey(roleKey)
                    .type("signature")
                    .anchor(anchor)
                    .build()
            );
            String fieldId = added.getFieldId();
            System.out.println("1. Anchored field " + fieldId + " added on " + anchor + " for role \"" + roleKey + "\"");
            if (added.isTagBecameSignatureField()) {
                System.out.println("   The tag is now a signature field, not a text variable");
            }

            // 2. Read the setup back: every anchored field, and how many each role has.
            TemplateSignatureSetup setup = client.turboSign().getTemplateSignatureSetup(templateId);
            System.out.println("2. Anchored fields on the template:");
            for (TemplateSignatureAnchor a : setup.getAnchors()) {
                String missing = a.isNotFound() ? ", tag not in the template" : "";
                System.out.println("   " + a.getAnchor() + " -> " + a.getRoleKey() + " (" + a.getType() + ")" + missing);
            }
            for (TemplateSignatureRole role : setup.getRoles()) {
                System.out.println("   Role " + role.getKey() + ": " + role.getAnchoredFieldCount()
                    + " anchored of " + role.getFieldCount() + " field(s)");
            }

            // 3. Prepare the deliverable for signing with your own field on the tag.
            //    applySignatureSetup matches it to the saved anchored field (same tag and type), so it
            //    fits the tag and a tag missing from the document is skipped instead of failing.
            //    A review link sends no email; sendSignature takes the same request and emails the signer.
            CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(
                new CreateSignatureReviewLinkRequest.Builder()
                    .deliverableId(deliverableId)
                    .documentName("Anchored Fields Example")
                    .applySignatureSetup(true)
                    .recipients(Collections.singletonList(new Recipient(signerName, signerEmail, 1)))
                    .fields(Collections.singletonList(
                        new Field.Builder()
                            .type("signature")
                            .recipientEmail(signerEmail)
                            .template(new Field.TemplateAnchor.Builder().anchor(anchor).build())
                            .build()
                    ))
                    .build()
            );
            System.out.println("3. Review link ready for document " + result.getDocumentId());
            System.out.println("   Preview: " + result.getPreviewUrl());

            // 4. Remove the anchored field. The tag goes back to being a text variable.
            RemoveTemplateSignatureAnchorResponse removed =
                client.turboSign().removeTemplateSignatureAnchor(templateId, fieldId);
            Object fields = removed.getSignatureSetup().get("fields");
            int left = fields instanceof List ? ((List<?>) fields).size() : 0;
            System.out.println("4. Anchored field " + fieldId + " removed, " + left + " field(s) left in the setup");

        } catch (Exception error) {
            // A role the template doesn't have is a NotFoundException (SignerRoleNotFound); a tag held
            // by another role, or already holding a different field, is a ConflictException.
            System.err.println("Error: " + error.getMessage());
            System.exit(1);
        }
    }

    private static String getEnv(String key, String fallback) {
        String value = System.getenv(key);
        return value != null ? value : fallback;
    }
}
