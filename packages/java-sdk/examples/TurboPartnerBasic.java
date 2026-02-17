/**
 * Example: TurboPartner - Partner Portal Management
 *
 * This example demonstrates partner portal operations:
 * - Creating an organization with entitlements
 * - Adding a user to the organization
 * - Creating an organization API key
 * - Querying audit logs
 *
 * Requires: TURBODOCX_PARTNER_API_KEY (TDXP-...) and TURBODOCX_PARTNER_ID
 */

package examples;

import com.turbodocx.TurboPartnerClient;
import com.turbodocx.PartnerScope;
import com.google.gson.JsonObject;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

public class TurboPartnerBasic {
    public static void main(String[] args) {
        try {
            // 1. Configure partner client
            TurboPartnerClient client = new TurboPartnerClient.Builder()
                .partnerApiKey(getEnv("TURBODOCX_PARTNER_API_KEY", "TDXP-your-key-here"))
                .partnerId(getEnv("TURBODOCX_PARTNER_ID", "your-partner-uuid"))
                .build();

            System.out.println("=== TurboPartner Example ===\n");

            // 2. Create an organization with entitlements
            System.out.println("Creating organization...");
            Map<String, Object> features = new LinkedHashMap<>();
            features.put("maxUsers", 25);
            features.put("maxSignatures", 500);
            features.put("hasTDAI", true);

            JsonObject org = client.turboPartner().createOrganization("Acme Corp", null, features);
            String orgId = org.getAsJsonObject("data").get("id").getAsString();
            System.out.println("Created org: " + orgId);

            // 3. Get organization details
            System.out.println("\nFetching organization details...");
            JsonObject details = client.turboPartner().getOrganizationDetails(orgId);
            System.out.println("Name: " + details.getAsJsonObject("data")
                .getAsJsonObject("organization").get("name").getAsString());

            // 4. Add a user to the organization
            System.out.println("\nAdding user to organization...");
            JsonObject user = client.turboPartner().addUserToOrganization(
                orgId, "admin@acmecorp.com", "admin");
            System.out.println("Added user: " + user.getAsJsonObject("data").get("email").getAsString());

            // 5. Create an organization API key
            System.out.println("\nCreating organization API key...");
            JsonObject apiKey = client.turboPartner().createOrganizationApiKey(
                orgId, "Production Key", "admin");
            System.out.println("API Key: " + apiKey.getAsJsonObject("data").get("key").getAsString());

            // 6. List organizations
            System.out.println("\nListing organizations...");
            JsonObject orgs = client.turboPartner().listOrganizations(10, null, null);
            int total = orgs.getAsJsonObject("data").get("totalRecords").getAsInt();
            System.out.println("Total organizations: " + total);

            // 7. Query audit logs
            System.out.println("\nFetching audit logs...");
            JsonObject logs = client.turboPartner().getPartnerAuditLogs(
                5, null, null, null, null, null, null, null, null);
            System.out.println("Audit log entries: " +
                logs.getAsJsonObject("data").getAsJsonArray("results").size());

            // 8. Clean up - delete the test organization
            System.out.println("\nCleaning up...");
            client.turboPartner().deleteOrganization(orgId);
            System.out.println("Deleted org: " + orgId);

            System.out.println("\n=== Done ===");

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
