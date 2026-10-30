package com.turbodocx.models.quote;

import java.util.List;

/**
 * The quote list's summary cards. The amounts (openPipeline total, monthlyRecurring) are in
 * {@code currency}; every count and the win rate cover quotes in every currency. Search,
 * company, creator, currency and Valid until filters apply; the status filter doesn't.
 */
public class QuoteSummary {
    private String currency;
    /** Draft and sent quotes that aren't expired: total in currency, count in every currency */
    private Amount openPipeline;
    /** Every accepted and every declined quote, in every currency */
    private Completed completed;
    /** Quotes created since the 1st of this month (UTC), in every currency */
    private Count createdThisMonth;
    /** Sent quotes that aren't expired, in every currency */
    private Count waitingToSign;
    /** Quotes accepted since the 1st of this month (UTC), in every currency */
    private Count wonThisMonth;
    /** Every currency the org's quotes are in, A to Z */
    private List<String> currencies;
    private WinRate winRate;
    /** Monthly subtotal of accepted quotes in currency */
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

    /** accepted / (accepted + declined) over the last windowDays, in every currency; percent is null when none were decided */
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
