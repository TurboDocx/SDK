package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Represents a signature field.
 * Field types: signature, initial, date, text, full_name, title, company,
 * first_name, last_name, email, checkbox
 */
public class Field {
    @SerializedName("type")
    private final String type;

    @SerializedName("page")
    private final Integer page;

    @SerializedName("x")
    private final Integer x;

    @SerializedName("y")
    private final Integer y;

    @SerializedName("width")
    private final Integer width;

    @SerializedName("height")
    private final Integer height;

    @SerializedName("recipientEmail")
    private final String recipientEmail;

    @SerializedName("defaultValue")
    private final String defaultValue;

    @SerializedName("isMultiline")
    private final Boolean isMultiline;

    @SerializedName("isReadonly")
    private final Boolean isReadonly;

    @SerializedName("required")
    private final Boolean required;

    @SerializedName("backgroundColor")
    private final String backgroundColor;

    @SerializedName("template")
    private final TemplateAnchor template;

    // Simple constructor for coordinate-based fields
    public Field(String type, int page, int x, int y, int width, int height, String recipientEmail) {
        this(type, page, x, y, width, height, recipientEmail, null, null, null, null, null, null);
    }

    // Full constructor
    public Field(String type, Integer page, Integer x, Integer y, Integer width, Integer height,
                 String recipientEmail, String defaultValue, Boolean isMultiline, Boolean isReadonly,
                 Boolean required, String backgroundColor, TemplateAnchor template) {
        this.type = type;
        this.page = page;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.recipientEmail = recipientEmail;
        this.defaultValue = defaultValue;
        this.isMultiline = isMultiline;
        this.isReadonly = isReadonly;
        this.required = required;
        this.backgroundColor = backgroundColor;
        this.template = template;
    }

    public String getType() { return type; }
    public Integer getPage() { return page; }
    public Integer getX() { return x; }
    public Integer getY() { return y; }
    public Integer getWidth() { return width; }
    public Integer getHeight() { return height; }
    public String getRecipientEmail() { return recipientEmail; }
    public String getDefaultValue() { return defaultValue; }
    public Boolean getIsMultiline() { return isMultiline; }
    public Boolean getIsReadonly() { return isReadonly; }
    public Boolean getRequired() { return required; }
    public String getBackgroundColor() { return backgroundColor; }
    public TemplateAnchor getTemplate() { return template; }

    /**
     * Template anchor configuration for dynamic field positioning
     */
    public static class TemplateAnchor {
        @SerializedName("anchor")
        private final String anchor;

        @SerializedName("searchText")
        private final String searchText;

        @SerializedName("placement")
        private final String placement;

        @SerializedName("size")
        private final Size size;

        @SerializedName("offset")
        private final Offset offset;

        @SerializedName("caseSensitive")
        private final Boolean caseSensitive;

        @SerializedName("useRegex")
        private final Boolean useRegex;

        public TemplateAnchor(String anchor, String searchText, String placement,
                              Size size, Offset offset, Boolean caseSensitive, Boolean useRegex) {
            this.anchor = anchor;
            this.searchText = searchText;
            this.placement = placement;
            this.size = size;
            this.offset = offset;
            this.caseSensitive = caseSensitive;
            this.useRegex = useRegex;
        }

        public String getAnchor() { return anchor; }
        public String getSearchText() { return searchText; }
        public String getPlacement() { return placement; }
        public Size getSize() { return size; }
        public Offset getOffset() { return offset; }
        public Boolean getCaseSensitive() { return caseSensitive; }
        public Boolean getUseRegex() { return useRegex; }
    }

    public static class Size {
        @SerializedName("width")
        private final int width;

        @SerializedName("height")
        private final int height;

        public Size(int width, int height) {
            this.width = width;
            this.height = height;
        }

        public int getWidth() { return width; }
        public int getHeight() { return height; }
    }

    public static class Offset {
        @SerializedName("x")
        private final int x;

        @SerializedName("y")
        private final int y;

        public Offset(int x, int y) {
            this.x = x;
            this.y = y;
        }

        public int getX() { return x; }
        public int getY() { return y; }
    }
}
