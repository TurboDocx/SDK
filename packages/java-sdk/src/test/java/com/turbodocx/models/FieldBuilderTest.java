package com.turbodocx.models;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test-Driven Development tests for Field.Builder pattern
 *
 * These tests define the desired API for creating Field objects
 * using a fluent Builder pattern to replace the constructor with
 * many null parameters.
 */
class FieldBuilderTest {

    // ============================================
    // Field.Builder Tests - Coordinate-based fields
    // ============================================

    @Test
    @DisplayName("should build a coordinate-based signature field with all required fields")
    void buildCoordinateBasedSignatureField() {
        Field field = new Field.Builder()
                .type("signature")
                .page(1)
                .x(100)
                .y(500)
                .width(200)
                .height(50)
                .recipientEmail("john@example.com")
                .build();

        assertEquals("signature", field.getType());
        assertEquals(1, field.getPage());
        assertEquals(100, field.getX());
        assertEquals(500, field.getY());
        assertEquals(200, field.getWidth());
        assertEquals(50, field.getHeight());
        assertEquals("john@example.com", field.getRecipientEmail());
        assertNull(field.getTemplate());
    }

    @Test
    @DisplayName("should build a field with optional defaultValue")
    void buildFieldWithDefaultValue() {
        Field field = new Field.Builder()
                .type("text")
                .page(1)
                .x(100)
                .y(500)
                .width(200)
                .height(50)
                .recipientEmail("john@example.com")
                .defaultValue("Sample text")
                .build();

        assertEquals("text", field.getType());
        assertEquals("Sample text", field.getDefaultValue());
    }

    @Test
    @DisplayName("should build a field with optional boolean flags")
    void buildFieldWithBooleanFlags() {
        Field field = new Field.Builder()
                .type("text")
                .page(1)
                .x(100)
                .y(500)
                .width(200)
                .height(50)
                .recipientEmail("john@example.com")
                .isMultiline(true)
                .isReadonly(false)
                .required(true)
                .build();

        assertTrue(field.getIsMultiline());
        assertFalse(field.getIsReadonly());
        assertTrue(field.getRequired());
    }

    @Test
    @DisplayName("should build a field with backgroundColor")
    void buildFieldWithBackgroundColor() {
        Field field = new Field.Builder()
                .type("signature")
                .page(1)
                .x(100)
                .y(500)
                .width(200)
                .height(50)
                .recipientEmail("john@example.com")
                .backgroundColor("#FFFF00")
                .build();

        assertEquals("#FFFF00", field.getBackgroundColor());
    }

    // ============================================
    // Field.Builder Tests - Template-based fields
    // ============================================

    @Test
    @DisplayName("should build a template-based field with TemplateAnchor")
    void buildTemplateBasedField() {
        Field.TemplateAnchor template = new Field.TemplateAnchor.Builder()
                .anchor("{signature1}")
                .placement("replace")
                .size(new Field.Size(100, 30))
                .build();

        Field field = new Field.Builder()
                .type("signature")
                .recipientEmail("john@example.com")
                .template(template)
                .build();

        assertEquals("signature", field.getType());
        assertEquals("john@example.com", field.getRecipientEmail());
        assertNotNull(field.getTemplate());
        assertEquals("{signature1}", field.getTemplate().getAnchor());
        assertNull(field.getPage()); // Template-based fields don't need coordinates
        assertNull(field.getX());
        assertNull(field.getY());
    }

    @Test
    @DisplayName("should build a field with all optional parameters")
    void buildFieldWithAllOptions() {
        Field.TemplateAnchor template = new Field.TemplateAnchor.Builder()
                .anchor("{name1}")
                .searchText("Name:")
                .placement("after")
                .size(new Field.Size(150, 40))
                .offset(new Field.Offset(10, 5))
                .caseSensitive(true)
                .useRegex(false)
                .build();

        Field field = new Field.Builder()
                .type("full_name")
                .recipientEmail("john@example.com")
                .defaultValue("John Doe")
                .isMultiline(false)
                .isReadonly(false)
                .required(true)
                .backgroundColor("#E0E0E0")
                .template(template)
                .build();

        assertEquals("full_name", field.getType());
        assertEquals("john@example.com", field.getRecipientEmail());
        assertEquals("John Doe", field.getDefaultValue());
        assertFalse(field.getIsMultiline());
        assertFalse(field.getIsReadonly());
        assertTrue(field.getRequired());
        assertEquals("#E0E0E0", field.getBackgroundColor());
        assertNotNull(field.getTemplate());
    }

    // ============================================
    // Field.TemplateAnchor.Builder Tests
    // ============================================

    @Test
    @DisplayName("should build a simple TemplateAnchor with anchor and size")
    void buildSimpleTemplateAnchor() {
        Field.TemplateAnchor template = new Field.TemplateAnchor.Builder()
                .anchor("{signature1}")
                .size(new Field.Size(100, 30))
                .build();

        assertEquals("{signature1}", template.getAnchor());
        assertNotNull(template.getSize());
        assertEquals(100, template.getSize().getWidth());
        assertEquals(30, template.getSize().getHeight());
        assertNull(template.getSearchText());
        assertNull(template.getPlacement());
    }

    @Test
    @DisplayName("should build a TemplateAnchor with searchText and placement")
    void buildTemplateAnchorWithSearchText() {
        Field.TemplateAnchor template = new Field.TemplateAnchor.Builder()
                .searchText("Sign here:")
                .placement("after")
                .size(new Field.Size(200, 40))
                .build();

        assertEquals("Sign here:", template.getSearchText());
        assertEquals("after", template.getPlacement());
        assertNull(template.getAnchor());
    }

    @Test
    @DisplayName("should build a TemplateAnchor with offset")
    void buildTemplateAnchorWithOffset() {
        Field.TemplateAnchor template = new Field.TemplateAnchor.Builder()
                .anchor("{date1}")
                .size(new Field.Size(75, 30))
                .offset(new Field.Offset(5, 10))
                .build();

        assertNotNull(template.getOffset());
        assertEquals(5, template.getOffset().getX());
        assertEquals(10, template.getOffset().getY());
    }

    @Test
    @DisplayName("should build a TemplateAnchor with caseSensitive and useRegex flags")
    void buildTemplateAnchorWithFlags() {
        Field.TemplateAnchor template = new Field.TemplateAnchor.Builder()
                .searchText("Important")
                .placement("replace")
                .size(new Field.Size(100, 20))
                .caseSensitive(true)
                .useRegex(false)
                .build();

        assertTrue(template.getCaseSensitive());
        assertFalse(template.getUseRegex());
    }

    @Test
    @DisplayName("should build a TemplateAnchor with all parameters")
    void buildCompleteTemplateAnchor() {
        Field.TemplateAnchor template = new Field.TemplateAnchor.Builder()
                .anchor("{checkbox1}")
                .searchText("I agree")
                .placement("before")
                .size(new Field.Size(20, 20))
                .offset(new Field.Offset(-25, 0))
                .caseSensitive(false)
                .useRegex(true)
                .build();

        assertEquals("{checkbox1}", template.getAnchor());
        assertEquals("I agree", template.getSearchText());
        assertEquals("before", template.getPlacement());
        assertEquals(20, template.getSize().getWidth());
        assertEquals(20, template.getSize().getHeight());
        assertEquals(-25, template.getOffset().getX());
        assertEquals(0, template.getOffset().getY());
        assertFalse(template.getCaseSensitive());
        assertTrue(template.getUseRegex());
    }

    // ============================================
    // Validation Tests
    // ============================================

    @Test
    @DisplayName("should throw exception when type is missing")
    void throwExceptionWhenTypeMissing() {
        Field.Builder builder = new Field.Builder()
                .recipientEmail("john@example.com")
                .page(1)
                .x(100)
                .y(500)
                .width(200)
                .height(50);

        assertThrows(IllegalStateException.class, builder::build,
                "Field type is required");
    }

    @Test
    @DisplayName("should throw exception when recipientEmail is missing")
    void throwExceptionWhenRecipientEmailMissing() {
        Field.Builder builder = new Field.Builder()
                .type("signature")
                .page(1)
                .x(100)
                .y(500)
                .width(200)
                .height(50);

        assertThrows(IllegalStateException.class, builder::build,
                "Recipient email is required");
    }

    @Test
    @DisplayName("should allow building field with only type, recipientEmail, and template")
    void allowBuildingFieldWithMinimalTemplateConfig() {
        // Template-based fields don't need coordinates
        Field field = new Field.Builder()
                .type("signature")
                .recipientEmail("john@example.com")
                .template(new Field.TemplateAnchor.Builder()
                        .anchor("{sig}")
                        .size(new Field.Size(100, 30))
                        .build())
                .build();

        assertNotNull(field);
        assertNull(field.getPage());
        assertNull(field.getX());
    }
}
