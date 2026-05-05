package com.turbodocx.models.quote;

/**
 * Input for contacts when creating a company.
 */
public class CreateCompanyContactInput {
    private String name;
    private String email;
    private String phone;
    private String title;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
