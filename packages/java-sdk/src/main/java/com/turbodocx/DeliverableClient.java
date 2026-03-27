package com.turbodocx;

import com.google.gson.Gson;
import com.turbodocx.models.deliverable.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Deliverable client for document generation and management operations
 */
public class DeliverableClient {
    private final HttpClient httpClient;
    private final Gson gson;

    public DeliverableClient(HttpClient httpClient) {
        this.httpClient = httpClient;
        this.gson = new Gson();
    }

    // ============================================
    // DELIVERABLE CRUD
    // ============================================

    /**
     * List deliverables with pagination, search, and filtering
     */
    public DeliverableListResponse listDeliverables(ListDeliverablesRequest request) throws IOException {
        String path = "/v1/deliverable";
        if (request != null) {
            String query = request.toQueryString();
            if (!query.isEmpty()) {
                path += "?" + query;
            }
        }
        return httpClient.get(path, DeliverableListResponse.class);
    }

    /**
     * List deliverables with default options
     */
    public DeliverableListResponse listDeliverables() throws IOException {
        return listDeliverables(null);
    }

    /**
     * Generate a new deliverable document from a template with variable substitution
     */
    public CreateDeliverableResponse generateDeliverable(CreateDeliverableRequest request) throws IOException {
        return httpClient.post("/v1/deliverable", request, CreateDeliverableResponse.class);
    }

    /**
     * Get full details of a single deliverable
     */
    public DeliverableRecord getDeliverableDetails(String id, boolean showTags) throws IOException {
        String path = "/v1/deliverable/" + id;
        if (showTags) {
            path += "?showTags=true";
        }
        GetDeliverableResponse response = httpClient.get(path, GetDeliverableResponse.class);
        return response.getResults();
    }

    /**
     * Get full details of a single deliverable
     */
    public DeliverableRecord getDeliverableDetails(String id) throws IOException {
        return getDeliverableDetails(id, false);
    }

    /**
     * Update a deliverable's name, description, or tags
     */
    public UpdateDeliverableResponse updateDeliverableInfo(String id, UpdateDeliverableRequest request) throws IOException {
        return httpClient.patch("/v1/deliverable/" + id, request, UpdateDeliverableResponse.class);
    }

    /**
     * Soft-delete a deliverable
     */
    public DeleteDeliverableResponse deleteDeliverable(String id) throws IOException {
        return httpClient.delete("/v1/deliverable/" + id, DeleteDeliverableResponse.class);
    }

    // ============================================
    // FILE DOWNLOADS
    // ============================================

    /**
     * Download the original source file (DOCX or PPTX) of a deliverable
     */
    public byte[] downloadSourceFile(String deliverableId) throws IOException {
        return httpClient.getRaw("/v1/deliverable/file/" + deliverableId);
    }

    /**
     * Download the PDF version of a deliverable
     */
    public byte[] downloadPDF(String deliverableId) throws IOException {
        return httpClient.getRaw("/v1/deliverable/file/pdf/" + deliverableId);
    }

}
