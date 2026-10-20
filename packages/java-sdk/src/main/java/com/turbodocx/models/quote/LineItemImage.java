package com.turbodocx.models.quote;

/**
 * An image on a custom line item (a quote line with no catalog product).
 */
public class LineItemImage {
    private String id;
    private String lineItemId;
    private String fileId;
    private Integer displayOrder;
    private String fileName;
    private String fileType;
    /** Base64 data URL: "data:image/png;base64,..." */
    private String imageData;

    public String getId() { return id; }
    public String getLineItemId() { return lineItemId; }
    public String getFileId() { return fileId; }
    public Integer getDisplayOrder() { return displayOrder; }
    public String getFileName() { return fileName; }
    public String getFileType() { return fileType; }
    public String getImageData() { return imageData; }
}
