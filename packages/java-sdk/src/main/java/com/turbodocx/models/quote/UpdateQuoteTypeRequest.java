package com.turbodocx.models.quote;

/**
 * Request to update a type/category.
 */
public class UpdateQuoteTypeRequest {
    private String name;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
