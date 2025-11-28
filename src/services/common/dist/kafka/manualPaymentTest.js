"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kafkaClient_1 = require("./kafkaClient");
const topics_1 = require("./topics");
async function main() {
    const fakePayment = {
        paymentId: 'test-payment-1',
        bookingId: 'test-booking-1',
        userId: 'test-user-1',
        amount: 200.5,
        status: 'completed',
        paidAt: new Date().toISOString(),
    };
    console.log('Sending test payment_succeeded event...');
    await (0, kafkaClient_1.sendKafkaMessage)(topics_1.KAFKA_TOPICS.PAYMENT_SUCCEEDED, fakePayment);
    console.log('Done.');
    process.exit(0);
}
main().catch((err) => {
    console.error('Test payment producer failed:', err);
    process.exit(1);
});
//# sourceMappingURL=manualPaymentTest.js.map