<?php

/**
 * Deliverable SDK - Basic Usage Example
 *
 * This example demonstrates the complete deliverable workflow:
 * 1. Configure the SDK
 * 2. Generate a deliverable from a template
 * 3. List deliverables
 * 4. Get deliverable details
 * 5. Download the source file and PDF
 * 6. Update and delete a deliverable
 */

require_once __DIR__ . '/../vendor/autoload.php';

use TurboDocx\Config\DeliverableConfig;
use TurboDocx\Deliverable;

// 1. Configure with your API credentials
Deliverable::configure(new DeliverableConfig(
    apiKey: $_ENV['TURBODOCX_API_KEY'],
    orgId: $_ENV['TURBODOCX_ORG_ID'],
));

// 2. Generate a deliverable from a template
echo "Generating deliverable...\n";
$created = Deliverable::generateDeliverable([
    'templateId' => 'YOUR_TEMPLATE_ID',
    'name' => 'Employee Contract - John Smith',
    'description' => 'Employment contract for senior developer',
    'variables' => [
        ['placeholder' => '{EmployeeName}', 'text' => 'John Smith', 'mimeType' => 'text'],
        ['placeholder' => '{CompanyName}', 'text' => 'TechCorp Solutions Inc.', 'mimeType' => 'text'],
        ['placeholder' => '{JobTitle}', 'text' => 'Senior Software Engineer', 'mimeType' => 'text'],
    ],
    'tags' => ['hr', 'contract', 'employee'],
]);
$deliverableId = $created['results']['deliverable']['id'];
echo "Created deliverable: {$deliverableId}\n";

// 3. List deliverables
echo "\nListing deliverables...\n";
$list = Deliverable::listDeliverables([
    'limit' => 5,
    'showTags' => true,
    'column0' => 'createdOn',
    'order0' => 'desc',
]);
echo "Found {$list['totalRecords']} deliverables\n";
foreach ($list['results'] as $d) {
    echo "  - {$d['name']} ({$d['id']})\n";
}

// 4. Get full details
echo "\nGetting deliverable details...\n";
$details = Deliverable::getDeliverableDetails($deliverableId, showTags: true);
echo "Name: {$details['name']}\n";
echo "Template: {$details['templateName']}\n";
echo "Variables: " . count($details['variables'] ?? []) . "\n";
$tagNames = array_map(fn($t) => $t['name'], $details['tags'] ?? []);
echo "Tags: " . implode(', ', $tagNames) . "\n";

// 5. Download files
echo "\nDownloading source file...\n";
$sourceFile = Deliverable::downloadSourceFile($deliverableId);
file_put_contents('contract.docx', $sourceFile);
echo "Saved contract.docx\n";

echo "Downloading PDF...\n";
$pdfFile = Deliverable::downloadPDF($deliverableId);
file_put_contents('contract.pdf', $pdfFile);
echo "Saved contract.pdf\n";

// 6. Update the deliverable
echo "\nUpdating deliverable...\n";
$updated = Deliverable::updateDeliverableInfo($deliverableId, [
    'name' => 'Employee Contract - John Smith (Final)',
    'tags' => ['hr', 'contract', 'finalized'],
]);
echo $updated['message'] . "\n";

// 7. Browse deliverable items
echo "\nBrowsing deliverable items...\n";
$items = Deliverable::listDeliverableItems(['limit' => 10, 'showTags' => true]);
echo "Found {$items['totalRecords']} items\n";

// 8. Delete the deliverable (soft delete)
// $deleted = Deliverable::deleteDeliverable($deliverableId);
// echo $deleted['message'] . "\n";

echo "\nDone!\n";
