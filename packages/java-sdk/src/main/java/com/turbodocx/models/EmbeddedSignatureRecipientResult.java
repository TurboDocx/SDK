package com.turbodocx.models;

/**
 * One resolved signer in a {@link CreateEmbeddedSignatureResponse}.
 */
public class EmbeddedSignatureRecipientResult {
    private final String recipientId;
    private final String name;
    private final String email;
    /**
     * The embeddable signing URL — present only when it is this recipient's turn
     * ({@code status == "ready"}). Null for a recipient who cannot sign yet ({@code "pending"}) or
     * has already signed ({@code "completed"}); mint it later with
     * {@code TurboSign.createSigningUrl}.
     */
    private final String embedUrl;
    /** One of {@code "ready"}, {@code "pending"}, {@code "completed"}. */
    private final String status;
    /**
     * One of {@code "otp"}, {@code "external_idv"}, {@code "override"}, or null. For a
     * {@code "ready"} signer, the mode the backend resolved for the URL; for {@code "pending"} /
     * {@code "completed"} no URL was minted, so it is the mode you requested via {@code auth} (null
     * when you set none, even if the org's default channel applies). {@code createSigningUrl}
     * reports the effective mode.
     */
    private final String identityVerificationMode;

    public EmbeddedSignatureRecipientResult(String recipientId, String name, String email, String embedUrl,
                                            String status, String identityVerificationMode) {
        this.recipientId = recipientId;
        this.name = name;
        this.email = email;
        this.embedUrl = embedUrl;
        this.status = status;
        this.identityVerificationMode = identityVerificationMode;
    }

    public String getRecipientId() {
        return recipientId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getEmbedUrl() {
        return embedUrl;
    }

    public String getStatus() {
        return status;
    }

    public String getIdentityVerificationMode() {
        return identityVerificationMode;
    }
}
