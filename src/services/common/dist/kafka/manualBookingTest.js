"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kafkaClient_1 = require("./kafkaClient");
const topics_1 = require("./topics");
async function main() {
    const fakeBooking = {
        bookingId: 'test-booking-1',
        userId: 'test-user-1',
        totalAmount: 123.45,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
    };
    console.log('Sending test booking_created event...');
    await (0, kafkaClient_1.sendKafkaMessage)(topics_1.KAFKA_TOPICS.BOOKING_CREATED, fakeBooking);
    console.log('Done.');
    process.exit(0);
}
main().catch((err) => {
    console.error('Test producer failed:', err);
    process.exit(1);
});
//# sourceMappingURL=manualBookingTest.js.map