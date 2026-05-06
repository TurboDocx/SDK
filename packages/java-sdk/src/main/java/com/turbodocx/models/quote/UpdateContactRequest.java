package com.turbodocx.models.quote;

/**
 * Request to update a contact.
 */
public class UpdateContactRequest extends TrackableRequest {
    private String name;
    private String email;
    private String phone;
    private String title;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; markFieldSet("name"); }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; markFieldSet("email"); }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; markFieldSet("phone"); }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; markFieldSet("title"); }
}
