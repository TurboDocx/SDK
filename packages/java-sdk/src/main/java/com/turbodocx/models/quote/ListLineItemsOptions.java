package com.turbodocx.models.quote;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Options for listing line items.
 */
public class ListLineItemsOptions {
    private Integer limit;
    private Integer offset;
    private String lineItemType;
    private String billingFrequency;
    private String parentLineItemId;

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getLineItemType() { return lineItemType; }
    public void setLineItemType(String lineItemType) { this.lineItemType = lineItemType; }
    public String getBillingFrequency() { return billingFrequency; }
    public void setBillingFrequency(String billingFrequency) { this.billingFrequency = billingFrequency; }
    public String getParentLineItemId() { return parentLineItemId; }
    public void setParentLineItemId(String parentLineItemId) { this.parentLineItemId = parentLineItemId; }

    public Map<String, Object> toQueryParams() {
        Map<String, Object> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (lineItemType != null) params.put("lineItemType", lineItemType);
        if (billingFrequency != null) params.put("billingFrequency", billingFrequency);
        if (parentLineItemId != null) params.put("parentLineItemId", parentLineItemId);
        return params.isEmpty() ? null : params;
    }
}
