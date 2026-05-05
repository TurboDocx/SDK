package com.turbodocx.models.quote;

/**
 * Company domain entity.
 */
public class Company {
    private String id;
    private String orgId;
    private String name;
    private String phone;
    private String city;
    private String state;
    private String country;
    private String industryId;
    private String lastActivityDate;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private Integer contactCount;
    private QuoteType industry;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getCity() { return city; }
    public String getState() { return state; }
    public String getCountry() { return country; }
    public String getIndustryId() { return industryId; }
    public String getLastActivityDate() { return lastActivityDate; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public Integer getContactCount() { return contactCount; }
    public QuoteType getIndustry() { return industry; }
}
