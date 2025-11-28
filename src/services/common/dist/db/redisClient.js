"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
exports.closeRedisConnection = closeRedisConnection;
const redis_1 = require("redis");
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = (0, redis_1.createClient)({
    url: redisUrl
});
client.on('error', (err) => console.error('Redis Client Error', err));
let isConnected = false;
async function getRedisClient() {
    if (!isConnected) {
        await client.connect();
        isConnected = true;
    }
    return client;
}
async function closeRedisConnection() {
    if (isConnected) {
        await client.quit();
        isConnected = false;
    }
}
exports.default = client;
//# sourceMappingURL=redisClient.js.map