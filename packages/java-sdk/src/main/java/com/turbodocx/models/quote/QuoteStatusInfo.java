package com.turbodocx.models.quote;

/**
 * Status information for a quote, indicating available transitions.
 */
public class QuoteStatusInfo {
    private String currentStatus;
    private Boolean canSend;
    private Boolean canAccept;
    private Boolean canDecline;
    private Boolean canVoid;
    private Boolean isTerminal;

    public String getCurrentStatus() { return currentStatus; }
    public Boolean getCanSend() { return canSend; }
    public Boolean getCanAccept() { return canAccept; }
    public Boolean getCanDecline() { return canDecline; }
    public Boolean getCanVoid() { return canVoid; }
    public Boolean getIsTerminal() { return isTerminal; }
}
