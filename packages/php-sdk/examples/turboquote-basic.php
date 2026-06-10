<?php

/**
 * TurboQuote Example: Full Quote Lifecycle
 *
 * This example demonstrates a complete end-to-end quote workflow:
 * 1. Create a company and contact
 * 2. Create a quote
 * 3. Add line items
 * 4. Send the quote
 * 5. Poll for acceptance / check status
 * 6. Cleanup (delete quote, contact, company)
 *
 * Required env vars:
 *   TURBODOCX_API_KEY   — your TDX- API key
 *   TURBODOCX_ORG_ID    — your organization UUID
 *
 * Run: php examples/turboquote-basic.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboQuote;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Types\Requests\Quote\CreateCompanyRequest;
use TurboDocx\Types\Requests\Quote\CreateContactRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteRequest;
use TurboDocx\Types\Requests\Quote\AddLineItemRequest;
use TurboDocx\Types\Requests\Quote\SendQuoteRequest;
use TurboDocx\Exceptions\TurboDocxException;

function turboquoteBasicExample(): void
{
    TurboQuote::configure(new QuoteClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
    ));

    $companyId = null;
    $contactId = null;
    $quoteId = null;

    try {
        // ============================================================
        // 1. CREATE COMPANY (with an inline contact)
        // ============================================================
        echo "1. Creating company...\n";

        $company = TurboQuote::createCompany(new CreateCompanyRequest(
            name: 'Acme Corporation (Demo)',
            contacts: [
                [
                    'name' => 'Jane Smith',
                    'email' => 'jane.smith@acme-demo.example.com',
                    'title' => 'VP of Engineering',
                ],
            ],
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
        ));

        $companyId = $company->id;
        echo "  Company created: {$company->name} (ID: {$companyId})\n\n";

        // ============================================================
        // 2. CREATE CONTACT (linked to the company)
        // ============================================================
        echo "2. Creating contact...\n";

        $contact = TurboQuote::createContact(new CreateContactRequest(
            name: 'John Doe',
            companyId: $companyId,
            email: 'john.doe@acme-demo.example.com',
            title: 'CTO',
        ));

        $contactId = $contact->id;
        echo "  Contact created: {$contact->name} (ID: {$contactId})\n\n";

        // ============================================================
        // 3. CREATE QUOTE
        // ============================================================
        echo "3. Creating quote...\n";

        $quote = TurboQuote::createQuote(new CreateQuoteRequest(
            name: 'Enterprise License — Q3 2026',
            companyId: $companyId,
            contactId: $contactId,
            currency: 'USD',
            termDays: 30,
            validUntil: date('Y-m-d', strtotime('+30 days')),
        ));

        $quoteId = $quote->id;
        echo "  Quote created: {$quote->name} (ID: {$quoteId})\n";
        echo "  Status: {$quote->status}\n";
        echo "  Number: {$quote->quoteNumber}\n\n";

        // ============================================================
        // 4. ADD LINE ITEMS
        // ============================================================
        echo "4. Adding line items...\n";

        // Add multiple items in a single request
        $items = TurboQuote::addLineItems($quoteId, [
            new AddLineItemRequest(
                productId: null,               // null = ad-hoc item (no catalog product)
                productName: 'Platform Subscription',
                unitPrice: 499.00,
                billingFrequency: 'monthly',
                quantity: 1,
            ),
            new AddLineItemRequest(
                productId: null,
                productName: 'Professional Services',
                unitPrice: 2500.00,
                billingFrequency: 'one-time',
                quantity: 5,
                discountPercent: 10,          // 10% volume discount
            ),
            new AddLineItemRequest(
                productId: null,
                productName: 'Support Package',
                unitPrice: 150.00,
                billingFrequency: 'monthly',
                quantity: 1,
                discountType: 'amount',       // fixed-dollar discount
                discountAmount: 25.00,
            ),
        ]);

        echo "  Added " . count($items) . " line items:\n";
        foreach ($items as $item) {
            echo "  - {$item->productName}: \${$item->unitPrice} x {$item->quantity}\n";
        }
        echo "\n";

        // ============================================================
        // 5. SEND THE QUOTE
        // ============================================================
        echo "5. Sending quote...\n";

        $sendResult = TurboQuote::sendQuote($quoteId, new SendQuoteRequest(
            validUntil: date('Y-m-d', strtotime('+30 days')),
        ));

        echo "  Quote sent!\n";
        echo "  Status: {$sendResult->quote->status}\n";
        if (isset($sendResult->quote->sentAt)) {
            echo "  Sent at: {$sendResult->quote->sentAt}\n";
        }
        echo "\n";

        // ============================================================
        // 6. GET STATUS
        // ============================================================
        echo "6. Checking quote status...\n";

        $current = TurboQuote::getQuote($quoteId);
        echo "  Current status: {$current->status}\n\n";

    } catch (TurboDocxException $e) {
        echo "TurboDocx error [{$e->errorCode}]: {$e->getMessage()}\n";
    } catch (\Throwable $e) {
        echo "Unexpected error: {$e->getMessage()}\n";
    } finally {
        // ============================================================
        // CLEANUP — delete in reverse creation order
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

        echo "Done.\n";
    }
}

turboquoteBasicExample();
