"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("@kayak/common/src/middleware/errorHandler");
const userController_1 = __importDefault(require("./controllers/userController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '8001', 10);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'user-service' });
});
app.use('/api/users', userController_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`User Service running on port ${PORT}`);
});
