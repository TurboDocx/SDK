<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Types\Field;
use TurboDocx\Types\FieldPlacement;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;

final class FieldTest extends TestCase
{
    public function testCreateFieldWithCoordinates(): void
    {
        $field = new Field(
            type: SignatureFieldType::SIGNATURE,
            recipientEmail: 'john@example.com',
            page: 1,
            x: 100,
            y: 500,
            width: 200,
            height: 50
        );

        $this->assertEquals(SignatureFieldType::SIGNATURE, $field->type);
        $this->assertEquals('john@example.com', $field->recipientEmail);
        $this->assertEquals(1, $field->page);
        $this->assertEquals(100, $field->x);
        $this->assertEquals(500, $field->y);
        $this->assertEquals(200, $field->width);
        $this->assertEquals(50, $field->height);
    }

    public function testCreateFieldWithTemplate(): void
    {
        $template = new TemplateConfig(
            anchor: '{signature1}',
            placement: FieldPlacement::REPLACE,
            size: ['width' => 100, 'height' => 30]
        );

        $field = new Field(
            type: SignatureFieldType::SIGNATURE,
            recipientEmail: 'john@example.com',
            template: $template
        );

        $this->assertEquals($template, $field->template);
    }

    public function testToArrayWithCoordinates(): void
    {
        $field = new Field(
            type: SignatureFieldType::DATE,
            recipientEmail: 'john@example.com',
            page: 1,
            x: 100,
            y: 500,
            width: 150,
            height: 30
        );

        $array = $field->toArray();

        $this->assertEquals([
            'type' => 'date',
            'recipientEmail' => 'john@example.com',
            'page' => 1,
            'x' => 100,
            'y' => 500,
            'width' => 150,
            'height' => 30,
        ], $array);
    }

    public function testToArrayWithTemplate(): void
    {
        $template = new TemplateConfig(
            anchor: '{signature1}',
            placement: FieldPlacement::REPLACE,
            size: ['width' => 100, 'height' => 30]
        );

        $field = new Field(
            type: SignatureFieldType::SIGNATURE,
            recipientEmail: 'john@example.com',
            template: $template
        );

        $array = $field->toArray();

        $this->assertEquals('signature', $array['type']);
        $this->assertEquals('john@example.com', $array['recipientEmail']);
        $this->assertArrayHasKey('template', $array);
        $this->assertEquals('{signature1}', $array['template']['anchor']);
        $this->assertEquals('replace', $array['template']['placement']);
    }

    public function testToArrayWithOptionalProperties(): void
    {
        $field = new Field(
            type: SignatureFieldType::CHECKBOX,
            recipientEmail: 'john@example.com',
            page: 1,
            x: 100,
            y: 600,
            width: 20,
            height: 20,
            defaultValue: 'true',
            isReadonly: true,
            required: true,
            backgroundColor: '#f0f0f0'
        );

        $array = $field->toArray();

        $this->assertEquals('checkbox', $array['type']);
        $this->assertEquals('true', $array['defaultValue']);
        $this->assertTrue($array['isReadonly']);
        $this->assertTrue($array['required']);
        $this->assertEquals('#f0f0f0', $array['backgroundColor']);
    }

    public function testToArrayExcludesNullOptionalProperties(): void
    {
        $field = new Field(
            type: SignatureFieldType::TEXT,
            recipientEmail: 'john@example.com',
            page: 1,
            x: 100,
            y: 200,
            width: 300,
            height: 30
        );

        $array = $field->toArray();

        $this->assertArrayNotHasKey('defaultValue', $array);
        $this->assertArrayNotHasKey('isMultiline', $array);
        $this->assertArrayNotHasKey('isReadonly', $array);
        $this->assertArrayNotHasKey('required', $array);
        $this->assertArrayNotHasKey('backgroundColor', $array);
        $this->assertArrayNotHasKey('template', $array);
    }
}
