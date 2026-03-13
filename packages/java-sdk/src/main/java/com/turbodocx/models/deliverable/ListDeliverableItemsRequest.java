package com.turbodocx.models.deliverable;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Query parameters for listing deliverable items
 */
public class ListDeliverableItemsRequest {
    private Integer limit;
    private Integer offset;
    private String query;
    private Boolean showTags;
    private List<String> selectedTags;
    private String column0;
    private String order0;

    public ListDeliverableItemsRequest() {}

    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
    public Integer getOffset() { return offset; }
    public void setOffset(Integer offset) { this.offset = offset; }
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public Boolean getShowTags() { return showTags; }
    public void setShowTags(Boolean showTags) { this.showTags = showTags; }
    public List<String> getSelectedTags() { return selectedTags; }
    public void setSelectedTags(List<String> selectedTags) { this.selectedTags = selectedTags; }
    public String getColumn0() { return column0; }
    public void setColumn0(String column0) { this.column0 = column0; }
    public String getOrder0() { return order0; }
    public void setOrder0(String order0) { this.order0 = order0; }

    public String toQueryString() {
        StringBuilder sb = new StringBuilder();
        if (limit != null) appendParam(sb, "limit", limit.toString());
        if (offset != null) appendParam(sb, "offset", offset.toString());
        if (query != null) appendParam(sb, "query", query);
        if (showTags != null) appendParam(sb, "showTags", showTags.toString());
        if (selectedTags != null && !selectedTags.isEmpty()) {
            for (String tag : selectedTags) {
                appendParam(sb, "selectedTags", tag);
            }
        }
        if (column0 != null) appendParam(sb, "column0", column0);
        if (order0 != null) appendParam(sb, "order0", order0);
        return sb.toString();
    }

    private static void appendParam(StringBuilder sb, String key, String value) {
        if (sb.length() > 0) sb.append("&");
        sb.append(URLEncoder.encode(key, StandardCharsets.UTF_8))
          .append("=")
          .append(URLEncoder.encode(value, StandardCharsets.UTF_8));
    }
}
