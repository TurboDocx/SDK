/**
 * TurboQuote Basic Example — Full Lifecycle
 *
 * Demonstrates the complete quote lifecycle:
 *   1. Create a company and contact
 *   2. Create a quote and add line items
 *   3. Send the quote
 *   4. Download the quote PDF
 *   5. Clean up (delete created data)
 *
 * Required env vars:
 *   TURBODOCX_API_KEY   - your TDX- API key
 *   TURBODOCX_ORG_ID    - your organization UUID
 */

package examples;

import com.turbodocx.TurboQuoteClient;
import com.turbodocx.TurboQuote;
import com.turbodocx.models.quote.*;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

public class TurboQuoteBasic {

    public static void main(String[] args) {
        TurboQuoteClient client = new TurboQuoteClient.Builder()
                .apiKey(System.getenv("TURBODOCX_API_KEY"))
                .orgId(System.getenv("TURBODOCX_ORG_ID"))
                .build();

        TurboQuote tq = client.turboQuote();

        String companyId = null;
        String contactId = null;
        String quoteId = null;

        try {
            // Step 1: Create a company with an initial contact
            System.out.println("Creating company...");
            CreateCompanyContactInput contactInput = new CreateCompanyContactInput();
            contactInput.setName("Alice Buyer");
            contactInput.setEmail("alice@example.com");

            CreateCompanyRequest companyReq = new CreateCompanyRequest();
            companyReq.setName("Acme Corp (TurboQuote Demo)");
            companyReq.setCity("New York");
            companyReq.setContacts(Arrays.asList(contactInput));

            Company company = tq.createCompany(companyReq);
            companyId = company.getId();
            System.out.println("Company created: " + companyId);

            // Step 2: Find the contact we just created
            ContactListResponse contacts = tq.listCompanyContacts(companyId);
            contactId = contacts.getResults().get(0).getId();
            System.out.println("Contact: " + contactId);

            // Step 3: Create a quote
            System.out.println("Creating quote...");
            CreateQuoteRequest quoteReq = new CreateQuoteRequest();
            quoteReq.setName("Demo Quote - Q1 Software License");
            quoteReq.setCompanyId(companyId);
            quoteReq.setContactId(contactId);
            quoteReq.setTermDays(30);
            quoteReq.setCurrency(Currency.USD);

            Quote quote = tq.createQuote(quoteReq);
            quoteId = quote.getId();
            System.out.println("Quote created: " + quoteId + " (status: " + quote.getStatus() + ")");

            // Step 4: Add a product line item
            System.out.println("Adding line items...");
            AddLineItemRequest item = new AddLineItemRequest();
            item.setProductName("Enterprise Software License");
            item.setProductId(null); // custom (no catalog product)
            item.setUnitPrice(1200.00);
            item.setQuantity(3.0);
            item.setBillingFrequency("annual");
            item.setDiscountType(DiscountType.PERCENT);
            item.setDiscountPercent(10.0);

            List<LineItem> lineItems = tq.addLineItems(quoteId, item);
            System.out.println("Added " + lineItems.size() + " line item(s)");

            // Step 5: Send the quote
            System.out.println("Sending quote...");
            SendQuoteResponse sendResp = tq.sendQuote(quoteId);
            System.out.println("Quote sent. Status: " + sendResp.getQuote().getStatus());

            // Step 6: Download the PDF
            System.out.println("Downloading quote PDF...");
            byte[] pdf = tq.downloadQuotePdf(quoteId);
            Files.write(Paths.get("quote-demo.pdf"), pdf);
            System.out.println("PDF saved to quote-demo.pdf (" + pdf.length + " bytes)");

            System.out.println("\nDemo complete.");

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            // Clean up — delete in reverse order
            try {
                if (quoteId != null) {
                    client.turboQuote().deleteQuote(quoteId);
                    System.out.println("Deleted quote " + quoteId);
                }
                if (companyId != null) {
                    client.turboQuote().deleteCompany(companyId);
                    System.out.println("Deleted company " + companyId);
                }
            } catch (Exception cleanup) {
                System.err.println("Cleanup error: " + cleanup.getMessage());
            }
        }
    }
}
