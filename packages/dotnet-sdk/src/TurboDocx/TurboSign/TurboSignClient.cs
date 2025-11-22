using System.Text.Json;

namespace TurboDocx;

/// <summary>
/// TurboSign client for digital signature operations.
/// Provides 100% parity with n8n-nodes-turbodocx.
/// </summary>
public class TurboSignClient
{
    private readonly HttpClient _http;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    internal TurboSignClient(HttpClient http)
    {
        _http = http;
    }

    /// <summary>
    /// Prepares a document for review without sending emails.
    /// Use this to preview field placement before sending.
    /// </summary>
    public async Task<PrepareForReviewResponse> PrepareForReviewAsync(
        PrepareForReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var formData = new Dictionary<string, string>
        {
            ["recipients"] = JsonSerializer.Serialize(request.Recipients, JsonOptions),
            ["fields"] = JsonSerializer.Serialize(request.Fields, JsonOptions)
        };

        AddOptionalFields(formData, request);

        ApiResponse<PrepareForReviewResponse> response;

        if (request.File != null)
        {
            response = await _http.UploadFileAsync<ApiResponse<PrepareForReviewResponse>>(
                "/turbosign/single/prepare-for-review",
                request.File,
                request.FileName ?? "document.pdf",
                formData,
                cancellationToken);
        }
        else
        {
            if (!string.IsNullOrEmpty(request.FileLink))
                formData["fileLink"] = request.FileLink;
            if (!string.IsNullOrEmpty(request.DeliverableId))
                formData["deliverableId"] = request.DeliverableId;
            if (!string.IsNullOrEmpty(request.TemplateId))
                formData["templateId"] = request.TemplateId;

            response = await _http.PostAsync<ApiResponse<PrepareForReviewResponse>>(
                "/turbosign/single/prepare-for-review",
                formData,
                cancellationToken);
        }

        return response.Data;
    }

    /// <summary>
    /// Prepares a document for signing and sends emails in a single call.
    /// This is the n8n-equivalent "Prepare for Signing" operation.
    /// </summary>
    public async Task<PrepareForSigningResponse> PrepareForSigningSingleAsync(
        PrepareForSigningRequest request,
        CancellationToken cancellationToken = default)
    {
        var formData = new Dictionary<string, string>
        {
            ["recipients"] = JsonSerializer.Serialize(request.Recipients, JsonOptions),
            ["fields"] = JsonSerializer.Serialize(request.Fields, JsonOptions)
        };

        AddOptionalFields(formData, request);

        ApiResponse<PrepareForSigningResponse> response;

        if (request.File != null)
        {
            response = await _http.UploadFileAsync<ApiResponse<PrepareForSigningResponse>>(
                "/turbosign/single/prepare-for-signing",
                request.File,
                request.FileName ?? "document.pdf",
                formData,
                cancellationToken);
        }
        else
        {
            if (!string.IsNullOrEmpty(request.FileLink))
                formData["fileLink"] = request.FileLink;
            if (!string.IsNullOrEmpty(request.DeliverableId))
                formData["deliverableId"] = request.DeliverableId;
            if (!string.IsNullOrEmpty(request.TemplateId))
                formData["templateId"] = request.TemplateId;

            response = await _http.PostAsync<ApiResponse<PrepareForSigningResponse>>(
                "/turbosign/single/prepare-for-signing",
                formData,
                cancellationToken);
        }

        return response.Data;
    }

    /// <summary>
    /// Gets the status of a document
    /// </summary>
    public async Task<DocumentStatusResponse> GetStatusAsync(
        string documentId,
        CancellationToken cancellationToken = default)
    {
        var response = await _http.GetAsync<ApiResponse<DocumentStatusResponse>>(
            $"/turbosign/documents/{documentId}/status",
            cancellationToken);
        return response.Data;
    }

    /// <summary>
    /// Downloads the signed document as bytes
    /// </summary>
    public async Task<byte[]> DownloadAsync(
        string documentId,
        CancellationToken cancellationToken = default)
    {
        return await _http.GetRawAsync(
            $"/turbosign/documents/{documentId}/download",
            cancellationToken);
    }

    /// <summary>
    /// Voids a document (cancels signature request)
    /// </summary>
    public async Task<VoidDocumentResponse> VoidDocumentAsync(
        string documentId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var response = await _http.PostAsync<ApiResponse<VoidDocumentResponse>>(
            $"/turbosign/documents/{documentId}/void",
            new { reason },
            cancellationToken);
        return response.Data;
    }

    /// <summary>
    /// Resends signature request email to recipients
    /// </summary>
    public async Task<ResendEmailResponse> ResendEmailAsync(
        string documentId,
        string[] recipientIds,
        CancellationToken cancellationToken = default)
    {
        var response = await _http.PostAsync<ApiResponse<ResendEmailResponse>>(
            $"/turbosign/documents/{documentId}/resend-email",
            new { recipientIds },
            cancellationToken);
        return response.Data;
    }

    private static void AddOptionalFields(Dictionary<string, string> formData, ISignatureRequest request)
    {
        if (!string.IsNullOrEmpty(request.DocumentName))
            formData["documentName"] = request.DocumentName;
        if (!string.IsNullOrEmpty(request.DocumentDescription))
            formData["documentDescription"] = request.DocumentDescription;
        if (!string.IsNullOrEmpty(request.SenderName))
            formData["senderName"] = request.SenderName;
        if (!string.IsNullOrEmpty(request.SenderEmail))
            formData["senderEmail"] = request.SenderEmail;
        if (request.CcEmails != null && request.CcEmails.Length > 0)
            formData["ccEmails"] = string.Join(",", request.CcEmails);
    }

    private class ApiResponse<T>
    {
        public T Data { get; set; } = default!;
    }
}
