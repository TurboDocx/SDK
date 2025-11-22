namespace TurboDocx;

/// <summary>
/// Common interface for signature requests
/// </summary>
public interface ISignatureRequest
{
    string? DocumentName { get; }
    string? DocumentDescription { get; }
    string? SenderName { get; }
    string? SenderEmail { get; }
    string[]? CcEmails { get; }
}

/// <summary>
/// Recipient for signature
/// </summary>
public class Recipient
{
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public int Order { get; set; }
}

/// <summary>
/// Signature field
/// </summary>
public class Field
{
    public string Type { get; set; } = "signature";
    public int? Page { get; set; }
    public int? X { get; set; }
    public int? Y { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public int RecipientOrder { get; set; }
}

/// <summary>
/// Request for PrepareForReview
/// </summary>
public class PrepareForReviewRequest : ISignatureRequest
{
    /// <summary>File content (use this OR FileLink/DeliverableId/TemplateId)</summary>
    public byte[]? File { get; set; }

    /// <summary>Original filename</summary>
    public string? FileName { get; set; }

    /// <summary>URL to document file</summary>
    public string? FileLink { get; set; }

    /// <summary>TurboDocx deliverable ID</summary>
    public string? DeliverableId { get; set; }

    /// <summary>TurboDocx template ID</summary>
    public string? TemplateId { get; set; }

    /// <summary>Recipients who will sign</summary>
    public Recipient[] Recipients { get; set; } = Array.Empty<Recipient>();

    /// <summary>Signature fields configuration</summary>
    public Field[] Fields { get; set; } = Array.Empty<Field>();

    /// <summary>Document name</summary>
    public string? DocumentName { get; set; }

    /// <summary>Document description</summary>
    public string? DocumentDescription { get; set; }

    /// <summary>Sender name</summary>
    public string? SenderName { get; set; }

    /// <summary>Sender email</summary>
    public string? SenderEmail { get; set; }

    /// <summary>CC email addresses</summary>
    public string[]? CcEmails { get; set; }
}

/// <summary>
/// Response from PrepareForReview
/// </summary>
public class PrepareForReviewResponse
{
    public string DocumentId { get; set; } = "";
    public string Status { get; set; } = "";
    public string? PreviewUrl { get; set; }
    public RecipientStatusResponse[]? Recipients { get; set; }
}

/// <summary>
/// Request for PrepareForSigningSingle
/// </summary>
public class PrepareForSigningRequest : ISignatureRequest
{
    /// <summary>File content (use this OR FileLink/DeliverableId/TemplateId)</summary>
    public byte[]? File { get; set; }

    /// <summary>Original filename</summary>
    public string? FileName { get; set; }

    /// <summary>URL to document file</summary>
    public string? FileLink { get; set; }

    /// <summary>TurboDocx deliverable ID</summary>
    public string? DeliverableId { get; set; }

    /// <summary>TurboDocx template ID</summary>
    public string? TemplateId { get; set; }

    /// <summary>Recipients who will sign</summary>
    public Recipient[] Recipients { get; set; } = Array.Empty<Recipient>();

    /// <summary>Signature fields configuration</summary>
    public Field[] Fields { get; set; } = Array.Empty<Field>();

    /// <summary>Document name</summary>
    public string? DocumentName { get; set; }

    /// <summary>Document description</summary>
    public string? DocumentDescription { get; set; }

    /// <summary>Sender name</summary>
    public string? SenderName { get; set; }

    /// <summary>Sender email</summary>
    public string? SenderEmail { get; set; }

    /// <summary>CC email addresses</summary>
    public string[]? CcEmails { get; set; }
}

/// <summary>
/// Response from PrepareForSigningSingle
/// </summary>
public class PrepareForSigningResponse
{
    public string DocumentId { get; set; } = "";
    public string Status { get; set; } = "";
    public RecipientSignResponse[] Recipients { get; set; } = Array.Empty<RecipientSignResponse>();
}

/// <summary>
/// Recipient status in response
/// </summary>
public class RecipientStatusResponse
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Status { get; set; } = "";
}

/// <summary>
/// Recipient with sign URL
/// </summary>
public class RecipientSignResponse
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Status { get; set; } = "";
    public string? SignUrl { get; set; }
}

/// <summary>
/// Document status response
/// </summary>
public class DocumentStatusResponse
{
    public string DocumentId { get; set; } = "";
    public string Status { get; set; } = "";
    public string Name { get; set; } = "";
    public RecipientStatusResponse[] Recipients { get; set; } = Array.Empty<RecipientStatusResponse>();
    public string CreatedAt { get; set; } = "";
    public string UpdatedAt { get; set; } = "";
    public string? CompletedAt { get; set; }
}

/// <summary>
/// Void document response
/// </summary>
public class VoidDocumentResponse
{
    public string DocumentId { get; set; } = "";
    public string Status { get; set; } = "";
    public string VoidedAt { get; set; } = "";
}

/// <summary>
/// Resend email response
/// </summary>
public class ResendEmailResponse
{
    public string DocumentId { get; set; } = "";
    public string Message { get; set; } = "";
    public string ResentAt { get; set; } = "";
}
