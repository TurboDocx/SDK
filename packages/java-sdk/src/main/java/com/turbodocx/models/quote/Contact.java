package com.turbodocx.models.quote;

/**
 * Contact domain entity.
 */
public class Contact {
    private String id;
    private String orgId;
    private String companyId;
    private String name;
    private String email;
    private String phone;
    private String title;
    private Boolean isActive;
    private String createdBy;
    private String createdOn;
    private String updatedOn;
    private Company company;

    public String getId() { return id; }
    public String getOrgId() { return orgId; }
    public String getCompanyId() { return companyId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getTitle() { return title; }
    public Boolean getIsActive() { return isActive; }
    public String getCreatedBy() { return createdBy; }
    public String getCreatedOn() { return createdOn; }
    public String getUpdatedOn() { return updatedOn; }
    public Company getCompany() { return company; }
}
