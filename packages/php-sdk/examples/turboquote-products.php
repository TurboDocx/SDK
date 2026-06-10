<?php

/**
 * TurboQuote Example: Products and Bundles Catalog CRUD
 *
 * This example demonstrates managing the product and bundle catalog:
 * - Create / get / update / delete a product (with optional image)
 * - Duplicate a product
 * - Create / get / update / delete a bundle
 * - Duplicate a bundle
 * - Create a quote type (category) used when creating bundles
 *
 * Required env vars:
 *   TURBODOCX_API_KEY   — your TDX- API key
 *   TURBODOCX_ORG_ID    — your organization UUID
 *
 * Optional env vars (for the category lookup):
 *   TURBODOCX_CATEGORY_ID — existing category UUID to use for new products/bundles.
 *                           If unset, the example creates a temporary one.
 *
 * Run: php examples/turboquote-products.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboQuote;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Types\Requests\Quote\CreateProductRequest;
use TurboDocx\Types\Requests\Quote\UpdateProductRequest;
use TurboDocx\Types\Requests\Quote\CreateBundleRequest;
use TurboDocx\Types\Requests\Quote\UpdateBundleRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteTypeRequest;
use TurboDocx\Exceptions\TurboDocxException;

function turboquoteProductsExample(): void
{
    TurboQuote::configure(new QuoteClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
    ));

    $categoryId = getenv('TURBODOCX_CATEGORY_ID') ?: null;
    $ownedCategoryId = null;
    $productId = null;
    $duplicateProductId = null;
    $bundleId = null;
    $duplicateBundleId = null;

    try {
        // ============================================================
        // 1. ENSURE A CATEGORY EXISTS
        // ============================================================
        if ($categoryId === null) {
            echo "1. Creating a temporary category (quote type)...\n";

            $category = TurboQuote::createType(new CreateQuoteTypeRequest(
                name: 'Demo Category (temp)',
                description: 'Created by turboquote-products.php example',
            ));
            $categoryId = $category->id;
            $ownedCategoryId = $categoryId;
            echo "  Category created: {$category->name} (ID: {$categoryId})\n\n";
        } else {
            echo "1. Using existing category ID: {$categoryId}\n\n";
        }

        // ============================================================
        // 2. CREATE A PRODUCT
        // ============================================================
        echo "2. Creating product...\n";

        $product = TurboQuote::createProduct(new CreateProductRequest(
            name: 'Widget Pro (Demo)',
            listPrice: 299.00,
            billingFrequency: 'monthly',
            categoryId: $categoryId,
            sku: 'WDGT-PRO-001',
            description: 'Premium widget with advanced features',
            cost: 120.00,
            currency: 'USD',
            showInCatalog: true,
        ));

        $productId = $product->id;
        echo "  Product created: {$product->name} (ID: {$productId})\n";
        echo "  List price: \${$product->listPrice}\n\n";

        // ============================================================
        // 3. GET PRODUCT
        // ============================================================
        echo "3. Fetching product by ID...\n";

        $fetched = TurboQuote::getProduct($productId);
        echo "  Fetched: {$fetched->name}, SKU: {$fetched->sku}\n\n";

        // ============================================================
        // 4. UPDATE PRODUCT
        // ============================================================
        echo "4. Updating product...\n";

        $updated = TurboQuote::updateProduct($productId, new UpdateProductRequest(
            listPrice: 349.00,
            description: 'Premium widget — now with even more features',
        ));

        echo "  Updated list price: \${$updated->listPrice}\n\n";

        // ============================================================
        // 5. DUPLICATE PRODUCT
        // ============================================================
        echo "5. Duplicating product...\n";

        $duplicate = TurboQuote::duplicateProduct($productId);
        $duplicateProductId = $duplicate->id;
        echo "  Duplicate created: {$duplicate->name} (ID: {$duplicateProductId})\n\n";

        // ============================================================
        // 6. LIST PRODUCTS
        // ============================================================
        echo "6. Listing products...\n";

        $list = TurboQuote::listProducts();
        echo "  Total products in catalog: {$list->totalRecords}\n\n";

        // ============================================================
        // 7. CREATE A BUNDLE (references the product above)
        // ============================================================
        echo "7. Creating bundle...\n";

        $bundle = TurboQuote::createBundle(new CreateBundleRequest(
            name: 'Starter Bundle (Demo)',
            categoryId: $categoryId,
            items: [
                [
                    'productId' => $productId,
                    'unitPrice' => 299.00,
                    'billingFrequency' => 'monthly',
                    'quantity' => 1,
                ],
            ],
            description: 'Everything you need to get started',
            bundleDiscountType: 'percent',
            bundleDiscountPercent: 5.0,
            showItemsToEndUser: true,
            showInCatalog: true,
        ));

        $bundleId = $bundle->id;
        echo "  Bundle created: {$bundle->name} (ID: {$bundleId})\n\n";

        // ============================================================
        // 8. GET BUNDLE
        // ============================================================
        echo "8. Fetching bundle by ID...\n";

        $fetchedBundle = TurboQuote::getBundle($bundleId);
        echo "  Fetched: {$fetchedBundle->name}\n\n";

        // ============================================================
        // 9. UPDATE BUNDLE — change discount to fixed-dollar amount
        // ============================================================
        echo "9. Updating bundle discount...\n";

        $updatedBundle = TurboQuote::updateBundle($bundleId, new UpdateBundleRequest(
            bundleDiscountType: 'amount',
            bundleDiscountAmount: 25.00,
        ));

        echo "  Updated bundle: {$updatedBundle->name}\n\n";

        // ============================================================
        // 10. DUPLICATE BUNDLE
        // ============================================================
        echo "10. Duplicating bundle...\n";

        $duplicateBundle = TurboQuote::duplicateBundle($bundleId);
        $duplicateBundleId = $duplicateBundle->id;
        echo "  Duplicate created: {$duplicateBundle->name} (ID: {$duplicateBundleId})\n\n";

        // ============================================================
        // 11. LIST BUNDLES
        // ============================================================
        echo "11. Listing bundles...\n";

        $bundleList = TurboQuote::listBundles();
        echo "  Total bundles in catalog: {$bundleList->totalRecords}\n\n";

    } catch (TurboDocxException $e) {
        echo "TurboDocx error [{$e->errorCode}]: {$e->getMessage()}\n";
    } catch (\Throwable $e) {
        echo "Unexpected error: {$e->getMessage()}\n";
    } finally {
        // ============================================================
        // CLEANUP
        // ============================================================
        echo "Cleaning up...\n";

        foreach ([$duplicateBundleId, $bundleId] as $id) {
            if ($id !== null) {
                try {
                    TurboQuote::deleteBundle($id);
                    echo "  Deleted bundle {$id}\n";
                } catch (\Throwable $e) {
                    echo "  Could not delete bundle {$id}: {$e->getMessage()}\n";
                }
            }
        }

        foreach ([$duplicateProductId, $productId] as $id) {
            if ($id !== null) {
                try {
                    TurboQuote::deleteProduct($id);
                    echo "  Deleted product {$id}\n";
                } catch (\Throwable $e) {
                    echo "  Could not delete product {$id}: {$e->getMessage()}\n";
                }
            }
        }

        if ($ownedCategoryId !== null) {
            try {
                TurboQuote::deleteType($ownedCategoryId);
                echo "  Deleted category {$ownedCategoryId}\n";
            } catch (\Throwable $e) {
                echo "  Could not delete category: {$e->getMessage()}\n";
            }
        }

        echo "Done.\n";
    }
}

turboquoteProductsExample();
