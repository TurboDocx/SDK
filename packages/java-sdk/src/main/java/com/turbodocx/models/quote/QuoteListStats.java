package com.turbodocx.models.quote;

import java.util.List;

/**
 * Statistics included in the quote list response.
 */
public class QuoteListStats {
    private Integer total;
    private Integer draft;
    private Integer sent;
    private Integer accepted;
    private Integer declined;
    private Integer voided;
    private List<CurrencyTotal> totalPipeline;
    private Integer activeQuotes;
    private List<CurrencyTotal> monthlyRecurringRevenue;
    private Double winRate;
    private Double avgMargin;
    private Integer quotesThisMonth;

    public Integer getTotal() { return total; }
    public Integer getDraft() { return draft; }
    public Integer getSent() { return sent; }
    public Integer getAccepted() { return accepted; }
    public Integer getDeclined() { return declined; }
    public Integer getVoided() { return voided; }
    public List<CurrencyTotal> getTotalPipeline() { return totalPipeline; }
    public Integer getActiveQuotes() { return activeQuotes; }
    public List<CurrencyTotal> getMonthlyRecurringRevenue() { return monthlyRecurringRevenue; }
    public Double getWinRate() { return winRate; }
    public Double getAvgMargin() { return avgMargin; }
    public Integer getQuotesThisMonth() { return quotesThisMonth; }

    /**
     * Currency + total pair used in pipeline and MRR stats.
     */
    public static class CurrencyTotal {
        private String currency;
        private Double total;

        public String getCurrency() { return currency; }
        public Double getTotal() { return total; }
    }
}
