/**
 * TurboQuote Example: Product & Bundle Catalog Management
 *
 * This example demonstrates the full product catalog lifecycle:
 * - createType() — create product_category and bundle_category types
 * - listTypes() — list categories
 * - createProduct() — with and without images
 * - listProducts(), getProduct() — browse catalog
 * - updateProduct() — change price, manage images
 * - duplicateProduct() — quick copy
 * - getProductPrimaryImages() — batch fetch thumbnail URLs
 * - deleteProduct() — remove from catalog
 * - createBundle() — combine products into bundles
 * - listBundles(), getBundle() — browse bundles
 * - updateBundle() — adjust items and discount
 * - duplicateBundle() — quick copy
 * - deleteBundle() — remove bundle
 * - deleteType() — cleanup categories
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
    console.log(`  Product category created: ${productCategory.name} (${productCategory.id})`);

    const bundleCategory = await TurboQuote.createType({
      name: 'Starter Kits',
      categoryType: 'bundle_category',
    });
    console.log(`  Bundle category created: ${bundleCategory.name} (${bundleCategory.id})`);

    // List categories
    const prodCategories = await TurboQuote.listTypes({
      categoryType: 'product_category',
      includeUsage: true,
    });
    console.log(`\nFound ${prodCategories.totalRecords} product categories:`);
    for (const cat of prodCategories.results) {
      const usage = cat.usage ? ` (used by ${cat.usage.usageCount} products)` : '';
      console.log(`  - ${cat.name}${usage}`);
    }
    console.log();

    // =============================================
    // 3. CREATE PRODUCTS
    // =============================================
    console.log('3. Creating products...');

    // Simple product (no images)
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

    console.log('Product 1 created!');
    console.log(`  ID: ${product1.id}`);
    console.log(`  Name: ${product1.name}`);
    console.log(`  SKU: ${product1.sku}`);
    console.log(`  Price: $${product1.listPrice}/${product1.billingFrequency}\n`);

    // Product with image file path
    // Uncomment and provide a real image path to test image uploads:
    // const product2 = await TurboQuote.createProduct({
    //   name: 'Widget Basic',
    //   listPrice: 49.99,
    //   billingFrequency: 'monthly',
    //   sku: 'WGT-BAS-001',
    //   description: 'Entry-level widget for small teams',
    //   cost: 15.00,
    //   categoryId: productCategory.id,
    //   currency: 'USD',
    //   images: ['./product-photo.jpg'],  // accepts file paths, Buffers, or File objects
    // });

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

    console.log('Product 2 created!');
    console.log(`  ID: ${product2.id}`);
    console.log(`  Name: ${product2.name}`);
    console.log(`  SKU: ${product2.sku}`);
    console.log(`  Price: $${product2.listPrice}/${product2.billingFrequency}\n`);

    // One-time setup fee product
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

    console.log('Product 3 created!');
    console.log(`  ID: ${product3.id}`);
    console.log(`  Name: ${product3.name}`);
    console.log(`  Price: $${product3.listPrice} (${product3.billingFrequency})\n`);

    // =============================================
    // 4. LIST & GET PRODUCTS
    // =============================================
    console.log('4. Listing products...');

    const allProducts = await TurboQuote.listProducts({ limit: 10 });
    console.log(`Found ${allProducts.totalRecords} product(s):`);
    for (const p of allProducts.results) {
      console.log(`  - ${p.sku || 'N/A'}: ${p.name} — $${p.listPrice}/${p.billingFrequency}`);
    }
    console.log();

    // Filter by category
    const categoryProducts = await TurboQuote.listProducts({
      categoryIds: [productCategory.id],
      currency: 'USD',
    });
    console.log(`Products in "Software Licenses" category: ${categoryProducts.totalRecords}`);

    // Get single product
    const productDetail = await TurboQuote.getProduct(product1.id);
    console.log(`\nProduct detail: ${productDetail.name}`);
    console.log(`  Description: ${productDetail.description}`);
    console.log(`  Cost: $${productDetail.cost}`);
    console.log(`  Margin: ${productDetail.cost ? Math.round((1 - productDetail.cost / productDetail.listPrice) * 100) : 'N/A'}%\n`);

    // =============================================
    // 5. UPDATE A PRODUCT
    // =============================================
    console.log('5. Updating product...');

    const updatedProduct = await TurboQuote.updateProduct(product1.id, {
      listPrice: 169.99,
      description: 'Professional-grade widget with advanced features and priority support',
      internalNotes: 'Price increased for Q3 — includes new support tier',
    });

    console.log('Product updated!');
    console.log(`  New Price: $${updatedProduct.listPrice}`);
    console.log(`  Description: ${updatedProduct.description}\n`);

    // =============================================
    // 6. GET PRIMARY IMAGES
    // =============================================
    console.log('6. Fetching primary images...');

    const primaryImages = await TurboQuote.getProductPrimaryImages([product1.id, product2.id]);

    for (const [productId, imageUrl] of Object.entries(primaryImages)) {
      console.log(`  Product ${productId}: ${imageUrl || '(no image)'}`);
    }
    console.log();

    // =============================================
    // 7. DUPLICATE A PRODUCT
    // =============================================
    console.log('7. Duplicating product...');

    const duplicatedProduct = await TurboQuote.duplicateProduct(product1.id);

    console.log('Product duplicated!');
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
        {
          productId: product1.id,
          unitPrice: 169.99,
          billingFrequency: 'monthly',
          quantity: 1,
        },
        {
          productId: product2.id,
          unitPrice: 49.99,
          billingFrequency: 'monthly',
          quantity: 2,
        },
      ],
      bundleDiscountPercent: 10,
      currency: 'USD',
      showItemsToEndUser: true,
      showInCatalog: true,
    });

    console.log('Bundle created!');
    console.log(`  ID: ${bundle.id}`);
    console.log(`  Name: ${bundle.name}`);
    console.log(`  Total List Price: $${bundle.totalListPrice}`);
    console.log(`  Total Final Price: $${bundle.totalFinalPrice} (${bundle.bundleDiscountPercent}% off)`);
    console.log(`  Items: ${bundle.items?.length || 0}\n`);

    // =============================================
    // 9. LIST & GET BUNDLES
    // =============================================
    console.log('9. Listing bundles...');

    const bundles = await TurboQuote.listBundles({ limit: 10 });
    console.log(`Found ${bundles.totalRecords} bundle(s):`);
    for (const b of bundles.results) {
      console.log(`  - ${b.sku || 'N/A'}: ${b.name} — $${b.totalFinalPrice}`);
    }

    const bundleDetail = await TurboQuote.getBundle(bundle.id);
    console.log(`\nBundle detail: ${bundleDetail.name}`);
    if (bundleDetail.items) {
      for (const item of bundleDetail.items) {
        console.log(`  - ${item.quantity}x @ $${item.unitPrice}/${item.billingFrequency}`);
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

    console.log('Bundle updated!');
    console.log(`  New Discount: ${updatedBundle.bundleDiscountPercent}%`);
    console.log(`  New Final Price: $${updatedBundle.totalFinalPrice}\n`);

    // =============================================
    // 11. DUPLICATE BUNDLE
    // =============================================
    console.log('11. Duplicating bundle...');

    const duplicatedBundle = await TurboQuote.duplicateBundle(bundle.id);

    console.log('Bundle duplicated!');
    console.log(`  Original: ${bundle.name} (${bundle.id})`);
    console.log(`  Copy: ${duplicatedBundle.name} (${duplicatedBundle.id})\n`);

    // =============================================
    // 12. CLEANUP
    // =============================================
    console.log('12. Cleaning up...');

    await TurboQuote.deleteBundle(duplicatedBundle.id);
    console.log(`  Deleted bundle: ${duplicatedBundle.name}`);

    await TurboQuote.deleteBundle(bundle.id);
    console.log(`  Deleted bundle: ${bundle.name}`);

    await TurboQuote.deleteProduct(duplicatedProduct.id);
    console.log(`  Deleted product: ${duplicatedProduct.name}`);

    await TurboQuote.deleteProduct(product3.id);
    console.log(`  Deleted product: ${product3.name}`);

    await TurboQuote.deleteProduct(product2.id);
    console.log(`  Deleted product: ${product2.name}`);

    await TurboQuote.deleteProduct(product1.id);
    console.log(`  Deleted product: ${product1.name}`);

    await TurboQuote.deleteType(bundleCategory.id);
    console.log(`  Deleted category: ${bundleCategory.name}`);

    await TurboQuote.deleteType(productCategory.id);
    console.log(`  Deleted category: ${productCategory.name}`);

    console.log('\n=== Product catalog example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

// Run the example
productCatalogExample();
