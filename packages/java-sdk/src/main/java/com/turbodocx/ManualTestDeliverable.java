package com.turbodocx;

/*
 * Deliverable Java SDK - Manual Test Suite
 *
 * Run: mvn exec:java -Dexec.mainClass="com.turbodocx.ManualTestDeliverable"
 *
 * Make sure to configure the values below before running.
 */

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.turbodocx.models.deliverable.*;

import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Arrays;

public class ManualTestDeliverable {

    // =============================================
    // CONFIGURE THESE VALUES BEFORE RUNNING
    // =============================================
    private static final String API_KEY = "your-api-key-here"; // Replace with your actual TurboDocx API key
    private static final String BASE_URL = "http://localhost:3000"; // Replace with your API URL
    private static final String ORG_ID = "your-organization-id-here"; // Replace with your organization UUID

    private static final String TEMPLATE_ID = "your-template-id-here"; // Replace with a valid template UUID
    private static final String DELIVERABLE_ID = "your-deliverable-id-here"; // Replace with a valid deliverable UUID
    private static final String DELIVERABLE_ITEM_ID = "your-deliverable-item-id-here"; // Replace with a valid deliverable item UUID

    private static DeliverableClient client;
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public static void main(String[] args) {
        System.out.println("==============================================");
        System.out.println("Deliverable Java SDK - Manual Test Suite");
        System.out.println("==============================================");

        // Initialize client (no senderEmail needed for Deliverable)
        client = new TurboDocxClient.Builder()
                .apiKey(API_KEY)
                .baseUrl(BASE_URL)
                .orgId(ORG_ID)
                .buildDeliverableClient();

        try {
            // Uncomment and run tests as needed:

            // Test 1: List Deliverables
            // testListDeliverables();

            // Test 2: Generate Deliverable (replace TEMPLATE_ID above)
            // String newId = testGenerateDeliverable();

            // Test 3: Get Deliverable Details (replace with actual deliverable ID)
            // testGetDeliverableDetails(DELIVERABLE_ID);

            // Test 4: Update Deliverable Info (replace with actual deliverable ID)
            // testUpdateDeliverableInfo(DELIVERABLE_ID);

            // Test 5: Delete Deliverable (run last — soft-deletes the deliverable)
            // testDeleteDeliverable(DELIVERABLE_ID);

            // Test 6: Download Source File (replace with actual deliverable ID)
            // testDownloadSourceFile(DELIVERABLE_ID);

            // Test 7: Download PDF (replace with actual deliverable ID)
            // testDownloadPDF(DELIVERABLE_ID);

            // Test 8: List Deliverable Items
            // testListDeliverableItems();

            // Test 9: Get Deliverable Item (replace with actual deliverable item ID)
            // testGetDeliverableItem(DELIVERABLE_ITEM_ID);

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

    private static void testListDeliverables() throws IOException {
        System.out.println("\n--- Test 1: listDeliverables ---");

        ListDeliverablesRequest request = new ListDeliverablesRequest();
        request.setLimit(10);
        request.setOffset(0);
        request.setShowTags(true);

        DeliverableListResponse result = client.listDeliverables(request);
        System.out.println("Total Records: " + result.getTotalRecords());
        System.out.println("Result: " + gson.toJson(result));
    }

    private static String testGenerateDeliverable() throws IOException {
        System.out.println("\n--- Test 2: generateDeliverable ---");

        CreateDeliverableRequest request = new CreateDeliverableRequest(
                "SDK Manual Test Document",
                TEMPLATE_ID,
                Arrays.asList(
                        new DeliverableVariable("{CompanyName}", "TechCorp Inc.", "text"),
                        new DeliverableVariable("{EmployeeName}", "John Smith", "text")
                )
        );
        request.setTags(Arrays.asList("sdk-test", "manual"));

        CreateDeliverableResponse result = client.generateDeliverable(request);
        System.out.println("Result: " + gson.toJson(result));
        return result.getResults().getDeliverable().getId();
    }

    private static void testGetDeliverableDetails(String deliverableId) throws IOException {
        System.out.println("\n--- Test 3: getDeliverableDetails ---");

        DeliverableRecord result = client.getDeliverableDetails(deliverableId, true);
        System.out.println("Result: " + gson.toJson(result));
    }

    private static void testUpdateDeliverableInfo(String deliverableId) throws IOException {
        System.out.println("\n--- Test 4: updateDeliverableInfo ---");

        UpdateDeliverableRequest request = new UpdateDeliverableRequest();
        request.setName("SDK Manual Test Document (Updated)");
        request.setTags(Arrays.asList("sdk-test", "manual", "updated"));

        UpdateDeliverableResponse result = client.updateDeliverableInfo(deliverableId, request);
        System.out.println("Result: " + gson.toJson(result));
    }

    private static void testDeleteDeliverable(String deliverableId) throws IOException {
        System.out.println("\n--- Test 5: deleteDeliverable ---");

        DeleteDeliverableResponse result = client.deleteDeliverable(deliverableId);
        System.out.println("Result: " + gson.toJson(result));
    }

    private static void testDownloadSourceFile(String deliverableId) throws IOException {
        System.out.println("\n--- Test 6: downloadSourceFile ---");

        byte[] result = client.downloadSourceFile(deliverableId);
        System.out.println("Result: File received, size: " + result.length + " bytes");

        String outputPath = "./downloaded-deliverable.docx";
        try (FileOutputStream fos = new FileOutputStream(outputPath)) {
            fos.write(result);
        }
        System.out.println("File saved to: " + outputPath);
    }

    private static void testDownloadPDF(String deliverableId) throws IOException {
        System.out.println("\n--- Test 7: downloadPDF ---");

        byte[] result = client.downloadPDF(deliverableId);
        System.out.println("Result: PDF received, size: " + result.length + " bytes");

        String outputPath = "./downloaded-deliverable.pdf";
        try (FileOutputStream fos = new FileOutputStream(outputPath)) {
            fos.write(result);
        }
        System.out.println("File saved to: " + outputPath);
    }

    private static void testListDeliverableItems() throws IOException {
        System.out.println("\n--- Test 8: listDeliverableItems ---");

        ListDeliverableItemsRequest request = new ListDeliverableItemsRequest();
        request.setLimit(10);
        request.setShowTags(true);
        request.setColumn0("createdOn");
        request.setOrder0("desc");

        DeliverableItemListResponse result = client.listDeliverableItems(request);
        System.out.println("Total Records: " + result.getTotalRecords());
        System.out.println("Result: " + gson.toJson(result));
    }

    private static void testGetDeliverableItem(String itemId) throws IOException {
        System.out.println("\n--- Test 9: getDeliverableItem ---");

        DeliverableItemResponse result = client.getDeliverableItem(itemId, true);
        System.out.println("Result: " + gson.toJson(result));
    }
}
