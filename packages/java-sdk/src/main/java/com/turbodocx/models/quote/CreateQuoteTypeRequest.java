package com.turbodocx.models.quote;

/**
 * Request to create a type/category.
 */
public class CreateQuoteTypeRequest {
    private String name;
    private String categoryType;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategoryType() { return categoryType; }
    public void setCategoryType(String categoryType) { this.categoryType = categoryType; }
}
