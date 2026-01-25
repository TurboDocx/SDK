<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Types\Requests\GenerateTemplateRequest;
use TurboDocx\Types\TemplateVariable;
use TurboDocx\Types\VariableMimeType;

/**
 * TurboTemplate Module Tests
 *
 * Tests for advanced templating features:
 * - Helper functions (simple, nested, loop, conditional, image)
 * - Variable validation
 * - Request building
 */
class TurboTemplateTest extends TestCase
{
    // ============================================
    // Helper Function Tests - simple()
    // ============================================

    public function testSimpleVariableWithAllRequiredParams(): void
    {
        $variable = TemplateVariable::simple('{customer_name}', 'customer_name', 'Person A');

        $this->assertEquals('{customer_name}', $variable->placeholder);
        $this->assertEquals('customer_name', $variable->name);
        $this->assertEquals('Person A', $variable->value);
        $this->assertEquals(VariableMimeType::TEXT, $variable->mimeType);
    }

    public function testSimpleVariableWithNumberValue(): void
    {
        $variable = TemplateVariable::simple('{order_total}', 'order_total', 1500);

        $this->assertEquals('{order_total}', $variable->placeholder);
        $this->assertEquals('order_total', $variable->name);
        $this->assertEquals(1500, $variable->value);
    }

    public function testSimpleVariableWithHtmlMimeType(): void
    {
        $variable = TemplateVariable::simple('{content}', 'content', '<b>Bold</b>', VariableMimeType::HTML);

        $this->assertEquals('{content}', $variable->placeholder);
        $this->assertEquals('content', $variable->name);
        $this->assertEquals('<b>Bold</b>', $variable->value);
        $this->assertEquals(VariableMimeType::HTML, $variable->mimeType);
    }

    public function testSimpleVariableThrowsWhenPlaceholderMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::simple('', 'name', 'value');
    }

    public function testSimpleVariableThrowsWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::simple('{test}', '', 'value');
    }

    public function testSimpleVariableThrowsWhenMimeTypeInvalid(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::simple('{test}', 'test', 'value', VariableMimeType::JSON);
    }

    // ============================================
    // Helper Function Tests - advancedEngine()
    // ============================================

    public function testAdvancedEngineVariableWithObjectValue(): void
    {
        $user = [
            'firstName' => 'Foo',
            'lastName' => 'Bar',
            'email' => 'foo@example.com',
        ];

        $variable = TemplateVariable::advancedEngine('{user}', 'user', $user);

        $this->assertEquals('{user}', $variable->placeholder);
        $this->assertEquals('user', $variable->name);
        $this->assertEquals($user, $variable->value);
        $this->assertEquals(VariableMimeType::JSON, $variable->mimeType);
        $this->assertTrue($variable->usesAdvancedTemplatingEngine);
    }

    public function testAdvancedEngineVariableWithDeeplyNestedObject(): void
    {
        $company = [
            'name' => 'Company ABC',
            'address' => [
                'street' => '123 Test Street',
                'city' => 'Test City',
                'state' => 'TS',
            ],
        ];

        $variable = TemplateVariable::advancedEngine('{company}', 'company', $company);

        $this->assertEquals('{company}', $variable->placeholder);
        $this->assertEquals(VariableMimeType::JSON, $variable->mimeType);
        $this->assertTrue($variable->usesAdvancedTemplatingEngine);
    }

    public function testAdvancedEngineVariableThrowsWhenPlaceholderMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::advancedEngine('', 'user', ['name' => 'Test']);
    }

    public function testAdvancedEngineVariableThrowsWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::advancedEngine('{user}', '', ['name' => 'Test']);
    }

    // ============================================
    // Helper Function Tests - loop()
    // ============================================

    public function testLoopVariableWithArrayValue(): void
    {
        $items = [
            ['name' => 'Item A', 'price' => 100],
            ['name' => 'Item B', 'price' => 200],
        ];

        $variable = TemplateVariable::loop('{items}', 'items', $items);

        $this->assertEquals('{items}', $variable->placeholder);
        $this->assertEquals('items', $variable->name);
        $this->assertEquals($items, $variable->value);
        $this->assertEquals(VariableMimeType::JSON, $variable->mimeType);
        $this->assertTrue($variable->usesAdvancedTemplatingEngine);
    }

    public function testLoopVariableWithEmptyArray(): void
    {
        $products = [];

        $variable = TemplateVariable::loop('{products}', 'products', $products);

        $this->assertEquals('{products}', $variable->placeholder);
        $this->assertEquals($products, $variable->value);
        $this->assertEquals(VariableMimeType::JSON, $variable->mimeType);
    }

    public function testLoopVariableWithPrimitiveArray(): void
    {
        $tags = ['tag1', 'tag2', 'tag3'];

        $variable = TemplateVariable::loop('{tags}', 'tags', $tags);

        $this->assertEquals($tags, $variable->value);
    }

    public function testLoopVariableThrowsWhenPlaceholderMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::loop('', 'items', []);
    }

    public function testLoopVariableThrowsWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::loop('{items}', '', []);
    }

    // ============================================
    // Helper Function Tests - conditional()
    // ============================================

    public function testConditionalVariableWithBooleanTrue(): void
    {
        $variable = TemplateVariable::conditional('{is_premium}', 'is_premium', true);

        $this->assertEquals('{is_premium}', $variable->placeholder);
        $this->assertEquals('is_premium', $variable->name);
        $this->assertTrue($variable->value);
        $this->assertTrue($variable->usesAdvancedTemplatingEngine);
    }

    public function testConditionalVariableWithBooleanFalse(): void
    {
        $variable = TemplateVariable::conditional('{show_discount}', 'show_discount', false);

        $this->assertFalse($variable->value);
        $this->assertTrue($variable->usesAdvancedTemplatingEngine);
    }

    public function testConditionalVariableWithTruthyValue(): void
    {
        $variable = TemplateVariable::conditional('{count}', 'count', 5);

        $this->assertEquals(5, $variable->value);
    }

    public function testConditionalVariableThrowsWhenPlaceholderMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::conditional('', 'is_active', true);
    }

    public function testConditionalVariableThrowsWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::conditional('{is_active}', '', true);
    }

    // ============================================
    // Helper Function Tests - image()
    // ============================================

    public function testImageVariableWithUrl(): void
    {
        $variable = TemplateVariable::image('{logo}', 'logo', 'https://example.com/logo.png');

        $this->assertEquals('{logo}', $variable->placeholder);
        $this->assertEquals('logo', $variable->name);
        $this->assertEquals('https://example.com/logo.png', $variable->value);
        $this->assertEquals(VariableMimeType::IMAGE, $variable->mimeType);
    }

    public function testImageVariableWithBase64(): void
    {
        $base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...';
        $variable = TemplateVariable::image('{signature}', 'signature', $base64Image);

        $this->assertEquals($base64Image, $variable->value);
        $this->assertEquals(VariableMimeType::IMAGE, $variable->mimeType);
    }

    public function testImageVariableThrowsWhenPlaceholderMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::image('', 'logo', 'https://example.com/logo.png');
    }

    public function testImageVariableThrowsWhenNameMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::image('{logo}', '', 'https://example.com/logo.png');
    }

    public function testImageVariableThrowsWhenImageUrlMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        TemplateVariable::image('{logo}', 'logo', '');
    }

    // ============================================
    // Request Building Tests
    // ============================================

    public function testGenerateTemplateRequestWithSimpleVariables(): void
    {
        $request = new GenerateTemplateRequest(
            templateId: 'template-123',
            variables: [
                TemplateVariable::simple('{customer_name}', 'customer_name', 'Person A'),
                TemplateVariable::simple('{order_total}', 'order_total', 1500),
            ],
            name: 'Test Document',
            description: 'Test description'
        );

        $this->assertEquals('template-123', $request->templateId);
        $this->assertCount(2, $request->variables);
        $this->assertEquals('Test Document', $request->name);
    }

    public function testGenerateTemplateRequestThrowsWhenTemplateIdMissing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new GenerateTemplateRequest(
            templateId: '',
            variables: [TemplateVariable::simple('{test}', 'test', 'value')]
        );
    }

    public function testGenerateTemplateRequestThrowsWhenVariablesEmpty(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        new GenerateTemplateRequest(
            templateId: 'template-123',
            variables: []
        );
    }

    public function testGenerateTemplateRequestToArray(): void
    {
        $request = new GenerateTemplateRequest(
            templateId: 'template-123',
            variables: [
                TemplateVariable::simple('{test}', 'test', 'value'),
            ],
            name: 'Test',
            replaceFonts: true,
            defaultFont: 'Arial',
            outputFormat: 'pdf',
            metadata: ['customField' => 'value']
        );

        $array = $request->toArray();

        $this->assertEquals('template-123', $array['templateId']);
        $this->assertIsArray($array['variables']);
        $this->assertEquals('Test', $array['name']);
        $this->assertTrue($array['replaceFonts']);
        $this->assertEquals('Arial', $array['defaultFont']);
        $this->assertEquals('pdf', $array['outputFormat']);
        $this->assertEquals(['customField' => 'value'], $array['metadata']);
    }

    // ============================================
    // Variable Serialization Tests
    // ============================================

    public function testVariableToArrayIncludesAllFields(): void
    {
        $variable = new TemplateVariable(
            placeholder: '{test}',
            name: 'test',
            mimeType: VariableMimeType::TEXT,
            value: 'value',
            usesAdvancedTemplatingEngine: true,
            description: 'Test variable'
        );

        $array = $variable->toArray();

        $this->assertEquals('{test}', $array['placeholder']);
        $this->assertEquals('test', $array['name']);
        $this->assertEquals('text', $array['mimeType']);
        $this->assertEquals('value', $array['value']);
        $this->assertTrue($array['usesAdvancedTemplatingEngine']);
        $this->assertEquals('Test variable', $array['description']);
    }

    public function testVariableToArrayAllowsNullValue(): void
    {
        $variable = new TemplateVariable(
            placeholder: '{test}',
            name: 'test',
            mimeType: VariableMimeType::TEXT,
            value: null
        );

        $array = $variable->toArray();

        $this->assertArrayHasKey('value', $array);
        $this->assertNull($array['value']);
    }
}
