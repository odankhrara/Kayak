"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.AppError = exports.errorHandler = exports.requireAdmin = exports.requireAuth = exports.KAFKA_TOPICS = exports.sendKafkaMessage = exports.getConsumer = exports.getProducer = exports.closeRedisConnection = exports.getRedisClient = exports.closeMongoConnection = exports.getMongoDb = exports.getMongoClient = exports.mysqlPool = void 0;
// Database connections
var mysqlPool_1 = require("./db/mysqlPool");
Object.defineProperty(exports, "mysqlPool", { enumerable: true, get: function () { return __importDefault(mysqlPool_1).default; } });
var mongoClient_1 = require("./db/mongoClient");
Object.defineProperty(exports, "getMongoClient", { enumerable: true, get: function () { return mongoClient_1.getMongoClient; } });
Object.defineProperty(exports, "getMongoDb", { enumerable: true, get: function () { return mongoClient_1.getMongoDb; } });
Object.defineProperty(exports, "closeMongoConnection", { enumerable: true, get: function () { return mongoClient_1.closeMongoConnection; } });
var redisClient_1 = require("./db/redisClient");
Object.defineProperty(exports, "getRedisClient", { enumerable: true, get: function () { return redisClient_1.getRedisClient; } });
Object.defineProperty(exports, "closeRedisConnection", { enumerable: true, get: function () { return redisClient_1.closeRedisConnection; } });
// Kafka
var kafkaClient_1 = require("./kafka/kafkaClient");
Object.defineProperty(exports, "getProducer", { enumerable: true, get: function () { return kafkaClient_1.getProducer; } });
Object.defineProperty(exports, "getConsumer", { enumerable: true, get: function () { return kafkaClient_1.getConsumer; } });
Object.defineProperty(exports, "sendKafkaMessage", { enumerable: true, get: function () { return kafkaClient_1.sendKafkaMessage; } });
var topics_1 = require("./kafka/topics");
Object.defineProperty(exports, "KAFKA_TOPICS", { enumerable: true, get: function () { return topics_1.KAFKA_TOPICS; } });
// Middleware
var auth_1 = require("./middleware/auth");
Object.defineProperty(exports, "requireAuth", { enumerable: true, get: function () { return auth_1.requireAuth; } });
Object.defineProperty(exports, "requireAdmin", { enumerable: true, get: function () { return auth_1.requireAdmin; } });
var errorHandler_1 = require("./middleware/errorHandler");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return errorHandler_1.errorHandler; } });
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return errorHandler_1.AppError; } });
var validation_1 = require("./middleware/validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validation_1.validate; } });
// Utils
__exportStar(require("./utils"), exports);
//# sourceMappingURL=index.js.map