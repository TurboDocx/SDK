<?php

/**
 * TurboQuote Example: Price Books
 *
 * This example demonstrates full pricebook management:
 * - Create / get / update / duplicate / delete a price book
 * - List price book products
 * - Apply a price book to a quote (applyPriceBook)
 * - Optionally: send quote with deliverable (set DELIVERABLE_ID env var)
 *
 * Required env vars:
 *   TURBODOCX_API_KEY          — your TDX- API key
 *   TURBODOCX_ORG_ID           — your organization UUID
 *   TURBODOCX_PRICEBOOK_TYPE_ID — existing price book type UUID
 *
 * Optional env vars:
 *   DELIVERABLE_ID             — TurboDocx deliverable UUID; when set, the example
 *                                 also calls sendQuoteWithDeliverable() to attach
 *                                 a generated document to the outbound quote email.
 *
 * Run: php examples/turboquote-pricebooks.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboQuote;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Types\Requests\Quote\CreatePriceBookRequest;
use TurboDocx\Types\Requests\Quote\UpdatePriceBookRequest;
use TurboDocx\Types\Requests\Quote\CreateCompanyRequest;
use TurboDocx\Types\Requests\Quote\CreateContactRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteRequest;
use TurboDocx\Types\Requests\Quote\AddLineItemRequest;
use TurboDocx\Types\Requests\Quote\SendQuoteWithDeliverableRequest;
use TurboDocx\Exceptions\TurboDocxException;

function turboquotePricebooksExample(): void
{
    TurboQuote::configure(new QuoteClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
    ));

    $priceBookTypeId = getenv('TURBODOCX_PRICEBOOK_TYPE_ID') ?: null;
    $deliverableId = getenv('DELIVERABLE_ID') ?: null;

    $priceBookId = null;
    $duplicateId = null;
    $companyId = null;
    $contactId = null;
    $quoteId = null;

    if ($priceBookTypeId === null) {
        echo "TURBODOCX_PRICEBOOK_TYPE_ID is not set.\n";
        echo "Set this env var to an existing price book type UUID and re-run.\n";
        echo "You can find your price book types in the TurboDocx dashboard under Quotes > Settings.\n";
        return;
    }

    try {
        // ============================================================
        // 1. CREATE PRICE BOOK
        // ============================================================
        echo "1. Creating price book...\n";

        $priceBook = TurboQuote::createPriceBook(new CreatePriceBookRequest(
            name: 'Partner Tier A (Demo)',
            priceBookTypeId: $priceBookTypeId,
            validFrom: date('Y-m-d'),
            validTo: date('Y-m-d', strtotime('+1 year')),
            discountPercent: 15.0,
            description: '15% discount for Tier A partners',
            isDefault: false,
            showInQuoteBuilder: true,
            // Per-product pricing overrides — each item can have its own discount
            productPricing: [
                // Replace with real productId values from your catalog
                // [
                //     'productId' => 'prod-uuid-here',
                //     'discountType' => 'percent',
                //     'discountPercent' => 20.0,
                // ],
                // [
                //     'productId' => 'prod-uuid-here-2',
                //     'discountType' => 'amount',
                //     'discountAmount' => 50.00,
                //     'finalPrice' => 249.00,
                // ],
            ],
        ));

        $priceBookId = $priceBook->id;
        echo "  Price book created: {$priceBook->name} (ID: {$priceBookId})\n";
        echo "  Discount: {$priceBook->discountPercent}%\n\n";

        // ============================================================
        // 2. GET PRICE BOOK
        // ============================================================
        echo "2. Fetching price book by ID...\n";

        $fetched = TurboQuote::getPriceBook($priceBookId);
        echo "  Fetched: {$fetched->name}\n\n";

        // ============================================================
        // 3. UPDATE PRICE BOOK
        // ============================================================
        echo "3. Updating price book...\n";

        $updated = TurboQuote::updatePriceBook($priceBookId, new UpdatePriceBookRequest(
            discountPercent: 20.0,
            description: '20% discount for Tier A partners (updated)',
        ));

        echo "  Updated discount: {$updated->discountPercent}%\n\n";

        // ============================================================
        // 4. LIST PRICE BOOK PRODUCTS
        // ============================================================
        echo "4. Listing products in this price book...\n";

        $pbProducts = TurboQuote::listPriceBookProducts($priceBookId);
        echo "  Products with custom pricing: {$pbProducts->totalRecords}\n\n";

        // ============================================================
        // 5. DUPLICATE PRICE BOOK
        // ============================================================
        echo "5. Duplicating price book...\n";

        $dupe = TurboQuote::duplicatePriceBook($priceBookId);
        $duplicateId = $dupe->id;
        echo "  Duplicate created: {$dupe->name} (ID: {$duplicateId})\n\n";

        // ============================================================
        // 6. LIST ALL PRICE BOOKS
        // ============================================================
        echo "6. Listing all price books...\n";

        $allBooks = TurboQuote::listPriceBooks();
        echo "  Total price books: {$allBooks->totalRecords}\n\n";

        // ============================================================
        // 7. APPLY PRICE BOOK TO A QUOTE
        // ============================================================
        echo "7. Creating a quote and applying the price book...\n";

        $company = TurboQuote::createCompany(new CreateCompanyRequest(
            name: 'Example Corp (Demo)',
            contacts: [['name' => 'Alice', 'email' => 'alice@example-demo.example.com']],
        ));
        $companyId = $company->id;

        $contact = TurboQuote::createContact(new CreateContactRequest(
            name: 'Alice',
            companyId: $companyId,
            email: 'alice@example-demo.example.com',
        ));
        $contactId = $contact->id;

        $quote = TurboQuote::createQuote(new CreateQuoteRequest(
            name: 'Partner Quote (Demo)',
            companyId: $companyId,
            contactId: $contactId,
        ));
        $quoteId = $quote->id;

        // Add a line item before applying the price book
        TurboQuote::addLineItems($quoteId, new AddLineItemRequest(
            productId: null,
            productName: 'Enterprise License',
            unitPrice: 1000.00,
            billingFrequency: 'monthly',
            quantity: 1,
        ));

        // Apply the price book — this reprices the line items
        $applyResult = TurboQuote::applyPriceBook($quoteId, $priceBookId);
        echo "  Price book applied.\n";
        echo "  Updated items: {$applyResult->updatedCount}\n\n";

        // ============================================================
        // 8. (OPTIONAL) SEND QUOTE WITH DELIVERABLE
        // ============================================================
        if ($deliverableId !== null) {
            echo "8. Sending quote with deliverable attachment...\n";

            $sent = TurboQuote::sendQuoteWithDeliverable($quoteId, new SendQuoteWithDeliverableRequest(
                deliverableId: $deliverableId,
                mergePosition: 'end',
            ));

            echo "  Quote sent!\n";
            echo "  Document ID: {$sent->documentId}\n";
            echo "  Status: {$sent->quote->status}\n\n";
        } else {
            echo "8. (Skipped — set DELIVERABLE_ID to demo sendQuoteWithDeliverable)\n\n";
        }

    } catch (TurboDocxException $e) {
        echo "TurboDocx error [{$e->errorCode}]: {$e->getMessage()}\n";
    } catch (\Throwable $e) {
        echo "Unexpected error: {$e->getMessage()}\n";
    } finally {
        // ============================================================
        // CLEANUP
        // ============================================================
        echo "Cleaning up...\n";

        if ($quoteId !== null) {
            try {
                TurboQuote::deleteQuote($quoteId);
                echo "  Deleted quote {$quoteId}\n";
            } catch (\Throwable $e) {
                echo "  Could not delete quote: {$e->getMessage()}\n";
            }
        }
        if ($contactId !== null) {
            try {
                TurboQuote::deleteContact($contactId);
                echo "  Deleted contact {$contactId}\n";
            } catch (\Throwable $e) {
                echo "  Could not delete contact: {$e->getMessage()}\n";
            }
        }
        if ($companyId !== null) {
            try {
                TurboQuote::deleteCompany($companyId);
                echo "  Deleted company {$companyId}\n";
            } catch (\Throwable $e) {
                echo "  Could not delete company: {$e->getMessage()}\n";
            }
        }
        if ($duplicateId !== null) {
            try {
                TurboQuote::deletePriceBook($duplicateId);
                echo "  Deleted duplicate price book {$duplicateId}\n";
            } catch (\Throwable $e) {
                echo "  Could not delete duplicate price book: {$e->getMessage()}\n";
            }
        }
        if ($priceBookId !== null) {
            try {
                TurboQuote::deletePriceBook($priceBookId);
                echo "  Deleted price book {$priceBookId}\n";
            } catch (\Throwable $e) {
                echo "  Could not delete price book: {$e->getMessage()}\n";
            }
        }

        echo "Done.\n";
    }
}

turboquotePricebooksExample();
