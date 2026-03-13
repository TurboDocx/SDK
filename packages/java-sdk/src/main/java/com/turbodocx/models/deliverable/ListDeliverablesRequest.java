package com.turbodocx.models.deliverable;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Query parameters for listing deliverables
 */
public class ListDeliverablesRequest {
    private Integer limit;
    private Integer offset;
    private String query;
    private Boolean showTags;
    private String column0;
    private String order0;

    public ListDeliverablesRequest() {}

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public Boolean getShowTags() { return showTags; }
    public void setShowTags(Boolean showTags) { this.showTags = showTags; }
    public String getColumn0() { return column0; }
    public void setColumn0(String column0) { this.column0 = column0; }
    public String getOrder0() { return order0; }
    public void setOrder0(String order0) { this.order0 = order0; }

    public String toQueryString() {
        Map<String, String> params = new LinkedHashMap<>();
        if (limit != null) params.put("limit", limit.toString());
        if (offset != null) params.put("offset", offset.toString());
        if (query != null) params.put("query", query);
        if (showTags != null) params.put("showTags", showTags.toString());
        if (column0 != null) params.put("column0", column0);
        if (order0 != null) params.put("order0", order0);

        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8))
              .append("=")
              .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }
}
