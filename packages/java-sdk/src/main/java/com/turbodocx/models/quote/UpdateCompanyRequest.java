package com.turbodocx.models.quote;

/**
 * Request to update a company.
 */
public class UpdateCompanyRequest extends TrackableRequest {
    private String name;
    private String phone;
    private String city;
    private String state;
    private String country;
    private String industryId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; markFieldSet("name"); }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; markFieldSet("phone"); }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; markFieldSet("city"); }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; markFieldSet("state"); }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; markFieldSet("country"); }
    public String getIndustryId() { return industryId; }
    public void setIndustryId(String industryId) { this.industryId = industryId; markFieldSet("industryId"); }
}
