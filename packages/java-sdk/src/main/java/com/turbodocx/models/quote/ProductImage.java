package com.turbodocx.models.quote;

/**
 * Product image entity.
 */
public class ProductImage {
    private String id;
    private String productId;
    private String fileId;
    private String fileName;
    private String fileType;
    private Integer displayOrder;
    private String imageData;

    public String getId() { return id; }
    public String getProductId() { return productId; }
    public String getFileId() { return fileId; }
    public String getFileName() { return fileName; }
    public String getFileType() { return fileType; }
    public Integer getDisplayOrder() { return displayOrder; }
    public String getImageData() { return imageData; }
}
