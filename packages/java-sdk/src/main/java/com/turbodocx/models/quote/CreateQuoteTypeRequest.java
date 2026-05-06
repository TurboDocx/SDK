package com.turbodocx.models.quote;

/**
 * Request to create a type/category.
 */
public class CreateQuoteTypeRequest {
    private String name;
    private CategoryType categoryType;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public CategoryType getCategoryType() { return categoryType; }
    public void setCategoryType(CategoryType categoryType) { this.categoryType = categoryType; }
}
