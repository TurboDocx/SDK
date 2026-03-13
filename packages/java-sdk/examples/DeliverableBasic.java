import com.turbodocx.*;
import com.turbodocx.models.deliverable.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

/**
 * Basic Deliverable SDK usage example.
 *
 * Demonstrates:
 * - Creating a deliverable-only client (no senderEmail needed)
 * - Generating a document from a template with variables
 * - Listing, getting, updating, and deleting deliverables
 * - Downloading source files and PDFs
 * - Working with deliverable items
 */
public class DeliverableBasic {

    public static void main(String[] args) throws IOException {
        // Build a client for Deliverable operations only (no senderEmail required)
        DeliverableClient deliverable = new TurboDocxClient.Builder()
                .apiKey(System.getenv("TURBODOCX_API_KEY"))
                .orgId(System.getenv("TURBODOCX_ORG_ID"))
                .buildDeliverableClient();

        // --- Generate a deliverable from a template ---
        DeliverableVariable companyVar = new DeliverableVariable();
        companyVar.setPlaceholder("{CompanyName}");
        companyVar.setText("Acme Corporation");
        companyVar.setMimeType("text");

        DeliverableVariable dateVar = new DeliverableVariable();
        dateVar.setPlaceholder("{Date}");
        dateVar.setText("2026-03-12");
        dateVar.setMimeType("text");

        CreateDeliverableRequest createReq = new CreateDeliverableRequest();
        createReq.setName("Q1 Report");
        createReq.setTemplateId("your-template-id");
        createReq.setVariables(List.of(companyVar, dateVar));
        createReq.setDescription("Quarterly business report");
        createReq.setTags(List.of("reports", "quarterly"));

        CreateDeliverableResponse created = deliverable.generateDeliverable(createReq);
        String deliverableId = created.getResults().getDeliverable().getId();
        System.out.println("Created deliverable: " + deliverableId);

        // --- List deliverables with pagination ---
        ListDeliverablesRequest listReq = new ListDeliverablesRequest();
        listReq.setLimit(10);
        listReq.setShowTags(true);

        DeliverableListResponse list = deliverable.listDeliverables(listReq);
        System.out.println("Total deliverables: " + list.getTotalRecords());
        for (DeliverableRecord record : list.getResults()) {
            System.out.println("  - " + record.getName() + " (" + record.getId() + ")");
        }

        // --- Get deliverable details ---
        DeliverableRecord details = deliverable.getDeliverableDetails(deliverableId, true);
        System.out.println("Name: " + details.getName());
        System.out.println("Template: " + details.getTemplateName());

        // --- Update deliverable ---
        UpdateDeliverableRequest updateReq = new UpdateDeliverableRequest();
        updateReq.setName("Q1 Report - Final");
        updateReq.setDescription("Final quarterly business report");

        UpdateDeliverableResponse updated = deliverable.updateDeliverableInfo(deliverableId, updateReq);
        System.out.println("Updated: " + updated.getMessage());

        // --- Download source file (DOCX/PPTX) ---
        byte[] sourceFile = deliverable.downloadSourceFile(deliverableId);
        Files.write(Paths.get("report.docx"), sourceFile);
        System.out.println("Downloaded source file: " + sourceFile.length + " bytes");

        // --- Download PDF ---
        byte[] pdfFile = deliverable.downloadPDF(deliverableId);
        Files.write(Paths.get("report.pdf"), pdfFile);
        System.out.println("Downloaded PDF: " + pdfFile.length + " bytes");

        // --- List deliverable items ---
        DeliverableItemListResponse items = deliverable.listDeliverableItems();
        System.out.println("Total items: " + items.getTotalRecords());

        // --- Get a single deliverable item by ID ---
        if (!items.getResults().isEmpty()) {
            String itemId = items.getResults().get(0).getId();
            System.out.println("Getting deliverable item: " + itemId);
            DeliverableItemResponse item = deliverable.getDeliverableItem(itemId, true);
            System.out.println("Item: " + item.getResults().getName() + " (" + item.getType() + ")");
        }

        // --- Delete deliverable ---
        DeleteDeliverableResponse deleted = deliverable.deleteDeliverable(deliverableId);
        System.out.println("Deleted: " + deleted.getMessage());
    }
}
