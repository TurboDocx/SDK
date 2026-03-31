package com.turbodocx.models.deliverable;

public class CreateDeliverableResponse {
    private Results results;

    public Results getResults() { return results; }

    public static class Results {
        private DeliverableRecord deliverable;

        public DeliverableRecord getDeliverable() { return deliverable; }
    }
}
