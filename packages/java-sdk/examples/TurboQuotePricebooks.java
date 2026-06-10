/**
 * TurboQuote Pricebooks Example
 *
 * Demonstrates price book management:
 *   1. Create a pricebook type category
 *   2. Create a pricebook with product pricing overrides
 *   3. Create a quote and apply the pricebook
 *   4. Optionally send with a deliverable (TURBODOCX_DELIVERABLE_ID env var)
 *   5. Clean up
 *
 * Required env vars:
 *   TURBODOCX_API_KEY        - your TDX- API key
 *   TURBODOCX_ORG_ID         - your organization UUID
 *
 * Optional env vars:
 *   TURBODOCX_DELIVERABLE_ID - deliverable ID for sendQuoteWithDeliverable demo
 */

package examples;

import com.turbodocx.TurboQuoteClient;
import com.turbodocx.TurboQuote;
import com.turbodocx.models.quote.*;

import java.util.Arrays;

public class TurboQuotePricebooks {

    public static void main(String[] args) {
        TurboQuoteClient client = new TurboQuoteClient.Builder()
                .apiKey(System.getenv("TURBODOCX_API_KEY"))
                .orgId(System.getenv("TURBODOCX_ORG_ID"))
                .build();

        TurboQuote tq = client.turboQuote();

        String pricebookTypeId = null;
        String productCategoryTypeId = null;
        String productId = null;
        String pricebookId = null;
        String companyId = null;
        String quoteId = null;

        try {
            // Step 1: Create required category types
            System.out.println("Creating pricebook type...");
            CreateQuoteTypeRequest pbTypeReq = new CreateQuoteTypeRequest();
            pbTypeReq.setName("Partner Pricing (Demo)");
            pbTypeReq.setCategoryType(CategoryType.PRICEBOOK_TYPE);
            QuoteType pbType = tq.createType(pbTypeReq);
            pricebookTypeId = pbType.getId();
            System.out.println("Pricebook type: " + pricebookTypeId);

            System.out.println("Creating product category type...");
            CreateQuoteTypeRequest prodCatReq = new CreateQuoteTypeRequest();
            prodCatReq.setName("SaaS Products (Demo)");
            prodCatReq.setCategoryType(CategoryType.PRODUCT_CATEGORY);
            QuoteType prodCat = tq.createType(prodCatReq);
            productCategoryTypeId = prodCat.getId();

            // Step 2: Create a product
            System.out.println("Creating product...");
            CreateProductRequest productReq = new CreateProductRequest();
            productReq.setName("Pro SaaS Platform (Demo)");
            productReq.setSku("PRO-001");
            productReq.setCategoryId(productCategoryTypeId);
            productReq.setListPrice(500.00);
            productReq.setBillingFrequency("monthly");

            Product product = tq.createProduct(productReq);
            productId = product.getId();
            System.out.println("Product created: " + productId);

            // Step 3: Create a pricebook with product pricing override
            System.out.println("Creating pricebook...");
            PriceBookProductPricingInput pricing = new PriceBookProductPricingInput();
            pricing.setProductId(productId);
            pricing.setDiscountType(DiscountType.PERCENT);
            pricing.setDiscountPercent(20.0);

            CreatePriceBookRequest pbReq = new CreatePriceBookRequest();
            pbReq.setName("Partner Discount Pricebook (Demo)");
            pbReq.setPriceBookTypeId(pricebookTypeId);
            pbReq.setDiscountPercent(0.0);
            pbReq.setValidFrom("2025-01-01");
            pbReq.setProductPricing(Arrays.asList(pricing));
            pbReq.setShowInQuoteBuilder(true);

            PriceBook pricebook = tq.createPriceBook(pbReq);
            pricebookId = pricebook.getId();
            System.out.println("Pricebook created: " + pricebookId);

            // Step 4: Create a company and quote
            System.out.println("Creating company and quote...");
            CreateCompanyContactInput contactInput = new CreateCompanyContactInput();
            contactInput.setName("Bob Partner");
            contactInput.setEmail("bob@partner.example.com");

            CreateCompanyRequest companyReq = new CreateCompanyRequest();
            companyReq.setName("Partner Corp (Demo)");
            companyReq.setContacts(Arrays.asList(contactInput));

            Company company = tq.createCompany(companyReq);
            companyId = company.getId();

            ContactListResponse contacts = tq.listCompanyContacts(companyId);
            String contactId = contacts.getResults().get(0).getId();

            CreateQuoteRequest quoteReq = new CreateQuoteRequest();
            quoteReq.setName("Partner Quote with Pricebook (Demo)");
            quoteReq.setCompanyId(companyId);
            quoteReq.setContactId(contactId);
            quoteReq.setPriceBookId(pricebookId);

            Quote quote = tq.createQuote(quoteReq);
            quoteId = quote.getId();
            System.out.println("Quote created: " + quoteId);

            // Step 5: Apply pricebook
            System.out.println("Applying pricebook to quote...");
            ApplyPriceBookResponse applied = tq.applyPriceBook(quoteId, pricebookId);
            System.out.println("Pricebook applied. Updated: " + applied.getUpdatedCount()
                    + ", Skipped: " + applied.getSkippedCount());

            // Step 6: Optional — send with deliverable if env var set
            String deliverableId = System.getenv("TURBODOCX_DELIVERABLE_ID");
            if (deliverableId != null && !deliverableId.isEmpty()) {
                System.out.println("Sending quote with deliverable " + deliverableId + "...");
                SendQuoteWithDeliverableRequest sendReq = new SendQuoteWithDeliverableRequest();
                sendReq.setDeliverableId(deliverableId);
                sendReq.setMergePosition("end");

                SendQuoteWithDeliverableResponse sendResp = tq.sendQuoteWithDeliverable(quoteId, sendReq);
                System.out.println("Sent. Document ID: " + sendResp.getDocumentId());
            } else {
                // Just send normally
                System.out.println("Sending quote...");
                tq.sendQuote(quoteId);
                System.out.println("Quote sent.");
            }

            // Step 7: List pricebook products
            PriceBookProductListResponse pbProducts = tq.listPriceBookProducts(pricebookId);
            System.out.println("Products in pricebook: " + pbProducts.getTotalRecords());

            System.out.println("\nPricebooks demo complete.");

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            // Clean up in reverse order
            try {
                if (quoteId != null) { tq.deleteQuote(quoteId); System.out.println("Deleted quote " + quoteId); }
                if (companyId != null) { tq.deleteCompany(companyId); System.out.println("Deleted company " + companyId); }
                if (pricebookId != null) { tq.deletePriceBook(pricebookId); System.out.println("Deleted pricebook " + pricebookId); }
                if (productId != null) { tq.deleteProduct(productId); System.out.println("Deleted product " + productId); }
                if (pricebookTypeId != null) { tq.deleteType(pricebookTypeId); System.out.println("Deleted pricebook type " + pricebookTypeId); }
                if (productCategoryTypeId != null) { tq.deleteType(productCategoryTypeId); System.out.println("Deleted product category type " + productCategoryTypeId); }
            } catch (Exception cleanup) {
                System.err.println("Cleanup error: " + cleanup.getMessage());
            }
        }
    }
}
