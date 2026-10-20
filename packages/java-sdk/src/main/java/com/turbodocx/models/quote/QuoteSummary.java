package com.turbodocx.models.quote;

import java.util.List;

/**
 * The quote list's summary cards, in one currency. Search, company, creator and Valid until
 * filters apply; the status filter and the currency list don't.
 */
public class QuoteSummary {
    private String currency;
    /** Draft and sent quotes that aren't expired */
    private Amount openPipeline;
    /** Every accepted and every declined quote */
    private Completed completed;
    /** Quotes created since the 1st of this month (UTC) */
    private Count createdThisMonth;
    /** Sent quotes that aren't expired */
    private Count waitingToSign;
    /** Quotes accepted since the 1st of this month (UTC) */
    private Count wonThisMonth;
    /** Every currency the org's quotes are in, A to Z */
    private List<String> currencies;
    private WinRate winRate;
    /** Monthly subtotal of accepted quotes */
    private Amount monthlyRecurring;

    public String getCurrency() { return currency; }
    public Amount getOpenPipeline() { return openPipeline; }
    public Completed getCompleted() { return completed; }
    public Count getCreatedThisMonth() { return createdThisMonth; }
    public Count getWaitingToSign() { return waitingToSign; }
    public Count getWonThisMonth() { return wonThisMonth; }
    public List<String> getCurrencies() { return currencies; }
    public WinRate getWinRate() { return winRate; }
    public Amount getMonthlyRecurring() { return monthlyRecurring; }

    /** A total with how many quotes make it up */
    public static class Amount {
        private double total;
        private int count;

        public double getTotal() { return total; }
        public int getCount() { return count; }
    }

    /** A count of quotes */
    public static class Count {
        private int count;

        public int getCount() { return count; }
    }

    public static class Completed {
        private int accepted;
        private int declined;

        public int getAccepted() { return accepted; }
        public int getDeclined() { return declined; }
    }

    /** accepted / (accepted + declined) over the last windowDays; percent is null when none were decided */
    public static class WinRate {
        private Double percent;
        private int accepted;
        private int declined;
        private int windowDays;

        public Double getPercent() { return percent; }
        public int getAccepted() { return accepted; }
        public int getDeclined() { return declined; }
        public int getWindowDays() { return windowDays; }
    }
}
