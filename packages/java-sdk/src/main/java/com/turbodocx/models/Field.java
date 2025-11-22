package com.turbodocx.models;

import com.google.gson.annotations.SerializedName;

/**
 * Represents a signature field
 */
public class Field {
    @SerializedName("type")
    private final String type;

    @SerializedName("page")
    private final int page;

    @SerializedName("x")
    private final int x;

    @SerializedName("y")
    private final int y;

    @SerializedName("width")
    private final int width;

    @SerializedName("height")
    private final int height;

    @SerializedName("recipientOrder")
    private final int recipientOrder;

    public Field(String type, int page, int x, int y, int width, int height, int recipientOrder) {
        this.type = type;
        this.page = page;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.recipientOrder = recipientOrder;
    }

    public String getType() {
        return type;
    }

    public int getPage() {
        return page;
    }

    public int getX() {
        return x;
    }

    public int getY() {
        return y;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public int getRecipientOrder() {
        return recipientOrder;
    }
}
