<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboTemplate;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Requests\GenerateTemplateRequest;
use TurboDocx\Types\TemplateVariable;
use TurboDocx\Types\VariableMimeType;

// Configure the client
TurboTemplate::configure(new HttpClientConfig(
    apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key',
    orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id'
));

/**
 * Example: Complex Invoice
 *
 * Combines multiple features: nested objects, loops, conditionals, expressions
 */
function complexInvoice(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'invoice-template-id',
            variables: [
                // Customer info (nested object)
                TemplateVariable::advancedEngine('{customer}', 'customer', [
                    'name' => 'Company ABC',
                    'email' => 'billing@example.com',
                    'address' => [
                        'street' => '123 Test Street',
                        'city' => 'Test City',
                        'state' => 'TS',
                        'zip' => '00000'
                    ]
                ]),

                // Invoice metadata
                TemplateVariable::simple('{invoice_number}', 'invoice_number', 'INV-0000-001'),
                TemplateVariable::simple('{invoice_date}', 'invoice_date', '2024-01-01'),
                TemplateVariable::simple('{due_date}', 'due_date', '2024-02-01'),

                // Line items (array for loops)
                TemplateVariable::loop('{items}', 'items', [
                    [
                        'description' => 'Service A',
                        'quantity' => 40,
                        'rate' => 150
                    ],
                    [
                        'description' => 'Service B',
                        'quantity' => 1,
                        'rate' => 5000
                    ],
                    [
                        'description' => 'Service C',
                        'quantity' => 12,
                        'rate' => 500
                    ]
                ]),

                // Tax and totals (for expressions)
                new TemplateVariable(
                    placeholder: '{tax_rate}',
                    name: 'tax_rate',
                    mimeType: VariableMimeType::TEXT,
                    value: '0.08',
                    usesAdvancedTemplatingEngine: true
                ),

                // Premium customer flag (for conditionals)
                TemplateVariable::conditional('{is_premium}', 'is_premium', true),
                new TemplateVariable(
                    placeholder: '{premium_discount}',
                    name: 'premium_discount',
                    mimeType: VariableMimeType::TEXT,
                    value: '0.05',
                    usesAdvancedTemplatingEngine: true
                ),

                // Payment terms
                TemplateVariable::simple('{payment_terms}', 'payment_terms', 'Net 30'),

                // Notes
                TemplateVariable::simple('{notes}', 'notes', 'Thank you for your business!')
            ],
            name: 'Invoice - Company ABC',
            description: 'Monthly invoice',
            outputFormat: 'pdf'
        )
    );

    echo "Complex invoice generated: {$result->deliverableId}\n";
}

/**
 * Example: Expressions and Calculations
 *
 * Template: "Subtotal: ${subtotal}, Tax: ${subtotal * tax_rate}, Total: ${subtotal * (1 + tax_rate)}"
 */
function expressionsAndCalculations(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'your-template-id',
            variables: [
                new TemplateVariable(
                    placeholder: '{subtotal}',
                    name: 'subtotal',
                    mimeType: VariableMimeType::TEXT,
                    value: '1000',
                    usesAdvancedTemplatingEngine: true
                ),
                new TemplateVariable(
                    placeholder: '{tax_rate}',
                    name: 'tax_rate',
                    mimeType: VariableMimeType::TEXT,
                    value: '0.08',
                    usesAdvancedTemplatingEngine: true
                )
            ],
            name: 'Expressions Document',
            description: 'Arithmetic expressions example'
        )
    );

    echo "Document with expressions generated: {$result->deliverableId}\n";
}

/**
 * Example: Using All Helper Methods
 */
function usingHelpers(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'your-template-id',
            variables: [
                // Simple variable
                TemplateVariable::simple('{title}', 'title', 'Quarterly Report'),

                // Advanced engine variable
                TemplateVariable::advancedEngine('{company}', 'company', [
                    'name' => 'Company XYZ',
                    'headquarters' => 'Test Location',
                    'employees' => 500
                ]),

                // Loop variable
                TemplateVariable::loop('{departments}', 'departments', [
                    ['name' => 'Dept A', 'headcount' => 200],
                    ['name' => 'Dept B', 'headcount' => 150],
                    ['name' => 'Dept C', 'headcount' => 100]
                ]),

                // Conditional
                TemplateVariable::conditional('{show_financials}', 'show_financials', true),

                // Image
                TemplateVariable::image('{company_logo}', 'company_logo', 'https://example.com/logo.png')
            ],
            name: 'Helper Functions Document',
            description: 'Using helper functions example'
        )
    );

    echo "Document with helpers generated: {$result->deliverableId}\n";
}

/**
 * Example: Custom Options
 *
 * Demonstrates using optional request parameters
 */
function customOptions(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'your-template-id',
            variables: [
                TemplateVariable::simple('{title}', 'title', 'Custom Document')
            ],
            name: 'Custom Options Document',
            description: 'Document with custom options',
            replaceFonts: true,
            defaultFont: 'Arial',
            outputFormat: 'pdf',
            metadata: [
                'customField' => 'value',
                'department' => 'Sales',
                'region' => 'North America'
            ]
        )
    );

    echo "Document with custom options generated: {$result->deliverableId}\n";
}

// Uncomment the examples you want to run:
// complexInvoice();
// expressionsAndCalculations();
// usingHelpers();
// customOptions();

echo "Advanced examples ready to run!\n";
