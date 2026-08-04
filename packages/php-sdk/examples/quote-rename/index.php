<?php

/**
 * TurboQuote Example: Quote Renaming & Duplicate Naming
 *
 * A small, self-contained app that asserts the naming contract documented in
 * docs/SDKs/quote-php.md. It creates everything it needs and cleans up after itself.
 *
 * What it proves:
 * - `name` is trimmed on createQuote and updateQuote; whitespace-only is a 400
 * - the 255-character limit is applied AFTER trimming
 * - duplicateQuote names the copy `Copy of <source>`, truncated to 255
 * - renaming is draft-only — a sent quote refuses the rename
 *
 * Row ids (S20, S29, ...) refer to docs/QUOTE_RENAME_SDK_TEST_PLAN.md, so a failure here
 * can be quoted straight into that plan.
 *
 * Send-dependent checks (S72) need an org whose quote template has a sender name + email.
 * They are skipped unless RUN_SEND_CHECKS=1, and reported as skipped rather than passed.
 *
 * Required env vars:
 *   TURBODOCX_API_KEY   — your TDX- API key
 *   TURBODOCX_ORG_ID    — your organization UUID
 *
 * Run: php examples/quote-rename/index.php
 */

declare(strict_types=1);

require __DIR__ . '/../../vendor/autoload.php';

use TurboDocx\TurboQuote;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Types\Requests\Quote\CreateCompanyRequest;
use TurboDocx\Types\Requests\Quote\CreateContactRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteRequest;
use TurboDocx\Types\Requests\Quote\UpdateQuoteRequest;
use TurboDocx\Exceptions\TurboDocxException;

$results = [];

function record(string $id, string $description, bool $passed, string $detail): void
{
    global $results;
    $results[] = ['id' => $id, 'description' => $description,
        'outcome' => $passed ? 'pass' : 'fail', 'detail' => $detail];
    printf("  %s  %s  %s\n        %s\n", $passed ? 'PASS' : 'FAIL', $id, $description, $detail);
}

function skipRow(string $id, string $description, string $reason): void
{
    global $results;
    $results[] = ['id' => $id, 'description' => $description, 'outcome' => 'skip', 'detail' => $reason];
    printf("  SKIP  %s  %s\n        %s\n", $id, $description, $reason);
}

/** Runs a call expected to fail validation and reports the status code it produced. */
function expectRejection(string $id, string $description, callable $call): void
{
    try {
        $call();
        record($id, $description, false, 'the call SUCCEEDED — a 400 was expected');
    } catch (TurboDocxException $error) {
        // Public readonly property, not a getter — the PHP SDK exposes it as `->statusCode`.
        $statusCode = $error->statusCode;
        record(
            $id,
            $description,
            $statusCode === 400,
            sprintf('status=%s message=%s', $statusCode, $error->getMessage())
        );
    }
}

function quoteRenameExample(): void
{
    global $results;

    // baseUrl is passed explicitly: QuoteClientConfig defaults it to the production host, so
    // without this the example would silently run against production instead of the host in
    // TURBODOCX_BASE_URL — and it creates and deletes real records.
    TurboQuote::configure(new QuoteClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
    ));

    $createdQuoteIds = [];
    $companyId = null;
    $contactId = null;

    try {
        // ============================================================
        // 1. SET UP — a company and contact to hang quotes off
        //    (TurboQuoteHeader.companyId is NOT NULL, so this is mandatory)
        // ============================================================
        echo "1. Creating company and contact...\n\n";

        $company = TurboQuote::createCompany(new CreateCompanyRequest(
            name: 'Rename Example Co ' . (int) (microtime(true) * 1000),
            contacts: [['name' => 'Dana Reed', 'email' => 'dana@rename-example.example.com']],
            country: 'US',
        ));
        $companyId = $company->id;

        $contact = TurboQuote::createContact(new CreateContactRequest(
            name: 'Dana Reed',
            companyId: $companyId,
            email: 'dana@rename-example.example.com',
        ));
        $contactId = $contact->id;

        $newQuote = function (string $name) use ($companyId, $contactId, &$createdQuoteIds) {
            $quote = TurboQuote::createQuote(new CreateQuoteRequest(
                name: $name,
                companyId: $companyId,
                contactId: $contactId,
            ));
            $createdQuoteIds[] = $quote->id;
            return $quote;
        };

        // ============================================================
        // 2. TRIMMING ON CREATE
        // ============================================================
        echo "\n2. Trimming on create\n\n";

        $padded = $newQuote('  Acme Q3  ');
        record(
            'S20',
            'createQuote trims leading/trailing whitespace',
            $padded->name === 'Acme Q3',
            sprintf('name=%s', var_export($padded->name, true))
        );

        $interior = $newQuote('Acme  Corp');
        record(
            'S44',
            'interior whitespace is preserved (trim is not a normalise)',
            $interior->name === 'Acme  Corp',
            sprintf('name=%s', var_export($interior->name, true))
        );

        $unicode = $newQuote('案件 🚀 Ünïcode');
        record(
            'S31',
            'unicode and emoji survive round-trip',
            $unicode->name === '案件 🚀 Ünïcode',
            sprintf('name=%s', var_export($unicode->name, true))
        );

        expectRejection(
            'S22',
            'whitespace-only name is rejected on create',
            fn() => TurboQuote::createQuote(new CreateQuoteRequest(
                name: '   ',
                companyId: $companyId,
                contactId: $contactId
            ))
        );

        expectRejection(
            'S24',
            'tab/newline-only name is rejected on create',
            fn() => TurboQuote::createQuote(new CreateQuoteRequest(
                name: "\t\n",
                companyId: $companyId,
                contactId: $contactId
            ))
        );

        expectRejection(
            'S25',
            'empty name is rejected on create',
            fn() => TurboQuote::createQuote(new CreateQuoteRequest(
                name: '',
                companyId: $companyId,
                contactId: $contactId
            ))
        );

        // ============================================================
        // 3. LENGTH BOUNDARIES — the limit applies AFTER trimming
        // ============================================================
        echo "\n3. Length boundaries\n\n";

        $atLimit = $newQuote(str_repeat('A', 255));
        record(
            'S26',
            '255 characters is accepted (inclusive maximum)',
            mb_strlen($atLimit->name) === 255,
            sprintf('length=%d', mb_strlen($atLimit->name))
        );

        expectRejection(
            'S27',
            '256 characters is rejected',
            fn() => TurboQuote::createQuote(new CreateQuoteRequest(
                name: str_repeat('A', 256),
                companyId: $companyId,
                contactId: $contactId
            ))
        );

        $paddedToLimit = $newQuote('  ' . str_repeat('B', 255) . '  ');
        record(
            'S28',
            '255 chars wrapped in whitespace is accepted — trim runs before the length check',
            mb_strlen($paddedToLimit->name) === 255,
            sprintf('length=%d', mb_strlen($paddedToLimit->name))
        );

        // ============================================================
        // 4. RENAMING A DRAFT
        // ============================================================
        echo "\n4. Renaming a draft\n\n";

        $source = $newQuote('Acme Q3');
        $renamed = TurboQuote::updateQuote($source->id, new UpdateQuoteRequest(name: 'Acme Q3 — Revised'));
        record(
            'S2',
            'updateQuote renames a draft',
            $renamed->name === 'Acme Q3 — Revised',
            sprintf('name=%s', var_export($renamed->name, true))
        );

        $trimmed = TurboQuote::updateQuote($source->id, new UpdateQuoteRequest(name: '  Acme Q3 — Final  '));
        record(
            'S21',
            'updateQuote trims the new name',
            $trimmed->name === 'Acme Q3 — Final',
            sprintf('name=%s', var_export($trimmed->name, true))
        );

        expectRejection(
            'S23a',
            'whitespace-only name is rejected on update',
            fn() => TurboQuote::updateQuote($source->id, new UpdateQuoteRequest(name: '   '))
        );

        $afterRejection = TurboQuote::getQuote($source->id);
        record(
            'S23b',
            'the rejected rename left the stored name untouched',
            $afterRejection->name === 'Acme Q3 — Final',
            sprintf('name=%s', var_export($afterRejection->name, true))
        );

        // ============================================================
        // 5. DUPLICATE NAMING
        // ============================================================
        echo "\n5. Duplicate naming\n\n";

        $copy = TurboQuote::duplicateQuote($source->id);
        $createdQuoteIds[] = $copy->id;
        record(
            'S3',
            'duplicateQuote prefixes the copy with "Copy of "',
            $copy->name === 'Copy of Acme Q3 — Final',
            sprintf('name=%s', var_export($copy->name, true))
        );

        record(
            'S13',
            'the copy is built from the CURRENT name, not the name at creation',
            !str_contains($copy->name, 'Revised') && str_contains($copy->name, 'Final'),
            sprintf('source was renamed twice; copy=%s', var_export($copy->name, true))
        );

        $copyOfCopy = TurboQuote::duplicateQuote($copy->id);
        $createdQuoteIds[] = $copyOfCopy->id;
        record(
            'S30',
            'duplicating a copy genuinely stacks the prefix (unlike a renewal)',
            $copyOfCopy->name === 'Copy of ' . $copy->name,
            sprintf('name=%s', var_export($copyOfCopy->name, true))
        );

        $longSource = $newQuote(str_repeat('C', 255));
        $longCopy = TurboQuote::duplicateQuote($longSource->id);
        $createdQuoteIds[] = $longCopy->id;
        record(
            'S29',
            'a copy of a 255-char name is truncated to 255, so the insert cannot overflow',
            mb_strlen($longCopy->name) === 255 && str_starts_with($longCopy->name, 'Copy of '),
            sprintf('length=%d prefix=%s', mb_strlen($longCopy->name), var_export(mb_substr($longCopy->name, 0, 12), true))
        );

        // ============================================================
        // 6. RENAME IS DRAFT-ONLY
        // ============================================================
        echo "\n6. Rename is draft-only\n\n";

        if (getenv('RUN_SEND_CHECKS') === '1') {
            $toSend = $newQuote('Sent Quote Rename Check');
            TurboQuote::sendQuote($toSend->id);
            expectRejection(
                'S72',
                'a sent quote refuses a rename',
                fn() => TurboQuote::updateQuote(
                    $toSend->id,
                    new UpdateQuoteRequest(name: 'Renamed After Send')
                )
            );
        } else {
            skipRow(
                'S72',
                'a sent quote refuses a rename',
                'set RUN_SEND_CHECKS=1 with a send-capable org '
                . '(sender name + email on the org quote template)'
            );
        }

        // ============================================================
        // 7. SUMMARY
        // ============================================================
        $passed = count(array_filter($results, fn($r) => $r['outcome'] === 'pass'));
        $failed = count(array_filter($results, fn($r) => $r['outcome'] === 'fail'));
        $skipped = count(array_filter($results, fn($r) => $r['outcome'] === 'skip'));

        echo "\n" . str_repeat('=', 60) . "\n";
        printf("  %d passed · %d failed · %d skipped\n", $passed, $failed, $skipped);
        echo str_repeat('=', 60) . "\n\n";

        if ($failed > 0) {
            echo "Failed rows:\n";
            foreach (array_filter($results, fn($r) => $r['outcome'] === 'fail') as $result) {
                printf("  %s  %s — %s\n", $result['id'], $result['description'], $result['detail']);
            }
            exit(1);
        }
    } finally {
        // ============================================================
        // CLEANUP — leave the org as we found it
        // ============================================================
        echo "\nCleaning up...\n";
        foreach ($createdQuoteIds as $quoteId) {
            try {
                TurboQuote::deleteQuote($quoteId);
            } catch (TurboDocxException) {
                // cleanup is best-effort
            }
        }
        if ($contactId) {
            try {
                TurboQuote::deleteContact($contactId);
            } catch (TurboDocxException) {
            }
        }
        if ($companyId) {
            try {
                TurboQuote::deleteCompany($companyId);
            } catch (TurboDocxException) {
            }
        }
        echo "Done.\n";
    }
}

quoteRenameExample();
