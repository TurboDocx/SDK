/**
 * TurboQuote Example: Product & Bundle Catalog Management
 *
 * Fully self-contained — creates all data it needs, then cleans up.
 * Just add your API key and run.
 *
 * Methods demonstrated:
 * - configure()
 * - createType(), listTypes(), deleteType()
 * - createProduct(), listProducts(), getProduct(), updateProduct()
 * - duplicateProduct(), getProductPrimaryImages(), deleteProduct()
 * - createBundle(), listBundles(), getBundle(), updateBundle()
 * - duplicateBundle(), deleteBundle()
 *
 * Run: npx tsx examples/turboquote-products.ts
 */

import { TurboQuote } from '@turbodocx/sdk';

async function productCatalogExample(): Promise<void> {
  // =============================================
  // 1. CONFIGURE
  // =============================================
  TurboQuote.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    baseUrl: process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com',
  });

  try {
    // =============================================
    // 2. SET UP CATEGORIES
    // =============================================
    console.log('2. Creating categories...');

    const productCategory = await TurboQuote.createType({
      name: 'Software Licenses',
      categoryType: 'product_category',
    });
    console.log(`  Product category: ${productCategory.name} (${productCategory.id})`);

    const bundleCategory = await TurboQuote.createType({
      name: 'Starter Kits',
      categoryType: 'bundle_category',
    });
    console.log(`  Bundle category: ${bundleCategory.name} (${bundleCategory.id})`);

    const prodCategories = await TurboQuote.listTypes({
      categoryType: 'product_category',
      includeUsage: true,
    });
    console.log(`  ${prodCategories.totalRecords} product categories in org\n`);

    // =============================================
    // 3. CREATE PRODUCTS
    // =============================================
    console.log('3. Creating products...');

    const product1 = await TurboQuote.createProduct({
      name: 'Widget Pro',
      listPrice: 149.99,
      billingFrequency: 'monthly',
      sku: 'WGT-PRO-001',
      description: 'Professional-grade widget with advanced features',
      cost: 45.00,
      categoryId: productCategory.id,
      currency: 'USD',
      minimumOrderQuantity: 1,
      showInCatalog: true,
    });
    console.log(`  ${product1.name} — $${product1.listPrice}/mo (SKU: ${product1.sku})`);

    const product2 = await TurboQuote.createProduct({
      name: 'Widget Basic',
      listPrice: 49.99,
      billingFrequency: 'monthly',
      sku: 'WGT-BAS-001',
      description: 'Entry-level widget for small teams',
      cost: 15.00,
      categoryId: productCategory.id,
      currency: 'USD',
    });
    console.log(`  ${product2.name} — $${product2.listPrice}/mo (SKU: ${product2.sku})`);

    const product3 = await TurboQuote.createProduct({
      name: 'Implementation Fee',
      listPrice: 2500.00,
      billingFrequency: 'one-time',
      sku: 'SVC-IMPL-001',
      description: 'One-time implementation and onboarding service',
      cost: 800.00,
      categoryId: productCategory.id,
      currency: 'USD',
    });
    console.log(`  ${product3.name} — $${product3.listPrice} one-time\n`);

    // =============================================
    // 4. LIST & GET PRODUCTS
    // =============================================
    console.log('4. Browsing products...');

    const allProducts = await TurboQuote.listProducts({ limit: 10 });
    console.log(`  ${allProducts.totalRecords} product(s) in catalog`);

    const categoryProducts = await TurboQuote.listProducts({
      categoryIds: [productCategory.id],
    });
    console.log(`  ${categoryProducts.totalRecords} in "Software Licenses"`);

    const productDetail = await TurboQuote.getProduct(product1.id);
    const margin = productDetail.cost
      ? Math.round((1 - productDetail.cost / productDetail.listPrice) * 100)
      : 0;
    console.log(`  ${productDetail.name}: $${productDetail.listPrice}, cost $${productDetail.cost}, ${margin}% margin\n`);

    // =============================================
    // 5. UPDATE A PRODUCT
    // =============================================
    console.log('5. Updating product...');

    const updatedProduct = await TurboQuote.updateProduct(product1.id, {
      listPrice: 169.99,
      description: 'Professional-grade widget with advanced features and priority support',
    });
    console.log(`  New price: $${updatedProduct.listPrice}\n`);

    // =============================================
    // 6. GET PRIMARY IMAGES
    // =============================================
    console.log('6. Fetching primary images...');

    const primaryImages = await TurboQuote.getProductPrimaryImages([product1.id, product2.id]);
    for (const [productId, image] of Object.entries(primaryImages)) {
      console.log(`  ${productId}: ${image ? image.fileName : '(no image)'}`);
    }
    console.log();

    // =============================================
    // 7. DUPLICATE A PRODUCT
    // =============================================
    console.log('7. Duplicating product...');

    const duplicatedProduct = await TurboQuote.duplicateProduct(product1.id);
    console.log(`  Original: ${product1.name} (${product1.id})`);
    console.log(`  Copy: ${duplicatedProduct.name} (${duplicatedProduct.id})\n`);

    // =============================================
    // 8. CREATE A BUNDLE
    // =============================================
    console.log('8. Creating bundle...');

    const bundle = await TurboQuote.createBundle({
      name: 'Starter Pack',
      description: 'Everything you need to get started',
      sku: 'BDL-START-001',
      categoryId: bundleCategory.id,
      items: [
        { productId: product1.id, unitPrice: 169.99, billingFrequency: 'monthly', quantity: 1 },
        { productId: product2.id, unitPrice: 49.99, billingFrequency: 'monthly', quantity: 2 },
      ],
      bundleDiscountPercent: 10,
      currency: 'USD',
      showItemsToEndUser: true,
      showInCatalog: true,
    });
    console.log(`  ${bundle.name}: $${bundle.totalFinalPrice} (${bundle.bundleDiscountPercent}% off)\n`);

    // =============================================
    // 9. LIST & GET BUNDLES
    // =============================================
    console.log('9. Browsing bundles...');

    const bundles = await TurboQuote.listBundles({ limit: 10 });
    console.log(`  ${bundles.totalRecords} bundle(s) in catalog`);

    const bundleDetail = await TurboQuote.getBundle(bundle.id);
    console.log(`  ${bundleDetail.name}: ${bundleDetail.items?.length || 0} items`);
    if (bundleDetail.items) {
      for (const item of bundleDetail.items) {
        console.log(`    - ${item.quantity}x @ $${item.unitPrice}/${item.billingFrequency}`);
      }
    }
    console.log();

    // =============================================
    // 10. UPDATE BUNDLE
    // =============================================
    console.log('10. Updating bundle...');

    const updatedBundle = await TurboQuote.updateBundle(bundle.id, {
      bundleDiscountPercent: 15,
      description: 'Everything you need to get started — holiday special!',
    });
    console.log(`  New discount: ${updatedBundle.bundleDiscountPercent}%\n`);

    // =============================================
    // 11. DUPLICATE BUNDLE
    // =============================================
    console.log('11. Duplicating bundle...');

    const duplicatedBundle = await TurboQuote.duplicateBundle(bundle.id);
    console.log(`  Copy: ${duplicatedBundle.name} (${duplicatedBundle.id})\n`);

    // =============================================
    // 12. CLEANUP
    // =============================================
    console.log('12. Cleaning up...');

    await TurboQuote.deleteBundle(duplicatedBundle.id);
    await TurboQuote.deleteBundle(bundle.id);
    await TurboQuote.deleteProduct(duplicatedProduct.id);
    await TurboQuote.deleteProduct(product3.id);
    await TurboQuote.deleteProduct(product2.id);
    await TurboQuote.deleteProduct(product1.id);
    await TurboQuote.deleteType(bundleCategory.id);
    await TurboQuote.deleteType(productCategory.id);

    console.log('  ✅ All test data removed');
    console.log('\n=== Product catalog example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

productCatalogExample();
