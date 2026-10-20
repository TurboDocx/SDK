package com.turbodocx.models.quote;

import java.util.List;

/**
 * Request to create a company.
 */
public class CreateCompanyRequest {
    private String name;
    private List<CreateCompanyContactInput> contacts;
    private String phone;
    private String city;
    private String state;
    private String country;
    private String industryId;
    /** The company's own email (optional through the API; the TurboDocx app requires it) */
    private String email;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<CreateCompanyContactInput> getContacts() { return contacts; }
    public void setContacts(List<CreateCompanyContactInput> contacts) { this.contacts = contacts; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getIndustryId() { return industryId; }
    public void setIndustryId(String industryId) { this.industryId = industryId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
