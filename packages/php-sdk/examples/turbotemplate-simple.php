<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboTemplate;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Requests\GenerateTemplateRequest;
use TurboDocx\Types\TemplateVariable;

// Configure the client
TurboTemplate::configure(new HttpClientConfig(
    apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key',
    orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id'
));

/**
 * Example 1: Simple Variable Substitution
 *
 * Template: "Dear {customer_name}, your order total is ${order_total}."
 */
function simpleSubstitution(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'your-template-id',
            variables: [
                TemplateVariable::simple('{customer_name}', 'customer_name', 'Foo Bar'),
                TemplateVariable::simple('{order_total}', 'order_total', 1500),
                TemplateVariable::simple('{order_date}', 'order_date', '2024-01-01'),
            ],
            name: 'Simple Substitution Document',
            description: 'Basic variable substitution example'
        )
    );

    echo "Document generated: {$result->deliverableId}\n";
}

/**
 * Example 2: Nested Objects with Dot Notation
 *
 * Template: "Name: {user.name}, Email: {user.email}, Company: {user.profile.company}"
 */
function nestedObjects(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'your-template-id',
            variables: [
                TemplateVariable::advancedEngine('{user}', 'user', [
                    'name' => 'Person A',
                    'email' => 'persona@example.com',
                    'profile' => [
                        'company' => 'Company XYZ',
                        'title' => 'Role 1',
                        'location' => 'Test City, TS',
                    ],
                ]),
            ],
            name: 'Nested Objects Document',
            description: 'Nested object with dot notation example'
        )
    );

    echo "Document with nested data generated: {$result->deliverableId}\n";
}

/**
 * Example 3: Loops/Arrays
 *
 * Template:
 * {#items}
 * - {name}: {quantity} x ${price} = ${quantity * price}
 * {/items}
 */
function loopsAndArrays(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'your-template-id',
            variables: [
                TemplateVariable::loop('{items}', 'items', [
                    ['name' => 'Item A', 'quantity' => 5, 'price' => 100, 'sku' => 'SKU-001'],
                    ['name' => 'Item B', 'quantity' => 3, 'price' => 200, 'sku' => 'SKU-002'],
                    ['name' => 'Item C', 'quantity' => 10, 'price' => 50, 'sku' => 'SKU-003'],
                ]),
            ],
            name: 'Array Loops Document',
            description: 'Array loop iteration example'
        )
    );

    echo "Document with loop generated: {$result->deliverableId}\n";
}

/**
 * Example 4: Conditionals
 *
 * Template:
 * {#if is_premium}
 * Premium Member Discount: {discount * 100}%
 * {/if}
 * {#if !is_premium}
 * Become a premium member for exclusive discounts!
 * {/if}
 */
function conditionals(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'your-template-id',
            variables: [
                TemplateVariable::conditional('{is_premium}', 'is_premium', true),
                TemplateVariable::conditional('{discount}', 'discount', 0.2),
            ],
            name: 'Conditionals Document',
            description: 'Boolean conditional example'
        )
    );

    echo "Document with conditionals generated: {$result->deliverableId}\n";
}

/**
 * Example 5: Using Images
 */
function usingImages(): void
{
    $result = TurboTemplate::generate(
        new GenerateTemplateRequest(
            templateId: 'your-template-id',
            variables: [
                TemplateVariable::simple('{title}', 'title', 'Quarterly Report'),
                TemplateVariable::image('{logo}', 'logo', 'https://example.com/logo.png'),
            ],
            name: 'Document with Images',
            description: 'Using image variables'
        )
    );

    echo "Document with images generated: {$result->deliverableId}\n";
}

// Uncomment the examples you want to run:
// simpleSubstitution();
// nestedObjects();
// loopsAndArrays();
// conditionals();
// usingImages();

echo "Examples ready to run!\n";
