package com.turbodocx.models.deliverable;

import java.util.List;

/**
 * Variable for template substitution
 */
public class DeliverableVariable {
    private String placeholder;
    private String text;
    private String mimeType;
    private Boolean isDisabled;
    private List<DeliverableVariable> subvariables;
    private Object variableStack;
    private String aiPrompt;
    private Boolean allowRichTextInjection;

    public DeliverableVariable() {}

    public DeliverableVariable(String placeholder, String text, String mimeType) {
        this.placeholder = placeholder;
        this.text = text;
        this.mimeType = mimeType;
    }

    public String getPlaceholder() { return placeholder; }
    public void setPlaceholder(String placeholder) { this.placeholder = placeholder; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public Boolean getIsDisabled() { return isDisabled; }
    public void setIsDisabled(Boolean isDisabled) { this.isDisabled = isDisabled; }
    public List<DeliverableVariable> getSubvariables() { return subvariables; }
    public void setSubvariables(List<DeliverableVariable> subvariables) { this.subvariables = subvariables; }
    public Object getVariableStack() { return variableStack; }
    public void setVariableStack(Object variableStack) { this.variableStack = variableStack; }
    public String getAiPrompt() { return aiPrompt; }
    public void setAiPrompt(String aiPrompt) { this.aiPrompt = aiPrompt; }
    public Boolean getAllowRichTextInjection() { return allowRichTextInjection; }
    public void setAllowRichTextInjection(Boolean allowRichTextInjection) { this.allowRichTextInjection = allowRichTextInjection; }
}
