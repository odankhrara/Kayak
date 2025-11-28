"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("@kayak/common/src/middleware/errorHandler");
const flightController_1 = __importDefault(require("./controllers/flightController"));
const hotelController_1 = __importDefault(require("./controllers/hotelController"));
const carController_1 = __importDefault(require("./controllers/carController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8002;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'listing-service' });
});
app.use('/api/listings/flights', flightController_1.default);
app.use('/api/listings/hotels', hotelController_1.default);
app.use('/api/listings/cars', carController_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Listing Service running on port ${PORT}`);
});
