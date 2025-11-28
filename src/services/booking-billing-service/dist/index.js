"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("@kayak/common/src/middleware/errorHandler");
const bookingController_1 = __importDefault(require("./controllers/bookingController"));
const billingController_1 = __importDefault(require("./controllers/billingController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8003;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'booking-billing-service' });
});
app.use('/api/bookings', bookingController_1.default);
app.use('/api/billing', billingController_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`Booking-Billing Service running on port ${PORT}`);
});
