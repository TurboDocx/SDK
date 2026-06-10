/**
 * TurboQuote Products and Bundles Example
 *
 * Demonstrates catalog management:
 *   1. Create a product category type
 *   2. Create a product
 *   3. Create a bundle (with items)
 *   4. List products and bundles
 *   5. Duplicate a product
 *   6. Clean up
 *
 * Required env vars:
 *   TURBODOCX_API_KEY   - your TDX- API key
 *   TURBODOCX_ORG_ID    - your organization UUID
 */

package examples;

import com.turbodocx.TurboQuoteClient;
import com.turbodocx.TurboQuote;
import com.turbodocx.models.quote.*;

import java.util.Arrays;

public class TurboQuoteProducts {

    public static void main(String[] args) {
        TurboQuoteClient client = new TurboQuoteClient.Builder()
                .apiKey(System.getenv("TURBODOCX_API_KEY"))
                .orgId(System.getenv("TURBODOCX_ORG_ID"))
                .build();

        TurboQuote tq = client.turboQuote();

        String productCategoryTypeId = null;
        String bundleCategoryTypeId = null;
        String productId = null;
        String duplicatedProductId = null;
        String bundleId = null;

        try {
            // Step 1: Create category types
            System.out.println("Creating product category type...");
            CreateQuoteTypeRequest productCatReq = new CreateQuoteTypeRequest();
            productCatReq.setName("Software (Demo)");
            productCatReq.setCategoryType(CategoryType.PRODUCT_CATEGORY);
            QuoteType productCat = tq.createType(productCatReq);
            productCategoryTypeId = productCat.getId();
            System.out.println("Product category type: " + productCategoryTypeId);

            System.out.println("Creating bundle category type...");
            CreateQuoteTypeRequest bundleCatReq = new CreateQuoteTypeRequest();
            bundleCatReq.setName("Bundles (Demo)");
            bundleCatReq.setCategoryType(CategoryType.BUNDLE_CATEGORY);
            QuoteType bundleCat = tq.createType(bundleCatReq);
            bundleCategoryTypeId = bundleCat.getId();
            System.out.println("Bundle category type: " + bundleCategoryTypeId);

            // Step 2: Create a product
            System.out.println("Creating product...");
            CreateProductRequest productReq = new CreateProductRequest();
            productReq.setName("Enterprise Platform License (Demo)");
            productReq.setSku("EPL-001");
            productReq.setDescription("Full-featured enterprise platform access");
            productReq.setCategoryId(productCategoryTypeId);
            productReq.setListPrice(999.00);
            productReq.setBillingFrequency("annual");
            productReq.setShowInCatalog(true);

            Product product = tq.createProduct(productReq);
            productId = product.getId();
            System.out.println("Product created: " + productId + " (" + product.getName() + ")");

            // Step 3: List products
            ListProductsOptions listOpts = new ListProductsOptions();
            listOpts.setQuery("Enterprise Platform");
            listOpts.setLimit(5);
            ProductListResponse products = tq.listProducts(listOpts);
            System.out.println("Found " + products.getTotalRecords() + " matching product(s)");

            // Step 4: Duplicate the product
            System.out.println("Duplicating product...");
            Product duplicate = tq.duplicateProduct(productId);
            duplicatedProductId = duplicate.getId();
            System.out.println("Duplicate created: " + duplicatedProductId);

            // Step 5: Create a bundle with items
            System.out.println("Creating bundle...");
            BundleItemInput bundleItem = new BundleItemInput();
            bundleItem.setProductId(productId);
            bundleItem.setUnitPrice(999.00);
            bundleItem.setBillingFrequency("annual");
            bundleItem.setQuantity(1.0);
            bundleItem.setDiscountType(DiscountType.PERCENT);
            bundleItem.setDiscountPercent(5.0);

            CreateBundleRequest bundleReq = new CreateBundleRequest();
            bundleReq.setName("Starter Bundle (Demo)");
            bundleReq.setCategoryId(bundleCategoryTypeId); // required
            bundleReq.setDescription("Everything you need to get started");
            bundleReq.setBundleDiscountType(DiscountType.PERCENT);
            bundleReq.setBundleDiscountPercent(15.0);
            bundleReq.setShowInCatalog(true);
            bundleReq.setItems(Arrays.asList(bundleItem));

            Bundle bundle = tq.createBundle(bundleReq);
            bundleId = bundle.getId();
            System.out.println("Bundle created: " + bundleId + " (" + bundle.getName() + ")");

            // Step 6: List bundles
            BundleListResponse bundles = tq.listBundles();
            System.out.println("Total bundles in catalog: " + bundles.getTotalRecords());

            System.out.println("\nProducts and bundles demo complete.");

        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        } finally {
            // Clean up
            try {
                if (bundleId != null) { tq.deleteBundle(bundleId); System.out.println("Deleted bundle " + bundleId); }
                if (duplicatedProductId != null) { tq.deleteProduct(duplicatedProductId); System.out.println("Deleted duplicate product " + duplicatedProductId); }
                if (productId != null) { tq.deleteProduct(productId); System.out.println("Deleted product " + productId); }
                if (productCategoryTypeId != null) { tq.deleteType(productCategoryTypeId); System.out.println("Deleted product category type " + productCategoryTypeId); }
                if (bundleCategoryTypeId != null) { tq.deleteType(bundleCategoryTypeId); System.out.println("Deleted bundle category type " + bundleCategoryTypeId); }
            } catch (Exception cleanup) {
                System.err.println("Cleanup error: " + cleanup.getMessage());
            }
        }
    }
}
