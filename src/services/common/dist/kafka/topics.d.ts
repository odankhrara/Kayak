export declare const KAFKA_TOPICS: {
    readonly BOOKING_CREATED: "booking_created";
    readonly BOOKING_UPDATED: "booking_updated";
    readonly PAYMENT_SUCCEEDED: "payment_succeeded";
    readonly PAYMENT_FAILED: "payment_failed";
    readonly USER_TRACKING: "user_tracking";
    readonly CLICK_EVENT: "click_event";
    readonly RAW_SUPPLIER_FEEDS: "raw_supplier_feeds";
};
export type KafkaTopic = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS];
//# sourceMappingURL=topics.d.ts.map