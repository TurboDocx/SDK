/**
 * Example: Send a Template Set Up in TurboDocx (Signer Roles)
 *
 * Set the template up once in TurboDocx:
 *   1. Upload a PDF as a template.
 *   2. On its Signatures tab, add each signer as a role (e.g. "Client", "Countersigner").
 *      Tick "Fill in name and email when sending" for a role that changes every time;
 *      give a role a name and email when it's always the same person (e.g. your countersigner).
 *   3. Drag each role's fields onto the PDF and save the signature setup.
 *
 * Then send it from code by naming each recipient's role. The fields saved for that role come
 * with it, so you never pass coordinates or anchors.
 *
 * Use this when: the same document goes out again and again with different signers.
 *
 * Run with: TEMPLATE_ID=<your template id> (compile and run this class like the other examples)
 */

package examples;

import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;
import java.util.Collections;

public class TurboSignTemplateRoles {
    public static void main(String[] args) {
        try {
            TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey(getEnv("TURBODOCX_API_KEY", "your-api-key-here"))
                .orgId(getEnv("TURBODOCX_ORG_ID", "your-org-id-here"))
                .senderEmail(getEnv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"))
                .senderName(getEnv("TURBODOCX_SENDER_NAME", "Your Company Name"))
                .build();

            String templateId = getEnv("TEMPLATE_ID", "your-template-id-here");

            // 1. See the template's roles. The keys are also shown under "Use via API" on the
            //    template's page in TurboDocx.
            TemplateSignatureSetup setup = client.turboSign().getTemplateSignatureSetup(templateId);

            System.out.println("Template roles (in signing order):");
            for (TemplateSignatureRole role : setup.getRoles()) {
                String signer = role.hasSavedSigner()
                    ? "saved signer " + role.getDefaultName() + " <" + role.getDefaultEmail() + ">"
                    : "filled in when sending";
                System.out.println("  " + role.getOrder() + ". " + role.getKey() + " ("
                    + role.getLabel() + "): " + signer + ", " + role.getFieldCount() + " field(s)");
            }

            // 2. Pass a recipient for every role filled in when sending. A role with a saved signer
            //    can be left out (its saved signer is used), or passed to send to someone else this time.
            SendSignatureResponse result = client.turboSign().sendSignature(
                new SendSignatureRequest.Builder()
                    .templateId(templateId)
                    .recipients(Collections.singletonList(
                        Recipient.withRole("client", "Jane Doe", "jane@client.com")
                        // "countersigner" left out: the signer saved on the template is used
                    ))
                    // No fields: the template's saved fields come with each role. Any fields you
                    // add here are placed in addition to them (e.g. an extra witness signature).
                    .build()
            );

            System.out.println("\n✅ Document sent!");
            System.out.println("Document ID: " + result.getDocumentId());

            // 3. Track it like any other document.
            try {
                DocumentRecipientsResponse progress = client.turboSign().getRecipients(result.getDocumentId());
                DocumentRecipientsResponse.RecipientStatusSummary summary = progress.getSummary();
                System.out.println("\n" + summary.getCompleted() + " of " + summary.getTotal()
                    + " signed, still waiting on " + summary.getWaitingOn());
                for (DocumentRecipientsResponse.RecipientSignatureStatus recipient : progress.getRecipients()) {
                    System.out.println("  " + recipient.getName() + " <" + recipient.getEmail() + ">: "
                        + recipient.getEffectiveStatus());
                }
            } catch (Exception statusError) {
                System.out.println("\nNote: Could not fetch recipient status");
            }

        } catch (Exception error) {
            // A role the template doesn't have, or a role with no saved signer that you left out,
            // comes back as a validation error whose message names the role and lists the valid ones.
            System.err.println("Error: " + error.getMessage());
            error.printStackTrace();
        }
    }

    private static String getEnv(String key, String fallback) {
        String value = System.getenv(key);
        return value != null ? value : fallback;
    }
}
