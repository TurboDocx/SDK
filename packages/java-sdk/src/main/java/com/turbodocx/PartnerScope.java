package com.turbodocx;

/**
 * Permission scope constants for partner API keys.
 *
 * <p>Use these constants when creating or updating partner API keys
 * to define their access permissions.</p>
 *
 * <pre>{@code
 * import static com.turbodocx.PartnerScope.*;
 *
 * JsonObject key = client.turboPartner().createPartnerApiKey(
 *     "Integration Key",
 *     Arrays.asList(ORG_CREATE, ORG_READ, AUDIT_READ),
 *     null
 * );
 * }</pre>
 */
public final class PartnerScope {

    private PartnerScope() {}

    // Organization CRUD
    public static final String ORG_CREATE = "org:create";
    public static final String ORG_READ = "org:read";
    public static final String ORG_UPDATE = "org:update";
    public static final String ORG_DELETE = "org:delete";

    // Entitlements
    public static final String ENTITLEMENTS_UPDATE = "entitlements:update";

    // Organization Users
    public static final String ORG_USERS_CREATE = "org-users:create";
    public static final String ORG_USERS_READ = "org-users:read";
    public static final String ORG_USERS_UPDATE = "org-users:update";
    public static final String ORG_USERS_DELETE = "org-users:delete";

    // Partner Users
    public static final String PARTNER_USERS_CREATE = "partner-users:create";
    public static final String PARTNER_USERS_READ = "partner-users:read";
    public static final String PARTNER_USERS_UPDATE = "partner-users:update";
    public static final String PARTNER_USERS_DELETE = "partner-users:delete";

    // Organization API Keys
    public static final String ORG_APIKEYS_CREATE = "org-apikeys:create";
    public static final String ORG_APIKEYS_READ = "org-apikeys:read";
    public static final String ORG_APIKEYS_UPDATE = "org-apikeys:update";
    public static final String ORG_APIKEYS_DELETE = "org-apikeys:delete";

    // Partner API Keys
    public static final String PARTNER_APIKEYS_CREATE = "partner-apikeys:create";
    public static final String PARTNER_APIKEYS_READ = "partner-apikeys:read";
    public static final String PARTNER_APIKEYS_UPDATE = "partner-apikeys:update";
    public static final String PARTNER_APIKEYS_DELETE = "partner-apikeys:delete";

    // Audit
    public static final String AUDIT_READ = "audit:read";
}
